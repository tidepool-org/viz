import _ from 'lodash';
import bows from 'bows';
import moment from 'moment-timezone';

import { getTotalBasalFromEndpoints, getBasalGroupDurationsFromEndpoints } from './basal';
import { getTotalInsulin } from './bolus';
import { classifyBgValue } from './bloodglucose';
import { BGM_DATA_KEY, CGM_DATA_KEY, MGDL_UNITS, MGDL_PER_MMOLL, MS_IN_DAY, MS_IN_MIN } from './constants';
import { formatLocalizedFromUTC } from './datetime';

/* eslint-disable lodash/prefer-lodash-method, no-underscore-dangle, no-param-reassign */

/**
 * StatUtil provides statistical calculations for diabetes data.
 *
 * This utility class is instantiated by DataUtil to compute various diabetes
 * metrics and statistics from the filtered data. It handles calculations for:
 * - Blood glucose statistics (average, standard deviation, coefficient of variation)
 * - Time-in-range metrics for both CGM and BGM data
 * - Insulin delivery analysis (basal, bolus, total daily dose)
 * - Carbohydrate intake tracking
 * - Sensor usage metrics
 * - Glucose Management Indicator (GMI/eA1C)
 *
 * StatUtil respects the current BG source (CGM vs BGM), BG units (mg/dL vs mmol/L),
 * and configured glucose target ranges from DataUtil's preferences.
 *
 * @example
 * // StatUtil is typically used internally by DataUtil:
 * const result = dataUtil.query({
 *   endpoints: [startDate, endDate],
 *   stats: ['timeInRange', 'averageGlucose', 'totalInsulin'],
 * });
 * // result.stats contains the computed statistics
 *
 * @see {@link DataUtil#getStats} for how StatUtil is invoked
 */
export class StatUtil {
  /**
   * Creates a new StatUtil instance.
   *
   * @param {DataUtil} dataUtil - The DataUtil instance providing data access and preferences.
   *   StatUtil reads the following from dataUtil:
   *   - `bgPrefs.bgBounds` - Glucose range thresholds
   *   - `bgPrefs.bgUnits` - Display units (mg/dL or mmol/L)
   *   - `bgSources.current` - Active BG data source ('cbg' or 'smbg')
   *   - `activeEndpoints` - Current date range and active days
   *   - `timePrefs` - Timezone preferences for date formatting
   */
  constructor(dataUtil) {
    this.log = bows('StatUtil');
    this.init(dataUtil);
  }

  /**
   * Initializes StatUtil with configuration from DataUtil.
   *
   * @private
   * @param {DataUtil} dataUtil - The DataUtil instance to read configuration from.
   */
  init = (dataUtil) => {
    this.dataUtil = dataUtil;
    this.bgBounds = _.get(dataUtil, 'bgPrefs.bgBounds');
    this.bgUnits = _.get(dataUtil, 'bgPrefs.bgUnits');
    this.bgSource = _.get(dataUtil, 'bgSources.current', BGM_DATA_KEY);
    this.activeDays = dataUtil.activeEndpoints.activeDays;
    this.endpoints = dataUtil.activeEndpoints.range;
    this.timePrefs = _.get(dataUtil, 'timePrefs');

    this.log('activeDays', this.activeDays);
    this.log('bgSource', this.bgSource);
    this.log('bgPrefs', { bgBounds: this.bgBounds, bgUnits: this.bgUnits });
  };

  /**
   * Applies the default CGM sample interval filter to exclude non-standard readings.
   *
   * Filters CGM data to only include readings with sample intervals >= 5 minutes,
   * which excludes calibration readings and other non-standard data points that
   * could skew statistics.
   *
   * @private
   */
  filterCBGDataByDefaultSampleInterval = () => {
    this.dataUtil.filter.bySampleIntervalRange(...this.dataUtil.defaultCgmSampleIntervalRange);
  };

  /**
   * Calculates the average (mean) blood glucose value.
   *
   * Uses the current BG source (CGM or BGM) and applies appropriate filtering
   * and deduplication for CGM data.
   *
   * @param {boolean} [returnBgData=false] - If true, includes the raw BG data array
   *   in the result. Used internally by other stat methods that need the data.
   *
   * @returns {Object} Average glucose data:
   * @returns {number} returns.averageGlucose - Mean glucose value in current units
   * @returns {number} returns.total - Number of readings used in calculation
   * @returns {Array<Object>} [returns.bgData] - Raw BG data (only if returnBgData=true)
   */
  getAverageGlucoseData = (returnBgData = false) => {
    if (this.bgSource === CGM_DATA_KEY) this.filterCBGDataByDefaultSampleInterval();

    let bgData = _.cloneDeep(this.dataUtil.filter.byType(this.bgSource).top(Infinity));

    if (this.bgSource === CGM_DATA_KEY) {
      bgData = this.dataUtil.getDeduplicatedCBGData(bgData);
    }

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

  /**
   * Calculates blood glucose extent data (min, max, date range).
   *
   * Provides the minimum and maximum BG values along with information about
   * the oldest and newest readings, useful for displaying data range context.
   *
   * @returns {Object} BG extent data:
   * @returns {number|null} returns.bgMax - Maximum glucose value in current units
   * @returns {number|null} returns.bgMin - Minimum glucose value in current units
   * @returns {number} returns.bgDaysWorn - Number of days with BG data
   * @returns {Object|undefined} returns.newestDatum - Most recent BG reading (normalized)
   * @returns {Object|undefined} returns.oldestDatum - Oldest BG reading (normalized)
   */
  getBgExtentsData = () => {
    if (this.bgSource === CGM_DATA_KEY) this.filterCBGDataByDefaultSampleInterval();

    let bgData = _.cloneDeep(this.dataUtil.filter.byType(this.bgSource).top(Infinity));

    if (this.bgSource === CGM_DATA_KEY) {
      bgData = this.dataUtil.getDeduplicatedCBGData(bgData);
    }

    _.each(bgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    const rawBgData = this.dataUtil.sort.byTime(_.cloneDeep(bgData));
    const newestDatum = _.cloneDeep(_.last(rawBgData));
    const oldestDatum = _.cloneDeep(_.first(rawBgData));
    if (newestDatum) this.dataUtil.normalizeDatumOut(newestDatum, ['msPer24', 'localDate']);
    if (oldestDatum) this.dataUtil.normalizeDatumOut(oldestDatum, ['msPer24', 'localDate']);

    let bgDaysWorn;

    if (rawBgData.length < 2) {
      bgDaysWorn = rawBgData.length;
    } else {
      bgDaysWorn = moment.utc(newestDatum?.localDate).diff(moment.utc(oldestDatum?.localDate), 'days', true) + 1;
    }

    const data = {
      bgMax: _.get(_.maxBy(bgData, 'value'), 'value', null),
      bgMin: _.get(_.minBy(bgData, 'value'), 'value', null),
      bgDaysWorn,
      newestDatum,
      oldestDatum,
    };

    return data;
  };

  /**
   * Calculates insulin delivery data (basal, bolus, and total).
   *
   * Computes the total or daily average insulin delivered, broken down by
   * basal and bolus components. Also includes insulin pen/injection data
   * if available.
   *
   * @returns {Object} Insulin delivery data:
   * @returns {number} returns.basal - Basal insulin in units (or daily avg if multi-day)
   * @returns {number} returns.bolus - Bolus insulin in units (or daily avg if multi-day)
   * @returns {number} returns.insulin - Pen/injection insulin in units (or daily avg)
   *
   * @see {@link module:basal.getTotalBasalFromEndpoints} for basal calculation
   * @see {@link module:bolus.getTotalInsulin} for bolus calculation
   */
  getInsulinData = () => {
    const rawBasalData = this.dataUtil.sort.byTime(this.dataUtil.filter.byType('basal').top(Infinity));
    const basalData = this.dataUtil.addBasalOverlappingStart(_.cloneDeep(rawBasalData));
    const bolusData = this.dataUtil.filter.byType('bolus').top(Infinity);
    const insulinData = this.dataUtil.filter.byType('insulin').top(Infinity);

    // Create a list of all dates for which we have at least one datum
    const uniqueDatumDates = new Set([
      ...rawBasalData.map(datum => formatLocalizedFromUTC(datum.time, this.timePrefs, 'YYYY-MM-DD')),
      ...bolusData.map(datum => formatLocalizedFromUTC(datum.time, this.timePrefs, 'YYYY-MM-DD')),
      ...insulinData.map(datum => formatLocalizedFromUTC(datum.time, this.timePrefs, 'YYYY-MM-DD')),
    ]);

    const activeDaysWithInsulinData = uniqueDatumDates.size;

    const basalBolusData = {
      basal: basalData.length
        ? parseFloat(getTotalBasalFromEndpoints(basalData, this.endpoints))
        : NaN,
      bolus: bolusData.length ? getTotalInsulin(bolusData) : NaN,
      insulin: insulinData.length ? getTotalInsulin(insulinData) : NaN,
    };

    if (this.activeDays > 1 && activeDaysWithInsulinData > 1) {
      basalBolusData.basal = basalBolusData.basal / activeDaysWithInsulinData;
      basalBolusData.bolus = basalBolusData.bolus / activeDaysWithInsulinData;
      basalBolusData.insulin = basalBolusData.insulin / activeDaysWithInsulinData;
    }

    return basalBolusData;
  };

  /**
   * Calculates carbohydrate intake data.
   *
   * Aggregates carbohydrate data from both wizard (bolus calculator) records
   * and food records. Handles both gram and exchange units, converting
   * exchanges back to grams where needed.
   *
   * @returns {Object} Carbohydrate data:
   * @returns {Object} returns.carbs - Carb totals by unit type:
   *   - `grams` - Total/avg daily carbs in grams
   *   - `exchanges` - Total/avg daily carbs in exchanges
   * @returns {number} returns.total - Total number of carb records
   */
  getCarbsData = () => {
    const wizardData = this.dataUtil.filter.byType('wizard').top(Infinity);
    const foodData = this.dataUtil.filter.byType('food').top(Infinity);

    // Create a list of all dates for which we have at least one datum
    const uniqueDatumDates = new Set([
      ...wizardData.map(datum => formatLocalizedFromUTC(datum.time, this.timePrefs, 'YYYY-MM-DD')),
      ...foodData.map(datum => formatLocalizedFromUTC(datum.time, this.timePrefs, 'YYYY-MM-DD')),
    ]);

    const activeDaysWithCarbData = uniqueDatumDates.size;

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

    if (this.activeDays > 1 && activeDaysWithCarbData > 1) {
      carbs = {
        grams: carbs.grams / activeDaysWithCarbData,
        exchanges: carbs.exchanges / activeDaysWithCarbData,
      };
    }

    return {
      carbs,
      total: wizardData.length + foodData.length,
    };
  };

  /**
   * Calculates the Coefficient of Variation (CV) for blood glucose.
   *
   * CV% = (standard deviation / mean) × 100
   *
   * CV is a measure of glycemic variability that is normalized to the mean,
   * making it comparable across different glucose levels. A CV < 36% is
   * generally considered stable glycemic control.
   *
   * @returns {Object} CV data:
   * @returns {number} returns.coefficientOfVariation - CV as a percentage
   * @returns {number} returns.total - Number of readings used
   * @returns {boolean} [returns.insufficientData] - True if < 30 readings
   */
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

  /**
   * Converts sum totals to daily averages.
   *
   * @private
   * @param {Object} data - Object with numeric values to average
   * @returns {Object} Same structure with values divided by activeDays
   */
  getDailyAverageSums = data => {
    const clone = _.clone(data);

    _.each(clone, (value, key) => {
      if (key !== 'total') {
        clone[key] = value / this.activeDays;
      }
    });

    return clone;
  };

  /**
   * Converts duration totals to daily average durations.
   *
   * Normalizes duration values relative to a full day (MS_IN_DAY) for
   * displaying time-in-range as daily percentages.
   *
   * @private
   * @param {Object} data - Object with duration values in milliseconds
   * @returns {Object} Same structure with values as ms per day
   */
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

  /**
   * Calculates the Glucose Management Indicator (GMI).
   *
   * GMI (formerly eA1C) estimates HbA1c from CGM data using the formula:
   * GMI = 3.31 + (0.02392 × mean glucose in mg/dL)
   *
   * Per international consensus, GMI requires:
   * - CGM data (not SMBG)
   * - At least 14 days of data
   * - At least 70% sensor wear time over those 14 days
   *
   * @returns {Object} GMI data:
   * @returns {number} returns.glucoseManagementIndicator - GMI value (NaN if insufficient data)
   * @returns {number} returns.glucoseManagementIndicatorAGP - GMI for AGP reports
   *   (always calculated, AGP has different sufficiency requirements)
   * @returns {number} [returns.total] - Number of readings (if sufficient data)
   * @returns {boolean} [returns.insufficientData] - True if data requirements not met
   */
  getGlucoseManagementIndicatorData = () => {
    const { averageGlucose, bgData, total } = this.getAverageGlucoseData(true);

    const getTotalCbgDuration = () => _.reduce(
      bgData,
      (result, datum) => {
        result += datum.sampleInterval;
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

  /**
   * Calculates distribution of SMBG (fingerstick) readings across glucose ranges.
   *
   * Classifies each SMBG reading into glucose ranges (veryLow, low, target, high,
   * veryHigh) based on the configured bgBounds thresholds.
   *
   * @returns {Object} Readings in range data:
   * @returns {Object} returns.counts - Count of readings in each range:
   *   - `veryLow` - Below veryLowThreshold (if configured)
   *   - `low` - Below targetLowerBound
   *   - `target` - Between targetLowerBound and targetUpperBound
   *   - `high` - Above targetUpperBound
   *   - `veryHigh` - Above veryHighThreshold (if configured)
   *   - `total` - Total number of readings
   * @returns {Object} [returns.dailyAverages] - Daily average counts (if multi-day)
   */
  getReadingsInRangeData = () => {
    const smbgData = _.cloneDeep(this.dataUtil.filter.byType('smbg').top(Infinity));
    _.each(smbgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    const initialValue = {
      counts: {
        low: 0,
        target: 0,
        high: 0,
        total: 0,
      },
    };

    if (_.isNumber(this.bgBounds.veryLowThreshold)) {
      initialValue.counts.veryLow = 0;
    }

    if (_.isNumber(this.bgBounds.veryHighThreshold)) {
      initialValue.counts.veryHigh = 0;
    }

    const readingsInRangeData = _.reduce(
      smbgData,
      (result, datum) => {
        const classification = classifyBgValue(this.bgBounds, this.bgUnits, datum.value, 'fiveWay');
        result.counts[classification]++;
        result.counts.total++;
        return result;
      },
      initialValue
    );

    if (this.activeDays > 1) {
      readingsInRangeData.dailyAverages = this.getDailyAverageSums(readingsInRangeData.counts);
    }

    return readingsInRangeData;
  };

  /**
   * Calculates CGM sensor usage/wear time statistics.
   *
   * Computes both absolute sensor usage duration and percentage of time
   * with CGM data. Provides two percentage calculations:
   * - `sensorUsage` - Total sensor time vs total period (for Tidepool display)
   * - `sensorUsageAGP` - Percentage based on expected readings (for AGP reports)
   *
   * @returns {Object} Sensor usage data:
   * @returns {number} returns.sensorUsage - Total sensor wear time in ms
   * @returns {number} returns.sensorUsageAGP - Sensor usage percentage for AGP
   * @returns {number} returns.sampleInterval - CGM sample interval in ms (e.g., 300000 for 5-min)
   * @returns {number} returns.count - Number of CGM readings
   * @returns {number} returns.total - Total period duration in ms (activeDays × MS_IN_DAY)
   */
  getSensorUsage = () => {
    this.filterCBGDataByDefaultSampleInterval();
    const rawCbgData = this.dataUtil.filter.byType('cbg').top(Infinity);
    const cbgData = this.dataUtil.getDeduplicatedCBGData(rawCbgData);

    let sensorUsage = 0;
    for (let i = 0; i < cbgData.length; i++) {
      const datum = cbgData[i];
      this.dataUtil.setDataAnnotations(datum);

      sensorUsage += datum.sampleInterval;
    }

    const count = cbgData.length;
    const total = this.activeDays * MS_IN_DAY;

    const { newestDatum, oldestDatum } = this.getBgExtentsData();
    const sampleInterval = newestDatum?.sampleInterval || this.dataUtil.defaultCgmSampleInterval;
    if (newestDatum) this.dataUtil.normalizeDatumOut(newestDatum, ['msPer24', 'localDate']);
    if (oldestDatum) this.dataUtil.normalizeDatumOut(oldestDatum, ['msPer24', 'localDate']);

    let cgmMinutesWorn;

    if (cbgData.length < 2) {
      cgmMinutesWorn = cbgData.length === 1 ? sampleInterval : 0;
    } else {
      cgmMinutesWorn = Math.ceil(moment.utc(newestDatum?.time).diff(moment.utc(oldestDatum?.time), 'minutes', true));
    }

    const sensorUsageAGP = (
      count /
      ((cgmMinutesWorn / (sampleInterval / MS_IN_MIN)) + 1)
    ) * 100;

    return {
      sensorUsage,
      sensorUsageAGP,
      sampleInterval,
      count,
      total,
    };
  };

  /**
   * Calculates standard deviation of blood glucose values.
   *
   * Uses sample standard deviation formula (n-1 denominator).
   * Requires minimum 30 data points per BGM AGP specification.
   *
   * @returns {Object} Standard deviation data:
   * @returns {number} returns.averageGlucose - Mean glucose used in calculation
   * @returns {number} returns.standardDeviation - SD in current units (NaN if insufficient)
   * @returns {number} returns.total - Number of readings
   * @returns {boolean} [returns.insufficientData] - True if < 30 readings
   */
  getStandardDevData = () => {
    const { averageGlucose, bgData, total } = this.getAverageGlucoseData(true);

    // Minimum 30 data points to report stdev per BGM AGP Spec, which we also apply to TDP
    if (bgData.length < 30) {
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

  /**
   * Calculates time spent in automated vs manual basal delivery modes.
   *
   * Analyzes basal data to determine duration in each delivery mode
   * (automated, scheduled, etc.). Used for hybrid closed-loop systems
   * like Control-IQ, Loop, etc.
   *
   * @returns {Object|NaN} Time in auto data (NaN if no basal data):
   *   Object keyed by basal delivery group with duration values:
   *   - `automated` - Time in automated/closed-loop mode
   *   - `scheduled` - Time in manual/scheduled mode
   *   - Other keys depend on pump/algorithm type
   *   Values are ms durations (or ms per day if multi-day range)
   *
   * @see {@link module:basal.getBasalGroupDurationsFromEndpoints}
   */
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

  /**
   * Calculates time spent in pump settings override modes.
   *
   * Analyzes pumpSettingsOverride device events to calculate duration
   * spent in temporary override modes (e.g., Sleep, Exercise, Pre-Meal).
   * Override modes temporarily adjust insulin delivery parameters.
   *
   * @returns {Object|NaN} Time in override data (NaN if no override data):
   *   Object keyed by override type with duration values:
   *   - `sleep` - Time in sleep/rest mode
   *   - `physicalActivity` - Time in exercise mode
   *   - `preprandial` - Time in pre-meal mode
   *   - Other keys depend on pump capabilities
   *   Values are ms durations (or ms per day if multi-day range)
   */
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
            const normalEnd = _.min([this.endpoints[1], (datum.normalEnd || this.dataUtil.latestDiabetesDatumEnd)]);
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

  /**
   * Calculates time-in-range distribution for CGM data.
   *
   * This is the primary glycemic control metric for CGM users. Classifies
   * each CGM reading's duration into glucose ranges based on configured
   * bgBounds thresholds. Targets per international consensus:
   * - Time in Range (70-180 mg/dL): > 70%
   * - Time Below Range (< 70 mg/dL): < 4%
   * - Time Very Low (< 54 mg/dL): < 1%
   *
   * @returns {Object} Time in range data:
   * @returns {Object} returns.durations - Time in each range (ms or ms/day):
   *   - `veryLow` - Time < veryLowThreshold (if configured)
   *   - `low` - Time < targetLowerBound
   *   - `target` - Time in target range
   *   - `high` - Time > targetUpperBound
   *   - `veryHigh` - Time > veryHighThreshold (if configured)
   *   - `total` - Total CGM time
   * @returns {Object} returns.counts - Count of readings in each range
   *   (same keys as durations)
   */
  getTimeInRangeData = () => {
    this.filterCBGDataByDefaultSampleInterval();
    const rawCbgData = this.dataUtil.filter.byType('cbg').top(Infinity);
    const cbgData = this.dataUtil.getDeduplicatedCBGData(rawCbgData);
    _.each(cbgData, d => this.dataUtil.normalizeDatumBgUnits(d));

    const initialValue = {
      durations: { low: 0, target: 0, high: 0, total: 0 },
      counts: { low: 0, target: 0, high: 0, total: 0 },
    };

    if (_.isNumber(this.bgBounds.veryLowThreshold)) {
      initialValue.durations.veryLow = 0;
      initialValue.counts.veryLow = 0;
    }

    if (_.isNumber(this.bgBounds.veryHighThreshold)) {
      initialValue.durations.veryHigh = 0;
      initialValue.counts.veryHigh = 0;
    }

    const timeInRangeData = _.reduce(
      cbgData,
      (result, datum) => {
        this.dataUtil.setDataAnnotations(datum);
        const classification = classifyBgValue(this.bgBounds, this.bgUnits, datum.value, 'fiveWay');
        const duration = datum.sampleInterval;
        result.durations[classification] += duration;
        result.durations.total += duration;
        result.counts[classification]++;
        result.counts.total++;
        return result;
      },
      initialValue
    );

    if (this.activeDays > 1) {
      timeInRangeData.durations = this.getDailyAverageDurations(timeInRangeData.durations);
    }

    return timeInRangeData;
  };

  /**
   * Calculates total daily insulin dose.
   *
   * Sums basal, bolus, and pen/injection insulin to provide total daily
   * dose (TDD). Used for displaying overall insulin delivery and for
   * weight-based dosing calculations (units/kg).
   *
   * @returns {Object} Total insulin data:
   * @returns {number} returns.totalInsulin - Total insulin in units
   *   (sum of basal + bolus + pen insulin, treating NaN as 0)
   */
  getTotalInsulinData = () => {
    const { basal, bolus, insulin } = this.getInsulinData();

    const totalInsulin = _.reduce([basal, bolus, insulin], (result, value) => {
      const delivered = _.isNaN(value) ? 0 : value || 0;
      return result + delivered;
    }, 0);

    return {
      totalInsulin,
    };
  };
}

export default StatUtil;
