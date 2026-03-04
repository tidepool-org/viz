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

/* eslint-disable max-len */

import React from 'react';

import { render } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../helpers/cssmodules';
import colors from '../../../src/styles/colors.css';

import CBGTooltip from '../../../src/components/daily/cbgtooltip/CBGTooltip';
import styles from '../../../src/components/daily/cbgtooltip/CBGTooltip.css';

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

const bgPrefs = {
  bgClasses: {
    'very-high': { boundary: 600 },
    high: { boundary: 300 },
    target: { boundary: 180 },
    low: { boundary: 70 },
    'very-low': { boundary: 54 },
  },
  bgUnits: 'mg/dL',
};

const target = {
  type: 'cbg',
  units: 'mg/dL',
  value: 100,
};

const low = {
  type: 'cbg',
  units: 'mg/dL',
  value: 65,
};

const high = {
  type: 'cbg',
  units: 'mg/dL',
  value: 200,
};

const veryHigh = {
  type: 'cbg',
  units: 'mg/dL',
  value: 601,
  annotations: [
    {
      code: 'bg/out-of-range',
      value: 'high',
      threshold: 600,
    },
  ],
};

const veryLow = {
  type: 'cbg',
  units: 'mg/dL',
  value: 39,
  annotations: [
    {
      code: 'bg/out-of-range',
      value: 'low',
      threshold: 40,
    },
  ],
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
  bgPrefs,
};

const glucoseValueSelector = `${formatClassesAsSelector(styles.bg)} ${formatClassesAsSelector(styles.value)}`;

describe('CBGTooltip', () => {
  it('should render without issue when all properties provided', () => {
    const { container } = render(<CBGTooltip {...props} cbg={target} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.bg))).to.have.length(1);
  });

  it('should render "target" color for target bg', () => {
    const { container } = render(<CBGTooltip {...props} cbg={target} />);
    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-tail-color')).to.equal(colors.target);
    expect(tooltip.getAttribute('data-border-color')).to.equal(colors.target);
  });

  it('should render "high" color for high bg', () => {
    const { container } = render(<CBGTooltip {...props} cbg={high} />);
    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-tail-color')).to.equal(colors.high);
    expect(tooltip.getAttribute('data-border-color')).to.equal(colors.high);
  });

  it('should render "veryHigh" color for high bg', () => {
    const { container } = render(<CBGTooltip {...props} cbg={veryHigh} />);
    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-tail-color')).to.equal(colors.veryHigh);
    expect(tooltip.getAttribute('data-border-color')).to.equal(colors.veryHigh);
  });

  it('should render "low" color for low bg', () => {
    const { container } = render(<CBGTooltip {...props} cbg={low} />);
    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-tail-color')).to.equal(colors.low);
    expect(tooltip.getAttribute('data-border-color')).to.equal(colors.low);
  });

  it('should render "veryLow" color for low bg', () => {
    const { container } = render(<CBGTooltip {...props} cbg={veryLow} />);
    const tooltip = container.querySelector('[data-testid="Tooltip"]');
    expect(tooltip.getAttribute('data-tail-color')).to.equal(colors.veryLow);
    expect(tooltip.getAttribute('data-border-color')).to.equal(colors.veryLow);
  });

  it('should render "High" and an annotation for a "very-high" cbg', () => {
    const { container } = render(<CBGTooltip {...props} cbg={veryHigh} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.annotation))).to.have.length(1);
    expect(container.querySelector(glucoseValueSelector).textContent).to.equal('High');
  });

  it('should render "Low" and an annotation for a "very-low" cbg', () => {
    const { container } = render(<CBGTooltip {...props} cbg={veryLow} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.annotation))).to.have.length(1);
    expect(container.querySelector(glucoseValueSelector).textContent).to.equal('Low');
  });
});
