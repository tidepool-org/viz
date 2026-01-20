# Documentation Restructure Plan - Hierarchical Domains (Option B)

> **Status**: Phase 2.5 ✅ Complete | Phase 3-5 Planned (Awaiting Implementation)
> **Created**: January 2026
> **Last Updated**: January 2026 (comprehensive review + phases 3-5 added)

This document captures the planning process, decisions, and implementation plan for restructuring the `@tidepool/viz` documentation into a hierarchical domain structure.

**Recent Updates (January 2026):**
- Comprehensive codebase review identified missing documentation
- Added `settings/` domain to plan (pump configuration)
- Added health/notes documentation requirements
- Defined Phase 3-5 with detailed task lists and progress tracking

---

## Table of Contents

- [Background and Motivation](#background-and-motivation)
- [Audience Analysis](#audience-analysis)
- [Design Decisions](#design-decisions)
- [Final Structure (Option B - Hierarchical)](#final-structure-option-b---hierarchical)
- [Domain Hierarchy Rationale](#domain-hierarchy-rationale)
- [Documentation Patterns](#documentation-patterns)
- [Missing Functionality Identified](#missing-functionality-identified)
- [Implementation Phases](#implementation-phases)
- [Migration Details](#migration-details)
- [Progress Tracking](#progress-tracking)

---

## Background and Motivation

### Why Restructure?

The existing documentation has grown organically. While Phase 1 and 2 established good domain-based content, the flat domain structure doesn't reflect the actual data relationships:

1. **Glucose data has two distinct sources**: CBG (continuous) and SMBG (fingerstick) have different characteristics, statistics, and rendering but share common concepts.

2. **Insulin delivery has three components**: Basal, bolus, and "other" (manual injections) all contribute to total daily insulin but are currently documented as unrelated domains.

3. **Statistics ownership is unclear**: Stats like "Average Glucose" apply to multiple data types. Stats like "Sensor Usage" only apply to CBG. The flat structure doesn't clarify this.

4. **Sensor domain is misplaced**: Sensor usage documentation is CGM-specific but exists as a separate top-level domain.

### Solution: Hierarchical Domains

Organize domains into parent/child relationships that reflect actual data relationships:

- `glucose/` → `cbg/`, `smbg/`
- `insulin/` → `basal/`, `bolus/`, `other/`

Parent domains own cross-subdomain statistics. Subdomains own type-specific content.

---

## Audience Analysis

### Primary Audiences

| Cohort | Description | Needs |
|--------|-------------|-------|
| **A: Internal Developers** | Tidepool viz team members | Progressive disclosure, quick orientation |
| **B: External Partners** | Teams building diabetes visualization | Comprehensive reference material |
| **C: AI Agents** | Automated coding assistants | Structured, linkable, token-efficient |

### Key Insight

The hierarchical structure serves all audiences:
- **Cohort A**: Navigate from parent overview → specific subdomain
- **Cohort B**: Find all related content in one subtree
- **Cohort C**: Clear hierarchy for context loading

---

## Design Decisions

### Decision 1: Hierarchical Domain Organization

**Choice**: Two-level hierarchy for glucose and insulin domains

**Rationale**: 
- Reflects actual data model relationships
- Statistics naturally land at appropriate level (parent = cross-subdomain, child = type-specific)
- Matches how developers think ("I need CGM sensor usage" vs "I need glucose stats")

### Decision 2: Statistics Placement

**Rule**: Statistics belong at the level where they apply.

| Stat | Applies To | Location |
|------|------------|----------|
| Average Glucose | CBG + SMBG | `glucose/statistics.md` |
| Time in Range | CBG only | `glucose/statistics.md` |
| Sensor Usage | CBG only | `glucose/statistics.md` |
| Readings in Range | SMBG only | `glucose/statistics.md` |
| Avg Daily Insulin | Basal + Bolus + Other | `insulin/statistics.md` |
| Time in Auto | Basal only | `insulin/basal/calculations.md` |

> **Note**: All glucose statistics are consolidated in `glucose/statistics.md` for ease of reference, with clear notation of which data source (CBG, SMBG, or both) each stat applies to.

### Decision 3: "Other" Insulin Terminology

**Choice**: Use `other/` for `{type: insulin}` data (manual pen/syringe injections)

**Rationale**: Matches UI terminology. The hierarchy becomes:
- `insulin/` (parent domain)
  - `basal/` (pump basal delivery)
  - `bolus/` (pump bolus delivery)
  - `other/` (manual injections - pens, syringes)

### Decision 4: Calibration Placement

**Choice**: Keep calibration documentation in `device-events/`, reference from SMBG

**Rationale**: Calibrations are `deviceEvent` records with `subType: calibration`. They're device events that happen to involve fingerstick readings. The SMBG aggregation documentation will reference calibration docs in device-events.

### Decision 5: Screenshot Organization

**Choice**: Distribute all screenshots to domain folders, remove centralized `docs/screenshots/`

**Safety Rule**: No screenshot deletions until confirmed moved. Track migration with checklist.

**Rationale**: Screenshots alongside prose create self-contained documentation units. Reduces maintenance burden of keeping two locations in sync.

### Decision 6: Carbs as Top-Level Domain

**Choice**: Keep `carbs/` as a top-level domain (not under insulin)

**Rationale**: Carbs are conceptually distinct from insulin delivery, even though carb input informs bolus calculations. Carbs come from food; insulin is medication.

### Decision 7: Pump Settings as Top-Level Domain

**Choice**: Create `settings/` as a top-level domain for pump configuration

**Rationale**: Pump settings (basal schedules, carb ratios, sensitivity, targets) are distinct from data visualization. Settings documentation explains data structure, component usage, and PDF export—separate concerns from therapeutic domains.

### Decision 8: Health/Notes Under Device Events

**Choice**: Document health states and notes as additional `deviceEvent` subtypes

**Rationale**: Health events and notes use `type: 'reportedState'` with `states` or `notes` fields. They display in events zone alongside alarms and other device events. Better documented together with device events than as standalone domain.

### Decision 9: Settings Documentation by Data Model Pattern

**Choice**: Document settings by data model pattern (profile-based vs flat-array), not per-manufacturer

**Rationale**: Investigation revealed two fundamentally different settings data structures:
- **Profile-based** (Tandem): Settings keyed by profile name (`bgTargets: { "Normal": [...], "Sick": [...] }`)
- **Flat-array** (Legacy): Settings as global arrays (`bgTarget: [{ start, low, high }, ...]`)
- **Hybrid** (Loop): Profile-based structure with unique fields (`bgSafetyLimit`, `insulinModel`)

NonTandem.js handles 8 manufacturers (Animas, Insulet, Medtronic, Microtech, DIY Loop, Tidepool Loop, Twiist) with 344 lines of conditional logic for terminology and formatting variations. Rather than document each manufacturer separately, document the patterns with manufacturer-specific notes where relevant.

---

## Final Structure (Option B - Hierarchical)

```
docs/
├── index.md                           # Landing page with audience paths
├── GettingStarted.md                  # Setup, workflows
├── DOCUMENTATION_RESTRUCTURE_PLAN.md  # This planning document
│
├── concepts/                          # Foundation for everyone
│   ├── diabetes-primer.md             # ELI5 glossary
│   ├── tidepool-data-model.md         # Data types overview
│   └── architecture.md                # System overview, data flow
│
├── domains/                           # Main content - hierarchical structure
│   │
│   ├── glucose/                       # PARENT DOMAIN
│   │   ├── index.md                   # Overview, BG ranges, unit conversion
│   │   ├── statistics.md              # Cross-subdomain stats (Avg Glucose, SD, CV, GMI)
│   │   ├── screenshots/               # Stat widgets (Avg Glucose, etc.)
│   │   │
│   │   ├── cbg/                       # SUBDOMAIN: Continuous Glucose
│   │   │   ├── index.md               # CGM data structure, devices
│   │   │   ├── rendering.md           # CBGTooltip, trend lines
│   │   │   ├── sensor-usage.md        # Sensor usage, Time in Range, sample intervals
│   │   │   └── screenshots/           # CBGTooltip/, CGM-specific visuals
│   │   │
│   │   └── smbg/                      # SUBDOMAIN: Fingerstick Glucose
│   │       ├── index.md               # SMBG data structure, subTypes, aggregations
│   │       ├── rendering.md           # SMBGTooltip, Medtronic 600-series
│   │       └── screenshots/           # SMBGTooltip/
│   │
│   ├── insulin/                       # PARENT DOMAIN
│   │   ├── index.md                   # Overview, insulin types
│   │   ├── statistics.md              # Cross-subdomain stats (Avg Daily Insulin, TDD)
│   │   ├── screenshots/               # Total Insulin stat, ratio charts
│   │   │
│   │   ├── basal/                     # SUBDOMAIN: Background Insulin
│   │   │   ├── index.md               # Delivery types, data structure
│   │   │   ├── rendering.md           # Visual representation, colors
│   │   │   ├── calculations.md        # Dose calculations, Time in Auto
│   │   │   └── screenshots/           # Basal charts, tooltips
│   │   │
│   │   ├── bolus/                     # SUBDOMAIN: Discrete Doses
│   │   │   ├── index.md               # Bolus types, interruptions
│   │   │   ├── rendering.md           # Visual components, tooltips
│   │   │   ├── calculations.md        # Programmed vs delivered, override/underride
│   │   │   ├── data-model.md          # Wizard, dosingDecision structures
│   │   │   ├── device-notes.md        # Manufacturer variations
│   │   │   └── screenshots/           # Bolus shapes, BolusTooltip/
│   │   │
│   │   └── other/                     # SUBDOMAIN: Manual Injections
│   │       ├── index.md               # {type: insulin} data, pen/syringe
│   │       ├── rendering.md           # Injection tooltips by acting type
│   │       └── screenshots/           # insulin*.png tooltips
│   │
│   ├── carbs/                         # TOP-LEVEL DOMAIN
│   │   ├── index.md                   # Data sources (wizard, food), exchange units
│   │   ├── statistics.md              # Avg Daily Carbs calculation
│   │   ├── rendering.md               # Food tooltip, carb circles on boluses
│   │   └── screenshots/               # FoodTooltip/
│   │
│   ├── settings/                      # TOP-LEVEL DOMAIN
│   │   ├── index.md                   # Overview, pump settings data model patterns
│   │   ├── components.md              # Settings components (PumpSettingsContainer, common)
│   │   ├── rendering.md               # Settings print/export views
│   │   ├── tandem.md                  # Profile-based settings (Tandem)
│   │   ├── loop.md                    # Loop devices (DIY, Tidepool, Twiist) - hybrid structure
│   │   ├── legacy.md                  # Flat-array settings (Animas, Medtronic, Insulet, Microtech)
│   │   └── screenshots/               # Settings view PDF, component screenshots
│   │
│   └── device-events/                 # TOP-LEVEL DOMAIN
│       ├── index.md                   # Overview of deviceEvent types
│       ├── alarms.md                  # Alarm types, tooltips
│       ├── suspends.md                # Suspend events, counting logic
│       ├── site-changes.md            # Prime, reservoir change, manufacturer terms
│       ├── overrides.md               # Sleep, Exercise, Pre-Meal modes
│       ├── calibration.md             # CGM calibration events
│       ├── time-changes.md            # Clock adjustments, timezone detection
│       ├── health-notes.md            # Health states, reported notes
│       └── screenshots/               # AlarmTooltip/, EventTooltip/, etc.
│
├── views/                             # View-specific implementation
│   ├── daily.md
│   ├── Trends.md
│   ├── basics.md
│   └── pdf-reports.md
│
├── reference/                         # Technical appendix
│   ├── components.md                  # Visual component catalog with screenshots
│   ├── common-props.md
│   ├── time-rendering.md
│   ├── code-style.md
│   └── dependencies.md
│
└── appendices/                        # Deep dives for external partners (Phase 3)
    ├── device-matrix.md               # Comprehensive device comparison
    ├── calculation-reference.md       # All formulas consolidated
    └── data-model-complete.md         # Field-by-field reference
```

---

## Domain Hierarchy Rationale

### Glucose Domain Hierarchy

```
glucose/                    # "What is my blood sugar?"
├── index.md               # Shared concepts: ranges, units, classification
├── statistics.md          # Stats that work on both CBG and SMBG
│
├── cbg/                   # Continuous data (CGM devices)
│   └── sensor-usage.md    # CGM-specific: sensor wear, sample intervals
│
└── smbg/                  # Discrete data (fingersticks)
    └── index.md           # SMBG-specific: Readings in Range, aggregations
                           # References device-events/calibration.md
```

**Why this hierarchy?**
- Average Glucose calculation works identically for CBG and SMBG → parent level
- Sensor Usage only applies to CGM → cbg subdomain
- Readings in Range only applies to SMBG → smbg subdomain

### Insulin Domain Hierarchy

```
insulin/                   # "How much insulin did I get?"
├── index.md              # Overview of insulin delivery
├── statistics.md         # TDD, Avg Daily Insulin (basal + bolus + other)
│
├── basal/                # Continuous background delivery
│   └── calculations.md   # Time in Auto (basal-specific)
│
├── bolus/                # Discrete meal/correction doses
│   └── calculations.md   # Override/underride (bolus-specific)
│
└── other/                # Manual injections (pens, syringes)
    └── index.md          # {type: insulin} data
```

**Why this hierarchy?**
- Total Daily Insulin sums basal + bolus + other → parent level
- Time in Auto only applies to basal → basal subdomain
- Override/underride only applies to bolus with wizard → bolus subdomain
- Pen insulin is distinct from pump delivery → separate subdomain

---

## Documentation Patterns

### Parent Domain Pattern

```markdown
# [Domain Name]

Brief overview connecting the subdomains.

---

## Overview

What this domain represents. Why it matters for diabetes management.

## Subdomains

| Subdomain | Data Type | Description |
|-----------|-----------|-------------|
| [cbg](./cbg/) | `cbg` | Continuous glucose from CGM |
| [smbg](./smbg/) | `smbg` | Fingerstick readings |

## Shared Concepts

Concepts that apply to all subdomains (e.g., BG ranges, unit conversion).

## Cross-Subdomain Statistics

Statistics calculated from multiple subdomain data types.

## Key Source Files

| Purpose | File |
|---------|------|
| ... | ... |

## See Also

- Links to subdomains
- Links to related domains
```

### Subdomain Pattern

```markdown
# [Subdomain Name]

Part of the [Parent Domain](../index.md).

---

## Overview

What this specific data type represents.

## Data Structure

```javascript
{
  type: "typename",
  // fields...
}
```

## [Type-Specific Sections]

Content unique to this subdomain.

## Rendering

Visual representation, tooltips.

## Key Source Files

| Purpose | File |
|---------|------|
| ... | ... |

## See Also

- [Parent Domain](../index.md)
- Sibling subdomains
```

### Statistics Documentation Pattern

```markdown
## [Statistic Name]

**What it measures**: One-sentence description.

**Why it matters**: Clinical significance. Target values if applicable.

**Applies to**: CBG, SMBG, or both

**Calculation**:

$$\text{Formula in LaTeX}$$

Prose explanation of formula components.

**Data requirements**:
- Minimum readings
- Filtering applied
- Edge cases

**Implementation**: `ClassName.methodName()` in `path/to/file.js:lineNumber`

**Screenshot**:
![Alt text](./screenshots/filename.png)
```

---

## Missing Functionality Identified

Based on comprehensive review of the codebase vs existing documentation (January 2026), the following functionality is undocumented:

### Critical Gaps (Blocking External Partners)

| Functionality | Evidence | Priority |
|--------------|-----------|----------|
| **Pump Settings Domain** | `src/components/settings/`, `src/utils/settings/`, `src/modules/print/SettingsPrintView.js` | **Critical** |
| **Phase 3 Appendices** | `docs/appendices/` directory is empty | **Critical** |

**Impact**: External partners (Cohort B) lack comprehensive reference material for pump configuration and deep technical documentation.

### Important Gaps (Feature Coverage)

| Functionality | Evidence | Documentation Status |
|--------------|-----------|---------------------|
| **Health/Note Events** | `type: 'reportedState'`, `EVENT_HEALTH`, `EVENT_NOTES` constants | Screenshots exist, no documentation |
| **Dosing Decision Processing** | Extensive `dosingDecision` handling in `DataUtil.js` (800+ lines) | Briefly mentioned only in bolus/data-model.md |
| **Upload Data Management** | `upload` type processing, `latestPumpUpload` tracking | Not documented |

**Impact**: These features exist in the application but lack comprehensive documentation for developers (Cohort A).

### Recommended Additions to Plan

1. **Create `settings/` domain** - Full pump configuration documentation
2. **Add `health-notes.md` to `device-events/`** - Document health states and notes
3. **Expand `bolus/data-model.md`** - Full dosingDecision processing details
4. **Create `concepts/data-management.md`** - Upload data processing infrastructure (lower priority)

---

## Implementation Phases

### Completed Phases

#### Phase 1: Core Foundation ✅
- Created `concepts/` directory with diabetes-primer, data-model, architecture
- Created initial `domains/glucose/` and `domains/bolus/`
- Established documentation patterns

#### Phase 2: Complete Domain Coverage ✅
- Created all flat domains: basal, carbs, insulin-totals, sensor, device-events
- Created views documentation
- Migrated reference content

#### Phase 2.5: Hierarchical Restructure ✅

**Goal**: Implement Option B hierarchical structure

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Create `glucose/cbg/` subdomain structure | High | ✅ Complete |
| 2 | Create `glucose/smbg/` subdomain structure | High | ✅ Complete |
| 3 | Refactor `glucose/index.md` as parent | High | ✅ Complete |
| 4 | Create `insulin/` parent domain | High | ✅ Complete |
| 5 | Move `basal/` under `insulin/` | High | ✅ Complete |
| 6 | Move `bolus/` under `insulin/` | High | ✅ Complete |
| 7 | Create `insulin/other/` from insulin-totals content | High | ✅ Complete |
| 8 | Split `device-events/index.md` into focused files | Medium | ✅ Complete |
| 9 | Create `carbs/rendering.md` | Medium | ✅ Complete |
| 10 | Migrate screenshots to domain folders | Medium | ✅ Complete |
| 11 | Delete obsolete files (`sensor/`, `insulin-totals/`) | Low | ✅ Complete |
| 12 | Update all cross-references | High | ✅ Complete |
| 13 | Update `mkdocs.yml` navigation | High | ✅ Complete |

### Future Phases

#### Phase 3: Missing Functionality Documentation

**Goal**: Document critical gaps identified in review

| # | Task | Priority | Status |
|---|------|----------|--------|
| | **Settings Domain** | | |
| 1 | Create `settings/index.md` (overview, data model patterns) | Critical | Not Started |
| 2 | Create `settings/components.md` (PumpSettingsContainer, common components) | Critical | Not Started |
| 3 | Create `settings/rendering.md` (PDF export, PrintView) | Critical | Not Started |
| 4 | Create `settings/tandem.md` (profile-based settings) | High | Not Started |
| 5 | Create `settings/loop.md` (Loop/Twiist hybrid structure, unique fields) | High | Not Started |
| 6 | Create `settings/legacy.md` (flat-array settings, manufacturer terminology) | High | Not Started |
| 7 | Collect/organize settings screenshots | Medium | Not Started |
| 8 | Update `mkdocs.yml` navigation | High | Not Started |
| | **Device Events Expansion** | | |
| 9 | Create `device-events/health-notes.md` (health states, notes) | Important | Not Started |
| 10 | Update `device-events/index.md` with health-notes reference | Medium | Not Started |
| | **Bolus Data Model Expansion** | | |
| 11 | Expand `bolus/data-model.md` with dosingDecision details | Important | Not Started |
| 12 | Document dosingDecision associations (wizard, bolus, pumpSettings) | Important | Not Started |
| 13 | Document IOB calculation from dosingDecision | Medium | Not Started |

#### Phase 4: Comprehensive Reference Documentation (External Partners)

**Goal**: Deep-dive reference material for Cohort B (external partners)

**Strategy Note**: Appendices serve as quick-reference indexes that cross-link to detailed domain documentation, not as duplicates. Domain `statistics.md` files remain the authoritative source for calculation details. Appendices add:
- Consolidated formula tables for at-a-glance comparison
- Algorithms that span multiple domains (e.g., TIR reconciliation)
- Cross-cutting concerns not owned by any single domain

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Create `appendices/device-matrix.md` (comprehensive device comparison) | Critical | Not Started |
| 2 | Create `appendices/calculation-reference.md` (formula index with cross-links) | Critical | Not Started |
| 3 | Create `appendices/data-model-complete.md` (field-by-field reference) | Critical | Not Started |
| 4 | Add "Deep Dive" callouts throughout domains | Medium | Not Started |
| 5 | Create cross-references from domains to appendices | Medium | Not Started |

#### Phase 5: Infrastructure Documentation (Optional)

**Goal**: Document non-user-facing infrastructure (Cohort A)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Create `concepts/data-management.md` (upload processing) | Low | Not Started |
| 2 | Document DataUtil caching and indexing strategies | Low | Not Started |
| 3 | Document device-upload mappings and metadata | Low | Not Started |

---

## Migration Details

### Content Migration Map

#### Glucose Restructure

| Source | Destination | Action |
|--------|-------------|--------|
| `glucose/index.md` | `glucose/index.md` | Refactor as parent overview |
| `glucose/index.md` (CBG sections) | `glucose/cbg/index.md` | Extract CGM-specific content |
| `glucose/index.md` (SMBG sections) | `glucose/smbg/index.md` | Extract SMBG-specific content |
| `glucose/rendering.md` (CBG) | `glucose/cbg/rendering.md` | Extract CBGTooltip content |
| `glucose/rendering.md` (SMBG) | `glucose/smbg/rendering.md` | Extract SMBGTooltip content |
| `glucose/statistics.md` | `glucose/statistics.md` | Keep (already cross-subdomain) |
| `sensor/index.md` | `glucose/cbg/sensor-usage.md` | Move all sensor content |

#### Insulin Restructure

| Source | Destination | Action |
|--------|-------------|--------|
| (new) | `insulin/index.md` | Create parent overview |
| `insulin-totals/index.md` | `insulin/statistics.md` | Extract TDD/avg insulin stats |
| `insulin-totals/index.md` | `insulin/other/index.md` | Extract {type: insulin} content |
| `bolus/rendering.md` (pen tooltips) | `insulin/other/rendering.md` | Extract insulin injection tooltips |
| `basal/*` | `insulin/basal/*` | Move entire directory |
| `bolus/*` | `insulin/bolus/*` | Move entire directory |

#### Device Events Split

| Source Section | Destination |
|----------------|-------------|
| `device-events/index.md` (overview) | `device-events/index.md` (condensed) |
| `device-events/index.md` (alarms) | `device-events/alarms.md` |
| `device-events/index.md` (suspends) | `device-events/suspends.md` |
| `device-events/index.md` (site changes) | `device-events/site-changes.md` |
| `device-events/index.md` (overrides) | `device-events/overrides.md` |
| `device-events/index.md` (calibration) | `device-events/calibration.md` |
| `device-events/index.md` (time changes) | `device-events/time-changes.md` |

### Screenshot Migration Map

| Current Location | New Location | Notes |
|-----------------|--------------|-------|
| `docs/screenshots/CBGTooltip/*` | `domains/glucose/cbg/screenshots/` | 5 files |
| `docs/screenshots/SMBGTooltip/*` | `domains/glucose/smbg/screenshots/` | 14 files |
| `docs/screenshots/Stat/Average Glucose.png` | `domains/glucose/screenshots/` | |
| `docs/screenshots/Stat/Standard Deviation.png` | `domains/glucose/screenshots/` | |
| `docs/screenshots/Stat/Coefficient of Variation.png` | `domains/glucose/screenshots/` | |
| `docs/screenshots/Stat/Glucose Management Indicator.png` | `domains/glucose/screenshots/` | |
| `docs/screenshots/Stat/Time In Range.png` | `domains/glucose/cbg/screenshots/` | CGM-specific |
| `docs/screenshots/Stat/Sensor Usage.png` | `domains/glucose/cbg/screenshots/` | CGM-specific |
| `docs/screenshots/Stat/Readings In Range.png` | `domains/glucose/smbg/screenshots/` | SMBG-specific |
| `docs/screenshots/Stat/Total Insulin.png` | `domains/insulin/screenshots/` | |
| `docs/screenshots/Stat/Avg. Daily Insulin.png` | `domains/insulin/screenshots/` | |
| `docs/screenshots/Stat/Avg. Daily Carbs.png` | `domains/carbs/screenshots/` | |
| `docs/screenshots/Stat/Time In Auto.png` | `domains/insulin/basal/screenshots/` | Basal-specific |
| `docs/screenshots/Stat/Time In Override.png` | `domains/device-events/screenshots/` | |
| `docs/screenshots/StatTooltip/*` | `domains/glucose/screenshots/` | Annotation examples |
| `docs/screenshots/Basal/*` | `domains/insulin/basal/screenshots/` | 12 files |
| `docs/screenshots/Bolus/*` | `domains/insulin/bolus/screenshots/` | 4 files |
| `docs/screenshots/BolusTooltip/*` | `domains/insulin/bolus/screenshots/` | ~35 files (excl. insulin*) |
| `docs/screenshots/BolusTooltip/insulin*.png` | `domains/insulin/other/screenshots/` | 5 files |
| `docs/screenshots/FoodTooltip/*` | `domains/carbs/screenshots/` | 5 files |
| `docs/screenshots/AlarmTooltip/*` | `domains/device-events/screenshots/` | 6 files |
| `docs/screenshots/EventTooltip/*` | `domains/device-events/screenshots/` | 7 files |
| `docs/screenshots/PumpSettingsOverrideTooltip/*` | `domains/device-events/screenshots/` | 3 files |
| `docs/screenshots/Suspend/*` | `domains/device-events/screenshots/` | 2 files |
| `docs/screenshots/CgmSampleIntervalTooltip/*` | `domains/glucose/cbg/screenshots/` | 1 file |
| `docs/screenshots/ClipboardButton/*` | `domains/views/screenshots/` or keep | 19 files - view-related |
| `docs/screenshots/Combined Views PDF/*` | `domains/views/screenshots/` | 6 files |
| `docs/screenshots/Prescription View PDF/*` | `domains/views/screenshots/` | 1 file |
| `docs/screenshots/Device Settings [*]/*` | `domains/device-events/screenshots/` | Settings-related |

### Files to Delete After Migration

**Only delete after confirming all content has been migrated:**

| File/Directory | Replacement | Safety Check |
|----------------|-------------|--------------|
| `domains/sensor/` | `domains/glucose/cbg/sensor-usage.md` | Verify all content moved |
| `domains/insulin-totals/` | `domains/insulin/` + `domains/insulin/other/` | Verify all content moved |
| `docs/screenshots/` (centralized) | Distributed to domain folders | Verify all files moved |

### Cross-Reference Updates

After restructuring, these internal links need updating:

| Pattern | Example Change |
|---------|---------------|
| `../basal/` | `../insulin/basal/` |
| `../bolus/` | `../insulin/bolus/` |
| `../sensor/` | `./cbg/sensor-usage.md` (from glucose) |
| `../insulin-totals/` | `../insulin/` |
| `../../screenshots/` | `./screenshots/` (relative to domain) |

---

## Progress Tracking

### Phase 2.5 Checklist

```
[x] 1. Glucose hierarchy
    [x] Create glucose/cbg/ directory
    [x] Create glucose/cbg/index.md
    [x] Create glucose/cbg/rendering.md
    [x] Create glucose/cbg/sensor-usage.md
    [x] Create glucose/smbg/ directory
    [x] Create glucose/smbg/index.md
    [x] Create glucose/smbg/rendering.md
    [x] Refactor glucose/index.md as parent
    [x] Move glucose screenshots (to cbg/ and smbg/)

[x] 2. Insulin hierarchy
    [x] Create insulin/ directory structure
    [x] Create insulin/index.md (parent)
    [x] Create insulin/statistics.md
    [x] Move basal/ to insulin/basal/
    [x] Move bolus/ to insulin/bolus/
    [x] Create insulin/other/index.md
    [x] Create insulin/other/rendering.md
    [x] Move insulin screenshots

[x] 3. Device events split
    [x] Create device-events/alarms.md
    [x] Create device-events/suspends.md
    [x] Create device-events/site-changes.md
    [x] Create device-events/overrides.md
    [x] Create device-events/calibration.md
    [x] Create device-events/time-changes.md
    [x] Refactor device-events/index.md as overview
    [x] Screenshots already in place

[x] 4. Carbs enhancement
    [x] Create carbs/rendering.md
    [x] Screenshots already in place

[x] 5. Cleanup
    [x] Delete old basal/ (top-level)
    [x] Delete old bolus/ (top-level)
    [x] Delete sensor/
    [x] Delete insulin-totals/
    [x] Delete docs/screenshots/ (centralized) - moved to domains, views/screenshots retained
    [x] Update cross-references
    [x] Update mkdocs.yml navigation
    [x] Update reference/components.md screenshot paths

[x] 6. Verification
    [x] mkdocs build succeeds (verified by user)
    [ ] All links work (manual check recommended)
    [ ] All screenshots display (manual check recommended)
    [ ] No orphaned files (manual check recommended)
```

### Phase 3 Checklist: Missing Functionality Documentation

```
[x] 1. Settings Domain (Completed Jan 2026)
    [x] Create settings/ directory
    [x] Create settings/index.md (overview, data model patterns: profile vs flat-array)
    [x] Create settings/components.md (PumpSettingsContainer, common components)
    [x] Create settings/rendering.md (SettingsPrintView, PDF export)
    [x] Create settings/tandem.md (profile-based settings, Control-IQ)
    [x] Create settings/loop.md (DIY Loop, Tidepool Loop, Twiist - hybrid structure)
        [x] Document unique fields: bgSafetyLimit, insulinModel, preset overrides
        [x] Document Loop-specific terminology and annotations
    [x] Create settings/legacy.md (Animas, Medtronic, Insulet, Microtech)
        [x] Document manufacturer terminology variations (ISF vs Sensitivity vs Correction Factor)
        [x] Document BG target format variations (target+range, low+high)
        [x] Document Medtronic Auto Mode handling
    [x] Collect settings screenshots (component views, Settings PDF)
    [x] Update mkdocs.yml navigation with settings section
    [x] Verify settings domain links work

[ ] 2. Device Events Expansion
    [x] Create device-events/health-notes.md
    [x] Document health states (reportedState with states array)
    [x] Document notes (reportedState with notes field)
    [x] Add health-notes screenshots (already in place)
    [x] Update device-events/index.md with health-notes reference

[ ] 3. Bolus Data Model Expansion
    [x] Expand bolus/data-model.md with dosingDecision details
    [x] Document dosingDecision associations (wizard, bolus, pumpSettings)
    [x] Document dosingDecision → bolus association
    [x] Document dosingDecision → pumpSettings association
    [x] Document IOB from dosingDecision.insulinOnBoard
    [x] Document dosingDecision.requestedBolus vs delivered
    [x] Document dosingDecision.originalFood vs food (Loop)
```

### Phase 4 Checklist: Comprehensive Reference Documentation

```
[ ] 1. Create appendices/device-matrix.md
    [ ] Compile device comparison table (all manufacturers)
    [ ] Document device-specific features and limitations
    [ ] Document data type variations by device
    [ ] Link from relevant domains

[ ] 2. Create appendices/calculation-reference.md
    [ ] Create formula index table with cross-links to domain statistics.md files
    [ ] Include LaTeX formulas for quick reference (not to replace domain docs)
    [ ] Document common data sufficiency requirements
    [ ] Document algorithms spanning multiple domains:
        [ ] TIR percentage reconciliation (stat.js:304-332)
        [ ] Weight-based dosing formula (stat.js:521-552)
        [ ] bgExtents calculation (StatUtil.js:138-172)
    [ ] Include implementation references (file:line)

[ ] 3. Create appendices/data-model-complete.md
    [ ] Field-by-field reference for all data types
    [ ] Document field types and constraints
    [ ] Document optional vs required fields
    [ ] Document field relationships (associations)

[ ] 4. Cross-References
    [ ] Add "Deep Dive" links from domains to appendices
    [ ] Review all domains for opportunities to link to appendices
    [ ] Verify all cross-references work
```

### Phase 5 Checklist: Infrastructure Documentation (Optional)

```
[ ] 1. Create concepts/data-management.md
    [ ] Document upload type structure
    [ ] Document latestPumpUpload selection logic
    [ ] Document device-upload mappings
    [ ] Document upload-specific metadata

[ ] 2. Document DataUtil internals
    [ ] Document crossfilter indexing
    [ ] Document caching strategies
    [ ] Document tag system for events

[ ] 3. Document device detection
    [ ] Document manufacturer identification
    [ ] Document device model detection
    [ ] Document feature detection (Loop, automated basals, etc.)
```

---

## Appendix: Applying This Approach to Other Repos

This hierarchical documentation approach can be templated for other Tidepool repositories.

### Key Principles

1. **Identify natural hierarchies**: Look for parent-child relationships in your data model
2. **Statistics follow scope**: Place stats at the level where they apply
3. **Subdomains are self-contained**: Each should be understandable on its own
4. **Parents provide context**: Overview, shared concepts, cross-cutting concerns
5. **Screenshots live with content**: Reduces maintenance, improves readability

### Questions to Identify Hierarchy

- What data types are related but distinct? (→ siblings under parent)
- What statistics apply to multiple types? (→ parent level)
- What statistics apply to one type only? (→ subdomain level)
- What concepts are shared vs type-specific? (→ parent vs subdomain)

---

## Document History

| Date | Change |
|------|--------|
| Jan 2026 | Initial planning document created |
| Jan 2026 | Phase 1 & 2 completed |
| Jan 2026 | Revised for Option B hierarchical structure |
| Jan 2026 | Phase 2.5 implementation: glucose, insulin, device-events hierarchies |
| Jan 2026 | Phase 2.5 completed: cleanup, carbs rendering, navigation updated |
| Jan 2026 | Comprehensive codebase review: identified missing functionality |
| Jan 2026 | Added settings domain to plan (Decision 7) |
| Jan 2026 | Added health/notes documentation requirement (Decision 8) |
| Jan 2026 | Added Phase 3: Missing Functionality Documentation |
| Jan 2026 | Added Phase 4: Comprehensive Reference Documentation |
| Jan 2026 | Added Phase 5: Infrastructure Documentation (optional) |
| Jan 2026 | Added Decision 9: Settings by data model pattern (profile vs flat-array) |
| Jan 2026 | Refined settings domain: added loop.md, legacy.md based on codebase investigation |
| Jan 2026 | Clarified Phase 4 appendix strategy: cross-reference index, not duplication |
