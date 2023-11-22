import React from 'react';

import PumpSettingsOverrideTooltip from '../../../src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip';
import { MS_IN_HOUR } from '../../../src/utils/constants';

const sleep = {
  duration: MS_IN_HOUR * 8,
  overrideType: 'sleep',
  source: 'tandem',
  subType: 'pumpSettingsOverride',
  normalTime: 1612150251000,
  type: 'deviceEvent',
};

const physicalActivity = {
  duration: MS_IN_HOUR * 1,
  overrideType: 'physicalActivity',
  source: 'tandem',
  subType: 'pumpSettingsOverride',
  normalTime: 1612150251000 - MS_IN_HOUR * 5,
  type: 'deviceEvent',
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
};

const BackgroundDecorator = (story) => (
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

export default {
  title: 'PumpSettingsOverrideTooltip',
  decorators: [BackgroundDecorator],
};

export const Sleep = () => (
  <div>
    {refDiv}
    <PumpSettingsOverrideTooltip {...props} tail={false} side="top" override={sleep} />
  </div>
);

export const Exercise = () => (
  <div>
    {refDiv}
    <PumpSettingsOverrideTooltip {...props} override={physicalActivity} />
  </div>
);
