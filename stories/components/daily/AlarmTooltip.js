import React from 'react';

import { storiesOf } from '@storybook/react';

import AlarmTooltip from '../../../src/components/daily/alarmtooltip/AlarmTooltip';
import { getBrowserTimezone } from '../../../src/utils/datetime';

const BackgroundDecorator = story => (
  <div style={{ backgroundColor: 'FloralWhite', width: '100%', height: '96vh' }}>{story()}</div>
);

const refDiv = (
  <div
    style={{
      position: 'absolute',
      width: '10px',
      height: '10px',
      top: '100px',
      left: '100px',
      backgroundColor: 'FireBrick',
      opacity: 0.5,
      zIndex: '1',
    }}
  />
);

const stories = storiesOf('AlarmTooltip', module);
stories.addDecorator(BackgroundDecorator);

const normalTime = Date.now();
const source = 'twiist';

const alarmTypes = [
  'no_delivery',
  'auto_off',
  'no_insulin',
  'no_power',
  'occlusion',
  'over_limit',
];

const props = {
  position: { top: 105, left: 105 },
  offset: { top: 0, left: 40 },
  timePrefs: { timezoneName: getBrowserTimezone() },
};

_.each(alarmTypes, (alarmType, index) => {
  stories.add(alarmType, () => (
    <div key={`alarmType-${index}`} style={{ position: 'relative' }}>
      {refDiv}
      <AlarmTooltip {...props} alarm={{ alarmType, normalTime, source }} />
    </div>
  ));
});
