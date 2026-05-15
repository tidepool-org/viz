import React from 'react';

import { storiesOf } from '@storybook/react';

import FoodTooltip from '../../../src/components/daily/foodtooltip/FoodTooltip';

const props = {
  position: { top: 205, left: 205 },
  timePrefs: { timezoneAware: false },
};

const BackgroundDecorator = story => (
  <div style={{ backgroundColor: 'FloralWhite', width: '100%', height: '96vh' }}>{story()}</div>
);

const refDiv = (
  <div
    style={{
      position: 'absolute',
      width: '10px',
      height: '10px',
      top: '200px',
      left: '200px',
      backgroundColor: 'FireBrick',
      opacity: 0.5,
      zIndex: '1',
    }}
  />
);

const standard = {
  nutrition: {
    carbohydrate: {
      net: 3,
      units: 'grams',
    },
  },
};

const loop = {
  ...standard,
  origin: { name: 'com.X48HMZH853.loopkit.Loop' },
  name: '🌮',
  nutrition: {
    ...standard.nutrition,
    estimatedAbsorptionDuration: 10800,
  },
};

const dexcom = {
  ...standard,
  tags: { dexcom: true, manual: true },
};

// Basic Loop food with dosingDecision — entered 1hr before eaten, shows Time Entered
const loopWithDosingDecision = {
  ...loop,
  tags: { loop: true, entryTimeDiffers: true },
  normalTime: '2017-11-11T18:00:00.000Z',
  nutrition: {
    ...loop.nutrition,
    carbohydrate: { net: 25, units: 'grams' },
  },
  dosingDecision: {
    time: Date.parse('2017-11-11T17:00:00.000Z'), // 5:00 pm UTC
    food: {
      time: '2017-11-11T18:00:00.000Z',
      nutrition: { carbohydrate: { net: 25 } },
    },
  },
};

// Loop food where carbs were edited (single dosingDecision with originalFood), shows Time Edited
const loopEditedCarbs = {
  ...loop,
  tags: { loop: true, carbsEdited: true, entryTimeDiffers: false },
  nutrition: {
    ...loop.nutrition,
    carbohydrate: { net: 75, units: 'grams' },
  },
  dosingDecision: {
    time: Date.parse('2017-11-11T17:00:00.000Z'), // Time Edited
    food: {
      time: '2017-11-11T18:00:00.000Z',
      nutrition: { carbohydrate: { net: 75 } },
    },
    originalFood: {
      time: '2017-11-11T18:00:00.000Z',
      nutrition: { carbohydrate: { net: 50 } },
    },
  },
};

// Loop food where both carbs and time were edited (two dosingDecisions)
// normalTime (5:30pm) is >5min from both DDs (6pm, 7pm) → shows Time Entered + Time Last Edited
const loopBothEdits = {
  ...loop,
  tags: { loop: true, carbsEdited: true, entryTimeDiffers: true },
  normalTime: '2017-11-11T17:30:00.000Z',
  nutrition: {
    ...loop.nutrition,
    carbohydrate: { net: 80, units: 'grams' },
  },
  originalDosingDecision: {
    time: Date.parse('2017-11-11T18:00:00.000Z'), // Time Entered (6:00 pm)
    food: {
      time: '2017-11-11T17:30:00.000Z',
      nutrition: { carbohydrate: { net: 40 } },
    },
  },
  dosingDecision: {
    time: Date.parse('2017-11-11T19:00:00.000Z'), // Time Last Edited (7:00 pm)
    food: {
      time: '2017-11-11T17:30:00.000Z',
      nutrition: { carbohydrate: { net: 80 } },
    },
    originalFood: {
      time: '2017-11-11T17:30:00.000Z',
      nutrition: { carbohydrate: { net: 40 } },
    },
  },
};

storiesOf('FoodTooltip', module)
  .addDecorator(BackgroundDecorator)
  .add('Standard', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={standard} />
    </div>
  ))
  .add('Dexcom', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={dexcom} />
    </div>
  ))
  .add('Loop', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={loop} />
    </div>
  ))
  .add('Loop with time entered', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={loopWithDosingDecision} />
    </div>
  ))
  .add('Loop edited carbs', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={loopEditedCarbs} />
    </div>
  ))
  .add('Loop both carbs and time edited', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={loopBothEdits} />
    </div>
  ));
