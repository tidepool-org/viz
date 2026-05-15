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

import _ from 'lodash';
import React from 'react';
import { render, fireEvent } from '@testing-library/react/pure';

import * as scales from '../../../helpers/scales';
const {
  trendsHeight,
  trendsWidth,
  trendsXScale: xScale,
  trendsYScale: yScale,
} = scales.trends;
import bgBounds from '../../../helpers/bgBounds';
import SVGContainer from '../../../helpers/SVGContainer';

import {
  CBGDateTraceAnimated,
} from '../../../../src/components/trends/cbg/CBGDateTraceAnimated';
import { MGDL_UNITS } from '../../../../src/utils/constants';

describe('CBGDateTraceAnimated', () => {
  const props = {
    bgBounds,
    bgUnits: MGDL_UNITS,
    data: [{
      id: 'a1b2c3',
      localDate: '2016-12-25',
      msPer24: 0,
      value: 100,
    }, {
      id: 'd4e5f6',
      localDate: '2016-12-25',
      msPer24: 43200000,
      value: 200,
    }],
    date: '2016-12-25',
    focusDateTrace: sinon.spy(),
    onSelectDate: sinon.spy(),
    unfocusDateTrace: sinon.spy(),
    userId: 'z1y2x3',
    xScale,
    yScale,
  };

  describe('when the `data` is an empty array', () => {
    let container;
    before(() => {
      const noDataProps = _.assign({}, props, { data: [] });
      ({ container } = render(
        <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
          <CBGDateTraceAnimated {...noDataProps} />
        </SVGContainer>
      ));
    });

    it('should render a <g> with nothing in it', () => {
      expect(container.querySelectorAll(`#cbgDateTrace-${props.date}`)).to.have.length(1);
      expect(container.querySelectorAll('circle')).to.have.length(0);
    });
  });

  describe('when `data` is not empty', () => {
    let container;
    before(() => {
      ({ container } = render(
        <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
          <CBGDateTraceAnimated {...props} />
        </SVGContainer>
      ));
    });

    it('should render a <g> with two <circle>s in it', () => {
      expect(container.querySelectorAll(`#cbgDateTrace-${props.date}`)).to.have.length(1);
      expect(container.querySelectorAll('circle')).to.have.length(2);
    });

    it('should render each circle centered on (scaled) `msPer24` and `value`', () => {
      const circles = container.querySelectorAll('circle');
      const { data } = props;
      circles.forEach((circle, i) => { // eslint-disable-line lodash/prefer-lodash-method
        expect(Number(circle.getAttribute('cx'))).to.equal(xScale(data[i].msPer24));
        expect(Number(circle.getAttribute('cy'))).to.equal(yScale(data[i].value));
      });
    });

    describe('interactions', () => {
      describe('onClick', () => {
        it('should fire the onSelectDate function', () => {
          const circle = container.querySelectorAll('circle')[0];
          expect(props.onSelectDate.callCount).to.equal(0);
          fireEvent.click(circle);
          expect(props.onSelectDate.callCount).to.equal(1);
          expect(props.onSelectDate.args[0][0]).to.equal(props.data[0].localDate);
        });
      });

      describe('onMouseOver', () => {
        it('should fire the onFocusDate function', () => {
          const circle = container.querySelectorAll('circle')[0];
          expect(props.focusDateTrace.callCount).to.equal(0);
          fireEvent.mouseOver(circle);
          expect(props.focusDateTrace.callCount).to.equal(1);
          expect(props.focusDateTrace.args[0][0]).to.eql(props.data[0]);
          expect(props.focusDateTrace.args[0][1]).to.be.an('object').and.have.keys(['left', 'yPositions']);
        });
      });

      describe('onMouseOut', () => {
        it('should fire the unfocusDateTrace function', () => {
          const circle = container.querySelectorAll('circle')[0];
          expect(props.unfocusDateTrace.callCount).to.equal(0);
          fireEvent.mouseOut(circle);
          expect(props.unfocusDateTrace.callCount).to.equal(1);
        });
      });
    });
  });
});
