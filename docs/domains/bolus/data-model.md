# Bolus Data Model

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

Loop-based systems (Tidepool Loop, DIY Loop, Twiist) record algorithmic dosing decisions.

### Structure

```javascript
{
  type: "dosingDecision",
  id: "decision_abc123",
  time: "2024-01-15T12:30:00Z",
  
  // Decision context
  reason: "normalBolus",         // "normalBolus", "watch", "automatedBolus"
  
  // Algorithm recommendation
  recommendedBolus: {
    amount: 2.5,                 // Units recommended by algorithm
  },
  
  // What user actually requested
  requestedBolus: {
    normal: 2.0,                 // User may accept different amount
  },
  
  // Active settings
  bgTargetSchedule: [{
    start: 0,                    // ms from midnight
    low: 80,
    high: 100,
  }],
  
  // Settings snapshot
  pumpSettings: "settings_id",   // Reference to pumpSettings record
}
```

### Reason Types

| Reason | Description |
|--------|-------------|
| `normalBolus` | User-initiated meal/correction bolus |
| `automatedBolus` | Algorithm auto-correction bolus |
| `watch` | Bolus initiated from Apple Watch |

### DosingDecision ↔ Bolus Linking

`DataUtil` links dosingDecisions to boluses by time proximity:

```javascript
// After processing:
bolus.dosingDecision = dosingDecision;  // Embedded
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

```
┌─────────────────────────────────────────────────────────────┐
│                      BOLUS ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐                                          │
│   │  wizard      │ User enters carbs, BG                    │
│   │  (calculator)│─────────────────────┐                    │
│   └──────┬───────┘                     │                    │
│          │ uses settings               │ links to           │
│          ▼                             │                    │
│   ┌──────────────┐                     │                    │
│   │ pumpSettings │                     │                    │
│   │  - ICR       │                     ▼                    │
│   │  - ISF       │              ┌──────────────┐            │
│   │  - bgTarget  │              │    bolus     │            │
│   └──────────────┘              │  (delivered) │            │
│          ▲                      └──────┬───────┘            │
│          │ references                  │                    │
│   ┌──────┴───────┐                     │                    │
│   │dosingDecision│ Loop algorithm      │                    │
│   │  (Loop only) │─────────────────────┘                    │
│   └──────────────┘                                          │
│                                                              │
│   ┌──────────────┐                                          │
│   │   insulin    │ Manual injections (MDI)                  │
│   │   (pen)      │ Not linked to other records              │
│   └──────────────┘                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
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
| Data processing | (in blip) `DataWorker` |
| Tooltip rendering | `src/components/daily/bolustooltip/` |

---

## See Also

- [Bolus Overview](./index.md)
- [Bolus Calculations](./calculations.md)
- [Tidepool Data Model](../../concepts/tidepool-data-model.md)
