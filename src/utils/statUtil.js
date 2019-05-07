import _ from 'lodash';
import bows from 'bows';

import { getTotalBasalFromEndpoints, getBasalGroupDurationsFromEndpoints } from './basal';
import { getTotalBolus } from './bolus';
import { cgmSampleFrequency, classifyBgValue } from './bloodglucose';
import { addDuration } from './datetime';
import { CGM_DATA_KEY, MGDL_UNITS, MGDL_PER_MMOLL, MS_IN_DAY } from './constants';

/* eslint-disable lodash/prefer-lodash-method, no-underscore-dangle, no-param-reassign */

export class StatUtil {
  /**
   * @param {Object} data - crossfilter group from DataUtil, already filtered by date range
   * @param {Object} data - normalized data from DataUtil, grouped by type
   * @param {Array} data - raw data from DataUtil
   * @param {Object} opts - object containing bgBounds, bgUnits, days, and bgSource properties
   */
  constructor(dataUtil, opts = {}) {
    this.log = bows('StatUtil');
    this.init(dataUtil, opts);
  }

  init = (dataUtil, endpoints) => {
    this.dataUtil = dataUtil;
    this.bgBounds = dataUtil.bgBounds;
    this.bgUnits = dataUtil.bgUnits;
    this.days = dataUtil.endpoints.activeDaysInRange;
    this.daysInRange = dataUtil.endpoints.daysInRange;
    this.bgSource = _.get(dataUtil, 'bgSource.default', CGM_DATA_KEY);
    this.endpoints = endpoints;

    this.log('days', this.days);
    this.log('bgSource', this.bgSource);
    this.log('bgPrefs', { bgBounds: this.bgBounds, bgUnits: this.bgUnits });
  };

  addBasalOverlappingStart = (rawBasalData) => {
    const basalData = _.map(rawBasalData, this.dataUtil.normalizeDatum);

    if (basalData.length && basalData[0].normalTime > this.endpoints[0]) {
      // Fetch last basal from previous day
      this.dataUtil.filter.byEndpoints([
        addDuration(this.endpoints[0], -MS_IN_DAY),
        this.endpoints[0],
      ]);

      const previousBasalDatum = this.dataUtil.sort
        .byDate(this.dataUtil.filter.byType('basal').top(Infinity))
        .reverse()[0];

      // Add to top of basal data array if it overlaps the start endpoint
      const datumOverlapsStart = previousBasalDatum
        && previousBasalDatum.normalTime < this.endpoints[0]
        && previousBasalDatum.normalEnd > this.endpoints[0];

      if (datumOverlapsStart) {
        basalData.unshift(previousBasalDatum);
      }
    }
    return basalData;
  };

  getAverageGlucoseData = (returnBgData = false) => {
    const bgData = this.dataUtil.filter.byType(this.bgSource).top(Infinity);

    const data = {
      averageGlucose: _.meanBy(bgData, 'value'),
      total: bgData.length,
    };

    if (returnBgData) {
      data.bgData = bgData;
    }

    return data;
  };

  getBasalBolusData = () => {
    const bolusData = this.dataUtil.filter.byType('bolus').top(Infinity);
    let basalData = this.dataUtil.sort.byDate(this.dataUtil.filter.byType('basal').top(Infinity).reverse());
    basalData = this.addBasalOverlappingStart(basalData);

    const basalBolusData = {
      basal: basalData.length
        ? parseFloat(getTotalBasalFromEndpoints(basalData, this.endpoints))
        : NaN,
      bolus: bolusData.length ? getTotalBolus(bolusData) : NaN,
    };

    if (this.days > 1) {
      basalBolusData.basal = basalBolusData.basal / this.days;
      basalBolusData.bolus = basalBolusData.bolus / this.days;
    }

    return basalBolusData;
  };

  getCarbsData = () => {
    const wizardData = this.dataUtil.filter.byType('wizard').top(Infinity);
    const foodData = this.dataUtil.filter.byType('food').top(Infinity);

    const wizardCarbs = _.reduce(
      wizardData,
      (result, datum) => result + _.get(datum, 'carbInput', 0),
      0
    );

    const foodCarbs = _.reduce(
      foodData,
      (result, datum) => result + _.get(datum, 'nutrition.carbohydrate.net', 0),
      0
    );

    let carbs = wizardCarbs + foodCarbs;

    if (this.days > 1) {
      carbs = carbs / this.days;
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
        clone[key] = value / this.days;
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
      || this.daysInRange < 14
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
    let smbgData = _.reduce(
      this.dataUtil.filter.byType('smbg').top(Infinity),
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

    if (this.days > 1) {
      smbgData = this.getDailyAverageSums(smbgData);
    }

    return smbgData;
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

    const total = this.days * MS_IN_DAY;

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
    let basalData = this.dataUtil.sort.byDate(this.dataUtil.filter.byType('basal').top(Infinity));
    basalData = this.addBasalOverlappingStart(basalData);

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

    if (this.days > 1 && !_.isNaN(durations)) {
      durations = this.getDailyAverageDurations(durations);
    }

    return durations;
  };

  getTimeInRangeData = () => {
    const cbgData = this.dataUtil.filter.byType('cbg').top(Infinity);

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

    if (this.days > 1) {
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
