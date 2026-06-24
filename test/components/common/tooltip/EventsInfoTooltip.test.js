import React from 'react';
import { render, screen, cleanup } from '@testing-library/react/pure';

import EventsInfoTooltip from '../../../../src/components/common/tooltips/EventsInfoTooltip';

const props = {
  position: { top: 200, left: 200 },
};

describe('EventsInfoTooltip', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the "Events Shown" title', () => {
    render(<EventsInfoTooltip {...props} />);
    expect(screen.getByText('Events Shown')).to.exist;
  });

  it('should list site changes in the subtitle', () => {
    render(<EventsInfoTooltip {...props} />);
    expect(screen.getByText(/site changes/)).to.exist;
  });

  it('should still render the "Pump Alarms Shown" section', () => {
    render(<EventsInfoTooltip {...props} />);
    expect(screen.getByText('Pump Alarms Shown')).to.exist;
  });
});
