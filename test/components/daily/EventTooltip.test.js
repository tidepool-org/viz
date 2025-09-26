import React from 'react';
import { mount } from 'enzyme';

import { formatClassesAsSelector } from '../../helpers/cssmodules';

import EventTooltip from '../../../src/components/daily/eventtooltip/EventTooltip';
import styles from '../../../src/components/daily/eventtooltip/EventTooltip.css';

const event = {
  tags: { event: 'pump_shutdown' },
  normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
  source: 'tandem',
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
  event,
};

describe('EventTooltip', () => {
  it('should render the event title', () => {
    const wrapper = mount(<EventTooltip {...props} event={event} />);
    expect(wrapper.find(formatClassesAsSelector(styles.eventTitle))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.eventTitle)).text()).to.equal('Prior to this time, the pump was shut down');
  });

  it('should render the event description', () => {
    const wrapper = mount(<EventTooltip {...props} event={event} />);
    expect(wrapper.find(formatClassesAsSelector(styles.eventDescription))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.eventDescription)).text()).to.contain('Tidepool does not show data from before a pump is shut down.');
  });

  it('should render the event image with an overridden label for twiist', () => {
    const wrapper = mount(<EventTooltip {...props} event={{ ...event, source: 'twiist' }} />);
    expect(wrapper.find(formatClassesAsSelector(styles.image))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.image)).find('img').prop('alt')).to.equal('Pump Shutdown');
  });
});
