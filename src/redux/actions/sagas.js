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
import { delay, takeEvery } from 'redux-saga';
import { call, put, select } from 'redux-saga/effects';

import * as actions from './index';
import * as actionTypes from '../constants/actionTypes';

export function* focusTrendsCbgSlice(action) {
  const { focusedKeys, sliceData: { id: sliceId }, userId } = action.payload;
  yield call(delay, 250);
  const {
    focusedCbgSlice: currentFocusedSlice,
    focusedCbgSliceKeys: currentFocusedKeys,
  } = yield select((state) => (
    _.pick(_.get(state, ['viz', 'trends', userId], {}), ['focusedCbgSlice', 'focusedCbgSliceKeys']))
  );
  if (sliceId === _.get(currentFocusedSlice, ['data', 'id']) && _.isEqual(focusedKeys, currentFocusedKeys)) {
    yield put(actions.showCbgDateTraces(userId));
  }
}

function* watchTrendsCbgFocus() {
  yield call(takeEvery, actionTypes.FOCUS_TRENDS_CBG_SLICE, focusTrendsCbgSlice);
}

export function* rootSaga() {
  try {
    yield [
      watchTrendsCbgFocus(),
    ];
  } catch (err) {
    console.warn(err); // eslint-disable-line no-console
  }
}
