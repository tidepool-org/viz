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
import crossfilter from 'crossfilter';

import * as mungers from './mungers';
import { types } from './datatypes';
import * as actions from '../redux/actions/worker';
import * as actionTypes from '../redux/constants/actionTypes';
import { getTimezoneFromTimePrefs } from '../utils/datetime';

const crossfilters = {};

const dateAccessor = (d) => (d.date);
const dayOfWeekAccessor = (d) => (d.dayOfWeek);

_.each(types, (type) => {
  crossfilters[type] = crossfilter([]);
  crossfilters[type].dataByDate = crossfilters[type].dimension(dateAccessor);
  crossfilters[type].dataByDayOfWeek = crossfilters[type].dimension(dayOfWeekAccessor);
});

export const onmessage = (msg) => {
  const { data: action } = msg;
  switch (action.type) {
    case actionTypes.WORKER_PROCESS_DATA_REQUEST: {
      const { data, timePrefs, userId } = action.payload;

      const newData = _.map(data, (d) => (
        mungers.cloneAndTransform(d, getTimezoneFromTimePrefs(timePrefs)))
      );
      const grouped = _.groupBy(newData, 'type');
      _.each(_.keys(grouped), (type) => {
        crossfilters[type].add(grouped[type]);
      });

      postMessage(actions.workerProcessDataSuccess(userId));
      break;
    }
    case actionTypes.WORKER_FILTER_DATA_REQUEST: {
      const { filters: { activeDays, dateDomain }, types: datatypes, userId } = action.payload;

      const filtered = {};

      _.each(datatypes, (type) => {
        const typedCrossfilter = crossfilters[type];
        // always reset filters before applying new ones!
        typedCrossfilter.dataByDate.filterAll();
        typedCrossfilter.dataByDayOfWeek.filterAll();
        // eslint-disable-next-line lodash/prefer-lodash-method
        typedCrossfilter.dataByDate.filter(dateDomain);
        typedCrossfilter.dataByDayOfWeek.filterFunction((d) => (activeDays[d]));
        filtered[type] = typedCrossfilter.dataByDate.top(Infinity).reverse();
      });

      postMessage(actions.workerFilterDataSuccess(userId, filtered));
      break;
    }
    default:
      throw new Error(`Unhandled action type [${action.type}] passed to Web Worker!`);
  }
};
