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
 * not, you can obtain one from Tidepoorol Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

import _ from 'lodash';
import moment from 'moment';

import * as dataUtils from '../../../src/utils/print/data';
import Types from '../../../data/types';
import { MS_IN_HOUR } from '../../../src/utils/constants';

describe('print data utils', () => {
  const data = {
    '2018-01-02': {
      cbg: [
        new Types.CBG({ value: 20 }),
        new Types.CBG({ value: 40 }),
      ],
      smbg: [
        new Types.SMBG({ value: 5 }),
        new Types.SMBG({ value: 30 }),
      ],
      bolus: [
        new Types.Bolus({ value: 10, deviceTime: '2018-01-02T05:00:00' }),
        new Types.Bolus({ value: 20, deviceTime: '2018-01-02T08:00:00' }),
      ],
      basal: [
        new Types.Basal({ rate: 0.125 }),
        new Types.Basal({ rate: 0.175 }),
      ],
    },
    '2018-01-03': {
      cbg: [
        new Types.CBG({ value: 50 }),
      ],
      smbg: [
        new Types.SMBG({ value: 25 }),
      ],
      bolus: [
        new Types.Bolus({ value: 3, deviceTime: '2018-01-03T05:00:00' }),
        new Types.Bolus({ value: 15, deviceTime: '2018-01-03T08:00:00' }),
      ],
      basal: [
        new Types.Basal({ id: 'foo', rate: 0.25, deviceTime: '2018-01-02T23:00:00', duration: MS_IN_HOUR * 2 }),
        new Types.Basal({ id: 'bar', rate: 0.125, deviceTime: '2018-01-03T01:00:00', duration: MS_IN_HOUR * 2 }),
        new Types.Basal({ id: 'baz', rate: 0.375, deviceTime: '2018-01-03T23:00:00', duration: MS_IN_HOUR * 2 }),
      ],
    },
  };

  let dataByDate;

  beforeEach(() => {
    dataByDate = _.cloneDeep(data);
  });

  describe('processBgRange', () => {
    it('should return the extents of provided BG datums by date', () => {
      expect(dataUtils.processBgRange(dataByDate)).to.eql([5, 50]);
    });
  });

  describe('processBolusRange', () => {
    it('should return the extents of provided boluses by date', () => {
      expect(dataUtils.processBolusRange(dataByDate, 'UTC')).to.eql([3, 20]);
    });

    it('should set the `threeHrBin` prop of each bolus based on the provided timezoneName', () => {
      dataUtils.processBolusRange(dataByDate, 'UTC');
      expect(dataByDate['2018-01-03'].bolus[0].threeHrBin).to.equal(3);
      expect(dataByDate['2018-01-03'].bolus[1].threeHrBin).to.equal(6);

      dataUtils.processBolusRange(dataByDate, 'US/Eastern');
      expect(dataByDate['2018-01-03'].bolus[0].threeHrBin).to.equal(0);
      expect(dataByDate['2018-01-03'].bolus[1].threeHrBin).to.equal(3);
    });
  });

  describe('processBasalRange', () => {
    it('should return basal range, setting lowest extent to `0` and multiplying the highest by `1.1`', () => {
      expect(dataUtils.processBasalRange(dataByDate)).to.eql([0, (0.375 * 1.1)]);
    });
  });

  describe('processBasalSequencesForDate', () => {
    let dateData;
    const bounds = [
      moment.utc('2018-01-03').valueOf(),
      moment.utc('2018-01-03').add(1, 'day').valueOf(),
    ];

    beforeEach(() => {
      dateData = dataByDate['2018-01-03'];
    });

    it('should trim the first and last basals to fit within the date\'s bounds', () => {
      expect(dateData.basal[0].normalTime).to.equal(Date.parse('2018-01-02T23:00:00'));
      expect(dateData.basal[2].duration).to.equal(MS_IN_HOUR * 2);

      dataUtils.processBasalSequencesForDate(dateData, bounds);
      expect(dateData.basal[0].normalTime).to.equal(Date.parse('2018-01-03T00:00:00'));
      expect(dateData.basal[2].duration).to.equal(MS_IN_HOUR);
    });

    it('should set the `discontinuousEnd` and `discontinuousStart` properties to `true` on non-contiguous basals', () => {
      dataUtils.processBasalSequencesForDate(dateData, bounds);
      expect(dateData.basal[1].discontinuousEnd).to.be.true;
      expect(dateData.basal[2].discontinuousStart).to.be.true;
    });

    it('should assign `basalSequences` to the provided `dataData`', () => {
      dataUtils.processBasalSequencesForDate(dateData, bounds);
      expect(dateData.basalSequences).to.be.an('array').and.have.lengthOf(2);
      expect(dateData.basalSequences[0][0].id).to.equal('foo');
      expect(dateData.basalSequences[0][1].id).to.equal('bar');
      expect(dateData.basalSequences[1][0].id).to.equal('baz');
    });
  });
});
