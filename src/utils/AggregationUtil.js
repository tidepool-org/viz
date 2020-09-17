import _ from 'lodash';
import bows from 'bows';
import moment from 'moment';
import reductio from 'reductio';

import {
  countAutomatedBasalEvents,
  countDistinctSuspends,
} from './basal';

import { formatLocalizedFromUTC } from './datetime';
import { classifyBgValue } from './bloodglucose';
import { MS_IN_DAY } from './constants';

export class AggregationUtil {
  /**
   * @param {Object} dataUtil - a DataUtil instance
   */
  constructor(dataUtil) {
    this.log = bows('AggregationUtil');
    this.init(dataUtil);
  }

  init = (dataUtil) => {
    this.dataUtil = dataUtil;
    this.bgBounds = _.get(dataUtil, 'bgPrefs.bgBounds');
    this.timezoneName = _.get(dataUtil, 'timePrefs.timezoneName', 'UTC');
    this.initialActiveEndpoints = _.cloneDeep(this.dataUtil.activeEndpoints);
    this.rangeDates = [
      moment.utc(this.initialActiveEndpoints.range[0]).tz(this.timezoneName).format('YYYY-MM-DD'),
      moment.utc(this.initialActiveEndpoints.range[1]).tz(this.timezoneName).format('YYYY-MM-DD'),
    ];
    this.excludedDevices = _.get(dataUtil, 'excludedDevices', []);

    reductio.registerPostProcessor('postProcessBasalAggregations', this.postProcessBasalAggregations);
    reductio.registerPostProcessor('postProcessBolusAggregations', this.postProcessBolusAggregations);
    reductio.registerPostProcessor('postProcessCalibrationAggregations', this.postProcessCalibrationAggregations);
    reductio.registerPostProcessor('postProcessSiteChangeAggregations', this.postProcessSiteChangeAggregations);
    reductio.registerPostProcessor('postProcessSMBGAggregations', this.postProcessSMBGAggregations);
    reductio.registerPostProcessor('postProcessDataByDateAggregations', this.postProcessDataByDateAggregations);
    reductio.registerPostProcessor('postProcessStatsByDateAggregations', this.postProcessStatsByDateAggregations);
  };

  aggregateBasals = group => {
    this.dataUtil.filter.byType('basal');
    this.dataUtil.filter.byDeviceIds(this.excludedDevices);

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
    this.dataUtil.filter.byDeviceIds(this.excludedDevices);

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
    this.dataUtil.filter.byDeviceIds(this.excludedDevices);

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
    this.dataUtil.filter.byDeviceIds(this.excludedDevices);

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

  aggregateDataByDate = group => {
    const types = _.map(this.dataUtil.types, d => d.type);
    this.dataUtil.filter.byTypes(types);
    this.dataUtil.filter.byDeviceIds(this.excludedDevices);

    const reducer = reductio();
    reducer.dataList(true);

    reducer(group);

    return group.post().postProcessDataByDateAggregations()();
  };

  aggregateStatsByDate = group => {
    this.dataUtil.filter.byDeviceIds(this.excludedDevices);
    const reducer = reductio();
    reducer.dataList(true);

    reducer(group);

    return group.post().postProcessStatsByDateAggregations()();
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
    const data = this.filterByActiveRange(priorResults());
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

      const total = _.reduce([suspend, temp], (acc, { count = 0 }) => acc + count, 0);

      processedData[dataForDay.key] = {
        data: _.sortBy(dataList, this.dataUtil.activeTimeField),
        total,
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

      if (processedData[dataForDay.key].total === 0) {
        // If there's no events for the day, we don't need to return it
        delete processedData[dataForDay.key].data;
      } else {
        // No need to return the data - we only want the aggregations
        delete processedData[dataForDay.key].data;
      }
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
    const data = this.filterByActiveRange(priorResults());
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

      const total = dataList.length;

      if (total) {
        processedData[dataForDay.key] = {
          total,
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
      }
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
    const data = this.filterByActiveRange(priorResults());
    const processedData = {};

    _.each(data, dataForDay => {
      const {
        value: {
          calibration,
        },
      } = dataForDay;

      const total = calibration.count;

      if (total) {
        processedData[dataForDay.key] = {
          total,
          subtotals: {
            calibration: calibration.count,
          },
        };
      }
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
      ({ value: { dataList } }) => _.some(
        dataList,
        d => _.includes(['prime', 'reservoirChange'], d.subType)
      ),
    );

    const siteChangeTypes = [
      'cannulaPrime',
      'reservoirChange',
      'tubingPrime',
    ];

    const processedData = {};
    let previousSiteChangeDates;

    if (data.length) {
      const firstDatum = _.first(
        _.sortBy(
          _.filter(data[0].value.dataList, d => _.includes(['prime', 'reservoirChange'], d.subType)),
          this.dataUtil.activeTimeField
        )
      );

      const previousSiteChangeDatums = this.dataUtil.getPreviousSiteChangeDatums(firstDatum);
      const dateFormat = 'YYYY-MM-DD';

      previousSiteChangeDates = {};

      _.each(siteChangeTypes, type => {
        if (previousSiteChangeDatums[type]) {
          previousSiteChangeDates[type] = formatLocalizedFromUTC(
            previousSiteChangeDatums[type][this.dataUtil.activeTimeField],
            this.dataUtil.timePrefs,
            dateFormat
          );
        }
      });
    }

    _.each(data, dataForDay => {
      const {
        value: {
          dataList,
          cannulaPrime,
          reservoirChange,
          tubingPrime,
        },
      } = dataForDay;

      const datums = _.sortBy(dataList, this.dataUtil.activeTimeField);
      _.each(datums, this.dataUtil.normalizeDatumOut);

      processedData[dataForDay.key] = {
        data: datums,
        summary: {
          daysSince: {},
        },
        subtotals: {
          cannulaPrime: cannulaPrime.count,
          reservoirChange: reservoirChange.count,
          tubingPrime: tubingPrime.count,
        },
      };

      _.each(siteChangeTypes, type => {
        if (processedData[dataForDay.key].subtotals[type]) {
          if (previousSiteChangeDates[type]) {
            const dateDiff = Date.parse(dataForDay.key) - Date.parse(previousSiteChangeDates[type]);
            processedData[dataForDay.key].summary.daysSince[type] = dateDiff / MS_IN_DAY;
          }

          previousSiteChangeDates[type] = dataForDay.key;
        }
      });
    });


    return {
      byDate: processedData,
    };
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
    const data = this.filterByActiveRange(priorResults());
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

      const total = dataList.length;

      if (total) {
        processedData[dataForDay.key] = {
          total,
          subtotals: {
            manual: manual.count,
            meter: meter.count,
            veryHigh: veryHigh.count,
            veryLow: veryLow.count,
          },
        };
      }
    });

    return this.summarizeProcessedData(processedData);
  };

  /**
   * postProcessDataByDateAggregations
   *
   * Post processor for crossfilter reductio data by date aggregations
   *
   * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
   * @returns {Object} formatted data by date aggregations for all types
   */
  postProcessDataByDateAggregations = priorResults => () => {
    const data = this.filterByActiveRange(priorResults());
    const processedData = {};

    _.each(_.sortBy(data, 'key').reverse(), (dataForDay, index) => {
      const {
        value: {
          dataList,
        },
      } = dataForDay;

      // Set the endpoints to filter current data for day
      this.dataUtil.activeEndpoints = {
        range: [
          moment.utc(this.initialActiveEndpoints.range[1]).tz(this.timezoneName).subtract(index + 1, 'days').valueOf(),
          moment.utc(this.initialActiveEndpoints.range[1]).tz(this.timezoneName).subtract(index, 'days').valueOf(),
        ],
        days: 1,
        activeDays: 1,
      };

      this.dataUtil.filter.byEndpoints(this.dataUtil.activeEndpoints.range);

      const sortedData = _.sortBy(dataList, this.dataUtil.activeTimeField);
      const groupedData = _.groupBy(sortedData, 'type');
      const groupedBasals = _.cloneDeep(groupedData.basal || []);

      this.dataUtil.addBasalOverlappingStart(groupedBasals);

      _.each(groupedData, typeData => _.each(typeData, d => this.dataUtil.normalizeDatumOut(d, ['*'])));

      if (groupedBasals.length > _.get(groupedData, 'basal.length', 0)) groupedData.basal.unshift(groupedBasals[0]);
      processedData[dataForDay.key] = groupedData;
    });

    // Reset the activeEndpoints to it's initial value
    this.dataUtil.activeEndpoints = _.cloneDeep(this.initialActiveEndpoints);
    this.dataUtil.filter.byEndpoints(this.dataUtil.activeEndpoints.range);

    return processedData;
  };

  /**
   * postProcessStatsByDateAggregations
   *
   * Post processor for crossfilter reductio stats by date aggregations
   *
   * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
   * @returns {Object} formatted stats by date aggregations
   */
  postProcessStatsByDateAggregations = priorResults => () => {
    const data = this.filterByActiveRange(priorResults());
    const processedData = {};

    _.each(_.sortBy(data, 'key').reverse(), (dataForDay, index) => {
      // Set the endpoints to filter current data for day
      this.dataUtil.activeEndpoints = {
        range: [
          moment.utc(this.initialActiveEndpoints.range[1]).tz(this.timezoneName).subtract(index + 1, 'days').valueOf(),
          moment.utc(this.initialActiveEndpoints.range[1]).tz(this.timezoneName).subtract(index, 'days').valueOf(),
        ],
        days: 1,
        activeDays: 1,
      };

      this.dataUtil.filter.byEndpoints(this.dataUtil.activeEndpoints.range);

      // Fetch the stats with endpoints and activeDays set for the day
      processedData[dataForDay.key] = this.dataUtil.getStats(this.dataUtil.stats);
    });

    // Reset the activeEndpoints to it's initial value
    this.dataUtil.activeEndpoints = _.cloneDeep(this.initialActiveEndpoints);
    this.dataUtil.filter.byEndpoints(this.dataUtil.activeEndpoints.range);

    return processedData;
  };

  filterByActiveRange = results => _.filter(
    _.cloneDeep(results),
    result => result.key >= this.rangeDates[0] && result.key < this.rangeDates[1]
  );

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

  summarizeProcessedData = (processedData) => {
    const total = _.sumBy(_.values(processedData), dateData => dateData.total);
    const avgPerDay = total / this.dataUtil.activeEndpoints.activeDays;
    return {
      summary: {
        avgPerDay,
        total,
        subtotals: _.reduce(_.map(_.values(processedData), 'subtotals'), (acc, subtotals) => {
          const tags = _.keysIn(subtotals);
          _.each(tags, tag => {
            const count = _.get(acc, [tag, 'count'], 0) + subtotals[tag];
            const percentage = count / total;
            acc[tag] = {
              count,
              percentage,
            };
          });
          return acc;
        }, {}),
      },
      byDate: processedData,
    };
  };
}

export default AggregationUtil;
