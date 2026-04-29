import React from 'react';
import { render, cleanup } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../helpers/cssmodules';

import EventTooltip from '../../../src/components/daily/eventtooltip/EventTooltip';
import detailedEventStyles from '../../../src/components/daily/eventtooltip/DetailedEventTooltip.css';
import standardEventStyles from '../../../src/components/daily/eventtooltip/StandardEventTooltip.css';

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
};

describe('EventTooltip', () => {
  afterEach(() => {
    cleanup();
  });

  context('pump_shutdown event', () => {
    const event = {
      tags: { event: 'pump_shutdown' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      source: 'tandem',
    };

    const styles = detailedEventStyles;

    it('should render the event title', () => {
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.eventTitle))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.eventTitle)).textContent).to.equal('Prior to this time, the pump was shut down');
    });

    it('should render the event description', () => {
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.eventDescription))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.eventDescription)).textContent).to.contain('Tidepool does not show data from before a pump is shut down.');
    });

    it('should render the event image with an overridden label for twiist', () => {
      const { container } = render(<EventTooltip {...props} event={{ ...event, source: 'twiist' }} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.image))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.image)).querySelector('img').getAttribute('alt')).to.equal('Pump Shutdown');
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
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.time))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.time)).textContent).to.equal('12:00 pm');
    });

    it('should render the event title', () => {
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.title))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.title)).textContent).to.equal('Health');
    });

    it('should render the event label', () => {
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.label))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.label)).textContent).to.equal('Alcohol');
    });

    it('should render the event notes', () => {
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.notes))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.notes)).textContent).to.contain('Felt dizzy');
      expect(container.querySelector(formatClassesAsSelector(styles.notes)).textContent).to.contain('Had two drinks');
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
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.time))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.time)).textContent).to.equal('12:00 pm');
    });

    it('should render the event title', () => {
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.title))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.title)).textContent).to.equal('Exercise');
    });

    it('should render the event intensity and duration', () => {
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.label))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.label)).textContent).to.equal('Light');
      expect(container.querySelectorAll(formatClassesAsSelector(styles.value))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.value)).textContent).to.equal('30m');
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
      const { container } = render(<EventTooltip {...props} event={event} />);
      expect(container.querySelectorAll(formatClassesAsSelector(styles.notes))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.notes)).textContent).to.contain('Felt dizzy');
      expect(container.querySelector(formatClassesAsSelector(styles.notes)).textContent).to.contain('Had two drinks');
    });
  });
});
