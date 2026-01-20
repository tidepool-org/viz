# Settings Rendering

Part of the [Settings Domain](./index.md).

This document covers how pump settings are rendered in web views and PDF exports.

---

## Overview

Settings rendering has two distinct contexts:

| Context | Implementation | Use Case |
|---------|----------------|----------|
| **Web View** | React components | Interactive exploration with collapsible sections |
| **PDF Export** | PDFKit via `SettingsPrintView` | Static printable report |

Both contexts share the same underlying data utilities but have separate rendering implementations.

---

## PDF Export

### SettingsPrintView

**File**: `src/modules/print/SettingsPrintView.js`

The `SettingsPrintView` class extends `PrintView` and handles PDF generation for pump settings. It uses the `pdfkit` library with `voilab-pdf-table` for table rendering.

#### Constructor Setup (lines 50-58)

```javascript
constructor(doc, data, opts) {
  super(doc, data, opts);
  this.isTandem = this.manufacturer === 'tandem';
  this.deviceMeta = getDeviceMeta(this.latestPumpUpload.settings, this.timePrefs);
  this.deviceLabels = getPumpVocabulary(this.manufacturer);
  this.doc.addPage();
}
```

#### Main Render Method (lines 64-76)

The `render()` method dispatches to manufacturer-specific rendering:

- **Tandem**: `renderTandemProfiles()` - Unified profile tables
- **Loop**: `renderLoopSettings()` - Therapy settings with footnotes
- **Other pumps**: `renderPumpSettings()` + `renderBasalSchedules()` + `renderWizardSettings()`

### PDF Sections

| Section | Method | Description |
|---------|--------|-------------|
| Device Header | `renderDeviceMeta()` | Device name and serial number |
| Pump Settings | `renderPumpSettings()` | Insulin settings, presets |
| Basal Schedules | `renderBasalSchedules()` | All basal rate schedules |
| Wizard Settings | `renderWizardSettings()` | Sensitivity, target, carb ratio |
| Tandem Profiles | `renderTandemProfiles()` | Combined profile tables |
| Loop Settings | `renderLoopSettings()` | Loop-specific layout with footnotes |

### Layout System

The PDF uses a column layout system for efficient space usage:

```javascript
this.setLayoutColumns({
  width: this.chartArea.width,
  count: 3,  // or 2 for Loop
  gutter: 14,
});
```

Tables are placed in columns using `goToLayoutColumnPosition(index)` and `getShortestLayoutColumn()` for optimal packing.

---

## Web View Components

### Table.js

**File**: `src/components/settings/common/Table.js`

A React component that renders settings in tabular format with optional tooltips.

**Props**:
- `title` - Caption with main/secondary labels
- `rows` - Array of row data
- `columns` - Column definitions with keys and labels
- `tableStyle` - CSS class for styling
- `annotations` - Tooltip content for info icons

**Features**:
- Supports compound labels (`{ main, secondary }`)
- Row-level annotations with hover tooltips
- Uses `StatTooltip` for annotation display

### Header.js

**File**: `src/components/settings/common/Header.js`

Displays device identification and upload timestamp.

```jsx
<span className={styles.headerInner}>
  Active at Upload on {this.props.deviceMeta.uploaded}
</span>
```

**Props**:
- `deviceMeta` - Object containing upload date and device info

### CollapsibleContainer.js

**File**: `src/components/settings/common/CollapsibleContainer.js`

Provides expandable/collapsible sections for web view settings display.

**Props**:
- `label` - Object with `main`, `secondary`, and `units` strings
- `labelClass` - CSS class for styling
- `opened` - Boolean controlling expansion state
- `toggleExpansion` - Callback for toggle events
- `twoLineLabel` - Use two-line vs single-line label style

**Renders** either `SingleLineCollapsibleContainerLabel` or `TwoLineCollapsibleContainerLabel` based on content.

---

## Manufacturer-Specific Rendering

| Manufacturer | PDF Approach | Key Differences |
|--------------|--------------|-----------------|
| Tandem | `renderTandemProfiles()` | Combined profile tables with all settings per row |
| Loop | `renderLoopSettings()` | 3-column + 2-column layout with footnotes |
| Medtronic | Generic | May show automated schedule |
| Animas | Generic (no pump settings) | Skips `renderPumpSettings()` |
| OmniPod | Generic | Standard 3-column layout |

---

## Key Source Files

| Purpose | File |
|---------|------|
| PDF settings rendering | `src/modules/print/SettingsPrintView.js` |
| Base PDF print class | `src/modules/print/PrintView.js` |
| Settings table component | `src/components/settings/common/Table.js` |
| Device header component | `src/components/settings/common/Header.js` |
| Collapsible sections | `src/components/settings/common/CollapsibleContainer.js` |
| Non-Tandem data utils | `src/utils/settings/nonTandemData.js` |
| Tandem data utils | `src/utils/settings/tandemData.js` |
| Shared data utils | `src/utils/settings/data.js` |

---

## See Also

- [Settings Overview](./index.md)
- [PDF Reports](../../views/pdf-reports.md)
