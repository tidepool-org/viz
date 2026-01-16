# Sensor Domain

This section covers how CGM (Continuous Glucose Monitor) and SMBG (Self-Monitored Blood Glucose) sensor data is handled in Tidepool viz.

## Overview

Tidepool viz supports two types of blood glucose data:

| Type | Key | Description |
|------|-----|-------------|
| **CBG** | `cbg` | Continuous Glucose Monitor readings |
| **SMBG** | `smbg` | Fingerstick/meter readings |

## CGM Data Structure

### Core Properties

```javascript
{
  type: 'cbg',
  value: 120,                    // Glucose value
  units: 'mg/dL',               // 'mg/dL' or 'mmol/L'
  sampleInterval: 300000,       // Interval between readings (ms)
  time: '2024-01-15T10:30:00Z', // ISO timestamp
  deviceId: 'DexcomG6-12345',
  uploadId: 'upid_abc123'
}
```

### Sample Intervals

Different CGM systems use different sample intervals:

| Device | Interval | Readings/Day |
|--------|----------|--------------|
| Dexcom G6/G7 | 5 minutes | 288 |
| FreeStyle Libre (original) | 15 minutes | 96 |
| FreeStyle Libre 3 | 5 minutes | 288 |
| Twiist Loop | 1 minute | 1440 |

### Constants

From `src/utils/constants.js`:

```javascript
CGM_READINGS_ONE_DAY = 288    // Standard 5-min interval
CGM_DATA_KEY = 'cbg'
BGM_DATA_KEY = 'smbg'
```

## SMBG Data Structure

```javascript
{
  type: 'smbg',
  value: 115,
  units: 'mg/dL',
  subType: 'manual',           // 'manual' or 'linked'
  time: '2024-01-15T10:30:00Z'
}
```

SMBG does **not** have a `sampleInterval` property.

## Data Processing

### Sample Interval Handling

`DataUtil.js` normalizes CGM data with sample intervals:

```javascript
// Default interval for legacy data
const DEFAULT_SAMPLE_INTERVAL = 300000; // 5 minutes

// Set range of sample intervals in dataset
setCgmSampleIntervalRange(data) {
  const intervals = _.uniq(_.map(data.cbg, 'sampleInterval'));
  this.sampleIntervalRange = {
    min: _.min(intervals),
    max: _.max(intervals)
  };
}
```

### Device Detection

Device-specific handling (`src/utils/device.js`):

```javascript
// Check for 1-minute CGM devices
isOneMinCGMSampleIntervalDevice(deviceId) {
  return /twiist.*loop/i.test(deviceId);
}

// Check for Dexcom devices  
isDexcom(deviceId) {
  return /dexcom/i.test(deviceId);
}

// Check for LibreView API data
isLibreViewAPI(uploadId) {
  return uploadId?.startsWith('libreview');
}
```

### Deduplication

CGM data may have duplicates that need removal:

```javascript
// DataUtil.js
deduplicateCBGData(data) {
  // Remove duplicate readings within tolerance
  return _.uniqBy(data, d => `${d.time}-${d.value}`);
}
```

SMBG duplicates are also filtered when they match CGM readings within 500ms:

```javascript
DUPLICATE_SMBG_TIME_TOLERANCE_MS = 500
DUPLICATE_SMBG_COUNT_THRESHOLD = 10
```

## Sensor Usage Statistics

### Calculation

`StatUtil.getSensorUsage()` calculates CGM wear time:

```javascript
getSensorUsage() {
  // Count readings in time range
  const readingCount = this.data.cbg.length;
  
  // Calculate expected readings based on interval
  const expectedReadings = totalMinutes / sampleIntervalMinutes;
  
  // Usage percentage
  const usage = (readingCount / expectedReadings) * 100;
  
  return {
    sensorUsage: usage,
    sensorUsageAGP: agpStyleUsage,  // For AGP reports
    sensorUsageCount: readingCount,
    sensorUsageSampleInterval: sampleInterval
  };
}
```

### AGP Requirements

For AGP (Ambulatory Glucose Profile) reports:

- **Minimum threshold**: 70% sensor usage
- **Time period**: 14 days recommended
- **CPT code 95251**: Requires 72+ hours of CGM data

## Blood Glucose Classification

### Range Classification

`src/utils/bloodglucose.js` classifies BG values into ranges:

```javascript
// Five-way classification (default)
const BG_RANGES = {
  veryLow: 54,   // mg/dL
  low: 70,
  target: { min: 70, max: 180 },
  high: 250,
  veryHigh: 250
};

classifyBgValue(bgBounds, value, classificationType = 'fiveWay') {
  if (value < bgBounds.veryLowThreshold) return 'veryLow';
  if (value < bgBounds.targetLowerBound) return 'low';
  if (value <= bgBounds.targetUpperBound) return 'target';
  if (value <= bgBounds.veryHighThreshold) return 'high';
  return 'veryHigh';
}
```

### Weighted Counts

For devices with non-5-minute intervals, readings are weighted:

```javascript
weightedCGMCount(count, sampleInterval) {
  // Adjust count to equivalent 5-minute readings
  const intervalMinutes = sampleInterval / 60000;
  return count * (intervalMinutes / 5);
}
```

## Calibrations

Calibration data comes from device events:

```javascript
{
  type: 'deviceEvent',
  subType: 'calibration',
  value: 118,
  units: 'mg/dL'
}
```

Calibrations are aggregated for the Basics view showing calibration counts per day.

## Components

### CGM Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CBGSlicesContainer` | `src/components/trends/cbg/` | Trend view CGM slices |
| `CBGSliceAnimated` | `src/components/trends/cbg/` | Animated slice rendering |
| `CBGMedianAnimated` | `src/components/trends/cbg/` | Median line |
| `CBGTooltip` | `src/components/daily/cbgtooltip/` | CGM reading tooltip |

### SMBG Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SMBGsByDateContainer` | `src/components/trends/smbg/` | SMBG by date view |
| `SMBGRangeAvgContainer` | `src/components/trends/smbg/` | Range/average display |
| `SMBGTooltip` | `src/components/daily/smbgtooltip/` | Fingerstick tooltip |

## Tooltips

### CGM Tooltip

Shows:
- Glucose value with units
- Time of reading
- Device source

### SMBG Tooltip

Shows:
- Glucose value with units
- Source: "Meter" or "Manual"
- Medtronic-specific annotations (if applicable)

### Sample Interval Tooltip

`CgmSampleIntervalTooltip.js` explains the two CGM data types:

- **Real-time (1-min)**: Used for pump dosing, may have gaps
- **Display (5-min)**: Smoothed, auto-backfilled, used for stats

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/DataUtil.js` | CGM normalization, deduplication |
| `src/utils/StatUtil.js` | Sensor usage, time-in-range |
| `src/utils/bloodglucose.js` | BG classification, binning |
| `src/utils/device.js` | Device detection utilities |
| `src/utils/constants.js` | BG thresholds, constants |
| `src/utils/validation/schema.js` | CBG/SMBG schemas |
| `src/utils/agp/data.js` | AGP report utilities |

## Related Topics

- [Glucose Domain](../glucose/index.md) - Glucose statistics and rendering
- [Trends View](../../views/Trends.md) - CGM trend display
- [AGP Reports](../../views/pdf-reports.md) - AGP PDF generation
