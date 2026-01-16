# Component Reference

Visual catalog of the rendering components provided by @tidepool/viz. Screenshots are generated from Storybook and represent the various states each component can render.

---

## Data Renderers

SVG components for rendering diabetes device data on timelines (Daily view, PDF reports).

**Source**: `src/components/common/data/`

### Basal

Renders basal insulin rate sequences showing scheduled, temp, and automated delivery patterns.

| Scheduled Basals | Automated Basals |
|------------------|------------------|
| ![scheduled basals](../domains/insulin/basal/screenshots/scheduled%20basals.png) | ![automated basals](../domains/insulin/basal/screenshots/automated%20basals.png) |

| Scheduled Flat Rate | Automated with Suspend |
|---------------------|------------------------|
| ![scheduled flat rate basal](../domains/insulin/basal/screenshots/scheduled%20flat%20rate%20basal.png) | ![automated basals with suspend](../domains/insulin/basal/screenshots/automated%20basals%20with%20suspend.png) |

| Automated and Scheduled | Flat Rate with Discontinuities |
|-------------------------|-------------------------------|
| ![automated and scheduled basals](../domains/insulin/basal/screenshots/automated%20and%20scheduled%20basals.png) | ![scheduled flat rate basal with two discontinuities](../domains/insulin/basal/screenshots/scheduled%20flat%20rate%20basal%20with%20two%20discontinuities.png) |

#### Temp Basals

| Simple Positive Temp | Simple Negative Temp |
|----------------------|----------------------|
| ![simple positive temp basal](../domains/insulin/basal/screenshots/simple%20positive%20temp%20basal.png) | ![simple negative temp basal](../domains/insulin/basal/screenshots/simple%20negative%20temp%20basal.png) |

| Positive Across Boundary | Negative Across Boundary |
|--------------------------|--------------------------|
| ![positive temp basal across schedule boundary](../domains/insulin/basal/screenshots/positive%20temp%20basal%20across%20schedule%20boundary.png) | ![negative temp basal across schedule boundary](../domains/insulin/basal/screenshots/negative%20temp%20basal%20across%20schedule%20boundary.png) |

#### Suspend Basals

| Simple Suspend | Suspend Across Boundary |
|----------------|-------------------------|
| ![simple suspend basal](../domains/insulin/basal/screenshots/simple%20suspend%20basal.png) | ![suspend basal across schedule boundary](../domains/insulin/basal/screenshots/suspend%20basal%20across%20schedule%20boundary.png) |

---

### Bolus

Renders insulin bolus events with optional carb circles. Supports normal, extended (square), and combo boluses with various override/underride and interruption states.

#### Basic Bolus Types

| Normal | Extended (Square) | Combo |
|--------|-------------------|-------|
| ![normal bolus](../domains/insulin/bolus/screenshots/normal%20bolus.png) | ![extended bolus](../domains/insulin/bolus/screenshots/extended%20(square)%20bolus.png) | ![combo bolus](../domains/insulin/bolus/screenshots/combo%20bolus.png) |

#### Interrupted Boluses

| Interrupted Normal | Interrupted Extended | Interrupted Combo (Extended) |
|--------------------|----------------------|------------------------------|
| ![interrupted bolus](../domains/insulin/bolus/screenshots/interrupted%20bolus.png) | ![interrupted extended bolus](../domains/insulin/bolus/screenshots/interrupted%20extended%20(square)%20bolus.png) | ![interrupted combo extended](../domains/insulin/bolus/screenshots/interrupted%20combo%20bolus%20(during%20the%20extended%20delivery%20portion).png) |

| Interrupted Combo (Immediate) |
|-------------------------------|
| ![interrupted combo immediate](../domains/insulin/bolus/screenshots/interrupted%20combo%20bolus%20(during%20the%20immediately%20delievered%20portion).png) |

#### Overrides (Delivered More Than Recommended)

| Normal Override | Extended Override | Combo Override |
|-----------------|-------------------|----------------|
| ![override normal](../domains/insulin/bolus/screenshots/override%20on%20a%20normal%20bolus.png) | ![override extended](../domains/insulin/bolus/screenshots/override%20on%20an%20extended%20(square)%20bolus.png) | ![override combo](../domains/insulin/bolus/screenshots/override%20on%20a%20combo%20bolus.png) |

| Zero Override | Override + Interrupt |
|---------------|----------------------|
| ![zero override](../domains/insulin/bolus/screenshots/zero%20override%20on%20a%20normal%20bolus.png) | ![override interrupt](../domains/insulin/bolus/screenshots/override%20and%20interrupt%20on%20a%20normal%20bolus.png) |

| Combo Override Interrupted |
|----------------------------|
| ![combo override interrupted](../domains/insulin/bolus/screenshots/override%20on%20a%20combo%20bolus%20interrupted%20during%20extended%20delivery.png) |

#### Underrides (Delivered Less Than Recommended)

| Normal Underride | Extended Underride | Combo Underride |
|------------------|--------------------| ----------------|
| ![underride normal](../domains/insulin/bolus/screenshots/underride%20on%20a%20normal%20bolus.png) | ![underride extended](../domains/insulin/bolus/screenshots/underride%20on%20an%20extended%20(square)%20bolus.png) | ![underride combo](../domains/insulin/bolus/screenshots/underride%20on%20a%20combo%20bolus.png) |

| Underride + Interrupt | Extended Underride Interrupted | Zero Underride (Not Rendered) |
|-----------------------|--------------------------------|-------------------------------|
| ![underride interrupt](../domains/insulin/bolus/screenshots/underride%20and%20interrupt%20a%20normal%20bolus.png) | ![extended underride interrupted](../domains/insulin/bolus/screenshots/interrupted%20underride%20on%20an%20extended%20bolus.png) | ![zero underride](../domains/insulin/bolus/screenshots/not%20rendered%20zero%20underride%20on%20a%20normal%20bolus.png) |

---

### Suspend

Renders pump suspend periods on the basal timeline.

| Single Automated Suspend | Multiple Automated Suspends |
|--------------------------|----------------------------|
| ![single suspend](../domains/insulin/basal/screenshots/single%20automated%20suspend.png) | ![multiple suspends](../domains/insulin/basal/screenshots/multiple%20automated%20suspends.png) |

---

## Statistics

Flexible components for displaying calculated diabetes statistics.

**Source**: `src/components/common/stat/`

### Stat

The primary statistic display component with bar charts, legends, hover states, and collapsible details.

#### Glucose Statistics

| Time In Range | Readings In Range |
|---------------|-------------------|
| ![Time In Range](../domains/glucose/screenshots/Time%20In%20Range.png) | ![Readings In Range](../domains/glucose/screenshots/Readings%20In%20Range.png) |

| Average Glucose | Standard Deviation |
|-----------------|-------------------|
| ![Average Glucose](../domains/glucose/screenshots/Average%20Glucose.png) | ![Standard Deviation](../domains/glucose/screenshots/Standard%20Deviation.png) |

| Coefficient of Variation | Glucose Management Indicator |
|--------------------------|------------------------------|
| ![CV](../domains/glucose/screenshots/Coefficient%20of%20Variation.png) | ![GMI](../domains/glucose/screenshots/Glucose%20Management%20Indicator.png) |

#### Insulin & Device Statistics

| Avg. Daily Insulin | Total Insulin |
|--------------------|---------------|
| ![Avg Daily Insulin](../domains/insulin/screenshots/Avg.%20Daily%20Insulin.png) | ![Total Insulin](../domains/insulin/screenshots/Total%20Insulin.png) |

| Time In Auto | Time In Override |
|--------------|------------------|
| ![Time In Auto](../domains/glucose/screenshots/Time%20In%20Auto.png) | ![Time In Override](../domains/glucose/screenshots/Time%20In%20Override.png) |

| Avg. Daily Carbs | Sensor Usage |
|------------------|--------------|
| ![Avg Daily Carbs](../domains/glucose/screenshots/Avg.%20Daily%20Carbs.png) | ![Sensor Usage](../domains/glucose/screenshots/Sensor%20Usage.png) |

---

## Tooltips

Interactive tooltips displayed on hover in the Daily view and other contexts.

### Bolus Tooltip

**Source**: `src/components/daily/bolustooltip/BolusTooltip.js`

#### Basic Types

| Normal | Extended | Combo |
|--------|----------|-------|
| ![normal](../domains/insulin/bolus/screenshots/normal.png) | ![extended](../domains/insulin/bolus/screenshots/extended.png) | ![combo](../domains/insulin/bolus/screenshots/combo.png) |

| Automated | Override | Underride |
|-----------|----------|-----------|
| ![automated](../domains/insulin/bolus/screenshots/automated.png) | ![override](../domains/insulin/bolus/screenshots/override.png) | ![underride](../domains/insulin/bolus/screenshots/underride.png) |

#### Cancelled/Interrupted

| Cancelled | Cancelled Extended | Cancelled in Combo (Normal) |
|-----------|--------------------|-----------------------------|
| ![cancelled](../domains/insulin/bolus/screenshots/cancelled.png) | ![cancelled extended](../domains/insulin/bolus/screenshots/cancelledExtended.png) | ![cancelled combo normal](../domains/insulin/bolus/screenshots/cancelledInNormalCombo.png) |

| Cancelled in Combo (Extended) | Immediately Cancelled | Immediately Cancelled Extended |
|-------------------------------|----------------------|--------------------------------|
| ![cancelled combo extended](../domains/insulin/bolus/screenshots/cancelledInExtendedCombo.png) | ![immediately cancelled](../domains/insulin/bolus/screenshots/immediatelyCancelled.png) | ![immediately cancelled extended](../domains/insulin/bolus/screenshots/immediatelyCancelledExtended.png) |

#### With Wizard Data

| With BG Input | With Carb Input | With BG and Carb Input |
|---------------|-----------------|------------------------|
| ![with BG](../domains/insulin/bolus/screenshots/withBGInput.png) | ![with carb](../domains/insulin/bolus/screenshots/withCarbInput.png) | ![with BG and carb](../domains/insulin/bolus/screenshots/withBGAndCarbInput.png) |

| With BG Input and IOB | With Net Recommendation | With Carb Exchange |
|-----------------------|-------------------------|-------------------|
| ![with BG and IOB](../domains/insulin/bolus/screenshots/withBGInputAndIOB.png) | ![with net rec](../domains/insulin/bolus/screenshots/withNetRec.png) | ![carb exchange](../domains/insulin/bolus/screenshots/withCarbExchangeInput.png) |

#### Manufacturer-Specific Targets

| Tandem Target | Medtronic Target | Insulet Target |
|---------------|------------------|----------------|
| ![tandem](../domains/insulin/bolus/screenshots/withTandemTarget.png) | ![medtronic](../domains/insulin/bolus/screenshots/withMedtronicTarget.png) | ![insulet](../domains/insulin/bolus/screenshots/withInsuletTarget.png) |

| Animas Target | Auto Target | Loop Dosing Decision |
|---------------|-------------|----------------------|
| ![animas](../domains/insulin/bolus/screenshots/withAnimasTarget.png) | ![auto](../domains/insulin/bolus/screenshots/withAutoTarget.png) | ![loop](../domains/insulin/bolus/screenshots/withLoopDosingDecision.png) |

#### Extended/Animas Specific

| Extended Animas | Extended Animas Underride | Combo Override |
|-----------------|---------------------------|----------------|
| ![animas extended](../domains/insulin/bolus/screenshots/extendedAnimas.png) | ![animas underride](../domains/insulin/bolus/screenshots/extendedAnimasUnderride.png) | ![combo override](../domains/insulin/bolus/screenshots/comboOverride.png) |

| Combo Underride Cancelled | Combo Underride Cancelled with BG |
|---------------------------|-----------------------------------|
| ![combo underride cancelled](../domains/insulin/bolus/screenshots/comboUnderrideCancelled.png) | ![combo underride cancelled BG](../domains/insulin/bolus/screenshots/comboUnderrideCancelledWithBG.png) |

#### Precision Variants

| Normal Precise | Normal Very Precise |
|----------------|---------------------|
| ![precise](../domains/insulin/bolus/screenshots/normalPrecise.png) | ![very precise](../domains/insulin/bolus/screenshots/normalVeryPrecise.png) |

#### Pen/Injection Insulin Types

| Insulin (Pen) | Rapid | Short |
|---------------|-------|-------|
| ![insulin](../domains/insulin/bolus/screenshots/insulin.png) | ![rapid](../domains/insulin/bolus/screenshots/insulinRapid.png) | ![short](../domains/insulin/bolus/screenshots/insulinShort.png) |

| Intermediate | Long |
|--------------|------|
| ![intermediate](../domains/insulin/bolus/screenshots/insulinIntermediate.png) | ![long](../domains/insulin/bolus/screenshots/insulinLong.png) |

---

### CBG Tooltip (Continuous Glucose)

**Source**: `src/components/daily/cbgtooltip/CBGTooltip.js`

| Very Low | Low | Target |
|----------|-----|--------|
| ![very low](../domains/glucose/cbg/screenshots/veryLow.png) | ![low](../domains/glucose/cbg/screenshots/low.png) | ![target](../domains/glucose/cbg/screenshots/target.png) |

| High | Very High |
|------|-----------|
| ![high](../domains/glucose/cbg/screenshots/high.png) | ![very high](../domains/glucose/cbg/screenshots/veryHigh.png) |

---

### SMBG Tooltip (Fingerstick)

**Source**: `src/components/daily/smbgtooltip/SMBGTooltip.js`

#### Basic Readings

| Very Low | Low | Target |
|----------|-----|--------|
| ![very low](../domains/glucose/smbg/screenshots/veryLow.png) | ![low](../domains/glucose/smbg/screenshots/low.png) | ![target](../domains/glucose/smbg/screenshots/target.png) |

| High | Very High |
|------|-----------|
| ![high](../domains/glucose/smbg/screenshots/high.png) | ![very high](../domains/glucose/smbg/screenshots/veryHigh.png) |

#### Entry Types

| Manual | Linked (to meter) |
|--------|-------------------|
| ![manual](../domains/glucose/smbg/screenshots/manual.png) | ![linked](../domains/glucose/smbg/screenshots/linked.png) |

#### Medtronic 600-Series Specific

| Accepted | Accepted Manual | Calibration Manual |
|----------|-----------------|-------------------|
| ![accepted](../domains/glucose/smbg/screenshots/medT600accepted.png) | ![accepted manual](../domains/glucose/smbg/screenshots/medT600acceptedManual.png) | ![calib manual](../domains/glucose/smbg/screenshots/medT600calibManual.png) |

| Non-Calibration Manual | Accepted Non-Calib Manual | Rejected |
|------------------------|---------------------------|----------|
| ![noncalib manual](../domains/glucose/smbg/screenshots/medT600noncalibManual.png) | ![accepted noncalib](../domains/glucose/smbg/screenshots/medT600acceptedNoncalibManual.png) | ![rejected](../domains/glucose/smbg/screenshots/medT600rejected.png) |

| Rejected Linked | Timed Out | Timeout Manual |
|-----------------|-----------|----------------|
| ![rejected linked](../domains/glucose/smbg/screenshots/medT600rejectedLinked.png) | ![timed out](../domains/glucose/smbg/screenshots/medT600timedout.png) | ![timeout manual](../domains/glucose/smbg/screenshots/medT600timeoutManual.png) |

---

### Alarm Tooltip

**Source**: `src/components/daily/alarmtooltip/AlarmTooltip.js`

| Auto Off | No Delivery | No Insulin |
|----------|-------------|------------|
| ![auto off](../domains/device-events/screenshots/auto_off.png) | ![no delivery](../domains/device-events/screenshots/no_delivery.png) | ![no insulin](../domains/device-events/screenshots/no_insulin.png) |

| No Power | Occlusion | Over Limit |
|----------|-----------|------------|
| ![no power](../domains/device-events/screenshots/no_power.png) | ![occlusion](../domains/device-events/screenshots/occlusion.png) | ![over limit](../domains/device-events/screenshots/over_limit.png) |

---

### Event Tooltip

**Source**: `src/components/daily/eventtooltip/EventTooltip.js`

| Notes | Pump Shutdown |
|-------|---------------|
| ![notes](../domains/device-events/screenshots/Notes.png) | ![pump shutdown](../domains/device-events/screenshots/Pump%20Shutdown.png) |

#### Health Events

| Stress | Other (with Notes) |
|--------|-------------------|
| ![stress](../domains/device-events/screenshots/Health%20(stress).png) | ![other with notes](../domains/device-events/screenshots/Health%20(other%20with%20notes).png) |

#### Physical Activity

| Low | Medium | High |
|-----|--------|------|
| ![low](../domains/device-events/screenshots/Physical%20Activity%20(low).png) | ![medium](../domains/device-events/screenshots/Physical%20Activity%20(medium).png) | ![high](../domains/device-events/screenshots/Physical%20Activity%20(high).png) |

---

### Food Tooltip

**Source**: `src/components/daily/foodtooltip/FoodTooltip.js`

| Standard | Dexcom | Loop |
|----------|--------|------|
| ![standard](../domains/carbs/screenshots/Standard.png) | ![dexcom](../domains/carbs/screenshots/Dexcom.png) | ![loop](../domains/carbs/screenshots/Loop.png) |

| Loop Edited | Loop Time of Entry |
|-------------|-------------------|
| ![loop edited](../domains/carbs/screenshots/Loop%20edited.png) | ![loop time of entry](../domains/carbs/screenshots/Loop%20time%20of%20entry.png) |

---

### Pump Settings Override Tooltip

**Source**: `src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip.js`

| Sleep | Exercise | Pre-Meal |
|-------|----------|----------|
| ![sleep](../domains/device-events/screenshots/Sleep.png) | ![exercise](../domains/device-events/screenshots/Exercise.png) | ![pre-meal](../domains/device-events/screenshots/Pre-Meal.png) |

---

### Stat Tooltip

**Source**: `src/components/common/tooltips/StatTooltip.js`

Displays annotations and additional context for statistics.

| Short Annotation | Long Annotation |
|------------------|-----------------|
| ![short](../domains/glucose/screenshots/short%20annotation.png) | ![long](../domains/glucose/screenshots/long%20annotation.png) |

| Multiple Annotations | Markdown Annotation |
|----------------------|---------------------|
| ![multiple](../domains/glucose/screenshots/multiple%20annotations.png) | ![markdown](../domains/glucose/screenshots/markdown%20annotation.png) |

---

### Other Tooltips

#### CGM Sample Interval Tooltip

**Source**: `src/components/common/tooltips/CgmSampleIntervalTooltip.js`

![default](../domains/glucose/cbg/screenshots/default%20tootlip.png)

#### Events Info Tooltip

**Source**: `src/components/common/tooltips/EventsInfoTooltip.js`

![default](../views/screenshots/default%20tooltip.png)

---

## Device Settings

Tabular display of insulin pump settings by manufacturer.

**Source**: `src/components/settings/`

### Tandem

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](../views/screenshots/Device%20Settings%20%5BTandem%5D/flat%20rate.png) | ![multi](../views/screenshots/Device%20Settings%20%5BTandem%5D/multi%20rate.png) |

### Medtronic

| Flat Rate | Multi Rate | Automated |
|-----------|------------|-----------|
| ![flat](../views/screenshots/Device%20Settings%20%5BMedtronic%5D/flat%20rate.png) | ![multi](../views/screenshots/Device%20Settings%20%5BMedtronic%5D/multi%20rate.png) | ![automated](../views/screenshots/Device%20Settings%20%5BMedtronic%5D/automated.png) |

### OmniPod

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](../views/screenshots/Device%20Settings%20%5BOmniPod%5D/flat%20rate.png) | ![multi](../views/screenshots/Device%20Settings%20%5BOmniPod%5D/multi%20rate.png) |

### Loop

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](../views/screenshots/Device%20Settings%20%5BLoop%5D/flat%20rate.png) | ![multi](../views/screenshots/Device%20Settings%20%5BLoop%5D/multi%20rate.png) |

### Animas

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](../views/screenshots/Device%20Settings%20%5BAnimas%5D/flat%20rate.png) | ![multi](../views/screenshots/Device%20Settings%20%5BAnimas%5D/multi%20rate.png) |

---

## PDF Reports

PrintView classes for generating PDF reports. These are **not** React components - they use pdfkit directly and run in a Web Worker.

**Source**: `src/modules/print/`

### Combined Views

| AGP (CGM) | AGP (BGM) |
|-----------|-----------|
| ![agp cgm](../views/screenshots/agpCGM.jpg) | ![agp bgm](../views/screenshots/agpBGM.jpg) |

| Basics | Daily |
|--------|-------|
| ![basics](../views/screenshots/basics.jpg) | ![daily](../views/screenshots/daily.jpg) |

| BG Log | Settings |
|--------|----------|
| ![bg log](../views/screenshots/bgLog.jpg) | ![settings](../views/screenshots/settings.jpg) |

### Prescription

![prescription](../views/screenshots/prescription.jpg)
