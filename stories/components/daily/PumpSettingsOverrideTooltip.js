import React from 'react';
import moment from 'moment';

import { storiesOf } from '@storybook/react';

import PumpSettingsOverrideTooltip from '../../../src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip';
import { MGDL_UNITS, MS_IN_HOUR } from '../../../src/utils/constants';

const now = moment().valueOf();

const sleep = {
  duration: MS_IN_HOUR * 8,
  overrideType: 'sleep',
  source: 'tandem',
  subType: 'pumpSettingsOverride',
  normalTime: moment(now).subtract(1, 'h').valueOf(),
  normalEnd: now,
  type: 'deviceEvent',
};

const physicalActivity = {
  duration: MS_IN_HOUR * 1,
  overrideType: 'physicalActivity',
  source: 'tandem',
  subType: 'pumpSettingsOverride',
  normalTime: moment(now).subtract(1, 'h').valueOf(),
  normalEnd: now,
  type: 'deviceEvent',
};

const preprandial = {
  duration: MS_IN_HOUR * 1,
  overrideType: 'preprandial',
  source: 'diy loop',
  subType: 'pumpSettingsOverride',
  normalTime: moment(now).subtract(1, 'h').valueOf(),
  normalEnd: now,
  type: 'deviceEvent',
  bgTarget: {
    low: 110.554,
    high: 120.004,
  },
};

const props = {
  position: { top: 205, left: 205 },
  timePrefs: { timezoneAware: false },
  bgPrefs: { bgUnits: MGDL_UNITS },
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

storiesOf('PumpSettingsOverrideTooltip', module)
  .addDecorator(BackgroundDecorator)
  .add('Sleep', () => (
    <div>
      {refDiv}
      <PumpSettingsOverrideTooltip {...props} tail={false} side="top" override={sleep} />
    </div>
  ))
  .add('Exercise', () => (
    <div>
      {refDiv}
      <PumpSettingsOverrideTooltip {...props} override={physicalActivity} />
    </div>
  ))
  .add('Pre-Meal', () => (
    <div>
      {refDiv}
      <PumpSettingsOverrideTooltip {...props} tail={false} side="top" override={preprandial} />
    </div>
  ));
