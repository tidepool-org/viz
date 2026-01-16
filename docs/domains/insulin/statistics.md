# Insulin Statistics

This document covers insulin statistics that aggregate data across all delivery sources (basal, bolus, other).

---

## Total Daily Dose (TDD)

**What it measures**: Total insulin delivered per day across all sources.

**Why it matters**: TDD is a key metric for insulin therapy management. It helps clinicians assess overall insulin requirements and adjust therapy.

**Applies to**: Basal + Bolus + Other insulin

### Calculation

```javascript
// StatUtil.getTotalInsulinData() - src/utils/StatUtil.js
getTotalInsulinData() {
  const { basal, bolus, insulin } = this.getInsulinData();
  return {
    totalInsulin: (basal || 0) + (bolus || 0) + (insulin || 0)
  };
}
```

### Components

| Component | Data Type | Calculation Method |
|-----------|-----------|-------------------|
| **Basal** | `basal` | `getTotalBasalFromEndpoints()` |
| **Bolus** | `bolus`, `wizard` | `getTotalInsulin()` |
| **Other** | `insulin` | Sum of `dose.total` values |

### Screenshot

![Total Insulin](./screenshots/Total%20Insulin.png)

---

## Average Daily Insulin

**What it measures**: Average TDD across the selected date range.

**Why it matters**: Smooths out day-to-day variation to show overall insulin needs.

**Applies to**: Basal + Bolus + Other insulin

### Calculation

```javascript
// StatUtil.getInsulinData() - src/utils/StatUtil.js
if (activeDays > 1) {
  basal = basal / activeDays;
  bolus = bolus / activeDays;
  insulin = insulin / activeDays;
}
```

**Note**: `activeDays` counts unique dates with insulin data, not calendar days. This prevents artificially low averages from incomplete data.

### Screenshot

![Avg. Daily Insulin](./screenshots/Avg.%20Daily%20Insulin.png)

---

## Basal/Bolus Ratio

**What it measures**: Percentage breakdown of insulin by delivery type.

**Why it matters**: Typical ratios are 50/50 or 40/60 (basal/bolus). Significant deviation may indicate therapy adjustments needed.

### Display

The stat shows a horizontal bar with:
- **Basal** (left): Background insulin percentage
- **Bolus** (middle): Meal/correction percentage
- **Other** (right): Pen/injection percentage (if present)

### Data Structure

```javascript
// src/utils/stat.js
statData.data = [
  { id: 'insulin', value: data.insulin, title: 'Other Insulin', legendTitle: 'Other' },
  { id: 'bolus', value: data.bolus, title: 'Bolus Insulin', legendTitle: 'Bolus' },
  { id: 'basal', value: data.basal, title: 'Basal Insulin', legendTitle: 'Basal' },
];
```

---

## Basal Insulin Calculations

### Total Basal from Endpoints

```javascript
// src/utils/basal.js:210-218
function getTotalBasalFromEndpoints(data, endpoints) {
  return _.reduce(data, (total, datum) => {
    const duration = getBasalDurationWithinRange(datum, endpoints);
    return total + getSegmentDose(duration, datum.rate);
  }, 0);
}
```

### Segment Dose Calculation

```javascript
// src/utils/basal.js:173-176
function getSegmentDose(duration, rate) {
  // duration in ms, rate in U/hr
  const hours = duration / MS_IN_HOUR;
  return _.round(hours * rate, 3);
}
```

This handles partial basal segments at range boundaries (start/end of selected date range).

---

## Bolus Insulin Calculations

### Getting Delivered Insulin

The `getDelivered()` function extracts actual insulin delivered, handling various bolus types:

```javascript
// src/utils/bolus.js:153-172
function getDelivered(insulinEvent) {
  // Handle insulin type (pen/injection)
  if (insulinEvent.type === 'insulin') {
    return insulinEvent.dose?.total;
  }
  
  // Handle combo boluses
  if (insulinEvent.extended && insulinEvent.normal) {
    return insulinEvent.extended + insulinEvent.normal;
  }
  
  // Handle interrupted boluses
  // Returns actual delivered amount
}
```

### Summing Boluses

```javascript
// src/utils/bolus.js:293-297
function getTotalInsulin(insulinEvents) {
  return _.sumBy(insulinEvents, getDelivered);
}
```

---

## Insulin On Board (IOB)

**What it measures**: Active insulin remaining from recent boluses.

**Why it matters**: Prevents "stacking" of boluses and informs dosing decisions.

### Data Source

IOB comes from dosing decision records (primarily Loop/automated systems):

```javascript
// DataUtil.js
d.insulinOnBoard = d.dosingDecision.insulinOnBoard?.amount;
```

Or from wizard records:

```javascript
wizard.insulinOnBoard  // Direct property on wizard
```

### Display

IOB appears in bolus tooltips:

```javascript
// BolusTooltip.js
<div className={styles.label}>{t('IOB')}</div>
<div className={styles.value}>{formatInsulin(iob)}</div>
```

---

## Statistics Display

### Stat Types

| Stat ID | Description |
|---------|-------------|
| `totalInsulin` | Total insulin (basal + bolus + other) |
| `averageDailyDose` | TDD with optional weight-based calculation |

### Formatting

| Format | Example | Usage |
|--------|---------|-------|
| `statFormats.units` | "45.5 U" | Standard insulin display |
| `statFormats.unitsPerKg` | "0.65 U/kg" | Weight-based dosing |

---

## Print View Display

### Daily PDF

```javascript
// DailyPrintView.js
const { basal: totalBasal, bolus: totalBolus, insulin: totalOther } = 
  _.get(stats, 'totalInsulin.data.raw', {});
const totalInsulin = (totalBasal || 0) + (totalBolus || 0) + (totalOther || 0);
```

The daily summary includes:
- Total insulin for the day
- Basal/bolus percentage breakdown

### Basics PDF

Shows average daily insulin as a horizontal bar stat with basal/bolus ratio.

---

## Key Source Files

| Purpose | File |
|---------|------|
| Insulin calculations | `src/utils/StatUtil.js` |
| Bolus utilities | `src/utils/bolus.js` |
| Basal utilities | `src/utils/basal.js` |
| Stat definitions | `src/utils/stat.js` |
| Insulin formatting | `src/utils/format.js` |
| Aggregations | `src/utils/AggregationUtil.js` |
| Bolus tooltip | `src/components/daily/bolustooltip/BolusTooltip.js` |
| PDF views | `src/modules/print/DailyPrintView.js` |

---

## See Also

- [Insulin Domain](./index.md) - Parent domain overview
- [Basal Calculations](./basal/calculations.md) - Basal-specific stats (Time in Auto)
- [Bolus Calculations](./bolus/calculations.md) - Bolus-specific stats (Override/Underride)
- [Other Insulin](./other/index.md) - Manual injection data
