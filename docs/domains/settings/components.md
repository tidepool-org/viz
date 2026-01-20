# Settings Components

Part of the [Settings Domain](./index.md)

## Overview

Settings visualization uses a layered component architecture with a container/router pattern at the top and shared common components for consistent rendering across manufacturers.

---

## Component Hierarchy

```
PumpSettingsContainer (router)
├── Tandem
│   └── CollapsibleContainer (per profile)
│       └── Table (unified settings table)
│
└── NonTandem
    ├── CollapsibleContainer (basal schedules)
    │   └── Table
    └── CollapsibleContainer (bolus settings)
        └── Table (one per setting type)
```

---

## Container Component

### PumpSettingsContainer

**File**: `src/components/settings/common/PumpSettingsContainer.js`

The entry point for settings rendering. Routes to the appropriate manufacturer-specific component based on the pump source.

```javascript
// Routing logic (PumpSettingsContainer.js:14-15)
const tandemSource = 'Tandem';
const isTandem = source === tandemSource;
```

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `pumpSettings` | `object` | Full pump settings data |
| `source` | `string` | Manufacturer identifier |
| `copySettingsClicked` | `func` | Handler for copy-to-clipboard |
| `view` | `string` | Rendering context (`'print'` or default) |

---

## Manufacturer Components

### Tandem

**File**: `src/components/settings/Tandem.js` (182 lines)

Renders profile-based settings in a unified table format where each profile shows all time-based settings (basal, BG target, carb ratio, sensitivity) in a single table.

**Key features**:
- Unified profile tables via `processTimedSettings()`
- Control-IQ annotations for manual vs automated values
- Collapsible sections per profile

See [Tandem Settings](./tandem.md) for data model details.

### NonTandem

**File**: `src/components/settings/NonTandem.js` (344 lines)

Renders flat-array and hybrid settings with separate tables per setting type. Handles manufacturer-specific terminology and formatting variations.

**Key features**:
- Separate tables for basal, BG target, carb ratio, sensitivity
- Manufacturer terminology via `nonTandemData.js`
- Loop-specific field rendering (bgSafetyLimit, insulinModel)
- Medtronic Auto Mode detection

See [Legacy Settings](./legacy.md) and [Loop Settings](./loop.md) for data model details.

---

## Common Components

Located in `src/components/settings/common/`:

### Table

**File**: `Table.js`

Generic table component for rendering settings rows.

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `array` | Column definitions with `key`, `label` |
| `rows` | `array` | Data rows matching column keys |
| `title` | `node` | Optional table title |
| `tableStyle` | `string` | CSS class for styling |

**Usage**:
```jsx
<Table
  columns={[
    { key: 'start', label: 'Start Time' },
    { key: 'rate', label: 'Rate' }
  ]}
  rows={[
    { start: '12:00 am', rate: '0.85 U/hr' },
    { start: '6:00 am', rate: '1.10 U/hr' }
  ]}
/>
```

### Header

**File**: `Header.js`

Displays device identification at the top of settings view.

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `deviceMeta` | `object` | Device metadata (name, serial, upload time) |

**Displays**:
- Device name and manufacturer
- Serial number (if available)
- Upload timestamp

### CollapsibleContainer

**File**: `CollapsibleContainer.js`

Expandable/collapsible section wrapper for grouping related settings.

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `label` | `node` | Section header content |
| `labelClass` | `string` | CSS class for header |
| `opened` | `object` | Controlled open state |
| `toggleExpansion` | `func` | Handler for expand/collapse |
| `twoLineLabel` | `bool` | Use two-line label variant |

**Label Variants**:
- `SingleLineCollapsibleContainerLabel` - Simple text header
- `TwoLineCollapsibleContainerLabel` - Header with subtitle (e.g., schedule name + active indicator)

---

## Data Utilities

### tandemData.js

**File**: `src/utils/settings/tandemData.js` (117 lines)

Functions for processing Tandem profile-based settings:

| Function | Purpose |
|----------|---------|
| `basalSchedules()` | Extract list of profile names |
| `basal()` | Build unified table for a profile |
| `columns()` | Define table columns |

### nonTandemData.js

**File**: `src/utils/settings/nonTandemData.js` (324 lines)

Functions for processing flat-array settings with manufacturer variations:

| Function | Purpose |
|----------|---------|
| `basalSchedules()` | Extract schedule names |
| `bolusTitle()` | Manufacturer-specific bolus calculator name |
| `sensitivityTitle()` | Manufacturer-specific ISF label |
| `targetColumns()` | BG target column definitions by manufacturer |

### data.js (Shared)

**File**: `src/utils/settings/data.js` (501 lines)

Shared utilities used by both Tandem and NonTandem:

| Function | Purpose |
|----------|---------|
| `processTimedSettings()` | Merge time-based settings by slot |
| `insulinSettings()` | Extract bolus calculator settings |
| `deviceName()` | Get display name for manufacturer |
| `startTimeAndValue()` | Format time slot start and value |

---

## Key Source Files

| Purpose | File | Lines |
|---------|------|-------|
| Router | `src/components/settings/common/PumpSettingsContainer.js` | 106 |
| Tandem component | `src/components/settings/Tandem.js` | 182 |
| NonTandem component | `src/components/settings/NonTandem.js` | 344 |
| Table | `src/components/settings/common/Table.js` | - |
| Header | `src/components/settings/common/Header.js` | - |
| CollapsibleContainer | `src/components/settings/common/CollapsibleContainer.js` | - |
| Tandem data | `src/utils/settings/tandemData.js` | 117 |
| NonTandem data | `src/utils/settings/nonTandemData.js` | 324 |
| Shared data | `src/utils/settings/data.js` | 501 |

---

## See Also

- [Settings Domain](./index.md) - Parent overview
- [Rendering](./rendering.md) - PDF export details
- [Reference: Common Props](../../reference/common-props.md) - Shared component properties
