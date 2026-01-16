# Diabetes Primer

This glossary defines diabetes-related terms used throughout the `@tidepool/viz` codebase. If you're new to diabetes technology, start here before diving into the domain-specific documentation.

---

## Blood Glucose Monitoring

### Blood Glucose (BG)

The concentration of glucose (sugar) in the bloodstream, measured in either **mg/dL** (milligrams per deciliter, common in the US) or **mmol/L** (millimoles per liter, common internationally). Blood glucose is the primary metric for diabetes management.

**In the code**: See `MGDL_UNITS`, `MMOLL_UNITS` in `src/utils/constants.js`

### CGM (Continuous Glucose Monitor)

A device worn on the body that measures glucose levels continuously (typically every 5 minutes) via a small sensor inserted under the skin. CGM data provides a near-complete picture of glucose trends throughout the day.

**In the code**: CGM data is stored as `cbg` (continuous blood glucose) type. See `CGM_DATA_KEY` in `src/utils/constants.js`

### BGM (Blood Glucose Meter) / SMBG

A fingerstick glucose meter that measures blood glucose from a small blood sample. Also called SMBG (Self-Monitored Blood Glucose). BGM provides discrete readings rather than continuous data.

**In the code**: BGM data is stored as `smbg` type. See `BGM_DATA_KEY` in `src/utils/constants.js`

### Glucose Ranges

Blood glucose values are classified into ranges for analysis:

| Range | mg/dL | mmol/L | Clinical Meaning |
|-------|-------|--------|------------------|
| **Very Low** | < 54 | < 3.0 | Serious hypoglycemia requiring immediate treatment |
| **Low** | 54-69 | 3.0-3.8 | Hypoglycemia (low blood sugar) |
| **Target** | 70-180 | 3.9-10.0 | Desired range for most people with diabetes |
| **High** | 181-250 | 10.1-13.9 | Hyperglycemia (high blood sugar) |
| **Very High** | > 250 | > 13.9 | Significant hyperglycemia |

**In the code**: See `DEFAULT_BG_BOUNDS` in `src/utils/constants.js`

> **Note**: Target ranges can be customized per patient. Pregnancy, age, and other factors may warrant different targets.

---

## Insulin Delivery

### Insulin

A hormone that allows glucose to enter cells for energy. People with Type 1 diabetes produce no insulin; people with Type 2 may not produce enough or may be insulin-resistant. Insulin is delivered via injection or insulin pump.

### Bolus

A dose of insulin delivered to cover a meal (carbohydrates) or to correct high blood glucose. Boluses are discrete events, unlike basal insulin which is continuous.

**Types of boluses**:

- **Normal bolus**: Delivered immediately all at once
- **Extended (square) bolus**: Delivered gradually over a set duration
- **Combo (dual-wave) bolus**: Part delivered immediately, part extended over time

**In the code**: See `domains/bolus/` documentation and `src/utils/bolus.js`

### Basal

A low, continuous rate of insulin delivery that covers the body's baseline insulin needs (independent of food). Basal rates typically vary throughout the day according to a programmed schedule.

**Types of basal delivery**:

- **Scheduled**: Following the programmed basal rate schedule
- **Temp basal**: A temporary adjustment above or below the scheduled rate
- **Suspend**: Basal delivery temporarily stopped (rate = 0)
- **Automated**: Rate automatically adjusted by a closed-loop algorithm

**In the code**: See `domains/basal/` documentation and `src/utils/basal.js`

### Insulin Pump

A device that delivers insulin continuously throughout the day. Pumps store insulin in a reservoir and deliver it through a thin tube (tubing) to a cannula inserted under the skin. Some pumps (like Omnipod) are "tubeless" with the reservoir attached directly to the body.

**Supported pump manufacturers in viz**:
- Tandem (t:slim X2, Control-IQ)
- Medtronic (670G, 770G, 780G)
- Insulet (Omnipod, Omnipod 5)
- Animas (discontinued)
- Tidepool Loop / DIY Loop
- Twiist

**In the code**: See `pumpVocabulary` in `src/utils/constants.js`

### Automated Insulin Delivery (AID) / Closed-Loop

Systems that automatically adjust basal insulin delivery based on CGM readings. Also called "hybrid closed-loop" because users still bolus for meals manually. Examples include Tandem Control-IQ, Medtronic Auto Mode, and Omnipod 5.

**In the code**: Automated delivery is indicated by `subType: 'automated'` on basal data

---

## Bolus Calculator Concepts

When using a pump's bolus calculator (called a "wizard" in Tidepool data), several factors are considered:

### Carbohydrates (Carbs)

The amount of carbohydrate in food, measured in grams (g) or exchanges. Carbohydrates raise blood glucose, so insulin is dosed to "cover" them.

**In the code**: See `domains/carbs/` documentation

### I:C Ratio (Insulin-to-Carb Ratio)

How many grams of carbohydrate are covered by one unit of insulin. For example, an I:C ratio of 10:1 means 1 unit of insulin covers 10 grams of carbs.

**In the code**: Stored as `insulinCarbRatio` on wizard data

### ISF (Insulin Sensitivity Factor)

How much one unit of insulin is expected to lower blood glucose. Also called "correction factor." For example, an ISF of 50 mg/dL means 1 unit drops BG by 50 mg/dL.

**In the code**: Stored as `insulinSensitivity` on wizard data

### IOB (Insulin On Board)

The amount of insulin still active in the body from previous boluses. IOB is subtracted from bolus recommendations to prevent "stacking" insulin.

**In the code**: Stored as `insulinOnBoard` on wizard data

### Target BG

The blood glucose value the bolus calculator aims to achieve when calculating correction doses.

**In the code**: Stored as `bgTarget` on wizard data (varies by manufacturer)

### Override / Underride

When a user delivers more (override) or less (underride) insulin than the bolus calculator recommended.

**In the code**: See `isOverride()`, `isUnderride()` in `src/utils/bolus.js`

---

## Statistics & Metrics

### Time In Range (TIR)

The percentage of time CGM glucose values fall within the target range (typically 70-180 mg/dL). The primary metric for CGM users.

**Targets** (per international consensus):
- Time in Range: > 70%
- Time Below Range: < 4%
- Time Very Low: < 1%

**In the code**: See `StatUtil.getTimeInRangeData()` in `src/utils/StatUtil.js`

### Readings In Range (RIR)

The count of BGM readings in each glucose range. Used for users without CGM.

**In the code**: See `StatUtil.getReadingsInRangeData()` in `src/utils/StatUtil.js`

### GMI (Glucose Management Indicator)

An estimate of HbA1c derived from CGM average glucose. Formerly called "eA1C" (estimated A1C).

**In the code**: See `StatUtil.getGlucoseManagementIndicatorData()` in `src/utils/StatUtil.js`

### CV% (Coefficient of Variation)

A measure of glucose variability: standard deviation divided by mean, expressed as a percentage. A CV < 36% indicates stable glucose control.

**In the code**: See `StatUtil.getCoefficientOfVariationData()` in `src/utils/StatUtil.js`

### TDD (Total Daily Dose)

The total amount of insulin delivered in a day, combining basal and bolus insulin.

**In the code**: See `StatUtil.getTotalInsulinData()` in `src/utils/StatUtil.js`

---

## Device Events

### Site Change

Replacing the insulin pump infusion set (the cannula and tubing that deliver insulin to the body). Different pumps use different terminology:

| Event | Tandem | Medtronic | Omnipod | Animas |
|-------|--------|-----------|---------|--------|
| Reservoir change | Cartridge Change | Rewind | Pod Change | Go Rewind |
| Tubing fill | Tubing Fill | Prime | Pod Activate | Go Prime |
| Cannula fill | Cannula Fill | Cannula Prime | Prime | Cannula Fill |

**In the code**: See `pumpVocabulary` in `src/utils/constants.js`

### Settings Override

A temporary mode that adjusts insulin delivery parameters. Common examples:

- **Sleep/Rest**: Tighter glucose control overnight
- **Exercise/Activity**: Reduced insulin to prevent lows during physical activity
- **Pre-Meal**: More aggressive correction to prepare for eating

**In the code**: See `SLEEP`, `PHYSICAL_ACTIVITY`, `PREPRANDIAL` in `src/utils/constants.js`

### Alarms

Pump alerts that require attention:

| Alarm | Meaning |
|-------|---------|
| No Delivery | Insulin delivery has stopped |
| Auto Off | Pump shut down due to inactivity |
| No Insulin | Reservoir is empty |
| No Power | Battery is depleted |
| Occlusion | Blockage detected in tubing |
| Over Limit | Insulin delivery limit exceeded |

**In the code**: See `ALARM_*` constants in `src/utils/constants.js`

---

## Data & Time Concepts

### deviceTime vs time

Tidepool stores two time values for each datum:

- **deviceTime**: The display time on the device when the event occurred (local time, no timezone)
- **time**: The UTC timestamp after applying Tidepool's [Bootstrapping to UTC](https://developer.tidepool.io/chrome-uploader/docs/BootstrappingToUTC.html) algorithm

**Why this matters**: Device clocks can be wrong (user error, daylight saving confusion). The `time` field represents our best estimate of the true UTC time.

**In the code**: See `reference/time-rendering.md` for detailed explanation

### Sample Interval

For CGM data, the time between consecutive readings. Most CGMs sample every 5 minutes (300,000 ms), resulting in 288 readings per day.

**In the code**: See `CGM_READINGS_ONE_DAY` in `src/utils/constants.js`

---

## Further Reading

- **[Glucose Domain](../domains/glucose/index.md)**: Deep dive into glucose data and statistics
- **[Bolus Domain](../domains/bolus/index.md)**: Complete bolus documentation
- **[Basal Domain](../domains/basal/index.md)**: Basal insulin delivery
- **[Architecture](./architecture.md)**: How data flows through the system
