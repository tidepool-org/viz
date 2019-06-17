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

import { formatInsulin, formatDecimalNumber } from './format';
import { ONE_HR } from './datetime';

/**
* getBasalSequences
* @param {Array} basals - Array of preprocessed Tidepool basal objects
*
* @return {Array} Array of Arrays where each component Array is a sequence of basals
*                 of the same subType to be rendered as a unit
*/
export function getBasalSequences(basals) {
  const basalSequences = [];
  let currentBasal = basals[0];
  let seq = [basals[0]];

  let idx = 1;
  while (idx <= basals.length - 1) {
    const nextBasal = basals[idx];
    const basalTypeChange = nextBasal.subType !== currentBasal.subType;

    if (basalTypeChange || currentBasal.discontinuousEnd || nextBasal.rate === 0) {
      basalSequences.push(seq);
      seq = [];
    }

    seq.push(nextBasal);
    currentBasal = nextBasal;
    ++idx;
  }
  basalSequences.push(seq);

  return basalSequences;
}

/**
 * getBasalPathGroupType
 * @param {Object} basal - single basal datum
 * @return {String} the path group type
 */
export function getBasalPathGroupType(datum = {}) {
  const deliveryType = _.get(datum, 'subType', datum.deliveryType);
  const suppressedDeliveryType = _.get(
    datum.suppressed,
    'subType',
    _.get(datum.suppressed, 'deliveryType')
  );
  return _.includes([deliveryType, suppressedDeliveryType], 'automated') ? 'automated' : 'manual';
}

/**
 * getBasalPathGroups
 * @param {Array} basals - Array of preprocessed Tidepool basal objects
 * @return {Array} groups of alternating 'automated' and 'manual' datums
 */
export function getBasalPathGroups(basals) {
  const basalPathGroups = [];
  let currentPathType;
  _.each(basals, datum => {
    const pathType = getBasalPathGroupType(datum);
    if (pathType !== currentPathType) {
      currentPathType = pathType;
      basalPathGroups.push([]);
    }
    _.last(basalPathGroups).push(datum);
  });

  return basalPathGroups;
}

/**
 * Get the start and end indexes and datetimes of basal datums within a given time range
 * @param {Array} data Array of Tidepool basal data
 * @param {String} s ISO date string for the start of the range
 * @param {String} e ISO date string for the end of the range
 * @param {Boolean} optionalExtents If true, allow basal gaps at start and end extents of the range.
 * @returns {Object} The start and end datetimes and indexes
 */
export function getEndpoints(data, s, e, optionalExtents = false) {
  const start = new Date(s);
  const end = new Date(e);

  const startIndex = _.findIndex(
    data,
    segment => (optionalExtents || new Date(segment.normalTime).valueOf() <= start)
      && (start <= new Date(segment.normalEnd).valueOf())
  );

  const endIndex = _.findLastIndex(
    data,
    segment => (new Date(segment.normalTime).valueOf() <= end)
      && (optionalExtents || end <= new Date(segment.normalEnd).valueOf())
  );

  return {
    start: {
      datetime: start.toISOString(),
      index: startIndex,
    },
    end: {
      datetime: end.toISOString(),
      index: endIndex,
    },
  };
}

/**
 * Get durations of basal groups within a given span of time
 * @param {Array} data Array of Tidepool basal data
 * @param {String} s ISO date string for the start of the range
 * @param {String} e ISO date string for the end of the range
 * @returns {Object} The durations (in ms) keyed by basal group type
 */
export function getGroupDurations(data, s, e) {
  const endpoints = getEndpoints(data, s, e, true);

  const durations = {
    automated: 0,
    manual: 0,
  };

  if ((endpoints.start.index >= 0) && (endpoints.end.index >= 0)) {
    const start = new Date(endpoints.start.datetime);
    const end = new Date(endpoints.end.datetime);

    // handle first segment, which may have started before the start endpoint
    let segment = data[endpoints.start.index];
    const initialSegmentDuration = _.min([new Date(segment.normalEnd) - start, segment.duration]);
    durations[getBasalPathGroupType(segment)] = initialSegmentDuration;

    // add the durations of all subsequent basals, minus the last
    let i = endpoints.start.index + 1;
    while (i < endpoints.end.index) {
      segment = data[i];
      durations[getBasalPathGroupType(segment)] += segment.duration;
      i++;
    }

    // handle last segment, which may go past the end endpoint
    segment = data[endpoints.end.index];
    durations[getBasalPathGroupType(segment)] += _.min([
      end - new Date(segment.normalTime),
      segment.duration,
    ]);
  }

  return durations;
}

/**
 * Calculate the total insulin dose delivered in a given basal segment
 * @param {Number} duration Duration of segment in milliseconds
 * @param {Number} rate Basal rate of segment
 */
export function getSegmentDose(duration, rate) {
  const hours = duration / ONE_HR;
  return parseFloat(formatDecimalNumber(hours * rate, 3));
}

/**
 * Get total basal delivered for a given time range
 * @param {Array} data Array of Tidepool basal data
 * @param {[]String} enpoints ISO date strings for the start, end of the range, in that order
 * @return {Number} Formatted total insulin dose
 */
export function getTotalBasalFromEndpoints(data, endpoints) {
  const start = new Date(endpoints[0]);
  const end = new Date(endpoints[1]);
  let dose = 0;

  _.each(data, (datum, index) => {
    let duration = datum.duration;
    if (index === 0) {
      // handle first segment, which may have started before the start endpoint
      duration = _.min([new Date(datum.normalEnd) - start, datum.duration]);
    } else if (index === data.length - 1) {
      // handle last segment, which may go past the end endpoint
      duration = _.min([end - new Date(datum.normalTime), datum.duration]);
    }

    dose += getSegmentDose(duration, datum.rate);
  });

  return formatInsulin(dose);
}

/**
 * Get automated and manual basal delivery time for a given time range
 * @param {Array} data Array of Tidepool basal data
 * @param {[]String} enpoints ISO date strings for the start, end of the range, in that order
 * @return {Number} Formatted total insulin dose
 */
export function getBasalGroupDurationsFromEndpoints(data, endpoints) {
  const start = new Date(endpoints[0]);
  const end = new Date(endpoints[1]);

  const durations = {
    automated: 0,
    manual: 0,
  };

  _.each(data, (datum, index) => {
    let duration = datum.duration;
    if (index === 0) {
      // handle first segment, which may have started before the start endpoint
      duration = _.min([new Date(datum.normalEnd) - start, datum.duration]);
    } else if (index === data.length - 1) {
      // handle last segment, which may go past the end endpoint
      duration = _.min([end - new Date(datum.normalTime), datum.duration]);
    }
    durations[getBasalPathGroupType(datum)] += duration;
  });

  return durations;
}

export const countAutomatedBasalEvents = (data) => {
  const returnData = _.cloneDeep(data);

  // Get the path groups, and remove the first group, as we only want to
  // track changes into and out of automated delivery
  const basalPathGroups = getBasalPathGroups(returnData.data);
  basalPathGroups.shift();

  const events = {
    automatedStop: 0,
  };

  _.reduce(basalPathGroups, (acc, group) => {
    const subType = _.get(group[0], 'subType', group[0].deliveryType);
    const event = subType === 'automated' ? 'automatedStart' : 'automatedStop';
    // For now, we're only tracking `automatedStop` events
    if (event === 'automatedStop') {
      acc[event]++;
    }
    return acc;
  }, events);

  _.assign(returnData.subtotals, events);
  returnData.total += events.automatedStop;

  return returnData;
};

export const countDistinctSuspends = (data) => {
  const returnData = _.cloneDeep(data);

  const suspends = _.filter(returnData.data, d => d.deliveryType === 'suspend');

  const result = {
    prev: {},
    distinct: 0,
    skipped: 0,
  };

  _.reduce(suspends, (acc, datum) => {
    // We only want to track non-contiguous suspends as distinct
    if (_.get(acc.prev, 'normalEnd') === datum.normalTime) {
      acc.skipped++;
    } else {
      acc.distinct++;
    }
    acc.prev = datum;
    return acc;
  }, result);

  returnData.subtotals.suspend = result.distinct;
  returnData.total -= result.skipped;

  return returnData;
};

/**
 * postProcessBasalAggregations
 *
 * Post processor for crossfilter reductio basal aggregations
 *
 * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
 * @returns {Object} formatted total and subtotal data for basal aggregations
 */
export const postProcessBasalAggregations = priorResults => () => {
  const data = _.filter(
    _.cloneDeep(priorResults()),
    ({ value: { dataList } }) => !_.isEmpty(dataList)
  );

  const processedData = {};

  _.each(data, dataForDay => {
    const {
      value: {
        dataList,
        suspend, // TODO: countDistinctSuspends()
        temp,
      },
    } = dataForDay;

    processedData[dataForDay.key] = {
      data: dataList,
      total: _.reduce([suspend, temp], (acc, { count = 0 }) => acc + count, 0),
      subtotals: {
        suspend: suspend.count,
        temp: temp.count,
      },
    };

    _.assign(
      processedData[dataForDay.key],
      countAutomatedBasalEvents(processedData[dataForDay.key])
    );

    // No need to return the data - we only want the aggregations
    delete processedData[dataForDay.key].data;
  });

  return {
    summary: {
      total: _.sumBy(_.values(processedData), dateData => dateData.total),
      subtotals: _.reduce(_.map(_.values(processedData), 'subtotals'), (acc, subtotals) => {
        const tags = _.keysIn(subtotals);
        _.each(tags, tag => {
          acc[tag] = (acc[tag] || 0) + subtotals[tag];
        });
        return acc;
      }, {}),
    },
    byDate: processedData,
  };
};
