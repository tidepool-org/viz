# Glucose Domain

Blood glucose data is the foundation of diabetes visualization. This domain covers continuous glucose monitoring (CGM) and self-monitored blood glucose (SMBG) data.

---

## Overview

| Data Type | Source | Typical Frequency | Use Case |
|-----------|--------|-------------------|----------|
| `cbg` | CGM devices | Every 5 minutes (288/day) | Trends, time-in-range, AGP |
| `smbg` | Fingerstick meters | Variable (1-10/day) | Spot checks, calibration |

Both types share the same glucose value structure but serve different purposes in visualization.

---

## Data Structure

### CBG (Continuous Blood Glucose)

```javascript
{
  type: "cbg",
  value: 142,                    // Glucose reading
  units: "mg/dL",                // or "mmol/L"
  sampleInterval: 300000,        // ms between readings (typically 5 min)
  time: "2024-01-15T14:30:00Z",  // UTC timestamp
  deviceId: "DexG6_123456",      // CGM device identifier
  // ... common fields
}
```

### SMBG (Self-Monitored Blood Glucose)

```javascript
{
  type: "smbg",
  value: 98,                     // Glucose reading
  units: "mg/dL",                // or "mmol/L"
  subType: "manual",             // optional: "manual", "linked"
  time: "2024-01-15T08:00:00Z",
  // ... common fields
}
```

---

## Glucose Ranges

The platform defines five glycemic ranges based on clinical guidelines:

| Range | mg/dL | mmol/L | Color | Clinical Significance |
|-------|-------|--------|-------|----------------------|
| **Very Low** | < 54 | < 3.0 | Red | Severe hypoglycemia risk |
| **Low** | 54–69 | 3.0–3.8 | Light Red | Hypoglycemia |
| **Target** | 70–180 | 3.9–10.0 | Green | Optimal range |
| **High** | 181–249 | 10.1–13.8 | Light Purple | Hyperglycemia |
| **Very High** | ≥ 250 | ≥ 13.9 | Purple | Significant hyperglycemia |

These thresholds are configurable via `bgBounds` in patient preferences and vary by clinical preset (standard, pregnancy, older adults).

### Glycemic Presets

```javascript
// From src/utils/constants.js
export const GLYCEMIC_RANGES_PRESET = {
  ADA_STANDARD: 'adaStandard',       // Default ranges above
  ADA_OLDER_HIGH_RISK: 'adaHighRisk', // No very low/extreme high
  ADA_PREGNANCY_T1: 'adaPregnancyType1', // Tighter targets
  ADA_GESTATIONAL_T2: 'adaPregnancyType2',
};
```

---

## CGM Data Quality

### Sample Interval

CGM devices report their sampling interval, which affects statistics calculations:

| Device | Sample Interval | Readings/Day |
|--------|-----------------|--------------|
| Dexcom G6/G7 | 5 minutes | 288 |
| Libre 2/3 | 1 minute (historical) | 1440 |
| Medtronic Guardian | 5 minutes | 288 |

### Sensor Usage

"Sensor usage" measures what percentage of time the CGM was actively reading. This affects the reliability of statistics:

- **≥70% usage**: Recommended for GMI calculation
- **<70% usage**: Statistics may be unreliable

See [Glucose Statistics](./statistics.md) for calculation details.

### Deduplication

When multiple uploads contain the same readings, `DataUtil` deduplicates based on:
1. Same `time` value
2. Same `value`
3. Within tolerance window (500ms)

---

## Unit Conversion

The platform stores BG values in mg/dL internally but displays in user-preferred units:

```javascript
export const MGDL_PER_MMOLL = 18.01559;

// mg/dL to mmol/L
const mmoll = mgdl / MGDL_PER_MMOLL;

// mmol/L to mg/dL
const mgdl = mmoll * MGDL_PER_MMOLL;
```

Display precision differs by unit:
- **mg/dL**: Integer values (1 mg/dL increments)
- **mmol/L**: One decimal place (0.1 mmol/L increments)

---

## Views Using Glucose Data

| View | CBG | SMBG | Description |
|------|-----|------|-------------|
| **Daily** | Yes | Yes | 24-hour timeline with BG trace |
| **Trends** | Yes | Yes | Multi-day overlay with percentiles |
| **Basics** | Yes | Yes | Calendar summary with ranges |
| **BG Log** | No | Yes | Tabular SMBG data |
| **AGP** | Yes | No | Ambulatory Glucose Profile |

---

## Related Documentation

- [Glucose Statistics](./statistics.md) - Statistical calculations with formulas
- [Glucose Rendering](./rendering.md) - Component details and tooltips
- [Tidepool Data Model](../../concepts/tidepool-data-model.md) - Complete data reference
- [Diabetes Primer](../../concepts/diabetes-primer.md) - Medical terminology

---

## Key Source Files

| Purpose | File |
|---------|------|
| CBG/SMBG tooltips | `src/components/common/tooltips/` |
| BG utilities | `src/utils/bloodglucose.js` |
| BG constants | `src/utils/constants.js` |
| Trends components | `src/components/trends/` |
| Daily BG rendering | `src/components/daily/` |
