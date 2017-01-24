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

import mutationTracker from 'object-invariant-test-helper';

import * as actionTypes from '../../../src/redux/constants/actionTypes';
import trendsStateByUser from '../../../src/redux/reducers/trendsStateByUser';

describe('trendsStateByUser', () => {
  const USER_1 = 'a1b2c3';
  const USER_2 = 'd4e5f6';

  const datum = { median: 100 };
  const position = { median: 10 };
  const allPositions = [{ median: 10 }, { median: 10 }];
  const allSmbgsOnDate = [{ id: 8, value: 200, msPer24: 10000 }];

  it('should return the initial state of {}', () => {
    expect(trendsStateByUser(undefined, {})).to.deep.equal({});
  });

  describe('FETCH_PATIENT_DATA_SUCCESS', () => {
    it('should set up the default trends state for the user if not in tree', () => {
      const initialState = {};
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.FETCH_PATIENT_DATA_SUCCESS,
        payload: { patientId: USER_1 },
      })).to.deep.equal({
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: true,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          showingCbgSliceLabels: true,
          touched: false,
        },
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });

    it('should not change anything if the user is in tree already', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.FETCH_PATIENT_DATA_SUCCESS,
        payload: { patientId: USER_1 },
      })).to.deep.equal(initialState);
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });

    it('should set up the default trends state for an additional user w/o wiping first', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          showingCbgSliceLabels: false,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.FETCH_PATIENT_DATA_SUCCESS,
        payload: { patientId: USER_2 },
      })).to.deep.equal({
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          showingCbgSliceLabels: false,
          touched: true,
        },
        [USER_2]: {
          cbgFlags: {
            cbg100Enabled: true,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          showingCbgSliceLabels: true,
          touched: false,
        },
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('FOCUS_TRENDS_CBG_SLICE', () => {
    const focusedKeys = ['min', 'max'];

    it('should store focused slice, slice\'s position, and the focused slice keys', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: ['median'],
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.FOCUS_TRENDS_CBG_SLICE,
        payload: { focusedKeys, sliceData: datum, slicePosition: position, userId: USER_1 },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: false,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: { data: datum, position },
        focusedCbgSliceKeys: focusedKeys,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('FOCUS_TRENDS_SMBG', () => {
    it('should store focused datum and the datum\'s position', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      const date = {};

      expect(trendsStateByUser(initialState, {
        type: actionTypes.FOCUS_TRENDS_SMBG,
        payload: {
          smbgDatum: datum,
          smbgPosition: position,
          allSmbgsOnDate,
          allPositions,
          date,
          userId: USER_1,
        },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: false,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: { date, datum, position, allSmbgsOnDate, allPositions },
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('FOCUS_TRENDS_SMBG_RANGE_AVG', () => {
    it('should store focused datum and the datum\'s position', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.FOCUS_TRENDS_SMBG_RANGE_AVG,
        payload: { rangeAvgData: datum, rangeAvgPosition: position, userId: USER_1 },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: false,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: { data: datum, position },
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('LOGOUT_REQUEST', () => {
    it('should reset to the initial state of {}', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: { datum, position },
          focusedCbgSliceKeys: ['median'],
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.LOGOUT_REQUEST,
      })).to.deep.equal({});
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('MARK_TRENDS_VIEWED', () => {
    it('should flip `touched` to true for the given user', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
        [USER_2]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: false,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.MARK_TRENDS_VIEWED,
        payload: { userId: USER_2 },
      })).to.deep.equal({
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
        [USER_2]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('STICK_CBG_DATE_TRACES', () => {
    const dates = ['2017-01-01', '2017-01-05'];
    it('should set dates as stuck', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: true,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.STICK_CBG_DATE_TRACES,
        payload: { userId: USER_1, dates },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: true,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: dates,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });

    it('should merge new stuck dates with current', () => {
      const newDates = ['2017-01-05', '2017-01-07', '2017-01-08'];
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: true,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: dates,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.STICK_CBG_DATE_TRACES,
        payload: { userId: USER_1, dates: newDates },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: true,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: [
          '2017-01-01',
          '2017-01-05',
          '2017-01-07',
          '2017-01-08',
        ],
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('TURN_ON_CBG_RANGE', () => {
    it('should set the specified cbgFlag to true', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.TURN_ON_CBG_RANGE,
        payload: { userId: USER_1, range: '100' },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: true,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('TURN_OFF_CBG_RANGE', () => {
    it('should set the specified cbgFlag to false', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.TURN_OFF_CBG_RANGE,
        payload: { userId: USER_1, range: '80' },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: false,
          cbg80Enabled: false,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('UNFOCUS_TRENDS_CBG_SLICE', () => {
    it('should reset the focusedCbgSlice and focusedCbgSliceKeys state to `null`', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: { datum, position },
          focusedCbgSliceKeys: ['median'],
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.UNFOCUS_TRENDS_CBG_SLICE,
        payload: { userId: USER_1 },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: false,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('UNFOCUS_TRENDS_SMBG', () => {
    it('should reset the focusedSmbg state to `null`', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: { datum, position },
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.UNFOCUS_TRENDS_SMBG,
        payload: { userId: USER_1 },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: false,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('UNFOCUS_TRENDS_SMBG_RANGE_AVG', () => {
    it('should reset the focusedSmbgRangeAvg state to `null`', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: false,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: null,
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: { datum, position },
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.UNFOCUS_TRENDS_SMBG_RANGE_AVG,
        payload: { userId: USER_1 },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: false,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });

  describe('UNSTICK_CBG_DATE_TRACES', () => {
    it('should reset the `cbgStuckDateTraces` to `null`', () => {
      const initialState = {
        [USER_1]: {
          cbgFlags: {
            cbg100Enabled: true,
            cbg80Enabled: true,
            cbg50Enabled: true,
            cbgMedianEnabled: true,
          },
          cbgStuckDateTraces: ['2017-01-01', '2017-01-05'],
          focusedCbgSlice: null,
          focusedCbgSliceKeys: null,
          focusedSmbg: null,
          focusedSmbgRangeAvg: null,
          touched: true,
        },
      };
      const tracked = mutationTracker.trackObj(initialState);
      expect(trendsStateByUser(initialState, {
        type: actionTypes.UNSTICK_CBG_DATE_TRACES,
        payload: { userId: USER_1 },
      })[USER_1]).to.deep.equal({
        cbgFlags: {
          cbg100Enabled: true,
          cbg80Enabled: true,
          cbg50Enabled: true,
          cbgMedianEnabled: true,
        },
        cbgStuckDateTraces: null,
        focusedCbgSlice: null,
        focusedCbgSliceKeys: null,
        focusedSmbg: null,
        focusedSmbgRangeAvg: null,
        touched: true,
      });
      expect(mutationTracker.hasMutated(tracked)).to.be.false;
    });
  });
});
