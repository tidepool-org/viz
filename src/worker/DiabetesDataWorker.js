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
import bows from 'bows';
import crossfilter from 'crossfilter';

import { types } from './datatypes';
import * as transformers from './transformers';
import * as actions from '../redux/actions/worker';
import * as actionTypes from '../redux/constants/actionTypes';
import { getTimezoneFromTimePrefs } from '../utils/datetime';

export default class DiabetesDataWorker {
  constructor() {
    this.crossfilters = {};
    _.each(types, (type) => {
      this.crossfilters[type] = crossfilter([]);
      this.crossfilters[type].dataByDate = this.crossfilters[type]
        .dimension((d) => (d.date));
      this.crossfilters[type].dataByDayOfWeek = this.crossfilters[type]
        .dimension((d) => (d.dayOfWeek));
    });

    this.log = bows('DataWorker');
    this.log('DataWorker constructed!');
  }

  handleMessage(msg, postMessage) {
    const { data: action } = msg;
    switch (action.type) {
      case actionTypes.FETCH_PATIENT_DATA_REQUEST: {
        this.log('Handling a FETCH_PATIENT_DATA_REQUEST');
        // for now, we clear the crossfilters on every new patient data fetch
        _.each(_.keys(this.crossfilters), (type) => {
          this.crossfilters[type].dataByDate.filterAll();
          this.crossfilters[type].dataByDayOfWeek.filterAll();
          this.crossfilters[type].remove();
        });
        this.log('Cleared crossfilters on new patient data fetch/refresh.');
        break;
      }
      case actionTypes.WORKER_PROCESS_DATA_REQUEST: {
        this.log('Handling a WORKER_PROCESS_DATA_REQUEST');
        const { data, timePrefs, userId } = action.payload;

        const newData = _.map(data, (d) => (
          transformers.cloneAndTransform(d, getTimezoneFromTimePrefs(timePrefs)))
        );
        const grouped = _.groupBy(newData, 'type');
        _.each(_.keys(grouped), (type) => {
          this.crossfilters[type].add(grouped[type]);
        });

        this.log('Posting WORKER_PROCESS_DATA_SUCCESS');
        _.each(types, (type) => {
          this.log(`Crossfilter for [${type}] size: ${this.crossfilters[type].size()}`);
        });
        postMessage(actions.workerProcessDataSuccess(userId));
        break;
      }
      case actionTypes.WORKER_FILTER_DATA_REQUEST: {
        this.log('Handling a WORKER_FILTER_DATA_REQUEST');
        const { filters: { activeDays, dateDomain }, types: datatypes, userId } = action.payload;

        const filtered = {};

        _.each(datatypes, (type) => {
          const typedCrossfilter = this.crossfilters[type];
          // always reset filters before applying new ones!
          typedCrossfilter.dataByDate.filterAll();
          typedCrossfilter.dataByDayOfWeek.filterAll();
          // eslint-disable-next-line lodash/prefer-lodash-method
          typedCrossfilter.dataByDate.filter(dateDomain);
          typedCrossfilter.dataByDayOfWeek.filterFunction((d) => (activeDays[d]));
          filtered[type] = typedCrossfilter.dataByDate.top(Infinity).reverse();
        });

        this.log('Posting WORKER_FILTER_DATA_SUCCESS');
        postMessage(actions.workerFilterDataSuccess(userId, filtered));
        break;
      }
      default:
        throw new Error(`Unhandled action type [${action.type}] passed to Web Worker!`);
    }
  }
}
