# Documentation Restructure Plan

> **Status**: Implementation In Progress (~60% Complete)  
> **Created**: January 2026  
> **Last Updated**: January 2026

This document captures the planning process, decisions, and implementation plan for restructuring the `@tidepool/viz` documentation. It serves as both a tracking document and a template for applying this approach to other Tidepool repositories.

---

## Table of Contents

- [Background and Motivation](#background-and-motivation)
- [Audience Analysis](#audience-analysis)
- [Key Problems with Current Documentation](#key-problems-with-current-documentation)
- [Design Decisions](#design-decisions)
- [Final Structure](#final-structure)
- [Documentation Patterns](#documentation-patterns)
- [Implementation Phases](#implementation-phases)
- [Progress Tracking](#progress-tracking)
- [Appendix: Applying This Approach to Other Repos](#appendix-applying-this-approach-to-other-repos)

---

## Background and Motivation

### Why Restructure?

The existing documentation in `/docs` has grown organically and no longer serves readers effectively. Key issues identified:

1. **Core concepts are underdeveloped**: The data flow and processing pipeline (DataUtil, StatUtil, crossfilter) are mentioned but not explained in depth. These are the most critical concepts for understanding the codebase.

2. **Components.md is too large**: A 400+ line file covering all component types makes it difficult to find relevant information and obscures the relationship between data processing and rendering.

3. **Statistics lack mathematical rigor**: For data scientists and developers building similar systems, the statistical calculations need LaTeX formulas and clear documentation of data requirements.

4. **No diabetes domain context**: Developers new to diabetes technology need ELI5 explanations of terms like "bolus", "basal", "IOB", "Time in Range", etc.

5. **Reference sections distract from core content**: "Dependencies" and "Reference" sections containing CommonProps and TimeRenderingModes are not high-value for most readers but appear prominently in navigation.

6. **Device-specific complexity is hidden**: The bolus tooltip alone handles 6+ device manufacturers differently. This complexity needs documentation.

---

## Audience Analysis

### Primary Audiences

**Cohort A: Internal Developers (Primary)**
- New developers joining Tidepool's viz team
- Need to understand codebase to contribute effectively
- Benefit from progressive disclosure (overview → detail)

**Cohort B: External Development Partners (Secondary)**
- External teams building their own diabetes visualization products
- Using Tidepool's open-source approach and expertise as reference
- Need comprehensive "deep dive" documentation for building from scratch

**Cohort C: AI Agents (Tertiary)**
- Need efficient context loading (token-conscious)
- Benefit from well-structured, linkable documentation
- Can navigate to relevant sections quickly if structure is clear

### Key Insight

Cohorts A and B have aligned needs—both need to understand **what** (diabetes concepts), **why** (design decisions), and **how** (implementation). The difference is **depth**: Cohort B needs comprehensive reference material that would overwhelm Cohort A if presented inline.

**Solution**: Layered documentation with "Deep Dive" callouts linking to appendices for Cohort B, while keeping main content digestible for Cohort A.

---

## Key Problems with Current Documentation

| Problem | Current State | Impact |
|---------|---------------|--------|
| Data flow underdeveloped | Brief mention in GettingStarted.md | Developers don't understand the processing pipeline |
| Statistics not documented | Only JSDoc in StatUtil.js | No LaTeX formulas, no data requirements |
| Components.md monolithic | 400+ lines, all component types | Hard to find relevant info |
| No diabetes glossary | Assumed knowledge | New developers lost on terminology |
| Device complexity hidden | Scattered in code comments | Bugs from missed device-specific handling |
| Reference too prominent | Top-level nav items | Distracts from core content |
| Code Style too prominent | Top-level nav | Minor detail given high visibility |

---

## Design Decisions

### Decision 1: Domain-First Organization

**Options Considered**:
1. **Domain-First**: Organize by diabetes domain (glucose, bolus, basal, etc.)
2. **Layer-First**: Organize by code architecture (data layer, calculation layer, presentation layer)
3. **Minimal Reorganization**: Keep structure, enhance content

**Choice**: Domain-First

**Rationale**: Each domain tells a complete story from raw data → processing → calculation → rendering. This matches how developers think about features ("I need to understand bolus rendering") rather than code layers ("I need to understand the presentation layer").

### Decision 2: Inline LaTeX Formulas

**Options Considered**:
1. Inline with explanatory prose
2. Separate math reference appendix
3. Both

**Choice**: Inline with explanatory prose

**Rationale**: Formulas are most useful when presented alongside the context that explains what they measure and why. A separate appendix would require readers to jump back and forth.

### Decision 3: Device-Specific Documentation Distribution

**Options Considered**:
1. Centralized device matrix document
2. Distributed within feature documentation
3. Both (inline + appendix)

**Choice**: Distributed within feature documentation, with comprehensive appendix for Cohort B

**Rationale**: Developers working on a specific feature need device notes in context. The appendix serves as a complete reference for those building from scratch.

### Decision 4: Screenshot Organization

**Options Considered**:
1. Keep centralized in `docs/screenshots/`
2. Distribute to domain folders
3. Hybrid (centralized storage, domain references)

**Choice**: Distribute to domain folders

**Rationale**: Screenshots alongside prose create a more cohesive reading experience. Domain folders become self-contained documentation units.

### Decision 5: Phased Implementation

**Choice**: Three phases
1. **Phase 1**: Core foundation (concepts, glucose domain, bolus domain)
2. **Phase 2**: Complete domain coverage
3. **Phase 3**: Comprehensive reference documentation (appendices for Cohort B)

**Rationale**: Delivers value incrementally. Phase 1 demonstrates the pattern; subsequent phases follow established templates.

---

## Final Structure

```
docs/
├── index.md                           # Landing page with audience paths
├── getting-started.md                 # Setup, workflows (streamlined)
├── DOCUMENTATION_RESTRUCTURE_PLAN.md  # This file
│
├── concepts/                          # Foundation for everyone
│   ├── diabetes-primer.md             # ELI5 glossary of terms used in code
│   ├── tidepool-data-model.md         # Data types, time fields, device variations
│   └── architecture.md                # System overview, data flow, Web Workers
│
├── domains/                           # Main content - the heart of the docs
│   │
│   ├── glucose/
│   │   ├── index.md                   # Overview: CGM vs BGM, classification ranges
│   │   ├── statistics.md              # TIR, RIR, Avg, SD, CV, GMI with LaTeX
│   │   ├── rendering.md               # Tooltips, device-specific notes
│   │   └── screenshots/               # Domain-specific screenshots
│   │
│   ├── bolus/
│   │   ├── index.md                   # What is a bolus? Types, terminology
│   │   ├── data-model.md              # wizard, dosingDecision, food linking
│   │   ├── calculations.md            # programmed vs delivered, override logic
│   │   ├── rendering.md               # All visual variations
│   │   ├── device-notes.md            # Animas, Medtronic, Loop, Tandem specifics
│   │   └── screenshots/               # Domain-specific screenshots
│   │
│   ├── basal/
│   │   ├── index.md                   # Scheduled, temp, suspend, automated
│   │   ├── calculations.md            # Duration calculations, Time in Auto
│   │   ├── rendering.md               # Visual variations
│   │   └── screenshots/
│   │
│   ├── carbs/
│   │   ├── index.md                   # Carb sources, exchange units
│   │   ├── statistics.md              # Avg Daily Carbs calculation
│   │   └── screenshots/
│   │
│   ├── insulin-totals/
│   │   ├── index.md                   # TDD, basal/bolus ratio, statistics
│   │   └── screenshots/
│   │
│   ├── sensor/
│   │   ├── index.md                   # Sensor usage, AGP differences
│   │   └── screenshots/
│   │
│   └── device-events/
│       ├── alarms.md                  # Alarm types and rendering
│       ├── overrides.md               # Sleep, Exercise, Pre-Meal modes
│       ├── settings.md                # Pump settings by manufacturer
│       └── screenshots/
│
├── views/                             # View-specific implementation
│   ├── daily.md
│   ├── trends.md                      # Existing content, enhanced
│   ├── basics.md
│   └── pdf-reports.md
│
├── reference/                         # Technical appendix (lower nav prominence)
│   ├── common-props.md
│   ├── time-rendering.md
│   └── code-style.md
│
└── appendices/                        # Deep dives for Cohort B
    ├── device-matrix.md               # Comprehensive device comparison table
    ├── calculation-reference.md       # All formulas in one place
    └── data-model-complete.md         # Full field-by-field reference
```

---

## Documentation Patterns

### Domain Page Pattern

Each domain section follows a consistent structure:

```markdown
# [Domain Name]

## Overview
Brief ELI5 explanation of the domain concept. What is it? Why does it matter 
for diabetes management?

## Key Concepts
Bullet list of terminology with brief definitions. Links to diabetes-primer.md 
for foundational terms.

## Data Model
How Tidepool represents this data type. Code examples showing typical datum 
structure. Notes on device variations.

> **Deep Dive**: [Complete data model reference](../appendices/data-model-complete.md#section)

## Calculations (if applicable)
How we process/calculate statistics for this domain. Inline LaTeX formulas.
Data requirements and edge cases.

## Rendering
Visual representation in the UI. Screenshots organized by scenario.
Device-specific rendering notes inline.

> **Deep Dive**: [Device comparison matrix](../appendices/device-matrix.md#section)

## Implementation References
Links to relevant source files with line numbers.
```

### Statistics Documentation Pattern

```markdown
## [Statistic Name]

**What it measures**: One-sentence description.

**Why it matters**: Clinical/practical significance. Target values if applicable.

**Calculation**:

$$\text{Formula in LaTeX}$$

Prose explanation of the formula components.

**Data requirements**:
- Bullet list of filtering, minimum counts, etc.

**Implementation**: `ClassName.methodName()` in `path/to/file.js:lineNumber`

**Screenshot**:
![Alt text](./screenshots/filename.png)
```

### Device Notes Pattern

```markdown
## Device-Specific Handling

### [Manufacturer Name]

**Unique behavior**: What this device does differently.

**Data model differences**: Fields that are present/absent/different.

**Rendering impact**: How this affects what we display.

**Code reference**: Where this is handled in the codebase.
```

---

## Implementation Phases

### Phase 1: Core Foundation
**Goal**: Establish patterns and document most complex domains

| Task | Status | Notes |
|------|--------|-------|
| Create `concepts/diabetes-primer.md` | **Done** | 247 lines, comprehensive ELI5 glossary |
| Create `concepts/tidepool-data-model.md` | **Done** | 492 lines, all data types documented |
| Create `concepts/architecture.md` | **Done** | 264 lines, mermaid diagrams, data flow |
| Create `domains/glucose/` complete | **Done** | index.md, statistics.md (with LaTeX), rendering.md |
| Create `domains/bolus/` complete | **Done** | All 5 files: index, data-model, calculations, rendering, device-notes |
| Move relevant screenshots | Not Started | Screenshots still centralized |
| Update `mkdocs.yml` navigation | **Done** | Domains and views added |
| Update `index.md` landing page | **Done** | Renamed from StartHere.md |
| Streamline `getting-started.md` | **Done** | GettingStarted.md (182 lines) |

### Phase 2: Complete Domain Coverage
**Goal**: Document all remaining domains following established patterns

| Task | Status | Notes |
|------|--------|-------|
| Create `domains/basal/` complete | **Done** | index.md (322 lines), calculations.md, rendering.md |
| Create `domains/carbs/` complete | **Done** | index.md, statistics.md |
| Create `domains/insulin-totals/` complete | **Done** | index.md (comprehensive) |
| Create `domains/sensor/` complete | **Done** | index.md (comprehensive) |
| Create `domains/device-events/` complete | **Done** | index.md (336 lines, comprehensive - covers alarms, overrides, settings) |
| Create `views/daily.md` | **Done** | 311 lines, comprehensive |
| Create `views/basics.md` | **Done** | 297 lines, comprehensive |
| Enhance `views/trends.md` | **Done** | Existing Trends.md (172 lines) |
| Create `views/pdf-reports.md` | **Done** | 309 lines, comprehensive |
| Migrate `reference/` content | Not Started | Files still in misc/ |

### Phase 3: Comprehensive Reference Documentation (Cohort B)
**Goal**: Comprehensive reference material for external partners

| Task | Status | Notes |
|------|--------|-------|
| Create `appendices/device-matrix.md` | Not Started | All devices compared |
| Create `appendices/calculation-reference.md` | Not Started | All formulas |
| Create `appendices/data-model-complete.md` | Not Started | Field-by-field |
| Add "Deep Dive" callouts throughout | Not Started | Link to appendices |
| Review and enhance device notes | Not Started | Comprehensive coverage |

---

## Progress Tracking

### Phase 1 Progress: 90%

```
[x] concepts/diabetes-primer.md
[x] concepts/tidepool-data-model.md  
[x] concepts/architecture.md
[x] domains/glucose/index.md
[x] domains/glucose/statistics.md
[x] domains/glucose/rendering.md
[x] domains/bolus/index.md
[x] domains/bolus/data-model.md
[x] domains/bolus/calculations.md
[x] domains/bolus/rendering.md
[x] domains/bolus/device-notes.md
[ ] Screenshot reorganization
[x] mkdocs.yml update
[x] index.md update
[x] getting-started.md streamline
```

### Phase 2 Progress: 95%

```
[x] domains/basal/index.md
[x] domains/basal/calculations.md
[x] domains/basal/rendering.md
[x] domains/carbs/index.md
[x] domains/carbs/statistics.md
[x] domains/insulin-totals/index.md
[x] domains/sensor/index.md
[x] domains/device-events/index.md (comprehensive - covers alarms, overrides, settings)
[x] views/daily.md
[x] views/basics.md
[x] views/trends.md (enhance)
[x] views/pdf-reports.md
[ ] reference/* migration
```

### Phase 3 Progress: 0%

```
[ ] appendices/device-matrix.md
[ ] appendices/calculation-reference.md
[ ] appendices/data-model-complete.md
[ ] Deep Dive callouts
```

---

## Appendix: Applying This Approach to Other Repos

This documentation restructure approach can be templated for other Tidepool repositories. Key principles:

### 1. Identify Your Domains

Every codebase has natural domain boundaries. For viz, these are diabetes data types (glucose, bolus, basal). For other repos, identify the conceptual units that developers think in.

**Questions to ask**:
- What are the main "things" this code deals with?
- How do developers phrase questions? ("How does X work?")
- What would a new developer need to understand first?

### 2. Identify Your Audiences

Document who will read the docs and what depth they need:
- Internal developers (progressive disclosure)
- External partners (comprehensive reference)
- AI agents (structured, linkable)

### 3. Apply the Domain-First Pattern

For each domain:
1. **Overview**: ELI5 explanation
2. **Key Concepts**: Terminology
3. **Data Model**: How it's represented
4. **Processing/Calculation**: What we do with it
5. **Rendering/Output**: How it's presented
6. **Implementation References**: Where to find the code

### 4. Use Layered Depth

- Main content serves primary audience
- "Deep Dive" callouts link to appendices for those needing more
- Appendices consolidate comprehensive reference material

### 5. Demote Reference Material

Technical reference (props, constants, style guides) should be accessible but not prominent. Use a `reference/` section at the bottom of navigation.

### 6. Include Visuals

Screenshots distributed to relevant domains create self-contained documentation units. A picture often explains faster than prose.

### 7. Track Progress Explicitly

Include a progress tracking section in the plan document. Check off items as completed. This provides visibility and momentum.

---

## Files to Remove/Deprecate After Migration

After full implementation, these files can be removed or redirected:

| File | Action | Reason |
|------|--------|--------|
| `docs/Components.md` | Remove | Content distributed to domains |
| `docs/misc/README.md` | Remove | Empty/navigation only |
| `docs/deps/README.md` | Remove | Merged into reference |
| `docs/deps/D3.md` | Merge | Into reference/dependencies.md |
| `docs/deps/React.md` | Merge | Into reference/dependencies.md |
| `docs/deps/ReactMotion.md` | Merge | Into reference/dependencies.md |
| `docs/StartHere.md` | Rename | Becomes index.md |
| `docs/Architecture.md` | Move | Becomes concepts/architecture.md |
| `docs/CodeStyle.md` | Move | Becomes reference/code-style.md |
| `docs/misc/CommonProps.md` | Move | Becomes reference/common-props.md |
| `docs/misc/TimeRenderingModes.md` | Move | Becomes reference/time-rendering.md |

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| Jan 2026 | Initial planning document created | AI-assisted |

