# Bolus Data Model

Part of the [Bolus Subdomain](./index.md) in the [Insulin Domain](../index.md).

This document covers the detailed data structures for bolus-related types: `wizard`, `dosingDecision`, and `insulin`.

---

## Wizard (Bolus Calculator)

The `wizard` record captures the inputs and settings used when calculating a bolus dose. It preserves the context of the decision for later review.

### Structure

```javascript
{
  type: "wizard",
  id: "wizard_abc123",
  time: "2024-01-15T12:30:00Z",
  
  // User inputs
  bgInput: 185,                  // Current BG (if entered)
  carbInput: 45,                 // Carbs to eat (grams)
  carbUnits: "grams",            // or "exchanges"
  
  // Active pump settings at bolus time
  insulinCarbRatio: 12,          // 1 unit per 12g carbs
  insulinSensitivity: 40,        // 1 unit lowers BG by 40 mg/dL
  bgTarget: {
    target: 100,                 // Target BG
    high: 120,                   // Upper bound (varies by pump)
    low: 80,                     // Lower bound (varies by pump)
    range: 20,                   // Some pumps use range instead
  },
  
  // Calculator recommendations
  recommended: {
    carb: 3.75,                  // Insulin for carbs: carbInput / insulinCarbRatio
    correction: 2.125,           // Insulin to correct BG: (bgInput - target) / ISF
    net: 5.875,                  // Total after IOB adjustment
  },
  
  insulinOnBoard: 1.2,           // Active insulin from previous boluses
  
  // Linked bolus
  bolus: "bolus_xyz789",         // ID of resulting bolus (or embedded object)
}
```

### Recommendation Calculation

The wizard calculates three components:

1. **Carb Insulin**: 
   $$I_{carb} = \frac{carbInput}{ICR}$$

2. **Correction Insulin**:
   $$I_{correction} = \frac{BG_{current} - BG_{target}}{ISF}$$

3. **Net Recommendation** (after IOB):
   $$I_{net} = I_{carb} + I_{correction} - IOB$$

Where:
- $ICR$ = Insulin-to-Carb Ratio
- $ISF$ = Insulin Sensitivity Factor
- $IOB$ = Insulin on Board

### BG Target Variations

Different pump manufacturers store BG targets differently:

| Manufacturer | Fields |
|--------------|--------|
| **Medtronic** | `low`, `high` (range) |
| **Animas** | `target`, `range` (±range from target) |
| **OmniPod** | `target`, `high` (correct above target) |
| **Tandem** | `target` only |
| **Loop** | `low`, `high` |

### Wizard ↔ Bolus Linking

During data processing, `DataUtil` joins wizard and bolus records:

```javascript
// After processing:
wizard.bolus = { /* full bolus object */ }  // Embedded
bolus.wizard = wizard.id                     // Back-reference
```

This enables:
- Displaying wizard context in bolus tooltips
- Calculating override/underride status
- Showing recommended vs delivered

---

## DosingDecision (Loop Systems)

Loop-based systems (Tidepool Loop, DIY Loop, Twiist) record algorithmic dosing decisions that capture the full context of automated insulin dosing.

### Complete Structure

```javascript
{
  type: "dosingDecision",
  id: "decision_abc123",
  time: "2024-01-15T12:30:00Z",
  
  // Decision context
  reason: "normalBolus",           // See reason types below
  
  // Algorithm recommendation
  recommendedBolus: {
    amount: 2.5,                   // Total units recommended
  },
  
  // What user actually requested
  requestedBolus: {
    normal: 2.0,                   // User may accept different amount
  },
  
  // Food data (carbs)
  food: {
    nutrition: {
      carbohydrate: {
        net: 45,                   // Current carb estimate (may be edited)
      },
    },
  },
  originalFood: {                  // Original carb entry (if edited)
    nutrition: {
      carbohydrate: {
        net: 50,                   // Original value at bolus time
      },
    },
  },
  
  // Glucose inputs
  smbg: {                          // Manual BG entry (if present)
    value: 185,
  },
  bgHistorical: [                  // Recent CGM readings
    { value: 170 },
    { value: 180 },
    { value: 185 },                // Most recent (used if no smbg)
  ],
  
  // Active insulin
  insulinOnBoard: {
    amount: 1.2,                   // Current IOB in units
  },
  
  // Settings context
  bgTargetSchedule: [{
    start: 0,                      // ms from midnight
    low: 80,
    high: 100,
  }],
  
  // Associations to related records
  associations: [
    { reason: "bolus", id: "bolus_xyz" },
    { reason: "pumpSettings", id: "settings_123" },
  ],
}
```

### Reason Types

| Reason | Description | Typical Source |
|--------|-------------|----------------|
| `normalBolus` | User-initiated meal/correction bolus | Tidepool Loop app |
| `simpleBolus` | Simple bolus without full calculator | Quick bolus entry |
| `watchBolus` | Bolus initiated from Apple Watch | watchOS app |
| `oneButtonBolus` | Single-tap preset bolus | Quick action |
| `loop` | Automated algorithm decision (not bolus-related) | Background processing |

Only bolus-related reasons (`normalBolus`, `simpleBolus`, `watchBolus`, `oneButtonBolus`) are joined to bolus records.

### Data Processing

`DataUtil` performs several transformations during normalization:

#### Field Normalization

```javascript
// src/utils/DataUtil.js:351-371
// Normalize requestedBolus: use 'normal' instead of deprecated 'amount'
if (d.requestedBolus?.normal == null && d.requestedBolus?.amount != null) {
  d.requestedBolus.normal = d.requestedBolus.amount;
  delete d.requestedBolus.amount;
}

// Normalize recommendedBolus: calculate 'amount' from normal + extended
if (d.recommendedBolus?.amount == null && 
    (d.recommendedBolus.normal != null || d.recommendedBolus.extended != null)) {
  d.recommendedBolus.amount = 
    (d.recommendedBolus.normal ?? 0) + (d.recommendedBolus.extended ?? 0);
}
```

#### DosingDecision ↔ Bolus Joining

```javascript
// src/utils/DataUtil.js:459-523
// 1. First, try definitive association by ID
d.dosingDecision = _.find(
  this.bolusDosingDecisionDatumsByIdMap,
  ({ associations = [] }) => 
    _.some(associations, { reason: 'bolus', id: d.id })
);

// 2. If no definitive match, find closest within 1 minute
if (!d.dosingDecision) {
  const proximateDosingDecisions = _.filter(
    this.bolusDosingDecisionDatumsByIdMap,
    ({ time }) => Math.abs(time - d.time) <= MS_IN_MIN
  );
  // Prefer matching requestedBolus.normal to bolus.normal
  d.dosingDecision = proximateDosingDecisions[0];
}

// 3. Translate dosingDecision data onto bolus fields
if (d.dosingDecision) {
  d.carbInput = d.dosingDecision.originalFood?.nutrition?.carbohydrate?.net
            ?? d.dosingDecision.food?.nutrition?.carbohydrate?.net;
  d.bgInput = d.dosingDecision.smbg?.value 
           || _.last(d.dosingDecision.bgHistorical)?.value;
  d.insulinOnBoard = d.dosingDecision.insulinOnBoard?.amount;
}
```

### Carb Input Priority

When determining carb input for bolus display:

1. **`originalFood`** - Original carb entry at bolus time (preferred)
2. **`food`** - Current carb value (may have been edited after bolus)

This ensures bolus tooltips show the carbs the user intended at decision time, not later edits.

### BG Input Priority

When determining glucose input for bolus context:

1. **`smbg.value`** - Manual fingerstick entry (if present)
2. **`_.last(bgHistorical).value`** - Most recent CGM reading

### Interrupted Bolus Detection

If a bolus is interrupted (delivered less than requested):

```javascript
// Set expectedNormal from dosingDecision if bolus was interrupted
const requestedNormal = d.dosingDecision.requestedBolus?.normal;
if ((!d.expectedNormal && requestedNormal) && (d.normal !== requestedNormal)) {
  d.expectedNormal = requestedNormal;
}
```

This enables the bolus tooltip to show "Interrupted: delivered X of Y units".

### Associations

DosingDecision records link to related data via the `associations` array:

| Reason | Links To | Purpose |
|--------|----------|---------|
| `bolus` | Bolus record | The resulting insulin delivery |
| `pumpSettings` | PumpSettings record | Active settings at decision time |
| `food` | Food record | Associated carb entry |

After processing, associated pump settings are attached:

```javascript
d.dosingDecision.pumpSettings = pumpSettingsDatumsByIdMap[
  _.find(d.dosingDecision.associations, { reason: 'pumpSettings' })?.id
];
```

### IOB (Insulin on Board)

`insulinOnBoard.amount` represents the active insulin from previous boluses at decision time. This is:

- **Calculated by Loop algorithm** based on insulin action curves
- **Used in net recommendation** to prevent stacking
- **Displayed in bolus tooltips** for context

```javascript
// IOB is extracted from dosingDecision during bolus joining
d.insulinOnBoard = d.dosingDecision.insulinOnBoard?.amount;
```

---

## Insulin (Manual Injections)

For MDI (multiple daily injection) users who don't use pumps.

### Structure

```javascript
{
  type: "insulin",
  id: "insulin_abc123",
  time: "2024-01-15T08:00:00Z",
  
  dose: {
    total: 10.0,                 // Units injected
  },
  
  formulation: {
    simple: {
      actingType: "long",        // Insulin type
    },
  },
}
```

### Acting Types

| Type | Duration | Examples |
|------|----------|----------|
| `rapid` | 3-5 hours | Humalog, Novolog, Fiasp |
| `short` | 5-8 hours | Regular insulin |
| `intermediate` | 12-18 hours | NPH |
| `long` | 20-24+ hours | Lantus, Levemir, Tresiba |

### Insulin in Statistics

Manual insulin is included in total daily dose:

```javascript
// StatUtil.getInsulinData()
{
  basal: 24.5,    // From pump basal records
  bolus: 18.2,    // From pump bolus records
  insulin: 10.0,  // From insulin (pen) records
}
```

---

## Data Relationships

### Traditional Pump Flow (Wizard)

```
┌──────────────┐                     ┌──────────────┐
│   wizard     │ ──── links to ────▶ │    bolus     │
│  (calculator)│                     │  (delivered) │
└──────┬───────┘                     └──────────────┘
       │ uses settings
       ▼
┌──────────────┐
│ pumpSettings │
│  - ICR       │
│  - ISF       │
│  - bgTarget  │
└──────────────┘
```

### Loop System Flow (DosingDecision)

```
┌──────────────┐
│dosingDecision│ ◀─── Algorithm calculates recommendation
│  - food      │
│  - bgInput   │
│  - IOB       │
└──────┬───────┘
       │ associations array
       ▼
┌──────────────────────────────────────────────┐
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  bolus   │  │pumpSettings│ │   food    │  │
│  │(delivered)│  │ (active)  │ │  (carbs)  │  │
│  └──────────┘  └──────────┘  └────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### After Processing

```javascript
// Traditional pump:
wizard.bolus = { /* full bolus object */ }
bolus.wizard = wizard.id

// Loop systems:
bolus.dosingDecision = { /* full dosingDecision object */ }
bolus.dosingDecision.pumpSettings = { /* associated settings */ }

// Translated fields on bolus:
bolus.carbInput    // From dosingDecision.food or wizard.carbInput
bolus.bgInput      // From dosingDecision.smbg/bgHistorical or wizard.bgInput
bolus.insulinOnBoard // From dosingDecision.insulinOnBoard
```

---

## Validation Rules

From `src/utils/validation/schema.js`:

### Wizard

```javascript
const wizard = {
  ...common,
  bgInput: { ...minZero, ...optional },
  bolus: { type: 'string', pattern: patterns.id },  // Required link
  carbInput: { ...minZero, ...optional },
  insulinCarbRatio: { ...minZero, ...optional },
  insulinOnBoard: { ...minZero, ...optional },
  insulinSensitivity: { ...minZero, ...optional },
  recommended: {
    type: 'object',
    props: {
      carb: { ...minZero, ...optional },
      correction: { type: 'number', ...optional },  // Can be negative
      net: { type: 'number', ...optional },
    },
    ...optional,
  },
};
```

### Insulin

```javascript
const insulin = {
  ...common,
  dose: {
    type: 'object',
    props: {
      total: minZero,  // Required
    },
  },
  formulation: {
    type: 'object',
    props: {
      simple: {
        type: 'object',
        props: {
          actingType: { 
            type: 'string', 
            enum: ['rapid', 'short', 'intermediate', 'long'] 
          },
        },
      },
    },
    ...optional,
  },
};
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| Type classes | `data/types.js` |
| Validation | `src/utils/validation/schema.js` |
| DosingDecision normalization | `src/utils/DataUtil.js:351-371` |
| Bolus ↔ DosingDecision joining | `src/utils/DataUtil.js:459-523` |
| Bolus ↔ Wizard joining | `src/utils/DataUtil.js:435-457` |
| Tooltip rendering | `src/components/daily/bolustooltip/` |

---

## See Also

- [Bolus Overview](./index.md)
- [Bolus Calculations](./calculations.md)
- [Tidepool Data Model](../../concepts/tidepool-data-model.md)
