# Device Events Domain

Device events capture various state changes and actions from insulin pumps, CGMs, and other diabetes devices.

---

## Overview

The `deviceEvent` type is a versatile container for device-specific events. Each event has a `subType` identifying the specific event category.

| SubType | Description | Documentation |
|---------|-------------|---------------|
| `status` | Pump status changes (suspend/resume) | [Suspends](./suspends.md) |
| `prime` | Tubing/cannula priming | [Site Changes](./site-changes.md) |
| `reservoirChange` | Cartridge/reservoir replaced | [Site Changes](./site-changes.md) |
| `alarm` | Device alarms | [Alarms](./alarms.md) |
| `calibration` | CGM calibration | [Calibration](./calibration.md) |
| `timeChange` | Device clock adjustment | [Time Changes](./time-changes.md) |
| `pumpSettingsOverride` | Activity modes (sleep, exercise) | [Overrides](./overrides.md) |

---

## Data Structure

### Base Device Event

```javascript
{
  type: "deviceEvent",
  subType: "status",              // event category
  time: "2024-01-15T14:30:00Z",
  normalTime: 1705329000000,      // processed timestamp
  deviceId: "pump_12345",
  uploadId: "upload_abc",
  // ... common fields
}
```

---

## Processing & Tagging

Device events are tagged during data processing for efficient filtering:

```javascript
// src/utils/DataUtil.js
if (d.type === 'deviceEvent') {
  const isReservoirChange = d.subType === 'reservoirChange';
  const isPrime = d.subType === 'prime';
  
  d.tags = {
    [ALARM]: d.subType === 'alarm' && _.includes(recognizedAlarmTypes, d.alarmType),
    [ALARM_NO_INSULIN]: d.alarmType === ALARM_NO_INSULIN,
    [ALARM_OCCLUSION]: d.alarmType === ALARM_OCCLUSION,
    // ... etc
  };
}
```

---

## Files in This Domain

| File | Content |
|------|---------|
| [alarms.md](./alarms.md) | Device alarms (occlusion, no insulin, etc.) |
| [suspends.md](./suspends.md) | Insulin delivery suspends |
| [site-changes.md](./site-changes.md) | Prime and reservoir change events |
| [overrides.md](./overrides.md) | Sleep, exercise, pre-meal modes |
| [calibration.md](./calibration.md) | CGM calibration events |
| [time-changes.md](./time-changes.md) | Device clock adjustments |

---

## Key Source Files

| Purpose | File |
|---------|------|
| Device event fixtures | `data/deviceEvent/fixtures.js` |
| Data processing | `src/utils/DataUtil.js` |
| Constants | `src/utils/constants.js` |
| Aggregation | `src/utils/AggregationUtil.js` |

---

## See Also

- [Insulin Domain: Basal](../insulin/basal/index.md) - Suspend basal delivery type
- [Glucose Domain: SMBG](../glucose/smbg/index.md) - References calibration
- [Tidepool Data Model](../../concepts/tidepool-data-model.md) - All data types
