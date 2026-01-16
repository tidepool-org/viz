# Glucose Domain

Blood glucose data is the foundation of diabetes visualization. This parent domain covers all glucose measurements and their shared concepts.

---

## Overview

Glucose data answers the fundamental question: **"What is my blood sugar?"**

The platform handles two distinct sources of glucose data, each with different characteristics and use cases:

| Subdomain | Data Type | Source | Frequency | Primary Use |
|-----------|-----------|--------|-----------|-------------|
| [CBG](./cbg/index.md) | `cbg` | CGM devices | Every 1-5 minutes | Trends, Time in Range, AGP |
| [SMBG](./smbg/index.md) | `smbg` | Fingerstick meters | Variable (1-10/day) | Spot checks, calibration |

Both types share the same value structure and glycemic range classifications but serve different purposes in visualization.

---

## Subdomains

### CBG (Continuous Glucose)

Continuous glucose data from CGM (Continuous Glucose Monitor) devices. Provides near-continuous visibility into glucose trends.

| File | Content |
|------|---------|
| [index.md](./cbg/index.md) | Data structure, sample intervals, devices |
| [rendering.md](./cbg/rendering.md) | CBGTooltip, trend visualization |
| [sensor-usage.md](./cbg/sensor-usage.md) | Time in Range, Sensor Usage, GMI |

### SMBG (Self-Monitored Glucose)

Discrete fingerstick readings from blood glucose meters. Point-in-time measurements for verification and calibration.

| File | Content |
|------|---------|
| [index.md](./smbg/index.md) | Data structure, subTypes, Medtronic 600 |
| [rendering.md](./smbg/rendering.md) | SMBGTooltip, source indicators |

---

## Shared Concepts

### Glucose Ranges

The platform defines five glycemic ranges based on clinical guidelines:

| Range | mg/dL | mmol/L | Color | Clinical Significance |
|-------|-------|--------|-------|----------------------|
| **Very Low** | < 54 | < 3.0 | Red | Severe hypoglycemia risk |
| **Low** | 54–69 | 3.0–3.8 | Light Red | Hypoglycemia |
| **Target** | 70–180 | 3.9–10.0 | Green | Optimal range |
| **High** | 181–249 | 10.1–13.8 | Light Purple | Hyperglycemia |
| **Very High** | ≥ 250 | ≥ 13.9 | Purple | Significant hyperglycemia |

These thresholds are configurable via `bgBounds` in patient preferences.

### Glycemic Presets

Different clinical scenarios use different thresholds:

```javascript
// From src/utils/constants.js
export const GLYCEMIC_RANGES_PRESET = {
  ADA_STANDARD: 'adaStandard',           // Default ranges above
  ADA_OLDER_HIGH_RISK: 'adaHighRisk',    // No very low/extreme high
  ADA_PREGNANCY_T1: 'adaPregnancyType1', // Tighter targets
  ADA_GESTATIONAL_T2: 'adaPregnancyType2',
};
```

### Unit Conversion

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

### BG Classification

```javascript
// From src/utils/bloodglucose.js
export function classifyBgValue(bgBounds, bgUnits, value, classificationType) {
  // classificationType: 'fiveWay' or 'threeWay'
  // Returns: 'veryLow', 'low', 'target', 'high', 'veryHigh'
}
```

---

## Cross-Subdomain Statistics

Statistics that apply to both CBG and SMBG data are documented in [Glucose Statistics](./statistics.md):

| Statistic | Applies To | Description |
|-----------|------------|-------------|
| Average Glucose | CBG + SMBG | Mean glucose value |
| Standard Deviation | CBG + SMBG | Glucose variability |
| Coefficient of Variation (CV) | CBG + SMBG | Relative variability |
| GMI | CBG only | Glucose Management Indicator |

Subdomain-specific statistics:
- **Time in Range**: CBG only → [sensor-usage.md](./cbg/sensor-usage.md)
- **Readings in Range**: SMBG only → [smbg/rendering.md](./smbg/rendering.md)

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

## Key Source Files

| Purpose | File |
|---------|------|
| BG utilities | `src/utils/bloodglucose.js` |
| BG formatting | `src/utils/format.js` |
| Constants | `src/utils/constants.js` |
| Data processing | `src/utils/DataUtil.js` |
| Colors | `src/styles/colors.css` |

---

## See Also

- [Glucose Statistics](./statistics.md) - Statistical calculations
- [Glucose Rendering](./rendering.md) - Shared rendering concepts
- [CBG Subdomain](./cbg/index.md) - Continuous glucose details
- [SMBG Subdomain](./smbg/index.md) - Fingerstick glucose details
- [Tidepool Data Model](../../concepts/tidepool-data-model.md) - Complete data reference
- [Diabetes Primer](../../concepts/diabetes-primer.md) - Medical terminology
