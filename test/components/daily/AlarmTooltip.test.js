import React from 'react';
import { render } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../helpers/cssmodules';

import AlarmTooltip from '../../../src/components/daily/alarmtooltip/AlarmTooltip';
import styles from '../../../src/components/daily/alarmtooltip/AlarmTooltip.css';

const alarm = {
  alarmType: 'occlusion',
  normalTime: new Date('2023-01-01T12:00:00Z').valueOf(),
  source: 'tandem',
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
  alarm,
};

describe('AlarmTooltip', () => {
  it('should render the alarm time', () => {
    const { container } = render(<AlarmTooltip {...props} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.time))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.time)).textContent).to.equal('12:00 pm');
  });

  it('should render the device alarm title', () => {
    const { container } = render(<AlarmTooltip {...props} alarm={alarm} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.deviceAlarmTitle))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.deviceAlarmTitle)).textContent).to.equal('Pump Alarm');
  });

  it('should render the alarm type', () => {
    const { container } = render(<AlarmTooltip {...props} alarm={alarm} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.alarmType))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.alarmType)).textContent).to.equal('Occlusion Detected');
  });

  it('should render the alarm type with an overridden label for twiist', () => {
    const { container } = render(<AlarmTooltip {...props} alarm={{ ...alarm, source: 'twiist' }} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.alarmType))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.alarmType)).textContent).to.equal('Line Blocked');
  });
});
