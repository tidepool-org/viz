# Dependencies

Key dependencies used in this repository for data visualization:

- [D3](https://d3js.org/) - scales, axes, and data transformations
- [React](https://react.dev/) - UI components
- [react-motion](https://github.com/chenglou/react-motion) - animations

---

## D3 Usage

[D3](https://d3js.org/) is a JavaScript library for building interactive data visualizations. The name stands for **D**ata-**D**riven **D**ocuments.

### Strategy: React Inline SVG

Our preferred strategy is rendering inline SVG directly in React components. We use D3's *utilities* for building scales, crunching data, and generating SVG path data, but we don't use D3's rendering or animation functionality.

**Advantages:**
- Less cognitive dissonance for React developers
- Clearer best practices (that we already know from React)
- Much easier and simpler testing capabilities

**Trade-off:**
React provides no replacement for D3's animation functionality. We use [react-motion](#react-motion-usage) and CSS3 animations instead.

### D3 Modules Used

We only include the individual D3 modules we actually use:

| Module | Purpose |
|--------|---------|
| `d3-array` | Data-munging (mean, median, quartiles, quantiles) |
| `d3-format` | Formatting numerical values |
| `d3-scale` | Linear scales |
| `d3-shape` | Generating path data for lines, areas |
| `d3-time` | UTC date/time manipulation |
| `d3-time-format` | Formatting browser-local datetimes |

### Example: Creating a Scale

```javascript
import { scaleLinear } from 'd3-scale';

const bgScale = scaleLinear()
  .domain([0, 400])           // data range (mg/dL)
  .range([chartHeight, 0])    // pixel range (inverted for SVG)
  .clamp(true);               // clamp values above 400
```

---

## React Usage

For React best practices, see [Code Style](./code-style.md).

Key patterns:
- **Container components** - handle data and logic
- **Pure components** - handle rendering
- Functional components with hooks for new code

---

## React Motion Usage

[React Motion](https://github.com/chenglou/react-motion) provides physics-based animations for React components.

### Why React Motion?

- Its `TransitionMotion` API suits most of our use cases
- Popular project with a large community
- Follows React coding practices closely

### Exports Used

| Export | Purpose |
|--------|---------|
| `spring` | Interpolation between start/end states |
| `TransitionMotion` | Animate entering/exiting components |

We primarily use `spring` and `TransitionMotion`. We don't use `Motion` (no unmount animation) or `StaggeredMotion` (restricted use cases).

### Example: Animated Circle

```javascript
import { TransitionMotion, spring } from 'react-motion';

const AnimatedCircle = ({ data, scale }) => (
  <TransitionMotion
    willEnter={() => ({ r: 0 })}
    willLeave={() => ({ r: spring(0) })}
    styles={data.map(d => ({
      key: d.id,
      style: { r: spring(scale(d.value)) },
      data: d,
    }))}
  >
    {interpolated => (
      <g>
        {interpolated.map(({ key, style, data }) => (
          <circle key={key} cx={data.x} cy={data.y} r={style.r} />
        ))}
      </g>
    )}
  </TransitionMotion>
);
```

---

## Other Dependencies

### PDF Generation

- **PDFKit** - Core PDF generation
- **voilab-pdf-table** - Table rendering
- **svg-to-pdfkit** - SVG embedding

### Date/Time

- **Moment.js** - Timezone-relative datetime manipulation (D3 only supports UTC/browser-local)
- **moment-timezone** - Arbitrary timezone support

### Utilities

- **Lodash** - General utilities (prefer lodash methods over native Array methods per code style)

---

## See Also

- [Code Style](./code-style.md) - Coding conventions
- [Architecture](../concepts/architecture.md) - System overview
