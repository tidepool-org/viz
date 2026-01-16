# Bolus (Discrete Doses)

Part of the [Insulin Domain](../index.md).

Bolus data represents discrete insulin doses delivered by insulin pumps. This subdomain covers bolus types, the bolus calculator (wizard), and related calculations.

> **Note**: For manual pen/syringe injections, see [Other Insulin](../other/index.md).

---

## Overview

| Data Type | Description | Source |
|-----------|-------------|--------|
| `bolus` | Delivered insulin dose | Insulin pump |
| `wizard` | Bolus calculator inputs | Pump bolus wizard |
| `dosingDecision` | Loop algorithm decision | Loop systems |

These types are interconnected:
- A `wizard` record links to its resulting `bolus`
- A `dosingDecision` may link to both wizard and bolus
- All contribute to total daily insulin statistics

---

## Bolus Types

### Normal Bolus

Immediate insulin delivery, the most common type.

```javascript
{
  type: "bolus",
  subType: "normal",      // or omitted
  normal: 4.5,            // units delivered
  expectedNormal: 4.5,    // units programmed (same if not interrupted)
  normalTime: 1705331400000,
  wizard: "wizard_id",    // linked wizard record (if calculator used)
}
```

### Extended (Square Wave) Bolus

Insulin delivered gradually over a duration.

```javascript
{
  type: "bolus",
  subType: "square",
  extended: 3.0,          // units delivered
  expectedExtended: 3.0,  // units programmed
  duration: 7200000,      // delivery time (2 hours in ms)
  expectedDuration: 7200000,
  normalTime: 1705331400000,
}
```

### Combination (Dual Wave) Bolus

Immediate portion plus extended portion.

```javascript
{
  type: "bolus",
  subType: "dual/square",
  normal: 2.0,            // immediate portion
  expectedNormal: 2.0,
  extended: 2.0,          // extended portion
  expectedExtended: 2.0,
  duration: 3600000,      // 1 hour
  expectedDuration: 3600000,
  normalTime: 1705331400000,
}
```

### Automated Bolus

Algorithm-delivered bolus (Loop systems).

```javascript
{
  type: "bolus",
  subType: "automated",
  normal: 0.5,
  normalTime: 1705331400000,
}
```

---

## Interrupted Boluses

When a bolus is stopped before completion, `normal` (or `extended`) reflects actual delivery while `expectedNormal` (or `expectedExtended`) reflects the original programmed amount.

**Key rule**: `normal < expectedNormal` indicates interruption.

### Example: Interrupted Normal

```javascript
{
  type: "bolus",
  normal: 3.0,            // actually delivered
  expectedNormal: 5.0,    // originally programmed
  // 2.0 units NOT delivered
}
```

### Example: Interrupted Extended

```javascript
{
  type: "bolus",
  extended: 2.0,          // actually delivered
  expectedExtended: 4.0,  // originally programmed
  duration: 3600000,      // actual duration (1 hr)
  expectedDuration: 7200000, // programmed duration (2 hr)
}
```

---

## Override vs Underride

When using the bolus calculator, users may deliver more or less than recommended.

| Scenario | Condition | Visual Indicator |
|----------|-----------|------------------|
| **Override** | `delivered > recommended.net` | Triangle pointing UP |
| **Underride** | `delivered < recommended.net` | Triangle pointing DOWN |
| **Exact** | `delivered === recommended.net` | No indicator |

### Override Example

Calculator recommends 3u, user delivers 5u:

```javascript
{
  type: "wizard",
  recommended: { net: 3.0 },
  bolus: {
    normal: 5.0,  // 2u more than recommended
  }
}
```

### Underride Example

Calculator recommends 8u, user delivers 5u:

```javascript
{
  type: "wizard",
  recommended: { net: 8.0 },
  bolus: {
    normal: 5.0,  // 3u less than recommended
  }
}
```

---

## Statistics

### Total Insulin

Bolus contributions to daily insulin totals:

```javascript
// From StatUtil.getInsulinData()
{
  basal: 24.5,    // from basal records
  bolus: 18.2,    // sum of all bolus.normal + bolus.extended
  insulin: 0,     // manual injections
}
```

### Bolus Calculation

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

## Views Using Bolus Data

| View | Display |
|------|---------|
| **Daily** | Individual boluses on timeline with tooltips |
| **Trends** | Bolus markers at time of day |
| **Basics** | Bolus count and total summaries |
| **Statistics** | Total daily dose breakdown |

---

## Related Documentation

- [Insulin Domain](../index.md) - Parent domain overview
- [Insulin Statistics](../statistics.md) - TDD calculations
- [Bolus Data Model](./data-model.md) - Wizard and dosingDecision details
- [Bolus Calculations](./calculations.md) - Programmed vs delivered
- [Bolus Rendering](./rendering.md) - Visual representation
- [Device-Specific Notes](./device-notes.md) - Manufacturer variations
- [Basal Subdomain](../basal/index.md) - Background insulin
- [Other Insulin](../other/index.md) - Manual pen/syringe injections
- [Tidepool Data Model](../../../concepts/tidepool-data-model.md) - Complete reference

---

## Key Source Files

| Purpose | File |
|---------|------|
| Bolus utilities | `src/utils/bolus.js` |
| Bolus fixtures | `data/bolus/fixtures.js` |
| Validation schema | `src/utils/validation/schema.js` |
| Statistics | `src/utils/StatUtil.js` |
| Daily rendering | `src/components/daily/` |
