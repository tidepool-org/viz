# Basal Calculations

This document details the calculations used for basal insulin data, including dose calculations, duration tracking, and automated delivery statistics.

---

## Total Basal Insulin

### Segment Dose Calculation

Each basal segment's insulin delivery is calculated from rate and duration:

$$
I_{segment} = rate \times \frac{duration}{3600000}
$$

Where:
- $I_{segment}$ = insulin delivered (units)
- $rate$ = basal rate (units per hour)
- $duration$ = segment duration (milliseconds)
- $3600000$ = milliseconds per hour

### Implementation

```javascript
// src/utils/basal.js:173-176
export function getSegmentDose(duration, rate) {
  const hours = duration / ONE_HR;
  return parseFloat(precisionRound(hours * rate, 3));
}
```

### Total from Date Range

To calculate total basal delivered within a date range:

$$
I_{total} = \sum_{i=1}^{n} I_{segment_i}
$$

Where each segment's duration is trimmed to the query range.

```javascript
// src/utils/basal.js:210-218
export function getTotalBasalFromEndpoints(data, endpoints) {
  let dose = 0;

  _.each(data, datum => {
    dose += getSegmentDose(getBasalDurationWithinRange(datum, endpoints), datum.rate);
  });

  return formatInsulin(dose);
}
```

---

## Duration Within Range

Basal segments may start before or extend beyond the query range. The duration is trimmed appropriately.

### Logic

```javascript
// src/utils/basal.js:184-202
export function getBasalDurationWithinRange(datum, endpoints) {
  const rangeStart = new Date(endpoints[0]).valueOf();
  const rangeEnd = new Date(endpoints[1]).valueOf();
  const datumStart = new Date(datum.normalTime).valueOf();
  const datumEnd = new Date(datum.normalEnd).valueOf();

  const datumStartIsWithinRange = rangeStart <= datumStart && datumStart < rangeEnd;
  const datumEndIsWithinRange = rangeStart < datumEnd && datumEnd <= rangeEnd;
  const datumEncompassesRange = rangeStart >= datumStart && datumEnd >= rangeEnd;

  const trimmedStart = _.max([rangeStart, datumStart]);
  const trimmedEnd = _.min([rangeEnd, datumEnd]);

  if (datumStartIsWithinRange || datumEndIsWithinRange || datumEncompassesRange) {
    return trimmedEnd - trimmedStart;
  }

  return 0;
}
```

### Scenarios

| Scenario | Handling |
|----------|----------|
| Segment fully within range | Return full duration |
| Segment starts before range | Trim start to range start |
| Segment ends after range | Trim end to range end |
| Segment encompasses range | Return range duration |
| Segment outside range | Return 0 |

---

## Time in Auto

Time in Auto measures how long the user spent in automated (closed-loop) vs manual delivery modes.

### Formula

$$
TIA\% = \frac{T_{automated}}{T_{automated} + T_{manual}} \times 100
$$

Where:
- $TIA\%$ = Time in Auto percentage
- $T_{automated}$ = duration in automated mode (ms)
- $T_{manual}$ = duration in manual/scheduled mode (ms)

### Path Group Classification

Basals are classified as "automated" or "manual" based on delivery type:

```javascript
// src/utils/basal.js:59-67
export function getBasalPathGroupType(datum = {}) {
  const deliveryType = _.get(datum, 'subType', datum.deliveryType);
  const suppressedDeliveryType = _.get(
    datum.suppressed,
    'subType',
    _.get(datum.suppressed, 'deliveryType')
  );
  return _.includes([deliveryType, suppressedDeliveryType], 'automated') ? 'automated' : 'manual';
}
```

**Key rule**: If either the basal OR its suppressed basal is `automated`, classify as automated.

### Duration Calculation

```javascript
// src/utils/basal.js:226-237
export function getBasalGroupDurationsFromEndpoints(data, endpoints) {
  const durations = {
    automated: 0,
    manual: 0,
  };

  _.each(data, datum => {
    durations[getBasalPathGroupType(datum)] += getBasalDurationWithinRange(datum, endpoints);
  });

  return durations;
}
```

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `automated` | number | Milliseconds in automated mode |
| `manual` | number | Milliseconds in manual mode |

---

## Basal Sequences

For rendering, consecutive basals of the same type are grouped into sequences.

### Grouping Rules

A new sequence starts when:
1. **Type changes**: `subType` differs from previous
2. **Discontinuity**: `discontinuousEnd` flag on previous segment
3. **Zero rate**: Current segment has `rate === 0`

```javascript
// src/utils/basal.js:30-52
export function getBasalSequences(basals) {
  const basalSequences = [];
  let currentBasal = basals[0];
  let seq = [basals[0]];

  let idx = 1;
  while (idx <= basals.length - 1) {
    const nextBasal = basals[idx];
    const basalTypeChange = nextBasal.subType !== currentBasal.subType;

    if (basalTypeChange || currentBasal.discontinuousEnd || nextBasal.rate === 0) {
      basalSequences.push(seq);
      seq = [];
    }

    seq.push(nextBasal);
    currentBasal = nextBasal;
    ++idx;
  }
  basalSequences.push(seq);

  return basalSequences;
}
```

---

## Basal Path Groups

For coloring automated vs manual regions, basals are grouped by path type.

```javascript
// src/utils/basal.js:74-87
export function getBasalPathGroups(basals) {
  const basalPathGroups = [];
  let currentPathType;
  _.each(basals, datum => {
    const pathType = getBasalPathGroupType(datum);
    if (pathType !== currentPathType) {
      currentPathType = pathType;
      basalPathGroups.push([]);
    }
    _.last(basalPathGroups).push(datum);
  });

  return basalPathGroups;
}
```

### Example

Given basals: `[scheduled, scheduled, automated, automated, scheduled]`

Result: `[[scheduled, scheduled], [automated, automated], [scheduled]]`

---

## Automated Basal Events

Tracking transitions into/out of automated mode.

### Counting Automated Stops

```javascript
// src/utils/basal.js:239-265
export const countAutomatedBasalEvents = (data) => {
  const basalPathGroups = getBasalPathGroups(returnData.data);
  basalPathGroups.shift();  // Skip first group

  const events = { automatedStop: 0 };

  _.reduce(basalPathGroups, (acc, group) => {
    const subType = _.get(group[0], 'subType', group[0].deliveryType);
    const event = subType === 'automated' ? 'automatedStart' : 'automatedStop';
    if (event === 'automatedStop') {
      acc[event]++;
    }
    return acc;
  }, events);

  return returnData;
};
```

This counts exits from automated mode (transitions from automated → manual).

---

## Distinct Suspend Counting

Multiple consecutive suspend records should count as a single suspend event.

### Formula

$$
N_{distinct} = N_{total} - N_{contiguous}
$$

Where contiguous suspends have `previous.normalEnd === current.normalTime`.

### Implementation

```javascript
// src/utils/basal.js:267-293
export const countDistinctSuspends = (data) => {
  const suspends = _.filter(returnData.data, d => d.deliveryType === 'suspend');

  const result = { prev: {}, distinct: 0, skipped: 0 };

  _.reduce(suspends, (acc, datum) => {
    if (_.get(acc.prev, 'normalEnd') === datum.normalTime) {
      acc.skipped++;  // Contiguous - don't count as new
    } else {
      acc.distinct++;  // Gap - count as new suspend
    }
    acc.prev = datum;
    return acc;
  }, result);

  return returnData;
};
```

---

## Statistics Integration

### StatUtil Methods

| Method | Description |
|--------|-------------|
| `getTimeInAutoData()` | Returns automated/manual duration breakdown |
| `getInsulinData()` | Returns basal component of total daily insulin |

### Basal in Total Insulin

```javascript
// From StatUtil.getInsulinData()
{
  basal: 24.5,    // Total basal insulin (units)
  bolus: 18.2,    // Total bolus insulin (units)
  insulin: 0,     // Manual injection insulin (units)
}
```

### Daily Average

When viewing multiple days, basal totals are averaged:

$$
I_{dailyAvg} = \frac{\sum_{d=1}^{n} I_{basal_d}}{n_{daysWithData}}
$$

---

## Key Source Files

| Purpose | File |
|---------|------|
| Basal utilities | `src/utils/basal.js` |
| Statistics | `src/utils/StatUtil.js` |
| Test fixtures | `data/basal/fixtures.js` |
| Tests | `test/utils/basal.test.js` |

---

## See Also

- [Basal Overview](./index.md)
- [Basal Rendering](./rendering.md)
- [Total Insulin Statistics](../insulin-totals/index.md) (planned)
