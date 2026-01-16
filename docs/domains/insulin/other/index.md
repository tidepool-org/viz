# Other Insulin (Manual Injections)

Part of the [Insulin Domain](../index.md).

---

## Overview

"Other" insulin refers to manual insulin entries that are not delivered by an insulin pump. This includes:

- **Insulin pens** (pre-filled or cartridge)
- **Syringes** (vial and syringe)
- **Inhaled insulin** (Afrezza)

These entries use the `{type: "insulin"}` data type, distinct from `basal` and `bolus` records.

| Aspect | Details |
|--------|---------|
| **Data Type** | `insulin` |
| **Entry Method** | Manual (app entry, meter sync) |
| **Typical Use** | MDI therapy, pump backup, supplemental insulin |
| **Key Advantage** | Captures non-pump insulin for complete TDD |

---

## Data Structure

```javascript
{
  type: "insulin",
  dose: {
    total: 10,              // Total units injected
    units: "Units"          // Always "Units"
  },
  formulation: {
    actingType: "rapid",    // Insulin acting profile
    name: "Humalog"         // Optional: brand name
  },
  time: "2024-01-15T12:30:00Z",
  // ... common fields
}
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `dose.total` | number | Units of insulin injected |
| `formulation.actingType` | string | Insulin acting profile |
| `formulation.name` | string | Brand name (optional) |

---

## Acting Types

The `formulation.actingType` field indicates the insulin's action profile:

| Acting Type | Value | Typical Duration | Examples |
|-------------|-------|------------------|----------|
| **Rapid** | `"rapid"` | 3-4 hours | Humalog, Novolog, Fiasp |
| **Short** | `"short"` | 5-6 hours | Regular insulin |
| **Intermediate** | `"intermediate"` | 12-18 hours | NPH |
| **Long** | `"long"` | 24+ hours | Lantus, Levemir, Tresiba |

### Acting Type Detection

```javascript
// From src/utils/bolus.js
function getActingType(insulinEvent) {
  return insulinEvent.formulation?.actingType || 'rapid';
}
```

If no acting type is specified, `rapid` is assumed (most common for mealtime insulin).

---

## Use Cases

### Multiple Daily Injections (MDI)

Users on MDI therapy (no pump) track:
- **Background insulin**: Long-acting once or twice daily
- **Mealtime insulin**: Rapid-acting with meals

### Pump + Pen Therapy

Some users supplement pump therapy with:
- **Pen injections**: When pump is disconnected
- **Long-acting backup**: For pump failures

### Inhaled Insulin

Afrezza (inhaled insulin) is entered as:
```javascript
{
  type: "insulin",
  formulation: {
    actingType: "rapid",  // Ultra-rapid profile
    name: "Afrezza"
  }
}
```

---

## Statistics Contribution

Manual insulin entries contribute to total daily insulin calculations:

```javascript
// StatUtil.getInsulinData()
const { basal, bolus, insulin } = this.getInsulinData();
totalInsulin = (basal || 0) + (bolus || 0) + (insulin || 0);
//                                            ^^^^^^^ manual injections
```

In statistics displays, manual insulin appears as "Other":

```javascript
{ id: 'insulin', value: data.insulin, title: 'Other Insulin', legendTitle: 'Other' }
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| Insulin utilities | `src/utils/bolus.js` |
| Acting type handling | `src/utils/bolus.js:getActingType()` |
| Statistics | `src/utils/StatUtil.js` |
| Validation schema | `src/utils/validation/schema.js` |
| Aggregation | `src/utils/AggregationUtil.js` |

---

## See Also

- [Insulin Domain](../index.md) - Parent domain overview
- [Insulin Statistics](../statistics.md) - TDD calculations including "other"
- [Other Insulin Rendering](./rendering.md) - Injection tooltip visuals
- [Bolus Subdomain](../bolus/index.md) - Pump bolus comparison
