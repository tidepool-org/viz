# Legacy Pump Settings

Part of the [Settings Domain](./index.md)

## Overview

Legacy pump manufacturers (Animas, Medtronic, Insulet/OmniPod, Microtech/Equil) use a **flat-array** data model where settings are stored as global arrays rather than keyed by profile name. This contrasts with newer devices (like Tandem) that use profile-based structures.

The `NonTandem` component renders settings for all legacy manufacturers through a unified interface, with manufacturer-specific terminology and data accessors handled by `nonTandemData.js`.

## Data Structure

Legacy devices store settings as flat arrays at the top level:

```javascript
{
  activeSchedule: "Standard",
  basalSchedules: [
    { name: "Standard", value: [{ start: 0, rate: 0.85 }, ...] },
    { name: "Weekend", value: [{ start: 0, rate: 0.75 }, ...] }
  ],
  bgTarget: [
    { start: 0, low: 80, high: 120 },        // Medtronic format
    { start: 0, target: 100, range: 20 },    // Animas format
    { start: 0, target: 100, high: 110 }     // Insulet format
  ],
  carbRatio: [
    { start: 0, amount: 10 },
    { start: 43200000, amount: 12 }          // start in ms from midnight
  ],
  insulinSensitivity: [
    { start: 0, amount: 50 },
    { start: 43200000, amount: 45 }
  ],
  bolus: {
    amountMaximum: { value: 10 },
    calculator: { enabled: true, insulin: { duration: 240 } }
  }
}
```

Key differences from profile-based models:
- `bgTarget`, `carbRatio`, `insulinSensitivity` are arrays, not objects keyed by schedule name
- `bolus` settings are global, not per-profile
- Only `basalSchedules` supports multiple named schedules

## Manufacturer Terminology

Each manufacturer uses different terminology for the same concepts:

### Bolus Calculator Name

| Manufacturer | Term |
|--------------|------|
| Animas | ezCarb ezBG |
| Insulet | Bolus Calculator |
| Medtronic | Bolus Wizard |
| Microtech | Bolus Calculator |

### Insulin Sensitivity Factor

| Manufacturer | Term |
|--------------|------|
| Animas | ISF |
| Insulet | Correction factor |
| Medtronic | Sensitivity |
| Microtech | Insulin Sensitivity |

### Carb Ratio

| Manufacturer | Term |
|--------------|------|
| Animas | I:C Ratio |
| Insulet | IC ratio |
| Medtronic | Carb Ratios |
| Microtech | Carbohydrate Ratio |

## BG Target Format Variations

Different manufacturers store BG targets with different field combinations:

| Manufacturer | Column 2 | Column 3 | Data Fields |
|--------------|----------|----------|-------------|
| Animas | Target | Range | `target`, `range` |
| Insulet | Target | Correct Above | `target`, `high` |
| Medtronic | Low | High | `low`, `high` |
| Microtech | Lower | Upper | `low`, `high` |

The `targetColumns()` and `targetRows()` functions in `nonTandemData.js` handle these variations by mapping manufacturer-specific accessors to generic column keys.

## Medtronic Auto Mode

Medtronic pumps with Auto Mode (670G, 770G) have automated basal delivery. The system detects Auto Mode schedules by matching the schedule name against `pumpVocabulary`:

```javascript
const isAutomated = _.get(pumpVocabulary, [
  data.deviceName(lookupKey),
  AUTOMATED_DELIVERY,
]) === name;
```

When Auto Mode is detected:
- Basal rate rows/columns are empty (rates are algorithm-controlled)
- The schedule only displays if it was active at upload
- A distinct visual style indicates automated delivery

## Screenshots

### Animas
| Flat Rate | Multi-Rate |
|-----------|------------|
| ![Animas flat rate](./screenshots/animas-flat-rate.png) | ![Animas multi-rate](./screenshots/animas-multi-rate.png) |

### Medtronic
| Flat Rate | Multi-Rate | Automated |
|-----------|------------|-----------|
| ![Medtronic flat rate](./screenshots/medtronic-flat-rate.png) | ![Medtronic multi-rate](./screenshots/medtronic-multi-rate.png) | ![Medtronic automated](./screenshots/medtronic-automated.png) |

### OmniPod (Insulet)
| Flat Rate | Multi-Rate |
|-----------|------------|
| ![OmniPod flat rate](./screenshots/omnipod-flat-rate.png) | ![OmniPod multi-rate](./screenshots/omnipod-multi-rate.png) |

## Key Source Files

| File | Purpose |
|------|---------|
| `src/components/settings/NonTandem.js` | React component rendering all legacy manufacturers |
| `src/utils/settings/nonTandemData.js` | Manufacturer-specific data processing and terminology |
| `src/utils/settings/data.js` | Shared settings data utilities |
| `src/utils/constants.js` | `pumpVocabulary` definitions including Auto Mode names |
