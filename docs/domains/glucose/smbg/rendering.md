# SMBG Rendering

Part of the [SMBG Subdomain](./index.md).

---

## SMBG Tooltip

The `SMBGTooltip` component displays details for fingerstick readings on hover.

### Component

**File**: `src/components/daily/smbgtooltip/SMBGTooltip.js`

### Props

| Prop | Type | Description |
|------|------|-------------|
| `smbg` | object | SMBG datum with `value`, `units`, `subType`, `annotations` |
| `bgPrefs` | object | BG display preferences (`bgUnits`, `bgClasses`) |
| `timePrefs` | object | Timezone preferences |
| `position` | object | `{ top, left }` position coordinates |
| `side` | string | Tooltip placement: `'top'`, `'right'`, `'bottom'`, `'left'` |

### Content Sections

The tooltip displays:

1. **Title**: Time formatted as "h:mm a" (e.g., "8:00 AM")
2. **BG Value**: Glucose reading with units and range color
3. **Source**: Reading source indicator (Meter, Manual, Linked)
4. **Calibration Status**: Medtronic 600-series status (if applicable)
5. **Annotations**: Out-of-range messages if applicable

---

## Basic SMBG Screenshots

| Range | Screenshot |
|-------|------------|
| Very Low | ![Very Low](./screenshots/veryLow.png) |
| Low | ![Low](./screenshots/low.png) |
| Target | ![Target](./screenshots/target.png) |
| High | ![High](./screenshots/high.png) |
| Very High | ![Very High](./screenshots/veryHigh.png) |

---

## Source Indicators

SMBG readings show their source method:

| Source | Screenshot | Description |
|--------|------------|-------------|
| Meter | (default) | Standard meter upload |
| Manual | ![Manual](./screenshots/manual.png) | User-entered value |
| Linked | ![Linked](./screenshots/linked.png) | Meter connected to pump |

### Source Detection

```javascript
// SMBGTooltip.js
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

## Medtronic 600-Series

The Medtronic 600-series pumps have special SMBG handling for CGM calibration. These readings show additional calibration status annotations.

### Calibration Status Screenshots

| Status | Screenshot | Annotation Code |
|--------|------------|-----------------|
| Accepted | ![Accepted](./screenshots/medT600accepted.png) | `medtronic600/smbg/user-accepted-remote-bg` |
| Accepted (Manual) | ![Accepted Manual](./screenshots/medT600acceptedManual.png) | Combined manual + accepted |
| Rejected | ![Rejected](./screenshots/medT600rejected.png) | `medtronic600/smbg/user-rejected-remote-bg` |
| Rejected (Linked) | ![Rejected Linked](./screenshots/medT600rejectedLinked.png) | Combined linked + rejected |
| Timed Out | ![Timed Out](./screenshots/medT600timedout.png) | `medtronic600/smbg/bg-sent-but-timed-out` |
| Timeout (Manual) | ![Timeout Manual](./screenshots/medT600timeoutManual.png) | Combined manual + timeout |

### Non-Calibration Readings

Some Medtronic readings are marked as non-calibration (entered outside calibration flow):

| Type | Screenshot |
|------|------------|
| Non-calib Manual | ![Non-calib Manual](./screenshots/medT600noncalibManual.png) |
| Accepted Non-calib Manual | ![Accepted Non-calib](./screenshots/medT600acceptedNoncalibManual.png) |
| Calib Manual | ![Calib Manual](./screenshots/medT600calibManual.png) |

### Detection Logic

```javascript
// Check for Medtronic 600-series calibration annotations
const MED_T600_ANNOTATIONS = {
  ACCEPTED: 'medtronic600/smbg/user-accepted-remote-bg',
  REJECTED: 'medtronic600/smbg/user-rejected-remote-bg',
  TIMED_OUT: 'medtronic600/smbg/bg-sent-but-timed-out',
  MANUAL: 'medtronic600/smbg/manual-entry',
  NON_CALIB: 'medtronic600/smbg/non-calibration-entry',
};

getCalibrationStatus(smbg) {
  const annotations = smbg.annotations || [];
  // Check each annotation code...
}
```

---

## Visual Representation

### Daily View

In the Daily view, SMBG readings appear as circles positioned on the glucose scale:

- **Size**: Fixed radius (larger than CGM dots)
- **Color**: Border colored by glycemic range
- **Fill**: White fill with colored border
- **Interaction**: Hover shows SMBGTooltip

### Trends View

In Trends view, SMBG readings are overlaid on CGM trend bands:

- **Position**: Scattered at actual time of day
- **Size**: Same as Daily view
- **Visibility**: Can be toggled on/off
- **Use case**: Compare spot checks to CGM patterns

### BG Log View

The BG Log presents SMBG in tabular format:

- Sortable by date/time
- Grouped by day
- Shows value, source, and annotations
- Week summary statistics

---

## Color Coding

SMBG values use the same color coding as CBG:

| Range | CSS Variable | Color | Hex |
|-------|--------------|-------|-----|
| Very Low | `--veryLow` | Red | `#FB5951` |
| Low | `--low` | Light Red | `#FF8B7C` |
| Target | `--target` | Green | `#76D3A6` |
| High | `--high` | Light Purple | `#BB9AE7` |
| Very High | `--veryHigh` | Purple | `#8C65D6` |

---

## Readings in Range Stat

The "Readings in Range" statistic shows the distribution of SMBG readings across glycemic ranges.

![Readings in Range](./screenshots/ReadingsInRange.png)

Unlike Time in Range (CGM), this counts discrete readings rather than time coverage.

---

## Key Source Files

| Purpose | File |
|---------|------|
| SMBG Tooltip | `src/components/daily/smbgtooltip/SMBGTooltip.js` |
| BG classification | `src/utils/bloodglucose.js` |
| BG formatting | `src/utils/format.js` |
| Colors | `src/styles/colors.css` |
| Daily view | `src/components/daily/` |

---

## See Also

- [SMBG Overview](./index.md) - Data structure and concepts
- [Glucose Domain](../index.md) - Parent domain overview
- [CBG Rendering](../cbg/rendering.md) - CGM tooltip comparison
- [Device Events: Calibration](../../device-events/calibration.md) - Calibration events
