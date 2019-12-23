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

import _ from 'lodash';
import moment from 'moment-timezone';
import { extent } from 'd3-array';

import { getBasalSequences } from '../../utils/basal';

/**
 * processBgRange
 * @param {Object} dataByDate - Arrays of Tidepool datums keyed by type and grouped by date
 * @returns {Array} the extent of bg range values
 */
export function processBgRange(dataByDate) {
  const bgs = _.reduce(
    dataByDate,
    (all, date) => (
      all.concat(_.get(date, 'cbg', [])).concat(_.get(date, 'smbg', []))
    ),
    []
  );
  return extent(bgs, (d) => (d.value));
}

/**
 * processBolusRange
 * @param {Object} dataByDate - Arrays of Tidepool datums keyed by type and grouped by date
 * @param {String} timezoneName - a timezone name
 * @returns {Array} the extent of bolus range values
 */
export function processBolusRange(dataByDate, timezoneName) {
  const boluses = _.reduce(
    dataByDate, (all, date) => (all.concat(_.get(date, 'bolus', []))), []
  );
  _.each(boluses, (bolus) => {
    // eslint-disable-next-line no-param-reassign
    bolus.threeHrBin = Math.floor(moment.utc(bolus.normalTime).tz(timezoneName).hours() / 3) * 3;
  });
  return extent(boluses, (d) => (d.normal + (d.extended || 0)));
}

/**
 * processBasalRange
 * @param {Object} dataByDate - Arrays of Tidepool datums keyed by type and grouped by date
 * @returns {Array} the extent of basal range values
 */
export function processBasalRange(dataByDate) {
  const basals = _.reduce(
    dataByDate, (all, date) => (all.concat(_.get(date, 'basal', []))), []
  );
  const rawBasalRange = extent(
    basals,
    (d) => (_.max([_.get(d, ['suppressed', 'rate'], 0), d.rate]))
  );
  // multiply the max rate by 1.1 to add a little buffer so the highest basals
  // don't sit at the very top of the basal rendering area and bump into boluses
  return [0, rawBasalRange[1] * 1.1];
}

/**
 * processBasalSequencesByDate
 * @param {Object} dateData - Object containing arrays of Tidepool datums keyed by type
 * @param {Array} bounds - start and end bounds of date, as integer timestamps
 */
export function processBasalSequencesForDate(dateData, bounds) {
  const { basal: basals = [] } = dateData;

  for (let i = 0; i < basals.length; ++i) {
    const basal = basals[i];

    // trim the first and last basals to fit within the date's bounds
    if (i === 0 && basal.normalTime < bounds[0] && basal.normalEnd > bounds[0]) {
      basal.duration = basal.duration - (bounds[0] - basal.normalTime);
      basal.normalTime = bounds[0];
    }

    if (i === basals.length - 1) {
      basal.duration = _.min([bounds[1] - basal.normalTime, basal.duration]);
    }

    let nextBasal;
    if (i !== basals.length - 1) {
      nextBasal = basals[i + 1];
      if ((basal.normalTime + basal.duration) !== nextBasal.normalTime) {
        basal.discontinuousEnd = true;
        nextBasal.discontinuousStart = true;
      }
    }
  }
  // eslint-disable-next-line no-param-reassign
  dateData.basalSequences = getBasalSequences(basals);
}
