# Tandem Pump Settings

Part of the [Settings Domain](./index.md).

Tandem pumps use a **profile-based** settings data model where all settings are keyed by profile name, enabling a unified table display per profile.

---

## Overview

Unlike other manufacturers that store settings in flat arrays, Tandem organizes all settings by profile name. This allows the UI to display all time-based settings (basal rates, BG targets, carb ratios, correction factors) in a single unified table per profile.

| Feature | Tandem Approach |
|---------|-----------------|
| Profile organization | Settings keyed by profile name |
| Display format | Unified table with all settings per time slot |
| Supported profiles | Multiple named profiles (e.g., "Normal", "Sick", "Sports") |
| Control-IQ support | Annotations for user-defined vs automated values |

---

## Data Structure

### Profile-Keyed Model

Settings objects use profile names as keys:

```javascript
{
  activeSchedule: "Normal",
  basalSchedules: [
    { name: "Normal", value: [{ start: 0, rate: 0.85 }, ...] },
    { name: "Sick", value: [...] },
  ],
  bgTargets: {
    "Normal": [{ start: 0, target: 100 }, ...],
    "Sick": [{ start: 0, target: 110 }, ...],
  },
  carbRatios: {
    "Normal": [{ start: 0, amount: 10 }, ...],
    "Sick": [{ start: 0, amount: 8 }, ...],
  },
  insulinSensitivities: {
    "Normal": [{ start: 0, amount: 50 }, ...],
    "Sick": [{ start: 0, amount: 40 }, ...],
  },
}
```

### PropTypes Definition (`Tandem.js:128-166`)

```javascript
pumpSettings: PropTypes.shape({
  activeSchedule: PropTypes.string.isRequired,
  basalSchedules: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.arrayOf(PropTypes.shape({
      start: PropTypes.number.isRequired,
      rate: PropTypes.number.isRequired,
    })),
  })).isRequired,
  bgTargets: PropTypes.objectOf(PropTypes.arrayOf(...)).isRequired,
  carbRatios: PropTypes.objectOf(PropTypes.arrayOf(...)).isRequired,
  insulinSensitivities: PropTypes.objectOf(PropTypes.arrayOf(...)).isRequired,
})
```

---

## Unified Profile Table

The key differentiator for Tandem is the **unified profile table** that displays all time-based settings in a single view per profile. This is accomplished by the `processTimedSettings` function (`data.js:338-376`).

### Table Columns (`tandemData.js:68-97`)

| Column | Key | Description |
|--------|-----|-------------|
| Start time | `start` | Time slot start |
| Basal Rates | `rate` | U/hr |
| Target BG | `bgTarget` | With units, asterisk for Control-IQ |
| Carb Ratio | `carbRatio` | g/U |
| Correction Factor | `insulinSensitivity` | units/U |

### Data Processing Flow

1. `basalSchedules()` extracts schedule list (`tandemData.js:29-31`)
2. For each schedule, `basal()` builds the unified table (`tandemData.js:108-116`)
3. `processTimedSettings()` merges all settings by time slot (`data.js:338-376`)
4. Settings are rendered in a collapsible container per profile

---

## Key Differences from Other Manufacturers

| Aspect | Tandem | Other Manufacturers |
|--------|--------|---------------------|
| Settings access | `bgTargets["Normal"]` | `bgTargets` (flat array) |
| Profile table | Unified (all settings together) | Separate tables per setting type |
| Bolus settings | Per-profile (`bolus["Normal"]`) | Single global object |
| Schedule lookup | By name from keyed objects | By position from arrays |

---

## Control-IQ Annotations

For Control-IQ enabled pumps, user-defined Target BG and Insulin Duration values are annotated with an asterisk. These values only apply in manual mode; Control-IQ uses its own preset values during automation (`Tandem.js:89-95`).

```javascript
if (isControlIQ(pumpSettings)) {
  // Display annotation explaining manual vs automated values
}
```

---

## Visual Examples

### Single Basal Rate Profile

![Tandem flat rate profile](./screenshots/tandem-flat-rate.png)

### Multiple Basal Rates Profile

![Tandem multi-rate profile](./screenshots/tandem-multi-rate.png)

---

## Key Source Files

| Purpose | File | Lines |
|---------|------|-------|
| Component | `src/components/settings/Tandem.js` | 182 |
| Data processing | `src/utils/settings/tandemData.js` | 117 |
| Shared utilities | `src/utils/settings/data.js` | `processTimedSettings` |
| Text export | `src/utils/settings/textData.js` | `tandemText` |
| Control-IQ detection | `src/utils/device.js` | `isControlIQ` |
| Styles | `src/components/settings/Tandem.css` | - |

---

## See Also

- [Settings Domain](./index.md) - Parent overview
- [Common Props](../../reference/common-props.md) - Shared component properties
