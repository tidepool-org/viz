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

import * as utils from '../../../src/utils/trends/data';

describe('[trends] data utils', () => {
  describe('findDatesIntersectingWithCbgSliceSegment', () => {
    const focusedSlice = {
      data: {
        msFrom: 0,
        msTo: 10,
        upperQuantile: 90,
        thirdQuartile: 75,
      },
    };
    const focusedSliceKeys = ['thirdQuartile', 'upperQuantile'];
    const cbgData = [{
      // ms in range, value = bottom of range
      localDate: '2016-12-31',
      msPer24: 5,
      value: 75,
    }, {
      // ms in range, value = top of range
      localDate: '2016-12-25',
      msPer24: 5,
      value: 90,
    }, {
      // ms in range, value in range
      localDate: '2016-12-30',
      msPer24: 5,
      value: 80,
    }, {
      // ms at bottom (= in range), value in range
      localDate: '2016-12-26',
      msPer24: 0,
      value: 80,
    }, {
      // ms at top (out of range), value in range
      localDate: '2017-01-05',
      msPer24: 10,
      value: 80,
    }, {
      // ms in range, value below range
      localDate: '2017-01-01',
      msPer24: 5,
      value: 10,
    }, {
      // ms in range, value above range
      localDate: '2017-01-02',
      msPer24: 5,
      value: 95,
    }];

    it('should be a function', () => {
      assert.isFunction(utils.findDatesIntersectingWithCbgSliceSegment);
    });

    it('returns an empty array on empty data', () => {
      expect(utils.findDatesIntersectingWithCbgSliceSegment(
        [], focusedSlice, focusedSliceKeys
      )).to.deep.equal([]);
    });

    it('should find four intersecting 2016 dates', () => {
      expect(utils.findDatesIntersectingWithCbgSliceSegment(
        cbgData, focusedSlice, focusedSliceKeys
      )).to.deep.equal([
        '2016-12-25',
        '2016-12-26',
        '2016-12-30',
        '2016-12-31',
      ]);
    });
  });

  describe('categorizeSmbgSubtype', () => {
    const missingSubtype = {};
    const manualSubtype = {
      subType: 'manual',
    };
    const nonManualSubtype = {
      subType: 'linked',
    };
    it('should be a function', () => {
      assert.isFunction(utils.categorizeSmbgSubtype);
    });
    it('should categorize a non-subTyped smbg as `meter`', () => {
      expect(utils.categorizeSmbgSubtype(missingSubtype)).to.equal('meter');
    });

    it('should categorize a `linked` smbg as `meter`', () => {
      expect(utils.categorizeSmbgSubtype(nonManualSubtype)).to.equal('meter');
    });

    it('should categorize a `manual` smbg as `manual`', () => {
      expect(utils.categorizeSmbgSubtype(manualSubtype)).to.equal('manual');
    });
  });

  describe('trendsText', () => {
    /* eslint-disable lines-between-class-members */
    class TextUtilStub {
      buildDocumentHeader = sinon.stub().returns('Trends Header, ');
      buildDocumentDates = sinon.stub().returns('Trends Dates, ');
      buildTextLine = sinon.stub().returns('Trends Excluded Dates Text, ');
    }
    /* eslint-enable lines-between-class-members */

    const patient = { profile: {
      fullName: 'John Doe',
      patient: {
        birthday: '2000-01-01',
        diagnosisDate: '2014-12-31',
      },
    } };

    const stats = [{ id: 'myStat' }];
    const endpoints = ['2019-02-01T00:00:00.000Z', '2019-02-20T00:00:00.000Z'];
    const timePrefs = { timezoneName: 'US/Eastern', timezoneAware: true };
    const chartPrefs = { activeDays: { monday: false, wednesday: false } };
    const bgPrefs = {};

    const data = {
      data: {
        current: {
          endpoints,
        },
      },
      bgPrefs,
      timePrefs,
    };

    let textUtilStub;

    before(() => {
      textUtilStub = new TextUtilStub();
      sinon.stub(utils.utils, 'TextUtil').returns(textUtilStub);
      sinon.stub(utils.utils, 'statsText').returns('Stats Text');
      sinon.stub(utils.utils, 'reshapeBgClassesToBgBounds').returns('BG Bounds');
    });

    afterEach(() => {
      utils.utils.TextUtil.resetHistory();
      utils.utils.statsText.resetHistory();
      utils.utils.reshapeBgClassesToBgBounds.resetHistory();
      textUtilStub.buildDocumentHeader.resetHistory();
      textUtilStub.buildDocumentDates.resetHistory();
      textUtilStub.buildTextLine.resetHistory();
    });

    after(() => {
      utils.utils.TextUtil.restore();
      utils.utils.statsText.restore();
      utils.utils.reshapeBgClassesToBgBounds.restore();
    });

    it('should reshape provided tideline-style bgPrefs to the viz format', () => {
      utils.trendsText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(utils.utils.reshapeBgClassesToBgBounds, 1);
      sinon.assert.calledWith(utils.utils.reshapeBgClassesToBgBounds, bgPrefs);
    });

    it('should return formatted text for Trends data', () => {
      const result = utils.trendsText(patient, data, stats, chartPrefs);
      expect(result).to.equal('Trends Header, Trends Dates, Trends Excluded Dates Text, Stats Text');
    });

    it('should build the document header section', () => {
      utils.trendsText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(textUtilStub.buildDocumentHeader, 1);
      sinon.assert.calledWith(textUtilStub.buildDocumentHeader, 'Trends');
    });

    it('should build the document dates section', () => {
      utils.trendsText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(textUtilStub.buildDocumentDates, 1);
    });

    it('should build the excluded dates when days are excluded', () => {
      utils.trendsText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(textUtilStub.buildTextLine, 1);
      sinon.assert.calledWith(textUtilStub.buildTextLine, { label: 'Excluded Days', value: 'Monday, Wednesday' });
    });

    it('should not build the excluded dates when no days are excluded', () => {
      utils.trendsText(patient, data, stats, { activeDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      } });
      sinon.assert.callCount(textUtilStub.buildTextLine, 0);
    });

    it('should build the trends stats section', () => {
      utils.trendsText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(utils.utils.statsText, 1);
      sinon.assert.calledWith(utils.utils.statsText, stats, textUtilStub, bgPrefs);
    });
  });
});
