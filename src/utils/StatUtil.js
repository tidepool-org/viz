import _ from 'lodash';
import bows from 'bows';
import moment from 'moment-timezone';

import { getTotalBasalFromEndpoints, getBasalGroupDurationsFromEndpoints } from './basal';
import { getTotalBolus } from './bolus';
import { cgmSampleFrequency, classifyBgValue } from './bloodglucose';
import { BGM_DATA_KEY, MGDL_UNITS, MGDL_PER_MMOLL, MS_IN_DAY, MS_IN_MIN } from './constants';

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

        const carbInput = this.dataUtil.needsCarbToExchangeConversion(datum)
          ? this.dataUtil.getDeconvertedCarbExchange(datum)
          : _.get(datum, 'carbInput', 0);

        return {
          ...result,
          [units]: result[units] + carbInput,
        };
      },
      {
        grams: 0,
        exchanges: 0,
      }
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

    const meanInMGDL = this.bgUnits === MGDL_UNITS
      ? averageGlucose
      : averageGlucose * MGDL_PER_MMOLL;

    const glucoseManagementIndicator = (3.31 + 0.02392 * meanInMGDL);
    const glucoseManagementIndicatorAGP = glucoseManagementIndicator;

    if (insufficientData) {
      // We still return values for AGP reports where the data sufficiency requirements are
      // different from ours and are checked at time of report generation
      return {
        glucoseManagementIndicator: NaN,
        glucoseManagementIndicatorAGP,
        insufficientData: true,
      };
    }

    return {
      glucoseManagementIndicator,
      glucoseManagementIndicatorAGP,
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
    const count = cbgData.length;

    // Data for Tidepool sensor usage stat
    const duration = _.reduce(
      cbgData,
      (result, datum) => {
        result += cgmSampleFrequency(datum);
        return result;
      },
      0
    );

    const total = this.activeDays * MS_IN_DAY;

    // Data for AGP sensor usage stat
    const rawCbgData = this.dataUtil.sort.byTime(_.cloneDeep(cbgData));
    const newestDatum = _.cloneDeep(_.last(rawCbgData));
    const oldestDatum = _.cloneDeep(_.first(rawCbgData));
    const sampleFrequency = cgmSampleFrequency(newestDatum);
    if (newestDatum) this.dataUtil.normalizeDatumOut(newestDatum, ['msPer24', 'localDate']);
    if (oldestDatum) this.dataUtil.normalizeDatumOut(oldestDatum, ['msPer24', 'localDate']);

    let cgmDaysWorn;
    let cgmMinutesWorn;

    if (rawCbgData.length < 2) {
      cgmDaysWorn = rawCbgData.length;
      cgmMinutesWorn = rawCbgData.length === 1 ? sampleFrequency : 0;
    } else {
      cgmDaysWorn = moment.utc(newestDatum?.localDate).diff(moment.utc(oldestDatum?.localDate), 'days', true) + 1;
      cgmMinutesWorn = Math.ceil(moment.utc(newestDatum?.time).diff(moment.utc(oldestDatum?.time), 'minutes', true));
    }

    const sensorUsageAGP = (
      count /
      ((cgmMinutesWorn / (sampleFrequency / MS_IN_MIN)) + 1)
    ) * 100;

    return {
      sensorUsage: duration,
      sensorUsageAGP,
      cgmDaysWorn,
      cgmMinutesWorn,
      newestDatum,
      oldestDatum,
      total,
      sampleFrequency,
      count,
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
        {}
      )
      : NaN;

    if (this.activeDays > 1 && !_.isNaN(durations)) {
      durations = this.getDailyAverageDurations(durations);
    }

    return durations;
  };

  getTimeInOverrideData = () => {
    const deviceEventData = _.cloneDeep(this.dataUtil.sort.byTime(this.dataUtil.filter.byType('deviceEvent').top(Infinity)));
    const rawPumpSettingsOverrideData = _.filter(deviceEventData, { subType: 'pumpSettingsOverride' });

    const pumpSettingsOverrideData = this.dataUtil
      .addPumpSettingsOverrideOverlappingStart(rawPumpSettingsOverrideData);

    let durations = pumpSettingsOverrideData.length
      ? _.transform(
        _.groupBy(pumpSettingsOverrideData, 'overrideType'),
        (result, data, key) => {
          const trimmedDurationData = _.map(data, datum => {
            const normalTime = _.max([this.endpoints[0], datum.normalTime]);
            const normalEnd = _.min([this.endpoints[1], datum.normalEnd]);
            const duration = normalEnd - normalTime;

            return {
              ...datum,
              normalTime,
              normalEnd,
              duration,
            };
          });

          result[key] = _.sumBy(trimmedDurationData, 'duration');
          return result;
        },
        {}
      )
      : NaN;

    if (this.activeDays > 1 && !_.isNaN(durations)) {
      durations.total = this.activeDays * MS_IN_DAY;
      durations = this.getDailyAverageDurations(durations);
      delete durations.total;
    }

    return durations;
  };

  getTimeInRangeData = () => {
    const cbgData = _.cloneDeep(this.dataUtil.filter.byType('cbg').top(Infinity));
    _.each(cbgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    const timeInRangeData = _.reduce(
      cbgData,
      (result, datum) => {
        const classification = classifyBgValue(this.bgBounds, datum.value, 'fiveWay');
        const duration = cgmSampleFrequency(datum);
        result.durations[classification] += duration;
        result.durations.total += duration;
        result.counts[classification]++;
        result.counts.total++;
        return result;
      },
      {
        durations: {
          veryLow: 0,
          low: 0,
          target: 0,
          high: 0,
          veryHigh: 0,
          total: 0,
        },
        counts: {
          veryLow: 0,
          low: 0,
          target: 0,
          high: 0,
          veryHigh: 0,
          total: 0,
        },
      }
    );

    if (this.activeDays > 1) {
      timeInRangeData.durations = this.getDailyAverageDurations(timeInRangeData.durations);
    }

    return timeInRangeData;
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
