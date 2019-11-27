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

import { shallow } from 'enzyme';

import { MGDL_UNITS, MMOLL_UNITS } from '../../../../src/utils/constants';
import DummyComponent from '../../../helpers/DummyComponent';

import {
  TrendsContainer,
  getAllDatesInRange,
  getLocalizedNoonBeforeUTC,
  getLocalizedOffset,
} from '../../../../src/components/trends/common/TrendsContainer';
import TrendsSVGContainer from '../../../../src/components/trends/common/TrendsSVGContainer';

describe('TrendsContainer', () => {
  // stubbing console.warn gets rid of the annoying warnings from react-dimensions
  // due to not rendering TrendsContainer within a real app like blip
  // eslint-disable-next-line no-console
  console.warn = sinon.stub();

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

    const justOneDatum = (device = devices.dexcom, type = 'cbg') => [{
      id: chance.hash({ length: 6 }),
      deviceId: device.id,
      msPer24: chance.integer({ min: 0, max: 864e5 }),
      type,
      value: 100,
    }];
    const lowestBg = 25;
    const sevenDaysData = (device = devices.dexcom, type = 'cbg') => (
      _.map(range(0, device.cgmInDay * extentSize), () => ({
        id: chance.hash({ length: 6 }),
        deviceId: device.id,
        msPer24: chance.integer({ min: 0, max: 864e5 }),
        type,
        value: chance.pickone([lowestBg, 525]),
      }))
    );

    const sevenDaysDataMixedMinimum = (type = 'cbg') => (
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

    const justOneDatumMmol = (device = devices.dexcom, type = 'cbg') => [{
      id: chance.hash({ length: 6 }),
      deviceId: device.id,
      msPer24: chance.integer({ min: 0, max: 864e5 }),
      type,
      value: 5.2,
    }];
    const lowestBgMmol = 3.1;
    const sevenDaysDataMmol = (device = devices.dexcom, type = 'cbg') => (
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
      activeDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      currentPatientInViewId: 'a1b2c3',
      extentSize,
      loading: false,
      showingSmbg: false,
      showingCbg: true,
      smbgRangeOverlay: true,
      smbgGrouped: true,
      smbgLines: false,
      smbgTrendsComponent: DummyComponent,
      timePrefs: {
        timezoneAware: false,
        timezoneName: timezone,
      },
      yScaleClampTop: {
        [MGDL_UNITS]: 300,
        [MMOLL_UNITS]: 25,
      },
      mostRecentDatetimeLocation: '2019-12-01T20:00:00.000Z',
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
      minimalData = shallow(
        <TrendsContainer {...props} {...mgdl} {...makeDataProp(justOneDatum())} />,
      );
    });

    afterEach(() => {
      onDatetimeLocationChange.resetHistory();
      onSwitchBgDataSource.resetHistory();
      markTrendsViewed.resetHistory();
    });

    describe('mountData', () => {
      let withInitialDatetimeLocation;

      before(() => {
        withInitialDatetimeLocation = shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
            initialDatetimeLocation="2016-03-15T19:00:00.000Z"
          />
        );

        withInitialDatetimeLocation.instance().mountData();
        minimalData.instance().mountData();
      });

      it('should set dateDomain to `mostRecentDateTimeLocation` prop ceiling if no initialDatetimeLocation', () => {
        const { dateDomain } = minimalData.state();
        expect(dateDomain.end).to.equal('2019-12-02T00:00:00.000Z');
      });

      it('should set dateDomain based on initialDatetimeLocation if provided', () => {
        const { dateDomain } = withInitialDatetimeLocation.state();
        expect(dateDomain.end).to.equal('2016-03-16T00:00:00.000Z');
      });

      it('should set dateDomain.start based on initialDatetimeLocation and extentSize', () => {
        const { dateDomain } = withInitialDatetimeLocation.state();
        expect(dateDomain.start).to.equal('2016-03-09T00:00:00.000Z');
      });

      it('should mark trends viewed as `touched` if not already touched', () => {
        expect(markTrendsViewed.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
        expect(markTrendsViewed.callCount).to.equal(1);
      });

      it('should not mark trends view `touched` if already touched', () => {
        expect(markTrendsViewed.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {..._.merge({}, props, { touched: true })}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
        expect(markTrendsViewed.callCount).to.equal(0);
      });

      it('should toggle BG data source if not enough cbg data', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp([...justOneDatum(), ...justOneDatum(undefined, 'smbg')])}
          />
        );
        expect(onSwitchBgDataSource.callCount).to.equal(1);
      });

      it('should not toggle BG data source if enough cbg data (dexcom)', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(sevenDaysData())}
          />
        );
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source if enough cbg data (libre)', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(sevenDaysData(devices.libre))}
          />
        );
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source if enough cbg data (dexcom + libre mix)', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(sevenDaysDataMixedMinimum())}
          />
        );
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source even if not enough cbg data if `touched`', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {..._.merge({}, props, { trendsState: { touched: true } })}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
        expect(onSwitchBgDataSource.callCount).to.equal(0);
      });

      it('should not toggle BG data source even if not enough cbg data if there\'s no smbg data', () => {
        expect(onSwitchBgDataSource.callCount).to.equal(0);
        shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum(), { cbg: true, smbg: false })}
          />
        );
        expect(onSwitchBgDataSource.callCount).to.equal(0);
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
        shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
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
        const container = shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ loading: true });
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ loading: false });
        sinon.assert.callCount(mountDataSpy, 1);
      });

      it('should not call `mountData` if `loading` prop does not change from true to false', () => {
        const container = shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ loading: false });
        sinon.assert.callCount(mountDataSpy, 0);
      });

      it('should call `mountData` if `queryDataCount` prop changes', () => {
        const container = shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ queryDataCount: 2 });
        sinon.assert.callCount(mountDataSpy, 1);
      });

      it('should not call `mountData` if `queryDataCount` prop does not change', () => {
        const container = shallow(
          <TrendsContainer
            {...props}
            {...mgdl}
            {...makeDataProp(justOneDatum())}
          />
        );
        mountDataSpy.resetHistory();
        sinon.assert.callCount(mountDataSpy, 0);

        container.setProps({ queryDataCount: 1 });
        sinon.assert.callCount(mountDataSpy, 0);
      });
    });

    describe('yScale', () => {
      describe('mg/dL blood glucose units', () => {
        before(() => {
          enoughCbgData = shallow(
            <TrendsContainer {...props} {...mgdl} {...makeDataProp(sevenDaysData())} />
          );
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

        it('should have a maximum yScale domain: [lowest generated value, yScaleClampTop]', () => {
          const { yScale } = enoughCbgData.state();
          expect(yScale.domain())
            .to.deep.equal([lowestBg, props.yScaleClampTop[MGDL_UNITS]]);
        });
      });

      describe('mmol/L blood glucose units', () => {
        before(() => {
          enoughCbgDataMmol = shallow(
            <TrendsContainer {...props} {...mmoll} {...makeDataProp(sevenDaysDataMmol())} />
          );
          minimalDataMmol = shallow(
            <TrendsContainer {...props} {...mmoll} {...makeDataProp(justOneDatumMmol())} />
          );
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
          withInitialDatetimeLocation = shallow(
            <TrendsContainer
              {...props}
              {...mgdl}
              {...makeDataProp(justOneDatum())}
              initialDatetimeLocation="2016-03-15T19:00:00.000Z"
            />
          );
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
            sinon.assert.calledWith(onDatetimeLocationChange, ['2019-11-18T00:00:00.000Z', '2019-11-25T00:00:00.000Z']);

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
              '2019-12-02T00:00:00.000Z',
              '2019-12-09T00:00:00.000Z',
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
        const wrapper = shallow(
          <TrendsContainer {...props} {...mgdl} {...makeDataProp(justOneDatum())} />
        );
        expect(wrapper.find(TrendsSVGContainer)).to.have.length(1);
      });
    });
  });
});
