# Bolus Rendering

This document covers the visual representation of bolus data, including shapes, colors, tooltips, and screenshots.

---

## Visual Components

Boluses are rendered as vertical bars with various indicators:

```
         ▲ Override triangle (pointing up)
         │
    ─────┼───── Recommended line (when wizard present)
         │
    ┌────┴────┐
    │█████████│ Delivered bar (solid fill)
    │█████████│
    │░░░░░░░░░│ Undelivered portion (hatched, if interrupted)
    └─────────┘
         │
         ▼ Underride triangle (pointing down)
```

### Bar Colors

| Type | Color | Variable |
|------|-------|----------|
| Normal bolus | Purple | `--bolus` |
| Extended bolus | Lighter purple | `--extendedBolus` |
| Automated bolus | Automated blue | `--automated` |
| Undelivered | Striped/hatched | Pattern fill |

---

## Normal Bolus Variations

### Simple Normal Bolus

Just a solid bar representing delivered units.

![Normal bolus](./screenshots/normal%20bolus.png)

### Interrupted Normal Bolus

Shows delivered (solid) and undelivered (hatched) portions.

![Interrupted bolus](./screenshots/interrupted%20bolus.png)

### Override on Normal Bolus

Triangle pointing UP at recommended line.

![Override normal](./screenshots/override%20on%20a%20normal%20bolus.png)

### Underride on Normal Bolus

Triangle pointing DOWN at recommended line.

![Underride normal](./screenshots/underride%20on%20a%20normal%20bolus.png)

### Zero Override

Delivered > 0 when recommended = 0.

![Zero override](./screenshots/zero%20override%20on%20a%20normal%20bolus.png)

### Override + Interrupted

Both override indicator and hatched undelivered portion.

![Override and interrupt](./screenshots/override%20and%20interrupt%20on%20a%20normal%20bolus.png)

### Underride + Interrupted

Both underride indicator and hatched undelivered portion.

![Underride and interrupt](./screenshots/underride%20and%20interrupt%20a%20normal%20bolus.png)

---

## Extended (Square) Bolus Variations

Extended boluses show duration with a horizontal bar.

### Simple Extended Bolus

![Extended bolus](./screenshots/extended%20%28square%29%20bolus.png)

### Interrupted Extended Bolus

![Interrupted extended](./screenshots/interrupted%20extended%20%28square%29%20bolus.png)

### Override on Extended

![Override extended](./screenshots/override%20on%20an%20extended%20%28square%29%20bolus.png)

### Underride on Extended

![Underride extended](./screenshots/underride%20on%20an%20extended%20%28square%29%20bolus.png)

---

## Combo (Dual Wave) Bolus Variations

Combo boluses combine immediate and extended portions.

### Simple Combo Bolus

![Combo bolus](./screenshots/combo%20bolus.png)

### Interrupted During Normal Portion

![Interrupted combo normal](./screenshots/interrupted%20combo%20bolus%20%28during%20the%20immediately%20delievered%20portion%29.png)

### Interrupted During Extended Portion

![Interrupted combo extended](./screenshots/interrupted%20combo%20bolus%20%28during%20the%20extended%20delivery%20portion%29.png)

### Override on Combo

![Override combo](./screenshots/override%20on%20a%20combo%20bolus.png)

### Override + Interrupted Combo

![Override interrupted combo](./screenshots/override%20on%20a%20combo%20bolus%20interrupted%20during%20extended%20delivery.png)

### Underride on Combo

![Underride combo](./screenshots/underride%20on%20a%20combo%20bolus.png)

---

## Bolus Tooltips

Tooltips show detailed bolus information on hover.

### Component

**File**: `src/components/daily/bolustooltip/BolusTooltip.js`

### Normal Bolus Tooltip

![Normal tooltip](./screenshots/normal.png)

### With Carb Input

![With carbs](./screenshots/withCarbInput.png)

### With BG Input

![With BG](./screenshots/withBGInput.png)

### With BG and Carb Input

![With BG and carbs](./screenshots/withBGAndCarbInput.png)

### Override Tooltip

Shows recommended vs delivered.

![Override tooltip](./screenshots/override.png)

### Underride Tooltip

![Underride tooltip](./screenshots/underride.png)

### Cancelled Bolus Tooltip

![Cancelled tooltip](./screenshots/cancelled.png)

### Automated Bolus Tooltip

![Automated tooltip](./screenshots/automated.png)

### Extended Bolus Tooltip

![Extended tooltip](./screenshots/extended.png)

### Combo Bolus Tooltip

![Combo tooltip](./screenshots/combo.png)

---

## Pump-Specific Target Display

Different pumps display BG targets differently in tooltips.

### Medtronic Target

Shows low-high range.

![Medtronic target](./screenshots/withMedtronicTarget.png)

### Tandem Target

Shows single target value.

![Tandem target](./screenshots/withTandemTarget.png)

### Insulet (OmniPod) Target

Shows target with "correct above" threshold.

![Insulet target](./screenshots/withInsuletTarget.png)

### Animas Target

Shows target ± range.

![Animas target](./screenshots/withAnimasTarget.png)

### Loop Auto Target

Shows low-high range for automated systems.

![Auto target](./screenshots/withAutoTarget.png)

---

## Manual Insulin (Pen) Tooltips

### Standard Insulin

![Insulin](./screenshots/insulin.png)

### By Acting Type

| Type | Screenshot |
|------|------------|
| Rapid | ![Rapid](./screenshots/insulinRapid.png) |
| Short | ![Short](./screenshots/insulinShort.png) |
| Intermediate | ![Intermediate](./screenshots/insulinIntermediate.png) |
| Long | ![Long](./screenshots/insulinLong.png) |

---

## Loop Dosing Decision

Shows Loop algorithm recommendation.

![Loop dosing decision](./screenshots/withLoopDosingDecision.png)

---

## Carb Exchange Display

Some pumps use carb exchanges instead of grams.

### With Exchange Input

![Exchange input](./screenshots/withCarbExchangeInput.png)

### Zero Exchange

![Zero exchange](./screenshots/withCarbExchangeInputZero.png)

---

## Precision Display

Bolus values display varying precision.

### Standard Precision

![Normal](./screenshots/normal.png)

### High Precision

![Precise](./screenshots/normalPrecise.png)

### Very High Precision

![Very precise](./screenshots/normalVeryPrecise.png)

---

## Key Source Files

| Purpose | File |
|---------|------|
| Bolus rendering | `src/components/daily/` |
| Bolus tooltip | `src/components/daily/bolustooltip/BolusTooltip.js` |
| Bolus fixtures | `data/bolus/fixtures.js` |
| Stories | `stories/components/daily/` |

---

## See Also

- [Bolus Overview](./index.md)
- [Bolus Calculations](./calculations.md)
- [Device-Specific Notes](./device-notes.md)
