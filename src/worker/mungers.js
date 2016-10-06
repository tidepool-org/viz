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

import { getMsPer24 } from '../utils/datetime';

/**
 * toHammertime
 *
 * @param {Object} d - a Tidepool datum
 *
 * @return {Object} containing hammertime and rawDisplayTimeMs fields
 */
export function toHammertime(d) {
  return {
    rawDisplayTimeMs: Date.parse(`${d.deviceTime}.000Z`),
    hammertime: Date.parse(d.time),
  };
}

/**
 * calcTzSensitiveFields
 *
 * @param {Object} d - a Tidepool datum
 * @param {String} tz - a named timezone from the IANA Time Zone Database
 *
 * @return {Object} MUTATED Tidepool datum width tz-sensitive fields added or replaced
 */
export function calcTzSensitiveFields(d, tz) {
  const datum = d;
  const localized = moment.utc(d.hammertime).tz(tz);

  datum.date = localized.format('YYYY-MM-DD');
  datum.dayOfWeek = localized.format('dddd').toLowerCase();
  datum.msPer24 = getMsPer24(localized);

  return datum;
}
