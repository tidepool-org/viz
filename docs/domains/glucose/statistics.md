# Glucose Statistics

This document details the statistical calculations for blood glucose data, including mathematical formulas and implementation specifics.

> **Prerequisites**: Familiarity with [Glucose Domain](./index.md) concepts and the [Diabetes Primer](../../concepts/diabetes-primer.md).

---

## Overview

`StatUtil` computes glucose statistics from CGM and SMBG data. All statistics respect:

- **BG Source**: CGM (`cbg`) or BGM (`smbg`) data
- **BG Units**: mg/dL or mmol/L
- **BG Bounds**: Configurable glycemic range thresholds
- **Active Days**: Date range and day-of-week filters

---

## Data Requirements

### CGM Statistics

CGM statistics (Time in Range, GMI, Sensor Usage) apply filtering:

1. **Sample Interval Filter**: Only readings with `sampleInterval >= 5 minutes`
2. **Deduplication**: Removes duplicate readings from overlapping uploads

### Minimum Data Requirements

| Statistic | Minimum Requirement |
|-----------|---------------------|
| Average Glucose | 1 reading |
| Standard Deviation | 30 readings |
| Coefficient of Variation | 30 readings |
| GMI | 14 days + 70% sensor usage |
| Time in Range | 1 reading |
| Sensor Usage | 1 reading |

---

## Average Glucose

The arithmetic mean of all blood glucose readings.

### Formula

$$
\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i
$$

Where:
- $\bar{x}$ = average glucose
- $n$ = number of readings
- $x_i$ = individual glucose value

### Implementation

```javascript
// src/utils/StatUtil.js:102-123
getAverageGlucoseData = () => {
  // ... filter and deduplicate data
  return {
    averageGlucose: _.meanBy(bgData, 'value'),
    total: bgData.length,
  };
};
```

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `averageGlucose` | number | Mean BG in current units |
| `total` | number | Number of readings |

---

## Standard Deviation

Sample standard deviation measures glucose variability—how much readings vary from the mean.

### Formula

$$
s = \sqrt{\frac{\sum_{i=1}^{n}(x_i - \bar{x})^2}{n - 1}}
$$

Where:
- $s$ = standard deviation
- $x_i$ = individual glucose value
- $\bar{x}$ = mean glucose
- $n$ = number of readings
- $n - 1$ = Bessel's correction for sample SD

### Implementation

```javascript
// src/utils/StatUtil.js:549-570
getStandardDevData = () => {
  const { averageGlucose, bgData, total } = this.getAverageGlucoseData(true);

  // Minimum 30 data points per BGM AGP specification
  if (bgData.length < 30) {
    return { insufficientData: true, standardDeviation: NaN };
  }

  const squaredDiffs = _.map(bgData, d => (d.value - averageGlucose) ** 2);
  const standardDeviation = Math.sqrt(_.sum(squaredDiffs) / (bgData.length - 1));

  return { averageGlucose, standardDeviation, total };
};
```

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `standardDeviation` | number | SD in current units (NaN if < 30 readings) |
| `averageGlucose` | number | Mean used in calculation |
| `insufficientData` | boolean | True if < 30 readings |

---

## Coefficient of Variation (CV)

CV normalizes standard deviation to the mean, enabling comparison across different glucose levels. A CV < 36% indicates stable glycemic control.

### Formula

$$
CV\% = \frac{s}{\bar{x}} \times 100
$$

Where:
- $CV\%$ = coefficient of variation as percentage
- $s$ = standard deviation
- $\bar{x}$ = mean glucose

### Implementation

```javascript
// src/utils/StatUtil.js:304-322
getCoefficientOfVariationData = () => {
  const { averageGlucose, standardDeviation, total } = this.getStandardDevData();

  return {
    coefficientOfVariation: (standardDeviation / averageGlucose) * 100,
    total,
  };
};
```

### Clinical Targets

| CV% | Interpretation |
|-----|----------------|
| < 36% | Stable glycemic control |
| ≥ 36% | Unstable / high variability |

---

## Glucose Management Indicator (GMI)

GMI (formerly eA1C) estimates HbA1c from CGM data. It uses a regression formula derived from clinical studies comparing CGM averages to laboratory A1C.

### Formula

$$
GMI = 3.31 + (0.02392 \times \bar{x}_{mg/dL})
$$

Where:
- $GMI$ = glucose management indicator (%)
- $\bar{x}_{mg/dL}$ = mean glucose in mg/dL

### Requirements

Per international consensus, GMI requires:
1. **CGM data** (not SMBG)
2. **At least 14 days** of data
3. **At least 70% sensor wear time** over those 14 days

### Implementation

```javascript
// src/utils/StatUtil.js:384-422
getGlucoseManagementIndicatorData = () => {
  const { averageGlucose, bgData, total } = this.getAverageGlucoseData(true);

  const getTotalCbgDuration = () => _.reduce(
    bgData, (result, datum) => result + datum.sampleInterval, 0
  );

  const insufficientData = this.bgSource === 'smbg'
    || this.activeDays < 14
    || getTotalCbgDuration() < 14 * MS_IN_DAY * 0.7;

  // Convert to mg/dL if needed
  const meanInMGDL = this.bgUnits === MGDL_UNITS
    ? averageGlucose
    : averageGlucose * MGDL_PER_MMOLL;

  const glucoseManagementIndicator = 3.31 + (0.02392 * meanInMGDL);

  if (insufficientData) {
    return { glucoseManagementIndicator: NaN, insufficientData: true };
  }

  return { glucoseManagementIndicator, total };
};
```

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `glucoseManagementIndicator` | number | GMI percentage (NaN if insufficient) |
| `glucoseManagementIndicatorAGP` | number | Always calculated (for AGP reports) |
| `insufficientData` | boolean | True if requirements not met |

### Clinical Note

GMI and laboratory HbA1c may differ due to red blood cell lifespan variations between individuals. GMI reflects recent glucose control, while HbA1c reflects ~3 months.

---

## Time in Range (TIR)

Time in Range measures how long CGM glucose values stay within target ranges. This is the primary metric for CGM-based diabetes management.

### Formula

$$
TIR_r = \frac{\sum_{i \in R_r} \Delta t_i}{\sum_{i=1}^{n} \Delta t_i} \times 100
$$

Where:
- $TIR_r$ = time in range $r$ as percentage
- $R_r$ = set of readings classified in range $r$
- $\Delta t_i$ = sample interval for reading $i$ (typically 5 min)
- $n$ = total readings

### Implementation

```javascript
// src/utils/StatUtil.js:686-727
getTimeInRangeData = () => {
  // Filter and deduplicate CGM data
  this.filterCBGDataByDefaultSampleInterval();
  const rawCbgData = this.dataUtil.filter.byType('cbg').top(Infinity);
  const cbgData = this.dataUtil.getDeduplicatedCBGData(rawCbgData);

  const timeInRangeData = _.reduce(cbgData, (result, datum) => {
    const classification = classifyBgValue(this.bgBounds, this.bgUnits, datum.value, 'fiveWay');
    const duration = datum.sampleInterval;
    result.durations[classification] += duration;
    result.durations.total += duration;
    result.counts[classification]++;
    result.counts.total++;
    return result;
  }, initialValue);

  // Normalize to daily averages for multi-day ranges
  if (this.activeDays > 1) {
    timeInRangeData.durations = this.getDailyAverageDurations(timeInRangeData.durations);
  }

  return timeInRangeData;
};
```

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `durations.veryLow` | number | ms in very low range |
| `durations.low` | number | ms in low range |
| `durations.target` | number | ms in target range |
| `durations.high` | number | ms in high range |
| `durations.veryHigh` | number | ms in very high range |
| `durations.total` | number | total ms of CGM data |
| `counts.*` | number | reading counts per range |

### Clinical Targets (ADA/EASD Consensus)

| Metric | Target |
|--------|--------|
| Time in Range (70–180) | > 70% |
| Time Below Range (< 70) | < 4% |
| Time Very Low (< 54) | < 1% |
| Time Above Range (> 180) | < 25% |
| Time Very High (> 250) | < 5% |

---

## Readings in Range (SMBG)

For fingerstick (SMBG) data, we count readings per range rather than time-weighted duration.

### Formula

$$
RIR_r = \frac{n_r}{n_{total}}
$$

Where:
- $RIR_r$ = readings in range $r$ (count or percentage)
- $n_r$ = number of readings in range $r$
- $n_{total}$ = total readings

### Implementation

```javascript
// src/utils/StatUtil.js:440-477
getReadingsInRangeData = () => {
  const smbgData = _.cloneDeep(this.dataUtil.filter.byType('smbg').top(Infinity));

  const readingsInRangeData = _.reduce(smbgData, (result, datum) => {
    const classification = classifyBgValue(this.bgBounds, this.bgUnits, datum.value, 'fiveWay');
    result.counts[classification]++;
    result.counts.total++;
    return result;
  }, initialValue);

  if (this.activeDays > 1) {
    readingsInRangeData.dailyAverages = this.getDailyAverageSums(readingsInRangeData.counts);
  }

  return readingsInRangeData;
};
```

---

## Sensor Usage

Sensor usage measures CGM wear time as a percentage of the total period.

### Formula

$$
SensorUsage\% = \frac{\sum_{i=1}^{n} \Delta t_i}{T_{total}} \times 100
$$

Where:
- $\Delta t_i$ = sample interval for reading $i$
- $T_{total}$ = total period duration (days × 86,400,000 ms)

### AGP Variant

For AGP reports, sensor usage is calculated differently:

$$
SensorUsage_{AGP}\% = \frac{n}{n_{expected}} \times 100
$$

Where:
- $n$ = actual reading count
- $n_{expected}$ = expected readings based on CGM time span and sample interval

### Implementation

```javascript
// src/utils/StatUtil.js:494-535
getSensorUsage = () => {
  this.filterCBGDataByDefaultSampleInterval();
  const rawCbgData = this.dataUtil.filter.byType('cbg').top(Infinity);
  const cbgData = this.dataUtil.getDeduplicatedCBGData(rawCbgData);

  let sensorUsage = 0;
  for (let i = 0; i < cbgData.length; i++) {
    sensorUsage += cbgData[i].sampleInterval;
  }

  const count = cbgData.length;
  const total = this.activeDays * MS_IN_DAY;

  // AGP calculation based on expected readings
  const cgmMinutesWorn = moment.utc(newestDatum?.time)
    .diff(moment.utc(oldestDatum?.time), 'minutes', true);
  const sensorUsageAGP = (count / ((cgmMinutesWorn / (sampleInterval / MS_IN_MIN)) + 1)) * 100;

  return { sensorUsage, sensorUsageAGP, sampleInterval, count, total };
};
```

---

## BG Extents

Provides min/max glucose values and date range context.

### Implementation

```javascript
// src/utils/StatUtil.js:138-172
getBgExtentsData = () => {
  // ... filter and deduplicate
  return {
    bgMax: _.get(_.maxBy(bgData, 'value'), 'value', null),
    bgMin: _.get(_.minBy(bgData, 'value'), 'value', null),
    bgDaysWorn: moment.utc(newestDatum?.localDate)
      .diff(moment.utc(oldestDatum?.localDate), 'days', true) + 1,
    newestDatum,
    oldestDatum,
  };
};
```

---

## Glucose Classification

All range-based statistics use the `classifyBgValue` function:

```javascript
// src/utils/bloodglucose.js
export function classifyBgValue(bgBounds, bgUnits, value, classificationType) {
  // 'fiveWay' classification:
  // - veryLow: value < veryLowThreshold
  // - low: value < targetLowerBound
  // - target: targetLowerBound <= value <= targetUpperBound
  // - high: value > targetUpperBound
  // - veryHigh: value > veryHighThreshold
}
```

Default thresholds (mg/dL):

| Range | Threshold |
|-------|-----------|
| Very Low | < 54 |
| Low | < 70 |
| Target | 70–180 |
| High | > 180 |
| Very High | > 250 |

---

## Key Source Files

| Purpose | File |
|---------|------|
| Statistics calculations | `src/utils/StatUtil.js` |
| Stat definitions | `src/utils/stat.js` |
| BG classification | `src/utils/bloodglucose.js` |
| Tests | `test/utils/StatUtil.test.js` |

---

## See Also

- [Glucose Domain Overview](./index.md)
- [Architecture - Statistics](../../concepts/architecture.md#statistics)
- [Diabetes Primer](../../concepts/diabetes-primer.md)
