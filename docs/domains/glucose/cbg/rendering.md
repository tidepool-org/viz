# CBG Rendering

Part of the [CBG Subdomain](./index.md) in the [Glucose Domain](../index.md).

---

## Overview

CBG (CGM) data is rendered as continuous traces, dots, and trend visualizations across multiple views. This document covers the visual components specific to CGM data.

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

### Screenshots by Range

| Range | Screenshot |
|-------|------------|
| Very Low | ![Very Low CBG](./screenshots/veryLow.png) |
| Low | ![Low CBG](./screenshots/low.png) |
| Target | ![Target CBG](./screenshots/target.png) |
| High | ![High CBG](./screenshots/high.png) |
| Very High | ![Very High CBG](./screenshots/veryHigh.png) |

---

## CGM Sample Interval Tooltip

Displays information about CGM sample rate discrepancies.

### Component

**File**: `src/components/common/tooltips/CgmSampleIntervalTooltip.js`

### Purpose

Alerts users when CGM data has unexpected sample intervals (e.g., 1-minute readings from Libre instead of standard 5-minute).

### Content

Explains the two CGM data types:
- **Real-time (1-min)**: Used for pump dosing, may have gaps
- **Display (5-min)**: Smoothed, auto-backfilled, used for stats

### Screenshot

![CGM Sample Interval](./screenshots/default%20tootlip.png)

---

## Daily View Rendering

CGM data in Daily view is rendered as a continuous line trace with dots for individual readings.

### Components

- `src/components/daily/` - Daily view components
- CGM trace uses D3 for SVG path rendering

### Behavior

- Hover on dots shows `CBGTooltip`
- Line segments colored by BG range
- Gaps shown for missing data (discontinuities)

### Color Coding

CGM line segments are colored by glucose range:

| Range | Variable | Color | Hex |
|-------|----------|-------|-----|
| Very Low | `--veryLow` | Red | `#FB5951` |
| Low | `--low` | Light Red | `#FF8B7C` |
| Target | `--target` | Green | `#76D3A6` |
| High | `--high` | Light Purple | `#BB9AE7` |
| Very High | `--veryHigh` | Purple | `#8C65D6` |

Colors defined in `src/styles/colors.css`.

---

## Trends View Rendering

Trends view shows CGM data as overlaid 24-hour slices across multiple days.

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `CBGSlicesContainer` | `src/components/trends/cbg/CBGSlicesContainer.js` | Container for CBG slices |
| `CBGSliceAnimated` | `src/components/trends/cbg/CBGSliceAnimated.js` | Animated slice rendering |
| `CBGMedianAnimated` | `src/components/trends/cbg/CBGMedianAnimated.js` | Median line overlay |

### Behavior

- Percentile bands (10th-90th, 25th-75th)
- Median line overlay
- Day-of-week filtering
- Date range selection

See [Trends Documentation](../../../views/Trends.md) for detailed rendering information.

---

## AGP Rendering

The Ambulatory Glucose Profile (AGP) is a standardized CGM visualization.

### Components

AGP-specific rendering in `src/utils/agp/`:
- `data.js` - AGP data preparation
- Percentile calculations for AGP bands

### Requirements

- CGM data only (not SMBG)
- Minimum 14 days recommended
- 70% sensor usage threshold

See [PDF Reports](../../../views/pdf-reports.md) for AGP PDF generation.

---

## Key Source Files

| Purpose | File |
|---------|------|
| CBG Tooltip | `src/components/daily/cbgtooltip/CBGTooltip.js` |
| Sample Interval Tooltip | `src/components/common/tooltips/CgmSampleIntervalTooltip.js` |
| Trend CBG components | `src/components/trends/cbg/` |
| Colors | `src/styles/colors.css` |
| AGP utilities | `src/utils/agp/` |

---

## See Also

- [CBG Overview](./index.md) - Data structure and processing
- [Sensor Usage](./sensor-usage.md) - Time in Range, sensor wear statistics
- [Glucose Rendering](../rendering.md) - Shared rendering concepts
- [Trends View](../../../views/Trends.md) - Full trends documentation
