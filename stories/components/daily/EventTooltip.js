import React from 'react';
import _ from 'lodash';
import { storiesOf } from '@storybook/react';

import EventTooltip from '../../../src/components/daily/eventtooltip/EventTooltip';
import { getBrowserTimezone } from '../../../src/utils/datetime';
import { EVENT_HEALTH, EVENT_NOTES, EVENT_PUMP_SHUTDOWN } from '../../../src/utils/constants';

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
      left: '300px',
      backgroundColor: 'FireBrick',
      opacity: 0.5,
      zIndex: '1',
    }}
  />
);

const stories = storiesOf('EventTooltip', module);
stories.addDecorator(BackgroundDecorator);

const normalTime = Date.now();

const events = [
  { tags: { event: EVENT_PUMP_SHUTDOWN } },
  { tags: { event: EVENT_HEALTH }, states: [{ state: 'stress' }] },
  { tags: { event: EVENT_NOTES }, notes: ['Slept really poorly last night', 'Think I\'m coming down with something'] },
].map(event => ({ ...event, normalTime }));

const props = {
  position: { top: 105, left: 305 },
  offset: { top: 0, left: 40 },
  timePrefs: { timezoneName: getBrowserTimezone() },
};

_.each(events, (event, index) => {
  stories.add(event.tags.event, () => (
    <div key={`eventType-${index}`} style={{ position: 'relative' }}>
      {refDiv}
      <EventTooltip {...props} event={event} />
    </div>
  ));
});
