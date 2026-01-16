# Basal Domain

Basal insulin is the continuous background insulin delivered by insulin pumps. This domain covers basal delivery types, temp basals, suspends, and automated delivery.

---

## Overview

Basal insulin maintains blood glucose levels between meals and overnight. Unlike bolus insulin (discrete doses), basal delivery is continuous over time.

| Delivery Type | Description | Source |
|---------------|-------------|--------|
| `scheduled` | Programmed basal from schedule | User settings |
| `temp` | Temporary rate override | User-initiated |
| `suspend` | Delivery paused (0 u/hr) | User or algorithm |
| `automated` | Algorithm-adjusted rate | Closed-loop systems |

---

## Data Structure

### Basic Basal Record

```javascript
{
  type: "basal",
  deliveryType: "scheduled",     // or subType in some contexts
  rate: 0.85,                    // units per hour
  duration: 3600000,             // duration in milliseconds (1 hour)
  normalTime: 1705331400000,     // start time (ms since epoch)
  normalEnd: 1705335000000,      // end time (computed)
  scheduleName: "Weekday",       // active schedule name
}
```

### Suppressed Basal (for temp/suspend)

When a temp basal or suspend overrides scheduled delivery, the `suppressed` field contains what *would have* been delivered:

```javascript
{
  type: "basal",
  deliveryType: "temp",
  rate: 1.5,                     // current temp rate
  duration: 3600000,
  suppressed: {
    type: "basal",
    deliveryType: "scheduled",
    rate: 0.85,                  // original scheduled rate
  },
}
```

---

## Delivery Types

### Scheduled Basal

Normal programmed basal from the user's basal schedule.

```javascript
{
  deliveryType: "scheduled",
  rate: 0.85,
  scheduleName: "Weekday",
}
```

![Scheduled basals](./screenshots/scheduled%20basals.png)

### Temporary Basal

User-initiated rate override for a set duration.

**Positive temp** (increased rate):
```javascript
{
  deliveryType: "temp",
  rate: 1.5,                     // higher than scheduled
  suppressed: { rate: 0.85 },    // original rate
}
```

![Positive temp](./screenshots/simple%20positive%20temp%20basal.png)

**Negative temp** (decreased rate):
```javascript
{
  deliveryType: "temp",
  rate: 0.4,                     // lower than scheduled
  suppressed: { rate: 0.85 },
}
```

![Negative temp](./screenshots/simple%20negative%20temp%20basal.png)

### Suspend

Delivery completely stopped (rate = 0).

```javascript
{
  deliveryType: "suspend",
  rate: 0,
  suppressed: { rate: 0.85 },
}
```

![Suspend](./screenshots/simple%20suspend%20basal.png)

### Automated Basal

Algorithm-controlled rate from hybrid closed-loop systems (Control-IQ, Loop, Auto Mode).

```javascript
{
  deliveryType: "automated",
  rate: 1.2,                     // algorithm-determined
}
```

Automated basals typically have short durations (5 minutes) as the algorithm continuously adjusts.

![Automated basals](./screenshots/automated%20basals.png)

---

## Schedule Boundaries

Temp basals and suspends can span schedule boundaries, where the underlying scheduled rate changes.

### Temp Across Boundary

When a temp basal spans a schedule change, the `suppressed` rate updates:

![Temp across boundary](./screenshots/positive%20temp%20basal%20across%20schedule%20boundary.png)

```javascript
// Before boundary (1 AM - 3 AM schedule)
{ deliveryType: "temp", rate: 2.1, suppressed: { rate: 1.75 } }

// After boundary (3 AM - 9 AM schedule)  
{ deliveryType: "temp", rate: 2.1, suppressed: { rate: 1.95 } }
```

### Suspend Across Boundary

![Suspend across boundary](./screenshots/suspend%20basal%20across%20schedule%20boundary.png)

---

## Automated + Scheduled

Hybrid closed-loop systems alternate between automated and scheduled delivery:

![Automated and scheduled](./screenshots/automated%20and%20scheduled%20basals.png)

The visualization shows:
- **Automated regions**: Algorithm-controlled delivery
- **Scheduled regions**: Manual/user-programmed delivery

---

## Discontinuities

Gaps in basal data (pump off, upload gaps) are marked with `discontinuousEnd` and `discontinuousStart` flags:

```javascript
// Segment ending with gap
{ ..., discontinuousEnd: true }

// Segment starting after gap
{ ..., discontinuousStart: true }
```

![Discontinuities](./screenshots/scheduled%20flat%20rate%20basal%20with%20two%20discontinuities.png)

---

## Calculations

### Total Basal Insulin

Basal insulin delivered is calculated from rate and duration:

$$
I_{segment} = rate \times \frac{duration}{3600000}
$$

Where duration is in milliseconds and 3600000 ms = 1 hour.

```javascript
// src/utils/basal.js
export function getSegmentDose(duration, rate) {
  const hours = duration / ONE_HR;
  return parseFloat(precisionRound(hours * rate, 3));
}
```

### Total Basal from Range

```javascript
// src/utils/basal.js
export function getTotalBasalFromEndpoints(data, endpoints) {
  let dose = 0;
  _.each(data, datum => {
    dose += getSegmentDose(
      getBasalDurationWithinRange(datum, endpoints), 
      datum.rate
    );
  });
  return formatInsulin(dose);
}
```

### Time in Auto

Time spent in automated vs manual delivery:

```javascript
// src/utils/basal.js
export function getBasalGroupDurationsFromEndpoints(data, endpoints) {
  const durations = { automated: 0, manual: 0 };
  _.each(data, datum => {
    durations[getBasalPathGroupType(datum)] += 
      getBasalDurationWithinRange(datum, endpoints);
  });
  return durations;
}
```

---

## Statistics

### Time in Auto

From `StatUtil.getTimeInAutoData()`:

| Field | Description |
|-------|-------------|
| `automated` | Time in closed-loop mode (ms) |
| `manual` | Time in scheduled/manual mode (ms) |

### Total Insulin (Basal Component)

From `StatUtil.getInsulinData()`:

| Field | Description |
|-------|-------------|
| `basal` | Total basal insulin (units) |

---

## Rendering

### Basal Sequences

Basals are grouped into sequences for rendering:

```javascript
// src/utils/basal.js
export function getBasalSequences(basals) {
  // Groups consecutive basals of same type
  // Breaks on: type change, discontinuity, zero rate
}
```

### Path Groups

For coloring automated vs manual:

```javascript
export function getBasalPathGroups(basals) {
  // Groups into alternating 'automated' and 'manual' arrays
}

export function getBasalPathGroupType(datum) {
  // Returns 'automated' if datum or suppressed is automated
  // Otherwise returns 'manual'
}
```

---

## Automated Suspend

Automated suspends occur when the algorithm predicts low glucose:

![Automated with suspend](./screenshots/automated%20basals%20with%20suspend.png)

```javascript
{
  deliveryType: "suspend",
  rate: 0,
  suppressed: {
    deliveryType: "automated",
    rate: 1.2,
  },
}
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| Basal utilities | `src/utils/basal.js` |
| Test fixtures | `data/basal/fixtures.js` |
| Validation schema | `src/utils/validation/schema.js` |
| Statistics | `src/utils/StatUtil.js` |

---

## See Also

- [Tidepool Data Model](../../concepts/tidepool-data-model.md)
- [Bolus Domain](../bolus/index.md)
- [Device Events](../device-events/index.md) - Suspend events
