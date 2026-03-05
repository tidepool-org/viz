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

import { THREE_HRS } from '../../../../src/utils/datetime';

import bgBounds from '../../../helpers/bgBounds';
import * as scales from '../../../helpers/scales';
const {
  trendsHeight,
  trendsWidth,
  trendsXScale: xScale,
  trendsYScale: yScale,
} = scales.trends;

import SVGContainer from '../../../helpers/SVGContainer';
import { SMBGDatePointsAnimated }
  from '../../../../src/components/trends/smbg/SMBGDatePointsAnimated';
import { MGDL_UNITS } from '../../../../src/utils/constants';

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

describe('SMBGDatePointsAnimated', () => {
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
  const smbgOpts = {
    maxR: 7.5,
    r: 6,
  };

  const props = {
    bgBounds,
    bgUnits: MGDL_UNITS,
    data,
    date,
    focusedDay,
    focusSmbg,
    grouped,
    onSelectDate,
    smbgOpts,
    tooltipLeftThreshold: THREE_HRS * 6,
    unfocusSmbg,
    userId: 'a1b2c3',
    xScale,
    yScale,
  };
  before(() => {
    ({ container } = render(
      <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
        <SMBGDatePointsAnimated {...props} />
      </SVGContainer>
    ));
  });

  after(() => {
    cleanup();
  });

  describe('when an empty array of data is provided', () => {
    let noDataContainer;
    before(() => {
      tmRendered = false;
      const noDataProps = _.assign({}, props, { data: [] });

      ({ container: noDataContainer } = render(
        <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
          <SMBGDatePointsAnimated {...noDataProps} />
        </SVGContainer>
      ));
    });

    it('should render a TransitionMotion component but no <g> or <circle>s', () => {
      expect(tmRendered).to.be.true;
      expect(noDataContainer.querySelectorAll(`#smbgDatePoints-${date}`).length).to.equal(0);
      expect(noDataContainer.querySelector('svg').querySelectorAll('g').length).to.equal(0);
      expect(noDataContainer.querySelectorAll('circle').length).to.equal(0);
    });
  });

  describe('when data is provided', () => {
    it('should render the appropriate number of smbgDatePoints <circle>s', () => {
      expect(container.querySelectorAll(`#smbgDatePoints-${date} circle`).length).to.equal(3);
    });
  });

  describe('interactions', () => {
    afterEach(() => {
      props.focusSmbg.resetHistory();
      props.unfocusSmbg.resetHistory();
      props.onSelectDate.resetHistory();
    });

    it('should call focusSmbg on mouseover of smbg circle', () => {
      const smbgCircle = container
        .querySelector(`#smbg-${data[0].id}`);
      expect(focusSmbg.callCount).to.equal(0);
      fireEvent.mouseOver(smbgCircle);
      expect(focusSmbg.args[0][0]).to.deep.equal(data[0]);
      expect(focusSmbg.callCount).to.equal(1);
    });

    it('should call unfocusSmbg on mouseout of smbg circle', () => {
      const smbgCircle = container
        .querySelector(`#smbg-${data[0].id}`);
      expect(unfocusSmbg.callCount).to.equal(0);
      fireEvent.mouseOut(smbgCircle);
      expect(unfocusSmbg.callCount).to.equal(1);
    });

    it('should call onSelectDate on click of smbg circle', () => {
      const smbgCircle = container
        .querySelector(`#smbg-${data[0].id}`);
      expect(onSelectDate.callCount).to.equal(0);
      fireEvent.click(smbgCircle);
      expect(onSelectDate.callCount).to.equal(1);
    });
  });
});
