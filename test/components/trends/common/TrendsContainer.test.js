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
import Chance from 'chance';
const chance = new Chance();
import { range } from 'd3-array';
import moment from 'moment-timezone';
import React from 'react';

import { render as rtlRender, cleanup, act } from '@testing-library/react/pure';

import { MGDL_UNITS, MMOLL_UNITS } from '../../../../src/utils/constants';
import { getTimezoneFromTimePrefs } from '../../../../src/utils/datetime';
import DummyComponent from '../../../helpers/DummyComponent';

import {
  TrendsContainer,
  getAllDatesInRange,
  getLocalizedNoonBeforeUTC,
  getLocalizedOffset,
} from '../../../../src/components/trends/common/TrendsContainer';

let mockTrendsSVGProps;

// Mock TrendsSVGContainer to avoid rendering its deep component tree
jest.mock('../../../../src/components/trends/common/TrendsSVGContainer', () => ({
  __esModule: true,
  default: (svgProps) => {
    mockTrendsSVGProps = svgProps;
    return require('react').createElement('div', { 'data-testid': 'TrendsSVGContainer' });
  },
}));

// Helper to create a render wrapper with instance access and setProps
function renderTrends(initialProps) {
  const ref = React.createRef();
  let currentProps = { ...initialProps, ref };
  const result = rtlRender(React.createElement(TrendsContainer, currentProps));
  return {
    ref,
    container: result.container,
    instance: () => ref.current,
    state: () => ref.current.state,
    setProps: (newProps) => {
      currentProps = { ...currentProps, ...newProps };
      result.rerender(React.createElement(TrendsContainer, { ...currentProps, ref }));
    },
  };
}

describe('TrendsContainer', () => {
  // stubbing console.warn gets rid of the annoying warnings from react-dimensions
  // due to not rendering TrendsContainer within a real app like blip
  // eslint-disable-next-line no-console
  const originalConsoleWarn = console.warn;
  // eslint-disable-next-line no-console
  console.warn = sinon.stub();

  after(() => {
    // eslint-disable-next-line no-console
    console.warn = originalConsoleWarn;
    cleanup();
  });

  describe('getAllDatesInRange', () => {
    it('should be a function', () => {
      assert.isFunction(getAllDatesInRange);
    });

    it('should return an array containing the date `2016-11-06`', () => {
      const start = '2016-11-06T05:00:00.000Z';
      const end = '2016-11-07T06:00:00.000Z';
      expect(getAllDatesInRange(start, end, {
        timezoneAware: true,
        timezoneName: 'US/Central',
      })).to.deep.equal(['2016-11-06']);
    });
  });

  describe('getLocalizedNoonBeforeUTC', () => {
    it('should be a function', () => {
      assert.isFunction(getLocalizedNoonBeforeUTC);
    });

    it('should error if passed a JavaScript Date for the `utc` param', () => {
      const fn = () => { getLocalizedNoonBeforeUTC(new Date()); };
      expect(fn)
        .to.throw('`utc` must be a ISO-formatted String timestamp or integer hammertime!');
    });

    it('[UTC, midnight input] should return the timestamp for the noon prior', () => {
      const dt = '2016-03-15T00:00:00.000Z';
      expect(getLocalizedNoonBeforeUTC(dt, { timezoneAware: false }).toISOString())
        .to.equal('2016-03-14T12:00:00.000Z');
      const asInteger = Date.parse(dt);
      expect(getLocalizedNoonBeforeUTC(asInteger, { timezoneAware: false }).toISOString())
        .to.equal('2016-03-14T12:00:00.000Z');
    });

    it('[UTC, anytime input] should return the timestamp for the noon prior', () => {
      const dt = '2016-03-14T02:36:25.342Z';
      expect(getLocalizedNoonBeforeUTC(dt, { timezoneAware: false }).toISOString())
        .to.equal('2016-03-14T12:00:00.000Z');
      const asInteger = Date.parse(dt);
      expect(getLocalizedNoonBeforeUTC(asInteger, { timezoneAware: false }).toISOString())
        .to.equal('2016-03-14T12:00:00.000Z');
    });

    it('[across DST] should return the timestamp for the noon prior', () => {
      const dt = '2016-03-14T05:00:00.000Z';
      const timePrefs = { timezoneAware: true, timezoneName: 'US/Central' };
      expect(getLocalizedNoonBeforeUTC(dt, timePrefs).toISOString())
        .to.equal('2016-03-13T17:00:00.000Z');
      const asInteger = Date.parse(dt);
      expect(getLocalizedNoonBeforeUTC(asInteger, timePrefs).toISOString())
        .to.equal('2016-03-13T17:00:00.000Z');
    });
  });

  describe('getLocalizedOffset', () => {
    it('should be a function', () => {
      assert.isFunction(getLocalizedOffset);
    });

    it('should error if passed a JavaScript Date for the `utc` param', () => {
      const fn = () => { getLocalizedOffset(new Date()); };
      expect(fn)
        .to.throw('`utc` must be a ISO-formatted String timestamp or integer hammertime!');
    });

    it('should offset from noon to noon across DST', () => {
      const dt = '2016-03-13T17:00:00.000Z';
      expect(getLocalizedOffset(dt, {
        amount: -10,
        units: 'days',
      }, {
        timezoneAware: true,
        timezoneName: 'US/Central',
      }).toISOString()).to.equal('2016-03-03T18:00:00.000Z');
    });
  });

  describe('TrendsContainer', () => {
    let minimalData;
    let enoughCbgData;

    let minimalDataMmol;
    let enoughCbgDataMmol;

    const extentSize = 7;
    const timezone = 'US/Pacific';

    const activeDays = {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    };
    const timePrefs = {
      timezoneAware: false,
      timezoneName: timezone,
    };
    const mostRecentDatetimeLocation = '2019-12-01T11:40:00.000Z';

    function domainDates(forProps) {
      const { extentSize: size, timePrefs: prefs } = forProps;
      const end = forProps.initialDatetimeLocation || forProps.mostRecentDatetimeLocation;
      const start = moment(end)
        .tz(getTimezoneFromTimePrefs(prefs))
        .subtract(size, 'days')
        .toISOString();
      return getAllDatesInRange(start, end, prefs);
    }

    function datesInView(forProps) {
      const { activeDays: days } = forProps;
      return _.filter(
        domainDates(forProps),
        date => days[_.toLower(moment.utc(date, 'YYYY-MM-DD').format('dddd'))]
      );
    }

    const domainSpec = {
      activeDays,
      extentSize,
      timePrefs,
      mostRecentDatetimeLocation,
    };
    const datesInDomain = domainDates(domainSpec);
    const activeDatesInView = datesInView(domainSpec);

    // Each datum needs a `localDate` or the bound under test filters it out. This
    // gives each one a date guaranteed to be in view; which one does not matter.
    function spreadOverDatesInView(datums) {
      return _.map(datums, (datum, i) => ({
        ...datum,
        localDate: activeDatesInView[i % activeDatesInView.length],
      }));
    }

    const devices = {
      dexcom: {
        id: 'DexG4Rec_XXXXXXXXX',
        cgmInDay: 288,
      },
      libre: {
        id: 'AbbottFreeStyleLibre_XXXXXXXXX',
        cgmInDay: 96,
      },
    };

    const justOneDatum = (device = devices.dexcom, type = 'cbg') => spreadOverDatesInView([{
      id: chance.hash({ length: 6 }),
      deviceId: device.id,
      msPer24: chance.integer({ min: 0, max: 864e5 }),
      type,
      value: 100,
    }]);
    const lowestBg = 25;
    const sevenDaysData = (device = devices.dexcom, type = 'cbg') => spreadOverDatesInView(
      _.map(range(0, device.cgmInDay * extentSize), () => ({
        id: chance.hash({ length: 6 }),
        deviceId: device.id,
        msPer24: chance.integer({ min: 0, max: 864e5 }),
        type,
        value: chance.pickone([lowestBg, 525]),
      }))
    );

    const sevenDaysDataMixedMinimum = (type = 'cbg') => spreadOverDatesInView(
      _.map(range(0, (devices.dexcom.cgmInDay / 4) * extentSize), () => ({
        id: chance.hash({ length: 6 }),
        deviceId: devices.dexcom.id,
        msPer24: chance.integer({ min: 0, max: 864e5 }),
        type,
        value: chance.pickone([lowestBg, 525]),
      })).concat(_.map(range(0, (devices.libre.cgmInDay / 4) * extentSize), () => ({
        id: chance.hash({ length: 6 }),
        deviceId: devices.libre.id,
        msPer24: chance.integer({ min: 0, max: 864e5 }),
        type,
        value: chance.pickone([lowestBg, 525]),
      })))
    );

    const justOneDatumMmol = (device = devices.dexcom, type = 'cbg') => spreadOverDatesInView([{
      id: chance.hash({ length: 6 }),
      deviceId: device.id,
      msPer24: chance.integer({ min: 0, max: 864e5 }),
      type,
      value: 5.2,
    }]);
    const lowestBgMmol = 3.1;
    const sevenDaysDataMmol = (device = devices.dexcom, type = 'cbg') => spreadOverDatesInView(
      _.map(range(0, device.cgmInDay * extentSize), () => ({
        id: chance.hash({ length: 6 }),
        deviceId: device.id,
        msPer24: chance.integer({ min: 0, max: 864e5 }),
        type,
        value: chance.pickone([lowestBgMmol, 28.4]),
      }))
    );

    function makeDataProp(data) {
      return {
        data: {
          data: {
            combined: data,
          },
        },
      };
    }

    const onDatetimeLocationChange = sinon.spy();
    const onSwitchBgDataSource = sinon.spy();
    const markTrendsViewed = sinon.spy();
    const unfocusCbgSlice = sinon.spy();
    const unfocusSmbg = sinon.spy();
    const unfocusSmbgRangeAvg = sinon.spy();

    const props = {
      activeDays,
      currentPatientInViewId: 'a1b2c3',
      extentSize,
      loading: false,
      showingSmbg: false,
      showingCbg: true,
      smbgRangeOverlay: true,
      smbgGrouped: true,
      smbgLines: false,
      smbgTrendsComponent: DummyComponent,
      timePrefs,
      yScaleClampTop: {
        [MGDL_UNITS]: 300,
        [MMOLL_UNITS]: 25,
      },
      mostRecentDatetimeLocation,
      onDatetimeLocationChange,
      onSelectDate: sinon.stub(),
      onSwitchBgDataSource,
      touched: false,
      cbgFlags: {
        cbg50Enabled: true,
        cbg80Enabled: true,
        cbg100Enabled: true,
        cbgMedianEnabled: true,
      },
      markTrendsViewed,
      unfocusCbgSlice,
      unfocusSmbg,
      unfocusSmbgRangeAvg,
      queryDataCount: 1,
    };

    const mgdl = {
      bgPrefs: {
        bgUnits: MGDL_UNITS,
        bgBounds: {
          veryHighThreshold: 300,
          targetUpperBound: 180,
          targetLowerBound: 80,
          veryLowThreshold: 60,
        },
      },
    };
    const mmoll = {
      bgPrefs: {
        bgUnits: MMOLL_UNITS,
        bgBounds: {
          veryHighThreshold: 30,
          targetUpperBound: 10,
          targetLowerBound: 4.4,
          veryLowThreshold: 3.5,
        },
      },
    };

    before(() => {
      minimalData = renderTrends({ ...props, ...mgdl, ...makeDataProp(justOneDatum()) });
    });

    afterEach(() => {
      onDatetimeLocationChange.resetHistory();
      onSwitchBgDataSource.resetHistory();
      markTrendsViewed.resetHistory();
    });

    describe('mountData', () => {
      let withInitialDatetimeLocation;

      before(() => {
        withInitialDatetimeLocation = renderTrends({
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
          initialDatetimeLocation: '2016-03-15T19:00:00.000Z',
        });

        act(() => {
          withInitialDatetimeLocation.instance().mountData();
          minimalData.instance().mountData();
        });
      });

      it('should set dateDomain to `mostRecentDateTimeLocation` prop ceiling if no initialDatetimeLocation', () => {
        const { dateDomain } = minimalData.state();
        expect(dateDomain.end).to.equal('2019-12-01T11:40:00.000Z');
      });

      it('should set dateDomain based on initialDatetimeLocation if provided', () => {
        const { dateDomain } = withInitialDatetimeLocation.state();
        expect(dateDomain.end).to.equal('2016-03-15T19:00:00.000Z');
      });

      it('should set dateDomain.start based on initialDatetimeLocation and extentSize', () => {
        const { dateDomain } = withInitialDatetimeLocation.state();
        expect(dateDomain.start).to.equal('2016-03-08T19:00:00.000Z');
      });

      it('should mark trends viewed as `touched` if not already touched', () => {
        expect(markTrendsViewed.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        }));
        expect(markTrendsViewed.callCount).to.equal(1);
      });

      it('should not mark trends view `touched` if already touched', () => {
        expect(markTrendsViewed.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ..._.merge({}, props, { touched: true }),
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        }));
        expect(markTrendsViewed.callCount).to.equal(0);
      });

      it('should toggle BG data source if not enough cbg data', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ...props,
          ...mgdl,
          ...makeDataProp([...justOneDatum(), ...justOneDatum(undefined, 'smbg')]),
        }));
        expect(onSwitchBgDataSource.callCount).to.equal(1);
      });

      it('should not toggle BG data source if enough cbg data (dexcom)', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ...props,
          ...mgdl,
          ...makeDataProp(sevenDaysData()),
        }));
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source if enough cbg data (libre)', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ...props,
          ...mgdl,
          ...makeDataProp(sevenDaysData(devices.libre)),
        }));
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source if enough cbg data (dexcom + libre mix)', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ...props,
          ...mgdl,
          ...makeDataProp(sevenDaysDataMixedMinimum()),
        }));
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source even if not enough cbg data if `touched`', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ..._.merge({}, props, { trendsState: { touched: true } }),
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        }));
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source even if not enough cbg data if there\'s no smbg data', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        rtlRender(React.createElement(TrendsContainer, {
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        }));
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });
    });

    describe('view bound', () => {
      // two different weekdays, so deselecting one is distinguishable from
      // emptying the view
      const firstInView = activeDatesInView[0];
      const secondInView = activeDatesInView[1];
      const firstInViewWeekday = _.toLower(moment.utc(firstInView, 'YYYY-MM-DD').format('dddd'));

      const deselectedWeekday = _.first(_.difference(datesInDomain, activeDatesInView));

      // step to the nearest *selected* weekday, not the adjacent day, so the
      // date range is the only reason these fall out of view
      function nearestActiveDateOutsideDomain(from, step) {
        let candidate = moment.utc(from, 'YYYY-MM-DD');
        do {
          candidate = candidate.add(step, 'days');
        } while (!activeDays[_.toLower(candidate.format('dddd'))]);
        return candidate.format('YYYY-MM-DD');
      }
      const beforeDomainStart = nearestActiveDateOutsideDomain(_.first(datesInDomain), -1);
      const afterDomainEnd = nearestActiveDateOutsideDomain(_.last(datesInDomain), 1);

      // the excluded values must stay outside [retainedLow, retainedHigh], or the
      // `bgDomain` and yScale cases go vacuous. 25 is below veryLowThreshold.
      const retainedLow = 120;
      const retainedHigh = 130;
      const boundData = type => ([
        { id: `${type}-in-view-first`, localDate: firstInView, msPer24: 36e5, type, value: retainedLow },
        { id: `${type}-in-view-second`, localDate: secondInView, msPer24: 72e5, type, value: retainedHigh },
        { id: `${type}-before-start`, localDate: beforeDomainStart, msPer24: 36e5, type, value: 25 },
        { id: `${type}-after-end`, localDate: afterDomainEnd, msPer24: 36e5, type, value: 525 },
        { id: `${type}-deselected-weekday`, localDate: deselectedWeekday, msPer24: 36e5, type, value: 30 },
      ]);

      const boundedProps = {
        ...props,
        ...mgdl,
        ...makeDataProp([...boundData('cbg'), ...boundData('smbg')]),
      };

      let bounded;
      let boundedSVGProps;
      let toggled;

      before(() => {
        bounded = renderTrends(boundedProps);
        boundedSVGProps = mockTrendsSVGProps;
      });

      afterEach(() => {
        mockTrendsSVGProps = undefined;
      });

      it('should retain the in-view cbg datums and exclude every out-of-view one', () => {
        expect(_.map(bounded.state().currentCbgData, 'id'))
          .to.deep.equal(['cbg-in-view-first', 'cbg-in-view-second']);
      });

      it('should retain the in-view smbg datums and exclude every out-of-view one', () => {
        expect(_.map(bounded.state().currentSmbgData, 'id'))
          .to.deep.equal(['smbg-in-view-first', 'smbg-in-view-second']);
      });

      it('should leave `bgDomain` unstretched by an out-of-window extreme value', () => {
        expect(bounded.state().bgDomain).to.deep.equal({ lo: retainedLow, hi: retainedHigh });
      });

      it('should leave the yScale domain unstretched by an out-of-window extreme value', () => {
        expect(bounded.state().yScale.domain()).to.deep.equal([
          mgdl.bgPrefs.bgBounds.veryLowThreshold,
          props.yScaleClampTop[MGDL_UNITS],
        ]);
      });

      it('should hand `TrendsSVGContainer` only dates present in its `dates` prop', () => {
        const { cbgData, smbgData, dates } = boundedSVGProps;
        expect(cbgData).to.have.length.above(0);
        expect(smbgData).to.have.length.above(0);
        expect(_.difference(_.uniq(_.map(cbgData, 'localDate')), dates)).to.deep.equal([]);
        expect(_.difference(_.uniq(_.map(smbgData, 'localDate')), dates)).to.deep.equal([]);
      });

      it('should drop a weekday\'s datums when `activeDays` changes with a `queryDataCount` bump', () => {
        toggled = renderTrends(boundedProps);
        expect(_.map(toggled.state().currentCbgData, 'id')).to.include('cbg-in-view-first');

        toggled.setProps({
          activeDays: { ...activeDays, [firstInViewWeekday]: false },
          queryDataCount: props.queryDataCount + 1,
        });

        const ids = _.map(toggled.state().currentCbgData, 'id');
        expect(ids).to.not.include('cbg-in-view-first');
        expect(ids).to.include('cbg-in-view-second');
      });
    });

    describe('componentWillMount', () => {
      let mountDataSpy;

      before(() => {
        mountDataSpy = sinon.spy(TrendsContainer.prototype, 'mountData');
      });

      after(() => {
        mountDataSpy.restore();
      });

      it('should call the `mountData` method', () => {
        rtlRender(React.createElement(TrendsContainer, {
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        }));
        sinon.assert.callCount(mountDataSpy, 1);
      });
    });

    describe('componentWillReceiveProps', () => {
      let mountDataSpy;

      before(() => {
        mountDataSpy = sinon.spy(TrendsContainer.prototype, 'mountData');
      });

      afterEach(() => {
        mountDataSpy.resetHistory();
      });

      after(() => {
        mountDataSpy.restore();
      });

      it('should call `mountData` if `loading` prop changes from true to false', () => {
        const container = renderTrends({
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        });
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ loading: true });
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ loading: false });
        sinon.assert.callCount(mountDataSpy, 1);
      });

      it('should not call `mountData` if `loading` prop does not change from true to false', () => {
        const container = renderTrends({
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        });
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ loading: false });
        sinon.assert.callCount(mountDataSpy, 0);
      });

      it('should call `mountData` if `queryDataCount` prop changes', () => {
        const container = renderTrends({
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        });
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ queryDataCount: 2 });
        sinon.assert.callCount(mountDataSpy, 1);
      });

      it('should not call `mountData` if `queryDataCount` prop does not change', () => {
        const container = renderTrends({
          ...props,
          ...mgdl,
          ...makeDataProp(justOneDatum()),
        });
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ queryDataCount: 1 });
        sinon.assert.callCount(mountDataSpy, 0);
      });
    });

    describe('yScale', () => {
      describe('mg/dL blood glucose units', () => {
        before(() => {
          enoughCbgData = renderTrends({ ...props, ...mgdl, ...makeDataProp(sevenDaysData()) });
        });

        it('should have `clamp` set to true', () => {
          const { yScale } = minimalData.state();
          expect(yScale.clamp()).to.be.true;
        });

        it('should have a minimum yScale domain: [veryLowThreshold, yScaleClampTop]', () => {
          const { yScale } = minimalData.state();
          expect(yScale.domain())
            .to.deep.equal(
              [mgdl.bgPrefs.bgBounds.veryLowThreshold, props.yScaleClampTop[MGDL_UNITS]]
            );
        });

        it('should have a minimum yScale domain: [targetLowerBound, yScaleClampTop] if veryLowThreshold is absent', () => {
          const mgdlMissingVeryLow = _.cloneDeep(mgdl);
          mgdlMissingVeryLow.bgPrefs.bgBounds.veryLowThreshold = null;

          minimalData = renderTrends({ ...props, ...mgdlMissingVeryLow, ...makeDataProp(justOneDatum()) });

          const { yScale } = minimalData.state();
          expect(yScale.domain())
            .to.deep.equal(
              [mgdl.bgPrefs.bgBounds.targetLowerBound, props.yScaleClampTop[MGDL_UNITS]]
            );
        });

        it('should have a maximum yScale domain: [lowest generated value, yScaleClampTop]', () => {
          const { yScale } = enoughCbgData.state();
          expect(yScale.domain())
            .to.deep.equal([lowestBg, props.yScaleClampTop[MGDL_UNITS]]);
        });
      });

      describe('mmol/L blood glucose units', () => {
        before(() => {
          enoughCbgDataMmol = renderTrends({ ...props, ...mmoll, ...makeDataProp(sevenDaysDataMmol()) });
          minimalDataMmol = renderTrends({ ...props, ...mmoll, ...makeDataProp(justOneDatumMmol()) });
        });

        it('should have `clamp` set to true', () => {
          const { yScale } = minimalDataMmol.state();
          expect(yScale.clamp()).to.be.true;
        });

        it('should have a minimum yScale domain: [veryLowThreshold, yScaleClampTop]', () => {
          const { yScale } = minimalDataMmol.state();
          expect(yScale.domain())
            .to.deep.equal(
              [mmoll.bgPrefs.bgBounds.veryLowThreshold, props.yScaleClampTop[MMOLL_UNITS]]
            );
        });

        it('should have a maximum yScale domain: [lowest generated value, yScaleClampTop]', () => {
          const { yScale } = enoughCbgDataMmol.state();
          expect(yScale.domain())
            .to.deep.equal([lowestBgMmol, props.yScaleClampTop[MMOLL_UNITS]]);
        });
      });
    });

    // NB: these exposed component functions are a compatibility interface layer
    // with the <Modal /> component in blip, so it's actually useful and
    // important to just validate through tests that the functions exist!
    describe('exposed component functions (called by parent <Modal /> in blip)', () => {
      describe('getCurrentDay', () => {
        let withInitialDatetimeLocation;

        before(() => {
          withInitialDatetimeLocation = renderTrends({
            ...props,
            ...mgdl,
            ...makeDataProp(justOneDatum()),
            initialDatetimeLocation: '2016-03-15T19:00:00.000Z',
          });
        });

        it('should exist and be a function', () => {
          assert.isFunction(minimalData.instance().getCurrentDay);
        });

        it('should return local noon prior to mostRecentDateTimeLocation if no initialDatetimeLocation', () => {
          const instance = minimalData.instance();
          const expectedRes = moment.utc(props.mostRecentDatetimeLocation)
            .startOf('day')
            .hours(12)
            .toISOString();
          expect(instance.getCurrentDay()).to.equal(expectedRes);
        });

        it('should return local noon prior to initialDatetimeLocation', () => {
          const instance = withInitialDatetimeLocation.instance();
          expect(instance.getCurrentDay())
            .to.equal('2016-03-15T12:00:00.000Z');
        });
      });

      describe('for navigation along time dimension', () => {
        // prior to this we used fixtures with timezoneAware: false for simplicity
        // now we set it to true to test proper time navigation with DST
        before(() => {
          minimalData.setProps({
            timePrefs: {
              timezoneAware: true,
              timezoneName: timezone,
            },
          });
        });

        describe('setExtent', () => {
          it('should exist and be a function', () => {
            assert.isFunction(minimalData.instance().setExtent);
          });

          it('should call onDatetimeLocationChange with domain', () => {
            const instance = minimalData.instance();
            expect(onDatetimeLocationChange.callCount).to.equal(0);
            const domain = ['2016-03-15T07:00:00.000Z', '2016-03-22T07:00:00.000Z'];
            instance.setExtent(domain);
            expect(onDatetimeLocationChange.callCount).to.equal(1);
            expect(onDatetimeLocationChange.args[0][0]).to.deep.equal(domain);
          });
        });

        describe('goBack', () => {
          it('should exist and be a function', () => {
            assert.isFunction(minimalData.instance().goBack);
          });

          it('should call setExtent and onDatetimeLocationChange', () => {
            const instance = minimalData.instance();
            const setExtentSpy = sinon.spy(instance, 'setExtent');

            expect(setExtentSpy.callCount).to.equal(0);
            expect(onDatetimeLocationChange.callCount).to.equal(0);

            instance.goBack();

            expect(setExtentSpy.callCount).to.equal(1);
            expect(onDatetimeLocationChange.callCount).to.equal(1);
            sinon.assert.calledWith(onDatetimeLocationChange, ['2019-11-17T11:40:00.000Z', '2019-11-24T11:40:00.000Z']);

            instance.setExtent.restore();
          });
        });

        describe('goForward', () => {
          it('should exist and be a function', () => {
            assert.isFunction(minimalData.instance().goForward);
          });

          it('should call setExtent & onDatetimeLocationChange', () => {
            const instance = minimalData.instance();
            const setExtentSpy = sinon.spy(instance, 'setExtent');

            const expectedDomain = [
              '2019-12-01T11:40:00.000Z',
              '2019-12-08T11:40:00.000Z',
            ];

            expect(setExtentSpy.callCount).to.equal(0);
            expect(onDatetimeLocationChange.callCount).to.equal(0);

            instance.goForward();

            expect(setExtentSpy.callCount).to.equal(1);
            expect(onDatetimeLocationChange.callCount).to.equal(1);
            expect(onDatetimeLocationChange.args[0][0]).to.deep.equal(expectedDomain);

            instance.setExtent.restore();
          });
        });

        describe('goToMostRecent', () => {
          it('should exist and be a function', () => {
            assert.isFunction(minimalData.instance().goToMostRecent);
          });

          it('should call setExtent and onDatetimeLocationChange', () => {
            const instance = minimalData.instance();
            const setExtentSpy = sinon.spy(instance, 'setExtent');

            expect(setExtentSpy.callCount).to.equal(0);
            expect(onDatetimeLocationChange.callCount).to.equal(0);

            instance.goToMostRecent();

            expect(setExtentSpy.callCount).to.equal(1);
            expect(onDatetimeLocationChange.callCount).to.equal(1);

            const { dateDomain: newDomain, mostRecent } = minimalData.state();
            expect(newDomain.end).to.equal(mostRecent);

            instance.setExtent.restore();
          });
        });

        describe('selectDate', () => {
          afterEach(() => {
            props.onSelectDate.resetHistory();
          });

          it('should exist and be a function', () => {
            assert.isFunction(minimalData.instance().selectDate);
          });
          const localDate = '2016-09-23';
          const dstBegin = '2016-03-13';
          const dstEnd = '2016-11-06';

          it('should call `onSelectDate` with `2016-09-23T19:00:00.000Z` on `2016-09-23`', () => {
            const midDayForDate = minimalData.instance().selectDate();
            midDayForDate(localDate);
            expect(props.onSelectDate.firstCall.args[0]).to.equal('2016-09-23T19:00:00.000Z');
          });

          it('should call `onSelectDate` with `2016-03-13T20:00:00.000Z` on `2016-03-13`', () => {
            const midDayForDate = minimalData.instance().selectDate();
            midDayForDate(dstBegin);
            expect(props.onSelectDate.firstCall.args[0]).to.equal('2016-03-13T20:00:00.000Z');
          });

          it('should call `onSelectDate` with `2016-11-06T19:00:00.000Z` on `2016-11-06`', () => {
            const midDayForDate = minimalData.instance().selectDate();
            midDayForDate(dstEnd);
            expect(props.onSelectDate.firstCall.args[0]).to.equal('2016-11-06T19:00:00.000Z');
          });
        });
      });
    });

    describe('render', () => {
      it('should render `TrendsSVGContainer`', () => {
        const { container } = rtlRender(React.createElement(TrendsContainer, {
          ...props, ...mgdl, ...makeDataProp(justOneDatum()),
        }));
        expect(container.querySelectorAll('[data-testid="TrendsSVGContainer"]')).to.have.length(1);
      });
    });
  });
});
