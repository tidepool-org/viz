import _ from 'lodash';
import bows from 'bows';
import reductio from 'reductio';

import {
  countAutomatedBasalEvents,
  countDistinctSuspends,
} from './basal';

import { classifyBgValue } from './bloodglucose';

export class AggregationUtil {
  /**
   * @param {Object} data - crossfilter group from DataUtil, already filtered by date range
   * @param {Object} data - normalized data from DataUtil, grouped by type
   * @param {Array} data - raw data from DataUtil
   * @param {Object} opts - object containing bgBounds, bgUnits, days, and bgSource properties
   */
  constructor(dataUtil) {
    this.log = bows('AggregationUtil');
    this.init(dataUtil);
  }

  init = (dataUtil) => {
    this.dataUtil = dataUtil;
    this.bgBounds = _.get(dataUtil, 'bgPrefs.bgBounds');

    reductio.registerPostProcessor('postProcessBasalAggregations', this.postProcessBasalAggregations);
    reductio.registerPostProcessor('postProcessBolusAggregations', this.postProcessBolusAggregations);
    reductio.registerPostProcessor('postProcessCalibrationAggregations', this.postProcessCalibrationAggregations);
    reductio.registerPostProcessor('postProcessSiteChangeAggregations', this.postProcessSiteChangeAggregations);
    reductio.registerPostProcessor('postProcessSMBGAggregations', this.postProcessSMBGAggregations);
  };

  aggregateBasals = group => {
    this.dataUtil.filter.byType('basal');

    const reducer = reductio();
    reducer.dataList(true);

    const tags = [
      'suspend',
      'temp',
    ];

    _.each(tags, tag => this.reduceByTag(tag, 'basal', reducer));

    reducer(group);

    return group.post().postProcessBasalAggregations(this)();
  };

  aggregateBoluses = group => {
    this.dataUtil.filter.byType('bolus');

    const reducer = reductio();
    reducer.dataList(true);

    const tags = [
      'correction',
      'extended',
      'interrupted',
      'manual',
      'override',
      'underride',
      'wizard',
    ];

    _.each(tags, tag => this.reduceByTag(tag, 'bolus', reducer));

    reducer(group);

    return group.post().postProcessBolusAggregations()();
  };

  aggregateFingersticks = group => {
    this.dataUtil.filter.byType('smbg');

    let reducer = reductio();
    reducer.dataList(true);

    let tags = [
      'manual',
      'meter',
    ];

    _.each(tags, tag => this.reduceByTag(tag, 'smbg', reducer));

    const bgClasses = [
      'veryLow',
      'veryHigh',
    ];

    _.each(bgClasses, bgClass => this.reduceByBgClassification(bgClass, 'smbg', reducer));

    reducer(group);

    const result = {
      smbg: group.post().postProcessSMBGAggregations()(),
    };

    this.dataUtil.filter.byType('deviceEvent');

    reducer = reductio();
    reducer.dataList(true);

    tags = [
      'calibration',
    ];

    _.each(tags, tag => this.reduceByTag(tag, 'deviceEvent', reducer));

    reducer(group);

    result.calibration = group.post().postProcessCalibrationAggregations()();

    return result;
  };

  aggregateSiteChanges = group => {
    this.dataUtil.filter.byType('deviceEvent');

    const reducer = reductio();
    reducer.dataList(true);

    const tags = [
      'cannulaPrime',
      'reservoirChange',
      'tubingPrime',
    ];

    _.each(tags, tag => this.reduceByTag(tag, 'deviceEvent', reducer));

    reducer(group);

    return group.post().postProcessSiteChangeAggregations()();
  };

  /**
   * postProcessBasalAggregations
   *
   * Post processor for crossfilter reductio basal aggregations
   *
   * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
   * @returns {Object} formatted total and subtotal data for basal aggregations
   */
  postProcessBasalAggregations = priorResults => () => {
    const data = _.filter(
      _.cloneDeep(priorResults()),
      ({ value: { dataList } }) => !_.isEmpty(dataList)
    );

    const processedData = {};

    _.each(data, dataForDay => {
      const {
        value: {
          dataList,
          suspend,
          temp,
        },
      } = dataForDay;

      _.each(dataList, this.dataUtil.normalizeDatumOut);

      processedData[dataForDay.key] = {
        data: _.sortBy(dataList, this.dataUtil.activeTimeField),
        total: _.reduce([suspend, temp], (acc, { count = 0 }) => acc + count, 0),
        subtotals: {
          suspend: suspend.count,
          temp: temp.count,
        },
      };

      _.assign(
        processedData[dataForDay.key],
        countAutomatedBasalEvents(processedData[dataForDay.key]),
      );

      _.assign(
        processedData[dataForDay.key],
        countDistinctSuspends(processedData[dataForDay.key]),
      );

      // No need to return the data - we only want the aggregations
      delete processedData[dataForDay.key].data;
    });

    return this.summarizeProcessedData(processedData);
  };

  /**
   * postProcessBolusAggregations
   *
   * Post processor for crossfilter reductio bolus aggregations
   *
   * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
   * @returns {Object} formatted total and subtotal data for bolus aggregations
   */
  postProcessBolusAggregations = priorResults => () => {
    const data = _.filter(
      _.cloneDeep(priorResults()),
      ({ value: { dataList } }) => !_.isEmpty(dataList)
    );

    const processedData = {};

    _.each(data, dataForDay => {
      const {
        value: {
          correction,
          dataList,
          extended,
          interrupted,
          manual,
          override,
          underride,
          wizard,
        },
      } = dataForDay;

      processedData[dataForDay.key] = {
        total: dataList.length,
        subtotals: {
          correction: correction.count,
          extended: extended.count,
          interrupted: interrupted.count,
          manual: manual.count,
          override: override.count,
          underride: underride.count,
          wizard: wizard.count,
        },
      };

      // No need to return the data - we only want the aggregations
      delete processedData[dataForDay.key].data;
    });

    return this.summarizeProcessedData(processedData);
  };

  /**
   * postProcessCalibrationAggregations
   *
   * Post processor for crossfilter reductio calibration aggregations
   *
   * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
   * @returns {Object} formatted total and subtotal data for calibration aggregations
   */
  postProcessCalibrationAggregations = priorResults => () => {
    const data = _.filter(
      _.cloneDeep(priorResults()),
      ({ value: { dataList } }) => !_.isEmpty(dataList)
    );

    const processedData = {};

    _.each(data, dataForDay => {
      const {
        value: {
          calibration, // TODO: check consistency w/ tideline
        },
      } = dataForDay;

      processedData[dataForDay.key] = {
        total: calibration.count,
        subtotals: {
          calibration: calibration.count,
        },
      };
    });

    return this.summarizeProcessedData(processedData);
  };

  /**
   * postProcessSiteChangeAggregations
   *
   * Post processor for crossfilter reductio siteChange aggregations
   *
   * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
   * @returns {Object} formatted total and subtotal data for siteChange aggregations
   */
  postProcessSiteChangeAggregations = priorResults => () => {
    const data = _.filter(
      _.cloneDeep(priorResults()),
      ({ value: { dataList } }) => !_.isEmpty(dataList)
    );

    const processedData = {};

    _.each(data, dataForDay => {
      const {
        value: {
          dataList,
          cannulaPrime,
          reservoirChange,
          tubingPrime,
        },
      } = dataForDay;

      processedData[dataForDay.key] = {
        total: dataList.length,
        subtotals: {
          cannulaPrime: cannulaPrime.count,
          reservoirChange: reservoirChange.count,
          tubingPrime: tubingPrime.count,
        },
      };
    });

    return this.summarizeProcessedData(processedData);
  };

  /**
   * postProcessSMBGAggregations
   *
   * Post processor for crossfilter reductio smbg aggregations
   *
   * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
   * @returns {Object} formatted total and subtotal data for smbg aggregations
   */
  postProcessSMBGAggregations = priorResults => () => {
    const data = _.filter(
      _.cloneDeep(priorResults()),
      ({ value: { dataList } }) => !_.isEmpty(dataList)
    );

    const processedData = {};

    _.each(data, dataForDay => {
      const {
        value: {
          dataList,
          manual,
          meter,
          veryHigh,
          veryLow,
        },
      } = dataForDay;

      processedData[dataForDay.key] = {
        total: dataList.length,
        subtotals: {
          manual: manual.count,
          meter: meter.count,
          veryHigh: veryHigh.count,
          veryLow: veryLow.count,
        },
      };
    });

    return this.summarizeProcessedData(processedData);
  };

  /* eslint-disable lodash/prefer-lodash-method */
  reduceByTag = (tag, type, reducer) => {
    reducer
      .value(tag)
      .count(true)
      .filter(d => d.type === type && d.tags[tag]);
  };
  /* eslint-enable lodash/prefer-lodash-method */

  /* eslint-disable lodash/prefer-lodash-method */
  reduceByBgClassification = (bgClass, type, reducer) => {
    reducer
      .value(bgClass)
      .count(true)
      .filter(d => {
        if (d.type !== type) return false;
        const datum = _.clone(d);
        this.dataUtil.normalizeDatumBgUnits(datum);
        return classifyBgValue(this.bgBounds, datum.value, 'fiveWay') === bgClass;
      });
  };
  /* eslint-enable lodash/prefer-lodash-method */

  summarizeProcessedData = (processedData) => ({
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
  });
}

export default AggregationUtil;
