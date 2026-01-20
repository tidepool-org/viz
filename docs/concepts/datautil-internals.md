# DataUtil Internals

DataUtil is the core data management class for Tidepool diabetes data visualization. It provides the foundation for all data operations in Viz—ingestion, querying, statistics computation, and aggregation.

This document provides a conceptual overview of how DataUtil works. For detailed method documentation, see the extensive JSDoc comments in `src/utils/DataUtil.js`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DataUtil                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   addData()  │───▶│  crossfilter │───▶│   query()    │          │
│  │  (ingestion) │    │   (index)    │    │  (retrieval) │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  normalize   │    │  dimensions  │    │   StatUtil   │          │
│  │  validate    │    │   filters    │    │  (stats)     │          │
│  │  join        │    │   sorts      │    └──────────────┘          │
│  │  tag         │    └──────────────┘           │                   │
│  └──────────────┘                               ▼                   │
│                                          ┌──────────────┐          │
│                                          │ Aggregation  │          │
│                                          │    Util      │          │
│                                          └──────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

DataUtil is designed to run in a **Web Worker** (via blip's DataWorker) to avoid blocking the main thread during expensive data operations.

---

## Data Ingestion Pipeline

When `addData()` is called, data flows through several processing stages:

### 1. Clone & Normalize

```javascript
const data = _.cloneDeep(rawData);
_.each(data, this.normalizeDatumIn);
```

Raw data is cloned to avoid mutation, then each datum is normalized:

- **Timestamp conversion**: ISO strings → "hammertimes" (ms since epoch) for faster filtering
- **Type-specific processing**: Basal suspends get `rate: 0`, legacy messages get type conversion
- **CGM sample intervals**: Added to legacy data that lacks `sampleInterval`
- **Latest datum tracking**: `latestDatumByType` map is populated

### 2. Join Related Data

```javascript
_.each(data, this.joinWizardAndBolus);
_.each(data, this.joinBolusAndDosingDecision);
```

Related datums are linked together:

| Join | Purpose |
|------|---------|
| **Wizard ↔ Bolus** | Connects bolus calculator inputs with delivered boluses |
| **Bolus ↔ DosingDecision** | Connects Loop AID decisions with resulting boluses |

See [Bolus Data Model](../domains/insulin/bolus/data-model.md) for details on these associations.

### 3. Validate & Filter

```javascript
const validData = _.uniqBy(data, 'id');
const rejectedData = _.remove(validData, d => d.reject || this.filter.byId(d.id).top(1).length);
```

- Schema validation marks invalid datums with `reject: true`
- Duplicates (by `id`) are removed
- Already-indexed datums are filtered out

### 4. Tag Data

```javascript
_.each(validData, this.tagDatum);
```

Tags are boolean flags that categorize datums for filtering and aggregation. See [Tag System](#tag-system) below.

### 5. Index in Crossfilter

```javascript
this.data.add(validData);
```

Valid data is added to the crossfilter index, enabling efficient multi-dimensional queries.

---

## Crossfilter Indexing

[Crossfilter](https://github.com/crossfilter/crossfilter) is a JavaScript library for exploring large multivariate datasets in the browser. DataUtil uses it to enable fast filtering across multiple criteria simultaneously.

### Dimensions

DataUtil creates **8 dimensions** (the recommended maximum per crossfilter docs):

| Dimension | Indexed Field | Purpose |
|-----------|---------------|---------|
| `byTime` | `d.time` or `d.deviceTime` | Time range filtering |
| `byType` | `d.type` | Filter by data type |
| `bySubType` | `d.subType` | Filter by subtype (e.g., deviceEvent subtypes) |
| `byDate` | Computed YYYY-MM-DD | Group by calendar date |
| `byDayOfWeek` | Computed 0-6 | Filter to specific weekdays |
| `byId` | `d.id` | Lookup specific datums |
| `byDeviceId` | `d.deviceId` | Exclude specific devices |
| `bySampleInterval` | `d.sampleInterval` | Filter CGM by sample rate |

### Filters

Filters wrap dimension operations:

```javascript
// Filter to a time range
this.filter.byEndpoints([startTime, endTime]);

// Filter to specific types
this.filter.byTypes(['cbg', 'smbg', 'bolus']);

// Exclude specific devices
this.filter.byDeviceIds(['device-to-exclude']);

// Filter to specific weekdays (0=Sun, 6=Sat)
this.filter.byActiveDays([1, 2, 3, 4, 5]); // weekdays only
```

### Performance Note: Hammertime

Timestamps are stored as integers (milliseconds since epoch) internally rather than ISO strings:

```javascript
// On ingestion (normalizeDatumIn)
d._time = d.time;           // Preserve original for debugging or outputting raw data
d.time = Date.parse(d.time); // Convert to integer

// On raw output (normalizeDatumOut, when auery contains { raw: true })  
d.time = d._time;           // Restore original string
```

Integer comparisons are significantly faster than string parsing during filter operations.

---

## Tag System

Tags are boolean flags applied during ingestion that categorize datums for filtering and aggregation.

### How Tags Are Applied

Tags are set in `tagDatum()` based on datum properties:

```javascript
// Basal tags
d.tags = {
  suspend: d.deliveryType === 'suspend',
  temp: d.deliveryType === 'temp',
};

// Bolus tags (computed from bolus utility functions)
d.tags = {
  automated: isAutomated(d),
  correction: isCorrection(d),
  extended: hasExtended(d),
  interrupted: isInterruptedBolus(d),
  manual: !isWizardOrDosingDecision && !isAutomated(d),
  override: isOverride(d),
  underride: isUnderride(d),
  wizard: !!isWizardOrDosingDecision,
  loop: !!this.loopDataSetsByIdMap[d.uploadId],
};
```

### Tag Categories by Type

| Type | Tags |
|------|------|
| **basal** | `suspend`, `temp` |
| **bolus** | `automated`, `correction`, `extended`, `interrupted`, `manual`, `override`, `underride`, `wizard`, `loop`, `oneButton` |
| **insulin** | `manual` (always true for pen/syringe) |
| **wizard** | `extended`, `interrupted`, `override`, `underride` |
| **smbg** | `manual`, `meter` |
| **food** | `loop`, `dexcom`, `manual` |
| **deviceEvent** | `automatedSuspend`, `calibration`, `siteChange`, `reservoirChange`, `cannulaPrime`, `tubingPrime`, `alarm` |

### EVENT Tags

Any datum can receive a special `event` tag for display in the events zone:

```javascript
const prioritizedEventTypes = [
  EVENT_PUMP_SHUTDOWN,      // Control-IQ pump shutdowns
  EVENT_PHYSICAL_ACTIVITY,  // physicalActivity type
  EVENT_HEALTH,             // reportedState with health states
  EVENT_NOTES,              // reportedState with notes
];
```

Only one event tag is applied per datum (highest priority wins).

### How Tags Are Used

Tags enable efficient aggregation via `AggregationUtil.reduceByTag()`:

```javascript
// Count boluses by tag for calendar view
const bolusCounts = aggregationUtil.reduceByTag('bolus', [
  'automated', 'correction', 'manual', 'wizard'
]);
```

---

## Query System

The `query()` method is the primary interface for retrieving data:

```javascript
const result = dataUtil.query({
  endpoints: [startTime, endTime],
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  types: {
    cbg: {},
    smbg: {},
    bolus: { fields: ['normal', 'expectedNormal'] },
  },
  stats: ['timeInRange', 'averageGlucose'],
  aggregationsByDate: 'basals',
});
```

### Query Options

| Option | Type | Description |
|--------|------|-------------|
| `endpoints` | `[start, end]` | Time range (hammertimes) |
| `activeDays` | `number[]` | Days of week to include (0=Sun) |
| `types` | `object` | Data types to retrieve with optional field filtering |
| `stats` | `string[]` | Statistics to compute |
| `aggregationsByDate` | `string` | Aggregation preset name |
| `bgSource` | `string` | BG source for stats (`'cbg'` or `'smbg'`) |
| `excludedDevices` | `string[]` | Device IDs to exclude |

### Query Result

```javascript
{
  data: {
    cbg: [...],
    smbg: [...],
    bolus: [...],
  },
  stats: {
    timeInRange: { ... },
    averageGlucose: { ... },
  },
  aggregationsByDate: {
    basals: { ... },
  },
  metaData: {
    matchedDevices: { ... },
    queryDataCount: 5,
  },
}
```

---

## Statistics & Aggregation

### StatUtil Integration

When `stats` are requested, DataUtil delegates to `StatUtil`:

```javascript
// In query()
if (opts.stats) {
  result.stats = this.statUtil.getStats(opts.stats, data);
}
```

StatUtil computes clinical statistics like Time in Range, Average Glucose, GMI, etc. See [Calculation Reference](../appendices/calculation-reference.md) for formulas.

### AggregationUtil Integration

When `aggregationsByDate` is requested, DataUtil uses `AggregationUtil`:

```javascript
// In query()
if (opts.aggregationsByDate) {
  result.aggregationsByDate = this.aggregationUtil.aggregateByDate(
    opts.aggregationsByDate,
    data
  );
}
```

AggregationUtil produces date-keyed summaries for calendar views (Basics view).

---

## Caching Strategy

### ID Maps

Several maps are maintained for O(1) lookups during joins:

| Map | Purpose |
|-----|---------|
| `bolusDatumsByIdMap` | Bolus lookups for wizard joining |
| `wizardDatumsByIdMap` | Wizard lookups for bolus joining |
| `pumpSettingsDatumsByIdMap` | Settings for dosingDecision joining |
| `bolusToWizardIdMap` | Bolus ID → Wizard ID |
| `wizardToBolusIdMap` | Wizard ID → Bolus ID |
| `bolusDosingDecisionDatumsByIdMap` | DosingDecision for Loop bolus joining |
| `loopDataSetsByIdMap` | Continuous Loop uploads |
| `dexcomDataSetsByIdMap` | Continuous Dexcom uploads |

### Memoization

CBG deduplication is memoized based on query parameters:

```javascript
getDeduplicatedCBGData = _.memoize(
  this.deduplicateCBGData,
  data => {
    // Cache key includes all filter state
    return `${firstId}_${lastId}_${units}_${endpoints}_${activeDays}_${excludedDevices}_${sampleInterval}`;
  }
);
```

### Cache Invalidation

- `removeData()` without predicate reinitializes everything
- `matchedDevices` cleared when filter parameters change
- Memoization cache invalidates when cache key changes

---

## Metadata Management

DataUtil maintains several metadata objects:

### `latestDatumByType`

Tracks the most recent datum of each type for quick access:

```javascript
{
  cbg: { /* most recent CBG */ },
  basal: { /* most recent basal */ },
  pumpSettings: { /* most recent settings */ },
  // ...
}
```

### `latestPumpUpload`

Computed object describing the active pump. See [Data Management](./data-management.md) for selection algorithm.

### `bgSources`

Available BG data sources:

```javascript
{
  cbg: true,
  smbg: true,
  current: 'cbg',  // Primary source for stats
}
```

### `devices`

Device metadata keyed by `deviceId`:

```javascript
{
  'tandemCIQ12345': {
    id: 'tandemCIQ12345',
    label: 'Tandem t:slim X2',
    tags: ['insulin-pump'],
  },
  'DexG6_ABC': {
    id: 'DexG6_ABC',
    label: 'Dexcom G6',
    tags: ['cgm'],
  },
}
```

---

## Key Design Decisions

### 1. In-Place Mutation

DataUtil mutates datums in place during normalization for performance. Original values are preserved with underscore prefixes (e.g., `_time`) when needed for output restoration.

### 2. Worker-First Design

DataUtil is designed to run in a Web Worker, which is why it:

- Clones input data to avoid cross-thread issues
- Returns serializable results
- Avoids DOM dependencies

### 3. Progressive Enhancement

Query results can be progressively enhanced:

- Basic queries return raw data
- Add `stats` for computed statistics
- Add `aggregationsByDate` for calendar summaries

### 4. Type-Driven Processing

Both ingestion (`normalizeDatumIn`) and output (`normalizeDatumOut`) use type-based switches to apply appropriate transformations.

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/utils/DataUtil.js` | Main DataUtil class (~2000 lines) |
| `src/utils/StatUtil.js` | Statistics computation |
| `src/utils/AggregationUtil.js` | Date-based aggregations |
| `src/utils/validation/schema.js` | Datum validation schemas |
| `src/utils/bolus.js` | Bolus utility functions (used in tagging) |

---

## See Also

- [Data Management](./data-management.md) - Upload processing and device selection
- [Device Detection](./device-detection.md) - Manufacturer and feature detection
- [Calculation Reference](../appendices/calculation-reference.md) - Statistics formulas
- [Data Model Complete](../appendices/data-model-complete.md) - Field reference
