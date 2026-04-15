/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

import React from 'react';

import { mount } from 'enzyme';

import { formatClassesAsSelector } from '../../helpers/cssmodules';
import { MS_IN_HOUR } from '../../../src/utils/constants';

import PumpSettingsOverrideTooltip from '../../../src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip';
import styles from '../../../src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip.css';
import Tooltip from '../../../src/components/common/tooltips/Tooltip';
import colors from '../../../src/styles/colors.css';

const sleep = {
  overrideType: 'sleep',
  normalTime: Date.parse('2021-03-10T00:00:00.000Z'),
  normalEnd: Date.parse('2021-03-10T08:00:00.000Z'),
  source: 'Tandem',
};

const physicalActivity = {
  overrideType: 'physicalActivity',
  normalTime: Date.parse('2021-03-10T00:00:00.000Z'),
  normalEnd: Date.parse('2021-03-10T08:00:00.000Z'),
  source: 'Tandem',
};

const preprandialWithBgTarget = {
  duration: MS_IN_HOUR * 1,
  overrideType: 'preprandial',
  source: 'diy loop',
  subType: 'pumpSettingsOverride',
  normalTime: Date.parse('2021-03-10T00:00:00.000Z'),
  normalEnd: Date.parse('2021-03-10T08:00:00.000Z'),
  type: 'deviceEvent',
  bgTarget: {
    low: 110.554,
    high: 120.004,
  },
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
};

describe('PumpSettingsOverrideTooltip', () => {
  it('should render a settings override label with a pump specific vocabulary, and fall back to a default', () => {
    const tandemWrapper = mount(<PumpSettingsOverrideTooltip {...props} override={sleep} />);
    expect(tandemWrapper.find(formatClassesAsSelector(styles.label))).to.have.length(1);
    expect(tandemWrapper.find(formatClassesAsSelector(styles.label)).text()).to.equal('Activity');

    const genericWrapper = mount(<PumpSettingsOverrideTooltip
      {...props}
      override={{
        ...sleep,
        source: undefined,
      }}
    />);

    expect(genericWrapper.find(formatClassesAsSelector(styles.label))).to.have.length(1);
    expect(genericWrapper.find(formatClassesAsSelector(styles.label)).text()).to.equal('Settings Override');
  });

  it('should render the override start and end times', () => {
    const wrapper = mount(<PumpSettingsOverrideTooltip {...props} override={sleep} />);
    expect(wrapper.find(formatClassesAsSelector(styles.title))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.title)).text()).to.equal('12:00 am - 8:00 am');
  });

  it('should render the override type for a sleep override and use the appropriate color', () => {
    const wrapper = mount(<PumpSettingsOverrideTooltip {...props} override={sleep} />);
    expect(wrapper.find(formatClassesAsSelector(styles.value))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.value)).text()).to.equal('Sleep');

    const tooltipWrapper = wrapper.find(Tooltip);
    expect(tooltipWrapper.props().borderColor).to.be.a('string').and.equal(colors.sleep);
    expect(tooltipWrapper.props().tailColor).to.be.a('string').and.equal(colors.sleep);
  });

  it('should render the override type for a physicalActivity override and use the appropriate color', () => {
    const wrapper = mount(<PumpSettingsOverrideTooltip {...props} override={physicalActivity} />);
    expect(wrapper.find(formatClassesAsSelector(styles.value))).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.value)).text()).to.equal('Exercise');

    const tooltipWrapper = wrapper.find(Tooltip);
    expect(tooltipWrapper.props().borderColor).to.be.a('string').and.equal(colors.physicalActivity);
    expect(tooltipWrapper.props().tailColor).to.be.a('string').and.equal(colors.physicalActivity);
  });

  it('should render the override type for a preprandial override and use the appropriate color', () => {
    const wrapper = mount(<PumpSettingsOverrideTooltip {...props} override={preprandialWithBgTarget} />);
    expect(wrapper.find(formatClassesAsSelector(styles.value)).at(0)).to.have.length(1);
    expect(wrapper.find(formatClassesAsSelector(styles.value)).at(0).text()).to.equal('Pre-Meal');

    const tooltipWrapper = wrapper.find(Tooltip);
    expect(tooltipWrapper.props().borderColor).to.be.a('string').and.equal(colors.preprandial);
    expect(tooltipWrapper.props().tailColor).to.be.a('string').and.equal(colors.preprandial);
  });

  it('should render the bgTarget for an override', () => {
    const wrapper = mount(<PumpSettingsOverrideTooltip {...props} override={preprandialWithBgTarget} />);
    expect(wrapper.find(formatClassesAsSelector(styles.label)).at(1).text()).to.equal('Correction Range');
    expect(wrapper.find(formatClassesAsSelector(styles.value)).at(1).text()).to.equal('111-120');
  });
});
