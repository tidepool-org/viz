# Basal Rendering

Part of the [Basal Subdomain](./index.md) in the [Insulin Domain](../index.md).

This document covers the visual representation of basal insulin data, including shapes, colors, and view-specific rendering.

---

## Visual Representation

Basal rates are rendered as a filled area chart at the bottom of the daily view:

```
Rate (u/hr)
   │
1.5├────────┐           ┌──────────────────
   │        │           │   Scheduled
1.0├────────┼───────────┼──────────────────
   │  Temp  │           │
0.5├────────┘     ┌─────┘
   │              │ Automated
   └──────────────┴────────────────────────▶ Time
```

---

## Color Coding

Basal delivery is colored by mode:

| Mode | Color | Variable | Description |
|------|-------|----------|-------------|
| Automated | Blue | `--basalAutomated` | Algorithm-controlled (Control-IQ, Loop) |
| Manual/Scheduled | Gray | `--basalManual` | User-programmed schedule |

From `src/styles/colors.css`:

```css
:root {
  --basalAutomated: #3B79C4;
  --basalManual: #A8A8A8;
}
```

---

## Delivery Type Variations

### Scheduled Basals

Normal programmed basal from user's schedule.

**Flat rate (single rate all day)**

![Scheduled flat rate](./screenshots/scheduled%20flat%20rate%20basal.png)

**Multi-rate schedule**

![Scheduled basals](./screenshots/scheduled%20basals.png)

### Temporary Basals

User-initiated rate adjustments.

**Positive temp (increased rate)**

![Positive temp](./screenshots/simple%20positive%20temp%20basal.png)

**Negative temp (decreased rate)**

![Negative temp](./screenshots/simple%20negative%20temp%20basal.png)

### Suspend

Delivery completely stopped (rate = 0).

![Suspend](./screenshots/simple%20suspend%20basal.png)

### Automated Basals

Algorithm-controlled delivery from closed-loop systems.

![Automated basals](./screenshots/automated%20basals.png)

---

## Schedule Boundaries

When temp basals or suspends span schedule changes, the suppressed rate updates.

### Positive Temp Across Boundary

![Positive temp across boundary](./screenshots/positive%20temp%20basal%20across%20schedule%20boundary.png)

The suppressed (gray) line shows the underlying scheduled rate changing while the temp (colored area) continues.

### Negative Temp Across Boundary

![Negative temp across boundary](./screenshots/negative%20temp%20basal%20across%20schedule%20boundary.png)

### Suspend Across Boundary

![Suspend across boundary](./screenshots/suspend%20basal%20across%20schedule%20boundary.png)

---

## Automated + Scheduled

Hybrid closed-loop systems alternate between automated and scheduled delivery:

![Automated and scheduled](./screenshots/automated%20and%20scheduled%20basals.png)

The visualization distinguishes:
- **Blue regions**: Algorithm-controlled automated delivery
- **Gray regions**: Manual/scheduled delivery

---

## Automated with Suspend

When the algorithm suspends delivery to prevent lows:

![Automated with suspend](./screenshots/automated%20basals%20with%20suspend.png)

---

## Discontinuities

Gaps in basal data (pump off, upload gaps) are rendered with breaks:

![Discontinuities](./screenshots/scheduled%20flat%20rate%20basal%20with%20two%20discontinuities.png)

Discontinuities are marked with `discontinuousEnd` and `discontinuousStart` flags on adjacent segments.

---

## Suppressed Basal Rendering

When a temp or suspend overrides scheduled delivery, the suppressed (original) rate is shown as a dashed or lighter line:

```
Rate
   │
1.5├─────┐  Temp rate (solid fill)
   │     │
1.0├─ ─ ─┼─ ─ ─ ─  Suppressed rate (dashed)
   │     │
   └─────┴──────────────────────────────▶ Time
```

This helps clinicians understand what delivery *would have* been without the override.

---

## Rendering Components

### Daily View

**File**: `src/modules/print/DailyPrintView.js`

Basals render in the bottom zone of the daily chart:

```javascript
// Zone proportions from DailyPrintView.calculateChartMinimums()
{
  notesEtc: 3/20,      // Events zone
  bgEtcChart: 9/20,    // Glucose + bolus zone
  bolusDetails: 4/20,  // Bolus labels
  basalChart: 3/20,    // Basal rate chart
  belowBasal: 1/20,    // Override markers
}
```

### Basal Scale

```javascript
// Basal Y scale
dateChart.basalScale = scaleLinear()
  .domain([0, this.basalRange[1]])  // 0 to max basal rate
  .range([basalBottom, basalTop]);
```

### Path Rendering

**File**: `src/modules/render/basal.js`

```javascript
// Render basal as filled area
export function renderBasalPaths(basals, scale, opts) {
  const pathGroups = getBasalPathGroups(basals);
  
  return pathGroups.map(group => {
    const pathType = getBasalPathGroupType(group[0]);
    const fill = pathType === 'automated' ? colors.automated : colors.manual;
    return renderPath(group, scale, { fill });
  });
}
```

---

## Basal Tooltips

Hovering on basal segments shows delivery details.

### Content

- **Rate**: Current delivery rate (u/hr)
- **Delivery type**: Scheduled, Temp, Suspend, Automated
- **Duration**: Segment duration
- **Suppressed rate**: Original rate if overridden

### Tooltip Component

**File**: `src/components/daily/BasalTooltip.js` (if exists)

---

## PDF Rendering

### Constants

```javascript
// From DailyPrintView
this.colors.basal = {
  automated: colors.basalAutomated,
  manual: colors.basalManual,
};
```

### Legend Items

```javascript
// Basal legend entry
{ 
  type: 'basals', 
  show: hasBasal, 
  labels: ['Basals', 'automated &', 'manual'] 
}
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| Basal path rendering | `src/modules/render/basal.js` |
| Daily PDF view | `src/modules/print/DailyPrintView.js` |
| Basal utilities | `src/utils/basal.js` |
| Test fixtures | `data/basal/fixtures.js` |
| Stories | `stories/components/daily/` |
| Colors | `src/styles/colors.css` |

---

## See Also

- [Basal Overview](./index.md) - Data structure and delivery types
- [Basal Calculations](./calculations.md) - Dose and duration calculations
- [Daily View](../../views/daily.md) - Complete daily rendering
- [Device Events - Suspends](../device-events/index.md) - Suspend events
