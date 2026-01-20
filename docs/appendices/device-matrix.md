# Device Matrix

Comprehensive reference of all supported devices, their capabilities, and manufacturer-specific handling.

---

## Quick Reference

### Pump Manufacturers

| Manufacturer | Display Name | Automated Basal | Automated Bolus | Settings Override | Detection |
|--------------|--------------|-----------------|-----------------|-------------------|-----------|
| **Tandem** | Tandem | Control-IQ only | Control-IQ only | Yes | `deviceId` starts with `tandem` |
| **Medtronic** | Medtronic | 670G/780G only | No | No | `source: 'carelink'` or `'medtronic'` |
| **Insulet** | OmniPod | No | No | No | `deviceManufacturers` includes `'Insulet'` |
| **Animas** | Animas | No | No | No | `deviceManufacturers` includes `'Animas'` |
| **Microtech** | Equil | No | No | No | `source: 'MicroTech'` |
| **Tidepool Loop** | Tidepool Loop | Yes | No | Yes | `origin.name` matches `/^org\.tidepool\.[a-zA-Z0-9]*\.?Loop/` |
| **DIY Loop** | DIY Loop | Yes | Yes | Yes | `origin.name` matches `/^com\.[a-zA-Z0-9]*\.?loopkit\.Loop/` |
| **twiist** | twiist | Yes | No | Yes | `origin.name` matches `/^com.dekaresearch.twiist/` |

### CGM Manufacturers

| Manufacturer | Devices | Sample Interval | Detection |
|--------------|---------|-----------------|-----------|
| **Dexcom** | G5, G6, G7 | 5 minutes | `deviceManufacturers` includes `'Dexcom'` |
| **Abbott** | FreeStyle Libre | 15 minutes | `deviceId` starts with `AbbottFreeStyleLibre` |
| **Abbott** | FreeStyle Libre 2 | Variable (in data) | Has `sampleInterval` field |
| **Abbott** | FreeStyle Libre 3 | 5 minutes | `deviceId` starts with `AbbottFreeStyleLibre3` |

---

## Detailed Device Profiles

### Tandem

**Constants**: `TANDEM = 'Tandem'`

**Device Detection**:
```javascript
// Standard Tandem
deviceId.startsWith('tandem')

// Control-IQ (automated features)
deviceId.startsWith('tandemCIQ')
```

**Capabilities**:
- **Control-IQ**: Automated basal delivery, automated bolus, settings overrides
- **Standard**: Manual delivery only

**Settings Overrides**:
| Override | Constant | Marker |
|----------|----------|--------|
| Sleep | `SLEEP` | "Z" |
| Exercise | `PHYSICAL_ACTIVITY` | "E" |

**Terminology**:
| Generic Term | Tandem Term |
|--------------|-------------|
| Reservoir Change | Cartridge Change |
| Tubing Prime | Tubing Fill |
| Cannula Prime | Cannula Fill |
| Automated Delivery | Automation |
| Manual Delivery | Manual |
| Settings Override | Activity |

**Settings Schema**: Profile-based (object with named schedules)
```javascript
{
  bgTargets: { "Normal": [...], "Sick Day": [...] },
  carbRatios: { "Normal": [...] },
  insulinSensitivities: { "Normal": [...] },
  basalSchedules: { "Normal": [...] },
}
```

**BG Target Fields**: `start`, `target`

---

### Medtronic

**Constants**: `MEDTRONIC = 'Medtronic'`

**Device Detection**:
```javascript
source === 'carelink' || source === 'medtronic'
```

**Automated Basal Models** (670G/780G series):
```javascript
['1580', '1581', '1582', '1780', '1781', '1782']
```

**Terminology**:
| Generic Term | Medtronic Term |
|--------------|----------------|
| Reservoir Change | Rewind |
| Tubing Prime | Prime |
| Cannula Prime | Cannula Prime |
| Automated Delivery | Auto Mode |
| Manual Delivery | Manual |
| Insulin Duration | Active Insulin Time |

**Settings Schema**: Flat arrays
```javascript
{
  bgTarget: [{ start, low, high }],
  carbRatio: [{ start, amount }],
  insulinSensitivity: [{ start, amount }],
  basalSchedules: { "standard": [...] },
}
```

**BG Target Fields**: `start`, `low`, `high`

---

### Insulet (OmniPod)

**Constants**: `INSULET = 'Insulet'`

**Display Name**: OmniPod

**Site Change Source**: `reservoirChange` (Pod Change)

**Terminology**:
| Generic Term | OmniPod Term |
|--------------|--------------|
| Reservoir Change | Pod Change |
| Tubing Prime | Pod Activate |
| Cannula Prime | Prime |
| Max Bolus | Maximum Bolus |
| Max Basal | Max Basal Rate |
| Insulin Duration | Duration of Insulin Action |

**Settings Schema**: Flat arrays
```javascript
{
  bgTarget: [{ start, target, high }],
  carbRatio: [{ start, amount }],
  insulinSensitivity: [{ start, amount }],
  basalSchedules: { "standard": [...] },
}
```

**BG Target Fields**: `start`, `target`, `high`

---

### Animas (Legacy)

**Constants**: `ANIMAS = 'Animas'`

**Note**: Animas pumps are discontinued but data may still exist in user accounts.

**Terminology**:
| Generic Term | Animas Term |
|--------------|-------------|
| Reservoir Change | Go Rewind |
| Tubing Prime | Go Prime |
| Cannula Prime | Cannula Fill |

**Settings Schema**: Flat arrays
```javascript
{
  bgTarget: [{ start, target, range }],
  carbRatio: [{ start, amount }],
  insulinSensitivity: [{ start, amount }],
  basalSchedules: { "standard": [...] },
}
```

**BG Target Fields**: `start`, `target`, `range` (target ± range)

---

### Microtech (Equil)

**Constants**: `MICROTECH = 'Microtech'`

**Display Name**: Equil

**Data Source**: `'MicroTech'`

**Terminology**:
| Generic Term | Equil Term |
|--------------|------------|
| Reservoir Change | Rewind |
| Tubing Prime | Reservoir Prime |
| Cannula Prime | Cannula Prime |

**Settings Schema**: Flat arrays (same as Medtronic)

**BG Target Fields**: `start`, `low`, `high`

---

### Tidepool Loop

**Constants**: `TIDEPOOL_LOOP = 'Tidepool Loop'`

**Device Detection**:
```javascript
// Pattern matches origin.name or client.name
/^org\.tidepool\.[a-zA-Z0-9]*\.?Loop/
```

**Capabilities**:
- Automated basal delivery
- Settings overrides
- **No** automated bolus

**Settings Overrides**:
| Override | Constant | Marker | Preset Target Field |
|----------|----------|--------|---------------------|
| Workout | `PHYSICAL_ACTIVITY` | "W" | `bgTargetPhysicalActivity` |
| Pre-Meal | `PREPRANDIAL` | - | `bgTargetPreprandial` |

**Terminology**:
| Generic Term | Tidepool Loop Term |
|--------------|-------------------|
| Automated Delivery | Automation |
| Automated Mode Exited | Off |
| Manual Delivery | Manual |
| Settings Override | Preset |

**Additional Settings Fields**:
| Field | Description |
|-------|-------------|
| `bgSafetyLimit` | Glucose Safety Limit |
| `insulinModel` | Insulin action model (type, duration, peak) |
| `bgTargetPhysicalActivity` | Workout preset target (`low`, `high`) |
| `bgTargetPreprandial` | Pre-meal preset target (`low`, `high`) |

**Settings Schema**: Hybrid (profile-based with unique fields)
```javascript
{
  bgTargets: { "Default": [{ start, low, high }] },
  bgSafetyLimit: 75,
  bgTargetPhysicalActivity: { low: 140, high: 160 },
  bgTargetPreprandial: { low: 80, high: 90 },
  insulinModel: {
    modelType: "rapidAdult",
    actionDuration: 21600,
    peakActivityTime: 4500,
  },
}
```

---

### DIY Loop

**Constants**: `DIY_LOOP = 'DIY Loop'`

**Device Detection**:
```javascript
// Pattern matches origin.name or client.name
/^com\.[a-zA-Z0-9]*\.?loopkit\.Loop/
```

**Capabilities**:
- Automated basal delivery
- Automated bolus delivery
- Settings overrides

**Settings Overrides**: Pre-Meal only (`PREPRANDIAL`)

**Known Issue**: May report override durations in seconds instead of milliseconds.

**Settings Schema**: Same as Tidepool Loop

---

### twiist (Sequel)

**Constants**: `TWIIST_LOOP = 'twiist'`

**Device Detection**:
```javascript
// Upload records
client.name === 'com.sequelmedtech.tidepool-service' && version >= '2.0.0'

// Other data
origin.name.match(/^com.dekaresearch.twiist/)

// Or device manufacturer
deviceManufacturers.includes('Sequel')
```

**Capabilities**:
- Automated basal delivery
- Settings overrides
- **1-minute CGM sample interval** (unique feature)
- **No** automated bolus

**Settings Overrides**:
| Override | Constant |
|----------|----------|
| Sleep | `SLEEP` |
| Exercise | `PHYSICAL_ACTIVITY` |
| Pre-Meal | `PREPRANDIAL` |

**Terminology**:
| Generic Term | twiist Term |
|--------------|-------------|
| Reservoir Change | Cassette Change |
| Automated Delivery | Automation |
| No Insulin Alarm | Cassette Empty |
| Occlusion Alarm | Line Blocked |

**Settings Schema**: Same as Tidepool Loop

---

## Capabilities Matrix

### Automated Features

| Device | Automated Basal | Automated Bolus | Settings Override |
|--------|-----------------|-----------------|-------------------|
| Tandem Control-IQ | Yes | Yes | Sleep, Exercise |
| Tandem Standard | No | No | No |
| Medtronic 670G/780G | Yes | No | No |
| Medtronic Other | No | No | No |
| OmniPod | No | No | No |
| Animas | No | No | No |
| Equil | No | No | No |
| Tidepool Loop | Yes | No | Workout, Pre-Meal |
| DIY Loop | Yes | Yes | Pre-Meal |
| twiist | Yes | No | Sleep, Exercise, Pre-Meal |

### Settings Override Support

| Override Type | Tandem | Tidepool Loop | DIY Loop | twiist |
|--------------|--------|---------------|----------|--------|
| Sleep | Yes | No | No | Yes |
| Exercise/Workout | Yes | Yes | No | Yes |
| Pre-Meal | No | Yes | Yes | Yes |

---

## Site Change Sources

Different manufacturers track site changes differently:

| Manufacturer | Primary Source | Options |
|--------------|----------------|---------|
| Tandem | `cannulaPrime` | `cannulaPrime`, `tubingPrime` |
| Medtronic | `cannulaPrime` | `cannulaPrime`, `tubingPrime` |
| Animas | `cannulaPrime` | `cannulaPrime`, `tubingPrime` |
| Insulet | `reservoirChange` | `reservoirChange` only |
| Microtech | `reservoirChange` | `reservoirChange` only |
| twiist | `reservoirChange` | `reservoirChange`, `cannulaPrime` |
| Loop devices | N/A | No site changes tracked |

---

## BG Target Field Variations

| Manufacturer | Fields | Example |
|--------------|--------|---------|
| **Tandem** | `target` | `{ start: 0, target: 100 }` |
| **Medtronic** | `low`, `high` | `{ start: 0, low: 80, high: 120 }` |
| **OmniPod** | `target`, `high` | `{ start: 0, target: 100, high: 120 }` |
| **Animas** | `target`, `range` | `{ start: 0, target: 100, range: 20 }` |
| **Microtech** | `low`, `high` | `{ start: 0, low: 80, high: 120 }` |
| **Loop devices** | `low`, `high` | `{ start: 0, low: 80, high: 100 }` |

---

## Insulin Model Types (Loop Devices)

| Model Type | Label | Description |
|------------|-------|-------------|
| `rapidAdult` | Rapid-Acting - Adults | Standard rapid insulin for adults |
| `rapidChild` | Rapid-Acting - Children | Rapid insulin with pediatric curves |
| `fiasp` | Fiasp | Ultra-rapid Fiasp insulin |
| `lyumjev` | Lyumjev | Ultra-rapid Lyumjev insulin |
| `afrezza` | Afrezza | Inhaled insulin |

---

## Alarm Types

| Alarm Type | Generic Label | twiist Label |
|------------|---------------|--------------|
| `no_delivery` | Insulin Delivery Stopped | Insulin Delivery Stopped |
| `auto_off` | Pump Auto-Off | Pump Auto-Off |
| `no_insulin` | Reservoir Empty | Cassette Empty |
| `no_power` | Battery Empty | Battery Empty |
| `occlusion` | Occlusion Detected | Line Blocked |
| `over_limit` | Insulin Delivery Limit Exceeded | Insulin Delivery Limit Exceeded |

---

## Key Source Files

| Purpose | File |
|---------|------|
| Device constants | `src/utils/constants.js` |
| Device detection | `src/utils/device.js` |
| Settings data utilities | `src/utils/settings/data.js` |
| Manufacturer terminology | Settings components in `src/components/settings/` |

---

## See Also

- [Settings Domain](../domains/settings/index.md) - Pump settings documentation
- [Tandem Settings](../domains/settings/tandem.md) - Tandem-specific details
- [Loop Settings](../domains/settings/loop.md) - Loop device details
- [Legacy Settings](../domains/settings/legacy.md) - Animas, Medtronic, OmniPod, Microtech
