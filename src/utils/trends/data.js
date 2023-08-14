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
import i18next from 'i18next';

import TextUtil from '../text/TextUtil';
import { statsText } from '../stat';
import { reshapeBgClassesToBgBounds } from '../bloodglucose';

const t = i18next.t.bind(i18next);

// Exporting utils for easy stubbing in tests
export const utils = {
  reshapeBgClassesToBgBounds,
  statsText,
  TextUtil,
};

/**
 * findDatesIntersectingWithCbgSliceSegment
 * @param {Array} cbgData - Array of Tidepool cbg events
 * @param {Object} focusedSlice - the current focused cbg slice/segment
 * @param {Array} focusedSliceKeys - Array of 2 keys representing
 *                                   the top & bottom of focused slice segment
 *
 * @return {Array} dates - Array of String dates in YYYY-MM-DD format
 */
export function findDatesIntersectingWithCbgSliceSegment(cbgData, focusedSlice, focusedSliceKeys) {
  const { data } = focusedSlice;
  return _.uniq(
    _.map(
      _.filter(
        cbgData,
        (d) => {
          if (d.msPer24 >= data.msFrom && d.msPer24 < data.msTo) {
            return (d.value >= data[focusedSliceKeys[0]] &&
              d.value <= data[focusedSliceKeys[1]]);
          }
          return false;
        }
      ),
      'localDate',
    )
  ).sort();
}

/**
 * Returns a category based on SMBG subType
 * @param  {Object} data smbg
 * @return {String}      category name for subType
 */
export function categorizeSmbgSubtype(data) {
  let category;
  if (data.subType && data.subType === 'manual') {
    category = data.subType;
  } else {
    category = 'meter';
  }
  return category;
}

/**
 * trendsText
 * @param  {Object} patient - the patient object that contains the profile
 * @param  {Object} data - DataUtil data object
 * @param  {Array} stats - Processed stats array
 * @param  {Object} chartPrefs - trends chartPrefs object from blip
 *
 * @return {String}  Trends data as a formatted string
 */
export function trendsText(patient, data, stats, chartPrefs) {
  const {
    bgPrefs,
    data: {
      current: {
        endpoints = {},
      },
    },
    metaData,
    timePrefs,
  } = data;

  _.defaults(bgPrefs, {
    bgBounds: utils.reshapeBgClassesToBgBounds(bgPrefs),
  });

  const textUtil = new utils.TextUtil(patient, endpoints.range, timePrefs);
  let trendsString = textUtil.buildDocumentHeader('Trends');

  trendsString += textUtil.buildDocumentDates();

  const excludedDays = _.map(_.keys(_.pickBy(chartPrefs.activeDays, day => day === false)), _.capitalize).join(', ');
  if (excludedDays.length) trendsString += textUtil.buildTextLine({ label: 'Excluded Days', value: excludedDays });

  trendsString += utils.statsText(stats, textUtil, bgPrefs);

  const devices = _.filter(metaData?.devices, ({ id }) => metaData?.matchedDevices[id]);

  if (devices.length) {
    const textLines = [
      `\n${t('Devices Uploaded')}`,
      ..._.map(devices, ({ id, label }) => label || id),
    ];

    _.each(textLines, line => {
      trendsString += textUtil.buildTextLine(line);
    });
  }

  return trendsString;
}
