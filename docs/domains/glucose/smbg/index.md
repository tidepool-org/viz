# SMBG (Self-Monitored Blood Glucose)

Part of the [Glucose Domain](../index.md).

---

## Overview

SMBG (Self-Monitored Blood Glucose) data comes from fingerstick blood glucose meters. Unlike continuous CGM data, SMBG readings are discrete spot-checks that provide point-in-time glucose values.

| Aspect | Details |
|--------|---------|
| **Data Type** | `smbg` |
| **Typical Frequency** | 1-10 readings/day |
| **Primary Use** | Spot checks, meal verification, CGM calibration |
| **Key Advantage** | Direct blood measurement (vs. interstitial) |

---

## Data Structure

```javascript
{
  type: "smbg",
  value: 98,                     // Glucose reading
  units: "mg/dL",                // or "mmol/L"
  subType: "manual",             // optional: "manual", "linked"
  time: "2024-01-15T08:00:00Z",  // UTC timestamp
  deviceId: "Contour_12345",     // Meter device identifier
  uploadId: "upid_xyz789",       // Upload batch identifier
  // ... common fields (normalTime, localDate, etc.)
}
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `value` | number | Glucose reading in specified units |
| `units` | string | `"mg/dL"` or `"mmol/L"` |
| `subType` | string | Entry method: `"manual"` or `"linked"` |
| `deviceId` | string | Identifies the meter device |

---

## SMBG SubTypes

The `subType` field indicates how the reading was entered:

| SubType | Description | Use Case |
|---------|-------------|----------|
| `"linked"` | Meter connected to pump | Automatic data transfer |
| `"manual"` | User-entered value | No meter connection, or manual entry in app |
| (none) | Standard meter upload | Direct upload from standalone meter |

### Source Detection Logic

```javascript
// From src/components/daily/smbgtooltip/SMBGTooltip.js
getSource(smbg) {
  if (smbg.subType === 'manual') {
    return 'Manual';
  } else if (smbg.subType === 'linked') {
    return 'Linked';
  }
  return 'Meter';
}
```

---

## SMBG with Insulin Pumps

Some insulin pumps accept or reject SMBG readings for calibration or bolus calculations.

### Medtronic 600-Series

The Medtronic 600-series pumps have special calibration handling. The SMBG record includes calibration status annotations:

| Status | Meaning | Visual |
|--------|---------|--------|
| **Accepted** | Used for CGM calibration | Checkmark annotation |
| **Rejected** | Value outside acceptable range | X annotation |
| **Timed Out** | Not entered within calibration window | Clock annotation |

#### Calibration Status Fields

```javascript
{
  type: "smbg",
  value: 145,
  annotations: [
    {
      code: "medtronic600/smbg/user-accepted-remote-bg",
      // or: "medtronic600/smbg/user-rejected-remote-bg"
      // or: "medtronic600/smbg/bg-sent-but-timed-out"
    }
  ]
}
```

#### Detection Logic

```javascript
// Check for Medtronic 600-series SMBG
isMedtronic600(smbg) {
  const annotations = smbg.annotations || [];
  return annotations.some(ann => 
    ann.code?.startsWith('medtronic600/smbg/')
  );
}
```

---

## SMBG Aggregations

SMBG data is aggregated for statistics differently than CBG due to its discrete nature.

### Readings in Range

Unlike Time in Range (which measures CGM coverage), **Readings in Range** counts the percentage of SMBG readings falling into each glycemic range.

| Range | Definition |
|-------|------------|
| Very Low | < 54 mg/dL |
| Low | 54-69 mg/dL |
| Target | 70-180 mg/dL |
| High | 181-249 mg/dL |
| Very High | ≥ 250 mg/dL |

### Daily Averages

SMBG averages are calculated differently than CGM:

- **Simple average**: Sum of values / number of readings
- **No weighting**: Each reading counts equally (vs. CGM weighted by sample interval)
- **Minimum readings**: Statistics require at least 1 reading per day average

---

## Calibration Events

When an SMBG reading is used to calibrate a CGM device, a separate `deviceEvent` record with `subType: "calibration"` is created. This links to the original SMBG value.

```javascript
{
  type: "deviceEvent",
  subType: "calibration",
  value: 98,                    // Same as SMBG value
  units: "mg/dL",
  time: "2024-01-15T08:01:00Z", // May differ slightly from SMBG time
}
```

See [Device Events: Calibration](../../device-events/calibration.md) for details on calibration event handling.

---

## Views Using SMBG Data

| View | Usage |
|------|-------|
| **Daily** | Circles on timeline, color-coded by range |
| **Trends** | SMBG dots overlaid on CGM trend bands |
| **Basics** | Summary statistics, readings count |
| **BG Log** | Primary view - tabular SMBG listing |

### BG Log View

The BG Log view is SMBG-focused, showing:
- Tabular display of all fingerstick readings
- Date/time, value, source
- Week-at-a-glance summaries

---

## Key Source Files

| Purpose | File |
|---------|------|
| SMBG tooltip | `src/components/daily/smbgtooltip/SMBGTooltip.js` |
| SMBG data processing | `src/utils/DataUtil.js` |
| BG Log utilities | `src/utils/bgLog/data.js` |
| Validation schema | `src/utils/validation/schema.js` |
| Constants | `src/utils/constants.js` |

---

## See Also

- [Glucose Domain](../index.md) - Parent domain overview
- [SMBG Rendering](./rendering.md) - Tooltip and visual details
- [CBG Subdomain](../cbg/index.md) - Continuous glucose data
- [Device Events: Calibration](../../device-events/calibration.md) - Calibration events
- [BG Log View](../../../views/basics.md) - SMBG-focused view
