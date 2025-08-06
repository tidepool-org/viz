import React from 'react';
import { mount } from 'enzyme';

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
    const wrapper = mount(<AlarmTooltip {...props} />);
    expect(wrapper.find(formatClassesAsSelector(styles.time))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.time)).text()).to.equal('12:00 pm');
  });

  it('should render the device alarm title', () => {
    const wrapper = mount(<AlarmTooltip {...props} alarm={alarm} />);
    expect(wrapper.find(formatClassesAsSelector(styles.deviceAlarmTitle))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.deviceAlarmTitle)).text()).to.equal('Pump Alarm');
  });

  it('should render the alarm type', () => {
    const wrapper = mount(<AlarmTooltip {...props} alarm={alarm} />);
    expect(wrapper.find(formatClassesAsSelector(styles.alarmType))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.alarmType)).text()).to.equal('Occlusion Detected');
  });

  it('should render the alarm type with an overridden label for twiist', () => {
    const wrapper = mount(<AlarmTooltip {...props} alarm={{ ...alarm, source: 'twiist' }} />);
    expect(wrapper.find(formatClassesAsSelector(styles.alarmType))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.alarmType)).text()).to.equal('Line Blocked');
  });
});
