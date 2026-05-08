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

import { render, fireEvent, cleanup } from '@testing-library/react/pure';

import bgBounds from '../../../helpers/bgBounds';
import * as scales from '../../../helpers/scales';
const {
  trendsHeight,
  trendsWidth,
  trendsXScale: xScale,
  trendsYScale: yScale,
} = scales.trends;

import SVGContainer from '../../../helpers/SVGContainer';
import { SMBGDateLineAnimated } from '../../../../src/components/trends/smbg/SMBGDateLineAnimated';

let tmRendered = false;
jest.mock('react-motion', () => {
  const React = require('react');
  return {
    TransitionMotion: (tmProps) => {
      tmRendered = true;
      const styles = typeof tmProps.styles === 'function' ? tmProps.styles() : (tmProps.styles || []);
      return tmProps.children(styles);
    },
    spring: (val) => val,
  };
});

describe('SMBGDateLineAnimated', () => {
  let container;
  const focusSmbg = sinon.spy();
  const unfocusSmbg = sinon.spy();
  const onSelectDate = sinon.spy();
  const grouped = true;
  const focusedDay = [];
  const date = '2016-08-14';
  const data = [
    { id: '0', value: 120, msPer24: 0 },
    { id: '1', value: 90, msPer24: 9000000 },
    { id: '2', value: 180, msPer24: 21600000 },
  ];

  const props = {
    bgBounds,
    date,
    data,
    focusedDay,
    focusSmbg,
    grouped,
    onSelectDate,
    unfocusSmbg,
    xScale,
    yScale,
  };

  before(() => {
    ({ container } = render(
      <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
        <SMBGDateLineAnimated {...props} />
      </SVGContainer>
    ));
  });

  after(() => {
    cleanup();
  });

  describe('when data prop is omitted', () => {
    let noDataContainer;
    before(() => {
      tmRendered = false;
      const noDataProps = _.omit(props, 'data');

      ({ container: noDataContainer } = render(
        <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
          <SMBGDateLineAnimated {...noDataProps} />
        </SVGContainer>
      ));
    });

    it('should render a TransitionMotion component but no <path>', () => {
      expect(noDataContainer.querySelectorAll(`#smbgDateLine-${date}`).length).to.equal(1);
      expect(tmRendered).to.be.true;
      expect(noDataContainer.querySelectorAll('path').length).to.equal(0);
    });
  });

  describe('when data is provided', () => {
    it('should render a smbgDateLine <path>', () => {
      expect(container.querySelectorAll(`#smbgDateLine-${date} path`).length).to.equal(1);
    });
  });

  describe('interactions', () => {
    afterEach(() => {
      props.focusSmbg.resetHistory();
      props.unfocusSmbg.resetHistory();
      props.onSelectDate.resetHistory();
    });

    it('should call focusSmbg on mouseover of smbg line', () => {
      const smbgDateLine = container
        .querySelector(`#smbgDateLine-${date} path`);
      expect(focusSmbg.callCount).to.equal(0);
      fireEvent.mouseOver(smbgDateLine);
      expect(focusSmbg.callCount).to.equal(1);
    });

    it('should call unfocusSmbg on mouseout of smbg line', () => {
      const smbgDateLine = container
        .querySelector(`#smbgDateLine-${date} path`);
      expect(unfocusSmbg.callCount).to.equal(0);
      fireEvent.mouseOut(smbgDateLine);
      expect(unfocusSmbg.callCount).to.equal(1);
    });

    it('should call onSelectDate on click of smbg line', () => {
      const smbgDateLine = container
        .querySelector(`#smbgDateLine-${date} path`);
      expect(onSelectDate.callCount).to.equal(0);
      fireEvent.click(smbgDateLine);
      expect(onSelectDate.callCount).to.equal(1);
    });
  });
});
