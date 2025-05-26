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
import { max, mean, median, min, quantile, range } from 'd3-array';

import { BG_DISPLAY_MINIMUM_INCREMENTS, DEFAULT_BG_BOUNDS, MGDL_PER_MMOLL, MGDL_UNITS, MMOLL_UNITS, MS_IN_MIN } from './constants';
import { TWENTY_FOUR_HRS } from './datetime';

import { bankersRound, formatBgValue } from './format.js';

/**
 * classifyBgValue
 * @param {Object} bgBounds - object describing boundaries for blood glucose categories
 * @param {String} bgUnits     MGDL_UNITS or MMOLL_UNITS
 * @param {Number} bgValue - integer or float blood glucose value in either mg/dL or mmol/L
 * @param {String} classificationType - 'threeWay' or 'fiveWay'
 *
 * @return {String} bgClassification - low, target, high
 */
export function classifyBgValue(bgBounds, bgUnits, bgValue, classificationType = 'threeWay') {
  if (_.isEmpty(bgBounds) ||
  !_.isNumber(_.get(bgBounds, 'targetLowerBound')) ||
  !_.isNumber(_.get(bgBounds, 'targetUpperBound'))) {
    throw new Error(
      'You must provide a `bgBounds` object with a `targetLowerBound` and a `targetUpperBound`!'
    );
  }
  if (!_.isNumber(bgValue) || !_.gt(bgValue, 0)) {
    throw new Error('You must provide a positive, numerical blood glucose value to categorize!');
  }
  if (!_.includes([MMOLL_UNITS, MGDL_UNITS], bgUnits)) {
    throw new Error('Must provide a valid blood glucose unit of measure!');
  }

  const { veryLowThreshold, targetLowerBound, targetUpperBound, veryHighThreshold } = bgBounds;

  if (classificationType === 'fiveWay') {
    if (bgValue < veryLowThreshold) {
      return 'veryLow';
    } else if (bgValue > veryHighThreshold) {
      return 'veryHigh';
    }

    // Low, Target, and High ranges are non-contiguous in the ADA Standardized CGM metrics.
    // We ensure that values falling between these ranges are rounded into an appropriate
    // range before trying to classify them. See the unit tests for examples of scenarios.
    const precision = bgUnits === MMOLL_UNITS ? 1 : 0;
    const roundedValue = bankersRound(bgValue, precision);

    if (roundedValue < targetLowerBound) {
      return 'low';
    } else if (roundedValue > targetUpperBound) {
      return 'high';
    }

    return 'target';
  }

  // threeWay
  if (bgValue < targetLowerBound) {
    return 'low';
  } else if (bgValue > targetUpperBound) {
    return 'high';
  }
  return 'target';
}

/**
 * classifyCvValue
 * @param {number} value - integer or float coefficient of variation (CV) value
 * @return {String} cvClassification - target, high
 */
export function classifyCvValue(value) {
  if (value <= 36) {
    return 'target';
  } else {
    return 'high';
  }
}

/**
 * convertToMmolL
 * @param {Number} bgVal - blood glucose value in mg/dL
 *
 * @return {Number} convertedBgVal - blood glucose value in mmol/L, unrounded
 */
export function convertToMmolL(val) {
  return (val / MGDL_PER_MMOLL);
}

/**
 * convertToMGDL
 * @param {Number} bgVal - blood glucose value in mmol/L
 *
 * @return {Number} convertedBgVal - blood glucose value in mg/dL, unrounded
 */
export function convertToMGDL(val) {
  return (val * MGDL_PER_MMOLL);
}

/**
 * reshapeBgClassesToBgBounds
 * @param {Object} bgPrefs - bgPrefs object from blip containing tideline-style bgClasses
 *
 * @return {Object} bgBounds - @tidepool/viz-style bgBounds
 */
export function reshapeBgClassesToBgBounds(bgPrefs) {
  const { bgClasses, bgUnits } = bgPrefs;

  const bgBounds = {
    veryHighThreshold: _.get(bgClasses, 'high.boundary', DEFAULT_BG_BOUNDS[bgUnits].veryHighThreshold),
    targetUpperBound: _.get(bgClasses, 'target.boundary', DEFAULT_BG_BOUNDS[bgUnits].targetUpperBound),
    targetLowerBound: _.get(bgClasses, 'low.boundary', DEFAULT_BG_BOUNDS[bgUnits].targetLowerBound),
    veryLowThreshold: _.get(bgClasses, 'very-low.boundary', DEFAULT_BG_BOUNDS[bgUnits].veryLowThreshold),
    extremeHighThreshold: DEFAULT_BG_BOUNDS[bgUnits].extremeHighThreshold,
    clampThreshold: DEFAULT_BG_BOUNDS[bgUnits].clampThreshold,
  };

  return bgBounds;
}

/**
 * Generate BG Range Labels for a given set of bg prefs
 *
 * @export
 * @param {Object} bgPrefs - bgPrefs object containing viz-style bgBounds and the bgUnits
 * @returns {Object} bgRangeLabels - map of labels keyed by bgClassification
 */
export function generateBgRangeLabels(bgPrefs, opts = {}) {
  const { bgBounds, bgUnits } = bgPrefs;
  const minimumIncrement = BG_DISPLAY_MINIMUM_INCREMENTS[bgUnits];

  const thresholds = _.mapValues(bgBounds, threshold => formatBgValue(threshold, bgPrefs));
  thresholds.highLowerBound = formatBgValue(bgBounds.targetUpperBound + minimumIncrement, bgPrefs);
  thresholds.lowUpperBound = formatBgValue(bgBounds.targetLowerBound - minimumIncrement, bgPrefs);

  if (opts.condensed) {
    return {
      veryLow: `<${thresholds.veryLowThreshold}`,
      low: `${thresholds.veryLowThreshold}-${thresholds.lowUpperBound}`,
      anyLow: `<${thresholds.targetLowerBound}`,
      target: `${thresholds.targetLowerBound}-${thresholds.targetUpperBound}`,
      high: `${thresholds.highLowerBound}-${thresholds.veryHighThreshold}`,
      anyHigh: `>${thresholds.targetUpperBound}`,
      veryHigh: `>${thresholds.veryHighThreshold}`,
      extremeHigh: `>${thresholds.extremeHighThreshold}`,
    };
  }

  if (opts.segmented) {
    return {
      veryLow: {
        suffix: bgUnits,
        value: `<${thresholds.veryLowThreshold}`,
      },
      low: {
        prefix: 'between',
        suffix: bgUnits,
        value: `${thresholds.veryLowThreshold}-${thresholds.lowUpperBound}`,
      },
      anyLow: {
        suffix: bgUnits,
        value: `<${thresholds.targetLowerBound}`,
      },
      target: {
        prefix: 'between',
        suffix: bgUnits,
        value: `${thresholds.targetLowerBound}-${thresholds.targetUpperBound}`,
      },
      high: {
        prefix: 'between',
        suffix: bgUnits,
        value: `${thresholds.highLowerBound}-${thresholds.veryHighThreshold}`,
      },
      anyHigh: {
        suffix: bgUnits,
        value: `>${thresholds.targetUpperBound}`,
      },
      veryHigh: {
        suffix: bgUnits,
        value: `>${thresholds.veryHighThreshold}`,
      },
      extremeHigh: {
        suffix: bgUnits,
        value: `>${thresholds.extremeHighThreshold}`,
      },
    };
  }

  return {
    veryLow: `below ${thresholds.veryLowThreshold} ${bgUnits}`,
    low: `between ${thresholds.veryLowThreshold} - ${thresholds.lowUpperBound} ${bgUnits}`,
    anyLow: `below ${thresholds.targetLowerBound} ${bgUnits}`,
    target: `between ${thresholds.targetLowerBound} - ${thresholds.targetUpperBound} ${bgUnits}`,
    high: `between ${thresholds.highLowerBound} - ${thresholds.veryHighThreshold} ${bgUnits}`,
    anyHigh: `above ${thresholds.targetUpperBound} ${bgUnits}`,
    veryHigh: `above ${thresholds.veryHighThreshold} ${bgUnits}`,
    extremeHigh: `above ${thresholds.extremeHighThreshold} ${bgUnits}`,
  };
}

/**
 * getOutOfRangeThreshold
 * @param {Object} bgDatum
 * @return Object containing out of range threshold or null
 */
export function getOutOfRangeThreshold(bgDatum) {
  const outOfRangeAnnotation = _.find(
    bgDatum.annotations || [], (annotation) => (annotation.code === 'bg/out-of-range')
  );
  return outOfRangeAnnotation ?
    { [outOfRangeAnnotation.value]: outOfRangeAnnotation.threshold } : null;
}

/**
 * Get the adjusted count of expected CGM data points for devices that do not sample at the default
 * 5 minute interval, such as the Abbot FreeStyle Libre, which samples every 15 mins
 *
 * @param {Array} data - cgm data
 * @return {Integer} count - the weighted count
 */
export function weightedCGMCount(data) { // TODO: do I need to account for 1min samples here?
  return _.reduce(data, (total, datum) => {
    const sampleInterval = _.get(datum, 'sampleInterval', 5 * MS_IN_MIN);
    const sampleIntervalInMinutes = sampleInterval / MS_IN_MIN;
    let datumWeight = sampleIntervalInMinutes / 5; // Default weight is 1, for 5 minute samples
    return total + datumWeight;
  }, 0);
}

/**
 * Determine if a patient is using a custom target bg range
 *
 * @param {Object} bgPrefs - bgPrefs object containing viz-style bgBounds and the bgUnits
 */
export function isCustomBgRange(bgPrefs) {
  const { bgBounds, bgUnits } = bgPrefs;
  return bgBounds.targetUpperBound !== DEFAULT_BG_BOUNDS[bgUnits].targetUpperBound
    || bgBounds.targetLowerBound !== DEFAULT_BG_BOUNDS[bgUnits].targetLowerBound;
}

/**
 * determineRangeBoundaries
 * @param {Array} outOfRange - Array of out-of-range objects w/threshold and value
 *
 * @return {Object} highAndLowThresholds - Object with high and low keys
 */
export function determineRangeBoundaries(outOfRange) {
  const lowThresholds = _.filter(outOfRange, { value: 'low' });
  const highThresholds = _.filter(outOfRange, { value: 'high' });
  const boundaries = {};
  if (!_.isEmpty(lowThresholds)) {
    // if there is data from multiple devices present with different thresholds
    // we want to use the more conservative (= higher) threshold for lows
    boundaries.low = max(lowThresholds, (d) => (d.threshold));
  }
  if (!_.isEmpty(highThresholds)) {
    // if there is data from multiple devices present with different thresholds
    // we want to use the more conservative (= lower) threshold for highs
    boundaries.high = min(highThresholds, (d) => (d.threshold));
  }
  return boundaries;
}

/**
 * findBinForTimeOfDay
 * @param {Number} binSize - natural number duration in milliseconds
 * @param {Number} msPer24 - natural number milliseconds into a twenty-four hour day
 *
 * @return {Number} bin
 */
export function findBinForTimeOfDay(binSize, msPer24) {
  if (msPer24 < 0 || msPer24 >= TWENTY_FOUR_HRS) {
    throw new Error('`msPer24` < 0 or >= 86400000 is invalid!');
  }

  return Math.floor(msPer24 / binSize) * binSize + (binSize / 2);
}

/**
 * findOutOfRangeAnnotations
 * @param {Array} data - Array of `cbg` or `smbg` events
 *
 * @return {Array} thresholds - Array of objects with unique `threshold`
 *                              (and `value` of 'low' or 'high')
 */
export function findOutOfRangeAnnotations(data) {
  const isOutOfRangeAnnotation = (annotation) => (annotation.code === 'bg/out-of-range');
  const eventsAnnotatedAsOutOfRange = _.filter(
    data,
    (d) => (_.some(d.annotations || [], isOutOfRangeAnnotation))
  );
  const annotations = _.map(eventsAnnotatedAsOutOfRange, (d) => (_.pick(
    _.find(d.annotations || [], isOutOfRangeAnnotation),
    ['threshold', 'value']
  )));
  // the numerical `threshold` is our determiner of uniqueness
  return _.uniqBy(annotations, (d) => (d.threshold));
}

/**
 * calculateCbgStatsForBin
 * @param {String} binKey - String of natural number milliseconds bin
 * @param {Number} binSize - natural number duration in milliseconds
 * @param {Array} data - Array of cbg values in mg/dL or mmol/L
 * @param {Array} outOfRange - Array of out-of-range objects w/threshold and value
 * @param {Array} outerQuantiles - Array of values to use for lower and upper quantiles
 *
 * @return {Object} calculatedCbgStats
 */
export function calculateCbgStatsForBin(binKey, binSize, data, outOfRange, outerQuantiles = []) {
  const [
    lowerQuantile = 0.1,
    upperQuantile = 0.9,
  ] = outerQuantiles;

  const sorted = _.sortBy(data, d => d);
  const centerOfBinMs = parseInt(binKey, 10);
  const stats = {
    id: binKey,
    min: min(sorted),
    lowerQuantile: quantile(sorted, lowerQuantile),
    firstQuartile: quantile(sorted, 0.25),
    median: median(sorted),
    thirdQuartile: quantile(sorted, 0.75),
    upperQuantile: quantile(sorted, upperQuantile),
    max: max(sorted),
    msX: centerOfBinMs,
    msFrom: centerOfBinMs - (binSize / 2),
    msTo: centerOfBinMs + (binSize / 2),
  };
  if (!_.isEmpty(outOfRange)) {
    const thresholds = determineRangeBoundaries(outOfRange);
    stats.outOfRangeThresholds = thresholds;
  }
  return stats;
}

/**
 * calculateSmbgStatsForBin
 * @param {String} binKey - String of natural number milliseconds bin
 * @param {Number} binSize - natural number duration in milliseconds
 * @param {Array} data - Array of smbg values in mg/dL or mmol/L
 * @param {Array} outOfRange - Array of out-of-range objects w/threshold and value
 *
 * @return {Object} calculatedSmbgStats
 */
export function calculateSmbgStatsForBin(binKey, binSize, data, outOfRange) {
  const minDatums = {
    quantile: 5,
    median: 3,
  };

  const sorted = _.sortBy(data, d => d);
  const centerOfBinMs = parseInt(binKey, 10);
  const stats = {
    id: binKey,
    min: min(sorted),
    mean: mean(sorted),
    max: max(sorted),
    msX: centerOfBinMs,
    firstQuartile: data.length >= minDatums.quantile ? quantile(sorted, 0.25) : undefined,
    median: data.length >= minDatums.median ? median(sorted) : undefined,
    thirdQuartile: data.length >= minDatums.quantile ? quantile(sorted, 0.75) : undefined,
    msFrom: centerOfBinMs - (binSize / 2),
    msTo: centerOfBinMs + (binSize / 2),
  };
  if (!_.isEmpty(outOfRange)) {
    const thresholds = determineRangeBoundaries(outOfRange);
    stats.outOfRangeThresholds = thresholds;
  }
  return stats;
}

/**
 * mungeBGDataBins
 * @param {String} bgType - String - one of [smbg|cbg]
 * @param {String} binKey - String of natural number milliseconds bin
 * @param {Number} binSize - natural number duration in milliseconds
 * @param {Array} data - Array of smbg values in mg/dL or mmol/L
 * @param {Array} outerQuantiles - Array of values to use for lower and upper quantiles
 * @returns munged bg bin data
 */
export function mungeBGDataBins(bgType, binSize, data, outerQuantiles) {
  const binned = _.groupBy(data, (d) => (findBinForTimeOfDay(binSize, d.msPer24)));
  const outOfRanges = findOutOfRangeAnnotations(data);
  // we need *all* possible keys for TransitionMotion to work on enter/exit
  // and the range starts with binSize/2 because the keys are centered in each bin
  const binKeys = _.map(range(binSize / 2, TWENTY_FOUR_HRS, binSize), (d) => String(d));

  const binCalculator = bgType === 'smbg' ? calculateSmbgStatsForBin : calculateCbgStatsForBin;
  const valueExtractor = (d) => (d.value);
  const mungedData = [];
  for (let i = 0; i < binKeys.length; ++i) {
    const values = _.map(_.get(binned, binKeys[i], []), valueExtractor);
    mungedData.push(binCalculator(binKeys[i], binSize, values, outOfRanges, outerQuantiles));
  }
  return mungedData;
}
