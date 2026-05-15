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

import * as scales from '../../../helpers/scales';
const {
  trendsHeight,
  trendsWidth,
  trendsXScale: xScale,
  trendsYScale: yScale,
} = scales.trends;
import bgBounds from '../../../helpers/bgBounds';
import SVGContainer from '../../../helpers/SVGContainer';

import TargetRangeLines from '../../../../src/components/trends/common/TargetRangeLines';

describe('TargetRangeLines', () => {
  let container;
  const props = {
    bgBounds,
    smbgOpts: {
      maxR: 0,
      r: 3,
    },
    xScale,
    yScale,
  };

  before(() => {
    ({ container } = render(
      <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
        <TargetRangeLines {...props} />
      </SVGContainer>
    ));
  });

  it('should render two lines', () => {
    expect(container.querySelectorAll('line')).to.have.length(2);
  });

  describe('highThreshold', () => {
    it('should have y1 and y2 at targetUpperBound on provided yScale', () => {
      const highThreshold = container.querySelector('#highThreshold');
      expect(Number(highThreshold.getAttribute('y1'))).to.equal(yScale(props.bgBounds.targetUpperBound));
      expect(Number(highThreshold.getAttribute('y2'))).to.equal(yScale(props.bgBounds.targetUpperBound));
    });
  });

  describe('lowThreshold', () => {
    it('should have y1 and y2 at targetLowerBound on provided yScale', () => {
      const lowThreshold = container.querySelector('#lowThreshold');
      expect(Number(lowThreshold.getAttribute('y1'))).to.equal(yScale(props.bgBounds.targetLowerBound));
      expect(Number(lowThreshold.getAttribute('y2'))).to.equal(yScale(props.bgBounds.targetLowerBound));
    });
  });
});
