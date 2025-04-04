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
import * as basals from '../../data/basal/fixtures';
import * as basalUtils from '../../src/utils/basal';
import { Basal } from '../../data/types';

const MS_IN_HOUR = 3600000;
const MS_IN_DAY = 86400000;

describe('basal utilties', () => {
  describe('getBasalSequences', () => {
    it('should be a function', () => {
      assert.isFunction(basalUtils.getBasalSequences);
    });

    it('should return one sequence for scheduled flat-rate basals across midnight', () => {
      expect(basalUtils.getBasalSequences(basals.scheduledFlat))
        .to.deep.equal([basals.scheduledFlat]);
    });

    it('should return one sequence for uninterrupted scheduled basals', () => {
      expect(basalUtils.getBasalSequences(basals.scheduledNonFlat))
        .to.deep.equal([basals.scheduledNonFlat]);
    });

    it(`should return three sequences for scheduled basals interrupted by
       a non-schedule-crossing temp basal (or suspend)`, () => {
      expect(basalUtils.getBasalSequences(basals.simpleNegativeTemp))
        .to.deep.equal([
          basals.simpleNegativeTemp.slice(0, 3),
          basals.simpleNegativeTemp.slice(3, 4),
          basals.simpleNegativeTemp.slice(4),
        ]);
    });

    it(`should return four sequences for scheduled basals interrupted by
      a schedule-crossing temp basal (or suspend)`, () => {
      expect(basalUtils.getBasalSequences(basals.suspendAcrossScheduled))
        .to.deep.equal([
          basals.suspendAcrossScheduled.slice(0, 3),
          basals.suspendAcrossScheduled.slice(3, 4),
          basals.suspendAcrossScheduled.slice(4, 5),
          basals.suspendAcrossScheduled.slice(5),
        ]);
    });
  });

  describe('getBasalPathGroupType', () => {
    it('should be a function', () => {
      assert.isFunction(basalUtils.getBasalPathGroupType);
    });

    it('should return the path group type `automated` for an automated basal', () => {
      expect(basalUtils.getBasalPathGroupType({ subType: 'automated' })).to.equal('automated');
    });

    it('should return the path group type `manual` for a non-automated basal', () => {
      expect(basalUtils.getBasalPathGroupType({ subType: 'scheduled' })).to.equal('manual');
      expect(basalUtils.getBasalPathGroupType({ subType: 'temp' })).to.equal('manual');
      expect(basalUtils.getBasalPathGroupType({ subType: 'suspend' })).to.equal('manual');
    });

    it('should work with old `deliveryType` basal prop if `subType` is not set', () => {
      expect(basalUtils.getBasalPathGroupType({ deliveryType: 'scheduled' })).to.equal('manual');
      expect(basalUtils.getBasalPathGroupType({ deliveryType: 'automated' })).to.equal('automated');
      expect(basalUtils.getBasalPathGroupType({
        subType: 'automated',
        deliveryType: 'scheduled',
      })).to.equal('automated');
    });

    it('should return the path group type `regular` for a suspend suppressing non-automated delivery', () => {
      expect(basalUtils.getBasalPathGroupType({ deliveryType: 'suspend', suppressed: { subType: 'scheduled' } })).to.equal('manual');
      expect(basalUtils.getBasalPathGroupType({ subType: 'suspend', suppressed: { deliveryType: 'temp' } })).to.equal('manual');
    });

    it('should return the path group type `automated` for a suspend suppressing automated delivery', () => {
      expect(basalUtils.getBasalPathGroupType({ deliveryType: 'suspend', suppressed: { subType: 'automated' } })).to.equal('automated');
      expect(basalUtils.getBasalPathGroupType({ subType: 'suspend', suppressed: { deliveryType: 'automated' } })).to.equal('automated');
    });
  });

  describe('getBasalPathGroups', () => {
    it('should be a function', () => {
      assert.isFunction(basalUtils.getBasalPathGroups);
    });

    it('should return an array of groupings of automated and manual data', () => {
      const mixedBasals = basals.automatedAndScheduled;
      const result = basalUtils.getBasalPathGroups(mixedBasals);
      expect(result).to.be.an('array');
      expect(result.length).to.equal(3);

      _.each(result, (group, groupIndex) => {
        expect(group).to.be.an('array');

        const expectedSubType = groupIndex === 1 ? 'scheduled' : 'automated';
        _.each(group, datum => {
          expect(datum.subType).to.equal(expectedSubType);
        });
      });
    });
  });

  describe('getEndpoints', () => {
    const sixHours = MS_IN_HOUR * 6;
    let data;

    beforeEach(() => {
      data = [
        new Basal({ deviceTime: '2018-01-01T00:00:00', duration: sixHours }),
        new Basal({ deviceTime: '2018-01-01T06:00:00', duration: sixHours }),
        new Basal({ deviceTime: '2018-01-01T12:00:00', duration: sixHours }),
        new Basal({ deviceTime: '2018-01-01T18:00:00', duration: sixHours }),
      ];
    });

    it('should return an endpoints object given a start and end time', () => {
      const start = data[0].normalTime;
      const end = start + MS_IN_DAY;

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: 0,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: 3,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end)).to.eql(expected);
    });

    // eslint-disable-next-line max-len
    it('should return an endpoints object when a single basal segment contains (is a superset of) the given 24-hour period', () => {
      const basalStart = '2017-12-23T00:00:00';
      data = [
        new Basal({
          deviceTime: basalStart,
          duration: MS_IN_DAY * 2,
        }),
      ];

      const start = data[0].normalTime + MS_IN_HOUR;
      const end = start + MS_IN_DAY;

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: 0,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: 0,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end)).to.eql(expected);
    });

    // eslint-disable-next-line max-len
    it('should return an endpoints object with a start and end index when basal segments overlap the start and end times', () => {
      const start = data[0].normalTime;
      const end = start + MS_IN_DAY;
      data[0].normalTime = start - MS_IN_HOUR;
      data[0].duration = data[0].duration + MS_IN_HOUR;

      data[data.length - 1].normalEnd = end + MS_IN_HOUR;
      data[data.length - 1].duration = data[data.length - 1].duration + MS_IN_HOUR;

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: 0,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: 3,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end)).to.eql(expected);
    });

    // eslint-disable-next-line max-len
    it('should return an endpoints object with a start and end index when basal segments overlap the only the start time and `optionalExtents` arg is `true`', () => {
      const start = data[0].normalTime;
      const end = start + MS_IN_DAY;
      data[0].normalTime = start - MS_IN_HOUR;
      data[0].duration = data[0].duration + MS_IN_HOUR;

      // remove the last datum
      data.pop();

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: 0,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: 2,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end, true)).to.eql(expected);
    });

    // eslint-disable-next-line max-len
    it('should return an endpoints object with a `-1` end index when basal segments overlap the only the start time and `optionalExtents` arg is `false`', () => {
      const start = data[0].normalTime;
      const end = start + MS_IN_DAY;
      data[0].normalTime = start - MS_IN_HOUR;
      data[0].duration = data[0].duration + MS_IN_HOUR;

      // remove the last datum
      data.pop();

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: 0,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: -1,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end, false)).to.eql(expected);
    });

    // eslint-disable-next-line max-len
    it('should return an endpoints object with a `-1` end index when basal segments overlap the only the start time and `optionalExtents` arg is omitted', () => {
      const start = data[0].normalTime;
      const end = start + MS_IN_DAY;
      data[0].normalTime = start - MS_IN_HOUR;
      data[0].duration = data[0].duration + MS_IN_HOUR;

      // remove the last datum
      data.pop();

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: 0,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: -1,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end)).to.eql(expected);
    });

    // eslint-disable-next-line max-len
    it('should return an endpoints object with a start and end index when basal segments overlap only the end time and `optionalExtents` arg is `true`', () => {
      const start = data[0].normalTime - MS_IN_HOUR;
      const end = start + MS_IN_DAY;

      // remove the first datum
      data.shift();

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: 0,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: 2,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end, true)).to.eql(expected);
    });

    // eslint-disable-next-line max-len
    it('should return an endpoints object with a `-1` start index when basal segments overlap only the end time and `optionalExtents` arg is `false`', () => {
      const start = data[0].normalTime - MS_IN_HOUR;
      const end = start + MS_IN_DAY;

      // remove the first datum
      data.shift();

      const expected = {
        start: {
          datetime: new Date(start).toISOString(),
          index: -1,
        },
        end: {
          datetime: new Date(end).toISOString(),
          index: 2,
        },
      };

      expect(basalUtils.getEndpoints(data, start, end)).to.eql(expected);
    });
  });

  describe('getGroupDurations', () => {
    const sixHours = MS_IN_HOUR * 6;
    let data;

    beforeEach(() => {
      data = [
        new Basal({ deviceTime: '2018-01-01T00:00:00', duration: sixHours }),
        new Basal({ deviceTime: '2018-01-01T06:00:00', duration: sixHours }),
        new Basal({ deviceTime: '2018-01-01T12:00:00', duration: sixHours }),
        new Basal({ deviceTime: '2018-01-01T18:00:00', duration: sixHours }),
      ];
    });

    it('should return an object with `automated` and `manual` keys', () => {
      const start = data[0].normalTime;
      const end = start + MS_IN_DAY;
      const result = basalUtils.getGroupDurations(data, start, end);

      expect(_.keysIn(result)).to.eql(['automated', 'manual']);
    });

    it('should return durations for `automated` and `manual` basal delivery', () => {
      const halfAutomatedData = _.map(data, (d, i) => (
        _.assign({}, d, {
          deliveryType: (i % 2 === 0) ? 'automated' : 'scheduled',
        })
      ));

      const start = halfAutomatedData[0].normalTime;
      const end = start + MS_IN_DAY;
      const result = basalUtils.getGroupDurations(halfAutomatedData, start, end);

      expect(result.automated).to.equal(result.manual);
      expect(result.automated + result.manual).to.equal(MS_IN_DAY);
    });

    // eslint-disable-next-line max-len
    it('should handle partial durations for `automated` and `manual` basals that fall partially outside the start of range', () => {
      const firstDatum = data[0];
      firstDatum.deliveryType = 'automated';
      const start = firstDatum.normalTime + MS_IN_HOUR;
      const end = start + MS_IN_DAY;
      const result = basalUtils.getGroupDurations(data, start, end);
      expect(result.automated).to.equal(firstDatum.duration - MS_IN_HOUR);
      expect(result.automated + result.manual).to.equal(MS_IN_DAY - MS_IN_HOUR);
    });

    // eslint-disable-next-line max-len
    it('should handle partial durations for `automated` and `manual` basals that fall partially outside the end of range', () => {
      const firstDatum = data[0];
      const lastDatum = data[data.length - 1];
      lastDatum.deliveryType = 'automated';
      const start = firstDatum.normalTime - MS_IN_HOUR;
      const end = start + MS_IN_DAY;
      const result = basalUtils.getGroupDurations(data, start, end);
      expect(result.automated).to.equal(lastDatum.duration - MS_IN_HOUR);
      expect(result.automated + result.manual).to.equal(MS_IN_DAY - MS_IN_HOUR);
    });
  });

  describe('getSegmentDose', () => {
    it('should return the total insulin dose delivered in a given basal segment', () => {
      expect(basalUtils.getSegmentDose(MS_IN_HOUR * 3, 0.25)).to.equal(0.75);
    });
  });

  describe('getTotalBasalFromEndpoints', () => {
    it('should return total basal delivered for a given time range, even when endpoints overlap a basal segment', () => {
      const data = [
        { // 0.75
          duration: MS_IN_HOUR * 3,
          rate: 0.25,
          normalTime: '2018-01-01T00:00:00.000Z',
          normalEnd: '2018-01-01T03:00:00.000Z',
        },
        { // 1.5
          duration: MS_IN_HOUR * 2,
          rate: 0.75,
          normalTime: '2018-01-01T03:00:00.000Z',
          normalEnd: '2018-01-01T05:00:00.000Z',
        },
        { // 9.5
          duration: MS_IN_HOUR * 19,
          rate: 0.5,
          normalTime: '2018-01-01T05:00:00.000Z',
          normalEnd: '2018-01-02T00:00:00.000Z',
        },
        { // 0.75
          duration: MS_IN_HOUR * 3,
          rate: 0.25,
          normalTime: '2018-01-02T00:00:00.000Z',
          normalEnd: '2018-01-02T03:00:00.000Z',
        },
      ];

      let endpoints;

      // endpoints coincide with start and end times of basal segments
      endpoints = [
        '2018-01-01T00:00:00.000Z',
        '2018-01-02T00:00:00.000Z',
      ];
      expect(basalUtils.getTotalBasalFromEndpoints(data, endpoints)).to.equal('11.75');

      // endpoints shifted to an hour after basal delivery begins
      endpoints = [
        '2018-01-01T01:00:00.000Z',
        '2018-01-02T01:00:00.000Z',
      ];
      expect(basalUtils.getTotalBasalFromEndpoints(data, endpoints)).to.equal('11.75');


      // endpoints shifted to an hour before basal delivery begins
      endpoints = [
        '2017-12-31T23:00:00.000Z',
        '2018-01-01T23:00:00.000Z',
      ];
      expect(basalUtils.getTotalBasalFromEndpoints(data, endpoints)).to.equal('11.25');

      // endpoints shifted to two hours after basal delivery ends
      endpoints = [
        '2018-01-01T05:00:00.000Z',
        '2018-01-02T05:00:00.000Z',
      ];
      expect(basalUtils.getTotalBasalFromEndpoints(data, endpoints)).to.equal('10.25');

      // basal completely encompasses endpoints
      endpoints = [
        '2018-01-01T05:00:00.000Z',
        '2018-01-02T05:00:00.000Z',
      ];

      const multiDayBasalData = [
        { // 72 U total delivery, but endpoints are only 24h
          duration: MS_IN_HOUR * 72,
          rate: 1,
          normalTime: '2017-12-31T05:00:00.000Z',
          normalEnd: '2018-01-03T05:00:00.000Z',
        },
      ];
      expect(basalUtils.getTotalBasalFromEndpoints(multiDayBasalData, endpoints)).to.equal('24.0');
    });
  });

  describe('getBasalGroupDurationsFromEndpoints', () => {
    it('should return the automated and manual basal delivery time for a given time range', () => {
      const data = [
        {
          duration: MS_IN_HOUR * 3,
          rate: 0.25,
          normalTime: '2018-01-01T00:00:00.000Z',
          normalEnd: '2018-01-01T03:00:00.000Z',
          subType: 'scheduled',
        },
        {
          duration: MS_IN_HOUR * 2,
          rate: 0.75,
          normalTime: '2018-01-01T03:00:00.000Z',
          normalEnd: '2018-01-01T05:00:00.000Z',
          subType: 'automated',
        },
        {
          duration: MS_IN_HOUR * 7,
          rate: 0.5,
          normalTime: '2018-01-01T05:00:00.000Z',
          normalEnd: '2018-01-02T00:00:00.000Z',
          subType: 'scheduled',
        },
        {
          duration: MS_IN_HOUR * 3,
          rate: 0.25,
          normalTime: '2018-01-02T00:00:00.000Z',
          normalEnd: '2018-01-02T03:00:00.000Z',
          subType: 'scheduled',
        },
      ];

      // endpoints coincide with start and end times of basal segments
      let endpoints = [
        '2018-01-01T00:00:00.000Z',
        '2018-01-02T00:00:00.000Z',
      ];
      expect(basalUtils.getBasalGroupDurationsFromEndpoints(data, endpoints)).to.eql({
        automated: MS_IN_HOUR * 2,
        manual: MS_IN_HOUR * 10,
      });

      // endpoints shifted to an hour after basal delivery begins
      endpoints = [
        '2018-01-01T01:00:00.000Z',
        '2018-01-02T01:00:00.000Z',
      ];
      expect(basalUtils.getBasalGroupDurationsFromEndpoints(data, endpoints)).to.eql({
        automated: MS_IN_HOUR * 2,
        manual: MS_IN_HOUR * 10,
      });


      // endpoints shifted to an hour before basal delivery begins
      endpoints = [
        '2017-12-31T23:00:00.000Z',
        '2018-01-01T23:00:00.000Z',
      ];
      expect(basalUtils.getBasalGroupDurationsFromEndpoints(data, endpoints)).to.eql({
        automated: MS_IN_HOUR * 2,
        manual: MS_IN_HOUR * 9,
      });

      // endpoints shifted to two hours after basal delivery ends
      endpoints = [
        '2018-01-01T05:00:00.000Z',
        '2018-01-02T05:00:00.000Z',
      ];
      expect(basalUtils.getBasalGroupDurationsFromEndpoints(data, endpoints)).to.eql({
        automated: MS_IN_HOUR * 2,
        manual: MS_IN_HOUR * 8,
      });
    });
  });

  describe('countAutomatedBasalEvents', () => {
    it('should count the number of `automatedStop` events and add them to the totals', () => {
      const bd = {
        data: [
          { type: 'basal', deliveryType: 'temp' },
          { type: 'basal', deliveryType: 'automated' },
        ],
        subtotals: { automatedStop: 0 },
        total: 1,
      };

      const result = basalUtils.countAutomatedBasalEvents(bd);

      expect(result.subtotals.automatedStop).to.equal(0);
      expect(result.total).to.equal(1);

      // Add a scheduled basal to kick out of automode
      bd.data.push({ type: 'basal', deliveryType: 'scheduled' });
      const result2 = basalUtils.countAutomatedBasalEvents(bd);

      expect(result2.subtotals.automatedStop).to.equal(1);
      expect(result2.total).to.equal(2);
    });
  });

  describe('countDistinctSuspends', () => {
    it('should count contiguous `suspend` events as 1 and subtract each skipped from the total event count', () => {
      const start1 = '2015-01-01T00:00:00.000Z';
      const start2 = '2015-01-01T00:01:00.000Z';
      const start3 = '2015-01-01T00:01:02.000Z';
      const start4 = '2015-01-01T00:01:06.000Z';
      const start5 = '2015-01-01T00:02:00.000Z';
      const bd = {
        data: [
          { type: 'basal', deliveryType: 'scheduled', normalTime: start1, normalEnd: start2 },
          { type: 'basal', deliveryType: 'suspend', normalTime: start2, normalEnd: start3 },
          { type: 'basal', deliveryType: 'suspend', normalTime: start3, normalEnd: start4 },
          { type: 'basal', deliveryType: 'suspend', normalTime: start4, normalEnd: start5 },
          { type: 'basal', deliveryType: 'scheduled', normalTime: start5 },
        ],
        subtotals: { suspend: 0 },
        total: 5,
      };

      const result = basalUtils.countDistinctSuspends(bd);

      // should only count the 3 suspends as 1, because they are contiguous
      expect(result.subtotals.suspend).to.equal(1);
      expect(result.total).to.equal(3);
    });

    it('should count non-contiguous `suspend` events as distict', () => {
      const start1 = '2015-01-01T00:00:00.000Z';
      const start2 = '2015-01-01T00:01:00.000Z';
      const start3 = '2015-01-01T00:01:02.000Z';
      const start4 = '2015-01-01T00:01:06.000Z';
      const start5 = '2015-01-01T00:02:00.000Z';
      const bd = {
        data: [
          { type: 'basal', deliveryType: 'scheduled', normalTime: start1, normalEnd: start2 },
          { type: 'basal', deliveryType: 'suspend', normalTime: start2, normalEnd: start3 },
          { type: 'basal', deliveryType: 'scheduled', normalTime: start3, normalEnd: start4 },
          { type: 'basal', deliveryType: 'suspend', normalTime: start4, normalEnd: start5 },
          { type: 'basal', deliveryType: 'scheduled', normalTime: start5 },
        ],
        subtotals: { suspend: 0 },
        total: 5,
      };

      const result = basalUtils.countDistinctSuspends(bd);

      // should only count the 2 suspends as 2, because they are non-contiguous
      expect(result.subtotals.suspend).to.equal(2);
      expect(result.total).to.equal(5);
    });
  });
});

/* eslint-enable max-len */
