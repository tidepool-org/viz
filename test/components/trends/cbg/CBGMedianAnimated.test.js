/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017, Tidepool Project
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

import { MGDL_UNITS } from '../../../../src/utils/constants';

let lastTMProps = null;
jest.mock('react-motion', () => ({
  TransitionMotion: jest.fn((props) => {
    lastTMProps = props;
    const interpolated = (props.styles || []).map(s => ({
      key: s.key,
      style: Object.fromEntries(
        Object.entries(s.style).map(([k, v]) => [k, typeof v === 'object' ? v.val : v])
      ),
    }));
    return props.children ? props.children(interpolated) : null;
  }),
  spring: (val, config) => ({ val, config }),
}));

import { CBGMedianAnimated } from '../../../../src/components/trends/cbg/CBGMedianAnimated';

describe('CBGMedianAnimated', () => {
  const datum = {
    id: '2700000',
    min: 22,
    lowerQuantile: 60,
    firstQuartile: 100,
    median: 140,
    thirdQuartile: 180,
    upperQuantile: 245,
    max: 521,
    msX: 2700000,
    msFrom: 1800000,
    msTo: 3600000,
  };
  const props = {
    bgBounds,
    bgUnits: MGDL_UNITS,
    datum,
    defaultY: 100,
    displayingMedian: true,
    showingCbgDateTraces: false,
    sliceWidth: 10,
    xScale,
    yScale,
  };

  describe('when `displayingMedian` is true', () => {
    before(() => {
      render(
        <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
          <CBGMedianAnimated {...props} />
        </SVGContainer>
      );
    });

    it('should render a single <rect>', () => {
      // With mock TransitionMotion, rects are rendered from children callback
      expect(lastTMProps).to.exist;
      expect(lastTMProps.styles).to.have.lengthOf(1);
    });

    it('should vertically center the median <rect> on the value', () => {
      const sliceWidth = props.sliceWidth;
      const strokeWidth = sliceWidth / 8;
      const medianWidth = sliceWidth - strokeWidth;
      const medianHeight = medianWidth * 0.75;

      expect(lastTMProps.styles[0].style.median.val)
        .to.equal(yScale(props.datum.median) - medianHeight / 2);
    });
  });
});
