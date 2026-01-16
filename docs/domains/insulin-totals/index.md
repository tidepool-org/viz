# Insulin Totals Domain

This section covers how insulin totals, Total Daily Dose (TDD), and Insulin On Board (IOB) are calculated and displayed in Tidepool viz.

## Overview

Insulin totals aggregate insulin delivery data from multiple sources:

- **Basal insulin** - Background insulin delivery from pump
- **Bolus insulin** - Meal and correction boluses
- **Other insulin** - Pen/injection insulin (manual entries)

## Total Daily Dose (TDD)

### Calculation

TDD is calculated in `StatUtil.js` by summing all insulin sources:

```javascript
// StatUtil.getTotalInsulinData() - lines 740-751
getTotalInsulinData() {
  const { basal, bolus, insulin } = this.getInsulinData();
  return {
    totalInsulin: (basal || 0) + (bolus || 0) + (insulin || 0)
  };
}
```

### Components

| Component | Source | Calculation Method |
|-----------|--------|-------------------|
| **Basal** | `basal` data type | `getTotalBasalFromEndpoints()` |
| **Bolus** | `bolus`, `wizard` data | `getTotalInsulin()` |
| **Other** | `insulin` data type | Sum of `dose.total` values |

### Daily Averages

When the date range spans multiple days, the system calculates averages:

```javascript
// StatUtil.getInsulinData() - lines 189-218
if (activeDays > 1) {
  basal = basal / activeDays;
  bolus = bolus / activeDays;
  insulin = insulin / activeDays;
}
```

The `activeDays` value uses unique dates with insulin data, not calendar days.

## Bolus Insulin Calculations

### Getting Delivered Insulin

The `getDelivered()` function (`src/utils/bolus.js:153-172`) extracts the actual insulin delivered:

```javascript
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
  // ...
}
```

### Summing Boluses

```javascript
// src/utils/bolus.js:293-297
function getTotalInsulin(insulinEvents) {
  return _.sumBy(insulinEvents, getDelivered);
}
```

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

## Insulin On Board (IOB)

### Data Source

IOB comes from dosing decision records (primarily Loop systems):

```javascript
// DataUtil.js line 513
d.insulinOnBoard = d.dosingDecision.insulinOnBoard?.amount;
```

Or from wizard records:

```javascript
wizard.insulinOnBoard  // Direct property on wizard
```

### Display

IOB is displayed in the bolus tooltip (`BolusTooltip.js:275-280`):

```javascript
<div className={styles.label}>{t('IOB')}</div>
<div className={styles.value}>{formatInsulin(iob)}</div>
```

### Schema

IOB validation (`src/utils/validation/schema.js:408`):

```javascript
insulinOnBoard: { ...minZero, ...optional }
```

## Statistics Display

### Stat Types

Two main insulin stats (`src/utils/stat.js:73-87`):

| Stat ID | Description |
|---------|-------------|
| `totalInsulin` | Total insulin (basal + bolus + other) |
| `averageDailyDose` | TDD with optional weight-based calculation |

### Data Structure

The stat data includes breakdown by type (`src/utils/stat.js:775-808`):

```javascript
statData.data = [
  { id: 'insulin', value: data.insulin, title: 'Other Insulin', legendTitle: 'Other' },
  { id: 'bolus', value: data.bolus, title: 'Bolus Insulin', legendTitle: 'Bolus' },
  { id: 'basal', value: data.basal, title: 'Basal Insulin', legendTitle: 'Basal' },
];
```

### Formatting

| Format | Example | Usage |
|--------|---------|-------|
| `statFormats.units` | "45.5 U" | Standard insulin display |
| `statFormats.unitsPerKg` | "0.65 U/kg" | Weight-based dosing |

## Print View Display

### Daily PDF

```javascript
// DailyPrintView.js:588-589
const { basal: totalBasal, bolus: totalBolus, insulin: totalOther } = 
  _.get(stats, 'totalInsulin.data.raw', {});
const totalInsulin = (totalBasal || 0) + (totalBolus || 0) + (totalOther || 0);
```

The daily summary includes:
- Total insulin for the day
- Basal/bolus percentage breakdown

### Basics PDF

Shows average daily insulin as a horizontal bar stat with basal/bolus ratio.

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/StatUtil.js` | `getInsulinData()`, `getTotalInsulinData()` |
| `src/utils/bolus.js` | `getDelivered()`, `getTotalInsulin()` |
| `src/utils/basal.js` | `getTotalBasalFromEndpoints()`, `getSegmentDose()` |
| `src/utils/stat.js` | Stat formatting and definitions |
| `src/utils/format.js` | `formatInsulin()` utility |
| `src/utils/AggregationUtil.js` | Bolus/insulin aggregations |
| `src/components/daily/bolustooltip/BolusTooltip.js` | IOB display |
| `src/modules/print/DailyPrintView.js` | PDF insulin rendering |

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

## Related Topics

- [Basal Domain](../basal/index.md) - Basal rate handling
- [Bolus Domain](../bolus/index.md) - Bolus calculations
- [Daily View](../../views/daily.md) - Where insulin totals are displayed
