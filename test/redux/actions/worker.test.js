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

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import isTSA from 'tidepool-standard-action';

import * as actionTypes from '../../../src/redux/constants/actionTypes';
import * as actions from '../../../src/redux/actions/';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Web Worker "simple"(/sync) actions', () => {
  const userId = 'a1b2c3';

  describe('workerFilterDataRequest', () => {
    const types = ['basal', 'bolus', 'cbg', 'smbg'];
    const filters = {};
    const action = actions.workerFilterDataRequest(userId, filters, types);

    it('should be a TSA', () => {
      expect(isTSA(action)).to.be.true;
    });

    it('should create a data filtering request action to be handled by the Web Worker', () => {
      expect(action).to.deep.equal({
        type: actionTypes.WORKER_FILTER_DATA_REQUEST,
        payload: { types, filters, userId },
        meta: { WebWorker: true },
      });
    });
  });

  describe('workerFilterDataSuccess', () => {
    const data = [];
    const action = actions.workerFilterDataSuccess(userId, data);

    it('should be a TSA', () => {
      expect(isTSA(action)).to.be.true;
    });

    it('should create a data filtered success action', () => {
      expect(action).to.deep.equal({
        type: actionTypes.WORKER_FILTER_DATA_SUCCESS,
        payload: { data, userId },
      });
    });
  });

  describe('workerFilterDataFailure', () => {
    const error = new Error('Problem filtering data in Web Worker :(');
    const action = actions.workerFilterDataFailure(userId, error);

    it('should be a TSA', () => {
      expect(isTSA(action)).to.be.true;
    });

    it('should create a data filtering error action', () => {
      expect(action).to.deep.equal({
        type: actionTypes.WORKER_FILTER_DATA_FAILURE,
        error,
        payload: { userId },
      });
    });
  });

  describe('workerProcessDataRequest', () => {
    const data = [];
    const timePrefs = {
      timezoneAware: true,
      timezoneName: 'Europe/Budapest',
    };
    const action = actions.workerProcessDataRequest(userId, data, timePrefs);

    it('should be a TSA', () => {
      expect(isTSA(action)).to.be.true;
    });

    it('should create a data processing request action to be handled by the Web Worker', () => {
      expect(action).to.deep.equal({
        type: actionTypes.WORKER_PROCESS_DATA_REQUEST,
        payload: { data, timePrefs, userId },
        meta: { WebWorker: true },
      });
    });
  });

  describe('workerProcessDataSuccess', () => {
    const action = actions.workerProcessDataSuccess(userId);

    it('should be a TSA', () => {
      expect(isTSA(action)).to.be.true;
    });

    it('should create a data processed success action', () => {
      expect(action).to.deep.equal({
        type: actionTypes.WORKER_PROCESS_DATA_SUCCESS,
        payload: { userId },
      });
    });
  });

  describe('workerProcessDataFailure', () => {
    const error = new Error('Problem processing data in Web Worker :(');
    const action = actions.workerProcessDataFailure(userId, error);

    it('should be a TSA', () => {
      expect(isTSA(action)).to.be.true;
    });

    it('should create a data processing failure action', () => {
      expect(action).to.deep.equal({
        type: actionTypes.WORKER_PROCESS_DATA_FAILURE,
        error,
        payload: { userId },
      });
    });
  });
});

describe('Web Worker thunk actions', () => {
  const userId = 'a1b2c3';
  const data = [{
    id: 'a1b2c3',
    time: '2016-01-01T05:00:20.000Z',
    type: 'smbg',
  }, {
    id: 'd4e5f6',
    time: new Date(new Date().valueOf() - 864e5 * 5).toISOString(),
    type: 'smbg',
  }];
  const timePrefs = {
    timezoneAware: true,
    timezoneName: 'Europe/Budapest',
  };

  describe('workerProcessPatientData', () => {
    it('should dispatch two WORKER_PROCESS_DATA_REQUESTs; data grouped now - 30 days, rest', () => {
      const expectedActions = [{
        type: actionTypes.WORKER_PROCESS_DATA_REQUEST,
        payload: { data: [data[1]], timePrefs, userId },
        meta: { WebWorker: true },
      }, {
        type: actionTypes.WORKER_PROCESS_DATA_REQUEST,
        payload: { data: [data[0]], timePrefs, userId },
        meta: { WebWorker: true },
      }];

      const store = mockStore({});
      store.dispatch(actions.workerProcessPatientData(userId, data, timePrefs));
      expect(store.getActions()).to.deep.equal(expectedActions);
    });
  });
});
