# Trends View

The Trends view aggregates blood glucose data by time of day across a configurable date range (7, 14, or 28 days), helping identify patterns in glucose levels throughout the day.

---

## Overview

There are two versions of the Trends view:

- **CGM Trends**: For continuous glucose monitor data (30-minute bins)
- **BGM Trends**: For fingerstick blood glucose data (3-hour bins)

**CGM Trends**

![CGM Trends](./images/cgm_trends.png)

**BGM Trends**

![BGM Trends](./images/bgm_trends.png)

---

## User Experience

A 14-day span of data is the default for this view, although the user can toggle to 7 days or 28 days using selectors displayed in the upper left corner of the display. In the upper right, the user can toggle days of the week (Monday, Tuesday, etc.) or weekdays vs. weekends on and off.

Both CGM and BGM versions group all data in the selected span by time of day to show how blood glucose varies for the person with diabetes (PwD) throughout the day:

- **CGM**: 48 bins per day (30 minutes each)
- **BGM**: 8 bins per day (3 hours each)

---

## Interactive Features

### Tooltips

Like on the Daily view, hovering over various items produces tooltips with more information.

### CGM Trace Exposure

On the CGM version, hovering on a segment of a time slice will expose all CGM daily sensor traces that intersect with that segment after a short delay. The pointer must remain on the same segment for a threshold of milliseconds before the exposure is triggered.

**BGM Date Line Hover**

![BGM Date Line Hover](./images/bgm_trends_date_line_hover.png)

**BGM Individual `smbg` Hover**

![BGM Individual `smbg` Hover](./images/bgm_trends_smbg_hover.png)

**BGM Range Box Hover**

![BGM Range Box Hover](./images/bgm_trends_range_hover.png)

**CGM Segment Hover**

![CGM Segment Hover](./images/cgm_trends_segment_hover.gif)

**CGM Segment Hover + Hold**

![CGM Segment Hover + Hold](./images/cgm_trends_segment_hover_hold.png)

**CGM Segment Hover + Hold on `cbg`**

![CGM Segment Hover + Hold on `cbg`](./images/cgm_trends_segment_hover_hold_cbg.png)

---

## Architecture

Currently only the data visualization itself for the BGM and CGM versions of the Trends view are implemented in this repository: code in blip is still being used for the 7, 14, and 28 days domain size selectors, the day of the week selectors, and of course the visualization sub-header that provides navigation between the views and along the datetime dimension. This makes the interface(s) between the blip and viz code a bit messier than they should be.

![Trends view locations of code for elements](./images/trends_code_locations.png)

#### Component hierarchy

**CGM Trends**

```
└── PatientData
    └── Trends
        ├── TidelineHeader
        ├── TrendsSubNav
        ├── <div className="patient-data-content">
        │   ├── <div id="tidelineContainer">
        │   │   └── TrendsContainer
        │   │       └── TrendsSVGContainer (wrapped in DimensionsHOC)
        │   │           ├── Background
        │   │           ├── XAxisLabels
        │   │           ├── XAxisTicks
        │   │           ├── YAxisLabels
        │   │           ├── <g id="cbgTrends">
        │   │           │   ├── CBGSlicesContainer
        │   │           │   │   └── <g id="cbgSlices">{48 CBGSliceAnimated, each wrapped in WithDefault HOC}</g>
        │   │           │   └── CBGDateTracesAnimationContainer
        │   │           │       └── ReactTransitionGroupPlus
        │   │           │           └── <g id="cbgDateTraces">{n CBGDateTraceAnimated where n is number of exposed CGM sensor traces}</g>
        │   │           └── TargetRangeLines
        │   ├── CBGDateTraceLabel
        │   └── FocusedRangeLabels
        └── TidelineFooter
```

**BGM Trends**

```
└── PatientData
    └── Trends
        ├── TidelineHeader
        ├── TrendsSubNav
        ├── <div className="patient-data-content">
        │   ├── <div id="tidelineContainer">
        │   │   └── TrendsContainer
        │   │       └── TrendsSVGContainer (wrapped in DimensionsHOC)
        │   │           ├── Background
        │   │           ├── XAxisLabels
        │   │           ├── XAxisTicks
        │   │           ├── YAxisLabels
        │   │           ├── <g id="smbgTrends">
        │   │           │   ├── SMBGRangeAvgContainer (for range behind smbgs)
        │   │           │   │   └── <g className="smbgAggContainer">{up to 8 SMBGRangeAnimated (per default 3-hr binning), each wrapped in WithDefault}</g>
        │   │           │   ├── SMBGsByDateContainer
        │   │           │   │   └── <g id="smbgsByDateContainer">{up to n each of SMBGDateLineAnimated and SMBGDatePointsAnimated where n is # of days in view}</g>
        │   │           │   │       └── <g id="">
        │   │           │   └── SMBGRangeAvgContainer (for avg in front of smbgs)
        │   │           │   │   └── <g className="smbgAggContainer">{up to 8 SMBGMeanAnimated (per default 3-hr binning), each wrapped in WithDefault}</g>
        │   │           └── TargetRangeLines
        │   └── FocusedRangeLabels
        └── TidelineFooter
```

### 📐 Layout

The variables involved in the layout of the data display inside the Trends view—that is, the code for Trends view contained in this repository—are as follows, all originating in the `TrendsSVGContainer`:

- `containerHeight` and `containerWidth` are the dimensions of the `<div id="tidelineContainer">` that the data portion of every view is rendered within. These are provided on `TrendsSVGContainer` as props via the `Dimensions` higher-order component (HOC) that wraps the SVG container. This `Dimensions` HOC is an external dependency from the [`react-dimensions`](https://github.com/digidem/react-dimensions 'GitHub: react-dimensions').
- The `MARGINS` (a constant of `top`, `bottom`, `left`, and `right` properties) are the space outside the data display area (gray box) that provide padding around the data display area and space for the x- and y-axis ticks and labels.
- The `BUMPERS` (a constant of `top` and `bottom` properties) are the internal padding in the data display area.

Altogether, in diagram form (though **not to scale**):

![Trends layout](./images/tidelineContainer@2x.png 'Trends layout')

### 💣 Tech Debt

- When you hover a date line on the smbg side of Trends, instead of properly pulling the line to the top we just render a second version of the line on top.

### 🚀 The Future

At present the `<div id="tidelineContainer">` is given a fixed size via blip's styling, but as we introduce responsiveness in blip, we will be able to leverage the behavior of the `Dimensions` HOC to make the dataviz responsive. `Dimensions` will update the `containerHeight` and `containerWidth` props on `TrendsSVGContainer` on window resize, and then by implementing a `componentWillReceiveProps` on `TrendsSVGContainer` we will be able to adjust the dimensions of the rendered SVG and the ranges of the x and y scales created with D3 to respond to the new viewport size.

---

## Key Source Files

| Purpose | File |
|---------|------|
| CBG slice rendering | `src/components/trends/cbg/CBGSlice*.js` |
| SMBG range rendering | `src/components/trends/smbg/SMBGRange*.js` |
| Trends data utilities | `src/utils/trends/data.js` |
| Test utilities | `test/helpers/scales.js` |

---

## See Also

- [Glucose Domain](../domains/glucose/index.md) - CBG and SMBG data types
- [Glucose Statistics](../domains/glucose/statistics.md) - Statistical calculations
- [Daily View](./daily.md) - Detailed daily timeline
