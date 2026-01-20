# Health Events, Notes & Physical Activity

Part of the [Device Events Domain](./index.md).

User-reported events capture health conditions, notes, and physical activity logged through Tidepool Mobile or integrated apps.

---

## Overview

Unlike device-generated events (alarms, suspends, site changes), these events are user-reported:

| Type | Data Type | Purpose |
|------|-----------|---------|
| **Health** | `reportedState` | Track health factors affecting glucose |
| **Notes** | `reportedState` | Free-form user notes |
| **Physical Activity** | `physicalActivity` | Exercise logging with intensity/duration |

These events display in the **Events Zone** on Daily View alongside device events.

---

## Health Events

Health events track conditions that may affect glucose levels.

### Data Structure

```javascript
{
  type: "reportedState",
  states: [{
    state: "stress",           // health state category
    stateOther: null,          // custom text if state is "other"
  }],
  notes: [],                   // optional accompanying notes
  time: "2024-01-15T14:30:00Z",
  normalTime: 1705329000000,
}
```

### Health States

| State | Constant | Description |
|-------|----------|-------------|
| `alcohol` | - | Alcohol consumption |
| `cycle` | - | Menstrual cycle |
| `hyperglycemiaSymptoms` | - | High blood sugar symptoms |
| `hypoglycemiaSymptoms` | - | Low blood sugar symptoms |
| `illness` | - | Sickness affecting glucose |
| `stress` | - | Stress or anxiety |
| `other` | - | Custom state (uses `stateOther` field) |

### Health Event Screenshot

![Health (stress)](./screenshots/Health%20(stress).png)

Standard health event showing the state category.

![Health (other with notes)](./screenshots/Health%20(other%20with%20notes).png)

Custom health state with accompanying notes.

---

## Notes

Notes are free-form text entries without a health state classification.

### Data Structure

```javascript
{
  type: "reportedState",
  states: [],                  // empty or absent
  notes: [
    "Slept really poorly last night",
    "Think I'm coming down with something"
  ],
  time: "2024-01-15T08:00:00Z",
  normalTime: 1705305600000,
}
```

### Notes Screenshot

![Notes](./screenshots/Notes.png)

---

## Physical Activity

Exercise events track workouts with intensity and duration.

### Data Structure

```javascript
{
  type: "physicalActivity",
  reportedIntensity: "medium",  // low, medium, high
  duration: {
    value: 90,
    units: "minutes",           // seconds, minutes, hours
  },
  time: "2024-01-15T17:00:00Z",
  normalTime: 1705338000000,
}
```

### Intensity Levels

| Level | Display Label | Typical Activities |
|-------|---------------|-------------------|
| `low` | Light | Walking, stretching |
| `medium` | Moderate | Jogging, cycling |
| `high` | Intense | Running, HIIT |

### Physical Activity Screenshots

![Physical Activity (low)](./screenshots/Physical%20Activity%20(low).png)

Light intensity exercise.

![Physical Activity (medium)](./screenshots/Physical%20Activity%20(medium).png)

Moderate intensity exercise.

![Physical Activity (high)](./screenshots/Physical%20Activity%20(high).png)

Intense exercise.

---

## Processing & Tagging

Events are tagged during data processing for efficient filtering and display:

```javascript
// src/utils/DataUtil.js:830-865
const healthStates = [
  'alcohol',
  'cycle',
  'hyperglycemiaSymptoms',
  'hypoglycemiaSymptoms',
  'illness',
  'stress',
  'other',
];

const events = {
  [EVENT_PHYSICAL_ACTIVITY]: d.type === 'physicalActivity',
  [EVENT_HEALTH]: d.type === 'reportedState' 
    && _.includes(healthStates, d.states?.[0]?.state),
  [EVENT_NOTES]: d.type === 'reportedState' 
    && (!!d.states?.[0]?.stateOther || d.notes?.length),
};
```

### Tag Priority

Events are tagged with a single event type based on priority order:

1. `EVENT_PUMP_SHUTDOWN` (highest)
2. `EVENT_PHYSICAL_ACTIVITY`
3. `EVENT_HEALTH`
4. `EVENT_NOTES` (lowest)

A `reportedState` with both a health state and notes is tagged as `EVENT_HEALTH`.

---

## Rendering

### EventTooltip Component

All three event types render through `EventTooltip`:

```javascript
// src/components/daily/eventtooltip/EventTooltip.js
switch (event?.tags?.event) {
  case EVENT_HEALTH: {
    const healthLabels = {
      alcohol: t('Alcohol'),
      cycle: t('Cycle'),
      hyperglycemiaSymptoms: t('Hyperglycemia Symptoms'),
      hypoglycemiaSymptoms: t('Hypoglycemia Symptoms'),
      illness: t('Illness'),
      stress: t('Stress'),
      other: capitalize(event.states?.[0]?.stateOther || t('Other')),
    };
    return {
      time,
      title: t('Health'),
      label: healthLabels[event.states?.[0]?.state],
      notes: event.notes,
      renderer: renderStandardEvent,
    };
  }
  case EVENT_NOTES:
    return {
      time,
      title: null,
      label: null,
      notes: event.notes,
      renderer: renderStandardEvent,
    };
  case EVENT_PHYSICAL_ACTIVITY: {
    // ... intensity and duration formatting
  }
}
```

### PDF Print View

Events are rendered in the Daily Print View with icons:

```javascript
// src/modules/print/DailyPrintView.js
const eventImages = {
  [EVENT_HEALTH]: 'images/event-health.png',
  [EVENT_NOTES]: 'images/event-notes.png',
  // ...
};
```

---

## Distinguishing from Pump Overrides

These user-reported events are **distinct** from pump settings overrides:

| Aspect | Health/Notes/Activity | Pump Overrides |
|--------|----------------------|----------------|
| **Source** | User input (app) | Pump device |
| **Data Type** | `reportedState`, `physicalActivity` | `deviceEvent` with `subType: pumpSettingsOverride` |
| **Effect** | Informational only | Modifies insulin delivery |
| **Duration** | Point-in-time | Active period with targets |

See [Overrides](./overrides.md) for pump settings override documentation.

---

## Key Source Files

| Purpose | File |
|---------|------|
| Event tooltip component | `src/components/daily/eventtooltip/EventTooltip.js` |
| Event tagging logic | `src/utils/DataUtil.js:830-865` |
| Event constants | `src/utils/constants.js` |
| PDF rendering | `src/modules/print/DailyPrintView.js` |
| Storybook examples | `stories/components/daily/EventTooltip.js` |
| Data validation schema | `src/utils/validation/schema.js` |

---

## See Also

- [Device Events Overview](./index.md) - All device event types
- [Overrides](./overrides.md) - Pump settings overrides (Sleep, Exercise modes)
- [Daily View](../../views/daily.md) - Events zone display
