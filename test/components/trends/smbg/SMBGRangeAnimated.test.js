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

import _ from 'lodash';
import React from 'react';

import { render, cleanup } from '@testing-library/react/pure';

import * as scales from '../../../helpers/scales';
const {
  trendsHeight,
  trendsXScale: xScale,
  trendsYScale: yScale,
} = scales.trends;
import bgBounds from '../../../helpers/bgBounds';

import { THREE_HRS } from '../../../../src/utils/datetime';

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

import { SMBGRangeAnimated } from '../../../../src/components/trends/smbg/SMBGRangeAnimated';

describe('SMBGRangeAnimated', () => {
  afterEach(() => {
    cleanup();
  });

  const focus = sinon.spy();
  const unfocus = sinon.spy();
  const datum = {
    id: '5400000',
    max: 521,
    mean: 140,
    min: 22,
    msX: 5400000,
  };
  const props = {
    bgBounds,
    datum,
    defaultY: 100,
    focus,
    tooltipLeftThreshold: THREE_HRS * 6,
    unfocus,
    xScale,
    yScale,
  };

  before(() => {
    render(<SMBGRangeAnimated {...props} />);
  });

  describe('when a datum (overlay data) is provided', () => {
    it('should create an array of 1 `styles` to render on the TransitionMotion', () => {
      const styles = lastTMProps.styles;
      expect(styles.length).to.equal(1);
    });

    it('should create `styles` for a <rect> covering the whole yScale range', () => {
      const { style } = lastTMProps.styles[0];
      expect(style.height.val).to.equal(trendsHeight);
      expect(style.y.val).to.equal(0);
    });
  });

  describe('when datum with `undefined` statistics (i.e., gap in data)', () => {
    before(() => {
      const noDatumProps = _.assign({}, props, {
        datum: {
          id: '5400000',
          max: undefined,
          mean: undefined,
          min: undefined,
          msX: 5400000,
        },
      });

      render(<SMBGRangeAnimated {...noDatumProps} />);
    });

    it('should create an array of 0 `styles` to render on the TransitionMotion', () => {
      expect(lastTMProps).to.exist;
      const styles = lastTMProps.styles;
      expect(styles.length).to.equal(0);
    });
  });
});
