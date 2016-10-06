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

import moment from 'moment-timezone';

import * as mungers from '../../src/worker/mungers';

describe('mungers', () => {
  describe('toHammertime', () => {
    it('should be a function', () => {
      assert.isFunction(mungers.toHammertime);
    });

    it('should return an object with `rawDisplayTimeMs` and `hammertime` fields', () => {
      const now = new Date();
      const deviceTime = moment.utc(now).tz('US/Mountain').format('YYYY-MM-DDTHH:mm:ss');

      const input = {
        time: now.toISOString(),
        deviceTime,
      };

      expect(mungers.toHammertime(input)).to.deep.equal({
        hammertime: now.valueOf(),
        rawDisplayTimeMs: moment.utc(deviceTime).valueOf(),
      });
    });

    it('should not explode on HealthKit data w/o deviceTime');
  });

  describe('calcTzSensitiveFields', () => {
    it('should be a function', () => {
      assert.isFunction(mungers.calcTzSensitiveFields);
    });

    it('should *mutate* the input object, adding `date`, `dayOfWeek`, and `msPer24`', () => {
      const hammertime = Date.parse('2016-06-01T18:00:00.000Z');
      const input = { hammertime };
      expect(mungers.calcTzSensitiveFields(input, 'US/Mountain')).to.deep.equal({
        hammertime,
        date: '2016-06-01',
        dayOfWeek: 'wednesday',
        msPer24: 432e5,
      });
    });
  });
});
