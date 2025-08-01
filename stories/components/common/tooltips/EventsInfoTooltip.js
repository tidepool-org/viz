import React from 'react';

import { storiesOf } from '@storybook/react';

import EventsInfoTooltip from '../../../../src/components/common/tooltips/EventsInfoTooltip';

const props = {
  position: { top: 205, left: 105 },
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
      left: '100px',
      backgroundColor: 'FireBrick',
      opacity: 0.5,
      zIndex: '1',
    }}
  />
);

const stories = storiesOf('EventsInfoTooltip', module);
stories.addDecorator(BackgroundDecorator);

stories.add('default tooltip', () => (
  <div>
    {refDiv}
    <EventsInfoTooltip {...props} />
  </div>
));
