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
import { utcDay } from 'd3-time';

import { types } from '../../worker/datatypes';
import * as actionTypes from '../../redux/constants/actionTypes';

export function workerFilterDataRequest(userId, filters, datatypes) {
  return {
    type: actionTypes.WORKER_FILTER_DATA_REQUEST,
    payload: { filters, types: datatypes, userId },
    meta: { WebWorker: true },
  };
}

export function workerFilterDataSuccess(userId, data) {
  return {
    type: actionTypes.WORKER_FILTER_DATA_SUCCESS,
    payload: { userId, data },
  };
}

export function workerFilterDataFailure(userId, error) {
  return {
    type: actionTypes.WORKER_FILTER_DATA_FAILURE,
    error,
    payload: { userId },
  };
}

export function workerProcessDataRequest(userId, data, timePrefs) {
  return {
    type: actionTypes.WORKER_PROCESS_DATA_REQUEST,
    payload: { data, timePrefs, userId },
    meta: { WebWorker: true },
  };
}

export function workerProcessDataSuccess(userId) {
  return {
    type: actionTypes.WORKER_PROCESS_DATA_SUCCESS,
    payload: { userId },
  };
}

export function workerProcessDataFailure(userId, error) {
  return {
    type: actionTypes.WORKER_PROCESS_DATA_FAILURE,
    error,
    payload: { userId },
  };
}

/**
 * Web Worker process patient data async action creator ("thunk")
 *
 * @param {String} id
 * @param {Array} data
 * @param {Object} timePrefs with timezoneAware bool and timezoneName String
 */
export function workerProcessPatientData(id, data, timePrefs) {
  return (dispatch) => {
    const sorted = _.sortBy(
      _.filter(data, (d) => (_.includes(types, d.type))),
      'time'
    );
    const thirtyDaysAgo = utcDay.offset(new Date(), -30).toISOString();
    const indexAtThirtyDaysAgo = _.findLastIndex(sorted, (d) => (d.time < thirtyDaysAgo)) + 1;
    const mostRecentThirtyDaysData = sorted.splice(indexAtThirtyDaysAgo);

    dispatch(workerProcessDataRequest(id, mostRecentThirtyDaysData, timePrefs));
    dispatch(workerProcessDataRequest(id, sorted, timePrefs));
  };
}
