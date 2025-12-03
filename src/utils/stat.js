import _ from 'lodash';
import React from 'react';
import i18next from 'i18next';

import {
  generateBgRangeLabels,
  classifyBgValue,
  classifyCvValue,
  reshapeBgClassesToBgBounds,
} from './bloodglucose';

import {
  AUTOMATED_DELIVERY,
  BG_COLORS,
  LBS_PER_KG,
  MS_IN_DAY,
  SCHEDULED_DELIVERY,
  SETTINGS_OVERRIDE,
} from './constants';

import { getPumpVocabulary, getSettingsOverrides } from './device';
import { bankersRound, formatDecimalNumber, formatBgValue, formatStatsPercentage } from './format';
import { formatDuration } from './datetime';

const t = i18next.t.bind(i18next);

if (_.get(i18next, 'options.returnEmptyString') === undefined) {
  // Return key if no translation is present
  i18next.init({ returnEmptyString: false, nsSeparator: '|' });
}

export const dailyDoseUnitOptions = [
  {
    label: 'kg',
    value: 'kg',
  },
  {
    label: 'lb',
    value: 'lb',
  },
];

export const statTypes = {
  barHorizontal: 'barHorizontal',
  barBg: 'barBg',
  input: 'input',
  simple: 'simple',
};

export const statBgSourceLabels = {
  cbg: t('CGM'),
  smbg: t('BGM'),
};

export const statFormats = {
  bgCount: 'bgCount',
  bgRange: 'bgRange',
  bgValue: 'bgValue',
  cv: 'cv',
  carbs: 'carbs',
  duration: 'duration',
  gmi: 'gmi',
  percentage: 'percentage',
  standardDevRange: 'standardDevRange',
  standardDevValue: 'standardDevValue',
  units: 'units',
  unitsPerKg: 'unitsPerKg',
};

export const commonStats = {
  averageGlucose: 'averageGlucose',
  averageDailyDose: 'averageDailyDose',
  bgExtents: 'bgExtents',
  carbs: 'carbs',
  coefficientOfVariation: 'coefficientOfVariation',
  glucoseManagementIndicator: 'glucoseManagementIndicator',
  readingsInRange: 'readingsInRange',
  sensorUsage: 'sensorUsage',
  standardDev: 'standardDev',
  timeInAuto: 'timeInAuto',
  timeInOverride: 'timeInOverride',
  timeInRange: 'timeInRange',
  totalInsulin: 'totalInsulin',
};

export const statFetchMethods = {
  [commonStats.averageGlucose]: 'getAverageGlucoseData',
  [commonStats.averageDailyDose]: 'getTotalInsulinData',
  [commonStats.bgExtents]: 'getBgExtentsData',
  [commonStats.carbs]: 'getCarbsData',
  [commonStats.coefficientOfVariation]: 'getCoefficientOfVariationData',
  [commonStats.glucoseManagementIndicator]: 'getGlucoseManagementIndicatorData',
  [commonStats.readingsInRange]: 'getReadingsInRangeData',
  [commonStats.sensorUsage]: 'getSensorUsage',
  [commonStats.standardDev]: 'getStandardDevData',
  [commonStats.timeInAuto]: 'getTimeInAutoData',
  [commonStats.timeInOverride]: 'getTimeInOverrideData',
  [commonStats.timeInRange]: 'getTimeInRangeData',
  [commonStats.totalInsulin]: 'getBasalBolusData',
};

export const getSum = data => _.sum(_.map(data, d => _.max([d.value, 0])));

export const ensureNumeric = value => (_.isNil(value) || _.isNaN(value) ? -1 : parseFloat(value));

export const isRangeDefined = value => ensureNumeric(value) > -1;

export const formatDatum = (datum = {}, format, opts = {}) => {
  let id = datum.id;
  let value = _.isFinite(datum) ? datum : datum.value;
  let suffix = datum.suffix || '';
  let deviation;
  let lowerValue;
  let lowerColorId;
  let upperValue;
  let upperColorId;

  const {
    bgPrefs,
    data,
    useAGPFormat,
    emptyDataPlaceholder = '--',
    forcePlainTextValues = false,
  } = opts;

  const total = _.get(data, 'total.value');

  const disableStat = () => {
    id = 'statDisabled';
    value = emptyDataPlaceholder;
  };

  switch (format) {
    case statFormats.bgCount:
      if (value >= 0) {
        const precision = value < 0.05 ? 2 : 1;
        // Note: the + converts the rounded, fixed string back to a number
        // This allows 2.67777777 to render as 2.7 and 3.0000001 to render as 3 (not 3.0)
        value = +value.toFixed(precision);
      } else {
        disableStat();
      }
      break;

    case statFormats.bgRange:
      value = generateBgRangeLabels(bgPrefs, { condensed: true })[id];
      break;

    case statFormats.bgValue:
      if (value >= 0) {
        id = classifyBgValue(_.get(bgPrefs, 'bgBounds'), bgPrefs?.bgUnits, value, 'threeWay');
        value = formatBgValue(value, bgPrefs);
      } else {
        disableStat();
      }
      break;

    case statFormats.carbs:
      if (_.isPlainObject(value) && (value.grams > 0 || value.exchanges > 0)) {
        const { grams, exchanges } = value;
        value = [];
        suffix = [];
        if (grams > 0) {
          value.push(formatDecimalNumber(grams));
          suffix.push('g');
        }
        if (exchanges > 0) {
          // Note: the + converts the rounded, fixed string back to a number
          // This allows 2.67777777 to render as 2.7 and 3.0000001 to render as 3 (not 3.0)
          value.push(+formatDecimalNumber(exchanges, 1));
          suffix.push('exch');
        }
      } else {
        disableStat();
      }
      break;

    case statFormats.cv:
      if (value >= 0) {
        id = classifyCvValue(value);
        value = useAGPFormat
          ? bankersRound(value, 1).toString()
          : formatDecimalNumber(value);
        suffix = '%';
      } else {
        disableStat();
      }
      break;

    case statFormats.duration:
      if (value >= 0) {
        value = formatDuration(value, { condensed: true });
      } else {
        disableStat();
      }
      break;

    case statFormats.gmi:
      if (value >= 0) {
        value = useAGPFormat
          ? bankersRound(value, 1).toString()
          : formatDecimalNumber(value, 1);
        suffix = '%';
      } else {
        disableStat();
      }
      break;

    case statFormats.percentage:
      if (total && total >= 0) {
        value = _.max([value, 0]);
        value = formatStatsPercentage(value / total);
        suffix = '%';
      } else {
        disableStat();
      }
      break;

    case statFormats.standardDevRange:
      deviation = _.get(datum, 'deviation.value', -1);
      if (value >= 0 && deviation >= 0) {
        lowerValue = value - deviation;
        lowerColorId = lowerValue >= 0
          ? classifyBgValue(_.get(bgPrefs, 'bgBounds'), bgPrefs?.bgUnits, lowerValue, 'threeWay')
          : 'low';

        upperValue = value + deviation;
        upperColorId = classifyBgValue(_.get(bgPrefs, 'bgBounds'), bgPrefs?.bgUnits, upperValue, 'threeWay');

        lowerValue = formatBgValue(lowerValue, bgPrefs);
        upperValue = formatBgValue(upperValue, bgPrefs);

        value = !forcePlainTextValues ? (
          <span>
            <span style={{
              color: BG_COLORS[lowerColorId],
            }}>
              {lowerValue}
            </span>
            &nbsp;-&nbsp;
            <span style={{
              color: BG_COLORS[upperColorId],
            }}>
              {upperValue}
            </span>
          </span>
        ) : `${lowerValue}-${upperValue}`;
      } else {
        disableStat();
      }
      break;

    case statFormats.standardDevValue:
      if (value >= 0) {
        value = formatBgValue(value, bgPrefs);
      } else {
        disableStat();
      }
      break;

    case statFormats.units:
      if (value >= 0) {
        value = formatDecimalNumber(value, 1);
        suffix = 'U';
      } else {
        disableStat();
      }
      break;

    case statFormats.unitsPerKg:
      if (suffix === 'lb') {
        value = value * LBS_PER_KG;
      }
      suffix = 'U/kg';
      if (value > 0 && _.isFinite(value)) {
        value = formatDecimalNumber(value, 2);
      } else {
        disableStat();
      }
      break;

    default:
      break;
  }

  return {
    id,
    value,
    suffix,
  };
};

/**
 * reconcileTIRPercentages
 * @param {Object} timeInRanges - the percent TIR values for each range in decimal form
 * - e.g. { veryLow: 0.012, low: 0.056, target: 0.612, high: 0.294, veryHigh: 0.021 }
 *
 * @returns {Object} an object with values corrected to sum up to 100%
 * - if the values do not sum up to 100%, the 'high' range is adjusted to compensate
 */
export const reconcileTIRPercentages = (timeInRanges) => {
  const DECIMAL_PRECISION = 2;

  // Round each TIR value to whole integers for percentages (e.g. 0.21428 -> 0.21)
  const modifiedTimeInRanges = _.cloneDeep(timeInRanges);
  const rangeKeys = _.keys(modifiedTimeInRanges);

  _.forEach(rangeKeys, key => {
    modifiedTimeInRanges[key] = bankersRound(modifiedTimeInRanges[key], DECIMAL_PRECISION);
  });

  // Calculate the sum of all TIR values. It should be close to 1 (or 100%)
  const rangeValues = _.values(modifiedTimeInRanges);
  const sum = _.reduce(rangeValues, (acc, cur) => acc + cur, 0);

  // Error Case: If the discrepancy from 100% is >2%, there is something wrong with
  // the incoming data. Performing additional calculations on TIR would compound the
  // error. Instead, we'll return the data in its original state.
  if (sum < 0.98 || sum > 1.02) return timeInRanges;

  // Calculate the difference from 100% and dump the discrepancy into the 'high' range.
  // e.g. if sum === 0.99 and high === 0.21, we increase high to 0.22 so that all TIR
  // values add up to 1 (or 100%).
  const diff = 1 - sum;
  const newHigh = bankersRound(modifiedTimeInRanges.high + diff, DECIMAL_PRECISION);
  modifiedTimeInRanges.high = newHigh;

  return modifiedTimeInRanges;
};

export const getStatAnnotations = (data, type, opts = {}) => {
  const { bgSource, days, manufacturer } = opts;
  const vocabulary = getPumpVocabulary(manufacturer);
  const labels = { overrideLabel: vocabulary[SETTINGS_OVERRIDE], overrideLabelLowerCase: _.lowerCase(vocabulary[SETTINGS_OVERRIDE]) };

  const annotations = [];

  const bgStats = [
    commonStats.averageGlucose,
    commonStats.coefficientOfVariation,
    commonStats.glucoseManagementIndicator,
    commonStats.readingsInRange,
    commonStats.timeInRange,
    commonStats.standardDev,
  ];

  switch (type) {
    case commonStats.averageGlucose:
      annotations.push(t('**Avg. Glucose ({{bgSourceLabel}}):** All {{bgSourceLabel}} glucose values added together, divided by the number of readings.', { bgSourceLabel: statBgSourceLabels[bgSource] }));
      break;

    case commonStats.averageDailyDose:
      if (days > 1) {
        annotations.push(t('**Avg. Daily Insulin:** All basal and bolus insulin delivery (in Units) added together, divided by the number of days in this view for which we have insulin data.'));
      } else {
        annotations.push(t('**Daily Insulin:** All basal and bolus insulin delivery (in Units) added together.'));
      }
      break;

    case commonStats.carbs:
      if (days > 1) {
        annotations.push(t('**Avg. Daily Carbs**: All carb entries added together, then divided by the number of days in this view for which we have carb data. Note, these entries come from either bolus wizard events, or Apple Health records.'));
      } else {
        annotations.push(t('**Total Carbs**: All carb entries from bolus wizard events or Apple Health records added together.'));
      }
      annotations.push(t('Derived from _**{{total}}**_ carb entries.', { total: data.total }));
      break;

    case commonStats.coefficientOfVariation:
      annotations.push(t('**CV (Coefficient of Variation):** How far apart (wide) glucose values are; research suggests a target of 36% or lower.'));
      break;

    case commonStats.glucoseManagementIndicator:
      annotations.push(t('**GMI (Glucose Management Indicator):** Tells you what your approximate A1C level is likely to be, based on the average glucose level from your CGM readings.'));
      break;

    case commonStats.readingsInRange:
      annotations.push(t('**Readings In Range:** Daily average of the number of {{smbgLabel}} readings.', { smbgLabel: statBgSourceLabels.smbg }));
      break;

    case commonStats.sensorUsage:
      annotations.push(t('**Sensor Usage:** Time the {{cbgLabel}} collected data, divided by the total time represented in this view.', { cbgLabel: statBgSourceLabels.cbg }));
      break;

    case commonStats.standardDev:
      annotations.push(t('**SD (Standard Deviation):** How far values are from the average.'));
      break;

    case commonStats.timeInAuto:
      if (days > 1) {
        annotations.push(t('**Time In {{automatedLabel}}:** Daily average of the time spent in automated basal delivery.', { automatedLabel: vocabulary[AUTOMATED_DELIVERY] }));
        annotations.push(t('**How we calculate this:**\n\n**(%)** is the duration in {{automatedLabel}} divided by the total duration of basals for this time period.\n\n**(time)** is 24 hours multiplied by % in {{automatedLabel}}.', { automatedLabel: vocabulary[AUTOMATED_DELIVERY] }));
      } else {
        annotations.push(t('**Time In {{automatedLabel}}:** Time spent in automated basal delivery.', { automatedLabel: vocabulary[AUTOMATED_DELIVERY] }));
        annotations.push(t('**How we calculate this:**\n\n**(%)** is the duration in {{automatedLabel}} divided by the total duration of basals for this time period.\n\n**(time)** is total duration of time in {{automatedLabel}}.', { automatedLabel: vocabulary[AUTOMATED_DELIVERY] }));
      }
      break;

    case commonStats.timeInOverride:
      if (days > 1) {
        annotations.push(t('**Time In {{overrideLabel}}:** Daily average of the time spent in {{overrideLabelLowerCase}}.', labels));
        annotations.push(t('**How we calculate this:**\n\n**(%)** is the duration in {{overrideLabelLowerCase}} divided by the total duration for this time period.\n\n**(time)** is 24 hours multiplied by % in {{overrideLabelLowerCase}}.', labels));
      } else {
        annotations.push(t('**Time In {{overrideLabel}}:** Time spent in {{overrideLabelLowerCase}}.', labels));
        annotations.push(t('**How we calculate this:**\n\n**(%)** is the duration in {{overrideLabelLowerCase}} divided by the total duration for this time period.\n\n**(time)** is total duration of time in {{overrideLabelLowerCase}}.', labels));
      }
      break;

    case commonStats.timeInRange:
      if (days > 1) {
        annotations.push(t('**Time In Range:** Daily average of the time spent in range, based on {{cbgLabel}} readings.', { cbgLabel: statBgSourceLabels.cbg }));
        annotations.push(t('**How we calculate this:**\n\n**(%)** is the number of readings in range divided by all readings for this time period.\n\n**(time)** is 24 hours multiplied by % in range.'));
      } else {
        annotations.push(t('**Time In Range:** Time spent in range, based on {{cbgLabel}} readings.', { cbgLabel: statBgSourceLabels.cbg }));
        annotations.push(t('**How we calculate this:**\n\n**(%)** is the number of readings in range divided by all readings for this time period.\n\n**(time)** is number of readings in range multiplied by the {{cbgLabel}} sample frequency.', { cbgLabel: statBgSourceLabels.cbg }));
      }
      break;

    case commonStats.totalInsulin:
      if (days > 1) {
        annotations.push(t('**Total Insulin:** All basal and bolus insulin delivery (in Units) added together, divided by the number of days in this view for which we have insulin data'));
      } else {
        annotations.push(t('**Total Insulin:** All basal and bolus insulin delivery (in Units) added together'));
      }
      annotations.push(t('**How we calculate this:**\n\n**(%)** is the respective total of basal or bolus delivery divided by total insulin delivered for the time period for which we have insulin data.'));
      break;

    default:
      break;
  }

  if (data.insufficientData) {
    annotations.push(t('**Why is this stat empty?**\n\nThere is not enough data present in this view to calculate it.'));
  } else if (_.includes(bgStats, type)) {
    if (bgSource === 'smbg') {
      annotations.push(t('Derived from _**{{total}}**_ {{smbgLabel}} readings.', { total: _.get(data, 'counts.total', data.total), smbgLabel: statBgSourceLabels.smbg }));
    }
  }

  return annotations;
};

export const getStatData = (data, type, opts = {}) => {
  const vocabulary = getPumpVocabulary(opts.manufacturer);
  const settingsOverrides = getSettingsOverrides(opts.manufacturer);
  const bgRanges = generateBgRangeLabels(opts.bgPrefs, { condensed: true });

  let statData = {
    raw: {
      days: opts.days,
      ...data,
    },
  };

  const readingsInRangeDataPath = opts.days > 1 ? 'dailyAverages' : 'counts';

  switch (type) {
    case commonStats.averageGlucose:
      statData.data = [
        {
          value: ensureNumeric(data.averageGlucose),
        },
      ];

      statData.dataPaths = {
        summary: 'data.0',
      };
      break;

    case commonStats.averageDailyDose:
      statData.data = [
        {
          id: 'insulin',
          input: {
            id: 'weight',
            label: 'Weight',
            suffix: {
              id: 'units',
              options: dailyDoseUnitOptions,
              value: opts.suffixValue || dailyDoseUnitOptions[0],
            },
            type: 'number',
            value: opts.inputValue ? ensureNumeric(opts.inputValue) : undefined,
          },
          output: {
            label: 'Daily Dose ÷ Weight',
            type: 'divisor',
            dataPaths: {
              dividend: 'data.0',
            },
          },
          value: ensureNumeric(data.totalInsulin),
        },
      ];

      statData.dataPaths = {
        input: 'data.0.input',
        output: 'data.0.output',
        summary: 'data.0',
      };
      break;

    case commonStats.bgExtents:
      statData.data = [
        {
          id: 'bgMax',
          value: ensureNumeric(data.bgMax),
          title: t('Max BG'),
        },
        {
          id: 'bgMin',
          value: ensureNumeric(data.bgMin),
          title: t('Min BG'),
        },
      ];
      break;

    case commonStats.carbs:
      statData.data = [
        {
          value: {
            grams: ensureNumeric(_.get(data, 'carbs.grams')),
            exchanges: ensureNumeric(_.get(data, 'carbs.exchanges')),
          },
        },
      ];

      statData.dataPaths = {
        summary: 'data.0',
      };
      break;

    case commonStats.coefficientOfVariation:
      statData.data = [
        {
          id: 'cv',
          value: ensureNumeric(data.coefficientOfVariation),
        },
      ];

      statData.dataPaths = {
        summary: 'data.0',
      };
      break;

    case commonStats.glucoseManagementIndicator:
      statData.data = [
        {
          id: 'gmi',
          value: ensureNumeric(data.glucoseManagementIndicator),
        },
        {
          id: 'gmiAGP',
          value: ensureNumeric(data.glucoseManagementIndicatorAGP),
        },
      ];

      statData.dataPaths = {
        summary: 'data.0',
        summaryAGP: 'data.1',
      };
      break;

    case commonStats.readingsInRange:
      statData.data = _.filter([
        (isRangeDefined(data[readingsInRangeDataPath]?.veryLow) && ({
          id: 'veryLow',
          value: ensureNumeric(data[readingsInRangeDataPath].veryLow),
          title: t('Readings Below Range'),
          legendTitle: bgRanges.veryLow,
        })),
        {
          id: 'low',
          value: ensureNumeric(data[readingsInRangeDataPath].low),
          title: t('Readings Below Range'),
          legendTitle: bgRanges.low,
        },
        {
          id: 'target',
          value: ensureNumeric(data[readingsInRangeDataPath].target),
          title: t('Readings In Range'),
          legendTitle: bgRanges.target,
        },
        {
          id: 'high',
          value: ensureNumeric(data[readingsInRangeDataPath].high),
          title: t('Readings Above Range'),
          legendTitle: bgRanges.high,
        },
        (isRangeDefined(data[readingsInRangeDataPath]?.veryHigh) && ({
          id: 'veryHigh',
          value: ensureNumeric(data[readingsInRangeDataPath].veryHigh),
          title: t('Readings Above Range'),
          legendTitle: bgRanges.veryHigh,
        })),
      ], Boolean);

      statData.total = { value: getSum(statData.data) };
      statData.dataPaths = {
        summary: [
          'data',
          _.findIndex(statData.data, { id: 'target' }),
        ],
        totalReadings: 'raw.counts.total',
        averageDailyReadings: 'total',
      };
      break;

    case commonStats.sensorUsage:
      statData.data = [
        {
          value: ensureNumeric(data.sensorUsage),
        },
        {
          value: ensureNumeric(data.sensorUsageAGP),
        },
      ];
      statData.total = { value: ensureNumeric(data.total) };
      statData.dataPaths = {
        summary: 'data.0',
        summaryAGP: 'data.1',
      };
      break;

    case commonStats.standardDev:
      statData.data = [
        {
          value: ensureNumeric(data.averageGlucose),
          deviation: {
            value: ensureNumeric(data.standardDeviation),
          },
        },
      ];

      statData.dataPaths = {
        summary: 'data.0.deviation',
        title: 'data.0',
      };
      break;

    case commonStats.timeInAuto:
      statData.data = [
        {
          id: 'basalAutomated',
          value: ensureNumeric(data.automated),
          title: t('Time In {{automatedLabel}}', { automatedLabel: vocabulary[AUTOMATED_DELIVERY] }),
          legendTitle: vocabulary[AUTOMATED_DELIVERY],
        },
        {
          id: 'basal',
          value: ensureNumeric(data.manual),
          title: t('Time In {{scheduledLabel}}', { scheduledLabel: vocabulary[SCHEDULED_DELIVERY] }),
          legendTitle: vocabulary[SCHEDULED_DELIVERY],
        },
      ];

      statData.total = { value: getSum(statData.data) };
      statData.dataPaths = {
        summary: [
          'data',
          _.findIndex(statData.data, { id: 'basalAutomated' }),
        ],
      };
      break;

    case commonStats.timeInOverride:
      statData.data = _.map(settingsOverrides, override => ({
        id: override,
        value: ensureNumeric(_.get(data, override, 0)),
        title: t('Time In {{overrideLabel}}', { overrideLabel: _.get(vocabulary, [override, 'label']) }),
        legendTitle: _.get(vocabulary, [override, 'label']),
      }));

      statData.sum = { value: getSum(statData.data) };
      statData.total = { value: MS_IN_DAY };
      statData.dataPaths = {
        summary: 'sum',
      };
      break;

    case commonStats.timeInRange:
      statData.data = _.filter([
        (isRangeDefined(data.durations.veryLow) && ({
          id: 'veryLow',
          value: ensureNumeric(data.durations.veryLow),
          title: t('Time Below Range'),
          legendTitle: bgRanges.veryLow,
        })),
        {
          id: 'low',
          value: ensureNumeric(data.durations.low),
          title: t('Time Below Range'),
          legendTitle: bgRanges.low,
        },
        {
          id: 'target',
          value: ensureNumeric(data.durations.target),
          title: t('Time In Range'),
          legendTitle: bgRanges.target,
        },
        {
          id: 'high',
          value: ensureNumeric(data.durations.high),
          title: t('Time Above Range'),
          legendTitle: bgRanges.high,
        },
        (isRangeDefined(data.durations.veryHigh) && ({
          id: 'veryHigh',
          value: ensureNumeric(data.durations.veryHigh),
          title: t('Time Above Range'),
          legendTitle: bgRanges.veryHigh,
        })),
      ], Boolean);

      statData.total = { value: getSum(statData.data) };
      statData.dataPaths = {
        summary: [
          'data',
          _.findIndex(statData.data, { id: 'target' }),
        ],
      };
      break;

    case commonStats.totalInsulin:
      statData.data = [
        {
          id: 'bolus',
          value: ensureNumeric(data.bolus),
          title: t('Bolus Insulin'),
          legendTitle: t('Bolus'),
        },
        {
          id: 'basal',
          value: ensureNumeric(data.basal),
          title: t('Basal Insulin'),
          legendTitle: t('Basal'),
        },
      ];

      statData.total = { id: 'insulin', value: getSum(statData.data) };
      statData.dataPaths = {
        summary: 'total',
        title: 'total',
      };
      break;

    default:
      statData = undefined;
      break;
  }

  return statData;
};

export const getStatTitle = (type, opts = {}) => {
  const { bgSource, days } = opts;
  const vocabulary = getPumpVocabulary(opts.manufacturer);
  const bgTypeLabel = bgSource === 'cbg' ? t('Glucose') : t('BG');

  let title;

  switch (type) {
    case commonStats.averageGlucose:
      title = t('Avg. Glucose ({{bgSourceLabel}})', { bgSourceLabel: statBgSourceLabels[bgSource] });
      break;

    case commonStats.averageDailyDose:
      title = (days > 1) ? t('Avg. Daily Insulin') : t('Total Insulin');
      break;

    case commonStats.bgExtents:
      title = t('{{bgTypeLabel}} Extents ({{bgSourceLabel}})', { bgSourceLabel: statBgSourceLabels[bgSource], bgTypeLabel });
      break;

    case commonStats.carbs:
      title = (days > 1) ? t('Avg. Daily Carbs') : t('Total Carbs');
      break;

    case commonStats.coefficientOfVariation:
      title = t('CV ({{bgSourceLabel}})', { bgSourceLabel: statBgSourceLabels[bgSource] });
      break;

    case commonStats.glucoseManagementIndicator:
      title = t('GMI ({{bgSourceLabel}})', { bgSourceLabel: statBgSourceLabels[bgSource] });
      break;

    case commonStats.readingsInRange:
      title = (days > 1) ? t('Avg. Daily Readings In Range') : t('Readings In Range');
      break;

    case commonStats.sensorUsage:
      title = t('Sensor Usage');
      break;

    case commonStats.standardDev:
      title = t('Std. Deviation ({{bgSourceLabel}})', { bgSourceLabel: statBgSourceLabels[bgSource] });
      break;

    case commonStats.timeInAuto:
      title = (days > 1)
        ? t('Avg. Daily Time In {{automatedLabel}}', { automatedLabel: vocabulary[AUTOMATED_DELIVERY] })
        : t('Time In {{automatedLabel}}', { automatedLabel: vocabulary[AUTOMATED_DELIVERY] });
      break;

    case commonStats.timeInOverride:
      title = (days > 1)
        ? t('Avg. Daily Time In {{overrideLabel}}', { overrideLabel: vocabulary[SETTINGS_OVERRIDE] })
        : t('Time In {{overrideLabel}}', { overrideLabel: vocabulary[SETTINGS_OVERRIDE] });
      break;

    case commonStats.timeInRange:
      title = (days > 1) ? t('Avg. Daily Time In Range') : t('Time In Range');
      break;

    case commonStats.totalInsulin:
      title = (days > 1) ? t('Avg. Daily Total Insulin') : t('Total Insulin');
      break;

    default:
      title = '';
      break;
  }

  return title;
};

export const getStatDefinition = (data = {}, type, opts = {}) => {
  let stat = {
    annotations: getStatAnnotations(data, type, opts),
    collapsible: _.get(opts, 'collapsible', false),
    data: getStatData(data, type, opts),
    id: type,
    title: getStatTitle(type, opts),
    type: statTypes.barHorizontal,
  };

  switch (type) {
    case commonStats.averageGlucose:
      stat.dataFormat = {
        label: statFormats.bgValue,
        summary: statFormats.bgValue,
      };
      stat.type = statTypes.barBg;
      stat.units = _.get(opts, 'bgPrefs.bgUnits');
      break;

    case commonStats.averageDailyDose:
      stat.alwaysShowSummary = true;
      stat.dataFormat = {
        output: statFormats.unitsPerKg,
        summary: statFormats.units,
      };
      stat.type = statTypes.input;
      break;

    case commonStats.bgExtents:
      stat.dataFormat = {
        label: statFormats.bgValue,
        summary: statFormats.bgValue,
      };
      stat.type = statTypes.simple;
      stat.units = _.get(opts, 'bgPrefs.bgUnits');
      break;

    case commonStats.carbs:
      stat.dataFormat = {
        summary: statFormats.carbs,
      };
      stat.type = statTypes.simple;
      break;

    case commonStats.coefficientOfVariation:
      stat.dataFormat = {
        summary: statFormats.cv,
      };
      stat.type = statTypes.simple;
      break;

    case commonStats.glucoseManagementIndicator:
      stat.dataFormat = {
        summary: statFormats.gmi,
      };
      stat.type = statTypes.simple;
      break;

    case commonStats.readingsInRange:
      stat.alwaysShowTooltips = true;
      stat.dataFormat = {
        label: statFormats.percentage,
        summary: statFormats.percentage,
        tooltip: statFormats.bgCount,
        tooltipTitle: statFormats.bgRange,
        count: statFormats.bgCount,
      };
      stat.legend = true;
      stat.hideSummaryUnits = true;
      stat.reverseLegendOrder = true;
      stat.units = _.get(opts, 'bgPrefs.bgUnits');
      break;

    case commonStats.sensorUsage:
      stat.dataFormat = {
        summary: statFormats.percentage,
      };
      stat.type = statTypes.simple;
      break;

    case commonStats.standardDev:
      stat.dataFormat = {
        label: statFormats.standardDevValue,
        summary: statFormats.standardDevValue,
        title: statFormats.standardDevRange,
      };
      stat.type = statTypes.barBg;
      stat.units = _.get(opts, 'bgPrefs.bgUnits');
      break;

    case commonStats.timeInAuto:
      stat.alwaysShowTooltips = true;
      stat.dataFormat = {
        label: statFormats.percentage,
        summary: statFormats.percentage,
        tooltip: statFormats.duration,
      };
      stat.legend = true;
      break;

    case commonStats.timeInOverride:
      stat.alwaysShowTooltips = true;
      stat.dataFormat = {
        label: statFormats.percentage,
        summary: statFormats.percentage,
        tooltip: statFormats.duration,
      };
      stat.legend = true;
      stat.reverseLegendOrder = true;
      break;

    case commonStats.timeInRange:
      stat.alwaysShowTooltips = true;
      stat.dataFormat = {
        label: statFormats.percentage,
        summary: statFormats.percentage,
        tooltip: statFormats.duration,
        tooltipTitle: statFormats.bgRange,
      };
      stat.legend = true;
      stat.hideSummaryUnits = true;
      stat.reverseLegendOrder = true;
      stat.units = _.get(opts, 'bgPrefs.bgUnits');
      break;

    case commonStats.totalInsulin:
      stat.alwaysShowTooltips = true;
      stat.dataFormat = {
        label: statFormats.percentage,
        summary: statFormats.units,
        title: statFormats.units,
        tooltip: statFormats.units,
      };
      stat.legend = true;
      break;

    default:
      stat = undefined;
      break;
  }

  return stat;
};

/**
 * statsText
 * @param  {Object} stats - all stats data
 * @param  {Object} textUtil - TextUtil instance
 * @param  {Object} bgPrefs - bgPrefs object from blip containing tideline-style bgClasses
 *
 * @return {String}  Stats data as a formatted string
 */
export function statsText(stats, textUtil, bgPrefs, formatFn = formatDatum) {
  _.defaults(bgPrefs, {
    bgBounds: reshapeBgClassesToBgBounds(bgPrefs),
  });

  let statsString = '';

  _.each(stats, stat => {
    const renderTable = _.includes([
      commonStats.timeInRange,
      commonStats.readingsInRange,
      commonStats.totalInsulin,
      commonStats.timeInAuto,
      commonStats.timeInOverride,
      commonStats.bgExtents,
    ], stat.id);

    const renderSecondaryValue = _.includes([
      commonStats.readingsInRange,
      commonStats.timeInAuto,
      commonStats.timeInOverride,
      commonStats.timeInRange,
    ], stat.id);

    const opts = { bgPrefs, data: stat.data, forcePlainTextValues: true };
    let statTitle = `${stat.title}${stat.units ? ` (${stat.units})` : ''}`;

    if (stat.id === 'readingsInRange' && stat.data?.raw?.total > 0) {
      statTitle += t(' from {{count}} readings', { count: stat.data.raw.total });
    }

    if (renderTable) {
      statsString += textUtil.buildTextTable(
        statTitle,
        _.map(_.reverse([...stat.data.data]), datum => {
          const formatted = formatFn(
            datum,
            stat.dataFormat.summary,
            opts
          );

          let formattedText = `${formatted.value}${formatted.suffix || ''}`;

          if (renderSecondaryValue) {
            const secondary = formatFn(
              datum,
              stat.dataFormat.tooltip,
              opts
            );

            if (stat.id === 'readingsInRange') secondary.suffix += ' readings/day';
            formattedText += ` (${secondary.value}${secondary.suffix || ''})`;
          }

          return {
            label: datum.legendTitle || datum.title,
            value: formattedText,
          };
        }),
        [
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Value' },
        ],
        { showHeader: false }
      );
    } else {
      const formatted = formatFn(
        _.get(stat.data, stat.data.dataPaths.summary, {}),
        stat.dataFormat.summary,
        opts
      );

      // Ensure zero values are not stripped by _.compact when setting values array
      if (formatted.value === 0) formatted.value = [formatted.value];
      if (!_.isArray(formatted.value)) formatted.value = _.compact([formatted.value]);
      if (!_.isArray(formatted.suffix)) formatted.suffix = _.compact([formatted.suffix]);

      statsString += '\n';
      statsString += textUtil.buildTextLine({
        label: stat.title,
        value: _.map(formatted.value, (value, i) => `${value}${formatted.suffix[i] || (stat.units ? ` ${stat.units}` : '')}`).join(' '),
      });
    }
  });

  return statsString;
}
