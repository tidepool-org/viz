# Documentation Audit Report

**Date:** January 2026  
**Repository:** @tidepool/viz  
**Purpose:** Assess existing documentation to inform documentation improvements

---

## Executive Summary

The @tidepool/viz repository has **fragmented, outdated documentation** dating primarily from 2016-2017. While foundational concepts remain valid, the codebase has evolved significantly. The documentation gap represents both a challenge and an opportunity: existing materials provide architectural context, but substantial work is needed to bring documentation current.

### Key Findings

| Category | Status | Notes |
|----------|--------|-------|
| In-repo docs (`/docs`) | Severely outdated | Last meaningful updates ~2016-2017 |
| Inline code docs | Inconsistent | Good naming, sparse JSDoc |
| Tests as docs | Strong | Excellent edge case coverage |
| Storybook coverage | Partial (~30%) | Good for tooltips, weak for trends |
| Auto-generated API docs | Exists | `src/utils/apidocs/` - useful but incomplete |
| Screenshot assets | Rich | Comprehensive visual reference |

---

## 1. Existing In-Repo Documentation (`/docs`)

### 1.1 Current Structure

```
docs/
├── StartHere.md          # Entry point, links to other docs
├── GettingStarted.md     # Developer onboarding guide
├── Architecture.md       # Architectural decisions and rationale
├── Components.md         # Visual component catalog with screenshots
├── CodeStyle.md          # Coding conventions
├── Storybook.md          # Storybook usage guide
├── deps/                 # Dependency documentation
│   ├── README.md
│   ├── D3.md
│   ├── GSAP.md
│   ├── Moment.md
│   ├── React.md
│   ├── ReactMotion.md
│   └── Redux.md
├── misc/
│   ├── CommonProps.md
│   ├── Docs.md
│   └── TimeRenderingModes.md
└── views/
    ├── README.md
    ├── Trends.md
    └── images/           # Trends view screenshots
```

### 1.2 Assessment by Document

| Document | Lines | Last Relevant | Assessment |
|----------|-------|---------------|------------|
| StartHere.md | ~30 | Jan 2026 | Updated entry point |
| GettingStarted.md | ~160 | Jan 2026 | **New** - developer onboarding |
| Architecture.md | ~150 | Jan 2026 | Updated with Mermaid diagram |
| Components.md | ~500 | Jan 2026 | **New** - visual component catalog |
| CodeStyle.md | ~25 | Jan 2026 | Updated, valid |
| Storybook.md | ~50 | 2017 | Valid but incomplete |

### 1.3 What's Missing from `/docs`

- ~~**DataUtil documentation** - Core data processing class undocumented~~ ✅ JSDoc added
- ~~**StatUtil documentation** - Statistical calculations undocumented~~ ✅ JSDoc added
- ~~**Component API reference** - No component documentation~~ ✅ Components.md added
- **Print/PDF system** - No documentation for PDF generation
- **AGP reports** - Ambulatory Glucose Profile implementation undocumented
- **Integration guide** - How to use @tidepool/viz in blip
- **Data model reference** - Tidepool data types handled

### 1.4 Valuable Content Worth Preserving

1. **Architecture.md** - Explains rationale for:
   - Redux for state management
   - Crossfilter for data filtering
   - Web Worker implementation
   - Modularity goals

2. **deps/** folder - Explains why specific libraries were chosen

---

## 2. Inline Code Documentation

### 2.1 JSDoc Coverage

| File | JSDoc Quality | Notes |
|------|---------------|-------|
| DataUtil.js | **Excellent** | ✅ Comprehensive JSDoc added (Jan 2026) |
| StatUtil.js | **Excellent** | ✅ Comprehensive JSDoc added (Jan 2026) |
| AggregationUtil.js | **Good** | Best documented utility |
| stat.js | Fair | 3 documented functions of ~20 |
| PrintView.js | None | 1000+ lines, no JSDoc |
| FoodTooltip.js | None | PropTypes serve as partial docs |

### 2.2 Inline Comments

- **Sparse throughout** - Most complex algorithms lack explanation
- **Good naming** - Self-documenting code through descriptive names
- **Notable exceptions**:
  - DataUtil.js has comments explaining legacy data handling
  - Some crossfilter dimension setup is explained

### 2.3 TODO/FIXME Comments

Only **1 TODO found** in PrintView.js (line 998) - debugging-related

### 2.4 Typos Found

- `FoodTooltip.js` line 153: `titls` should be `title` in PropTypes

---

## 3. Auto-Generated API Documentation

### 3.1 Location: `src/utils/apidocs/`

```
apidocs/
├── basal.md
├── bloodglucose.md
├── bolus.md
├── datetime.md
├── format.md
└── misc.md
```

### 3.2 Assessment

- Generated via JSDoc from utility functions
- **Useful but incomplete** - only covers utility functions
- Missing: DataUtil, StatUtil, AggregationUtil, PrintView
- Format is clean and includes type annotations

---

## 4. Tests as Documentation

### 4.1 Coverage Quality

| Aspect | Rating | Evidence |
|--------|--------|----------|
| Description clarity | 8/10 | Clear BDD-style descriptions |
| Usage examples | 9/10 | Comprehensive input/output demos |
| Edge case coverage | 9/10 | Excellent boundary testing |
| API documentation | 7/10 | Good "how", limited "why" |
| Newcomer accessibility | 6/10 | Requires domain knowledge |

### 4.2 Test Files as Learning Resources

**Highly useful tests:**
- `stat.test.js` - Shows all stat formats and transformations
- `datetime.test.js` - Documents timezone handling, DST edge cases
- `BolusTooltip.test.js` - Complete data structures for all bolus types

**What can be learned from tests:**
- Available stat formats: `bgCount`, `bgRange`, `bgValue`, `cv`, `carbs`, etc.
- Data structure requirements for each component
- Edge cases like cancelled boluses, DST boundaries

---

## 5. Storybook Coverage

### 5.1 Coverage Statistics

| Category | With Stories | Without | Coverage |
|----------|-------------|---------|----------|
| common | 7 | 6 | ~54% |
| daily (tooltips) | 7 | 0 | 100% |
| settings | 2 | 7 | ~22% |
| trends | 1 | 27 | **~4%** |
| **Overall** | 17 | ~40 | ~30% |

### 5.2 Strengths

- **Excellent edge case coverage** for tooltips (BolusTooltip has 39 stories)
- **Interactive testing** via Storybook knobs in Stat.js
- **Device-specific variations** - Animas, Medtronic, OmniPod, Loop, Tandem
- **PDF print stories** - 7 different PDF views covered

### 5.3 Weaknesses

- **Trends components almost entirely uncovered** (1 of 28)
- **No documentation/notes** in stories
- **No MDX or docs addon** usage
- **Print stories require local data files**

---

## 6. Screenshot Assets

### 6.1 Location: `/__screenshots__/`

Rich collection of visual assets organized by component:

```
__screenshots__/
├── AlarmTooltip/       (6 images)
├── Basal/              (12 images)
├── Bolus/              (19 images)
├── BolusTooltip/       (39 images)
├── CBGTooltip/         (5 images)
├── ClipboardButton/    (19 images)
├── Combined Views PDF/ (6 images)
├── Device Settings/    (per manufacturer)
├── EventTooltip/       (7 images)
├── FoodTooltip/        (6 images)
├── SMBGTooltip/        (16 images)
├── Stat/               (12 images)
├── StatTooltip/        (4 images)
├── Suspend/            (2 images)
└── Prescription View PDF/
```

### 6.2 Documentation Value

- **Excellent visual reference** for expected component appearance
- **Edge case visualization** - cancelled boluses, various pump types
- **PDF output examples** - AGP, Basics, Daily views
- **Could be incorporated** into component documentation

---

## 7. DeepWiki Comparison

### 7.1 DeepWiki Structure (Auto-Generated)

```
1. Overview
2. Data Processing System
   2.1 DataUtil - Core Data Management
   2.2 Statistical Processing
   2.3 Data Validation and Schema
3. UI Component System
   3.1 Stat Components
   3.2 Tooltip Components
   3.3 Settings Components
4. Print and PDF Generation
   4.1 PrintView System Architecture
   4.2-4.4 Report Types (Daily, AGP, Basics)
   4.5 Storybook Integration
5. Utility Systems
   5.1-5.5 Various utilities
6. Build and Development System
```

### 7.2 DeepWiki Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Coverage breadth | Good | Touches all major systems |
| Technical depth | Shallow | Auto-generated, surface-level |
| Accuracy | Moderate | Some hallucinated details |
| Usefulness | Limited | Clients could generate this themselves |

### 7.3 What DeepWiki Gets Right

- Overall system structure identification
- Core class relationships (DataUtil -> StatUtil -> AggregationUtil)
- Build system overview

### 7.4 What DeepWiki Misses

- **Domain context** - No diabetes terminology explanation
- **Clinical significance** - Why these stats matter
- **Integration patterns** - How blip uses viz
- **Decision rationale** - Why things are built this way

---

## 8. Gap Analysis

### 8.1 Critical Missing Documentation

| Gap | Priority | Complexity | Notes |
|-----|----------|------------|-------|
| ~~DataUtil guide~~ | ~~High~~ | ~~High~~ | ✅ JSDoc completed (Jan 2026) |
| ~~StatUtil guide~~ | ~~High~~ | ~~Medium~~ | ✅ JSDoc completed (Jan 2026) |
| PrintView/PDF guide | High | High | Complex system, no docs |
| Component API reference | Medium | Medium | PropTypes exist but undocumented |
| Integration guide | Medium | Low | How to use in blip |
| Data model reference | Medium | Medium | Link to Tidepool data model |

### 8.2 Outdated Documentation ~~Requiring Updates~~ Updated

| Document | Status | Notes |
|----------|--------|-------|
| ~~DirectoryStructure.md~~ | Deleted | Covered in GettingStarted.md |
| ~~FeatureOverview.md~~ | Deleted | View docs belong in blip |
| Architecture.md | ✅ Updated | Mermaid diagram, streamlined |

### 8.3 New Documentation ~~Needed~~ Added

1. ~~**Getting Started Guide** - Quick setup for new developers~~ ✅ GettingStarted.md
2. ~~**Component Visual Reference** - Screenshots with descriptions~~ ✅ Components.md
3. **Statistical Calculations Reference** - Formulas with clinical context (deferred)
4. **PDF Generation Guide** - PrintView system documentation (deferred)
5. **AGP Implementation** - Ambulatory Glucose Profile specifics (deferred)
6. **Device Support Matrix** - Which pumps/CGMs are supported (deferred)

---

## 9. Recommendations

### 9.1 Documentation Structure Proposal

```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── integration-with-blip.md
├── architecture/
│   ├── overview.md              # Updated Architecture.md
│   ├── data-flow.md             # DataUtil -> StatUtil flow
│   └── design-decisions.md      # Preserved rationale
├── core-systems/
│   ├── data-processing.md       # DataUtil documentation
│   ├── statistics.md            # StatUtil with formulas
│   ├── aggregation.md           # AggregationUtil
│   └── pdf-generation.md        # PrintView system
├── components/
│   ├── overview.md
│   ├── tooltips.md
│   ├── stats.md
│   └── settings.md
├── reference/
│   ├── data-model.md            # Tidepool data types
│   ├── device-support.md        # Supported devices
│   ├── statistical-formulas.md  # Math with LaTeX
│   └── api/                     # Generated API docs
└── development/
    ├── code-style.md            # Updated CodeStyle.md
    ├── testing.md
    └── storybook.md
```

### 9.2 Prioritized Task Order

**Phase 1: JSDoc Foundation** ✅ COMPLETE

Before writing high-level documentation, improve JSDoc coverage in core files. This foundational work:
- Forces deep understanding of the code before documenting it
- Creates documentation that lives with the code and stays in sync
- Enables IDE tooltips and autocomplete for developers
- Produces auto-generated API reference docs

**Completed (January 2026):**
- DataUtil.js: 459 lines of JSDoc added covering all public methods and key internals
- StatUtil.js: 260 lines of JSDoc added covering all statistical calculation methods

Priority files for JSDoc improvement:

| File | Lines | Current JSDoc | Priority | Status |
|------|-------|---------------|----------|--------|
| DataUtil.js | 2444 | **Excellent** | Critical | ✅ Complete |
| StatUtil.js | 497 | **Excellent** | Critical | ✅ Complete |
| stat.js | 1117 | Fair | High | Pending |
| AggregationUtil.js | 781 | Good | Low (already decent) | - |
| PrintView.js | 1089 | None | Low (internal implementation) | - |

JSDoc should include:
- `@description` - What the function/method does
- `@param` - All parameters with types and descriptions
- `@returns` - Return value with type
- `@example` - Usage examples (can be derived from test files)
- `@see` - Links to related functions/documentation

**Phase 2: Core Documentation**
1. ~~JSDoc for DataUtil.js core methods~~ ✅ Complete
2. Getting Started guide
3. Architecture overview update
4. DataUtil conceptual documentation

**Phase 3: Components & Visualization** ✅ COMPLETE
5. ~~JSDoc for StatUtil.js~~ ✅ Complete + statistical formulas
6. ~~Component documentation with screenshots~~ ✅ Components.md created
   - Tooltips (rich screenshot coverage exists)
   - Stats display components
   - Device settings views
   - Data renderers (Basal, Bolus, Suspend)
   - PDF report examples
7. Data views overview - deferred (view docs belong in blip)

**Deferred: PDF Generation**
PrintView internals are lower priority - client documentation will focus on *what* is visualized, not *how* PDFs are generated. The existing screenshot assets in `/__screenshots__/Combined Views PDF/` can illustrate PDF outputs without requiring internal documentation.

### 9.3 Content to Leverage

- **Preserve**: Architecture.md rationale, deps/ explanations
- **Incorporate**: Screenshots into component docs
- **Reference**: Test files for usage examples
- **Generate**: API docs from improved JSDoc comments

### 9.4 Tools and Formats

- **Mermaid** for architecture diagrams
- **LaTeX** for statistical formulas (GMI, CV, etc.)
- **Screenshots** from `/__screenshots__/` for visual examples
- **Code examples** extracted from test files

---

## Appendix A: File-by-File Documentation Quality

| File | Lines | JSDoc | Inline | Self-Doc | Overall |
|------|-------|-------|--------|----------|---------|
| DataUtil.js | 2444 | **Excellent** | Fair | Good | 9/10 |
| StatUtil.js | 497 | **Excellent** | Minimal | Good | 9/10 |
| stat.js | 1117 | Fair | Poor | Good | 5/10 |
| AggregationUtil.js | 781 | Good | Fair | Good | 7/10 |
| PrintView.js | 1089 | None | Minimal | Good | 2/10 |
| FoodTooltip.js | 185 | None | None | Good | 3/10 |

## Appendix B: Storybook Coverage Detail

### Components WITH Stories (17)
- ClipboardButton, Loader, Stat
- CgmSampleIntervalTooltip, EventsInfoTooltip, StatTooltip, Tooltip
- AlarmTooltip, BolusTooltip, CBGTooltip, EventTooltip, FoodTooltip, PumpSettingsOverrideTooltip, SMBGTooltip
- NonTandem, Tandem (DeviceSettings)
- Background (trends)

### Components WITHOUT Stories (~40+)
- All trends/cbg components (8)
- All trends/smbg components (9)
- Most trends/common components (10)
- Most settings/common components (6)
- Several stat sub-components (5)

---

## Appendix C: Cross-Repository Dependencies (blip)

The `@tidepool/viz` library is consumed by the `blip` application. Understanding the integration points is essential for documenting DataUtil and PDF generation accurately.

### Key Integration Files in blip

**Note:** Request access to blip repo before working on DataUtil or PDF documentation.

| blip Path | Purpose | Relevant For |
|-----------|---------|--------------|
| `../blip/app/worker/DataWorker.js` | Web Worker wrapper for DataUtil | DataUtil docs |
| `../blip/app/worker/PDFWorker.js` | Web Worker wrapper for PDF generation | PDF docs |
| `../blip/app/redux/reducers/data.js` | Redux state for patient data | DataUtil docs |
| `../blip/app/redux/reducers/pdf.js` | Redux state for PDF generation | PDF docs |
| `../blip/app/redux/actions/worker.js` | Actions dispatched to workers | Both |

### DataWorker Integration Points

The `DataWorker` class in blip wraps viz's `DataUtil` and exposes these operations:

```
DATA_WORKER_ADD_DATA_REQUEST    -> dataUtil.addData(data, patientId, returnData)
DATA_WORKER_REMOVE_DATA_REQUEST -> dataUtil.removeData(predicate)
DATA_WORKER_UPDATE_DATUM_REQUEST -> dataUtil.updateDatum(datum)
DATA_WORKER_QUERY_DATA_REQUEST  -> dataUtil.query(query)
```

### PDFWorker Integration Points

The `PDFWorker` class handles PDF generation with special handling for:
- AGP reports (require Plotly image generation on main thread)
- Basics, Daily, BgLog reports
- Query-based data fetching before PDF generation

### Documentation TODO

When documenting DataUtil:
- [x] Review `DataWorker.js` to understand the full public API surface
- [x] Review `data.js` reducer to understand how query results are consumed
- [x] Document the query format expected by `dataUtil.query()`

When documenting PDF generation:
- [ ] Review `PDFWorker.js` to understand report generation flow
- [ ] Document the AGP image generation handoff pattern
- [ ] Review `pdf.js` reducer for state management

---

*This audit was conducted to inform documentation planning. Recommendations should be reviewed against project goals and client requirements.*
