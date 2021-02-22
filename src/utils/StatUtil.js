import _ from 'lodash';
import bows from 'bows';

import { getTotalBasalFromEndpoints, getBasalGroupDurationsFromEndpoints } from './basal';
import { getTotalBolus } from './bolus';
import { cgmSampleFrequency, classifyBgValue } from './bloodglucose';
import { BGM_DATA_KEY, MGDL_UNITS, MGDL_PER_MMOLL, MS_IN_DAY } from './constants';

/* eslint-disable lodash/prefer-lodash-method, no-underscore-dangle, no-param-reassign */

export class StatUtil {
  /**
   * @param {Object} dataUtil - a DataUtil instance
   */
  constructor(dataUtil) {
    this.log = bows('StatUtil');
    this.init(dataUtil);
  }

  init = (dataUtil) => {
    this.dataUtil = dataUtil;
    this.bgBounds = _.get(dataUtil, 'bgPrefs.bgBounds');
    this.bgUnits = _.get(dataUtil, 'bgPrefs.bgUnits');
    this.bgSource = _.get(dataUtil, 'bgSources.current', BGM_DATA_KEY);
    this.activeDays = dataUtil.activeEndpoints.activeDays;
    this.bolusDays = dataUtil.activeEndpoints.bolusDays || this.activeDays;
    this.endpoints = dataUtil.activeEndpoints.range;

    this.log('activeDays', this.activeDays);
    this.log('bgSource', this.bgSource);
    this.log('bgPrefs', { bgBounds: this.bgBounds, bgUnits: this.bgUnits });
  };

  getAverageGlucoseData = (returnBgData = false) => {
    const bgData = _.cloneDeep(this.dataUtil.filter.byType(this.bgSource).top(Infinity));
    _.each(bgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    const data = {
      averageGlucose: _.meanBy(bgData, 'value'),
      total: bgData.length,
    };

    if (returnBgData) {
      data.bgData = bgData;
    }

    return data;
  };

  getBgExtentsData = () => {
    const bgData = _.cloneDeep(this.dataUtil.filter.byType(this.bgSource).top(Infinity));
    _.each(bgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    const data = {
      bgMax: _.get(_.maxBy(bgData, 'value'), 'value', null),
      bgMin: _.get(_.minBy(bgData, 'value'), 'value', null),
    };

    return data;
  };

  getBasalBolusData = () => {
    const bolusData = this.dataUtil.filter.byType('bolus').top(Infinity);
    const rawBasalData = this.dataUtil.sort.byTime(this.dataUtil.filter.byType('basal').top(Infinity));
    const basalData = this.dataUtil.addBasalOverlappingStart(_.cloneDeep(rawBasalData));

    const basalBolusData = {
      basal: basalData.length
        ? parseFloat(getTotalBasalFromEndpoints(basalData, this.endpoints))
        : NaN,
      bolus: bolusData.length ? getTotalBolus(bolusData) : NaN,
    };

    if (this.bolusDays > 1) {
      basalBolusData.basal = basalBolusData.basal / this.bolusDays;
      basalBolusData.bolus = basalBolusData.bolus / this.bolusDays;
    }

    return basalBolusData;
  };

  getCarbsData = () => {
    const wizardData = this.dataUtil.filter.byType('wizard').top(Infinity);
    const foodData = this.dataUtil.filter.byType('food').top(Infinity);

    const wizardCarbs = _.reduce(
      wizardData,
      (result, datum) => {
        const units = _.get(datum, 'carbUnits', 'grams');

        return {
          ...result,
          [units]: result[units] + _.get(datum, 'carbInput', 0),
        };
      },
      {
        grams: 0,
        exchanges: 0,
      },
    );

    const foodCarbs = _.reduce(
      foodData,
      (result, datum) => result + _.get(datum, 'nutrition.carbohydrate.net', 0),
      0
    );

    let carbs = {
      grams: wizardCarbs.grams + foodCarbs,
      exchanges: wizardCarbs.exchanges,
    };

    if (this.activeDays > 1) {
      carbs = {
        grams: carbs.grams / this.activeDays,
        exchanges: carbs.exchanges / this.activeDays,
      };
    }

    return {
      carbs,
      total: wizardData.length + foodData.length,
    };
  };

  getCoefficientOfVariationData = () => {
    const {
      averageGlucose,
      insufficientData,
      standardDeviation,
      total,
    } = this.getStandardDevData();

    const coefficientOfVariationData = {
      coefficientOfVariation: standardDeviation / averageGlucose * 100,
      total,
    };

    if (insufficientData) {
      coefficientOfVariationData.insufficientData = true;
    }

    return coefficientOfVariationData;
  };

  getDailyAverageSums = data => {
    const clone = _.clone(data);

    _.each(clone, (value, key) => {
      if (key !== 'total') {
        clone[key] = value / this.activeDays;
      }
    });

    return clone;
  };

  getDailyAverageDurations = data => {
    const clone = _.clone(data);
    const total = data.total || _.sum(_.values(data));

    _.each(clone, (value, key) => {
      if (key !== 'total') {
        clone[key] = (value / total) * MS_IN_DAY;
      }
    });

    return clone;
  };

  getGlucoseManagementIndicatorData = () => {
    const { averageGlucose, bgData, total } = this.getAverageGlucoseData(true);

    const getTotalCbgDuration = () => _.reduce(
      bgData,
      (result, datum) => {
        result += cgmSampleFrequency(datum);
        return result;
      },
      0
    );

    const insufficientData = this.bgSource === 'smbg'
      || this.activeDays < 14
      || getTotalCbgDuration() < 14 * MS_IN_DAY * 0.7;

    if (insufficientData) {
      return {
        glucoseManagementIndicator: NaN,
        insufficientData: true,
      };
    }

    const meanInMGDL = this.bgUnits === MGDL_UNITS
      ? averageGlucose
      : averageGlucose * MGDL_PER_MMOLL;

    const glucoseManagementIndicator = (3.31 + 0.02392 * meanInMGDL);

    return {
      glucoseManagementIndicator,
      total,
    };
  };

  getReadingsInRangeData = () => {
    const smbgData = _.cloneDeep(this.dataUtil.filter.byType('smbg').top(Infinity));
    _.each(smbgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    let readingsInRange = _.reduce(
      smbgData,
      (result, datum) => {
        const classification = classifyBgValue(this.bgBounds, datum.value, 'fiveWay');
        result[classification]++;
        result.total++;
        return result;
      },
      {
        veryLow: 0,
        low: 0,
        target: 0,
        high: 0,
        veryHigh: 0,
        total: 0,
      }
    );

    if (this.activeDays > 1) {
      readingsInRange = this.getDailyAverageSums(readingsInRange);
    }

    return readingsInRange;
  };

  getSensorUsage = () => {
    const cbgData = this.dataUtil.filter.byType('cbg').top(Infinity);

    const duration = _.reduce(
      cbgData,
      (result, datum) => {
        result += cgmSampleFrequency(datum);
        return result;
      },
      0
    );

    const total = this.activeDays * MS_IN_DAY;

    return {
      sensorUsage: duration,
      total,
    };
  };

  getStandardDevData = () => {
    const { averageGlucose, bgData, total } = this.getAverageGlucoseData(true);

    if (bgData.length < 3) {
      return {
        averageGlucose,
        insufficientData: true,
        standardDeviation: NaN,
        total,
      };
    }

    const squaredDiffs = _.map(bgData, d => (d.value - averageGlucose) ** 2);
    const standardDeviation = Math.sqrt(_.sum(squaredDiffs) / (bgData.length - 1));

    return {
      averageGlucose,
      standardDeviation,
      total,
    };
  };

  getTimeInAutoData = () => {
    const rawBasalData = this.dataUtil.sort.byTime(this.dataUtil.filter.byType('basal').top(Infinity));
    const basalData = this.dataUtil.addBasalOverlappingStart(_.cloneDeep(rawBasalData));

    let durations = basalData.length
      ? _.transform(
        getBasalGroupDurationsFromEndpoints(basalData, this.endpoints),
        (result, value, key) => {
          result[key] = value;
          return result;
        },
        {},
      )
      : NaN;

    if (this.activeDays > 1 && !_.isNaN(durations)) {
      durations = this.getDailyAverageDurations(durations);
    }

    return durations;
  };

  getTimeInRangeData = () => {
    const cbgData = _.cloneDeep(this.dataUtil.filter.byType('cbg').top(Infinity));
    _.each(cbgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    let durations = _.reduce(
      cbgData,
      (result, datum) => {
        const classification = classifyBgValue(this.bgBounds, datum.value, 'fiveWay');
        const duration = cgmSampleFrequency(datum);
        result[classification] += duration;
        result.total += duration;
        return result;
      },
      {
        veryLow: 0,
        low: 0,
        target: 0,
        high: 0,
        veryHigh: 0,
        total: 0,
      }
    );

    if (this.activeDays > 1) {
      durations = this.getDailyAverageDurations(durations);
    }

    return durations;
  };

  getTotalInsulinData = () => {
    const { basal, bolus } = this.getBasalBolusData();

    const totalInsulin = _.reduce([basal, bolus], (result, value) => {
      const delivered = _.isNaN(value) ? 0 : value || 0;
      return result + delivered;
    }, 0);

    return {
      totalInsulin,
    };
  };
}

export default StatUtil;
