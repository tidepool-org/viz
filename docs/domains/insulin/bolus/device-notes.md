# Bolus Device-Specific Notes

This document covers manufacturer-specific variations in bolus data and terminology.

---

## Overview

Different insulin pump manufacturers use varying terminology and data structures. Understanding these differences is important for:

1. Displaying appropriate labels in tooltips
2. Interpreting BG target fields correctly
3. Handling extended/combo bolus capabilities

---

## Manufacturer Comparison

| Feature | Medtronic | Tandem | Insulet (OmniPod) | Animas | Loop |
|---------|-----------|--------|-------------------|--------|------|
| **Normal bolus** | Yes | Yes | Yes | Yes | Yes |
| **Extended bolus** | Yes | Yes | Yes | Yes | No |
| **Combo bolus** | Yes ("Dual Wave") | Yes | Yes | Yes ("Combo") | No |
| **Automated bolus** | Yes (670G+) | Yes (Control-IQ) | Yes (Omnipod 5) | No | Yes |
| **BG Target format** | low/high | target | target/high | target/range | low/high |

---

## BG Target Structures

### Medtronic

Uses a range defined by low and high bounds:

```javascript
bgTarget: {
  low: 80,
  high: 120,
}
// Target is anywhere in this range
```

### Tandem

Uses a single target value:

```javascript
bgTarget: {
  target: 110,
}
// Correct toward this value
```

### Insulet (OmniPod)

Uses target with a "correct above" threshold:

```javascript
bgTarget: {
  target: 100,
  high: 120,  // Only correct if BG > this value
}
```

### Animas

Uses target with a range (±):

```javascript
bgTarget: {
  target: 100,
  range: 20,  // ±20, so effective range is 80-120
}
```

### Loop Systems

Use low/high range (same as Medtronic):

```javascript
bgTarget: {
  low: 80,
  high: 100,
}
```

---

## Extended Bolus Names

| Manufacturer | Terminology |
|--------------|-------------|
| Medtronic | "Square Wave Bolus" |
| Tandem | "Extended Bolus" |
| Insulet | "Extended Bolus" |
| Animas | "Extended Bolus" |

---

## Combo Bolus Names

| Manufacturer | Terminology |
|--------------|-------------|
| Medtronic | "Dual Wave Bolus" |
| Tandem | "Combo Bolus" |
| Insulet | "Combo Bolus" |
| Animas | "Combination Bolus" |

---

## Automated Bolus Systems

### Medtronic 670G/770G/780G

- Auto Mode delivers "micro-boluses" for correction
- Recorded as `subType: "automated"`
- Part of "Auto Mode" automated basal

### Tandem Control-IQ

- Automatic correction boluses
- Up to once per hour
- Recorded as `subType: "automated"`

### Insulet Omnipod 5

- Automated Basal/Bolus system
- SmartBolus corrections
- Recorded as `subType: "automated"`

### Tidepool Loop / DIY Loop

- Algorithm calculates recommended bolus
- `dosingDecision` records algorithm recommendation
- User confirms via app

---

## Bolus Limits

Maximum bolus settings vary by pump:

| Manufacturer | Default Max | Range |
|--------------|-------------|-------|
| Medtronic | 25u | 0-25u |
| Tandem | 25u | 0-25u |
| Insulet | 30u | 0.05-30u |
| Animas | 35u | 0-35u |

These are user-configurable in pump settings.

---

## Precision and Increments

| Manufacturer | Bolus Increment |
|--------------|-----------------|
| Medtronic | 0.025u or 0.05u |
| Tandem | 0.01u |
| Insulet | 0.05u |
| Animas | 0.05u |

This affects display precision in tooltips.

---

## Insulin Duration (IOB)

Active insulin duration settings affect IOB calculations:

| Manufacturer | Default | Range |
|--------------|---------|-------|
| Medtronic | 4 hours | 2-8 hours |
| Tandem | 5 hours | 2-8 hours |
| Insulet | 4 hours | 2-6 hours |
| Loop | 6 hours | Configurable |

---

## Data Quirks

### Medtronic

- Pre-bolus: Can deliver bolus before eating
- Bolus wizard entries may have `null` carbInput
- 600-series has special SMBG calibration handling

### Tandem

- Uses `bgTargets` (plural) with named profiles
- Control-IQ activity modes affect bolus calculations
- Sleep mode reduces correction boluses

### Insulet (OmniPod)

- Pod changes reset some settings
- DASH vs Eros have different data formats
- Omnipod 5 has different automated bolus format

### Animas (Discontinued)

- Older data format
- `target` + `range` for BG targets
- No longer manufactured (2017)

### Loop Systems

- `dosingDecision` records for all boluses
- Multiple BG target schedules per day
- Override presets affect targets temporarily

---

## Validation Differences

From `src/utils/validation/schema.js`:

### Medtronic Schema

```javascript
pumpSettingsMedtronic: {
  bgTarget: [{
    start: minZero,
    low: minZero,
    high: minZero,
    target: forbidden,
    range: forbidden,
  }],
}
```

### Animas Schema

```javascript
pumpSettingsAnimas: {
  bgTarget: [{
    start: minZero,
    target: minZero,
    range: minZero,
    low: forbidden,
    high: forbidden,
  }],
}
```

### OmniPod Schema

```javascript
pumpSettingsOmnipod: {
  bgTarget: [{
    start: minZero,
    target: minZero,
    high: minZero,
    range: forbidden,
    low: forbidden,
  }],
}
```

---

## Tooltip Display Logic

Tooltips adapt based on manufacturer:

```javascript
// Simplified logic from BolusTooltip
function renderBgTarget(wizard, manufacturer) {
  const bgTarget = wizard.bgTarget;
  
  switch (getTargetType(manufacturer)) {
    case 'lowHigh':
      return `${bgTarget.low} - ${bgTarget.high}`;
    case 'targetOnly':
      return `${bgTarget.target}`;
    case 'targetHigh':
      return `${bgTarget.target} (correct above ${bgTarget.high})`;
    case 'targetRange':
      return `${bgTarget.target} ± ${bgTarget.range}`;
  }
}
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| Pump vocabulary | `src/utils/constants.js` |
| Validation schemas | `src/utils/validation/schema.js` |
| Settings display | `src/components/settings/` |
| Pump settings data | `data/pumpSettings/` |

---

## See Also

- [Bolus Overview](./index.md)
- [Bolus Rendering](./rendering.md)
- [Pump Settings Domain](../settings/) (if available)
- [Tidepool Data Model](../../concepts/tidepool-data-model.md)
