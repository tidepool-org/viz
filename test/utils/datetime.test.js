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

/* eslint-disable max-len */
import { timeParse } from 'd3-time-format';
import moment from 'moment-timezone';

import * as patients from '../../data/patient/profiles';
import * as datetime from '../../src/utils/datetime';

describe('datetime', () => {
  const {
    standard,
    fakeChildAcct,
  } = patients;

  describe('THIRTY_MINS', () => {
    assert.isNumber(datetime.THIRTY_MINS);
  });

  describe('ONE_HR', () => {
    assert.isNumber(datetime.ONE_HR);
  });

  describe('THREE_HRS', () => {
    it('should be an integer', () => {
      assert.isNumber(datetime.THREE_HRS);
    });
  });

  describe('TWENTY_FOUR_HRS', () => {
    it('should be an integer', () => {
      assert.isNumber(datetime.TWENTY_FOUR_HRS);
    });
  });

  describe('getMsPer24', () => {
    it('should return 1 when passed a timestamp 1ms after midnight', () => {
      expect(datetime.getMsPer24('2014-03-06T00:00:00.001Z')).to.equal(1);
    });

    it('should return 1 when passed a timestamp 1ms after midnight Pacific time', () => {
      expect(datetime.getMsPer24('2014-03-06T08:00:00.001Z', 'US/Pacific')).to.equal(1);
    });

    it('should return a value less than 864e5 even when past 11 p.m. on switch to DST', () => {
      expect(datetime.getMsPer24('2014-11-03T07:25:00.000Z', 'US/Pacific')).to.equal(84300000);
    });

    it('should return same value as above when past 11 p.m. on switch to non-DST', () => {
      expect(datetime.getMsPer24('2014-03-10T06:25:00.000Z', 'US/Pacific')).to.equal(84300000);
    });
  });

  describe('getOffset', () => {
    it('should return 480 given a non-DST datetime in Pacific', () => {
      expect(datetime.getOffset(new Date('2014-03-08T08:00:00.000Z'), 'US/Pacific')).to.equal(480);
    });

    it('should return 420 given a DST datetime in Pacific', () => {
      expect(datetime.getOffset(new Date('2014-03-10T07:00:00.000Z'), 'US/Pacific')).to.equal(420);
    });
  });

  describe('getBrowserTimezone', () => {
    it('return the default timezone detected by the browser', () => {
      const DateTimeFormatStub = sinon.stub(Intl, 'DateTimeFormat').returns({
        resolvedOptions: () => ({ timeZone: 'Europe/Budapest' }),
      });
      expect(datetime.getBrowserTimezone()).to.equal('Europe/Budapest');
      DateTimeFormatStub.restore();
    });
  });

  describe('getTimezoneFromTimePrefs', () => {
    it('should return the `timezoneName` when timezoneAware is true', () => {
      const tz = 'Europe/Budapest';
      const timePrefs = {
        timezoneAware: true,
        timezoneName: tz,
      };
      expect(datetime.getTimezoneFromTimePrefs(timePrefs)).to.equal(tz);
    });

    context('timezone can be determined by browser', () => {
      let DateTimeFormatStub;

      beforeEach(() => {
        DateTimeFormatStub = sinon.stub(Intl, 'DateTimeFormat').returns({
          resolvedOptions: () => ({ timeZone: 'Europe/Budapest' }),
        });
      });

      afterEach(() => {
        DateTimeFormatStub.restore();
      });

      it('should return browser timezone if timezoneAware is true but no timezoneName given', () => {
        const timePrefs1 = {
          timezoneAware: true,
        };
        const timePrefs2 = {
          timezoneAware: true,
          timezoneName: null,
        };
        const timePrefs3 = {
          timezoneAware: true,
          timezoneName: undefined,
        };
        expect(datetime.getTimezoneFromTimePrefs(timePrefs1)).to.equal('Europe/Budapest');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs2)).to.equal('Europe/Budapest');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs3)).to.equal('Europe/Budapest');
      });

      it('should return browser timezone when timezoneAware is falsey', () => {
        const timePrefs1 = {
          timezoneAware: false,
          timezoneName: 'Europe/London',
        };
        const timePrefs2 = {
          timezoneName: 'Europe/London',
        };
        const timePrefs3 = {
          timezoneAware: null,
          timezoneName: 'Europe/London',
        };
        const timePrefs4 = {
          timezoneAware: undefined,
          timezoneName: 'Europe/London',
        };
        expect(datetime.getTimezoneFromTimePrefs(timePrefs1)).to.equal('Europe/Budapest');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs2)).to.equal('Europe/Budapest');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs3)).to.equal('Europe/Budapest');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs4)).to.equal('Europe/Budapest');
      });
    });

    context('timezone cannot be determined by browser', () => {
      let DateTimeFormatStub;

      beforeEach(() => {
        DateTimeFormatStub = sinon.stub(Intl, 'DateTimeFormat').returns({
          resolvedOptions: () => ({ timeZone: undefined }),
        });
      });

      afterEach(() => {
        DateTimeFormatStub.restore();
      });

      it('should return `UTC` if timezoneAware is true but no timezoneName given', () => {
        const timePrefs1 = {
          timezoneAware: true,
        };
        const timePrefs2 = {
          timezoneAware: true,
          timezoneName: null,
        };
        const timePrefs3 = {
          timezoneAware: true,
          timezoneName: undefined,
        };
        expect(datetime.getTimezoneFromTimePrefs(timePrefs1)).to.equal('UTC');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs2)).to.equal('UTC');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs3)).to.equal('UTC');
      });

      it('should return `UTC` when timezoneAware is falsey', () => {
        const timePrefs1 = {
          timezoneAware: false,
          timezoneName: 'Europe/London',
        };
        const timePrefs2 = {
          timezoneName: 'Europe/London',
        };
        const timePrefs3 = {
          timezoneAware: null,
          timezoneName: 'Europe/London',
        };
        const timePrefs4 = {
          timezoneAware: undefined,
          timezoneName: 'Europe/London',
        };
        expect(datetime.getTimezoneFromTimePrefs(timePrefs1)).to.equal('UTC');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs2)).to.equal('UTC');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs3)).to.equal('UTC');
        expect(datetime.getTimezoneFromTimePrefs(timePrefs4)).to.equal('UTC');
      });
    });
  });

  describe('formatBirthdate', () => {
    it('should format birthdate extracted from normal patient object', () => {
      expect(datetime.formatBirthdate(standard)).to.equal('Jan 31, 1983');
    });

    it('should format birthdate extracted from fake child account patient object', () => {
      expect(datetime.formatBirthdate(fakeChildAcct)).to.equal('Jan 31, 1983');
    });
  });

  describe('formatClocktimeFromMsPer24', () => {
    const twoTwentyAfternoonMs = 1000 * 60 * 60 * 14 + 1000 * 60 * 20;
    const errorMsg = 'First argument must be a value in milliseconds per twenty-four hour day!';

    it('should error if no `milliseconds` provided', () => {
      const fn = () => { datetime.formatClocktimeFromMsPer24(); };
      expect(fn).throw(errorMsg);
    });

    it('should error if milliseconds < 0 or >= 864e5', () => {
      const fn0 = () => { datetime.formatClocktimeFromMsPer24(-1); };
      expect(fn0).to.throw(errorMsg);
      const fn1 = () => { datetime.formatClocktimeFromMsPer24(864e5 + 1); };
      expect(fn1).throw(errorMsg);
    });

    it('should error if JavaScript Date provided', () => {
      const fn = () => { datetime.formatClocktimeFromMsPer24(new Date()); };
      expect(fn).throw(errorMsg);
    });

    it('should translate durations of 0 and 864e5 to `12:00 am`', () => {
      expect(datetime.formatClocktimeFromMsPer24(0)).to.equal('12:00 am');
      expect(datetime.formatClocktimeFromMsPer24(864e5)).to.equal('12:00 am');
    });

    it('should translate duration of 1000 * 60 * 60 * 14 ⅓ to `2:20 pm`', () => {
      expect(datetime.formatClocktimeFromMsPer24(twoTwentyAfternoonMs))
        .to.equal('2:20 pm');
    });

    it('should use a custom format string passed as second arg', () => {
      expect(datetime.formatClocktimeFromMsPer24(twoTwentyAfternoonMs, 'kk🙃mm'))
        .to.equal('14🙃20');
    });
  });

  describe('formatDiagnosisDate', () => {
    it('should format diagnosisDate extracted from patient object', () => {
      expect(datetime.formatDiagnosisDate(standard)).to.equal('Jan 31, 1990');
    });

    it('should format diagnosisDate extracted from fake child account patient object', () => {
      expect(datetime.formatDiagnosisDate(fakeChildAcct)).to.equal('Jan 31, 1990');
    });
  });

  describe('formatDateRange', () => {
    it('should format a date range with dates provided as date strings', () => {
      const start = '2017-12-01';
      const end = '2017-12-10';
      const format = 'YYYY-MM-DD';

      expect(datetime.formatDateRange(start, end, format)).to.equal('Dec 1 - Dec 10, 2017');
    });

    it('should format a date range with dates provided as Date objects', () => {
      const start = new Date('2017-12-01');
      const end = new Date('2017-12-10');

      expect(datetime.formatDateRange(start, end)).to.equal('Dec 1 - Dec 10, 2017');
    });

    it('should format a date range with dates provided as Date ISO strings', () => {
      const start = new Date('2017-12-01').toISOString();
      const end = new Date('2017-12-10').toISOString();

      expect(datetime.formatDateRange(start, end)).to.equal('Dec 1 - Dec 10, 2017');
    });

    it('should properly format a range with with start and end dates in different years', () => {
      const start = new Date('2017-12-01').toISOString();
      const end = new Date('2018-01-10').toISOString();

      expect(datetime.formatDateRange(start, end)).to.equal('Dec 1, 2017 - Jan 10, 2018');
    });

    it('should properly format a range with custom month format', () => {
      const start = new Date('2017-12-01').toISOString();
      const end = new Date('2018-01-10').toISOString();

      expect(datetime.formatDateRange(start, end, undefined, 'MMMM')).to.equal('December 1, 2017 - January 10, 2018');
    });
  });

  describe('formatCurrentDate', () => {
    it('should properly format the current date', () => {
      expect(timeParse('%b %-d, %Y')(datetime.formatCurrentDate())).to.not.be.null;
    });
  });

  describe('formatDuration', () => {
    const condensed = { condensed: true };

    it('should properly format a 30 minute duration', () => {
      expect(datetime.formatDuration(36e5 / 2)).to.equal('30 min');
      expect(datetime.formatDuration(36e5 / 2, condensed)).to.equal('30m');
    });

    it('should properly format a 1 hr duration', () => {
      expect(datetime.formatDuration(36e5)).to.equal('1 hr');
      expect(datetime.formatDuration(36e5, condensed)).to.equal('1h');
    });

    it('should properly format a 1.25 hr duration', () => {
      expect(datetime.formatDuration(36e5 + 36e5 / 4)).to.equal('1¼ hr');
      expect(datetime.formatDuration(36e5 + 36e5 / 4, condensed)).to.equal('1h 15m');
    });

    it('should properly format a 1.33333 hr duration', () => {
      expect(datetime.formatDuration(36e5 + 36e5 / 3)).to.equal('1⅓ hr');
      expect(datetime.formatDuration(36e5 + 36e5 / 3, condensed)).to.equal('1h 20m');
    });

    it('should properly format a 1.5 hr duration', () => {
      expect(datetime.formatDuration(36e5 + 36e5 / 2)).to.equal('1½ hr');
      expect(datetime.formatDuration(36e5 + 36e5 / 2, condensed)).to.equal('1h 30m');
    });

    it('should properly format a 1.66667 hr duration', () => {
      expect(datetime.formatDuration(36e5 + 36e5 * (2 / 3))).to.equal('1⅔ hr');
      expect(datetime.formatDuration(36e5 + 36e5 * (2 / 3), condensed)).to.equal('1h 40m');
    });

    it('should properly format a 1.75 hr duration', () => {
      expect(datetime.formatDuration(36e5 + 36e5 * (3 / 4))).to.equal('1¾ hr');
      expect(datetime.formatDuration(36e5 + 36e5 * (3 / 4), condensed)).to.equal('1h 45m');
    });

    it('should properly format a 1.1 hr duration', () => {
      expect(datetime.formatDuration(36e5 + 36e5 / 10)).to.equal('1 hr 6 min');
      expect(datetime.formatDuration(36e5 + 36e5 / 10, condensed)).to.equal('1h 6m');
    });

    it('should properly format a 2 hr duration', () => {
      expect(datetime.formatDuration(2 * 36e5)).to.equal('2 hrs');
      expect(datetime.formatDuration(2 * 36e5, condensed)).to.equal('2h');
    });

    it('should properly format a 2.25 hr duration', () => {
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 4)).to.equal('2¼ hrs');
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 4, condensed)).to.equal('2h 15m');
    });

    it('should properly format a 2.33333 hr duration', () => {
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 3)).to.equal('2⅓ hrs');
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 3, condensed)).to.equal('2h 20m');
    });

    it('should properly format a 2.5 hr duration', () => {
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 2)).to.equal('2½ hrs');
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 2, condensed)).to.equal('2h 30m');
    });

    it('should properly format a 2.66667 hr duration', () => {
      expect(datetime.formatDuration(2 * 36e5 + 36e5 * (2 / 3))).to.equal('2⅔ hrs');
      expect(datetime.formatDuration(2 * 36e5 + 36e5 * (2 / 3), condensed)).to.equal('2h 40m');
    });

    it('should properly format a 2.75 hr duration', () => {
      expect(datetime.formatDuration(2 * 36e5 + 36e5 * (3 / 4))).to.equal('2¾ hrs');
      expect(datetime.formatDuration(2 * 36e5 + 36e5 * (3 / 4), condensed)).to.equal('2h 45m');
    });

    it('should properly format a 2.1 hr duration', () => {
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 10)).to.equal('2 hrs 6 min');
      expect(datetime.formatDuration(2 * 36e5 + 36e5 / 10, condensed)).to.equal('2h 6m');
    });

    it('should properly format a 2.5 day duration with condensed formatting', () => {
      expect(datetime.formatDuration(60 * 36e5, condensed)).to.equal('2d 12h');
    });

    it('should properly round minute durations with condensed formatting', () => {
      const ONE_MIN = 6e4;

      expect(datetime.formatDuration(ONE_MIN * 1.49, condensed)).to.equal('1m');
      expect(datetime.formatDuration(ONE_MIN * 1.5, condensed)).to.equal('2m');
      expect(datetime.formatDuration(ONE_MIN * 59.4, condensed)).to.equal('59m');
      expect(datetime.formatDuration(ONE_MIN * 59.5, condensed)).to.equal('1h');
    });

    it('should properly round 23+ hour durations to the next day when within 30 seconds of the next day with condensed formatting', () => {
      const ONE_SEC = 1e3;
      const ONE_MIN = 6e4;

      expect(datetime.formatDuration(datetime.ONE_HR * 23 + ONE_MIN * 59 + ONE_SEC * 29, condensed)).to.equal('23h 59m');
      expect(datetime.formatDuration(datetime.ONE_HR * 23 + ONE_MIN * 59 + ONE_SEC * 30, condensed)).to.equal('1d');
    });

    it('should properly format a 2.55 day duration with condensed formatting', () => {
      expect(datetime.formatDuration(60 * 36e5 + 36e5 / 2, condensed)).to.equal('2d 12h 30m');
    });

    it('should return number of seconds when there is < 1m with condensed formatting', () => {
      expect(datetime.formatDuration(36e5 / 60 / 60 * 30, condensed)).to.equal('30s');
    });

    it('should return `0m` when zero time is passed in with condensed formatting', () => {
      expect(datetime.formatDuration(0, condensed)).to.equal('0m');
    });
  });

  describe('formatLocalizedFromUTC', () => {
    const tzAwareLA = {
      timezoneAware: true,
      timezoneName: 'America/Los_Angeles',
    };
    const tzAwareNY = {
      timezoneAware: true,
      timezoneName: 'America/New_York',
    };
    const tzUnaware = {
      timezoneAware: false,
      timezoneName: null,
    };
    const utcString = '2016-09-05T04:00:00Z';
    const hammertime = Date.parse(utcString);

    it('should return "Sunday, September 4" for hammertime tzAware LA', () => {
      expect(datetime.formatLocalizedFromUTC(hammertime, tzAwareLA))
        .to.equal('Sunday, September 4');
    });

    it('should return "Sunday, September 4" for utcString tzAware LA', () => {
      expect(datetime.formatLocalizedFromUTC(utcString, tzAwareLA))
        .to.equal('Sunday, September 4');
    });

    it('should return "Monday, September 5" for hammertime tzAware NY', () => {
      expect(datetime.formatLocalizedFromUTC(hammertime, tzAwareNY))
        .to.equal('Monday, September 5');
    });

    it('should return "Monday, September 5" for utcString tzAware NY', () => {
      expect(datetime.formatLocalizedFromUTC(utcString, tzAwareNY))
        .to.equal('Monday, September 5');
    });

    it('should return "Monday, September 5" for hammertime tzUnaware', () => {
      expect(datetime.formatLocalizedFromUTC(hammertime, tzUnaware))
        .to.equal('Monday, September 5');
    });

    it('should return "Monday, September 5" for utcString tzUnaware', () => {
      expect(datetime.formatLocalizedFromUTC(utcString, tzUnaware))
        .to.equal('Monday, September 5');
    });

    it('should return "Sep 4" for hammertime tzAware LA "MMM D"', () => {
      expect(datetime.formatLocalizedFromUTC(hammertime, tzAwareLA, 'MMM D'))
        .to.equal('Sep 4');
    });

    it('should return "Sep 4" for utcString tzAware LA "MMM D"', () => {
      expect(datetime.formatLocalizedFromUTC(utcString, tzAwareLA, 'MMM D'))
        .to.equal('Sep 4');
    });

    it('should return "Sep 5" for hammertime tzAware NY "MMM D"', () => {
      expect(datetime.formatLocalizedFromUTC(hammertime, tzAwareNY, 'MMM D'))
        .to.equal('Sep 5');
    });

    it('should return "Sep 5" for utcString tzAware NY "MMM D"', () => {
      expect(datetime.formatLocalizedFromUTC(utcString, tzAwareNY, 'MMM D'))
        .to.equal('Sep 5');
    });

    it('should return "Sep 5" for hammertime tzUnaware "MMM D"', () => {
      expect(datetime.formatLocalizedFromUTC(hammertime, tzUnaware, 'MMM D'))
        .to.equal('Sep 5');
    });

    it('should return "Sep 5" for utcString tzUnaware "MMM D"', () => {
      expect(datetime.formatLocalizedFromUTC(utcString, tzUnaware, 'MMM D'))
        .to.equal('Sep 5');
    });

    it('should error if passed a JavaScript Date for the `utc` param', () => {
      const fn = () => { datetime.formatLocalizedFromUTC(new Date(), tzAwareLA); };
      expect(fn)
        .to.throw('`utc` must be a ISO-formatted String timestamp or integer hammertime!');
    });
  });

  describe('getLocalizedCeiling', () => {
    const timePrefs = { timezoneAware: true, timezoneName: 'US/Pacific' };

    it('should error if passed a JavaScript Date for the `utc` param', () => {
      const fn = () => { datetime.getLocalizedCeiling(new Date()); };
      expect(fn)
        .to.throw('`utc` must be a ISO-formatted String timestamp or integer hammertime!');
    });

    it('should return the ceiling (= next midnight) for a datetime in a given timezone', () => {
      const dt = '2016-03-15T14:25:00.000Z';
      expect(datetime.getLocalizedCeiling(dt, timePrefs).toISOString())
        .to.equal('2016-03-16T07:00:00.000Z');
      const asInteger = Date.parse(dt);
      expect(datetime.getLocalizedCeiling(asInteger, timePrefs).toISOString())
        .to.equal('2016-03-16T07:00:00.000Z');
    });

    it('should return the same datetime if it already is a midnight in given timezone', () => {
      const dt = '2016-03-15T07:00:00.000Z';
      expect(datetime.getLocalizedCeiling(dt, timePrefs).toISOString())
        .to.equal(dt);
    });
  });

  describe('formatTimeAgo', () => {
    const timePrefs = { timezoneAware: true, timezoneName: 'US/Pacific' };
    let DateTimeFormatStub;

    beforeEach(() => {
      DateTimeFormatStub = sinon.stub(Intl, 'DateTimeFormat').returns({
        resolvedOptions: () => ({ timeZone: timePrefs.timezoneName }),
      });
    });

    afterEach(() => {
      DateTimeFormatStub.restore();
    });

    it('should return appropriately formatted text strings when no custom format is supplied', () => {
      const today = moment().toISOString();
      const yesterday = moment(today).subtract(1, 'day').toISOString();
      const twoDaysAgo = moment(today).subtract(2, 'days').toISOString();
      const thirtyDaysAgo = moment(today).subtract(30, 'days').toISOString();
      const thirtyOneDaysAgo = moment(today).subtract(31, 'days').toISOString();
      const oneHourAgo = moment(today).subtract(1, 'hour').toISOString();
      const thirtyMinutesAgo = moment(today).subtract(30, 'minutes').toISOString();
      const thirtySecondsAgo = moment(today).subtract(30, 'seconds').toISOString();

      sinon.assert.match(datetime.formatTimeAgo(today, timePrefs), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
      }));

      sinon.assert.match(datetime.formatTimeAgo(yesterday, timePrefs), sinon.match({
        daysText: 'yesterday',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 1),
      }));

      sinon.assert.match(datetime.formatTimeAgo(twoDaysAgo, timePrefs), sinon.match({
        daysText: '2 days ago',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 2),
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtyDaysAgo, timePrefs), sinon.match({
        daysText: '30 days ago',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 30),
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtyOneDaysAgo, timePrefs), sinon.match({
        daysText: sinon.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/), // match YYYY-MM-DD format
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 31),
      }));

      sinon.assert.match(datetime.formatTimeAgo(oneHourAgo, timePrefs), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
        hoursText: '1 hour ago',
        hoursAgo: 1,
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtyMinutesAgo, timePrefs), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
        minutesText: '30 minutes ago',
        minutesAgo: 30,
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtySecondsAgo, timePrefs), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
        minutesText: 'a few seconds ago',
        minutesAgo: 0,
      }));
    });

    it('should return appropriately formatted text strings beyond 30 days when a custom format is supplied', () => {
      const customFormat = 'YYYY-MM';
      const today = moment().toISOString();
      const yesterday = moment(today).subtract(1, 'day').toISOString();
      const twoDaysAgo = moment(today).subtract(2, 'days').toISOString();
      const thirtyDaysAgo = moment(today).subtract(30, 'days').toISOString();
      const thirtyOneDaysAgo = moment(today).subtract(31, 'days').toISOString();
      const oneHourAgo = moment(today).subtract(1, 'hour').toISOString();
      const thirtyMinutesAgo = moment(today).subtract(30, 'minutes').toISOString();
      const thirtySecondsAgo = moment(today).subtract(30, 'seconds').toISOString();

      sinon.assert.match(datetime.formatTimeAgo(today, timePrefs, customFormat), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
      }));

      sinon.assert.match(datetime.formatTimeAgo(yesterday, timePrefs, customFormat), sinon.match({
        daysText: 'yesterday',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 1),
      }));

      sinon.assert.match(datetime.formatTimeAgo(twoDaysAgo, timePrefs, customFormat), sinon.match({
        daysText: '2 days ago',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 2),
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtyDaysAgo, timePrefs, customFormat), sinon.match({
        daysText: '30 days ago',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 30),
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtyOneDaysAgo, timePrefs, customFormat), sinon.match({
        daysText: sinon.match(/^\d{4}-(0[1-9]|1[0-2])$/), // match YYYY-MM format
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 31),
      }));

      sinon.assert.match(datetime.formatTimeAgo(oneHourAgo, timePrefs, customFormat), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
        hoursText: '1 hour ago',
        hoursAgo: 1,
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtyMinutesAgo, timePrefs, customFormat), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
        minutesText: '30 minutes ago',
        minutesAgo: 30,
      }));

      sinon.assert.match(datetime.formatTimeAgo(thirtySecondsAgo, timePrefs, customFormat), sinon.match({
        daysText: 'today',
        daysAgo: sinon.match(daysAgo => Math.floor(daysAgo) === 0),
        minutesText: 'a few seconds ago',
        minutesAgo: 0,
      }));
    });
  });
});
