import React from 'react';
import _ from 'lodash';
import { storiesOf } from '@storybook/react';

import EventTooltip from '../../../src/components/daily/eventtooltip/EventTooltip';
import { getBrowserTimezone } from '../../../src/utils/datetime';
import { EVENT_HEALTH, EVENT_NOTES, EVENT_PHYSICAL_ACTIVITY, EVENT_PUMP_SHUTDOWN } from '../../../src/utils/constants';

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

const events = _.map([
  { label: 'Pump Shutdown', tags: { event: EVENT_PUMP_SHUTDOWN } },
  { label: 'Health (stress)', tags: { event: EVENT_HEALTH }, states: [{ state: 'stress' }] },
  { label: 'Health (other with notes)', tags: { event: EVENT_HEALTH }, states: [{ state: 'other', stateOther: 'dizzy' }], notes: ['Slept really poorly last night', 'Think I\'m coming down with something'] },
  { label: 'Notes', tags: { event: EVENT_NOTES }, notes: ['Slept really poorly last night', 'Think I\'m coming down with something'] },
  { label: 'Physical Activity (low)', tags: { event: EVENT_PHYSICAL_ACTIVITY }, duration: { value: 90, units: 'minutes' }, reportedIntensity: 'low' },
  { label: 'Physical Activity (medium)', tags: { event: EVENT_PHYSICAL_ACTIVITY }, duration: { value: 90, units: 'minutes' }, reportedIntensity: 'medium' },
  { label: 'Physical Activity (high)', tags: { event: EVENT_PHYSICAL_ACTIVITY }, duration: { value: 90, units: 'minutes' }, reportedIntensity: 'high' },
], event => ({ ...event, normalTime }));

const props = {
  position: { top: 105, left: 305 },
  offset: { top: 0, left: 40 },
  timePrefs: { timezoneName: getBrowserTimezone() },
};

_.each(events, (event, index) => {
  stories.add(event.label, () => (
    <div key={`eventType-${index}`} style={{ position: 'relative' }}>
      {refDiv}
      <EventTooltip {...props} event={event} />
    </div>
  ));
});
