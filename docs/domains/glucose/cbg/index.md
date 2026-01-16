# CBG (Continuous Glucose Monitoring)

Part of the [Glucose Domain](../index.md).

---

## Overview

CBG (Continuous Blood Glucose) data comes from CGM (Continuous Glucose Monitor) devices that measure interstitial glucose levels every few minutes. This provides a near-continuous picture of glucose trends throughout the day.

| Aspect | Details |
|--------|---------|
| **Data Type** | `cbg` |
| **Typical Frequency** | Every 5 minutes (288 readings/day) |
| **Primary Use** | Trends, Time in Range, AGP reports |
| **Key Advantage** | Continuous data reveals patterns invisible to spot checks |

---

## Data Structure

```javascript
{
  type: "cbg",
  value: 142,                    // Glucose reading
  units: "mg/dL",                // or "mmol/L"
  sampleInterval: 300000,        // ms between readings (typically 5 min)
  time: "2024-01-15T14:30:00Z",  // UTC timestamp
  deviceId: "DexG6_123456",      // CGM device identifier
  uploadId: "upid_abc123",       // Upload batch identifier
  // ... common fields (normalTime, localDate, etc.)
}
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `value` | number | Glucose reading in specified units |
| `units` | string | `"mg/dL"` or `"mmol/L"` |
| `sampleInterval` | number | Milliseconds between readings |
| `deviceId` | string | Identifies the CGM device |

---

## Sample Intervals

Different CGM systems report data at different intervals:

| Device | Sample Interval | Readings/Day | Notes |
|--------|-----------------|--------------|-------|
| Dexcom G6/G7 | 5 minutes | 288 | Most common |
| FreeStyle Libre 2/3 | 1 minute (historical) | 1440 | When scanned/streamed |
| FreeStyle Libre (original) | 15 minutes | 96 | Scan-based |
| Medtronic Guardian | 5 minutes | 288 | |
| Twiist Loop | 1 minute | 1440 | Real-time data |

### Constants

```javascript
// From src/utils/constants.js
CGM_READINGS_ONE_DAY = 288    // Standard 5-min interval
CGM_DATA_KEY = 'cbg'
DEFAULT_SAMPLE_INTERVAL = 300000  // 5 minutes in ms
```

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

---

## Device Detection

Device-specific handling is implemented in `src/utils/device.js`:

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

---

## Data Processing

### Deduplication

When multiple uploads contain the same readings, `DataUtil` deduplicates based on:

1. Same `time` value
2. Same `value`
3. Within tolerance window (500ms)

```javascript
// DataUtil.js
deduplicateCBGData(data) {
  // Remove duplicate readings within tolerance
  return _.uniqBy(data, d => `${d.time}-${d.value}`);
}
```

### Weighted Counts

For devices with non-5-minute intervals, readings are weighted for statistics:

```javascript
weightedCGMCount(count, sampleInterval) {
  // Adjust count to equivalent 5-minute readings
  const intervalMinutes = sampleInterval / 60000;
  return count * (intervalMinutes / 5);
}
```

---

## CGM Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CBGSlicesContainer` | `src/components/trends/cbg/` | Trend view CGM slices |
| `CBGSliceAnimated` | `src/components/trends/cbg/` | Animated slice rendering |
| `CBGMedianAnimated` | `src/components/trends/cbg/` | Median line |
| `CBGTooltip` | `src/components/daily/cbgtooltip/` | CGM reading tooltip |

---

## Views Using CBG Data

| View | Usage |
|------|-------|
| **Daily** | Continuous line trace with dots |
| **Trends** | Multi-day overlay with percentiles |
| **Basics** | Calendar summary, Time in Range |
| **AGP** | Ambulatory Glucose Profile (CGM only) |

---

## Key Source Files

| Purpose | File |
|---------|------|
| CGM data processing | `src/utils/DataUtil.js` |
| Device detection | `src/utils/device.js` |
| CBG tooltip | `src/components/daily/cbgtooltip/CBGTooltip.js` |
| Trend components | `src/components/trends/cbg/` |
| Constants | `src/utils/constants.js` |
| Validation schema | `src/utils/validation/schema.js` |
| AGP utilities | `src/utils/agp/data.js` |

---

## See Also

- [Glucose Domain](../index.md) - Parent domain overview
- [CBG Rendering](./rendering.md) - Tooltip and visual details
- [Sensor Usage](./sensor-usage.md) - CGM-specific statistics
- [SMBG Subdomain](../smbg/index.md) - Fingerstick data
- [Trends View](../../../views/Trends.md) - CGM trend display
- [AGP Reports](../../../views/pdf-reports.md) - AGP PDF generation
