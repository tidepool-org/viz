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
| ![scheduled basals](screenshots/Basal/scheduled%20basals.png) | ![automated basals](screenshots/Basal/automated%20basals.png) |

| Scheduled Flat Rate | Automated with Suspend |
|---------------------|------------------------|
| ![scheduled flat rate basal](screenshots/Basal/scheduled%20flat%20rate%20basal.png) | ![automated basals with suspend](screenshots/Basal/automated%20basals%20with%20suspend.png) |

| Automated and Scheduled | Flat Rate with Discontinuities |
|-------------------------|-------------------------------|
| ![automated and scheduled basals](screenshots/Basal/automated%20and%20scheduled%20basals.png) | ![scheduled flat rate basal with two discontinuities](screenshots/Basal/scheduled%20flat%20rate%20basal%20with%20two%20discontinuities.png) |

#### Temp Basals

| Simple Positive Temp | Simple Negative Temp |
|----------------------|----------------------|
| ![simple positive temp basal](screenshots/Basal/simple%20positive%20temp%20basal.png) | ![simple negative temp basal](screenshots/Basal/simple%20negative%20temp%20basal.png) |

| Positive Across Boundary | Negative Across Boundary |
|--------------------------|--------------------------|
| ![positive temp basal across schedule boundary](screenshots/Basal/positive%20temp%20basal%20across%20schedule%20boundary.png) | ![negative temp basal across schedule boundary](screenshots/Basal/negative%20temp%20basal%20across%20schedule%20boundary.png) |

#### Suspend Basals

| Simple Suspend | Suspend Across Boundary |
|----------------|-------------------------|
| ![simple suspend basal](screenshots/Basal/simple%20suspend%20basal.png) | ![suspend basal across schedule boundary](screenshots/Basal/suspend%20basal%20across%20schedule%20boundary.png) |

---

### Bolus

Renders insulin bolus events with optional carb circles. Supports normal, extended (square), and combo boluses with various override/underride and interruption states.

#### Basic Bolus Types

| Normal | Extended (Square) | Combo |
|--------|-------------------|-------|
| ![normal bolus](screenshots/Bolus/normal%20bolus.png) | ![extended bolus](screenshots/Bolus/extended%20(square)%20bolus.png) | ![combo bolus](screenshots/Bolus/combo%20bolus.png) |

#### Interrupted Boluses

| Interrupted Normal | Interrupted Extended | Interrupted Combo (Extended) |
|--------------------|----------------------|------------------------------|
| ![interrupted bolus](screenshots/Bolus/interrupted%20bolus.png) | ![interrupted extended bolus](screenshots/Bolus/interrupted%20extended%20(square)%20bolus.png) | ![interrupted combo extended](screenshots/Bolus/interrupted%20combo%20bolus%20(during%20the%20extended%20delivery%20portion).png) |

| Interrupted Combo (Immediate) |
|-------------------------------|
| ![interrupted combo immediate](screenshots/Bolus/interrupted%20combo%20bolus%20(during%20the%20immediately%20delievered%20portion).png) |

#### Overrides (Delivered More Than Recommended)

| Normal Override | Extended Override | Combo Override |
|-----------------|-------------------|----------------|
| ![override normal](screenshots/Bolus/override%20on%20a%20normal%20bolus.png) | ![override extended](screenshots/Bolus/override%20on%20an%20extended%20(square)%20bolus.png) | ![override combo](screenshots/Bolus/override%20on%20a%20combo%20bolus.png) |

| Zero Override | Override + Interrupt |
|---------------|----------------------|
| ![zero override](screenshots/Bolus/zero%20override%20on%20a%20normal%20bolus.png) | ![override interrupt](screenshots/Bolus/override%20and%20interrupt%20on%20a%20normal%20bolus.png) |

| Combo Override Interrupted |
|----------------------------|
| ![combo override interrupted](screenshots/Bolus/override%20on%20a%20combo%20bolus%20interrupted%20during%20extended%20delivery.png) |

#### Underrides (Delivered Less Than Recommended)

| Normal Underride | Extended Underride | Combo Underride |
|------------------|--------------------| ----------------|
| ![underride normal](screenshots/Bolus/underride%20on%20a%20normal%20bolus.png) | ![underride extended](screenshots/Bolus/underride%20on%20an%20extended%20(square)%20bolus.png) | ![underride combo](screenshots/Bolus/underride%20on%20a%20combo%20bolus.png) |

| Underride + Interrupt | Extended Underride Interrupted | Zero Underride (Not Rendered) |
|-----------------------|--------------------------------|-------------------------------|
| ![underride interrupt](screenshots/Bolus/underride%20and%20interrupt%20a%20normal%20bolus.png) | ![extended underride interrupted](screenshots/Bolus/interrupted%20underride%20on%20an%20extended%20bolus.png) | ![zero underride](screenshots/Bolus/not%20rendered%20zero%20underride%20on%20a%20normal%20bolus.png) |

---

### Suspend

Renders pump suspend periods on the basal timeline.

| Single Automated Suspend | Multiple Automated Suspends |
|--------------------------|----------------------------|
| ![single suspend](screenshots/Suspend/single%20automated%20suspend.png) | ![multiple suspends](screenshots/Suspend/multiple%20automated%20suspends.png) |

---

## Statistics

Flexible components for displaying calculated diabetes statistics.

**Source**: `src/components/common/stat/`

### Stat

The primary statistic display component with bar charts, legends, hover states, and collapsible details.

#### Glucose Statistics

| Time In Range | Readings In Range |
|---------------|-------------------|
| ![Time In Range](screenshots/Stat/Time%20In%20Range.png) | ![Readings In Range](screenshots/Stat/Readings%20In%20Range.png) |

| Average Glucose | Standard Deviation |
|-----------------|-------------------|
| ![Average Glucose](screenshots/Stat/Average%20Glucose.png) | ![Standard Deviation](screenshots/Stat/Standard%20Deviation.png) |

| Coefficient of Variation | Glucose Management Indicator |
|--------------------------|------------------------------|
| ![CV](screenshots/Stat/Coefficient%20of%20Variation.png) | ![GMI](screenshots/Stat/Glucose%20Management%20Indicator.png) |

#### Insulin & Device Statistics

| Avg. Daily Insulin | Total Insulin |
|--------------------|---------------|
| ![Avg Daily Insulin](screenshots/Stat/Avg.%20Daily%20Insulin.png) | ![Total Insulin](screenshots/Stat/Total%20Insulin.png) |

| Time In Auto | Time In Override |
|--------------|------------------|
| ![Time In Auto](screenshots/Stat/Time%20In%20Auto.png) | ![Time In Override](screenshots/Stat/Time%20In%20Override.png) |

| Avg. Daily Carbs | Sensor Usage |
|------------------|--------------|
| ![Avg Daily Carbs](screenshots/Stat/Avg.%20Daily%20Carbs.png) | ![Sensor Usage](screenshots/Stat/Sensor%20Usage.png) |

---

## Tooltips

Interactive tooltips displayed on hover in the Daily view and other contexts.

### Bolus Tooltip

**Source**: `src/components/daily/bolustooltip/BolusTooltip.js`

#### Basic Types

| Normal | Extended | Combo |
|--------|----------|-------|
| ![normal](screenshots/BolusTooltip/normal.png) | ![extended](screenshots/BolusTooltip/extended.png) | ![combo](screenshots/BolusTooltip/combo.png) |

| Automated | Override | Underride |
|-----------|----------|-----------|
| ![automated](screenshots/BolusTooltip/automated.png) | ![override](screenshots/BolusTooltip/override.png) | ![underride](screenshots/BolusTooltip/underride.png) |

#### Cancelled/Interrupted

| Cancelled | Cancelled Extended | Cancelled in Combo (Normal) |
|-----------|--------------------|-----------------------------|
| ![cancelled](screenshots/BolusTooltip/cancelled.png) | ![cancelled extended](screenshots/BolusTooltip/cancelledExtended.png) | ![cancelled combo normal](screenshots/BolusTooltip/cancelledInNormalCombo.png) |

| Cancelled in Combo (Extended) | Immediately Cancelled | Immediately Cancelled Extended |
|-------------------------------|----------------------|--------------------------------|
| ![cancelled combo extended](screenshots/BolusTooltip/cancelledInExtendedCombo.png) | ![immediately cancelled](screenshots/BolusTooltip/immediatelyCancelled.png) | ![immediately cancelled extended](screenshots/BolusTooltip/immediatelyCancelledExtended.png) |

#### With Wizard Data

| With BG Input | With Carb Input | With BG and Carb Input |
|---------------|-----------------|------------------------|
| ![with BG](screenshots/BolusTooltip/withBGInput.png) | ![with carb](screenshots/BolusTooltip/withCarbInput.png) | ![with BG and carb](screenshots/BolusTooltip/withBGAndCarbInput.png) |

| With BG Input and IOB | With Net Recommendation | With Carb Exchange |
|-----------------------|-------------------------|-------------------|
| ![with BG and IOB](screenshots/BolusTooltip/withBGInputAndIOB.png) | ![with net rec](screenshots/BolusTooltip/withNetRec.png) | ![carb exchange](screenshots/BolusTooltip/withCarbExchangeInput.png) |

#### Manufacturer-Specific Targets

| Tandem Target | Medtronic Target | Insulet Target |
|---------------|------------------|----------------|
| ![tandem](screenshots/BolusTooltip/withTandemTarget.png) | ![medtronic](screenshots/BolusTooltip/withMedtronicTarget.png) | ![insulet](screenshots/BolusTooltip/withInsuletTarget.png) |

| Animas Target | Auto Target | Loop Dosing Decision |
|---------------|-------------|----------------------|
| ![animas](screenshots/BolusTooltip/withAnimasTarget.png) | ![auto](screenshots/BolusTooltip/withAutoTarget.png) | ![loop](screenshots/BolusTooltip/withLoopDosingDecision.png) |

#### Extended/Animas Specific

| Extended Animas | Extended Animas Underride | Combo Override |
|-----------------|---------------------------|----------------|
| ![animas extended](screenshots/BolusTooltip/extendedAnimas.png) | ![animas underride](screenshots/BolusTooltip/extendedAnimasUnderride.png) | ![combo override](screenshots/BolusTooltip/comboOverride.png) |

| Combo Underride Cancelled | Combo Underride Cancelled with BG |
|---------------------------|-----------------------------------|
| ![combo underride cancelled](screenshots/BolusTooltip/comboUnderrideCancelled.png) | ![combo underride cancelled BG](screenshots/BolusTooltip/comboUnderrideCancelledWithBG.png) |

#### Precision Variants

| Normal Precise | Normal Very Precise |
|----------------|---------------------|
| ![precise](screenshots/BolusTooltip/normalPrecise.png) | ![very precise](screenshots/BolusTooltip/normalVeryPrecise.png) |

#### Pen/Injection Insulin Types

| Insulin (Pen) | Rapid | Short |
|---------------|-------|-------|
| ![insulin](screenshots/BolusTooltip/insulin.png) | ![rapid](screenshots/BolusTooltip/insulinRapid.png) | ![short](screenshots/BolusTooltip/insulinShort.png) |

| Intermediate | Long |
|--------------|------|
| ![intermediate](screenshots/BolusTooltip/insulinIntermediate.png) | ![long](screenshots/BolusTooltip/insulinLong.png) |

---

### CBG Tooltip (Continuous Glucose)

**Source**: `src/components/daily/cbgtooltip/CBGTooltip.js`

| Very Low | Low | Target |
|----------|-----|--------|
| ![very low](screenshots/CBGTooltip/veryLow.png) | ![low](screenshots/CBGTooltip/low.png) | ![target](screenshots/CBGTooltip/target.png) |

| High | Very High |
|------|-----------|
| ![high](screenshots/CBGTooltip/high.png) | ![very high](screenshots/CBGTooltip/veryHigh.png) |

---

### SMBG Tooltip (Fingerstick)

**Source**: `src/components/daily/smbgtooltip/SMBGTooltip.js`

#### Basic Readings

| Very Low | Low | Target |
|----------|-----|--------|
| ![very low](screenshots/SMBGTooltip/veryLow.png) | ![low](screenshots/SMBGTooltip/low.png) | ![target](screenshots/SMBGTooltip/target.png) |

| High | Very High |
|------|-----------|
| ![high](screenshots/SMBGTooltip/high.png) | ![very high](screenshots/SMBGTooltip/veryHigh.png) |

#### Entry Types

| Manual | Linked (to meter) |
|--------|-------------------|
| ![manual](screenshots/SMBGTooltip/manual.png) | ![linked](screenshots/SMBGTooltip/linked.png) |

#### Medtronic 600-Series Specific

| Accepted | Accepted Manual | Calibration Manual |
|----------|-----------------|-------------------|
| ![accepted](screenshots/SMBGTooltip/medT600accepted.png) | ![accepted manual](screenshots/SMBGTooltip/medT600acceptedManual.png) | ![calib manual](screenshots/SMBGTooltip/medT600calibManual.png) |

| Non-Calibration Manual | Accepted Non-Calib Manual | Rejected |
|------------------------|---------------------------|----------|
| ![noncalib manual](screenshots/SMBGTooltip/medT600noncalibManual.png) | ![accepted noncalib](screenshots/SMBGTooltip/medT600acceptedNoncalibManual.png) | ![rejected](screenshots/SMBGTooltip/medT600rejected.png) |

| Rejected Linked | Timed Out | Timeout Manual |
|-----------------|-----------|----------------|
| ![rejected linked](screenshots/SMBGTooltip/medT600rejectedLinked.png) | ![timed out](screenshots/SMBGTooltip/medT600timedout.png) | ![timeout manual](screenshots/SMBGTooltip/medT600timeoutManual.png) |

---

### Alarm Tooltip

**Source**: `src/components/daily/alarmtooltip/AlarmTooltip.js`

| Auto Off | No Delivery | No Insulin |
|----------|-------------|------------|
| ![auto off](screenshots/AlarmTooltip/auto_off.png) | ![no delivery](screenshots/AlarmTooltip/no_delivery.png) | ![no insulin](screenshots/AlarmTooltip/no_insulin.png) |

| No Power | Occlusion | Over Limit |
|----------|-----------|------------|
| ![no power](screenshots/AlarmTooltip/no_power.png) | ![occlusion](screenshots/AlarmTooltip/occlusion.png) | ![over limit](screenshots/AlarmTooltip/over_limit.png) |

---

### Event Tooltip

**Source**: `src/components/daily/eventtooltip/EventTooltip.js`

| Notes | Pump Shutdown |
|-------|---------------|
| ![notes](screenshots/EventTooltip/Notes.png) | ![pump shutdown](screenshots/EventTooltip/Pump%20Shutdown.png) |

#### Health Events

| Stress | Other (with Notes) |
|--------|-------------------|
| ![stress](screenshots/EventTooltip/Health%20(stress).png) | ![other with notes](screenshots/EventTooltip/Health%20(other%20with%20notes).png) |

#### Physical Activity

| Low | Medium | High |
|-----|--------|------|
| ![low](screenshots/EventTooltip/Physical%20Activity%20(low).png) | ![medium](screenshots/EventTooltip/Physical%20Activity%20(medium).png) | ![high](screenshots/EventTooltip/Physical%20Activity%20(high).png) |

---

### Food Tooltip

**Source**: `src/components/daily/foodtooltip/FoodTooltip.js`

| Standard | Dexcom | Loop |
|----------|--------|------|
| ![standard](screenshots/FoodTooltip/Standard.png) | ![dexcom](screenshots/FoodTooltip/Dexcom.png) | ![loop](screenshots/FoodTooltip/Loop.png) |

| Loop Edited | Loop Time of Entry |
|-------------|-------------------|
| ![loop edited](screenshots/FoodTooltip/Loop%20edited.png) | ![loop time of entry](screenshots/FoodTooltip/Loop%20time%20of%20entry.png) |

---

### Pump Settings Override Tooltip

**Source**: `src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip.js`

| Sleep | Exercise | Pre-Meal |
|-------|----------|----------|
| ![sleep](screenshots/PumpSettingsOverrideTooltip/Sleep.png) | ![exercise](screenshots/PumpSettingsOverrideTooltip/Exercise.png) | ![pre-meal](screenshots/PumpSettingsOverrideTooltip/Pre-Meal.png) |

---

### Stat Tooltip

**Source**: `src/components/common/tooltips/StatTooltip.js`

Displays annotations and additional context for statistics.

| Short Annotation | Long Annotation |
|------------------|-----------------|
| ![short](screenshots/StatTooltip/short%20annotation.png) | ![long](screenshots/StatTooltip/long%20annotation.png) |

| Multiple Annotations | Markdown Annotation |
|----------------------|---------------------|
| ![multiple](screenshots/StatTooltip/multiple%20annotations.png) | ![markdown](screenshots/StatTooltip/markdown%20annotation.png) |

---

### Other Tooltips

#### CGM Sample Interval Tooltip

**Source**: `src/components/common/tooltips/CgmSampleIntervalTooltip.js`

![default](screenshots/CgmSampleIntervalTooltip/default%20tootlip.png)

#### Events Info Tooltip

**Source**: `src/components/common/tooltips/EventsInfoTooltip.js`

![default](screenshots/EventsInfoTooltip/default%20tooltip.png)

---

## Controls

### Clipboard Button

**Source**: `src/components/common/controls/ClipboardButton.js`

Copies formatted data to clipboard for sharing/export.

#### Default & Custom States

| Default | Custom Text | OnSuccess Callback |
|---------|-------------|-------------------|
| ![default](screenshots/ClipboardButton/Default.png) | ![custom](screenshots/ClipboardButton/Custom%20Text.png) | ![success](screenshots/ClipboardButton/OnSuccess%20callback.png) |

#### Data Export Variants

| Basics Data | BG Log Data | Trends Data |
|-------------|-------------|-------------|
| ![basics](screenshots/ClipboardButton/Basics%20Data.png) | ![bg log](screenshots/ClipboardButton/BG%20Log%20Data.png) | ![trends](screenshots/ClipboardButton/Trends%20Data.png) |

#### Pump Settings Export by Manufacturer

| Animas Flat | Animas Multi | Medtronic Flat |
|-------------|--------------|----------------|
| ![animas flat](screenshots/ClipboardButton/Animas%20Flat%20Rate.png) | ![animas multi](screenshots/ClipboardButton/Animas%20Multi%20Rate.png) | ![medtronic flat](screenshots/ClipboardButton/Medtronic%20Flat%20Rate.png) |

| Medtronic Multi | Medtronic Automated | Tandem Flat |
|-----------------|---------------------|-------------|
| ![medtronic multi](screenshots/ClipboardButton/Medtronic%20Multi%20Rate.png) | ![medtronic auto](screenshots/ClipboardButton/Medtronic%20Automated%20Rate.png) | ![tandem flat](screenshots/ClipboardButton/Tandem%20Flat%20Rate.png) |

| Tandem Multi | OmniPod Flat | OmniPod Multi |
|--------------|--------------|---------------|
| ![tandem multi](screenshots/ClipboardButton/Tandem%20Multi%20Rate.png) | ![omnipod flat](screenshots/ClipboardButton/OmniPod%20Flat%20Rate.png) | ![omnipod multi](screenshots/ClipboardButton/OmniPod%20Multi%20Rate.png) |

| Loop Flat | Loop Multi | Equil Flat |
|-----------|------------|------------|
| ![loop flat](screenshots/ClipboardButton/Loop%20Flat%20Rate.png) | ![loop multi](screenshots/ClipboardButton/Loop%20Multi%20Rate.png) | ![equil flat](screenshots/ClipboardButton/Equil%20Flat%20Rate.png) |

| Equil Multi |
|-------------|
| ![equil multi](screenshots/ClipboardButton/Equil%20Multi%20Rate.png) |

---

## Device Settings

Tabular display of insulin pump settings by manufacturer.

**Source**: `src/components/settings/`

### Tandem

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](screenshots/Device%20Settings%20%5BTandem%5D/flat%20rate.png) | ![multi](screenshots/Device%20Settings%20%5BTandem%5D/multi%20rate.png) |

### Medtronic

| Flat Rate | Multi Rate | Automated |
|-----------|------------|-----------|
| ![flat](screenshots/Device%20Settings%20%5BMedtronic%5D/flat%20rate.png) | ![multi](screenshots/Device%20Settings%20%5BMedtronic%5D/multi%20rate.png) | ![automated](screenshots/Device%20Settings%20%5BMedtronic%5D/automated.png) |

### OmniPod

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](screenshots/Device%20Settings%20%5BOmniPod%5D/flat%20rate.png) | ![multi](screenshots/Device%20Settings%20%5BOmniPod%5D/multi%20rate.png) |

### Loop

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](screenshots/Device%20Settings%20%5BLoop%5D/flat%20rate.png) | ![multi](screenshots/Device%20Settings%20%5BLoop%5D/multi%20rate.png) |

### Animas

| Flat Rate | Multi Rate |
|-----------|------------|
| ![flat](screenshots/Device%20Settings%20%5BAnimas%5D/flat%20rate.png) | ![multi](screenshots/Device%20Settings%20%5BAnimas%5D/multi%20rate.png) |

---

## PDF Reports

PrintView classes for generating PDF reports. These are **not** React components - they use pdfkit directly and run in a Web Worker.

**Source**: `src/modules/print/`

### Combined Views

| AGP (CGM) | AGP (BGM) |
|-----------|-----------|
| ![agp cgm](screenshots/Combined%20Views%20PDF/agpCGM.jpg) | ![agp bgm](screenshots/Combined%20Views%20PDF/agpBGM.jpg) |

| Basics | Daily |
|--------|-------|
| ![basics](screenshots/Combined%20Views%20PDF/basics.jpg) | ![daily](screenshots/Combined%20Views%20PDF/daily.jpg) |

| BG Log | Settings |
|--------|----------|
| ![bg log](screenshots/Combined%20Views%20PDF/bgLog.jpg) | ![settings](screenshots/Combined%20Views%20PDF/settings.jpg) |

### Prescription

![prescription](screenshots/Prescription%20View%20PDF/prescription.jpg)
