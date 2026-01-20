# Data Model Complete Reference

Field-by-field reference for all Tidepool data types.

> **Note**: This appendix consolidates schema information for quick reference. For usage context, see domain-specific documentation linked in each section.

---

## Type Overview

| Type | Description | Domain Documentation |
|------|-------------|---------------------|
| `cbg` | Continuous glucose (CGM) | [CBG Overview](../domains/glucose/cbg/index.md) |
| `smbg` | Fingerstick glucose | [SMBG Overview](../domains/glucose/smbg/index.md) |
| `basal` | Basal insulin delivery | [Basal Overview](../domains/insulin/basal/index.md) |
| `bolus` | Bolus insulin delivery | [Bolus Overview](../domains/insulin/bolus/index.md) |
| `wizard` | Bolus calculator | [Bolus Data Model](../domains/insulin/bolus/data-model.md) |
| `insulin` | Manual injection | [Other Insulin](../domains/insulin/other/index.md) |
| `food` | Food/carb entry | [Carbs Overview](../domains/carbs/index.md) |
| `pumpSettings` | Pump configuration | [Settings Overview](../domains/settings/index.md) |
| `deviceEvent` | Device events | [Device Events](../domains/device-events/index.md) |
| `dosingDecision` | Loop dosing decision | [Bolus Data Model](../domains/insulin/bolus/data-model.md) |
| `reportedState` | Health/notes | [Health & Notes](../domains/device-events/health-notes.md) |
| `physicalActivity` | Exercise | [Health & Notes](../domains/device-events/health-notes.md) |
| `upload` | Upload metadata | [Data Model](../concepts/tidepool-data-model.md) |
| `message` | Notes/messages | [Data Model](../concepts/tidepool-data-model.md) |

---

## Common Fields

All data types share these fields:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | string | **Yes** | `/^[A-Za-z0-9\-_]+$/` | Unique identifier |
| `type` | string | **Yes** | Enum: valid types | Data type |
| `time` | string | **Yes** | ISO 8601 (since 2008) | Event timestamp |
| `uploadId` | string | **Yes** | `/^[A-Za-z0-9\-_]+$/` | Upload batch ID |
| `deviceId` | string | No | - | Device identifier |
| `deviceTime` | string | No | `YYYY-MM-DDTHH:mm:ss` | Local device time |
| `timezoneOffset` | number | No | Minutes | Timezone offset from UTC |
| `displayOffset` | number | No | Minutes | Computed display offset |
| `annotations` | array | No | `[{code: string}]` | Data annotations |
| `origin` | object | No | `{name: string, ...}` | Data source metadata |

### Computed Fields (Added During Processing)

| Field | Type | Description |
|-------|------|-------------|
| `normalTime` | number | Timestamp in milliseconds |
| `normalEnd` | number | End timestamp (for duration-based records) |
| `tags` | object | Classification tags |

---

## CBG (Continuous Blood Glucose)

**Type**: `'cbg'`

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `value` | number | **Yes** | > 0 | BG reading |
| `units` | string | **Yes** | `'mg/dL'` or `'mmol/L'` | Units |
| `sampleInterval` | number | **Yes** | > 0 | Milliseconds between readings |

**Example**:
```javascript
{
  type: "cbg",
  id: "cbg_abc123",
  time: "2024-01-15T12:30:00.000Z",
  uploadId: "upload_xyz",
  deviceId: "DexG6_12345",
  value: 125,
  units: "mg/dL",
  sampleInterval: 300000,  // 5 minutes
}
```

---

## SMBG (Self-Monitored Blood Glucose)

**Type**: `'smbg'`

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `value` | number | **Yes** | > 0 | BG reading |
| `units` | string | **Yes** | `'mg/dL'` or `'mmol/L'` | Units |
| `subType` | string | No | `'manual'` | Source indicator |

**Computed Tags**:
- `manual`: true if `subType === 'manual'` or from Dexcom
- `meter`: true if not manual

**Example**:
```javascript
{
  type: "smbg",
  id: "smbg_abc123",
  time: "2024-01-15T08:00:00.000Z",
  uploadId: "upload_xyz",
  value: 95,
  units: "mg/dL",
  subType: "manual",
}
```

---

## Basal

**Type**: `'basal'`

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `deliveryType` | string | **Yes** | Enum below | Delivery mode |
| `rate` | number | **Yes** | ≥ 0 | Units/hour |
| `duration` | number | No | > 0 | Duration in ms |
| `scheduleName` | string | No | - | Schedule name |
| `suppressed` | object | No | Nested basal | Underlying basal |

### Delivery Types

| Type | Description |
|------|-------------|
| `scheduled` | Normal scheduled basal |
| `suspend` | Delivery suspended |
| `temp` | Temporary basal rate |
| `automated` | Algorithm-controlled |

### Suppressed Basal Object

| Field | Type | Required |
|-------|------|----------|
| `deliveryType` | string | **Yes** |
| `rate` | number | **Yes** |
| `duration` | number | No |

**Computed Tags**:
- `suspend`: true if `deliveryType === 'suspend'`
- `temp`: true if `deliveryType === 'temp'`

**Example**:
```javascript
{
  type: "basal",
  id: "basal_abc123",
  time: "2024-01-15T00:00:00.000Z",
  uploadId: "upload_xyz",
  deliveryType: "automated",
  rate: 0.85,
  duration: 1800000,  // 30 minutes
  suppressed: {
    deliveryType: "scheduled",
    rate: 1.0,
  },
}
```

---

## Bolus

**Type**: `'bolus'`

### Normal Bolus (`subType: 'normal'` or `'automated'`)

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `subType` | string | **Yes** | `'normal'`, `'automated'` | Bolus type |
| `normal` | number | **Yes** | ≥ 0 | Delivered units |
| `expectedNormal` | number | No | ≥ 0 | Programmed units |
| `wizard` | string | No | ID pattern | Reference to wizard |

### Extended Bolus (`subType: 'square'`)

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `subType` | string | **Yes** | `'square'` | Bolus type |
| `extended` | number | **Yes** | ≥ 0 | Extended delivery units |
| `duration` | number | **Yes** | ≥ 0 | Duration in ms |
| `expectedDuration` | number | No | ≥ 0 | Programmed duration |
| `expectedExtended` | number | No | ≥ 0 | Programmed extended |

### Combination Bolus (`subType: 'dual/square'`)

Includes fields from both normal and extended boluses.

**Computed Tags**:
- `extended`: true if has extended portion
- `interrupted`: true if interrupted
- `override`: true if overrode recommendation
- `underride`: true if delivered less than recommended

**Example**:
```javascript
{
  type: "bolus",
  id: "bolus_abc123",
  time: "2024-01-15T12:30:00.000Z",
  uploadId: "upload_xyz",
  subType: "normal",
  normal: 3.5,
  expectedNormal: 4.0,  // Interrupted
  wizard: "wizard_xyz",
}
```

---

## Wizard

**Type**: `'wizard'`

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `bolus` | string | **Yes** | ID pattern | Reference to bolus |
| `bgInput` | number | No | ≥ 0 | Input BG value |
| `carbInput` | number | No | ≥ 0 | Input carbs (grams) |
| `insulinCarbRatio` | number | No | ≥ 0 | I:C ratio |
| `insulinOnBoard` | number | No | ≥ 0 | Active insulin |
| `insulinSensitivity` | number | No | ≥ 0 | ISF |
| `recommended` | object | No | See below | Recommendations |
| `bgTarget` | object | No | See below | Target settings |

### `recommended` Object

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `carb` | number | ≥ 0 | Carb insulin |
| `correction` | number | any | Correction insulin |
| `net` | number | any | Net recommendation |

**Example**:
```javascript
{
  type: "wizard",
  id: "wizard_abc123",
  time: "2024-01-15T12:30:00.000Z",
  uploadId: "upload_xyz",
  bolus: "bolus_abc123",
  bgInput: 185,
  carbInput: 45,
  insulinCarbRatio: 12,
  insulinSensitivity: 40,
  insulinOnBoard: 1.2,
  recommended: {
    carb: 3.75,
    correction: 2.125,
    net: 4.675,
  },
  bgTarget: {
    target: 100,
    high: 120,
  },
}
```

---

## Insulin (Manual Injection)

**Type**: `'insulin'`

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `dose` | object | **Yes** | See below | Dose information |
| `formulation` | object | No | See below | Insulin type |

### `dose` Object

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `total` | number | **Yes** | ≥ 0 |

### `formulation.simple` Object

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `actingType` | string | No | `'rapid'`, `'short'`, `'intermediate'`, `'long'` |

**Example**:
```javascript
{
  type: "insulin",
  id: "insulin_abc123",
  time: "2024-01-15T08:00:00.000Z",
  uploadId: "upload_xyz",
  dose: {
    total: 10.0,
  },
  formulation: {
    simple: {
      actingType: "long",
    },
  },
}
```

---

## Food

**Type**: `'food'`

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `nutrition` | object | No | See below | Nutrition data |

### `nutrition` Object

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `carbohydrate.net` | number | No | ≥ 0 |

**Example**:
```javascript
{
  type: "food",
  id: "food_abc123",
  time: "2024-01-15T12:30:00.000Z",
  uploadId: "upload_xyz",
  nutrition: {
    carbohydrate: {
      net: 45,
    },
  },
}
```

---

## DosingDecision

**Type**: `'dosingDecision'`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | No | Decision reason (see below) |
| `recommendedBolus` | object | No | `{amount: number}` |
| `requestedBolus` | object | No | `{normal: number}` |
| `food` | object | No | Current food data |
| `originalFood` | object | No | Original food (pre-edit) |
| `smbg` | object | No | `{value: number}` |
| `bgHistorical` | array | No | `[{value: number}]` |
| `insulinOnBoard` | object | No | `{amount: number}` |
| `bgTargetSchedule` | array | No | BG target schedule |
| `associations` | array | No | Related records |

### Reason Values

| Reason | Description |
|--------|-------------|
| `normalBolus` | User-initiated bolus |
| `simpleBolus` | Quick bolus |
| `watchBolus` | Apple Watch bolus |
| `oneButtonBolus` | Preset bolus |
| `loop` | Algorithm decision |

### `associations` Array Entry

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Related record ID |
| `reason` | string | `'bolus'`, `'pumpSettings'`, `'food'` |

**Example**:
```javascript
{
  type: "dosingDecision",
  id: "decision_abc123",
  time: "2024-01-15T12:30:00.000Z",
  uploadId: "upload_xyz",
  reason: "normalBolus",
  recommendedBolus: { amount: 3.5 },
  requestedBolus: { normal: 3.0 },
  food: {
    nutrition: { carbohydrate: { net: 45 } },
  },
  insulinOnBoard: { amount: 1.2 },
  associations: [
    { reason: "bolus", id: "bolus_xyz" },
    { reason: "pumpSettings", id: "settings_123" },
  ],
}
```

---

## DeviceEvent

**Type**: `'deviceEvent'`

### SubTypes

| SubType | Description | Additional Fields |
|---------|-------------|-------------------|
| `status` | Pump status | `status`, `duration`, `reason` |
| `reservoirChange` | Reservoir change | - |
| `prime` | Priming | `primeTarget` |
| `calibration` | CGM calibration | `value` |
| `alarm` | Device alarm | `alarmType` |
| `timeChange` | Clock change | `from`, `to` |
| `pumpSettingsOverride` | Settings override | `overrideType`, `duration` |

### Status Fields

| Field | Type | Values |
|-------|------|--------|
| `status` | string | `'suspended'`, `'resumed'` |
| `duration` | number | Milliseconds |
| `reason.suspended` | string | Suspend reason |

### Prime Fields

| Field | Type | Values |
|-------|------|--------|
| `primeTarget` | string | `'cannula'`, `'tubing'` |

### Alarm Fields

| Field | Type | Values |
|-------|------|--------|
| `alarmType` | string | `'no_delivery'`, `'auto_off'`, `'no_insulin'`, `'no_power'`, `'occlusion'`, `'over_limit'` |

### PumpSettingsOverride Fields

| Field | Type | Values |
|-------|------|--------|
| `overrideType` | string | `'sleep'`, `'physicalActivity'`, `'preprandial'` |
| `duration` | number | Milliseconds |

### TimeChange Fields

| Field | Type | Description |
|-------|------|-------------|
| `from.timeZoneName` | string | Previous timezone |
| `to.timeZoneName` | string | New timezone |

**Example (Alarm)**:
```javascript
{
  type: "deviceEvent",
  subType: "alarm",
  id: "event_abc123",
  time: "2024-01-15T14:00:00.000Z",
  uploadId: "upload_xyz",
  alarmType: "occlusion",
}
```

---

## PumpSettings

**Type**: `'pumpSettings'`

### Common Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activeSchedule` | string | **Yes** | Active schedule name |
| `basalSchedules` | object | **Yes** | Named basal schedules |
| `units` | object | **Yes** | `{bg, carb}` units |

### Manufacturer Variations

#### Flat Array Format (Animas, Medtronic, OmniPod, Microtech)

| Field | Type | BG Target Fields |
|-------|------|------------------|
| `bgTarget` | array | Varies by manufacturer |
| `carbRatio` | array | `[{start, amount}]` |
| `insulinSensitivity` | array | `[{start, amount}]` |

#### Profile Format (Tandem, Loop)

| Field | Type | Description |
|-------|------|-------------|
| `bgTargets` | object | Named schedules |
| `carbRatios` | object | Named schedules |
| `insulinSensitivities` | object | Named schedules |

### BG Target Field Variations

| Manufacturer | Fields |
|--------------|--------|
| Animas | `start`, `target`, `range` |
| Medtronic | `start`, `low`, `high` |
| OmniPod | `start`, `target`, `high` |
| Tandem | `start`, `target` |
| Loop | `start`, `low`, `high` |

### Loop-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `bgSafetyLimit` | number | Glucose Safety Limit |
| `bgTargetPhysicalActivity` | object | `{low, high}` |
| `bgTargetPreprandial` | object | `{low, high}` |
| `insulinModel` | object | Model parameters |
| `automatedDelivery` | boolean | Automation enabled |

**See**: [Device Matrix](./device-matrix.md) for manufacturer details.

---

## ReportedState

**Type**: `'reportedState'`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `states` | array | No | Health states |
| `notes` | array | No | User notes |

### `states` Array Entry

| Field | Type | Values |
|-------|------|--------|
| `state` | string | `'alcohol'`, `'cycle'`, `'hyperglycemiaSymptoms'`, `'hypoglycemiaSymptoms'`, `'illness'`, `'stress'`, `'other'` |
| `stateOther` | string | Custom description |

**Example**:
```javascript
{
  type: "reportedState",
  id: "state_abc123",
  time: "2024-01-15T10:00:00.000Z",
  uploadId: "upload_xyz",
  states: [{ state: "stress" }],
  notes: ["Busy day at work"],
}
```

---

## PhysicalActivity

**Type**: `'physicalActivity'`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `duration` | number | No | Duration in ms |
| `name` | string | No | Activity name |
| `reportedIntensity` | string | No | `'low'`, `'medium'`, `'high'` |

**Example**:
```javascript
{
  type: "physicalActivity",
  id: "activity_abc123",
  time: "2024-01-15T17:00:00.000Z",
  uploadId: "upload_xyz",
  reportedIntensity: "medium",
  duration: {
    value: 45,
    units: "minutes",
  },
}
```

---

## Upload

**Type**: `'upload'`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dataSetType` | string | No | `'continuous'` for Loop |
| `deviceTags` | array | No | Device capability tags |
| `source` | string | No | Data source |
| `deviceModel` | string | No | Device model |
| `deviceManufacturers` | array | No | Manufacturers |
| `deviceSerialNumber` | string | No | Serial number |
| `timezone` | string | No | IANA timezone |
| `client` | object | No | `{name, version}` |

**Example**:
```javascript
{
  type: "upload",
  id: "upload_abc123",
  time: "2024-01-15T00:00:00.000Z",
  uploadId: "upload_abc123",
  dataSetType: "continuous",
  deviceManufacturers: ["Tandem"],
  deviceModel: "Control-IQ",
  timezone: "America/New_York",
  client: {
    name: "org.tidepool.Loop",
    version: "3.0.0",
  },
}
```

---

## Message

**Type**: `'message'`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parentMessage` | string/null | No | Parent message ID |
| `messageText` | string | No | Message content |

**Note**: Messages have different required fields than common schema (no `uploadId`/`type` required).

---

## Schedule Entry Constraints

All schedule entries use:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `start` | number | 0 to 86400000 | ms from midnight |
| `rate` | number | ≥ 0 | Basal rate |
| `amount` | number | ≥ 0 | I:C ratio or ISF |
| `target` | number | ≥ 0 | Target BG |
| `range` | number | ≥ 0 | Target range |
| `low` | number | ≥ 0 | Low target |
| `high` | number | ≥ 0 | High target |

---

## Constants Reference

### Units

| Constant | Value |
|----------|-------|
| `MGDL_UNITS` | `'mg/dL'` |
| `MMOLL_UNITS` | `'mmol/L'` |
| `MGDL_PER_MMOLL` | 18.01559 |

### Time

| Constant | Value |
|----------|-------|
| `MS_IN_DAY` | 86400000 |
| `MS_IN_HOUR` | 3600000 |
| `MS_IN_MIN` | 60000 |

### Default BG Bounds (mg/dL)

| Constant | Value |
|----------|-------|
| `veryLowThreshold` | 54 |
| `targetLowerBound` | 70 |
| `targetUpperBound` | 180 |
| `veryHighThreshold` | 250 |
| `extremeHighThreshold` | 350 |
| `clampThreshold` | 600 |

---

## Key Source Files

| Purpose | File |
|---------|------|
| Schema definitions | `src/utils/validation/schema.js` |
| Type classes | `data/types.js` |
| Constants | `src/utils/constants.js` |
| Data processing | `src/utils/DataUtil.js` |

---

## See Also

- [Tidepool Data Model](../concepts/tidepool-data-model.md) - Conceptual overview
- [Device Matrix](./device-matrix.md) - Manufacturer-specific variations
- [Calculation Reference](./calculation-reference.md) - Statistical formulas
