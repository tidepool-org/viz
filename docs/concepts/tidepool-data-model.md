# Tidepool Data Model

This document describes the data types used in the Tidepool platform and how they're processed by `@tidepool/viz`. Understanding these types is essential for working with diabetes device data.

> **Related**: See the [Diabetes Primer](./diabetes-primer.md) for explanations of medical terms used here.

---

## Overview

Tidepool aggregates data from various diabetes devices (CGMs, insulin pumps, BGMs, Loop apps) into a unified data model. Each datum has a `type` field identifying its category, and most types have additional `subType` variants.

### All Supported Types

| Type | Description | Primary Source |
|------|-------------|----------------|
| `cbg` | Continuous glucose reading | CGM devices |
| `smbg` | Self-monitored blood glucose | Fingerstick meters |
| `basal` | Basal insulin delivery | Insulin pumps |
| `bolus` | Bolus insulin delivery | Insulin pumps |
| `wizard` | Bolus calculator inputs | Insulin pumps |
| `dosingDecision` | Loop dosing decision | Loop systems |
| `insulin` | Manual insulin injection | MDI users |
| `food` | Carbohydrate/nutrition entry | User input |
| `deviceEvent` | Device events (suspends, primes, alarms) | All devices |
| `pumpSettings` | Pump configuration snapshot | Insulin pumps |
| `upload` | Upload session metadata | All devices |
| `message` | User notes | User input |
| `physicalActivity` | Exercise/activity logs | User input |
| `cgmSettings` | CGM configuration | CGM devices |
| `alert` | Device alerts | All devices |
| `reportedState` | User-reported states | User input |
| `water` | Water intake | User input |

---

## Common Fields

All data types share a common structure:

```javascript
{
  id: "abc123-def456",           // Unique identifier
  type: "cbg",                   // Data type
  time: "2024-01-15T14:30:00Z",  // ISO 8601 UTC timestamp
  deviceTime: "2024-01-15T09:30:00",  // Local device time (no TZ)
  deviceId: "DexG6_123456",      // Device identifier
  uploadId: "upload_789",        // Upload session ID
  timezoneOffset: -300,          // Minutes from UTC
}
```

### Normalized Time Fields

During processing, `DataUtil` adds computed fields for efficient filtering:

| Field | Description |
|-------|-------------|
| `normalTime` | UTC timestamp in milliseconds |
| `normalEnd` | End time for duration-based data (basal) |
| `displayOffset` | Timezone offset for rendering |

---

## Glucose Data

### CBG (Continuous Blood Glucose)

CGM readings typically arrive every 5 minutes (288/day).

```javascript
{
  type: "cbg",
  value: 142,                    // Glucose value
  units: "mg/dL",                // or "mmol/L"
  sampleInterval: 300000,        // ms between readings (5 min)
  // ... common fields
}
```

**Key constants:**
- `CGM_READINGS_ONE_DAY = 288` (expected readings per 24h)
- `CGM_DATA_KEY = 'cbg'`

### SMBG (Self-Monitored Blood Glucose)

Fingerstick meter readings, manually entered or synced.

```javascript
{
  type: "smbg",
  value: 98,
  units: "mg/dL",
  subType: "manual",             // optional: "manual", "linked"
  // ... common fields
}
```

**Key constants:**
- `BGM_DATA_KEY = 'smbg'`

### Blood Glucose Bounds

The platform defines glycemic ranges for statistics:

| Range | mg/dL | mmol/L |
|-------|-------|--------|
| Very Low | < 54 | < 3.0 |
| Low | 54–69 | 3.0–3.8 |
| Target | 70–180 | 3.9–10.0 |
| High | 181–249 | 10.1–13.8 |
| Very High | ≥ 250 | ≥ 13.9 |

These thresholds are configurable via `bgBounds` in patient preferences.

---

## Insulin Data

### Basal

Continuous background insulin delivery. Basals have a `deliveryType` indicating how they were initiated:

```javascript
{
  type: "basal",
  deliveryType: "scheduled",     // see variants below
  rate: 0.85,                    // units per hour
  duration: 3600000,             // duration in ms
  scheduleName: "Weekday",       // active schedule name
  suppressed: { ... },           // overridden basal (for temp/suspend)
  // ... common fields
}
```

**Delivery Types:**

| deliveryType | Description |
|--------------|-------------|
| `scheduled` | Normal programmed basal from schedule |
| `temp` | Temporary basal rate (user-initiated) |
| `suspend` | Delivery suspended (0 units/hr) |
| `automated` | Algorithm-adjusted (Loop, Control-IQ) |

The `suppressed` field contains the basal that *would have* been delivered if not for the temp/suspend/automated override. This enables visualization of what was overridden.

### Bolus

Discrete insulin doses. Boluses have three subtypes:

```javascript
// Normal bolus (immediate delivery)
{
  type: "bolus",
  subType: "normal",
  normal: 4.5,                   // delivered units
  expectedNormal: 5.0,           // programmed (if interrupted)
  wizard: "wizard_id_123",       // linked wizard record
}

// Extended/Square bolus (delivered over time)
{
  type: "bolus",
  subType: "square",
  extended: 3.0,                 // delivered units
  expectedExtended: 3.0,         // programmed
  duration: 7200000,             // delivery duration (2 hrs)
  expectedDuration: 7200000,
}

// Dual/Combination bolus (immediate + extended)
{
  type: "bolus",
  subType: "dual/square",
  normal: 2.0,                   // immediate portion
  extended: 2.0,                 // extended portion
  duration: 3600000,
  // ... expected fields if interrupted
}
```

**Bolus vs expectedNormal:**

When a bolus is interrupted (user cancels, occlusion, etc.), the `normal` field contains what was actually delivered, while `expectedNormal` contains what was programmed. The viz library shows both values to indicate incomplete delivery.

### Wizard

The bolus calculator record captures the inputs used to calculate a recommended bolus:

```javascript
{
  type: "wizard",
  bolus: "bolus_id_123",         // linked bolus record
  
  // User inputs
  bgInput: 185,                  // entered BG value
  carbInput: 45,                 // entered carbs (grams)
  
  // Active settings at time of bolus
  insulinCarbRatio: 12,          // 1u per X grams
  insulinSensitivity: 40,        // 1u lowers BG by X
  bgTarget: {
    target: 100,
    high: 120,
    low: 80,
  },
  
  // Calculator outputs
  recommended: {
    carb: 3.75,                  // insulin for carbs
    correction: 2.125,           // insulin to correct BG
    net: 5.875,                  // total recommended
  },
  
  insulinOnBoard: 1.2,           // active insulin
  // ... common fields
}
```

The wizard record is separate from the bolus because:
1. A user might use the calculator but deliver a different amount
2. Historical settings context is preserved for review
3. The bolus might be interrupted, but wizard inputs remain

### DosingDecision (Loop Systems)

Loop systems (Tidepool Loop, DIY Loop, Twiist) record algorithmic dosing decisions:

```javascript
{
  type: "dosingDecision",
  reason: "normalBolus",         // or "watch", "automatedBolus"
  
  recommendedBolus: {
    amount: 2.5,
  },
  requestedBolus: {
    normal: 2.0,                 // what user actually requested
  },
  
  bgTargetSchedule: [{           // active targets
    start: 0,
    low: 80,
    high: 100,
  }],
  
  pumpSettings: "settings_id",   // linked settings snapshot
  // ... common fields
}
```

### Insulin (Manual/MDI)

For users on multiple daily injections (pens, syringes):

```javascript
{
  type: "insulin",
  dose: {
    total: 10.0,                 // units injected
  },
  formulation: {
    simple: {
      actingType: "long",        // rapid, short, intermediate, long
    },
  },
  // ... common fields
}
```

---

## Food Data

```javascript
{
  type: "food",
  nutrition: {
    carbohydrate: {
      net: 45,                   // grams
      units: "grams",
    },
    // optional: fat, protein, calories
  },
  // ... common fields
}
```

---

## Device Events

The `deviceEvent` type captures various device state changes:

```javascript
{
  type: "deviceEvent",
  subType: "status",             // see variants below
  status: "suspended",
  reason: { suspended: "manual" },
  // ... common fields
}
```

**Common SubTypes:**

| subType | Description |
|---------|-------------|
| `status` | Pump status change (suspend/resume) |
| `prime` | Tubing/cannula prime |
| `reservoirChange` | Cartridge/reservoir changed |
| `alarm` | Device alarm |
| `calibration` | CGM calibration |
| `timeChange` | Device time adjustment |
| `pumpSettingsOverride` | Activity/sleep mode |

### Site Change Events

Infusion site changes are inferred from prime events. Different pumps use different terminology:

| Manufacturer | Reservoir | Tubing | Cannula |
|--------------|-----------|--------|---------|
| Insulet (OmniPod) | Pod Change | Pod Activate | Prime |
| Tandem | Cartridge Change | Tubing Fill | Cannula Fill |
| Medtronic | Rewind | Prime | Cannula Prime |
| Animas | Go Rewind | Go Prime | Cannula Fill |

### Settings Override

Activity modes (sleep, exercise) are recorded:

```javascript
{
  type: "deviceEvent",
  subType: "pumpSettingsOverride",
  overrideType: "sleep",         // or "physicalActivity", "preprandial"
  duration: 28800000,            // 8 hours
  // ... common fields
}
```

---

## Pump Settings

Pump configuration snapshots. Structure varies by manufacturer:

```javascript
{
  type: "pumpSettings",
  activeSchedule: "Weekday",
  
  basalSchedules: {
    "Weekday": [
      { start: 0, rate: 0.8 },        // midnight
      { start: 21600000, rate: 1.0 }, // 6 AM
      { start: 79200000, rate: 0.75 }, // 10 PM
    ],
    "Weekend": [ ... ],
  },
  
  bgTarget: [                    // varies by manufacturer
    { start: 0, low: 80, high: 120 },
  ],
  
  carbRatio: [
    { start: 0, amount: 12 },         // 1u per 12g
    { start: 43200000, amount: 15 },  // noon: 1u per 15g
  ],
  
  insulinSensitivity: [
    { start: 0, amount: 40 },         // 1u lowers 40 mg/dL
  ],
  
  units: {
    bg: "mg/dL",
    carb: "grams",
  },
  
  // ... common fields
}
```

**Manufacturer Variations:**

Settings schemas differ by manufacturer—see `src/utils/validation/schema.js` for exact schemas:

| Field | Animas | Medtronic | OmniPod | Tandem | Loop |
|-------|--------|-----------|---------|--------|------|
| BG Target | `target` + `range` | `low` + `high` | `target` + `high` | `target` only | `low` + `high` |
| Schedule keys | `bgTarget` | `bgTarget` | `bgTarget` | `bgTargets` (plural) | `bgTargets` (plural) |

---

## Upload Metadata

Each upload session is recorded:

```javascript
{
  type: "upload",
  deviceTags: ["insulin-pump", "cgm"],
  deviceModel: "DASH",
  deviceManufacturers: ["Insulet"],
  deviceSerialNumber: "1234567890",
  dataSetType: "continuous",     // or "normal"
  timezone: "America/New_York",
  client: {
    name: "Tidepool Uploader",
    version: "2.50.0",
  },
  // ... common fields
}
```

---

## Messages/Notes

User-entered notes, optionally threaded:

```javascript
{
  type: "message",
  messageText: "Felt low after lunch",
  parentMessage: null,           // or ID for replies
  // ... common fields
}
```

---

## Data Validation

Data is validated using schemas in `src/utils/validation/schema.js`. Invalid data is logged but not displayed. Key validation rules:

1. **Timestamps must be 2008 or later** (no pre-CGM era data)
2. **BG values must be positive**
3. **Basal rates cannot be negative**
4. **Bolus subType must match field presence** (normal bolus can't have `duration`)
5. **Device status annotations must not contain `status/unknown-previous`**

---

## Data Relationships

```
                    ┌─────────────┐
                    │   wizard    │
                    │ (calculator │
                    │   inputs)   │
                    └──────┬──────┘
                           │ links to
                           ▼
┌─────────────┐     ┌─────────────┐
│dosingDecision│───▶│   bolus     │
│   (Loop)    │     │ (delivered) │
└─────────────┘     └─────────────┘
                           │
                           │ delivered during
                           ▼
                    ┌─────────────┐
                    │   basal     │◀─── suppressed by
                    │ (background)│     (shows what was
                    └─────────────┘      overridden)
```

`DataUtil` joins related records during processing:
- `wizard.bolus` ↔ `bolus.id` (bidirectional linking)
- `dosingDecision` ↔ `bolus` (by time proximity)
- `basal.suppressed` contains nested basal object

---

## Key Source Files

| Purpose | File |
|---------|------|
| Type classes (test fixtures) | `data/types.js` |
| Constants & type lists | `src/utils/constants.js` |
| Validation schemas | `src/utils/validation/schema.js` |
| PropTypes definitions | `src/propTypes/index.js` |
| Data processing | `src/utils/data/DataUtil.js` (in blip) |

---

## See Also

- [Diabetes Primer](./diabetes-primer.md) - Medical terminology explained
- [Architecture](../Architecture.md) - System overview and data flow
- [Tidepool Data Model Reference](https://tidepool.org/developers) - Official platform documentation
