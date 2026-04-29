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

import { render } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../helpers/cssmodules';
import { MS_IN_HOUR } from '../../../src/utils/constants';

import PumpSettingsOverrideTooltip from '../../../src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip';
import styles from '../../../src/components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip.css';
import colors from '../../../src/styles/colors.css';

jest.mock('../../../src/components/common/tooltips/Tooltip', () => {
  const R = require('react');
  const MockTooltip = (props) => R.createElement('div', {
    'data-testid': 'Tooltip',
    'data-tail-color': props.tailColor,
    'data-border-color': props.borderColor,
  }, props.title, props.content);
  MockTooltip.displayName = 'Tooltip';
  return { __esModule: true, default: MockTooltip };
});

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
    const { container: tandemContainer } = render(<PumpSettingsOverrideTooltip {...props} override={sleep} />);
    expect(tandemContainer.querySelectorAll(formatClassesAsSelector(styles.label))).to.have.length(1);
    expect(tandemContainer.querySelector(formatClassesAsSelector(styles.label)).textContent).to.equal('Activity');

    const { container: genericContainer } = render(<PumpSettingsOverrideTooltip
      {...props}
      override={{
        ...sleep,
        source: undefined,
      }}
    />);

    expect(genericContainer.querySelectorAll(formatClassesAsSelector(styles.label))).to.have.length(1);
    expect(genericContainer.querySelector(formatClassesAsSelector(styles.label)).textContent).to.equal('Settings Override');
  });

  it('should render the override start and end times', () => {
    const { container } = render(<PumpSettingsOverrideTooltip {...props} override={sleep} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.title))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.title)).textContent).to.equal('12:00 am - 8:00 am');
  });

  it('should render the override type for a sleep override and use the appropriate color', () => {
    const { container } = render(<PumpSettingsOverrideTooltip {...props} override={sleep} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.value))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.value)).textContent).to.equal('Sleep');

    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-border-color')).to.be.a('string').and.equal(colors.sleep);
    expect(tooltip.getAttribute('data-tail-color')).to.be.a('string').and.equal(colors.sleep);
  });

  it('should render the override type for a physicalActivity override and use the appropriate color', () => {
    const { container } = render(<PumpSettingsOverrideTooltip {...props} override={physicalActivity} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.value))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.value)).textContent).to.equal('Exercise');

    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-border-color')).to.be.a('string').and.equal(colors.physicalActivity);
    expect(tooltip.getAttribute('data-tail-color')).to.be.a('string').and.equal(colors.physicalActivity);
  });

  it('should render the override type for a preprandial override and use the appropriate color', () => {
    const { container } = render(<PumpSettingsOverrideTooltip {...props} override={preprandialWithBgTarget} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.value))).to.have.lengthOf.at.least(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.value))[0].textContent).to.equal('Pre-Meal');

    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-border-color')).to.be.a('string').and.equal(colors.preprandial);
    expect(tooltip.getAttribute('data-tail-color')).to.be.a('string').and.equal(colors.preprandial);
  });

  it('should render the bgTarget for an override', () => {
    const { container } = render(<PumpSettingsOverrideTooltip {...props} override={preprandialWithBgTarget} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.label))[0].textContent).to.equal('Correction Range');
    expect(container.querySelectorAll(formatClassesAsSelector(styles.value))[1].textContent).to.equal('111-120');
  });
});
