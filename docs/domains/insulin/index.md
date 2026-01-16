# Insulin Domain

Insulin delivery data is central to diabetes management visualization. This parent domain covers all forms of insulin delivery and their shared concepts.

---

## Overview

Insulin data answers the fundamental question: **"How much insulin did I get?"**

The platform handles three distinct sources of insulin delivery, each with different characteristics:

| Subdomain | Data Type | Source | Delivery Method |
|-----------|-----------|--------|-----------------|
| [Basal](./basal/index.md) | `basal` | Insulin pump | Continuous background delivery |
| [Bolus](./bolus/index.md) | `bolus`, `wizard` | Insulin pump | Discrete meal/correction doses |
| [Other](./other/index.md) | `insulin` | Pen, syringe, inhalation | Manual injection entries |

All three sources contribute to Total Daily Dose (TDD) and are visualized together in insulin statistics.

---

## Subdomains

### Basal (Background Insulin)

Continuous background insulin delivery from insulin pumps. Basal rates are scheduled or automated.

| File | Content |
|------|---------|
| [index.md](./basal/index.md) | Data structure, delivery types, rate handling |
| [rendering.md](./basal/rendering.md) | Visual representation, rate charts |
| [calculations.md](./basal/calculations.md) | Dose calculations, Time in Auto |

### Bolus (Discrete Doses)

Discrete insulin doses from pumps, typically for meals or corrections.

| File | Content |
|------|---------|
| [index.md](./bolus/index.md) | Bolus types (normal, extended, combo) |
| [rendering.md](./bolus/rendering.md) | Bolus shapes, tooltip rendering |
| [calculations.md](./bolus/calculations.md) | Override/underride, interruptions |
| [data-model.md](./bolus/data-model.md) | Wizard, dosingDecision structures |
| [device-notes.md](./bolus/device-notes.md) | Manufacturer variations |

### Other (Manual Injections)

Manual insulin entries from pens, syringes, or inhaled insulin (Afrezza).

| File | Content |
|------|---------|
| [index.md](./other/index.md) | `{type: insulin}` data, acting types |
| [rendering.md](./other/rendering.md) | Injection tooltips |

---

## Shared Concepts

### Insulin Types

Different insulin formulations have different action profiles:

| Acting Type | Onset | Peak | Duration | Examples |
|-------------|-------|------|----------|----------|
| **Rapid** | 15 min | 1 hr | 3-4 hr | Humalog, Novolog, Fiasp |
| **Short** | 30 min | 2-3 hr | 5-6 hr | Regular (Humulin R) |
| **Intermediate** | 2-4 hr | 4-12 hr | 12-18 hr | NPH (Humulin N) |
| **Long** | 2-4 hr | Minimal | 24+ hr | Lantus, Levemir, Tresiba |
| **Ultra-rapid** | 5 min | 1 hr | 2-3 hr | Inhaled (Afrezza) |

### Insulin Units

All insulin is measured in **units (U)**. Display formatting:

```javascript
// From src/utils/format.js
formatInsulin(value, precision = 2) {
  // Returns value rounded to precision with "U" suffix
  return `${round(value, precision)} U`;
}
```

### Insulin On Board (IOB)

IOB represents active insulin from recent boluses that hasn't yet completed its action.

- **Source**: Calculated by pump algorithms or Loop systems
- **Usage**: Prevents "stacking" boluses
- **Display**: Shown in bolus tooltips and dosing decisions

---

## Cross-Subdomain Statistics

Statistics that aggregate all insulin sources are documented in [Insulin Statistics](./statistics.md):

| Statistic | Components | Description |
|-----------|------------|-------------|
| Total Daily Insulin | Basal + Bolus + Other | Sum of all insulin delivery |
| Avg. Daily Insulin | TDD / active days | Average across date range |
| Basal/Bolus Ratio | Basal % / Bolus % | Breakdown by delivery type |

Subdomain-specific statistics:
- **Time in Auto**: Basal only → [basal/calculations.md](./basal/calculations.md)
- **Override/Underride**: Bolus only → [bolus/calculations.md](./bolus/calculations.md)

---

## Data Flow

```
Raw Data (basal, bolus, wizard, insulin)
              ↓
         DataUtil
    (normalize, enrich with IOB)
              ↓
    StatUtil.getInsulinData()
    (sum by type, calculate averages)
              ↓
    stat.js getStatData()
    (format for display)
              ↓
   Stat Component / PDF Views
```

---

## Views Using Insulin Data

| View | Basal | Bolus | Other | Display |
|------|-------|-------|-------|---------|
| **Daily** | Yes | Yes | Yes | Timeline with basal chart, bolus shapes |
| **Trends** | Summary | Summary | Summary | No direct rendering |
| **Basics** | Stats | Stats | Stats | Averages, ratios |
| **Settings** | Schedules | Ratios | — | Pump configuration |

---

## Key Source Files

| Purpose | File |
|---------|------|
| Insulin totals | `src/utils/StatUtil.js` |
| Bolus calculations | `src/utils/bolus.js` |
| Basal calculations | `src/utils/basal.js` |
| Stat definitions | `src/utils/stat.js` |
| Insulin formatting | `src/utils/format.js` |
| Aggregations | `src/utils/AggregationUtil.js` |

---

## See Also

- [Insulin Statistics](./statistics.md) - TDD and ratio calculations
- [Basal Subdomain](./basal/index.md) - Background insulin delivery
- [Bolus Subdomain](./bolus/index.md) - Discrete insulin doses
- [Other Subdomain](./other/index.md) - Manual injection entries
- [Tidepool Data Model](../../concepts/tidepool-data-model.md) - Complete data reference
- [Diabetes Primer](../../concepts/diabetes-primer.md) - Medical terminology
