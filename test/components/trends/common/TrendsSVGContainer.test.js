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

import { render as rtlRender, cleanup } from '@testing-library/react/pure';

import bgBounds from '../../../helpers/bgBounds';

import { TrendsSVGContainer } from '../../../../src/components/trends/common/TrendsSVGContainer';

import { MGDL_UNITS } from '../../../../src/utils/constants';

// Mock react-sizeme (used by source file's default export)
jest.mock('react-sizeme', () => ({
  __esModule: true,
  default: () => (Component) => Component,
}));

// Mock all child components rendered by TrendsSVGContainer
jest.mock('../../../../src/components/trends/common/Background', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'Background' }),
}));

jest.mock('../../../../src/components/trends/common/XAxisLabels', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'XAxisLabels' }),
}));

jest.mock('../../../../src/components/trends/common/XAxisTicks', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'XAxisTicks' }),
}));

jest.mock('../../../../src/components/trends/common/YAxisLabelsAndTicks', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'YAxisLabelsAndTicks' }),
}));

jest.mock('../../../../src/components/trends/cbg/CBGSlicesContainer', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'CBGSlicesContainer' }),
}));

jest.mock('../../../../src/components/trends/cbg/CBGDateTracesAnimationContainer', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'CBGDateTracesAnimationContainer' }),
}));

jest.mock('../../../../src/components/trends/cbg/FocusedCBGSliceSegment', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../../src/components/trends/smbg/SMBGsByDateContainer', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'SMBGsByDateContainer' }),
}));

jest.mock('../../../../src/components/trends/smbg/SMBGRangeAvgContainer', () => ({
  __esModule: true,
  default: (props) => require('react').createElement('g', {
    'data-testid': 'SMBGRangeAvgContainer',
    'data-data': JSON.stringify(props.data),
  }),
}));

jest.mock('../../../../src/components/trends/common/NoData', () => ({
  __esModule: true,
  default: (props) => require('react').createElement('g', {
    'data-testid': 'NoData',
    'data-type': props.dataType || '',
    'data-unselected': String(!!props.unselectedAllData),
  }),
}));

jest.mock('../../../../src/components/trends/common/TargetRangeLines', () => ({
  __esModule: true,
  default: () => require('react').createElement('g', { 'data-testid': 'TargetRangeLines' }),
}));

function makeScale(scale) {
  // eslint-disable-next-line no-param-reassign
  scale.range = sinon.stub().returns([0, 10]);
  return scale;
}

describe('TrendsSVGContainer', () => {
  const props = {
    activeDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    bgPrefs: {
      bgBounds,
      bgUnits: MGDL_UNITS,
    },
    // normally provided by react-sizeme wrapper but we test w/o that
    size: {
      width: 960,
      height: 520,
    },
    dates: [],
    cbgData: [{ id: 'a2b3c4', localDate: '2017-01-01', msPer24: 6000, value: 180 }],
    smbgData: [{ id: 'a2b3c4', localDate: '2016-07-04', msPer24: 6000, value: 180 }],
    displayFlags: {
      cbg100Enabled: false,
      cbg80Enabled: true,
      cbg50Enabled: true,
      cbgMedianEnabled: true,
    },
    onSelectDate: () => {},
    showingCbg: true,
    showingCbgDateTraces: false,
    showingSmbg: false,
    smbgGrouped: true,
    smbgLines: true,
    smbgRangeOverlay: true,
    timezone: 'UTC',
    xScale: makeScale(() => {}),
    yScale: makeScale(() => {}),
  };

  afterEach(() => {
    cleanup();
    // Safely restore any prototype spies left over from failed tests
    ['setScales', 'UNSAFE_componentWillMount', 'UNSAFE_componentWillReceiveProps', 'setState'].forEach((method) => {
      if (TrendsSVGContainer.prototype[method] && TrendsSVGContainer.prototype[method].restore) {
        TrendsSVGContainer.prototype[method].restore();
      }
    });
    props.xScale.range.resetHistory();
    props.yScale.range.resetHistory();
  });

  describe('setScales', () => {
    it('should set the range of the xScale', () => {
      sinon.spy(TrendsSVGContainer.prototype, 'setScales');
      expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(0);
      rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(1);
      expect(props.xScale.range.callCount).to.equal(1);
      expect(props.xScale.range.firstCall.args[0]).to.deep.equal([48, 942]);
      TrendsSVGContainer.prototype.setScales.restore();
    });

    it('should set the range of the yScale', () => {
      sinon.spy(TrendsSVGContainer.prototype, 'setScales');
      expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(0);
      rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(1);
      expect(props.yScale.range.callCount).to.equal(1);
      expect(props.yScale.range.firstCall.args[0]).to.deep.equal([480, 80]);
      TrendsSVGContainer.prototype.setScales.restore();
    });
  });

  describe('componentWillMount', () => {
    it('should call the `setScales` method', () => {
      sinon.spy(TrendsSVGContainer.prototype, 'setScales');
      sinon.spy(TrendsSVGContainer.prototype, 'UNSAFE_componentWillMount');
      expect(TrendsSVGContainer.prototype.UNSAFE_componentWillMount.callCount).to.equal(0);
      expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(0);
      rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(TrendsSVGContainer.prototype.UNSAFE_componentWillMount.callCount).to.equal(1);
      expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(1);
      TrendsSVGContainer.prototype.UNSAFE_componentWillMount.restore();
      TrendsSVGContainer.prototype.setScales.restore();
    });
  });

  describe('componentWillReceiveProps', () => {
    describe('when yScale changes', () => {
      it('should call the `setScales` method', () => {
        sinon.spy(TrendsSVGContainer.prototype, 'setScales');
        const { rerender } = rtlRender(React.createElement(TrendsSVGContainer, props));
        TrendsSVGContainer.prototype.setScales.resetHistory();
        expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(0);

        rerender(React.createElement(TrendsSVGContainer, {
          ...props,
          yScale: _.assign({}, props.yScale, { changed: true }),
        }));
        expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(1);

        TrendsSVGContainer.prototype.setScales.restore();
      });
    });

    describe('when yScale does not change', () => {
      it('should not call the `setScales` method', () => {
        sinon.spy(TrendsSVGContainer.prototype, 'setScales');
        const { rerender } = rtlRender(React.createElement(TrendsSVGContainer, props));
        TrendsSVGContainer.prototype.setScales.resetHistory();
        expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(0);

        rerender(React.createElement(TrendsSVGContainer, {
          ...props,
          someChange: true,
        }));
        expect(TrendsSVGContainer.prototype.setScales.callCount).to.equal(0);

        TrendsSVGContainer.prototype.setScales.restore();
      });
    });

    describe('when showingCbgDateTraces is true', () => {
      let localRerender;
      const cwrpProps = _.assign({}, props, { showingCbgDateTraces: true });

      beforeEach(() => {
        const result = rtlRender(React.createElement(TrendsSVGContainer, cwrpProps));
        localRerender = result.rerender;
      });

      describe('when a cbg slice segment has been focused long enough', () => {
        it('should set focusedSegmentDataGroupedByDate in state', () => {
          sinon.spy(TrendsSVGContainer.prototype, 'UNSAFE_componentWillReceiveProps');
          sinon.spy(TrendsSVGContainer.prototype, 'setState');
          const focusedSlice = {
            data: {
              msFrom: 0,
              msTo: 10000,
              upperQuantile: 200,
              thirdQuartile: 75,
            },
          };
          const focusedSliceKeys = ['thirdQuartile', 'upperQuantile'];
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(0);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(0);
          localRerender(React.createElement(TrendsSVGContainer, {
            ...cwrpProps,
            cbgData: props.cbgData,
            focusedSlice,
            focusedSliceKeys,
          }));
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(1);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(2);
          expect(TrendsSVGContainer.prototype.setState.args[0][0]).to.deep.equal({
            size: {
              width: 960,
              height: 520,
            },
            chartWidth: 960 - 70,
          });
          expect(TrendsSVGContainer.prototype.setState.args[1][0]).to.deep.equal({
            focusedSegmentDataGroupedByDate: {
              '2017-01-01': props.cbgData,
            },
          });
          TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.restore();
          TrendsSVGContainer.prototype.setState.restore();
        });
      });

      describe('when you\'ve moved to focus a different cbg slice segment', () => {
        it('should calculate new focusedSegmentDataGroupedByDate object', () => {
          sinon.spy(TrendsSVGContainer.prototype, 'UNSAFE_componentWillReceiveProps');
          sinon.spy(TrendsSVGContainer.prototype, 'setState');
          const focusedSlice = {
            data: {
              msFrom: 0,
              msTo: 10000,
              firstQuartile: 25,
              thirdQuartile: 75,
            },
          };
          const focusedSliceKeys = ['firstQuartile', 'thirdQuartile'];
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(0);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(0);
          localRerender(React.createElement(TrendsSVGContainer, {
            ...cwrpProps,
            focusedSlice,
            focusedSliceKeys,
          }));
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(1);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(2);
          expect(TrendsSVGContainer.prototype.setState.args[1][0]).to.deep.equal({
            focusedSegmentDataGroupedByDate: {},
          });
          TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.restore();
          TrendsSVGContainer.prototype.setState.restore();
        });
      });

      describe('when you\'ve just stopped focusing a cbg slice segment', () => {
        it('should reset focusedSegmentDataGroupedByDate to `null` in state', () => {
          sinon.spy(TrendsSVGContainer.prototype, 'UNSAFE_componentWillReceiveProps');
          sinon.spy(TrendsSVGContainer.prototype, 'setState');
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(0);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(0);
          localRerender(React.createElement(TrendsSVGContainer, {
            ...cwrpProps,
            focusedSlice: null,
            focusedSliceKeys: null,
            showingCbgDateTraces: false,
          }));
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(1);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(2);
          expect(TrendsSVGContainer.prototype.setState.args[1][0]).to.deep.equal({
            focusedSegmentDataGroupedByDate: null,
          });
          TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.restore();
          TrendsSVGContainer.prototype.setState.restore();
        });
      });
    });

    describe('when showingCbgDateTraces is false', () => {
      let localRerender;
      beforeEach(() => {
        const result = rtlRender(React.createElement(TrendsSVGContainer, props));
        localRerender = result.rerender;
      });

      describe('when you haven\'t focused a cbg slice segment', () => {
        it('should not set the `focusedSegmentDataGroupedByDate` state in componentWillReceiveProps', () => {
          sinon.spy(TrendsSVGContainer.prototype, 'UNSAFE_componentWillReceiveProps');
          sinon.spy(TrendsSVGContainer.prototype, 'setState');
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(0);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(0);
          localRerender(React.createElement(TrendsSVGContainer, {
            ...props,
            activeDays: {
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: true,
              sunday: true,
            },
          }));
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(1);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(1);
          expect(TrendsSVGContainer.prototype.setState.args[0][0]).to.not.include.keys('focusedSegmentDataGroupedByDate');
          TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.restore();
          TrendsSVGContainer.prototype.setState.restore();
        });
      });

      describe('when you\'ve just focused a cbg slice segment', () => {
        it('should not set the `focusedSegmentDataGroupedByDate` state in componentWillReceiveProps', () => {
          sinon.spy(TrendsSVGContainer.prototype, 'UNSAFE_componentWillReceiveProps');
          sinon.spy(TrendsSVGContainer.prototype, 'setState');
          const focusedSlice = {
            data: {
              msFrom: 0,
              msTo: 10000,
              upperQuantile: 200,
              thirdQuartile: 75,
            },
          };
          const focusedSliceKeys = ['thirdQuartile', 'upperQuantile'];
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(0);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(0);
          localRerender(React.createElement(TrendsSVGContainer, {
            ...props,
            cbgData: props.cbgData,
            focusedSlice,
            focusedSliceKeys,
          }));
          expect(TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(1);
          expect(TrendsSVGContainer.prototype.setState.callCount).to.equal(1);
          TrendsSVGContainer.prototype.UNSAFE_componentWillReceiveProps.restore();
          TrendsSVGContainer.prototype.setState.restore();
        });
      });
    });
  });

  describe('render', () => {
    it('should render a Background', () => {
      const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(container.querySelectorAll('[data-testid="Background"]')).to.have.length(1);
    });

    it('should render a XAxisLabels', () => {
      const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(container.querySelectorAll('[data-testid="XAxisLabels"]')).to.have.length(1);
    });

    it('should render a XAxisTicks', () => {
      const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(container.querySelectorAll('[data-testid="XAxisTicks"]')).to.have.length(1);
    });

    it('should render a YAxisLabelsAndTicks', () => {
      const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(container.querySelectorAll('[data-testid="YAxisLabelsAndTicks"]')).to.have.length(1);
    });

    it('should render a CBGSlicesContainer', () => {
      const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(container.querySelectorAll('[data-testid="CBGSlicesContainer"]')).to.have.length(1);
    });

    it('should render a TargetRangeLines', () => {
      const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
      expect(container.querySelectorAll('[data-testid="TargetRangeLines"]')).to.have.length(1);
    });

    it('should render the TargetRangeLines on top', () => {
      const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
      const svgEl = container.querySelector('svg');
      const lastChild = svgEl.lastElementChild;
      expect(lastChild.getAttribute('data-testid')).to.equal('TargetRangeLines');
    });

    describe('showing CGM data', () => {
      it('should render a CBGSlicesContainer', () => {
        const { container } = rtlRender(React.createElement(TrendsSVGContainer, props));
        expect(container.querySelectorAll('[data-testid="CBGSlicesContainer"]')).to.have.length(1);
      });

      it('should render a unselected all data message when all days unselected', () => {
        const unselectedProps = _.assign({}, props, { cbgData: [], activeDays: { monday: false } });
        const { container } = rtlRender(React.createElement(TrendsSVGContainer, unselectedProps));
        expect(container.querySelectorAll('[data-testid="NoData"]')).to.have.length(1);
        expect(container.querySelector('[data-testid="NoData"]').getAttribute('data-unselected')).to.equal('true');
      });

      describe('when showingSmbg is false', () => {
        it('should not render an SMBGRangeAvgContainer', () => {
          // With smbgRangeOverlay also false to isolate SMBG display behavior
          const noSmbgProps = _.assign({}, props, { smbgRangeOverlay: false });
          const { container } = rtlRender(React.createElement(TrendsSVGContainer, noSmbgProps));
          expect(container.querySelectorAll('[data-testid="SMBGRangeAvgContainer"]')).to.have.length(0);
        });
      });

      it('should render a no data message when there are no cbg values', () => {
        const noCBGDataProps = _.assign({}, props, { cbgData: [] });
        const { container } = rtlRender(React.createElement(TrendsSVGContainer, noCBGDataProps));
        expect(container.querySelectorAll('[data-testid="NoData"]')).to.have.length(1);
        expect(container.querySelector('[data-testid="NoData"]').getAttribute('data-type')).to.equal('cbg');
      });
    });

    describe('showing BGM data', () => {
      it('should render a unselected all data message when all days unselected', () => {
        const unselectedProps = _.assign(
          {},
          props,
          { showingCbg: false, showingSmbg: true, smbgData: [], activeDays: { monday: false } }
        );
        const { container } = rtlRender(React.createElement(TrendsSVGContainer, unselectedProps));
        expect(container.querySelectorAll('[data-testid="NoData"]')).to.have.length(1);
        expect(container.querySelector('[data-testid="NoData"]').getAttribute('data-unselected')).to.equal('true');
      });

      describe('when smbgRangeOverlay is true', () => {
        it('should render an SMBGRangeAvgContainer each for range and mean', () => {
          const smbgRangeProps = _.assign(
            {}, props, { showingSmbg: true, smbgRangeOverlay: true }
          );
          const { container } = rtlRender(React.createElement(TrendsSVGContainer, smbgRangeProps));
          expect(container.querySelectorAll('[data-testid="SMBGRangeAvgContainer"]')).to.have.length(2);
        });
      });

      describe('when smbgRangeOverlay is false', () => {
        it('should render SMBGRangeAvgContainers with empty data (to get exit animation)', () => {
          const smbgRangeProps = _.assign(
            {}, props, { showingSmbg: true, smbgRangeOverlay: false }
          );
          const { container } = rtlRender(React.createElement(TrendsSVGContainer, smbgRangeProps));
          const rangeAvgContainers = container.querySelectorAll('[data-testid="SMBGRangeAvgContainer"]');
          expect(rangeAvgContainers).to.have.length(2);
          // eslint-disable-next-line lodash/prefer-lodash-method
          rangeAvgContainers.forEach((el) => {
            expect(JSON.parse(el.getAttribute('data-data'))).to.deep.equal([]);
          });
        });
      });

      describe('when showingCbg is false', () => {
        it('should not render a CBGSlicesContainer', () => {
          const noCbgProps = _.assign({}, props, { showingCbg: false, showingSmbg: true });
          const { container } = rtlRender(React.createElement(TrendsSVGContainer, noCbgProps));
          expect(container.querySelectorAll('[data-testid="CBGSlicesContainer"]')).to.have.length(0);
          expect(container.querySelectorAll('[data-testid="SMBGRangeAvgContainer"]')).to.have.length(2);
        });
      });

      it('should render a no data message when there are no smbg values', () => {
        const noSMBGDataProps = _.assign(
          {}, props, { showingCbg: false, showingSmbg: true, smbgData: [] }
        );
        const { container } = rtlRender(React.createElement(TrendsSVGContainer, noSMBGDataProps));
        expect(container.querySelectorAll('[data-testid="NoData"]')).to.have.length(1);
        expect(container.querySelector('[data-testid="NoData"]').getAttribute('data-type')).to.equal('smbg');
      });
    });
  });
});
