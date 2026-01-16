# Calibration Events

Part of the [Device Events Domain](./index.md).

CGM calibration events record fingerstick readings used to calibrate continuous glucose monitors.

---

## Calibration Event Structure

```javascript
{
  type: "deviceEvent",
  subType: "calibration",
  value: 105,                     // fingerstick value
  units: "mg/dL",                 // or "mmol/L"
  time: "2024-01-15T14:30:00Z",
}
```

---

## Calibration vs SMBG

Calibration events are related to but distinct from SMBG records:

| Aspect | Calibration Event | SMBG Record |
|--------|-------------------|-------------|
| Type | `deviceEvent` | `smbg` |
| SubType | `calibration` | — |
| Purpose | CGM calibration | General fingerstick |
| Creation | When CGM accepts value | Any fingerstick upload |

A fingerstick reading may generate both:
1. An `smbg` record (the raw reading)
2. A `deviceEvent/calibration` record (if used for CGM calibration)

---

## Calibration Requirements by Device

| CGM Device | Calibration Required | Notes |
|------------|----------------------|-------|
| Dexcom G6/G7 | No | Factory calibrated |
| FreeStyle Libre 2/3 | No | Factory calibrated |
| Medtronic Guardian 3/4 | Yes | 2-4 calibrations/day |
| Older CGMs | Yes | Required for accuracy |

---

## Medtronic 600-Series SMBG

The Medtronic 600-series pumps have special calibration handling. SMBG records include calibration status annotations:

| Status | Annotation Code | Meaning |
|--------|-----------------|---------|
| Accepted | `medtronic600/smbg/user-accepted-remote-bg` | Used for calibration |
| Rejected | `medtronic600/smbg/user-rejected-remote-bg` | Value out of range |
| Timed Out | `medtronic600/smbg/bg-sent-but-timed-out` | Not entered in time |

See [SMBG Rendering](../glucose/smbg/rendering.md#medtronic-600-series) for visual details.

---

## Key Source Files

| Purpose | File |
|---------|------|
| Data processing | `src/utils/DataUtil.js` |
| Validation schema | `src/utils/validation/schema.js` |

---

## See Also

- [Device Events Overview](./index.md)
- [SMBG Subdomain](../glucose/smbg/index.md) - Fingerstick readings
- [SMBG Rendering](../glucose/smbg/rendering.md) - Medtronic calibration display
