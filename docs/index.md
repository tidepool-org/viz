# @tidepool/viz Developer Guide

This repository, published to npm as [@tidepool/viz](https://www.npmjs.com/package/@tidepool/viz), provides data visualization components and utilities for [blip](https://github.com/tidepool-org/blip), Tidepool's web application for people with diabetes and their care teams.

---

## Quick Start

| Goal | Documentation |
|------|---------------|
| **Set up development environment** | [Getting Started](./GettingStarted.md) |
| **Understand the system** | [Architecture](./concepts/architecture.md) |
| **Learn diabetes terminology** | [Diabetes Primer](./concepts/diabetes-primer.md) |
| **Understand data types** | [Tidepool Data Model](./concepts/tidepool-data-model.md) |

---

## Domain Documentation

Deep-dives into specific data domains:

### Glucose
- [Overview](./domains/glucose/index.md) - CBG, SMBG, glucose ranges
- [Statistics](./domains/glucose/statistics.md) - Mean, SD, CV, GMI, Time in Range (with formulas)
- [Rendering](./domains/glucose/rendering.md) - Tooltips, colors, screenshots

### Bolus
- [Overview](./domains/bolus/index.md) - Bolus types, interruptions, override/underride
- [Data Model](./domains/bolus/data-model.md) - Wizard, dosingDecision, insulin
- [Calculations](./domains/bolus/calculations.md) - Programmed vs delivered
- [Rendering](./domains/bolus/rendering.md) - Visual variations, screenshots
- [Device Notes](./domains/bolus/device-notes.md) - Manufacturer-specific differences

---

## Component Reference

- [Components](./Components.md) - Visual catalog of rendering components
- [Trends View](./views/Trends.md) - Trends implementation details
- [Common Props](./misc/CommonProps.md) - bgPrefs, timePrefs, and shared props

---

## Development Reference

- [Getting Started](./GettingStarted.md) - Setup, workflows, key concepts
- [Code Style](./CodeStyle.md) - Coding conventions (AirBnB ESLint)
- [Dependencies](./deps/README.md) - D3, React, React Motion guides

---

## Core Utilities

The following source files contain extensive JSDoc documentation:

| Utility | Purpose |
|---------|---------|
| `src/utils/DataUtil.js` | Central data management and crossfilter indexing |
| `src/utils/StatUtil.js` | Statistical calculations (TIR, GMI, etc.) |
| `src/utils/stat.js` | Stat definitions and formatting |
| `src/utils/constants.js` | App-wide constants and thresholds |

---

## Installation

See the root [README](../README.md) for installation and command reference.

```bash
# Install dependencies
yarn install

# Run Storybook
yarn stories

# Run tests
yarn test
```
