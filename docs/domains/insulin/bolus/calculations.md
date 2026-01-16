# Bolus Calculations

This document details the calculations used for bolus data, including programmed vs delivered amounts and override/underride detection.

---

## Programmed vs Delivered

The distinction between programmed and delivered insulin is critical for understanding interrupted boluses.

### Normal Bolus Fields

| Field | Description |
|-------|-------------|
| `normal` | Units actually delivered |
| `expectedNormal` | Units originally programmed |

**Rule**: If `expectedNormal` exists and `normal < expectedNormal`, the bolus was interrupted.

### Extended Bolus Fields

| Field | Description |
|-------|-------------|
| `extended` | Units actually delivered |
| `expectedExtended` | Units originally programmed |
| `duration` | Actual delivery time (ms) |
| `expectedDuration` | Programmed delivery time (ms) |

### Interruption Detection

```javascript
// src/utils/bolus.js (simplified logic)
export function isInterruptedBolus(bolus) {
  const normalInterrupted = bolus.expectedNormal && bolus.normal < bolus.expectedNormal;
  const extendedInterrupted = bolus.expectedExtended && bolus.extended < bolus.expectedExtended;
  return normalInterrupted || extendedInterrupted;
}
```

### Undelivered Insulin

```javascript
function getUndeliveredInsulin(bolus) {
  let undelivered = 0;
  
  if (bolus.expectedNormal) {
    undelivered += bolus.expectedNormal - bolus.normal;
  }
  
  if (bolus.expectedExtended) {
    undelivered += bolus.expectedExtended - bolus.extended;
  }
  
  return undelivered;
}
```

---

## Total Bolus Calculation

### Formula

$$
I_{total} = I_{normal} + I_{extended}
$$

Where:
- $I_{total}$ = total insulin from bolus
- $I_{normal}$ = immediate portion (may be 0)
- $I_{extended}$ = extended portion (may be 0)

### Implementation

```javascript
// src/utils/bolus.js
export function getTotalInsulin(bolusData) {
  return _.reduce(bolusData, (total, bolus) => {
    const normalDelivered = _.get(bolus, 'normal', 0);
    const extendedDelivered = _.get(bolus, 'extended', 0);
    return total + normalDelivered + extendedDelivered;
  }, 0);
}
```

---

## Override/Underride Calculation

When a wizard record exists, we compare delivered to recommended.

### Formula

$$
\Delta I = I_{delivered} - I_{recommended}
$$

Where:
- $\Delta I > 0$ → **Override** (delivered more than recommended)
- $\Delta I < 0$ → **Underride** (delivered less than recommended)
- $\Delta I = 0$ → **Exact** (matched recommendation)

### Implementation

```javascript
function getBolusDelivered(bolus) {
  return (bolus.normal || 0) + (bolus.extended || 0);
}

function getOverrideAmount(wizard) {
  const delivered = getBolusDelivered(wizard.bolus);
  const recommended = wizard.recommended?.net || 0;
  return delivered - recommended;
}

function isOverride(wizard) {
  return getOverrideAmount(wizard) > 0;
}

function isUnderride(wizard) {
  return getOverrideAmount(wizard) < 0;
}
```

### Special Cases

| Scenario | Delivered | Recommended | Classification |
|----------|-----------|-------------|----------------|
| Zero override | 2u | 0u | Override |
| Zero underride | 0u | 2u | Underride |
| Negative correction | 2u | -1u | Override (2 > -1) |

---

## Interrupted Override/Underride

A bolus can be both interrupted AND an override/underride.

### Example: Interrupted Underride

```javascript
{
  type: "wizard",
  recommended: { net: 10 },
  bolus: {
    normal: 5,         // Delivered
    expectedNormal: 8, // Programmed (user chose to underride by 2u)
  }
}
```

Analysis:
- **Underride**: User programmed 8u when 10u recommended (underride by 2u)
- **Interrupted**: Only 5u delivered of 8u programmed (3u undelivered)
- **Total shortfall**: 5u delivered vs 10u recommended (5u less)

### Visual Representation

The visualization shows multiple markers:
1. **Recommended line** at 10u
2. **Programmed indicator** at 8u (underride triangle)
3. **Delivered bar** to 5u
4. **Interrupted marker** showing 3u undelivered

---

## Extended Bolus Proportion

For extended and combo boluses, we track delivery proportion.

### Formula

$$
P_{delivered} = \frac{t_{actual}}{t_{programmed}} = \frac{I_{delivered}}{I_{programmed}}
$$

Assuming constant delivery rate, time proportion equals insulin proportion.

### Example

```javascript
{
  extended: 2,
  expectedExtended: 4,
  duration: 3600000,      // 1 hour
  expectedDuration: 7200000,  // 2 hours
}
// Proportion = 2/4 = 0.5 (50% delivered)
// Time = 1hr/2hr = 0.5 (50% of time)
```

---

## Combo Bolus Calculation

### Total Delivered

$$
I_{delivered} = I_{normal} + I_{extended}
$$

### Total Programmed

$$
I_{programmed} = I_{expectedNormal} + I_{expectedExtended}
$$

### Interruption Point

Combo boluses can be interrupted during either phase:

| Interrupted During | normal | expectedNormal | extended | expectedExtended |
|-------------------|--------|----------------|----------|------------------|
| **Normal portion** | < expected | programmed | 0 | programmed |
| **Extended portion** | delivered | = normal | < expected | programmed |
| **Neither** | delivered | = normal | delivered | = extended |

---

## Statistics Integration

### Daily Average Calculation

When viewing multiple days, bolus totals are averaged:

$$
I_{dailyAvg} = \frac{\sum_{d} I_{d}}{n_{days}}
$$

But only days with insulin data count:

```javascript
// From StatUtil.getInsulinData()
const activeDaysWithInsulinData = uniqueDatumDates.size;

if (this.activeDays > 1 && activeDaysWithInsulinData > 1) {
  basalBolusData.bolus = basalBolusData.bolus / activeDaysWithInsulinData;
}
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| Bolus utilities | `src/utils/bolus.js` |
| Statistics | `src/utils/StatUtil.js` |
| Test fixtures | `data/bolus/fixtures.js` |

---

## See Also

- [Bolus Overview](./index.md)
- [Bolus Data Model](./data-model.md)
- [Bolus Rendering](./rendering.md)
