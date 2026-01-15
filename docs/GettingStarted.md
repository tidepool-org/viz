# Getting Started with @tidepool/viz

This guide helps you set up a development environment for contributing to @tidepool/viz.

## Prerequisites

- **Node.js 20.8.0** (see `.nvmrc`)
- **Yarn 3.x** (configured via `packageManager` in package.json)

We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:

```bash
nvm install
nvm use
```

## Quick Start

```bash
# Clone the repository
git clone https://github.com/tidepool-org/viz.git
cd viz

# Install dependencies
yarn install

# Run Storybook to explore components
yarn stories
```

Storybook will open at http://localhost:8083 with interactive component examples.

## Development Workflows

### Working with Storybook

Storybook is the recommended way to develop and test components in isolation:

```bash
# Main component Storybook (stats, tooltips, settings)
yarn stories

# Diabetes data type Storybook (basal, bolus, CBG renderers)
yarn typestories
```

### Working with blip

To develop viz within [blip](https://github.com/tidepool-org/blip):

```bash
# In viz directory - start watch mode
yarn start

# In blip directory - link local viz
yarn link ../viz
```

Then start blip normally. Changes to viz will be reflected in blip.

### Running Tests

```bash
# Run full test suite (includes linting)
yarn test

# Watch mode for TDD
yarn test-watch

# Run tests in Chrome (recommended before PRs)
yarn browser-tests
```

### Linting

```bash
yarn lint
```

ESLint enforces the [Airbnb style guide](https://github.com/airbnb/javascript) with lodash plugin.

## Project Structure

```
viz/
├── src/
│   ├── components/     # React components
│   │   ├── common/     # Shared components (Stat, Loader, tooltips)
│   │   ├── daily/      # Daily view components
│   │   ├── settings/   # Device settings views
│   │   └── trends/     # Trends view components
│   ├── modules/
│   │   └── print/      # PDF generation (AGP, Basics, Daily reports)
│   ├── utils/          # Core utilities
│   │   ├── DataUtil.js    # Central data management (see JSDoc)
│   │   ├── StatUtil.js    # Statistical calculations (see JSDoc)
│   │   ├── AggregationUtil.js  # Date-based aggregations
│   │   └── ...
│   └── styles/         # Global CSS
├── stories/            # Storybook stories
├── test/               # Test files (mirrors src/ structure)
├── docs/               # Documentation
└── __screenshots__/    # Visual reference images
```

## Core Concepts

### DataUtil

`DataUtil` is the central class for managing diabetes data. It handles:

- **Data ingestion**: Loading and validating Tidepool data
- **Filtering**: Efficient date/type filtering via crossfilter
- **Statistics**: Computing metrics like time-in-range, average glucose
- **Aggregations**: Grouping data by date for calendar views

In production, DataUtil runs in a Web Worker to avoid blocking the UI.

```javascript
// Example: Query data for a date range
const result = dataUtil.query({
  endpoints: [startDate, endDate],
  types: { cbg: {}, bolus: {}, basal: {} },
  stats: ['timeInRange', 'averageGlucose'],
});
```

See the JSDoc in `src/utils/DataUtil.js` for full API documentation.

### StatUtil

`StatUtil` computes diabetes statistics from filtered data:

- Time in Range (CGM)
- Readings in Range (BGM)
- Average glucose, standard deviation, CV%
- Glucose Management Indicator (GMI)
- Insulin delivery metrics
- Sensor usage

See the JSDoc in `src/utils/StatUtil.js` for all available statistics.

### Data Flow

For a detailed architecture overview including data flow diagrams, see [Architecture](./Architecture.md).

## Key Files for New Contributors

| File | Purpose |
|------|---------|
| `src/utils/DataUtil.js` | Core data management - start here |
| `src/utils/StatUtil.js` | Statistical calculations |
| `src/utils/constants.js` | Shared constants (data types, thresholds) |
| `src/components/common/stat/` | Stat display components |
| `stories/` | Component examples and test cases |

## Further Reading

- [Architecture](./Architecture.md) - Design decisions and rationale
- [Components](./Components.md) - Visual component catalog
- [Code Style](./CodeStyle.md) - Coding conventions

---

## Documentation

The documentation site is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and auto-deployed to GitHub Pages via GitHub Actions when changes are pushed to the `develop` branch.

### Local Preview

To preview documentation changes locally:

```bash
# Install MkDocs and plugins (one-time)
pip install mkdocs-material mkdocs-glightbox

# Start local server
mkdocs serve
```

Visit http://localhost:8000 to preview docs with live reload.
