# Overrides (Pump Settings)

Part of the [Device Events Domain](./index.md).

Settings overrides are temporary modes that adjust insulin delivery parameters.

---

## Override Event Structure

```javascript
{
  type: "deviceEvent",
  subType: "pumpSettingsOverride",
  overrideType: "sleep",          // see types below
  duration: 28800000,             // 8 hours (ms)
  bgTarget: {
    low: 100,
    high: 120,
  },
  time: "2024-01-15T22:00:00Z",
}
```

---

## Override Types

| Type | Constant | Description | Typical Use |
|------|----------|-------------|-------------|
| `sleep` | `SLEEP` | Overnight mode | Tighter targets during sleep |
| `physicalActivity` | `PHYSICAL_ACTIVITY` | Exercise mode | Higher targets during activity |
| `preprandial` | `PREPRANDIAL` | Pre-meal mode | Tighter targets before eating |

---

## Screenshots

### Sleep Override

![Sleep Override](./screenshots/Sleep.png)

Tightens glucose targets during overnight hours.

### Exercise Override

![Exercise Override](./screenshots/Exercise.png)

Raises glucose targets during physical activity to prevent lows.

### Pre-Meal Override

![Pre-Meal Override](./screenshots/Pre-Meal.png)

Tightens targets before meals to optimize post-meal glucose.

---

## Manufacturer-Specific Modes

| Manufacturer | Available Modes |
|--------------|-----------------|
| **Tandem (Control-IQ)** | Sleep, Exercise |
| **Tidepool Loop** | Workout, Pre-Meal |
| **DIY Loop** | Workout |
| **Twiist** | Sleep, Exercise, Pre-Meal |

---

## Time in Override Statistics

`StatUtil.getTimeInOverrideData()` calculates duration spent in each override type:

```javascript
// Returns:
{
  durations: {
    sleep: 28800000,              // 8 hours in sleep mode
    physicalActivity: 3600000,   // 1 hour in exercise
    preprandial: 1800000,        // 30 min in pre-meal
  },
  total: 32400000,               // total override time
}
```

### Screenshot

![Time in Override](./screenshots/Time%20In%20Override.png)

---

## Override Tooltips

Override events display tooltips with:
- Override type (Sleep, Exercise, Pre-Meal)
- Start time
- Duration
- Adjusted BG targets (if applicable)

---

## Activity Events (Health/Physical Activity)

Some devices report activity separately from pump overrides:

### Health Events

![Health (stress)](./screenshots/Health%20(stress).png)

![Health (other with notes)](./screenshots/Health%20(other%20with%20notes).png)

### Physical Activity Events

![Physical Activity (low)](./screenshots/Physical%20Activity%20(low).png)

![Physical Activity (medium)](./screenshots/Physical%20Activity%20(medium).png)

![Physical Activity (high)](./screenshots/Physical%20Activity%20(high).png)

### Notes

![Notes](./screenshots/Notes.png)

---

## Key Source Files

| Purpose | File |
|---------|------|
| Override tooltip | `src/components/daily/pumpsettingsoverride/PumpSettingsOverrideTooltip.js` |
| Time in override stats | `src/utils/StatUtil.js` |
| Constants | `src/utils/constants.js` |
| Data processing | `src/utils/DataUtil.js` |

---

## See Also

- [Device Events Overview](./index.md)
- [Insulin Domain: Basal](../insulin/basal/index.md) - Override affects basal delivery
