# Carbs Statistics

This document covers how carbohydrate statistics are calculated and displayed in Tidepool viz.

## Overview

Carb statistics aggregate carbohydrate intake from multiple data sources and present them in various views including the Basics view and PDF reports.

## Calculation Method

Carb statistics are calculated in `StatUtil.getCarbsData()` (`src/utils/StatUtil.js:221-288`).

### Data Sources

The method aggregates carbs from two sources:

1. **Wizard data** - Carbs from bolus calculator entries
2. **Food data** - Standalone food/carb entries

### Algorithm

```javascript
getCarbsData() {
  // 1. Sum carbs from wizard events
  const wizardCarbs = _.sumBy(
    _.filter(this.data.wizard, w => w.carbInput > 0),
    'carbInput'
  );
  
  // 2. Sum carbs from food events  
  const foodCarbs = _.sumBy(
    _.filter(this.data.food, f => f.nutrition?.carbohydrate?.net > 0),
    'nutrition.carbohydrate.net'
  );
  
  // 3. Handle unit separation (grams vs exchanges)
  // 4. Calculate daily average if multiple days selected
  // 5. Return structured result
}
```

### Return Structure

```javascript
{
  carbs: {
    grams: 150,      // Total grams (or daily average)
    exchanges: 0     // Total exchanges (or daily average)
  },
  total: 5           // Count of carb entries
}
```

## Unit Handling

### Grams vs Exchanges

The statistics system tracks grams and exchanges separately:

- **Grams**: Standard carb counting (most common)
- **Exchanges**: 15g per exchange (Medtronic systems)

When displaying, the format includes the appropriate suffix:

| Value | Display |
|-------|---------|
| 150 grams | `150 g` |
| 10 exchanges | `10 exch` |

### Daily Averages

When the selected date range spans multiple days, the system calculates daily averages:

```javascript
if (activeDays > 1) {
  carbs.grams = carbs.grams / activeDays;
  carbs.exchanges = carbs.exchanges / activeDays;
}
```

The `activeDays` value represents days that actually have carb data, not just calendar days in the range.

## Stat Display

### Stat Definition

Carb stats use the `'simple'` stat type (defined in `src/utils/stat.js:928-933`):

```javascript
{
  id: 'carbs',
  type: statTypes.simple,
  dataFormat: statFormats.carbs
}
```

### Formatting

The `formatDatum()` function (`src/utils/stat.js:161-179`) handles carb formatting:

- Rounds to nearest integer for values >= 1
- Shows one decimal place for values < 1
- Appends `' g'` or `' exch'` suffix based on unit type

### Annotations

Carb stats include hover annotations explaining the data:

```javascript
{
  message: 'Total carbs entered via bolus calculator and standalone food entries.',
  link: { url: '...', text: 'Learn more' }
}
```

## Rendering Locations

### Basics View

The Basics view shows average daily carbs as part of the summary statistics.

### PDF Reports

Daily PDF reports include carb data:

- **Daily view**: Carb circles rendered above boluses
- **Summary section**: Total carbs for the day

### Stat Widget

When displayed as a stat widget, carbs appear with:

- Value (e.g., "150 g")
- Label ("Carbs")
- Annotation icon with tooltip

## Data Flow

```
Raw Data (wizard, food)
        ↓
    DataUtil
   (normalize, join)
        ↓
    StatUtil.getCarbsData()
   (aggregate, average)
        ↓
    stat.js getStatData()
   (format for display)
        ↓
  Stat Component / PDF
```

## Edge Cases

### No Carb Data

When no carb data exists for the selected range:

```javascript
{
  carbs: { grams: 0, exchanges: 0 },
  total: 0
}
```

### Mixed Units

If a patient uses both grams and exchanges (rare), both values are tracked and displayed separately.

### Zero-Carb Entries

Carb entries with `carbInput: 0` are filtered out of totals but the bolus/wizard event itself is still processed.

## Related Files

| File | Function |
|------|----------|
| `src/utils/StatUtil.js` | `getCarbsData()` |
| `src/utils/stat.js` | Formatting, annotations |
| `src/utils/bolus.js` | `getCarbs()` extraction |
| `src/modules/print/DailyPrintView.js` | PDF carb rendering |
