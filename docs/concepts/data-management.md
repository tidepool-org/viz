# Data Management & Upload Processing

This document explains how Tidepool Viz manages upload data, determines the active pump, and associates metadata with individual datums. Understanding this system is essential for debugging device display issues and adding support for new devices.

---

## Upload Data Type

Every data upload session creates an `upload` record that serves as metadata for all datums uploaded in that session.

### Upload Record Structure

```javascript
{
  type: 'upload',
  id: 'upid_abc123...',           // Unique upload identifier
  uploadId: 'upid_abc123...',     // Same as id (used for associations)
  time: '2026-01-15T10:30:00.000Z',
  timezone: 'America/Los_Angeles',
  
  // Device identification
  deviceTags: ['insulin-pump'],   // Array: 'insulin-pump', 'cgm', 'bgm'
  deviceManufacturers: ['Tandem'], // Array of manufacturer names
  deviceModel: 'tandemCIQ12345',  // Device model identifier
  deviceSerialNumber: 'ABC123',   // Serial number
  
  // Data source metadata
  dataSetType: 'continuous',      // 'continuous' for streaming, absent for discrete
  source: 'Tandem',               // Optional explicit source
  
  // Client/origin information (for Loop detection)
  client: {
    name: 'org.tidepool.TidepoolLoop',
    version: '2.1.0',
  },
  origin: {
    name: 'org.tidepool.TidepoolLoop',
  },
}
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `uploadId` | Links all datums from this upload session |
| `deviceTags` | Identifies device type (pump, CGM, meter) |
| `deviceManufacturers` | Array of manufacturer names |
| `dataSetType` | `'continuous'` for streaming data (Loop, Dexcom API) |
| `client.name` / `origin.name` | Used for Loop variant detection |

### Continuous vs Discrete Datasets

| Type | Description | Examples |
|------|-------------|----------|
| **Continuous** | Streaming data uploaded incrementally over time | Tidepool Loop, DIY Loop, Twiist, Dexcom API |
| **Discrete** | Batch uploads from device reads | Tandem t:connect, Medtronic CareLink, OmniPod |

This distinction affects how `pumpSettings` are associated with pump data (see [PumpSettings Time Constraints](#pumpsettings-time-constraints)).

---

## Upload Mapping

DataUtil builds two key maps during data ingestion:

### `uploadMap`

Maps `uploadId` to source metadata:

```javascript
uploadMap = {
  'upid_abc123': {
    source: 'tandem',           // Normalized manufacturer/source
    deviceSerialNumber: 'ABC123',
  },
  'upid_def456': {
    source: 'tidepool loop',
    deviceSerialNumber: 'XYZ789',
  },
}
```

### `deviceUploadMap`

Maps `deviceId` to `uploadId`:

```javascript
deviceUploadMap = {
  'tandemCIQ12345': 'upid_abc123',
  'DexG6_ABC': 'upid_ghi789',
}
```

**Implementation**: `DataUtil.setUploadMap()` at `src/utils/DataUtil.js:1764-1812`

---

## Source Determination Logic

The `source` field is determined through a priority-based resolution:

```
1. Explicit upload.source field (highest priority)
       ↓ (if not present)
2. deviceManufacturers[0] with special case handling
       ↓ (if not present or special case)
3. Loop variant detection via origin/client name patterns
       ↓ (if no match)
4. 'Unknown' (fallback)
```

### Special Cases

| Condition | Result |
|-----------|--------|
| `deviceManufacturers[0] === 'Medtronic'` AND pumpSettings has `source: 'carelink'` | `'carelink'` |
| `deviceManufacturers[0] === 'Sequel'` AND pumpSettings has `model: 'twiist'` | `'twiist'` |
| pumpSettings matches Tidepool Loop pattern | `'tidepool loop'` |
| pumpSettings matches DIY Loop pattern | `'diy loop'` |
| upload matches Twiist Loop pattern (pre-3.0.0) | `'twiist'` |

### Why CareLink is Special

Medtronic data can come from two sources:
- **Medtronic Direct**: Uploaded via Tidepool Uploader directly from pump
- **CareLink**: Imported from Medtronic's CareLink web service

The Uploader doesn't set `source` for CareLink imports, so the code checks pumpSettings for `source: 'carelink'` to distinguish them.

---

## Latest Pump Upload Selection

The `latestPumpUpload` object determines which pump and settings are displayed in the UI. This is a **two-phase algorithm**:

### Phase 1: Find Latest Pump Data

```javascript
// Find the most recent basal or bolus datum
const pumpDataTypes = ['basal', 'bolus'];
let latestPumpData = null;

_.each(pumpDataTypes, dataType => {
  const datum = this.latestDatumByType[dataType];
  if (datum && datum.time > latestPumpDataTime) {
    latestPumpData = datum;
  }
});

// Use the uploadId from that datum to find the upload record
if (latestPumpData && latestPumpData.uploadId) {
  latestPumpUpload = _.find(uploadData, { uploadId: latestPumpData.uploadId });
}
```

### Phase 2: Fallback

If no pump data exists or no matching upload found:

```javascript
// Fall back to finding the last upload with deviceTags: ['insulin-pump']
latestPumpUpload = getLatestPumpUpload(uploadData);
```

### Why Two Phases?

The primary strategy (pump data first) ensures the displayed upload reflects actual therapy data, not just the most recent upload record. This handles edge cases where:

- Multiple pumps are uploaded
- An upload exists but contains no pump data
- Settings were uploaded separately from pump data

**Implementation**: `DataUtil.setLatestPumpUpload()` at `src/utils/DataUtil.js:1661-1762`

---

## PumpSettings Association

After selecting the upload, the algorithm finds the appropriate `pumpSettings`:

### PumpSettings Time Constraints

The time constraint differs by dataset type:

| Dataset Type | Constraint | Reason |
|--------------|------------|--------|
| **Continuous** | `pumpSettings.time <= latestPumpData.time` | Settings may be uploaded after pump data arrives |
| **Discrete** | `pumpSettings.time <= latestPumpUpload.time` | Settings are written before the upload record |

```javascript
if (latestPumpData && isContinuous) {
  // For continuous: settings must precede latest pump data
  pumpSettingsForUpload = _.filter(
    pumpSettingsForUpload,
    ps => ps.time <= latestPumpData.time
  );
} else {
  // For discrete: settings must precede upload record
  pumpSettingsForUpload = _.filter(
    pumpSettingsForUpload,
    ps => ps.time <= latestPumpUpload.time
  );
}
```

### Selection Priority

1. Filter pumpSettings by matching `uploadId`
2. Apply time constraint based on dataset type
3. Select the most recent valid settings (`_.maxBy(pumpSettingsForUpload, 'time')`)
4. Fall back to `latestDatumByType.pumpSettings` if no match (with same constraints)

---

## Latest Pump Upload Object

The final `latestPumpUpload` object contains:

```javascript
{
  deviceModel: 'tandemCIQ12345',
  manufacturer: 'tandem',           // Normalized from uploadMap source
  settings: { /* pumpSettings datum */ },
  
  // Feature flags (see Device Detection docs)
  isAutomatedBasalDevice: true,
  isAutomatedBolusDevice: true,
  isSettingsOverrideDevice: true,
}
```

This object drives:
- Settings view rendering (which component to use)
- Pump vocabulary selection (terminology)
- Feature availability (automated basal, overrides, etc.)

---

## Datum-to-Upload Relationship

Every datum includes an `uploadId` linking it to its upload session. During normalization, DataUtil enriches datums with metadata from the upload:

```javascript
// In normalizeDatumIn()
datum.source = this.uploadMap[datum.uploadId]?.source;
datum.deviceSerialNumber = this.uploadMap[datum.uploadId]?.deviceSerialNumber;
```

This enables:
- **Source attribution**: Knowing which system/device produced the datum
- **Serial number display**: Showing device identification in tooltips
- **Device feature detection**: Checking if datum is from Loop, Dexcom, etc.

---

## Debugging Upload Issues

### Common Issues

| Symptom | Likely Cause | Investigation |
|---------|--------------|---------------|
| Wrong manufacturer displayed | Source resolution picked wrong value | Check `uploadMap` entries, verify `deviceManufacturers` array |
| Missing pump settings | Time constraint filtering | Check if settings time > pump data time (continuous) |
| "Unknown" source | No matching detection pattern | Check `client.name`, `origin.name`, `deviceManufacturers` |
| Wrong pump selected (multi-pump) | Latest pump data from unexpected device | Check `latestDatumByType.basal` and `latestDatumByType.bolus` |

### Inspection Points

1. **Upload records**: `filter.byType('upload').top(Infinity)`
2. **Upload map**: `dataUtil.uploadMap`
3. **Latest pump upload**: `dataUtil.latestPumpUpload`
4. **PumpSettings by upload**: Filter `pumpSettingsDatumsByIdMap` by `uploadId`

---

## Key Source Files

| Purpose | File | Lines |
|---------|------|-------|
| Upload map building | `src/utils/DataUtil.js` | 1764-1812 |
| Latest pump upload selection | `src/utils/DataUtil.js` | 1661-1762 |
| Datum normalization | `src/utils/DataUtil.js` | 900-1000 |
| Device detection utilities | `src/utils/device.js` | All |
| Latest pump upload helper | `src/utils/device.js` | 16-18 |

---

## See Also

- [Device Detection](./device-detection.md) - How manufacturers and features are identified
- [Settings Domain](../domains/settings/index.md) - Pump settings data model and rendering
- [Appendix: Device Matrix](../appendices/device-matrix.md) - Complete device reference
