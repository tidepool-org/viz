# Carbs Domain

This section covers how carbohydrate data is handled in Tidepool viz, including data structures, rendering, and statistics.

## Overview

Carbohydrate data in Tidepool comes from two primary sources:

1. **Wizard events** - Carbs entered via bolus calculator when dosing insulin
2. **Food events** - Standalone food/carb entries (common with Loop and other AID systems)

## Data Sources

### Wizard Events

When a user enters carbs through their pump's bolus calculator, the carb value is stored in a `wizard` type record:

```javascript
{
  type: 'wizard',
  carbInput: 45,           // Number of carbs entered
  carbUnits: 'grams',      // 'grams' or 'exchanges'
  insulinCarbRatio: 10,    // I:C ratio used for calculation
  recommended: {
    carb: 4.5              // Recommended insulin based on carbs
  },
  bolus: { /* nested bolus object */ }
}
```

Key fields:

| Field | Description |
|-------|-------------|
| `carbInput` | Number of carbs entered by user |
| `carbUnits` | Unit type: `'grams'` or `'exchanges'` |
| `insulinCarbRatio` | Insulin-to-carb ratio used for calculation |
| `recommended.carb` | Insulin dose recommended for the carbs |

### Food Events

Standalone food entries (not tied to a bolus) use the `food` type:

```javascript
{
  type: 'food',
  nutrition: {
    carbohydrate: {
      net: 30                    // Net carbs in grams
    },
    estimatedAbsorptionDuration: 10800000  // Absorption time in ms (Loop)
  }
}
```

### Dosing Decisions (Loop)

Loop systems may include carb data in dosing decision records:

```javascript
{
  type: 'dosingDecision',
  food: {
    nutrition: {
      carbohydrate: {
        net: 25
      }
    }
  }
}
```

## Carb Units

Tidepool supports two carbohydrate unit systems:

| Unit | Description | Common Usage |
|------|-------------|--------------|
| **Grams** | Standard carb counting | Most pumps and systems |
| **Exchanges** | 1 exchange = 15g carbs | Medtronic (older systems) |

### Medtronic Exchange Handling

Medtronic pumps that use carb exchanges store the value internally as grams (after converting at 15:1 ratio). The viz library can deconvert these values back to exchanges for display:

- **Detection**: `needsCarbToExchangeConversion()` in DataUtil
- **Conversion**: `getDeconvertedCarbExchange()` divides by 15
- **Annotation**: Data is annotated with `medtronic/wizard/carb-to-exchange-ratio-deconverted`

## Key Source Files

| File | Purpose |
|------|---------|
| `src/utils/bolus.js` | `getCarbs()` utility to extract carbs from wizard/bolus |
| `src/utils/DataUtil.js` | Wizard-bolus joining, exchange conversion |
| `src/utils/StatUtil.js` | `getCarbsData()` for carb statistics |
| `src/utils/stat.js` | Carb stat formatting and display |
| `src/components/common/data/Bolus.js` | Carb circle rendering on boluses |
| `src/components/daily/foodtooltip/FoodTooltip.js` | Standalone food tooltip |
| `src/components/daily/bolustooltip/BolusTooltip.js` | Wizard carb display in tooltip |
| `data/types.js` | Wizard, Food, DosingDecision type definitions |

## See Also

- [Carbs Statistics](./statistics.md) - How carb totals are calculated
- [Carbs Rendering](./rendering.md) - Food tooltip and visual display
- [Bolus Domain](../insulin/bolus/index.md) - Wizard bolus calculations
- [Daily View](../../views/daily.md) - Where carbs are displayed
