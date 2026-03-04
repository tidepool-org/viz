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
import { render, fireEvent } from '@testing-library/react/pure';

import {
  CBGSliceSegment,
} from '../../../../src/components/trends/cbg/CBGSliceSegment';

describe('CBGSliceSegment', () => {
  let container;
  const props = {
    classes: 'foo bar baz',
    datum: {
      id: 'foo',
      msX: 0,
    },
    focusSlice: sinon.spy(),
    interpolated: {
      key: 'innerQuratiles',
      style: {

      },
    },
    positionData: {
      left: 0,
      tooltipLeft: false,
      yPositions: {
        firstQuartile: 40,
        max: 100,
        median: 50,
        min: 5,
        upperQuantile: 90,
        lowerQuantile: 10,
        thirdQuartile: 60,
        topMargin: 2,
      },
    },
    segment: {
      height: 12,
      heightKeys: ['firstQuartile', 'thirdQuartile'],
      y: 60,
    },
    unfocusSlice: sinon.spy(),
    userId: 'a1b2c3',
    width: 20,
    x: 5,
  };

  before(() => {
    container = render(<CBGSliceSegment {...props} />).container;
  });

  it('should render a single <rect>', () => {
    expect(container.querySelectorAll('rect').length).to.equal(1);
  });

  describe('interactions', () => {
    afterEach(() => {
      props.focusSlice.resetHistory();
      props.unfocusSlice.resetHistory();
    });

    describe('onMouseOver', () => {
      it('should fire the `focusSlice` function', () => {
        const rect = container.querySelector('rect');
        expect(props.focusSlice.callCount).to.equal(0);
        fireEvent.mouseOver(rect);
        expect(props.focusSlice.callCount).to.equal(1);
        expect(props.focusSlice.args[0][0]).to.deep.equal(props.datum);
        expect(props.focusSlice.args[0][1]).to.deep.equal(props.positionData);
        expect(props.focusSlice.args[0][2]).to.deep.equal(props.segment.heightKeys);
      });
    });

    describe('onMouseOut', () => {
      describe('mouse event related target is *not* a cbg circle', () => {
        it('should fire the `unfocusSlice` function', () => {
          const rect = container.querySelector('rect');
          expect(props.unfocusSlice.callCount).to.equal(0);
          fireEvent.mouseOut(rect);
          expect(props.unfocusSlice.callCount).to.equal(1);
        });
      });

      describe('mouse event related target *is* a cbg circle', () => {
        it('should NOT fire the `unfocusSlice` function', () => {
          const rect = container.querySelector('rect');
          expect(props.unfocusSlice.callCount).to.equal(0);
          const cbgCircle = document.createElement('div');
          cbgCircle.id = 'cbgCircle-foo-25';
          fireEvent.mouseOut(rect, { relatedTarget: cbgCircle });
          expect(props.unfocusSlice.callCount).to.equal(0);
        });
      });
    });
  });
});
