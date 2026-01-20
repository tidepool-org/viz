# Pump Settings Domain

> **Status**: Phase 3 Implementation  
> **Last Updated**: January 2026

This domain documents pump settings visualization and data structures in `@tidepool/viz`.

---

## Overview

Pump settings display the configuration parameters that control insulin delivery: basal schedules, BG targets, carb ratios, insulin sensitivity factors, and bolus calculator settings. Unlike therapeutic data (boluses, basals), settings represent device configuration at a point in time.

### Why Settings Documentation Matters

Settings are critical for:
- **Clinicians**: Review pump configuration during patient visits
- **Patients**: Verify settings match prescribed values
- **Support**: Troubleshoot delivery issues by examining active settings
- **PDF Reports**: Include complete settings snapshot for records

---

## Data Model Patterns

The codebase supports **three distinct data model patterns** based on manufacturer:

| Pattern | Manufacturers | Key Characteristic |
|---------|---------------|-------------------|
| [Profile-based](./tandem.md) | Tandem | Settings keyed by profile name |
| [Hybrid](./loop.md) | DIY Loop, Tidepool Loop, Twiist | Profile-based + unique Loop fields |
| [Flat-array](./legacy.md) | Animas, Medtronic, Insulet, Microtech | Settings as global arrays |

### Quick Comparison

```javascript
// Profile-based (Tandem)
bgTargets: { "Normal": [...], "Sick": [...] }

// Hybrid (Loop)
bgTargets: { "Default": [...] }
bgSafetyLimit: 75  // Loop-specific field

// Flat-array (Legacy)
bgTarget: [{ start: 0, low: 80, high: 120 }, ...]
```

### Choosing the Right Component

The `PumpSettingsContainer` component routes to the appropriate renderer:

| Manufacturer | Component | Reason |
|--------------|-----------|--------|
| Tandem | `Tandem.js` | Profile-based unified table |
| All others | `NonTandem.js` | Handles flat-array + hybrid |

---

## Settings Types

All manufacturers share these core settings types:

| Setting | Description | Typical Fields |
|---------|-------------|----------------|
| **Basal Schedules** | Background insulin rates | `start`, `rate` (U/hr) |
| **BG Targets** | Target glucose range | Varies by manufacturer |
| **Carb Ratios** | Grams per unit insulin | `start`, `amount` (g/U) |
| **Sensitivity** | Correction factor | `start`, `amount` (mg/dL/U) |
| **Bolus Settings** | Max bolus, calculator config | `amountMaximum`, `calculator` |

### Manufacturer-Specific Settings

| Manufacturer | Unique Settings |
|--------------|-----------------|
| Tandem | Control-IQ annotations, per-profile bolus limits |
| Loop | `bgSafetyLimit`, `insulinModel`, preset overrides |
| Medtronic | Auto Mode schedules |

---

## Architecture

```
PumpSettingsContainer
├── Tandem (profile-based)
│   └── Uses tandemData.js for data processing
│
└── NonTandem (flat-array + hybrid)
    ├── Uses nonTandemData.js for manufacturer variations
    └── Handles: Loop, Animas, Medtronic, Insulet, Microtech
```

### Data Flow

1. `pumpSettings` prop passed to `PumpSettingsContainer`
2. Container detects manufacturer from `source` field
3. Routes to `Tandem` or `NonTandem` component
4. Data utilities (`tandemData.js` / `nonTandemData.js`) process settings
5. Common components (`Table`, `Header`, `CollapsibleContainer`) render UI

---

## Subpages

| Page | Description |
|------|-------------|
| [Tandem](./tandem.md) | Profile-based settings (Tandem pumps) |
| [Loop](./loop.md) | Hybrid settings (DIY Loop, Tidepool Loop, Twiist) |
| [Legacy](./legacy.md) | Flat-array settings (Animas, Medtronic, Insulet, Microtech) |
| [Components](./components.md) | Shared React components |
| [Rendering](./rendering.md) | PDF export and display |

---

## Key Source Files

| Purpose | File |
|---------|------|
| Container/Router | `src/components/settings/common/PumpSettingsContainer.js` |
| Tandem component | `src/components/settings/Tandem.js` |
| NonTandem component | `src/components/settings/NonTandem.js` |
| Tandem data | `src/utils/settings/tandemData.js` |
| NonTandem data | `src/utils/settings/nonTandemData.js` |
| Shared utilities | `src/utils/settings/data.js` |
| PDF export | `src/modules/print/SettingsPrintView.js` |

---

## See Also

- [Insulin Domain](../insulin/index.md) - Basal/bolus delivery visualization
- [Device Events](../device-events/index.md) - Device-related events
- [Reference: Common Props](../../reference/common-props.md) - Shared component properties
