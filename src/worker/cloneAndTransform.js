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

import * as mungers from './mungers';

/**
 * cloneAndTransform
 *
 * @param {Object} d - a Tidepool datum
 * @param {String} tz - a named timezone from the IANA Time Zone Database
 *
 * @return {Object} transformed - cloned & transformed Tidepool datum
 */
export default function cloneAndTransform(d, tz) {
  const transformed = _.pick(
    _.assign({}, d, mungers.calcTzSensitiveFields(mungers.toHammertime(d), tz)),
    [
      'date',
      'dayOfWeek',
      'hammertime',
      'id',
      'msPer24',
      'rawDisplayTimeMs',
      'type',
      'value',
    ]
  );
  return transformed;
}
