import React from 'react';
import moment from 'moment';

import { storiesOf } from '@storybook/react';

import FoodTooltip from '../../../src/components/daily/foodtooltip/FoodTooltip';

const props = {
  position: { top: 200, left: 200 },
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
      top: '199px',
      left: '199px',
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

const loopTimeOfEntry = {
  ...loop,
  payload: {
    userCreatedDate: moment().toISOString(),
  },
  normalTime: moment().subtract(15, 'minutes').toISOString(),
};

const loopEdited = {
  ...loop,
  payload: {
    userUpdatedDate: moment().toISOString(),
  },
  normalTime: moment().subtract(30, 'minutes').toISOString(),
};

storiesOf('FoodTooltip', module)
  .addDecorator(BackgroundDecorator)
  .add('standard', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={standard} />
    </div>
  ))
  .add('Loop', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={loop} />
    </div>
  ))
  .add('Loop time of entry', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={loopTimeOfEntry} />
    </div>
  ))
  .add('Loop edited', () => (
    <div>
      {refDiv}
      <FoodTooltip {...props} food={loopEdited} />
    </div>
  ))
  ;
