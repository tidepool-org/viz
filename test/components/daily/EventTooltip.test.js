import React from 'react';
import { render, screen, cleanup } from '@testing-library/react/pure';

import EventTooltip from '../../../src/components/daily/eventtooltip/EventTooltip';

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

    it('should render the event title', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Prior to this time, the pump was shut down')).to.exist;
    });

    it('should render the event description', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText(/Tidepool does not show data from before a pump is shut down/)).to.exist;
    });

    it('should render the event image with an overridden label for twiist', () => {
      render(<EventTooltip {...props} event={{ ...event, source: 'twiist' }} />);
      expect(screen.getByAltText('Pump Shutdown')).to.exist;
    });
  });

  context('health event', () => {
    const event = {
      tags: { event: 'health' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      states: [{ state: 'alcohol' }],
      notes: ['Felt dizzy', 'Had two drinks'],
    };

    it('should render the event time', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('12:00 pm')).to.exist;
    });

    it('should render the event title', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Health')).to.exist;
    });

    it('should render the event label', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Alcohol')).to.exist;
    });

    it('should render the event notes', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Felt dizzy')).to.exist;
      expect(screen.getByText('Had two drinks')).to.exist;
    });
  });

  context('physical_activity event', () => {
    const event = {
      tags: { event: 'physical_activity' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      reportedIntensity: 'low',
      duration: { value: 30, units: 'minutes' }
    };

    it('should render the event time', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('12:00 pm')).to.exist;
    });

    it('should render the event title', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Exercise')).to.exist;
    });

    it('should render the event intensity and duration', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Light')).to.exist;
      expect(screen.getByText('30m')).to.exist;
    });
  });

  context('notes event', () => {
    const event = {
      tags: { event: 'notes' },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      notes: ['Felt dizzy', 'Had two drinks'],
    };

    it('should render the event notes', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Felt dizzy')).to.exist;
      expect(screen.getByText('Had two drinks')).to.exist;
    });
  });

  context('site change event', () => {
    const event = {
      tags: { siteChange: true },
      normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
      displayLabel: 'Cannula Fill',
      daysSince: 3.5,
    };

    it('should render the combined "Site Change: <label>" title', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('Site Change: Cannula Fill')).to.exist;
    });

    it('should render the daysSince duration value when provided', () => {
      render(<EventTooltip {...props} event={event} />);
      expect(screen.getByText('3d 12h')).to.exist;
    });

    it('should omit the duration value when daysSince is null', () => {
      render(<EventTooltip {...props} event={{ ...event, daysSince: null }} />);
      // Title still renders via the same code path; the duration is simply absent.
      expect(screen.getByText('Site Change: Cannula Fill')).to.exist;
      expect(screen.queryByText('3d 12h')).to.be.null;
    });

    it('should fall back to "Site Change" when no displayLabel is present', () => {
      render(<EventTooltip {...props} event={{ ...event, displayLabel: undefined }} />);
      expect(screen.getByText('Site Change')).to.exist;
    });
  });
});
