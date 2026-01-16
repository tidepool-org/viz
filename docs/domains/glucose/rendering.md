# Glucose Rendering

This document covers the visualization components for blood glucose data, including tooltips, color coding, and view-specific rendering.

---

## Color Coding

Glucose values are visually coded by range classification. Colors are defined in `src/styles/colors.css`:

| Range | Variable | Color | Hex |
|-------|----------|-------|-----|
| Very Low | `--veryLow` | Red | `#FB5951` |
| Low | `--low` | Light Red | `#FF8B7C` |
| Target | `--target` | Green | `#76D3A6` |
| High | `--high` | Light Purple | `#BB9AE7` |
| Very High | `--veryHigh` | Purple | `#8C65D6` |

These colors are applied to:
- Tooltip borders
- Trend line segments
- CGM dots in daily view
- SMBG circles
- Range distribution bars

---

## CBG Tooltip

The `CBGTooltip` component displays details for CGM readings on hover.

### Component

**File**: `src/components/daily/cbgtooltip/CBGTooltip.js`

### Props

| Prop | Type | Description |
|------|------|-------------|
| `cbg` | object | CGM datum with `value`, `units`, `normalTime` |
| `bgPrefs` | object | BG display preferences (`bgUnits`, `bgClasses`) |
| `timePrefs` | object | Timezone preferences |
| `position` | object | `{ top, left }` position |
| `side` | string | Tooltip placement: `'top'`, `'right'`, `'bottom'`, `'left'` |

### Content

- **Title**: Time formatted as "h:mm a" (e.g., "2:30 PM")
- **Value**: Glucose reading with units
- **Annotation**: Out-of-range message if applicable (e.g., "Above Display Limit")

### Screenshots

| Range | Screenshot |
|-------|------------|
| Very Low | ![Very Low CBG](../../screenshots/CBGTooltip/veryLow.png) |
| Low | ![Low CBG](../../screenshots/CBGTooltip/low.png) |
| Target | ![Target CBG](../../screenshots/CBGTooltip/target.png) |
| High | ![High CBG](../../screenshots/CBGTooltip/high.png) |
| Very High | ![Very High CBG](../../screenshots/CBGTooltip/veryHigh.png) |

---

## SMBG Tooltip

The `SMBGTooltip` component displays details for fingerstick readings.

### Component

**File**: `src/components/daily/smbgtooltip/SMBGTooltip.js`

### Props

| Prop | Type | Description |
|------|------|-------------|
| `smbg` | object | SMBG datum with `value`, `units`, `subType`, `tags` |
| `bgPrefs` | object | BG display preferences |
| `timePrefs` | object | Timezone preferences |
| `position` | object | Position coordinates |
| `side` | string | Tooltip placement |

### Content

- **Title**: Time formatted as "h:mm a"
- **BG**: Glucose value with units
- **Source**: Reading source (Meter, Manual, Linked)
- **Medtronic 600**: Special annotations for Medtronic 600-series calibration status
- **Annotation**: Out-of-range messages if applicable

### Screenshots

| Type | Screenshot |
|------|------------|
| Very Low | ![Very Low](../../screenshots/SMBGTooltip/veryLow.png) |
| Low | ![Low](../../screenshots/SMBGTooltip/low.png) |
| Target | ![Target](../../screenshots/SMBGTooltip/target.png) |
| High | ![High](../../screenshots/SMBGTooltip/high.png) |
| Very High | ![Very High](../../screenshots/SMBGTooltip/veryHigh.png) |
| Manual Entry | ![Manual](../../screenshots/SMBGTooltip/manual.png) |
| Linked | ![Linked](../../screenshots/SMBGTooltip/linked.png) |

### Medtronic 600-Series

The Medtronic 600-series pumps have special SMBG handling for calibration:

| Status | Screenshot |
|--------|------------|
| Accepted | ![Accepted](../../screenshots/SMBGTooltip/medT600accepted.png) |
| Rejected | ![Rejected](../../screenshots/SMBGTooltip/medT600rejected.png) |
| Timed Out | ![Timed Out](../../screenshots/SMBGTooltip/medT600timedout.png) |

---

## CGM Sample Interval Tooltip

Displays information about CGM sample rate discrepancies.

### Component

**File**: `src/components/common/tooltips/CgmSampleIntervalTooltip.js`

### Purpose

Alerts users when CGM data has unexpected sample intervals (e.g., 1-minute readings from Libre instead of standard 5-minute).

### Screenshot

![CGM Sample Interval](../../screenshots/CgmSampleIntervalTooltip/default%20tootlip.png)

---

## Statistics Display

Glucose statistics are rendered using the `Stat` component.

### Component

**File**: `src/components/common/stat/`

### Available Stats

| Stat | Screenshot |
|------|------------|
| Average Glucose | ![Average Glucose](../../screenshots/Stat/Average%20Glucose.png) |
| Standard Deviation | ![Standard Deviation](../../screenshots/Stat/Standard%20Deviation.png) |
| CV | ![CV](../../screenshots/Stat/Coefficient%20of%20Variation.png) |
| GMI | ![GMI](../../screenshots/Stat/Glucose%20Management%20Indicator.png) |
| Time in Range | ![TIR](../../screenshots/Stat/Time%20In%20Range.png) |
| Readings in Range | ![RIR](../../screenshots/Stat/Readings%20In%20Range.png) |
| Sensor Usage | ![Sensor Usage](../../screenshots/Stat/Sensor%20Usage.png) |

### Stat Tooltips

Stats can have annotations that appear in tooltips:

| Type | Screenshot |
|------|------------|
| Short annotation | ![Short](../../screenshots/StatTooltip/short%20annotation.png) |
| Long annotation | ![Long](../../screenshots/StatTooltip/long%20annotation.png) |
| Multiple annotations | ![Multiple](../../screenshots/StatTooltip/multiple%20annotations.png) |
| Markdown support | ![Markdown](../../screenshots/StatTooltip/markdown%20annotation.png) |

---

## View-Specific Rendering

### Daily View

CGM data in Daily view is rendered as a continuous line trace with dots for individual readings.

**Components**:
- `src/components/daily/` - Daily view components
- CGM trace uses D3 for SVG path rendering

**Behavior**:
- Hover on dots shows `CBGTooltip`
- Line segments colored by BG range
- Gaps shown for missing data

### Trends View

Trends view shows CGM data as overlaid 24-hour slices across multiple days.

**Components**:
- `src/components/trends/common/` - Shared trend components
- `src/components/trends/cbg/` - CGM-specific trend components

**Behavior**:
- Percentile bands (10th-90th, 25th-75th)
- Median line overlay
- Day-of-week filtering
- Date range selection

See [Trends Documentation](../../views/Trends.md) for detailed rendering information.

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

## Key Source Files

| Purpose | File |
|---------|------|
| CBG Tooltip | `src/components/daily/cbgtooltip/CBGTooltip.js` |
| SMBG Tooltip | `src/components/daily/smbgtooltip/SMBGTooltip.js` |
| Sample Interval Tooltip | `src/components/common/tooltips/CgmSampleIntervalTooltip.js` |
| Stat Tooltip | `src/components/common/tooltips/StatTooltip.js` |
| BG formatting | `src/utils/format.js` |
| BG classification | `src/utils/bloodglucose.js` |
| Colors | `src/styles/colors.css` |
| Trend components | `src/components/trends/` |

---

## See Also

- [Glucose Domain Overview](./index.md)
- [Glucose Statistics](./statistics.md)
- [Trends View](../../views/Trends.md)
- [Common Component Props](../../misc/CommonProps.md)
