# Device Detection

This document explains how Tidepool Viz identifies pump manufacturers, CGM devices, and advanced features like automated insulin delivery (AID) systems. Understanding these detection patterns is essential for adding support for new devices.

---

## Overview

Device detection in Viz uses multiple strategies:

1. **Field value matching** - Checking `deviceManufacturers`, `source`, `deviceModel`
2. **String pattern matching** - Regex on `origin.name`, `client.name`, `deviceId`
3. **Field presence** - Checking for device-specific fields
4. **Version checking** - Comparing `client.version` for feature availability

---

## Manufacturer Identification

### Supported Manufacturers

| Constant | Display Name | Notes |
|----------|--------------|-------|
| `INSULET` | OmniPod | Tubeless patch pump |
| `TANDEM` | Tandem | t:slim X2 with Control-IQ |
| `ANIMAS` | Animas | Discontinued |
| `MEDTRONIC` | Medtronic | 600/700 series, Auto Mode |
| `MICROTECH` | Equil | Equil patch pump |
| `TIDEPOOL_LOOP` | Tidepool Loop | FDA-cleared Loop |
| `DIY_LOOP` | DIY Loop | Open-source Loop |
| `TWIIST_LOOP` | twiist | Sequel/Deka twiist system |

**Source**: `src/utils/constants.js:180-187`

### Display Name Mapping

The `deviceName()` function maps internal manufacturer keys to display names:

```javascript
const DEVICE_DISPLAY_NAME_BY_MANUFACTURER = {
  animas: 'Animas',
  insulet: 'OmniPod',
  medtronic: 'Medtronic',
  tandem: 'Tandem',
  microtech: 'Equil',
  'diy loop': 'DIY Loop',
  'tidepool loop': 'Tidepool Loop',
  twiist: 'twiist',
};
```

**Source**: `src/utils/settings/data.js:54-66`

---

## Loop Variant Detection

Loop systems are identified by regex patterns on `origin.name` or `client.name`:

### DIY Loop

```javascript
export function isDIYLoop(datum = {}) {
  return (/^com\.[a-zA-Z0-9]*\.?loopkit\.Loop/).test(
    _.get(datum, 'origin.name', datum?.client?.name || '')
  );
}
```

**Matches**: `com.loopkit.Loop`, `com.loudnate.loopkit.Loop`, etc.

### Tidepool Loop

```javascript
export function isTidepoolLoop(datum = {}) {
  return (/^org\.tidepool\.[a-zA-Z0-9]*\.?Loop/).test(
    _.get(datum, 'origin.name', datum?.client?.name || '')
  );
}
```

**Matches**: `org.tidepool.Loop`, `org.tidepool.dev.Loop`, etc.

### Twiist Loop

Twiist detection differs for uploads vs data:

```javascript
export function isTwiistLoop(datum = {}) {
  if (datum.type === 'upload') {
    // For uploads: check client.name AND version >= 2.0.0
    const majorVersion = parseInt(_.get(datum, 'client.version', '0').split('.')[0], 10);
    return (/^com.sequelmedtech.tidepool-service/).test(datum.client?.name) 
      && majorVersion >= 2;
  }
  // For data: check origin.name
  return (/^com.dekaresearch.twiist/).test(
    _.get(datum, 'origin.name', datum?.client?.name || '')
  );
}
```

### Generic Loop Check

```javascript
export function isLoop(datum = {}) {
  return datum.tags?.loop 
    || isDIYLoop(datum) 
    || isTidepoolLoop(datum) 
    || isTwiistLoop(datum);
}
```

**Source**: `src/utils/device.js:33-75`

---

## Control-IQ Detection

Tandem Control-IQ devices are identified by `deviceId` prefix:

```javascript
export function isControlIQ(datum = {}) {
  return _.get(datum, 'deviceId', '').indexOf('tandemCIQ') === 0;
}
```

**Source**: `src/utils/device.js:58-60`

---

## CGM Source Detection

### Dexcom

```javascript
export function isDexcom(datum = {}) {
  const TARGET = 'org.tidepool.oauth.dexcom.fetch';
  return datum.tags?.dexcom 
    || datum.client?.name === TARGET 
    || datum.origin?.name === TARGET 
    || _.includes(datum.deviceManufacturers, 'Dexcom');
}
```

### LibreView API

```javascript
export function isLibreViewAPI(datum = {}) {
  const TARGET = 'org.tidepool.abbott.libreview.partner.api';
  return datum?.client?.name === TARGET || datum?.origin?.name === TARGET;
}
```

**Source**: `src/utils/device.js:65-83`

---

## Feature Detection Functions

These functions determine device capabilities for UI rendering and statistics:

### Automated Basal Delivery

Devices that can automatically adjust basal rates:

```javascript
export function isAutomatedBasalDevice(manufacturer, pumpSettingsOrUpload = {}, deviceModel) {
  return _.includes(
      _.get(AUTOMATED_BASAL_DEVICE_MODELS, deviceName(manufacturer), []), 
      deviceModel
    )
    || (manufacturer === 'tandem' && isControlIQ(pumpSettingsOrUpload))
    || isLoop(pumpSettingsOrUpload);
}
```

**Returns `true` for**:
- Medtronic 670G/780G (models: 1580, 1581, 1582, 1780, 1781, 1782)
- Tandem with Control-IQ
- All Loop variants (DIY, Tidepool, Twiist)

### Automated Bolus Delivery

Devices that can deliver automatic correction boluses:

```javascript
export function isAutomatedBolusDevice(manufacturer, pumpSettingsOrUpload = {}) {
  return (manufacturer === 'tandem' && isControlIQ(pumpSettingsOrUpload))
    || isDIYLoop(pumpSettingsOrUpload);
}
```

**Returns `true` for**:
- Tandem with Control-IQ
- DIY Loop only (not Tidepool Loop or Twiist)

### Settings Override Support

Devices that support activity modes/presets:

```javascript
export function isSettingsOverrideDevice(manufacturer, pumpSettingsOrUpload = {}) {
  return (manufacturer === 'tandem' && isControlIQ(pumpSettingsOrUpload))
    || isLoop(pumpSettingsOrUpload);
}
```

**Returns `true` for**:
- Tandem with Control-IQ (Sleep, Exercise)
- All Loop variants (Workout, Pre-Meal presets)

### One-Minute CGM Sample Interval

Devices with 1-minute CGM readings (vs standard 5-minute):

```javascript
export function isOneMinCGMSampleIntervalDevice(pumpSettingsOrUpload = {}) {
  return isTwiistLoop(pumpSettingsOrUpload);
}
```

**Returns `true` for**: Twiist only

**Source**: `src/utils/device.js:92-127`

---

## Automated Basal Device Models

Specific Medtronic models that support Auto Mode:

```javascript
export const AUTOMATED_BASAL_DEVICE_MODELS = {
  Medtronic: ['1580', '1581', '1582', '1780', '1781', '1782'],
};
```

| Model | Device |
|-------|--------|
| 1580, 1581, 1582 | MiniMed 670G variants |
| 1780, 1781, 1782 | MiniMed 780G variants |

**Source**: `src/utils/constants.js:314-316`

---

## Pump Vocabulary System

Each manufacturer has device-specific terminology. The `getPumpVocabulary()` function returns a vocabulary object with fallbacks to defaults:

```javascript
export function getPumpVocabulary(manufacturer) {
  const vocabulary = _.cloneDeep(pumpVocabulary);
  return _.defaults(
    _.get(vocabulary, getUppercasedManufacturer(manufacturer), {}),
    vocabulary.default
  );
}
```

### Vocabulary Terms

| Term Key | Default | Medtronic | Tandem | Insulet | Loop |
|----------|---------|-----------|--------|---------|------|
| `reservoirChange` | Cartridge Change | Rewind | Cartridge Change | Pod Change | Cassette Change (Twiist) |
| `tubingPrime` | Tubing Fill | Prime | Tubing Fill | Pod Activate | - |
| `cannulaPrime` | Cannula Fill | Cannula Prime | Cannula Fill | Prime | - |
| `automatedDelivery` | Automated | Auto Mode | Automation | - | Automation |
| `scheduledDelivery` | Manual | Manual | Manual | - | Manual |
| `settingsOverride` | Settings Override | - | Activity | - | Preset |

### Activity/Override Labels

```javascript
// Tandem
SLEEP: { label: 'Sleep', marker: 'Z' },
PHYSICAL_ACTIVITY: { label: 'Exercise', marker: 'E' },

// Loop variants
PHYSICAL_ACTIVITY: { label: 'Workout', marker: 'W' },
PREPRANDIAL: { label: 'Pre-Meal', marker: 'P' },
```

**Source**: `src/utils/constants.js:189-289`

---

## Settings Overrides by Manufacturer

Which override types each manufacturer supports:

```javascript
export const settingsOverrides = {
  Tandem: [SLEEP, PHYSICAL_ACTIVITY],
  'Tidepool Loop': [PHYSICAL_ACTIVITY, PREPRANDIAL],
  twiist: [PHYSICAL_ACTIVITY, PREPRANDIAL],
  'DIY Loop': [PREPRANDIAL],
  default: [SLEEP, PHYSICAL_ACTIVITY, PREPRANDIAL],
};
```

| Manufacturer | Sleep | Exercise/Workout | Pre-Meal |
|--------------|-------|------------------|----------|
| Tandem | Yes | Yes | No |
| Tidepool Loop | No | Yes | Yes |
| Twiist | No | Yes | Yes |
| DIY Loop | No | No | Yes |

**Source**: `src/utils/constants.js:291-312`

---

## Adding New Device Support

### Checklist

When adding support for a new pump manufacturer:

1. **Add manufacturer constant** (`src/utils/constants.js`)
   ```javascript
   export const NEW_PUMP = 'New Pump';
   ```

2. **Add display name mapping** (`src/utils/settings/data.js`)
   ```javascript
   'new pump': 'New Pump Display Name',
   ```

3. **Add vocabulary entries** (`src/utils/constants.js`)
   ```javascript
   [NEW_PUMP]: {
     [SITE_CHANGE_RESERVOIR]: t('Reservoir Change'),
     [SITE_CHANGE_TUBING]: t('Tubing Prime'),
     // ... other terms
   },
   ```

4. **Add detection function if needed** (`src/utils/device.js`)
   - For AID systems: Add `isNewPumpAID()` function
   - Update feature detection functions (`isAutomatedBasalDevice`, etc.)

5. **Add to automated basal models if applicable** (`src/utils/constants.js`)
   ```javascript
   export const AUTOMATED_BASAL_DEVICE_MODELS = {
     Medtronic: [...],
     'New Pump': ['model1', 'model2'],
   };
   ```

6. **Add settings overrides if applicable** (`src/utils/constants.js`)
   ```javascript
   [NEW_PUMP]: [SLEEP, PHYSICAL_ACTIVITY],
   ```

7. **Add source detection** (`src/utils/DataUtil.js` in `setUploadMap()`)
   - Handle any special cases for manufacturer detection

8. **Create/update settings rendering** (`src/utils/settings/`)
   - Add to Tandem, NonTandem, or create new settings component

### Testing New Device Support

1. Verify `uploadMap` contains correct source
2. Verify `latestPumpUpload.manufacturer` is correct
3. Verify feature flags (`isAutomatedBasalDevice`, etc.) are correct
4. Verify vocabulary terms appear correctly in UI
5. Verify settings render correctly (if applicable)

---

## Key Source Files

| Purpose | File |
|---------|------|
| Manufacturer constants | `src/utils/constants.js:180-187` |
| Vocabulary definitions | `src/utils/constants.js:189-289` |
| Settings overrides | `src/utils/constants.js:291-312` |
| Automated basal models | `src/utils/constants.js:314-316` |
| Detection functions | `src/utils/device.js` |
| Display name mapping | `src/utils/settings/data.js:54-66` |
| Source detection | `src/utils/DataUtil.js:1764-1812` |

---

## See Also

- [Data Management](./data-management.md) - Upload processing and source resolution
- [Settings Domain](../domains/settings/index.md) - Pump settings data model
- [Appendix: Device Matrix](../appendices/device-matrix.md) - Complete device capabilities reference
