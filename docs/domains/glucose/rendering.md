# Glucose Rendering

This document covers shared rendering concepts for glucose data. For type-specific rendering details, see:

- [CBG Rendering](./cbg/rendering.md) - CGM tooltips, trend lines
- [SMBG Rendering](./smbg/rendering.md) - Fingerstick tooltips, source indicators

---

## Color Coding

All glucose values are visually coded by range classification. Colors are defined in `src/styles/colors.css`:

| Range | Variable | Color | Hex |
|-------|----------|-------|-----|
| Very Low | `--veryLow` | Red | `#FB5951` |
| Low | `--low` | Light Red | `#FF8B7C` |
| Target | `--target` | Green | `#76D3A6` |
| High | `--high` | Light Purple | `#BB9AE7` |
| Very High | `--veryHigh` | Purple | `#8C65D6` |

These colors are applied consistently to:
- Tooltip borders (CBG and SMBG)
- CGM trend line segments
- CGM dots in daily view
- SMBG circles
- Range distribution bars in statistics

---

## BG Value Formatting

### Function

**File**: `src/utils/format.js`

```javascript
export function formatBgValue(value, bgPrefs, outOfRangeThreshold) {
  // Returns formatted string with appropriate precision:
  // - mg/dL: integer (e.g., "142")
  // - mmol/L: one decimal (e.g., "7.9")
  // - Out of range: "LOW" or "HIGH"
}
```

### Display Rules

| Condition | mg/dL | mmol/L |
|-----------|-------|--------|
| Normal value | Integer | 1 decimal |
| Below minimum | "LOW" | "LOW" |
| Above maximum | "HIGH" | "HIGH" |
| Clamp threshold | 400 | 22.5 |

---

## BG Classification

### Function

**File**: `src/utils/bloodglucose.js`

```javascript
export function classifyBgValue(bgBounds, bgUnits, value, classificationType) {
  // classificationType: 'fiveWay' or 'threeWay'
  // Returns: 'veryLow', 'low', 'target', 'high', 'veryHigh'
  // (or 'low', 'target', 'high' for threeWay)
}
```

This function determines which range a glucose value falls into for color coding.

---

## Statistics Display

Glucose statistics are rendered using the `Stat` component.

### Component

**File**: `src/components/common/stat/`

### Available Stats

| Stat | Screenshot | Scope |
|------|------------|-------|
| Average Glucose | ![Average Glucose](./screenshots/Average%20Glucose.png) | CBG + SMBG |
| Standard Deviation | ![Standard Deviation](./screenshots/Standard%20Deviation.png) | CBG + SMBG |
| CV | ![CV](./screenshots/Coefficient%20of%20Variation.png) | CBG + SMBG |
| GMI | ![GMI](./screenshots/Glucose%20Management%20Indicator.png) | CBG only |
| Time in Range | ![TIR](./screenshots/Time%20In%20Range.png) | CBG only |
| Readings in Range | ![RIR](./screenshots/Readings%20In%20Range.png) | SMBG only |
| Sensor Usage | ![Sensor Usage](./screenshots/Sensor%20Usage.png) | CBG only |

### Stat Tooltips

Stats can have annotations that appear in tooltips:

| Type | Screenshot |
|------|------------|
| Short annotation | ![Short](./screenshots/short%20annotation.png) |
| Long annotation | ![Long](./screenshots/long%20annotation.png) |
| Multiple annotations | ![Multiple](./screenshots/multiple%20annotations.png) |
| Markdown support | ![Markdown](./screenshots/markdown%20annotation.png) |

---

## View-Specific Rendering

### Daily View

Both CBG and SMBG are rendered on the same 24-hour timeline:

- **CGM**: Continuous line trace with dots
- **SMBG**: Circles at reading times
- **Interaction**: Hover shows appropriate tooltip

### Trends View

Multi-day overlay visualization:

- **CGM**: Percentile bands (10th-90th, 25th-75th) with median line
- **SMBG**: Scattered dots at actual time of day
- **Features**: Day-of-week filtering, date range selection

See [Trends Documentation](../../views/Trends.md) for full details.

### Basics View

Calendar summary with range distributions:

- Daily range breakdown
- Week summaries
- Time in Range / Readings in Range stats

### BG Log View

SMBG-focused tabular display:

- Date/time, value, source columns
- Grouped by day
- Week-at-a-glance summaries

---

## Key Source Files

| Purpose | File |
|---------|------|
| CBG Tooltip | `src/components/daily/cbgtooltip/CBGTooltip.js` |
| SMBG Tooltip | `src/components/daily/smbgtooltip/SMBGTooltip.js` |
| Stat Tooltip | `src/components/common/tooltips/StatTooltip.js` |
| BG formatting | `src/utils/format.js` |
| BG classification | `src/utils/bloodglucose.js` |
| Colors | `src/styles/colors.css` |

---

## See Also

- [Glucose Domain Overview](./index.md) - Parent domain
- [CBG Rendering](./cbg/rendering.md) - CGM-specific rendering
- [SMBG Rendering](./smbg/rendering.md) - Fingerstick-specific rendering
- [Glucose Statistics](./statistics.md) - Statistical calculations
- [Trends View](../../views/Trends.md) - Full trends documentation
