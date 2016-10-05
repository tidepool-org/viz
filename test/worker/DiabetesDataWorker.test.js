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

import * as actionTypes from '../../src/redux/constants/actionTypes';
import { types } from '../../src/worker/datatypes';
import DiabetesDataWorker from '../../src/worker/DiabetesDataWorker';
import * as transformers from '../../src/worker/transformers';

describe('DiabetesDataWorker', () => {
  const postMessage = sinon.spy();

  afterEach(() => {
    postMessage.reset();
  });

  it('should be an ES6 class', () => {
    assert.isFunction(DiabetesDataWorker);
    expect(DiabetesDataWorker.prototype.constructor).to.exist;
    expect(() => (new DiabetesDataWorker())).not.to.throw;
  });

  describe('the class\'s constructor', () => {
    it('should set up a crossfilters container on this w/crossfilter for each of `types`', () => {
      const worker = new DiabetesDataWorker();
      expect(worker.crossfilters).to.exist;
      _.each(types, (type) => {
        expect(worker.crossfilters[type]).to.exist;
        expect(worker.crossfilters[type].dataByDate).to.exist;
        expect(worker.crossfilters[type].dataByDayOfWeek).to.exist;
      });
    });
  });

  describe('handleMessage', () => {
    const userId = 'a1b2c3';
    const timePrefs = {
      timezoneAware: true,
      timezoneName: 'US/Moutain',
    };
    const worker = new DiabetesDataWorker();

    it('should be a function', () => {
      assert.isFunction(worker.handleMessage);
    });

    it('should throw an error on unhandled action type', () => {
      expect(() => { worker.handleMessage({ data: { type: 'FOO' } }); })
        .to.throw('Unhandled action type [FOO] passed to Web Worker!');
    });

    describe('handling WORKER_PROCESS_DATA_REQUEST', () => {
      const data = [{
        type: 'cbg',
        val: 1,
      }, {
        type: 'cbg',
        val: 2,
      }, {
        type: 'cbg',
        val: 3,
      }, {
        type: 'cbg',
        val: 4,
      }, {
        type: 'smbg',
        val: 5,
      }];
      beforeEach(() => {
        sinon.spy(transformers, 'cloneAndTransform');
      });

      afterEach(() => {
        transformers.cloneAndTransform.restore();
      });

      it('should call cloneAndTransform once per item in data array', () => {
        expect(transformers.cloneAndTransform.callCount).to.equal(0);
        worker.handleMessage({
          data: {
            type: actionTypes.WORKER_PROCESS_DATA_REQUEST,
            payload: { data, timePrefs, userId },
          },
        }, postMessage);
        expect(transformers.cloneAndTransform.callCount).to.equal(data.length);
      });

      it('should add data (if `type` included) to typed crossfilter', () => {
        _.each(_.uniq(_.pluck(data, 'type')), (type) => {
          sinon.spy(worker.crossfilters[type], 'add');
          expect(worker.crossfilters[type].add.callCount).to.equal(0);
        });
        worker.handleMessage({
          data: {
            type: actionTypes.WORKER_PROCESS_DATA_REQUEST,
            payload: { data, timePrefs, userId },
          },
        }, postMessage);
        _.each(_.uniq(_.pluck(data, 'type')), (type) => {
          expect(worker.crossfilters[type].add.callCount).to.equal(1);
          worker.crossfilters[type].add.restore();
        });
      });

      it('should post a WORKER_PROCESS_DATA_SUCCESS action/message', () => {
        expect(postMessage.callCount).to.equal(0);
        worker.handleMessage({
          data: {
            type: actionTypes.WORKER_PROCESS_DATA_REQUEST,
            payload: { data, timePrefs, userId },
          },
        }, postMessage);
        expect(postMessage.callCount).to.equal(1);
        expect(postMessage.getCall(0).args[0]).to.deep.equal({
          type: actionTypes.WORKER_PROCESS_DATA_SUCCESS,
          payload: { userId },
        });
      });
    });

    describe('handling WORKER_FILTER_DATA_REQUEST', () => {
      const filters = {
        activeDays: {
          monday: true,
          wednesday: true,
          friday: true,
        },
        dateDomain: [
          '2016-01-01T08:00:00.000Z',
          '2016-01-08T08:00:00.000Z',
        ],
      };
      const requestedTypes = ['cbg'];

      it('should apply `filters` on dataByDate dimension for requested `types`', () => {
        sinon.spy(worker.crossfilters.cbg.dataByDate, 'filterAll');
        sinon.spy(worker.crossfilters.cbg.dataByDate, 'filter');
        sinon.spy(worker.crossfilters.cbg.dataByDate, 'top');
        expect(worker.crossfilters.cbg.dataByDate.filterAll.callCount).to.equal(0);
        expect(worker.crossfilters.cbg.dataByDate.filter.callCount).to.equal(0);
        expect(worker.crossfilters.cbg.dataByDate.top.callCount).to.equal(0);
        worker.handleMessage({
          data: {
            type: actionTypes.WORKER_FILTER_DATA_REQUEST,
            payload: { filters, types: requestedTypes, userId },
          },
        }, postMessage);
        expect(worker.crossfilters.cbg.dataByDate.filterAll.callCount).to.equal(1);
        expect(worker.crossfilters.cbg.dataByDate.filter.callCount).to.equal(1);
        expect(worker.crossfilters.cbg.dataByDate.top.callCount).to.equal(1);
      });

      it('should apply `filters` on dataByDayOfWeek dimension for requested `types`', () => {
        sinon.spy(worker.crossfilters.cbg.dataByDayOfWeek, 'filterAll');
        sinon.spy(worker.crossfilters.cbg.dataByDayOfWeek, 'filterFunction');
        expect(worker.crossfilters.cbg.dataByDayOfWeek.filterAll.callCount).to.equal(0);
        expect(worker.crossfilters.cbg.dataByDayOfWeek.filterFunction.callCount).to.equal(0);
        worker.handleMessage({
          data: {
            type: actionTypes.WORKER_FILTER_DATA_REQUEST,
            payload: { filters, types: requestedTypes, userId },
          },
        }, postMessage);
        expect(worker.crossfilters.cbg.dataByDayOfWeek.filterAll.callCount).to.equal(1);
        expect(worker.crossfilters.cbg.dataByDayOfWeek.filterFunction.callCount).to.equal(1);
      });

      it('should post a WORKER_FILTER_DATA_SUCCESS action/message', () => {
        expect(postMessage.callCount).to.equal(0);
        worker.handleMessage({
          data: {
            type: actionTypes.WORKER_FILTER_DATA_REQUEST,
            payload: { filters, types: requestedTypes, userId },
          },
        }, postMessage);
        expect(postMessage.callCount).to.equal(1);
        expect(postMessage.getCall(0).args[0]).to.deep.equal({
          type: actionTypes.WORKER_FILTER_DATA_SUCCESS,
          payload: { data: { cbg: [] }, userId },
        });
      });
    });
  });
});
