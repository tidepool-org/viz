# Calculation Reference

Quick-reference index of all statistical calculations, formulas, and data requirements.

> **Note**: This appendix provides consolidated formulas for at-a-glance comparison. For detailed explanations, see the domain-specific `statistics.md` files linked in each section.

---

## Formula Quick Reference

| Statistic | Formula | Data Source | Min. Data |
|-----------|---------|-------------|-----------|
| Average Glucose | $\bar{x} = \frac{\sum x_i}{n}$ | CBG or SMBG | None |
| Standard Deviation | $\sigma = \sqrt{\frac{\sum(x_i - \bar{x})^2}{n-1}}$ | CBG or SMBG | 30 readings |
| Coefficient of Variation | $CV = \frac{\sigma}{\bar{x}} \times 100$ | CBG or SMBG | 30 readings |
| GMI | $GMI = 3.31 + 0.02392 \times \bar{x}_{mg/dL}$ | CBG only | 14 days @ 70% wear |
| Time in Range | $TIR_i = \frac{duration_i}{total} \times 100$ | CBG only | None |
| Sensor Usage | $\frac{readings \times interval}{total\_duration}$ | CBG only | None |
| Total Daily Insulin | $TDD = basal + bolus + pen$ | All insulin | None |

---

## Glucose Statistics

### Average Glucose

**Formula**:
$$\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i$$

**Implementation**: `StatUtil.getAverageGlucoseData()` at `src/utils/StatUtil.js:102-123`

**Data Source**: CBG or SMBG (based on `bgSource` setting)

**Data Requirements**: No minimum

**Filtering**:
- CGM: Filters by sample interval (≥5 min), deduplicates overlapping readings
- SMBG: No special filtering

**Cross-reference**: [Glucose Statistics](../domains/glucose/statistics.md)

---

### Standard Deviation

**Formula**:
$$\sigma = \sqrt{\frac{\sum_{i=1}^{n}(x_i - \bar{x})^2}{n-1}}$$

Uses sample standard deviation (Bessel's correction with $n-1$).

**Implementation**: `StatUtil.getStandardDevData()` at `src/utils/StatUtil.js:549-570`

**Data Source**: CBG or SMBG

**Data Requirements**: Minimum 30 readings (per BGM AGP specification)

**Code**:
```javascript
const squaredDiffs = _.map(bgData, d => (d.value - averageGlucose) ** 2);
const standardDeviation = Math.sqrt(_.sum(squaredDiffs) / (bgData.length - 1));
```

**Cross-reference**: [Glucose Statistics](../domains/glucose/statistics.md)

---

### Coefficient of Variation (CV)

**Formula**:
$$CV\% = \frac{\sigma}{\bar{x}} \times 100$$

**Implementation**: `StatUtil.getCoefficientOfVariationData()` at `src/utils/StatUtil.js:304-322`

**Data Source**: CBG or SMBG

**Data Requirements**: Minimum 30 readings (inherited from Standard Deviation)

**Classification** (`src/utils/bloodglucose.js:84-90`):

| CV Value | Classification | Interpretation |
|----------|----------------|----------------|
| ≤ 36% | Target | Stable glucose |
| > 36% | High | Variable glucose |

**Cross-reference**: [Glucose Statistics](../domains/glucose/statistics.md)

---

### Glucose Management Indicator (GMI)

**Formula**:
$$GMI = 3.31 + (0.02392 \times \bar{x}_{mg/dL})$$

Where $\bar{x}_{mg/dL}$ is mean glucose in mg/dL.

**Implementation**: `StatUtil.getGlucoseManagementIndicatorData()` at `src/utils/StatUtil.js:384-422`

**Data Source**: CBG only (returns NaN for SMBG)

**Data Requirements**:
- Minimum 14 days of data
- AND ≥70% sensor wear time over those 14 days

**Sufficiency Check**:
```javascript
const insufficientData = this.bgSource === 'smbg'
  || this.activeDays < 14
  || getTotalCbgDuration() < 14 * MS_IN_DAY * 0.7;
```

**Cross-reference**: [Glucose Statistics](../domains/glucose/statistics.md)

---

### Time in Range (TIR)

**Formula**:
$$TIR_i\% = \frac{duration_i}{total\_duration} \times 100$$

For each glucose range $i$.

**Implementation**: `StatUtil.getTimeInRangeData()` at `src/utils/StatUtil.js:686-727`

**Data Source**: CBG only

**Data Requirements**: None (but percentages reconciled to sum to 100%)

**Default Glucose Ranges (mg/dL)**:

| Range | Threshold | Classification |
|-------|-----------|----------------|
| Very Low | < 54 | `veryLow` |
| Low | 54–69 | `low` |
| Target | 70–180 | `target` |
| High | 181–250 | `high` |
| Very High | > 250 | `veryHigh` |

**Classification Logic** (`src/utils/bloodglucose.js:35-77`):
```javascript
if (roundedValue < veryLowThreshold) return 'veryLow';
if (roundedValue > veryHighThreshold) return 'veryHigh';
if (roundedValue < targetLowerBound) return 'low';
if (roundedValue > targetUpperBound) return 'high';
return 'target';
```

**Percentage Reconciliation** (`src/utils/stat.js:304-332`):
- Uses banker's rounding to 2 decimal places
- If sum differs from 100% by ≤2%, adjusts `high` range to compensate
- If sum differs by >2%, returns original data (indicates data error)

**Cross-reference**: [CBG Sensor Usage](../domains/glucose/cbg/sensor-usage.md)

---

### Readings in Range (SMBG)

**Formula**:
$$Count_i = \sum_{readings} \mathbb{1}[range_i]$$

Count of readings in each glucose range.

**Implementation**: `StatUtil.getReadingsInRangeData()` at `src/utils/StatUtil.js:440-477`

**Data Source**: SMBG only

**Data Requirements**: None

**Returns**:
- `counts`: Count per range + total
- `dailyAverages`: `counts / activeDays` (for multi-day views)

**Cross-reference**: [SMBG Overview](../domains/glucose/smbg/index.md)

---

### Sensor Usage

**Formula**:
$$Usage\% = \frac{readings \times sampleInterval}{total\_duration} \times 100$$

AGP variant:
$$Usage_{AGP}\% = \frac{count}{expectedReadings} \times 100$$

Where $expectedReadings = \frac{cgmMinutesWorn}{sampleInterval_{minutes}} + 1$

**Implementation**: `StatUtil.getSensorUsage()` at `src/utils/StatUtil.js:494-535`

**Data Source**: CBG only

**Data Requirements**: None

**Returns**:
```javascript
{
  sensorUsage,      // Total sensor wear time in ms
  sensorUsageAGP,   // Percentage for AGP reports
  sampleInterval,   // CGM sample interval (default: 300000 ms = 5 min)
  count,            // Number of CGM readings
  total             // Total period duration (activeDays × MS_IN_DAY)
}
```

**Cross-reference**: [CBG Sensor Usage](../domains/glucose/cbg/sensor-usage.md)

---

### BG Extents (Min/Max)

**Formula**:
$$BG_{min} = \min(values), \quad BG_{max} = \max(values)$$

**Implementation**: `StatUtil.getBgExtentsData()` at `src/utils/StatUtil.js:138-172`

**Data Source**: CBG or SMBG

**Data Requirements**: None

---

## Insulin Statistics

### Total Daily Insulin

**Formula**:
$$TDD = I_{basal} + I_{bolus} + I_{pen}$$

**Implementation**: `StatUtil.getTotalInsulinData()` at `src/utils/StatUtil.js:740-751`

**Data Sources**:
- `basal`: Pump basal delivery records
- `bolus`: Pump bolus records
- `insulin`: Manual injection (pen/syringe) records

**Data Requirements**: None

**Cross-reference**: [Insulin Statistics](../domains/insulin/statistics.md)

---

### Average Daily Dose

**Formula**:
$$ADD = \frac{TDD}{days\_with\_insulin}$$

**Implementation**: Uses `getTotalInsulinData` via `src/utils/stat.js:91`

**Data Requirements**: None

**Optional**: Supports units/kg calculation with user-provided weight.

**Cross-reference**: [Insulin Statistics](../domains/insulin/statistics.md)

---

### Basal Insulin Calculation

**Formula**:
$$I_{basal} = \sum_{segments} \frac{duration_{ms}}{3600000} \times rate$$

For each basal segment.

**Implementation**: `getSegmentDose()` at `src/utils/basal.js:210-218`

```javascript
getSegmentDose = (duration, rate) => {
  const hours = duration / ONE_HR;  // ONE_HR = 3600000 ms
  return parseFloat(precisionRound(hours * rate, 3));
}
```

**Cross-reference**: [Basal Calculations](../domains/insulin/basal/calculations.md)

---

### Bolus Insulin Calculation

**Formula**:
$$I_{bolus} = \sum_{boluses} delivered_{normal} + delivered_{extended}$$

**Implementation**: `getTotalInsulin()` at `src/utils/bolus.js:293-297`

```javascript
function getTotalInsulin(insulinEvents) {
  return _.reduce(insulinEvents, (result, insulinEvent) => (
    result + getDelivered(insulinEvent)
  ), 0);
}
```

**Cross-reference**: [Bolus Calculations](../domains/insulin/bolus/calculations.md)

---

### Time in Auto (Automated Basal)

**Formula**:
$$TIA\% = \frac{duration_{automated}}{duration_{total}} \times 100$$

**Implementation**: `StatUtil.getTimeInAutoData()` at `src/utils/StatUtil.js:588-608`

**Data Source**: Basal records

**Basal Group Classification** (`src/utils/basal.js:59-67`):
```javascript
function getBasalPathGroupType(datum) {
  const deliveryType = datum.subType || datum.deliveryType;
  const suppressedDeliveryType = datum.suppressed?.subType || datum.suppressed?.deliveryType;
  return _.includes([deliveryType, suppressedDeliveryType], 'automated') 
    ? 'automated' 
    : 'manual';
}
```

**Returns**:
```javascript
{
  durations: {
    automated: ms,
    manual: ms,
  },
  total: ms,
}
```

**Cross-reference**: [Basal Calculations](../domains/insulin/basal/calculations.md)

---

### Time in Override

**Formula**:
$$TIO_i\% = \frac{duration_i}{total\_duration} \times 100$$

For each override type $i$.

**Implementation**: `StatUtil.getTimeInOverrideData()` at `src/utils/StatUtil.js:625-663`

**Data Source**: `deviceEvent` with `subType: 'pumpSettingsOverride'`

**Override Types**:
| Type | Constant | Description |
|------|----------|-------------|
| `sleep` | `SLEEP` | Sleep/rest mode |
| `physicalActivity` | `PHYSICAL_ACTIVITY` | Exercise mode |
| `preprandial` | `PREPRANDIAL` | Pre-meal mode |

**Cross-reference**: [Overrides](../domains/device-events/overrides.md)

---

## Carbs Statistics

### Average Daily Carbs

**Formula**:
$$Carbs_{avg} = \frac{\sum carbs}{activeDays}$$

**Implementation**: `StatUtil.getCarbsData()` at `src/utils/StatUtil.js:234-288`

**Data Sources**:
- `wizard.carbInput`: Carbs entered in bolus calculator
- `food.nutrition.carbohydrate.net`: Food records

**Returns**:
```javascript
{
  carbs: {
    grams,     // Total/avg daily carbs in grams
    exchanges, // Total/avg daily carbs in exchanges
  },
  total,       // Total number of carb records
}
```

**Cross-reference**: [Carbs Statistics](../domains/carbs/statistics.md)

---

## Bolus Calculator Formulas

### Carb Insulin Recommendation

**Formula**:
$$I_{carb} = \frac{carbInput}{ICR}$$

Where $ICR$ = Insulin-to-Carb Ratio (grams per unit)

### Correction Insulin Recommendation

**Formula**:
$$I_{correction} = \frac{BG_{current} - BG_{target}}{ISF}$$

Where $ISF$ = Insulin Sensitivity Factor (mg/dL per unit)

### Net Recommendation (after IOB)

**Formula**:
$$I_{net} = I_{carb} + I_{correction} - IOB$$

**Cross-reference**: [Bolus Data Model](../domains/insulin/bolus/data-model.md)

---

## Data Filtering Algorithms

### CGM Deduplication

**Location**: `src/utils/DataUtil.js:1196-1222`

Uses a "blackout window" approach:
1. Sort CGM data chronologically
2. For each reading, create blackout window of `sampleInterval - 10 seconds`
3. Discard readings within blackout window
4. Removes duplicates from overlapping sensor sessions

### CGM Sample Interval Filtering

**Location**: `src/utils/StatUtil.js:84-86`

Filters CGM data to include only readings with:
- Sample intervals ≥ 5 minutes
- Excludes calibration readings
- Excludes non-standard data points

### SMBG Duplicate Filtering

**Location**: `src/utils/DataUtil.js:1260-1318`

Filters SMBG readings that duplicate CGM values:
- Within 500ms time tolerance
- Only if >10 duplicates detected

---

## Rounding Functions

### Banker's Rounding

**Location**: `src/utils/format.js:59-66`

Rounds 0.5 to nearest even number to reduce upward bias.

**Used in**:
- CV formatting
- GMI formatting
- TIR percentage reconciliation

### Precision Rounding

**Location**: `src/utils/format.js:79-82`

Standard mathematical rounding to specified decimal places.

**Used in**:
- Basal dose calculations
- Display formatting

---

## Default Constants

### BG Bounds (mg/dL)

| Constant | Value | Description |
|----------|-------|-------------|
| `veryLowThreshold` | 54 | Very low BG cutoff |
| `targetLowerBound` | 70 | Target range lower |
| `targetUpperBound` | 180 | Target range upper |
| `veryHighThreshold` | 250 | Very high BG cutoff |
| `extremeHighThreshold` | 350 | Extreme high |
| `clampThreshold` | 600 | Maximum display value |

### BG Bounds (mmol/L)

| Constant | Value |
|----------|-------|
| `veryLowThreshold` | 3.0 |
| `targetLowerBound` | 3.9 |
| `targetUpperBound` | 10.0 |
| `veryHighThreshold` | 13.9 |
| `extremeHighThreshold` | 19.4 |
| `clampThreshold` | 33.3 |

### Time Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MS_IN_DAY` | 86400000 | Milliseconds in a day |
| `MS_IN_HOUR` | 3600000 | Milliseconds in an hour |
| `MS_IN_MIN` | 60000 | Milliseconds in a minute |

### Unit Conversion

| Constant | Value | Description |
|----------|-------|-------------|
| `MGDL_PER_MMOLL` | 18.01559 | mg/dL per mmol/L |

---

## Key Source Files

| Purpose | File |
|---------|------|
| Statistics definitions | `src/utils/stat.js` |
| Statistics calculations | `src/utils/StatUtil.js` |
| BG classification | `src/utils/bloodglucose.js` |
| Basal utilities | `src/utils/basal.js` |
| Bolus utilities | `src/utils/bolus.js` |
| Formatting functions | `src/utils/format.js` |
| Constants | `src/utils/constants.js` |

---

## See Also

- [Glucose Statistics](../domains/glucose/statistics.md) - Detailed glucose stat documentation
- [Insulin Statistics](../domains/insulin/statistics.md) - Detailed insulin stat documentation
- [Carbs Statistics](../domains/carbs/statistics.md) - Carbs calculation details
