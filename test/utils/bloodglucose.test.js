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

/* eslint-disable max-len */

import _ from 'lodash';
import * as bgUtils from '../../src/utils/bloodglucose';
import { range, shuffle } from 'd3-array';

import { DEFAULT_BG_BOUNDS, MGDL_UNITS, MMOLL_UNITS, MS_IN_HOUR, MS_IN_MIN } from '../../src/utils/constants';

describe('blood glucose utilities', () => {
  const bgBounds = {
    veryHighThreshold: 300,
    targetUpperBound: 180,
    targetLowerBound: 70,
    veryLowThreshold: 55,
  };

  describe('classifyBgValue', () => {
    it('should be a function', () => {
      assert.isFunction(bgUtils.classifyBgValue);
    });

    it('should error if no `bgBounds` with numerical lower & upper bounds provided', () => {
      const fn1 = () => { bgUtils.classifyBgValue(null, 100); };
      expect(fn1).to.throw(
        'You must provide a `bgBounds` object with a `targetLowerBound` and a `targetUpperBound`!'
      );
      const fn2 = () => { bgUtils.classifyBgValue(undefined, 100); };
      expect(fn2).to.throw(
        'You must provide a `bgBounds` object with a `targetLowerBound` and a `targetUpperBound`!'
      );
      const fn3 = () => { bgUtils.classifyBgValue({}, 100); };
      expect(fn3).to.throw(
        'You must provide a `bgBounds` object with a `targetLowerBound` and a `targetUpperBound`!'
      );
      const fn4 = () => { bgUtils.classifyBgValue({ foo: 'bar' }, 100); };
      expect(fn4).to.throw(
        'You must provide a `bgBounds` object with a `targetLowerBound` and a `targetUpperBound`!'
      );
      const fn5 = () => {
        bgUtils.classifyBgValue({ targetLowerBound: 80, targetUpperBound: 'one eighty' }, 100);
      };
      expect(fn5).to.throw(
        'You must provide a `bgBounds` object with a `targetLowerBound` and a `targetUpperBound`!'
      );
    });

    it('should error if no `bgValue` or non-numerical `bgValue`', () => {
      const fn0 = () => { bgUtils.classifyBgValue(bgBounds); };
      expect(fn0).to.throw(
        'You must provide a positive, numerical blood glucose value to categorize!'
      );
      const fn1 = () => { bgUtils.classifyBgValue(bgBounds, null); };
      expect(fn1).to.throw(
        'You must provide a positive, numerical blood glucose value to categorize!'
      );
      const fn2 = () => { bgUtils.classifyBgValue(bgBounds, undefined); };
      expect(fn2).to.throw(
        'You must provide a positive, numerical blood glucose value to categorize!'
      );
      const fn3 = () => { bgUtils.classifyBgValue(bgBounds, {}); };
      expect(fn3).to.throw(
        'You must provide a positive, numerical blood glucose value to categorize!'
      );
      const fn4 = () => { bgUtils.classifyBgValue(bgBounds, -100); };
      expect(fn4).to.throw(
        'You must provide a positive, numerical blood glucose value to categorize!'
      );
      const fn5 = () => { bgUtils.classifyBgValue(bgBounds, 4.4); };
      expect(fn5).to.not.throw;
      const fn6 = () => { bgUtils.classifyBgValue(bgBounds, 100); };
      expect(fn6).to.not.throw;
    });

    describe('three-way classification (low, target, high)', () => {
      it('should return `low` for a value < the `targetLowerBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 69)).to.equal('low');
      });

      it('should return `target` for a value equal to the `targetLowerBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 70)).to.equal('target');
      });

      it('should return `target` for a value > `targetLowerBound` and < `targetUpperBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 100)).to.equal('target');
      });

      it('should return `target` for a value equal to the `targetUpperBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 180)).to.equal('target');
      });

      it('should return `high` for a value > the `targetUpperBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 181)).to.equal('high');
      });
    });

    describe('five-way classification (veryLow, low, target, high, veryHigh)', () => {
      it('should return `veryLow` for a value < the `veryLowThreshold`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 54, 'fiveWay')).to.equal('veryLow');
      });

      it('should return `low` for a value equal to the `veryLowThreshold`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 55, 'fiveWay')).to.equal('low');
      });

      it('should return `low` for a value < the `targetLowerBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 69, 'fiveWay')).to.equal('low');
      });

      it('should return `target` for a value equal to the `targetLowerBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 70, 'fiveWay')).to.equal('target');
      });

      it('should return `target` for a value > `targetLowerBound` and < `targetUpperBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 100, 'fiveWay')).to.equal('target');
      });

      it('should return `target` for a value equal to the `targetUpperBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 180, 'fiveWay')).to.equal('target');
      });

      it('should return `high` for a value > the `targetUpperBound`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 181, 'fiveWay')).to.equal('high');
      });

      it('should return `high` for a value equal to the `veryHighThreshold`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 300, 'fiveWay')).to.equal('high');
      });

      it('should return `veryHigh` for a value > the `veryHighThreshold`', () => {
        expect(bgUtils.classifyBgValue(bgBounds, 301, 'fiveWay')).to.equal('veryHigh');
      });
    });
  });

  describe('classifyCvValue', () => {
    it('should return `target` for any value <= 0.36', () => {
      expect(bgUtils.classifyCvValue(36)).to.equal('target');
      expect(bgUtils.classifyCvValue(35.9)).to.equal('target');
    });

    it('should return `high` for any value > 0.36', () => {
      expect(bgUtils.classifyCvValue(36.1)).to.equal('high');
    });
  });

  describe('generateBgRangeLabels', () => {
    const bounds = {
      mgdl: {
        extremeHighThreshold: 350,
        veryHighThreshold: 300.12345,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 55,
      },
      mmoll: {
        extremeHighThreshold: 19.4,
        veryHighThreshold: 16.666667,
        targetUpperBound: 10,
        targetLowerBound: 3.9,
        veryLowThreshold: 3.1,
      },
    };

    it('should generate formatted range labels for mg/dL BG prefs', () => {
      const bgPrefs = {
        bgBounds: bounds.mgdl,
        bgUnits: 'mg/dL',
      };

      const result = bgUtils.generateBgRangeLabels(bgPrefs);

      expect(result).to.eql({
        veryLow: 'below 55 mg/dL',
        low: 'between 55 - 70 mg/dL',
        target: 'between 70 - 180 mg/dL',
        high: 'between 180 - 300 mg/dL',
        veryHigh: 'above 300 mg/dL',
        extremeHigh: 'above 350 mg/dL',
      });
    });

    it('should generate condensed formatted range labels for mg/dL BG prefs when condensed option set', () => {
      const bgPrefs = {
        bgBounds: bounds.mgdl,
        bgUnits: 'mg/dL',
      };

      const result = bgUtils.generateBgRangeLabels(bgPrefs, { condensed: true });

      expect(result).to.eql({
        veryLow: '<55',
        low: '55-70',
        target: '70-180',
        high: '180-300',
        veryHigh: '>300',
        extremeHigh: '>350',
      });
    });

    it('should generate segmented formatted range labels for mg/dL BG prefs when segmented option set', () => {
      const bgPrefs = {
        bgBounds: bounds.mgdl,
        bgUnits: 'mg/dL',
      };

      const result = bgUtils.generateBgRangeLabels(bgPrefs, { segmented: true });

      expect(result).to.eql({
        veryLow: {
          prefix: 'below',
          suffix: bgPrefs.bgUnits,
          value: '55',
        },
        low: {
          prefix: 'between',
          suffix: bgPrefs.bgUnits,
          value: '55-70',
        },
        target: {
          prefix: 'between',
          suffix: bgPrefs.bgUnits,
          value: '70-180',
        },
        high: {
          prefix: 'between',
          suffix: bgPrefs.bgUnits,
          value: '180-300',
        },
        veryHigh: {
          prefix: 'above',
          suffix: bgPrefs.bgUnits,
          value: '300',
        },
        extremeHigh: {
          prefix: 'above',
          suffix: bgPrefs.bgUnits,
          value: '350',
        },
      });
    });

    it('should generate formatted range labels for mmol/L BG prefs', () => {
      const bgPrefs = {
        bgBounds: bounds.mmoll,
        bgUnits: 'mmol/L',
      };

      const result = bgUtils.generateBgRangeLabels(bgPrefs);

      expect(result).to.eql({
        veryLow: 'below 3.1 mmol/L',
        low: 'between 3.1 - 3.9 mmol/L',
        target: 'between 3.9 - 10.0 mmol/L',
        high: 'between 10.0 - 16.7 mmol/L',
        veryHigh: 'above 16.7 mmol/L',
        extremeHigh: 'above 19.4 mmol/L',
      });
    });

    it('should generate condensed formatted range labels for mmol/L BG prefs when condensed option set', () => {
      const bgPrefs = {
        bgBounds: bounds.mmoll,
        bgUnits: 'mmol/L',
      };

      const result = bgUtils.generateBgRangeLabels(bgPrefs, { condensed: true });

      expect(result).to.eql({
        veryLow: '<3.1',
        low: '3.1-3.9',
        target: '3.9-10.0',
        high: '10.0-16.7',
        veryHigh: '>16.7',
        extremeHigh: '>19.4',
      });
    });

    it('should generate segmented formatted range labels for mmol/L BG prefs when segmented option set', () => {
      const bgPrefs = {
        bgBounds: bounds.mmoll,
        bgUnits: 'mmol/L',
      };

      const result = bgUtils.generateBgRangeLabels(bgPrefs, { segmented: true });

      expect(result).to.eql({
        veryLow: {
          prefix: 'below',
          suffix: bgPrefs.bgUnits,
          value: '3.1',
        },
        low: {
          prefix: 'between',
          suffix: bgPrefs.bgUnits,
          value: '3.1-3.9',
        },
        target: {
          prefix: 'between',
          suffix: bgPrefs.bgUnits,
          value: '3.9-10.0',
        },
        high: {
          prefix: 'between',
          suffix: bgPrefs.bgUnits,
          value: '10.0-16.7',
        },
        veryHigh: {
          prefix: 'above',
          suffix: bgPrefs.bgUnits,
          value: '16.7',
        },
        extremeHigh: {
          prefix: 'above',
          suffix: bgPrefs.bgUnits,
          value: '19.4',
        },
      });
    });
  });

  describe('convertToMmolL', () => {
    it('should be a function', () => {
      assert.isFunction(bgUtils.convertToMmolL);
    });

    it('should return 2.2202991964182135 when given 40', () => {
      expect(bgUtils.convertToMmolL(40)).to.equal(2.2202991964182135);
    });

    it('should return 22.202991964182132 when given 400', () => {
      expect(bgUtils.convertToMmolL(400)).to.equal(22.202991964182132);
    });
  });

  describe('convertToMGDL', () => {
    it('should be a function', () => {
      assert.isFunction(bgUtils.convertToMGDL);
    });

    it('should return 72.06236 when given 4', () => {
      expect(bgUtils.convertToMGDL(4)).to.equal(72.06236);
    });

    it('should return 180.1559 when given 10', () => {
      expect(bgUtils.convertToMGDL(10)).to.equal(180.1559);
    });
  });

  describe('reshapeBgClassesToBgBounds', () => {
    const bgPrefs = {
      bgClasses: {
        'very-high': { boundary: 600 },
        high: { boundary: 300 },
        target: { boundary: 180 },
        low: { boundary: 75 },
        'very-low': { boundary: 54 },
      },
      bgUnits: 'mg/dL',
    };

    it('should be a function', () => {
      assert.isFunction(bgUtils.reshapeBgClassesToBgBounds);
    });

    it('should extract and reshape `bgClasses` to `bgBounds`', () => {
      expect(bgUtils.reshapeBgClassesToBgBounds(bgPrefs)).to.deep.equal({
        extremeHighThreshold: 350,
        veryHighThreshold: 300,
        targetUpperBound: 180,
        targetLowerBound: 75,
        veryLowThreshold: 54,
        clampThreshold: 600,
      });
    });

    it('should fall back to a default bg bound if a bg class is missing', () => {
      const missingLowClass = { ...bgPrefs, bgClasses: { ...bgPrefs.bgClasses, low: undefined } };
      expect(bgUtils.reshapeBgClassesToBgBounds(missingLowClass)).to.deep.equal({
        extremeHighThreshold: 350,
        veryHighThreshold: 300,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 54,
        clampThreshold: 600,
      });
    });
  });

  describe('getOutOfRangeThreshold', () => {
    it('should return a high out-of-range threshold for a high datum', () => {
      const datum = {
        type: 'smbg',
        value: 601,
        annotations: [
          {
            code: 'bg/out-of-range',
            threshold: 600,
            value: 'high',
          },
        ],
      };

      expect(bgUtils.getOutOfRangeThreshold(datum)).to.deep.equal({
        high: 600,
      });
    });

    it('should return a low out-of-range threshold for a low datum', () => {
      const datum = {
        type: 'smbg',
        value: 32,
        annotations: [
          {
            code: 'bg/out-of-range',
            threshold: 40,
            value: 'low',
          },
        ],
      };

      expect(bgUtils.getOutOfRangeThreshold(datum)).to.deep.equal({
        low: 40,
      });
    });

    it('should return null for an in-range datum', () => {
      const datum = {
        type: 'smbg',
        value: 100,
      };

      expect(bgUtils.getOutOfRangeThreshold(datum)).to.equal(null);
    });
  });

  describe('weightedCGMCount', () => {
    it('should return a count of 1 for every cgm datum by default', () => {
      const data = _.map(_.range(0, 10), () => ({
        deviceId: 'Dexcom_XXXXXXX',
        type: 'cbg',
      }));

      expect(bgUtils.weightedCGMCount(data)).to.equal(data.length);
    });

    it('should return a count of 1 for every cgm datum by default when missing the deviceId property', () => {
      const data = _.map(_.range(0, 10), () => ({
        type: 'cbg',
      }));

      expect(bgUtils.weightedCGMCount(data)).to.equal(data.length);
    });

    it('should return a count of 3 for every FreeStyle Libre cgm datum by default', () => {
      const data = _.map(_.range(0, 10), () => ({
        deviceId: 'AbbottFreeStyleLibre_XXXXXXX',
        type: 'cbg',
      }));

      expect(bgUtils.weightedCGMCount(data)).to.equal(data.length * 3);
    });

    it('should properly handle a mix of FreeStyle Libre and Dexcom data', () => {
      const data = _.map(_.range(0, 10), () => ({
        deviceId: 'Dexcom_XXXXXXX',
      })).concat(_.map(_.range(0, 10), () => ({
        deviceId: 'AbbottFreeStyleLibre_XXXXXXX',
        type: 'cbg',
      })));

      expect(bgUtils.weightedCGMCount(data)).to.equal(40);
    });
  });

  describe('cgmSampleFrequency', () => {
    it('should get the CGM sample frequency in milliseconds from a CGM data point', () => {
      const dexcomDatum = {
        deviceId: 'Dexcom_XXXXXXX',
      };
      expect(bgUtils.cgmSampleFrequency(dexcomDatum)).to.equal(5 * MS_IN_MIN);

      const libreDatum = {
        deviceId: 'AbbottFreeStyleLibre_XXXXXXX',
      };
      expect(bgUtils.cgmSampleFrequency(libreDatum)).to.equal(15 * MS_IN_MIN);

      const libre3Datum = {
        deviceId: 'AbbottFreeStyleLibre3_XXXXXXX',
      };
      expect(bgUtils.cgmSampleFrequency(libre3Datum)).to.equal(5 * MS_IN_MIN);

      const libre2CIQDatum = {
        sampleInterval: MS_IN_MIN,
      };

      const g7CIQDatum = {
        deviceId: 'tandemCIQ_XXXXX',
        payload: { g7: true },
      };

      const g6CIQDatum = {
        deviceId: 'tandemCIQ_XXXXX',
        payload: { g6: true },
      };

      expect(bgUtils.cgmSampleFrequency(libre2CIQDatum)).to.equal(MS_IN_MIN);
      expect(bgUtils.cgmSampleFrequency(g7CIQDatum)).to.equal(5 * MS_IN_MIN);
      expect(bgUtils.cgmSampleFrequency(g6CIQDatum)).to.equal(5 * MS_IN_MIN);
    });
  });

  describe('isCustomBgRange', () => {
    const defaultBGPrefsMgdl = {
      bgBounds: DEFAULT_BG_BOUNDS[MGDL_UNITS],
      bgUnits: MGDL_UNITS,
    };

    const defaultBGPrefsMmoll = {
      bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
      bgUnits: MMOLL_UNITS,
    };

    it('should return `false` if the provided BG range is using the default BG bounds', () => {
      expect(bgUtils.isCustomBgRange(defaultBGPrefsMgdl)).to.be.false;
      expect(bgUtils.isCustomBgRange(defaultBGPrefsMmoll)).to.be.false;
    });

    it('should return `true` if the provided BG range is using a custom lower target', () => {
      expect(bgUtils.isCustomBgRange({
        ...defaultBGPrefsMgdl,
        bgBounds: {
          ...defaultBGPrefsMgdl.bgBounds,
          targetLowerBound: 90,
        },
      })).to.be.true;

      expect(bgUtils.isCustomBgRange({
        ...defaultBGPrefsMmoll,
        bgBounds: {
          ...defaultBGPrefsMmoll.bgBounds,
          targetLowerBound: 3.5,
        },
      })).to.be.true;
    });

    it('should return `true` if the provided BG range is using a custom upper target', () => {
      expect(bgUtils.isCustomBgRange({
        ...defaultBGPrefsMgdl,
        bgBounds: {
          ...defaultBGPrefsMgdl.bgBounds,
          targetUpperBound: 190,
        },
      })).to.be.true;

      expect(bgUtils.isCustomBgRange({
        ...defaultBGPrefsMmoll,
        bgBounds: {
          ...defaultBGPrefsMmoll.bgBounds,
          targetUpperBound: 10.5,
        },
      })).to.be.true;
    });
  });

  describe('determineRangeBoundaries', () => {
    it('should be a function', () => {
      assert.isFunction(bgUtils.determineRangeBoundaries);
    });

    it('should return the max of all provided `low` thresholds', () => {
      expect(bgUtils.determineRangeBoundaries([{
        value: 'low',
        threshold: 20,
      }, {
        value: 'low',
        threshold: 25,
      }, {
        value: 'low',
        threshold: 15,
      }])).to.deep.equal({ low: 25 });
    });

    it('should return the min of all provided `high` thresholds', () => {
      expect(bgUtils.determineRangeBoundaries([{
        value: 'high',
        threshold: 650,
      }, {
        value: 'high',
        threshold: 500,
      }, {
        value: 'high',
        threshold: 600,
      }])).to.deep.equal({ high: 500 });
    });

    it('should return both boundaries when a mix of out-of-range objects is provided', () => {
      expect(bgUtils.determineRangeBoundaries([{
        value: 'high',
        threshold: 500,
      }, {
        value: 'low',
        threshold: 20,
      }, {
        value: 'low',
        threshold: 40,
      }])).to.deep.equal({ low: 40, high: 500 });
    });
  });

  describe('findBinForTimeOfDay', () => {
    it('should be a function', () => {
      assert.isFunction(bgUtils.findBinForTimeOfDay);
    });

    describe('error conditions', () => {
      it('should error on a negative msPer24', () => {
        const fn = () => (bgUtils.findBinForTimeOfDay(1, -1));
        expect(fn).to.throw('`msPer24` < 0 or >= 86400000 is invalid!');
      });

      it('should error on a msPer24 = 864e5', () => {
        const fn = () => (bgUtils.findBinForTimeOfDay(1, 86400000));
        expect(fn).to.throw('`msPer24` < 0 or >= 86400000 is invalid!');
      });

      it('should error on a msPer24 > 864e5', () => {
        const fn = () => (bgUtils.findBinForTimeOfDay(1, 86400001));
        expect(fn).to.throw('`msPer24` < 0 or >= 86400000 is invalid!');
      });
    });

    describe('when `binSize` is one hour (3600000ms)', () => {
      const binSize = 1000 * 60 * 60;

      it('should assign a bin of `1800000` to a datum at time 0', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 0)).to.equal(1800000);
      });

      it('should assign a bin of `1800000` to a datum at time 3599999', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 3599999)).to.equal(1800000);
      });

      it('should assign a bin of `5400000` to a datum at time 3600000', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 3600000)).to.equal(5400000);
      });

      it('should assign a bin of `5400000` to a datum at time 7199999', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 7199999)).to.equal(5400000);
      });
    });

    describe('when `binSize` is thirty minutes (1800000ms)', () => {
      const binSize = 1000 * 60 * 30;

      it('should assign a bin of `900000` to a datum at time 0', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 0)).to.equal(900000);
      });

      it('should assign a bin of `2700000` to a datum at time 3599999', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 3599999)).to.equal(2700000);
      });

      it('should assign a bin of `4500000` to a datum at time 3600000', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 3600000)).to.equal(4500000);
      });

      it('should assign a bin of `6300000` to a datum at time 7199999', () => {
        expect(bgUtils.findBinForTimeOfDay(binSize, 7199999)).to.equal(6300000);
      });
    });
  });

  describe('findOutOfRangeAnnotations', () => {
    it('should be a function', () => {
      assert.isFunction(bgUtils.findOutOfRangeAnnotations);
    });

    it('should return an empty array if none of the data is annotated `bg/out-of-range`', () => {
      expect(bgUtils.findOutOfRangeAnnotations([])).to.deep.equal([]);
      expect(bgUtils.findOutOfRangeAnnotations([{}, {}, {}])).to.deep.equal([]);
      expect(bgUtils.findOutOfRangeAnnotations([{}, { annotations: [{ code: 'foo' }] }]))
        .to.deep.equal([]);
    });

    it('should return an array of the annotations w/unique thresholds', () => {
      expect(bgUtils.findOutOfRangeAnnotations([{
        annotations: [{
          code: 'bg/out-of-range',
          value: 'high',
          threshold: 500,
        }],
      }, {
        annotations: [{
          code: 'bg/out-of-range',
          value: 'low',
          threshold: 25,
        }],
      }, {
        annotations: [{
          code: 'bg/out-of-range',
          value: 'high',
          threshold: 500,
        }],
      }])).to.deep.equal([{
        value: 'high',
        threshold: 500,
      }, {
        value: 'low',
        threshold: 25,
      }]);
    });
  });

  describe('calculateCbgStatsForBin', () => {
    const bin = 900000;
    const binKey = bin.toString();
    const binSize = 1000 * 60 * 30;
    const min = 0;
    const max = 100;
    const data = shuffle(range(min, max + 1));

    const res = bgUtils.calculateCbgStatsForBin(binKey, binSize, data);

    it('should be a function', () => {
      assert.isFunction(bgUtils.calculateCbgStatsForBin);
    });

    it('should produce result full of `undefined`s on empty values array', () => {
      const emptyValsRes = bgUtils.calculateCbgStatsForBin(binKey, binSize, []);
      assert.isObject(emptyValsRes);
      expect(emptyValsRes).to.deep.equal({
        id: binKey,
        min: undefined,
        lowerQuantile: undefined,
        firstQuartile: undefined,
        median: undefined,
        thirdQuartile: undefined,
        upperQuantile: undefined,
        max: undefined,
        msX: bin,
        msFrom: 0,
        msTo: bin * 2,
      });
    });

    it('should add the `binKey` as the `id` on the resulting object', () => {
      assert.isString(res.id);
      expect(res.id).to.equal(binKey);
    });

    it('should add the minimum as the `min` on the resulting object', () => {
      expect(res.min).to.equal(min);
    });

    it('should add the 10th quantile as the `lowerQuantile` on the resulting object', () => {
      expect(res.lowerQuantile).to.equal(10);
    });

    it('should add the first quartile as the `firstQuartile` on the resulting object', () => {
      expect(res.firstQuartile).to.equal(25);
    });

    it('should add the median as `median` on the resulting object', () => {
      expect(res.median).to.equal(50);
    });

    it('should add the third quartile as the `thirdQuartile` on the resulting object', () => {
      expect(res.thirdQuartile).to.equal(75);
    });

    it('should add the 90th quantile as the `upperQuantile` on the resulting object', () => {
      expect(res.upperQuantile).to.equal(90);
    });

    it('should add the maximum as the `max` on the resulting object', () => {
      expect(res.max).to.equal(max);
    });

    it('should add the bin as `msX` on the resulting object', () => {
      expect(res.msX).to.equal(bin);
    });

    it('should add a `msFrom` to the resulting object half a bin earlier', () => {
      expect(res.msFrom).to.equal(0);
    });

    it('should add a `msTo` to the resulting object half a bin later', () => {
      expect(res.msTo).to.equal(1800000);
    });

    describe('when an array of out-of-range annotations is provided', () => {
      const outOfRange = [{
        value: 'low',
        threshold: 25,
      }, {
        value: 'low',
        threshold: 40,
      }, {
        value: 'high',
        threshold: 500,
      }, {
        value: 'high',
        threshold: 400,
      }];
      const resWithOutOfRange = bgUtils.calculateCbgStatsForBin(binKey, binSize, data, outOfRange);

      it('should add `outOfRangeThresholds` to the resulting object', () => {
        expect(resWithOutOfRange.outOfRangeThresholds).to.deep.equal({
          low: 40,
          high: 400,
        });
      });
    });
  });

  describe('calculateSmbgStatsForBin', () => {
    const bin = 5400000;
    const binKey = bin.toString();
    const binSize = 1000 * 60 * 60 * 3;
    const min = 0;
    const max = 100;
    const data = shuffle(range(min, max + 1));

    const res = bgUtils.calculateSmbgStatsForBin(binKey, binSize, data);

    it('should be a function', () => {
      assert.isFunction(bgUtils.calculateSmbgStatsForBin);
    });

    it('should produce result full of `undefined`s on empty values array', () => {
      const emptyValsRes = bgUtils.calculateSmbgStatsForBin(binKey, binSize, []);
      assert.isObject(emptyValsRes);
      expect(emptyValsRes).to.deep.equal({
        id: binKey,
        min: undefined,
        mean: undefined,
        max: undefined,
        msX: bin,
        msFrom: 0,
        msTo: bin * 2,
        firstQuartile: undefined,
        median: undefined,
        thirdQuartile: undefined,
      });
    });

    it('should add the `binKey` as the `id` on the resulting object', () => {
      assert.isString(res.id);
      expect(res.id).to.equal(binKey);
    });

    it('should add the minimum as the `min` on the resulting object', () => {
      expect(res.min).to.equal(min);
    });

    it('should add the mean as the `mean` on the resulting object', () => {
      expect(res.mean).to.equal(50);
    });

    it('should add the maximum as the `max` on the resulting object', () => {
      expect(res.max).to.equal(max);
    });

    it('should add the bin as `msX` on the resulting object', () => {
      expect(res.msX).to.equal(bin);
    });

    describe('when an array of out-of-range annotations is provided', () => {
      const outOfRange = [{
        value: 'low',
        threshold: 25,
      }, {
        value: 'low',
        threshold: 40,
      }, {
        value: 'high',
        threshold: 500,
      }, {
        value: 'high',
        threshold: 400,
      }];
      const resWithOutOfRange = bgUtils.calculateSmbgStatsForBin(binKey, binSize, data, outOfRange);

      it('should add `outOfRangeThresholds` to the resulting object', () => {
        expect(resWithOutOfRange.outOfRangeThresholds).to.deep.equal({
          low: 40,
          high: 400,
        });
      });
    });
  });

  describe('mungeBGDataBins', () => {
    it('should munge SMBG data appropriately without quartiles if insufficient data for them', () => {
      const bgType = 'smbg';
      const binSize = MS_IN_HOUR;

      const data = [
        { msPer24: 181000, value: 101 },
        { msPer24: 182000, value: 102 },
        { msPer24: 183000, value: 103 },
        { msPer24: 84601000, value: 100 },
        { msPer24: 84602000, value: 120 },
        { msPer24: 84603000, value: 200 },
      ];

      const mungedData = bgUtils.mungeBGDataBins(bgType, binSize, data);
      expect(mungedData).to.be.an('array').and.to.have.lengthOf(24);

      expect(_.first(mungedData)).to.eql({
        id: '1800000',
        min: 101,
        mean: 102,
        max: 103,
        msX: 1800000,
        msFrom: 0,
        msTo: 3600000,
        firstQuartile: undefined,
        median: 102,
        thirdQuartile: undefined,
      });

      expect(_.last(mungedData)).to.eql({
        id: '84600000',
        min: 100,
        mean: 140,
        max: 200,
        msX: 84600000,
        msFrom: 82800000,
        msTo: 86400000,
        firstQuartile: undefined,
        median: 120,
        thirdQuartile: undefined,
      });
    });

    it('should munge SMBG data appropriately including quartiles if sufficient data for them', () => {
      const bgType = 'smbg';
      const binSize = MS_IN_HOUR;

      const data = [
        { msPer24: 181000, value: 101 },
        { msPer24: 182000, value: 102 },
        { msPer24: 183000, value: 103 },
        { msPer24: 183000, value: 104 },
        { msPer24: 183000, value: 105 },
        { msPer24: 84601000, value: 100 },
        { msPer24: 84602000, value: 120 },
        { msPer24: 84603000, value: 200 },
        { msPer24: 84604000, value: 180 },
        { msPer24: 84605000, value: 150 },
      ];

      const mungedData = bgUtils.mungeBGDataBins(bgType, binSize, data);
      expect(mungedData).to.be.an('array').and.to.have.lengthOf(24);

      expect(_.first(mungedData)).to.eql({
        id: '1800000',
        min: 101,
        mean: 103,
        max: 105,
        msX: 1800000,
        msFrom: 0,
        msTo: 3600000,
        firstQuartile: 102,
        median: 103,
        thirdQuartile: 104,
      });

      expect(_.last(mungedData)).to.eql({
        id: '84600000',
        min: 100,
        mean: 150,
        max: 200,
        msX: 84600000,
        msFrom: 82800000,
        msTo: 86400000,
        firstQuartile: 120,
        median: 150,
        thirdQuartile: 180,
      });
    });

    it('should munge CBG data', () => {
      const bgType = 'cbg';
      const binSize = MS_IN_HOUR;

      const data = [
        { msPer24: 181000, value: 101 },
        { msPer24: 182000, value: 102 },
        { msPer24: 183000, value: 103 },
        { msPer24: 84601000, value: 100 },
        { msPer24: 84602000, value: 120 },
        { msPer24: 84603000, value: 200 },
      ];

      const outerQuantiles = [0.1, 0.9];
      const mungedData = bgUtils.mungeBGDataBins(bgType, binSize, data, outerQuantiles);
      expect(mungedData).to.be.an('array').and.to.have.lengthOf(24);

      expect(_.first(mungedData)).to.eql({
        id: '1800000', min: 101, lowerQuantile: 101.2, firstQuartile: 101.5, median: 102, thirdQuartile: 102.5, upperQuantile: 102.8, max: 103, msX: 1800000, msFrom: 0, msTo: 3600000,
      });

      expect(_.last(mungedData)).to.eql({
        id: '84600000', min: 100, lowerQuantile: 104, firstQuartile: 110, median: 120, thirdQuartile: 160, upperQuantile: 184, max: 200, msX: 84600000, msFrom: 82800000, msTo: 86400000,
      });
    });
  });
});
/* eslint-enable max-len */
