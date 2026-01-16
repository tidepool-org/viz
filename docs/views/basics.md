# Basics View

The Basics view provides a summary of diabetes management over a 2-week period, showing calendar-style data visualization, aggregated statistics, and site change tracking.

---

## Overview

![Basics View PDF](./screenshots/basics.jpg)

The Basics view displays:
- **Aggregated statistics** (TIR, average glucose, CV, GMI)
- **Calendar grids** showing daily patterns for:
  - BG readings (fingersticks)
  - Insulin delivery (boluses)
  - Site changes
  - Basal events
- **Summary tables** with event counts and percentages

---

## Layout Structure

The Basics view uses a three-column layout:

```
┌─────────────┬───────────────────────────┬─────────────┐
│             │                           │             │
│   Stats     │    Calendar Grids         │  Summary    │
│   Column    │    (4 sections)           │  Tables     │
│   (25.5%)   │    (49%)                  │  (25.5%)    │
│             │                           │             │
└─────────────┴───────────────────────────┴─────────────┘
```

From `BasicsPrintView.initLayout()`:

```javascript
this.setLayoutColumns({
  width: this.chartArea.width,
  gutter: 14,
  type: 'percentage',
  widths: [25.5, 49, 25.5],
});
```

---

## Calendar Sections

### BG Readings (Fingersticks)

Shows daily SMBG counts in a calendar grid.

**Dimensions tracked:**
| Metric | Description |
|--------|-------------|
| `total` | Average per day (primary) |
| `meter` | From meter (percentage) |
| `manual` | Manual entries (percentage) |
| `calibration` | CGM calibrations |
| `veryLow` / `low` | Out-of-range readings |
| `veryHigh` / `high` | Out-of-range readings |

### Boluses (Insulin)

Shows daily bolus counts and types.

**Dimensions tracked:**
| Metric | Description |
|--------|-------------|
| `total` | Average boluses per day |
| `wizard` | Calculator-assisted (or "Meal" for Loop) |
| `correction` | Correction boluses |
| `extended` | Extended/combo boluses |
| `interrupted` | Cancelled/interrupted |
| `override` | User overrode recommendation |
| `underride` | User delivered less than recommended |
| `manual` | Manual boluses (automated systems) |
| `automated` | Algorithm-initiated (closed-loop only) |

**Device-specific variations:**

| Device Type | Modifications |
|-------------|---------------|
| Loop / Tidepool Loop | "Meal" instead of "Calculator" |
| Twiist | Includes "One Button Bolus" |
| Automated bolus devices | Adds "Automated" category |

### Site Changes

Shows infusion site change frequency.

**Site change sources by manufacturer:**

| Manufacturer | Default Source | Options |
|--------------|----------------|---------|
| Tandem | Cannula Fill | Cannula, Tubing |
| Medtronic | Cannula Prime | Cannula, Tubing |
| Animas | Cannula Fill | Cannula, Tubing |
| Insulet (OmniPod) | Reservoir (Pod) | - |
| Microtech | Reservoir | - |
| Twiist | Reservoir (Cassette) | Cassette, Cannula |
| Loop | Tubing | - |

**Site change images:**
```javascript
const siteChangeImages = {
  [SITE_CHANGE_CANNULA]: 'images/sitechange-cannula.png',
  [SITE_CHANGE_RESERVOIR]: 'images/sitechange-reservoir.png',
  [SITE_CHANGE_TUBING]: 'images/sitechange-tubing.png',
  // Device-specific variants
  [`tidepool loop_${SITE_CHANGE_TUBING}`]: 'images/sitechange-loop-tubing.png',
  [`twiist_${SITE_CHANGE_RESERVOIR}`]: 'images/sitechange-twiist-cassette.png',
};
```

### Basals

Shows basal-related events.

**Dimensions tracked:**
| Metric | Description |
|--------|-------------|
| `total` | Total basal events |
| `temp` | Temp basals (hidden for Loop) |
| `suspend` | Delivery suspends |
| `automatedStop` | Exits from automated mode |
| `automatedSuspend` | Algorithm-initiated suspends |

---

## Aggregated Statistics

The left column displays summary statistics:

```javascript
renderAggregatedStats() {
  // Time in Range (horizontal bar chart)
  if (timeInRange) this.renderHorizontalBarStat(timeInRange);
  
  // Readings in Range (for BGM users)
  if (readingsInRange) this.renderHorizontalBarStat(readingsInRange);
  
  // Simple numeric stats
  if (averageGlucose) this.renderSimpleStat(averageGlucose);
  if (sensorUsage) this.renderSimpleStat(sensorUsage);
  
  // Daily insulin breakdown
  this.renderHorizontalBarStat(totalInsulin);  // basal/bolus ratio
}
```

**Available statistics:**
- Time in Range (TIR)
- Readings in Range (for BGM)
- Average Glucose
- Sensor Usage
- Standard Deviation
- Coefficient of Variation (CV)
- Glucose Management Indicator (GMI)
- Total Insulin (basal/bolus breakdown)
- Average Daily Dose
- Average Daily Carbs
- Time in Auto
- Time in Override

---

## Date Range

The Basics view operates on a 2-week window:

```javascript
// src/utils/basics/data.js
export function findBasicsStart(timestamp, timezone = 'UTC') {
  return moment.utc(timestamp).tz(timezone)
    .startOf('isoWeek')
    .subtract(14, 'days')
    .toDate();
}

export function findBasicsDays(range, timezone = 'UTC') {
  // Returns array of day objects with:
  // - date: 'YYYY-MM-DD'
  // - type: 'inRange' or 'outOfRange'
}
```

Calendar days are labeled Mon-Sun (ISO week format).

---

## Calendar Cell Rendering

Each calendar cell is color-coded based on data:

```javascript
renderCalendarCell(tb, data, draw, column, pos, padding) {
  // Cell background color based on value intensity
  // Icons for site changes
  // Day-of-month labels for context
}
```

Cell types:
- **In range**: Data present, colored by intensity
- **Out of range**: Grayed out (before/after selected period)
- **No data**: Empty cell with date only

---

## Section Aggregations

Sections are defined dynamically based on available data:

```javascript
// src/utils/basics/data.js
export function defineBasicsAggregations(bgPrefs, manufacturer, pumpUpload) {
  const sections = {
    basals: { dimensions: [...], perRow: 4, title: 'Basals' },
    boluses: { dimensions: [...], perRow: 3, title: 'Insulin' },
    fingersticks: { dimensions: [...], perRow: 3, title: 'BG readings' },
    siteChanges: { dimensions: [], title: 'Site Changes' },
  };
  return sections;
}

// Process and enable/disable based on data availability
export function processBasicsAggregations(aggregations, data, patient, manufacturer) {
  _.each(aggregations, (aggregation, key) => {
    const hasData = checkDataPresence(data, key);
    aggregations[key].disabled = !hasData;
    if (!hasData) {
      aggregations[key].emptyText = getEmptyMessage(key);
    }
  });
}
```

---

## Empty State Messages

When data is unavailable, explanatory messages appear:

| Section | Message |
|---------|---------|
| Basals/Boluses (no pump) | "This section requires data from an insulin pump..." |
| Basals/Boluses (no events) | "There are no basal/bolus events to display..." |
| Fingersticks | "This section requires data from a blood-glucose meter..." |
| Site Changes | "This section requires data from an insulin pump..." |

---

## Text Export

The Basics view supports clipboard copy as plain text:

```javascript
// src/utils/basics/data.js
export function basicsText(patient, data, stats, aggregations) {
  let basicsString = textUtil.buildDocumentHeader('Basics');
  basicsString += textUtil.buildDocumentDates();
  basicsString += statsText(stats, textUtil, bgPrefs);
  
  // Summary tables for each section
  if (!aggregations.fingersticks.disabled) {
    basicsString += textUtil.buildTextTable(...);
  }
  // ... more sections
  
  return basicsString;
}
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| PDF rendering | `src/modules/print/BasicsPrintView.js` |
| Data utilities | `src/utils/basics/data.js` |
| Section definitions | `src/utils/basics/data.js` (`defineBasicsAggregations`) |
| Site change logic | `src/utils/basics/data.js` (`getSiteChangeSource`) |
| Stories (examples) | `stories/print/BasicsViewPrintPDF.js` |
| Tests | `test/modules/print/BasicsPrintView.test.js` |

---

## See Also

- [Glucose Statistics](../domains/glucose/statistics.md) - Statistical calculations
- [Device Events](../domains/device-events/index.md) - Site changes, suspends
- [PDF Reports](./pdf-reports.md) - Combined PDF output
