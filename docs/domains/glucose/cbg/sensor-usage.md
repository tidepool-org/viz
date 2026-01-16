# CBG Sensor Usage & Statistics

Part of the [CBG Subdomain](./index.md) in the [Glucose Domain](../index.md).

This document covers CGM-specific statistics: Sensor Usage, Time in Range, and GMI. For statistics that apply to both CBG and SMBG (Average Glucose, Standard Deviation, CV), see [Glucose Statistics](../statistics.md).

---

## Overview

CGM data enables time-based statistics that aren't possible with discrete SMBG readings. These statistics are weighted by sample interval to accurately represent time spent in each glucose range.

| Statistic | CGM Only? | Description |
|-----------|-----------|-------------|
| Sensor Usage | Yes | Percentage of time CGM was actively reading |
| Time in Range | Yes | Time-weighted distribution across glucose ranges |
| GMI | Yes | Glucose Management Indicator (estimated A1C) |

---

## Sensor Usage

Sensor usage measures CGM wear time as a percentage of the total period.

### Why It Matters

- **≥70% usage**: Recommended threshold for reliable statistics
- **<70% usage**: GMI and other statistics may be unreliable
- **AGP reports**: Require sufficient sensor usage for clinical validity

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

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `sensorUsage` | number | Percentage based on total period |
| `sensorUsageAGP` | number | Percentage for AGP reports |
| `sampleInterval` | number | Sample interval used (ms) |
| `count` | number | Number of readings |
| `total` | number | Total period duration (ms) |

### Screenshot

![Sensor Usage](./screenshots/Sensor%20Usage.png)

---

## Time in Range (TIR)

Time in Range measures how long CGM glucose values stay within target ranges. This is the primary metric for CGM-based diabetes management.

### Why It Matters

TIR correlates with long-term diabetes outcomes and is now a standard clinical metric alongside HbA1c.

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

### Screenshot

![Time In Range](./screenshots/Time%20In%20Range.png)

---

## Glucose Management Indicator (GMI)

GMI (formerly eA1C) estimates HbA1c from CGM data. It uses a regression formula derived from clinical studies comparing CGM averages to laboratory A1C.

### Why It Matters

- Provides A1C estimate without blood draw
- Updates with recent data (vs. 3-month A1C lag)
- Helps identify discrepancies between CGM and lab A1C

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

### Screenshot

![GMI](./screenshots/Glucose%20Management%20Indicator.png)

---

## AGP Requirements

For AGP (Ambulatory Glucose Profile) reports:

- **Minimum threshold**: 70% sensor usage
- **Time period**: 14 days recommended
- **CPT code 95251**: Requires 72+ hours of CGM data

See [PDF Reports](../../../views/pdf-reports.md) for AGP PDF generation details.

---

## Data Filtering

CGM statistics apply specific filtering:

### Sample Interval Filter

Only readings with `sampleInterval >= 5 minutes` are included by default:

```javascript
filterCBGDataByDefaultSampleInterval() {
  // Filters out 1-minute real-time data
  // Keeps 5-minute display data for statistics
}
```

### Deduplication

Removes duplicate readings from overlapping uploads (same time + value within 500ms tolerance).

---

## Key Source Files

| Purpose | File |
|---------|------|
| Statistics calculations | `src/utils/StatUtil.js` |
| Stat definitions | `src/utils/stat.js` |
| AGP utilities | `src/utils/agp/data.js` |
| Tests | `test/utils/StatUtil.test.js` |

---

## See Also

- [CBG Overview](./index.md) - Data structure and processing
- [Glucose Statistics](../statistics.md) - Cross-subdomain stats (Avg, SD, CV)
- [Glucose Domain](../index.md) - Parent domain overview
- [AGP Reports](../../../views/pdf-reports.md) - AGP PDF generation
