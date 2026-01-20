# Loop Device Settings

Part of the [Settings Domain](./index.md)

## Overview

Loop devices (DIY Loop, Tidepool Loop, Twiist) use a **hybrid data model** that combines profile-based organization with unique Loop-specific fields. Unlike traditional pumps that store single arrays for settings, Loop devices organize time-based settings by schedule name (similar to Tandem) while adding fields specific to closed-loop insulin delivery.

## Devices Covered

| Device | Manufacturer Key | Detection Method |
|--------|------------------|------------------|
| DIY Loop | `diy loop` | `origin.name` matches `/^com\.[a-zA-Z0-9]*\.?loopkit\.Loop/` |
| Tidepool Loop | `tidepool loop` | `origin.name` matches `/^org\.tidepool\.[a-zA-Z0-9]*\.?Loop/` |
| Twiist | `twiist` | `origin.name` matches `/^com.dekaresearch.twiist/` |

## Loop-Specific Fields

These fields are unique to Loop devices and do not appear in other pump settings:

| Field | Type | Description |
|-------|------|-------------|
| `bgSafetyLimit` | `number` | Glucose threshold below which Loop will not deliver basal or recommend bolus insulin |
| `insulinModel` | `object` | Insulin activity curve configuration |
| `bgTargetPhysicalActivity` | `array` | Correction range override for workout/exercise preset |
| `bgTargetPreprandial` | `array` | Correction range override for pre-meal preset |

### Insulin Model

The `insulinModel` object configures how Loop predicts insulin activity:

```javascript
insulinModel: {
  modelType: 'rapidAdult' | 'rapidChild' | 'fiasp' | 'lyumjev' | 'afrezza',
  actionDelay: number,      // milliseconds before insulin starts acting
  actionDuration: number,   // total duration in milliseconds (fixed at 6 hours)
  actionPeakOffset: number  // milliseconds to peak activity
}
```

Available model labels:
- `rapidAdult` - Rapid-Acting - Adults
- `rapidChild` - Rapid-Acting - Children
- `fiasp` - Fiasp
- `lyumjev` - Lyumjev
- `afrezza` - Afrezza

## Data Structure

```javascript
{
  // Profile-based settings (keyed by schedule name, typically "Default")
  bgTargets: {
    "Default": [{ start: 0, low: 100, high: 110 }, ...]
  },
  carbRatios: {
    "Default": [{ start: 0, amount: 10 }, ...]
  },
  insulinSensitivities: {
    "Default": [{ start: 0, amount: 45 }, ...]
  },
  basalSchedules: [
    { name: "Default", value: [{ start: 0, rate: 0.8 }, ...] }
  ],

  // Loop-specific fields
  bgSafetyLimit: 75,
  bgTargetPhysicalActivity: { low: 140, high: 160 },
  bgTargetPreprandial: { low: 80, high: 90 },
  insulinModel: {
    modelType: 'rapidAdult',
    actionDelay: 0,
    actionDuration: 21600,  // 6 hours in seconds
    actionPeakOffset: 4500  // 75 minutes in seconds
  },

  // Standard settings
  activeSchedule: "Default",
  units: { bg: "mg/dL" },
  basal: { rateMaximum: { value: 2.5 } },
  bolus: { amountMaximum: { value: 10 } }
}
```

## Terminology Differences

Loop devices use different labels than traditional pumps:

| Standard Term | Loop Term |
|---------------|-----------|
| BG Target | Correction Range |
| ISF / Sensitivity | Insulin Sensitivities |
| I:C Ratio | Carb Ratios |
| Settings Override | Preset |
| Exercise | Workout |

## Settings Overrides (Presets)

Loop devices support temporary overrides with custom correction ranges:

| Device | Available Presets |
|--------|-------------------|
| Tidepool Loop | Workout, Pre-Meal |
| Twiist | Workout, Pre-Meal |
| DIY Loop | Pre-Meal |

## Screenshot

![Loop Settings Display](./screenshots/loop-multi-rate.png)

*Loop settings showing Glucose Safety Limit, Insulin Model, Correction Range, and standard basal/bolus settings.*

## Key Source Files

| File | Purpose |
|------|---------|
| `src/components/settings/NonTandem.js` | Loop-specific rendering (lines 143-161) |
| `src/utils/settings/nonTandemData.js` | Loop data processing, terminology mappings |
| `src/utils/settings/data.js` | `insulinSettings()` and `presetSettings()` functions |
| `src/utils/device.js` | Loop detection functions (`isLoop`, `isDIYLoop`, etc.) |
| `src/utils/constants.js` | `pumpVocabulary`, `settingsOverrides`, `INSULIN_MODEL_LABELS` |
