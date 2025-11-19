import React from 'react';
import { mount } from 'enzyme';

import { formatClassesAsSelector } from '../../helpers/cssmodules';

import EventTooltip from '../../../src/components/daily/eventtooltip/EventTooltip';
import detailedEventStyles from '../../../src/components/daily/eventtooltip/DetailedEventTooltip.css';
import standardEventStyles from '../../../src/components/daily/eventtooltip/StandardEventTooltip.css';

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
};

describe('EventTooltip', () => {
  context('pump_shutdown event', () => {
    const event = {
      tags: { event: 'pump_shutdown' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      source: 'tandem',
    };

    const styles = detailedEventStyles;

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

  context('health event', () => {
    const event = {
      tags: { event: 'health' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      states: [{ state: 'alcohol' }],
      notes: ['Felt dizzy', 'Had two drinks'],
    };

    const styles = standardEventStyles;

    it('should render the event time', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.time))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.time)).text()).to.equal('12:00 pm');
    });

    it('should render the event title', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.title))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.title)).text()).to.equal('Health');
    });

    it('should render the event label', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.label))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.label)).text()).to.equal('Alcohol');
    });

    it('should render the event notes', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.notes))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.notes)).text()).to.contain('Felt dizzy');
      expect(wrapper.find(formatClassesAsSelector(styles.notes)).text()).to.contain('Had two drinks');
    });
  });

  context('physical_activity event', () => {
    const event = {
      tags: { event: 'physical_activity' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      reportedIntensity: 'low',
      duration: { value: 30, units: 'minutes' }
    };

    const styles = standardEventStyles;

    it('should render the event time', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.time))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.time)).text()).to.equal('12:00 pm');
    });

    it('should render the event title', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.title))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.title)).text()).to.equal('Exercise');
    });

    it('should render the event intensity and duration', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.label))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.label)).text()).to.equal('Light');
      expect(wrapper.find(formatClassesAsSelector(styles.value))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.value)).text()).to.equal('30m');
    });
  });

  context('notes event', () => {
    const event = {
      tags: { event: 'notes' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      notes: ['Felt dizzy', 'Had two drinks'],
    };

    const styles = standardEventStyles;

    it('should render the event notes', () => {
      const wrapper = mount(<EventTooltip {...props} event={event} />);
      expect(wrapper.find(formatClassesAsSelector(styles.notes))).to.have.length(1);
      expect(wrapper.find(formatClassesAsSelector(styles.notes)).text()).to.contain('Felt dizzy');
      expect(wrapper.find(formatClassesAsSelector(styles.notes)).text()).to.contain('Had two drinks');
    });
  });
});
