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

/*
 * Guidelines for these utilities:
 *
 * 1. Only "workhorse" functions used in 2+ places should be here.
 * 1a. A function used in multiple components for one view should live
 * in view-specific utils: src/utils/[view]/format.js
 * 1b. A function used in only one component should just be part of that component,
 * potentially as a named export if tests are deemed important to have.
 * 1c. This set of utilities is ONLY for NON-datetime related formatting. Any functions
 * used for formatting dates and/or times should go in src/utils/datetime.js
 *
 * 2. Function naming scheme: the main verb here is `format`. Start all function names with that.
 *
 * 3. Function organizational scheme in this file and tests file: alphabetical plz
 *
 * 4. Try to be consistent in how params are used:
 * (e.g., always pass in `bgPrefs`) rather than some (subset) of bgUnits and/or bgBounds
 * and try to copy & paste JSDoc @param descriptions for common params.
 *
 */

import _ from 'lodash';
import { format } from 'd3-format';
import { convertToMmolL } from './bloodglucose';
import { BG_HIGH, BG_LOW, MMOLL_UNITS } from './constants';

/**
 * bankersRound
 *
 * Rounding with balanced tie-breaking to reduce upward bias in rounding by rounding the midway
 * point digit (x.5) to the nearest even number, rather than always upwards.
 * ref: https://stackoverflow.com/a/49080858
 *
 * Used as default rounding in AGP reports.
 *
 * @param {Number} value - numeric value to format
 * @param {Number} [precision] - optional number of decimal places to display;
 *                               if not provided, will display as integer (0 decimal places)
 *
 * @return {Number} numeric value rounded to the desired number of decimal places
 */
export function bankersRound(value, precision = 0) {
  /* eslint-disable no-nested-ternary */
  const x = value * (10 ** precision);
  const r = Math.round(x);
  const br = Math.abs(x) % 1 === 0.5 ? (r % 2 === 0 ? r : r - 1) : r;
  return br / (10 ** precision);
  /* eslint-enable no-nested-ternary */
}

/**
 * precisionRound
 *
 * Rounding numbers to desired precison.
 *
 * @param {Number} value - numeric value to format
 * @param {Number} [precision] - optional number of decimal places to display;
 *                               if not provided, will display as integer (0 decimal places)
 *
 * @return {Number} numeric value rounded to the desired number of decimal places
 */
export function precisionRound(value, precision = 0) {
  const shift = precision > 0 ? 10 ** precision : 1;
  return Math.round(value * shift) / shift;
}

/**
 * formatBgValue
 * @param {Number} val - integer or float blood glucose value in either mg/dL or mmol/L
 * @param {Object} bgPrefs - object containing bgUnits String and bgBounds Object
 * @param {Object} [outOfRangeThresholds] - optional thresholds for `low` and `high` values;
 *                                          derived from annotations in PwD's data, so may not exist
 *
 * @return {String} formatted blood glucose value
 */
export function formatBgValue(val, bgPrefs, outOfRangeThresholds) {
  const units = _.get(bgPrefs, 'bgUnits', '');

  if (!_.isEmpty(outOfRangeThresholds)) {
    let lowThreshold = outOfRangeThresholds.low;
    let highThreshold = outOfRangeThresholds.high;

    if (units === MMOLL_UNITS) {
      if (lowThreshold) {
        lowThreshold = convertToMmolL(lowThreshold);
      }
      if (highThreshold) {
        highThreshold = convertToMmolL(highThreshold);
      }
    }
    if (lowThreshold && val < lowThreshold) {
      return BG_LOW;
    }
    if (highThreshold && val > highThreshold) {
      return BG_HIGH;
    }
  }

  if (units === MMOLL_UNITS) {
    return bankersRound(val, 1).toFixed(1);
  }

  return bankersRound(val).toString();
}

/**
 * formatDecimalNumber
 *
 * This (and all d3-format methods) is to format numbers for localized human display.
 * To use rounded results in calculations, use the `precisionRound` utility
 *
 * @param {Number} val - numeric value to format
 * @param {Number} [places] - optional number of decimal places to display;
 *                            if not provided, will display as integer (0 decimal places)
 *
 * @return {String} numeric value rounded to the desired number of decimal places
 */
export function formatDecimalNumber(val, places) {
  if (places === null || places === undefined) {
    return format('d')(val);
  }
  return format(`.${places}f`)(val);
}

/**
 * formatInsulin
 *
 * @export
 * @param {Number} val - numeric value to format
 * @returns {String} numeric value formatted for the precision of insulin dosing
 */
export function formatInsulin(val) {
  let decimalLength = 1;
  const qtyString = val.toString();
  if (qtyString.indexOf('.') !== -1) {
    const length = qtyString.split('.')[1].length;
    decimalLength = _.min([length, 3]);
  }
  return formatDecimalNumber(val, decimalLength);
}

/**
 * formatPercentage
 * @param {Number} val - raw decimal proportion, range of 0.0 to 1.0
 *
 * @return {String} percentage
 */
export function formatPercentage(val, precision = 0, useAGPFormat) {
  if (Number.isNaN(val)) {
    return '--%';
  }
  return useAGPFormat
    ? `${bankersRound(val * 100, precision)}%`
    : format(`.${precision}%`)(val);
}

/**
 * formatStatsPercentage
 * @param {Number} val - raw decimal proportion, range of 0.0 to 1.0
 *
 * @return {String} percentage
 */
export function formatStatsPercentage(value) {
  if (Number.isNaN(value)) return '--';

  const percentage = value * 100;

  // Round to one decimal place if below 1, and zero decimal places if above 1;
  const precision = percentage >= 1 ? 0 : 1;
  const roundedValue = bankersRound(percentage, precision);

  return _.toString(roundedValue);
}

/**
 * removeTrailingZeroes
 * @param {String} - formatted decimal value, may have trailing zeroes
 *
 * @return {String} - formatted decimal value w/o trailing zero-indexes
 */
export function removeTrailingZeroes(val) {
  return val.replace(/\.0+$/, '');
}
