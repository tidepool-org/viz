# Views

Documentation for the major data visualization views in `@tidepool/viz`.

## Web Views

Interactive views rendered in the browser:

- **[Trends](./Trends.md)** - Glucose patterns aggregated by time of day (CGM and BGM variants)

## PDF Views

Printable report views:

- **[Daily](./daily.md)** - Day-by-day timeline charts with glucose, insulin, and events
- **[Basics](./basics.md)** - 2-week summary with calendars and statistics
- **[PDF Reports](./pdf-reports.md)** - Combined PDF generation system

## View Architecture

All views share common data structures:

```javascript
// Input data structure
{
  bgPrefs: {
    bgUnits: 'mg/dL',
    bgBounds: { veryLow, low, target, high, veryHigh },
  },
  timePrefs: {
    timezoneAware: true,
    timezoneName: 'America/New_York',
  },
  data: {
    current: {
      endpoints: { range: [start, end], days: 14 },
      stats: { timeInRange, averageGlucose, ... },
      aggregationsByDate: { ... },
      data: { cbg: [], smbg: [], bolus: [], basal: [], ... },
    },
  },
}
```

## See Also

- [Architecture](../concepts/architecture.md) - System overview
- [Tidepool Data Model](../concepts/tidepool-data-model.md) - Data types
