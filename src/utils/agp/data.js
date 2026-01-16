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
import moment from 'moment';

import TextUtil from '../text/TextUtil';
import { formatDatum, reconcileTIRPercentages, statFormats } from '../../utils/stat';
import { formatPercentage, bankersRound } from '../format';
import { BG_DISPLAY_MINIMUM_INCREMENTS, MS_IN_MIN, MS_IN_HOUR } from '../constants';

import {
  getOffset,
  getTimezoneFromTimePrefs,
  formatCurrentDate,
  formatDateRange,
} from '../datetime';

const t = i18next.t.bind(i18next);

/**
 * agpCGMText
 * @param  {Object} patient - the patient object that contains the profile
 * @param  {Object} data - agpCGM object outputted from generatePDF
 *
 * @return {String}  agpCGM data as a formatted string
 */
export function agpCGMText(patient, data, opts = {}) {
  _.defaults(opts, {
    showCpt95251: false
  });

  if (!data || !patient) return '';

  const getDateRange = (startDate, endDate, dateParseFormat, _prefix, monthFormat, timezone) => {
    let start = startDate;
    let end = endDate;

    if (_.isNumber(startDate) && _.isNumber(endDate)) {
      start = startDate - getOffset(startDate, timezone) * MS_IN_MIN;
      end = endDate - getOffset(endDate, timezone) * MS_IN_MIN;
    }

    return formatDateRange(start, end, dateParseFormat, monthFormat);
  };

  const { fullName, birthDate } = patient;

  const {
    timePrefs,
    bgPrefs,
    data: {
      current: {
        stats: {
          bgExtents: { newestDatum, oldestDatum, bgDaysWorn },
          averageGlucose: { averageGlucose },
          timeInRange: { counts },
          glucoseManagementIndicator: { glucoseManagementIndicatorAGP },
          sensorUsage: {
            sensorUsageAGP,
            count: sensorUsageCount,
            sampleInterval: sensorUsageSampleInterval,
          },
        },
      },
    },
  } = data;

  const { bgUnits, bgBounds } = bgPrefs || {};
  const { targetUpperBound, targetLowerBound, veryLowThreshold, veryHighThreshold } = bgBounds || {};

  const timezone = getTimezoneFromTimePrefs(timePrefs);

  const currentDate = formatCurrentDate();

  const reportDaysText = bgDaysWorn === 1
    ? moment.utc(newestDatum?.time - getOffset(newestDatum?.time, timezone) * MS_IN_MIN).format('MMMM D, YYYY')
    : getDateRange(oldestDatum?.time, newestDatum?.time, undefined, '', 'MMMM', timezone);

  const minimumIncrement = BG_DISPLAY_MINIMUM_INCREMENTS[bgUnits];
  const highLowerBound = targetUpperBound + minimumIncrement;
  const lowUpperBound = targetLowerBound - minimumIncrement;

  const veryHighRange = `>${veryHighThreshold}`;
  const highRange = `${highLowerBound}-${veryHighThreshold}`;
  const targetRange = `${targetLowerBound}-${targetUpperBound}`;
  const lowRange = `${veryLowThreshold}-${lowUpperBound}`;
  const veryLowRange = `<${veryLowThreshold}`;

  const timeInRangeProportions = {
    veryHigh: counts.veryHigh / counts.total,
    high: counts.high / counts.total,
    target: counts.target / counts.total,
    low: counts.low / counts.total,
    veryLow: counts.veryLow / counts.total,
  };

  const timeInRanges = reconcileTIRPercentages(timeInRangeProportions);

  const percentInVeryHigh = formatPercentage(timeInRanges.veryHigh, 0, true);
  const percentInHigh = formatPercentage(timeInRanges.high, 0, true);
  const percentInTarget = formatPercentage(timeInRanges.target, 0, true);
  const percentInLow = formatPercentage(timeInRanges.low, 0, true);
  const percentInVeryLow = formatPercentage(timeInRanges.veryLow, 0, true);

  const avgGlucose = averageGlucose ? formatDatum({ value: averageGlucose }, 'bgValue', { bgPrefs, useAGPFormat: true })?.value : null;
  const gmi = formatDatum({ value: glucoseManagementIndicatorAGP }, 'gmi', { bgPrefs, useAGPFormat: true })?.value;
  const cgmActive = bankersRound(sensorUsageAGP, 1);

  const hoursOfCGMData = (sensorUsageCount * sensorUsageSampleInterval) / MS_IN_HOUR;
  const formattedDurationOfCGMData = formatDatum(sensorUsageCount * sensorUsageSampleInterval, statFormats.duration)?.value;
  const has72HoursOfData = hoursOfCGMData >= 72;
  const { showCpt95251 } = opts;

  const textUtil = new TextUtil();
  let clipboardText = '';

  clipboardText += textUtil.buildTextLine(fullName);
  clipboardText += textUtil.buildTextLine(t('Date of birth: {{birthDate}}', { birthDate }));
  clipboardText += textUtil.buildTextLine(t('Exported from Tidepool TIDE: {{currentDate}}', { currentDate }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Reporting Period: {{reportDaysText}}', { reportDaysText }));

  if (showCpt95251 && has72HoursOfData) {
    clipboardText += textUtil.buildTextLine('');
    clipboardText += textUtil.buildTextLine(t('Total CGM data recorded: {{ duration }} — Meets ≥72-hour requirement for CPT 95251', { duration: formattedDurationOfCGMData }));
  } else if (showCpt95251) {
    clipboardText += textUtil.buildTextLine('');
    clipboardText += textUtil.buildTextLine(t('Total CGM data recorded: {{ duration }}', { duration: formattedDurationOfCGMData }));
  }

  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Avg. Daily Time In Range ({{- bgUnits}})', { bgUnits }));
  clipboardText += textUtil.buildTextLine(t('{{- veryHighRange}}   {{percentInVeryHigh}}', { veryHighRange, percentInVeryHigh }));
  clipboardText += textUtil.buildTextLine(t('{{highRange}}   {{percentInHigh}}', { highRange, percentInHigh }));
  clipboardText += textUtil.buildTextLine(t('{{targetRange}}   {{percentInTarget}}', { targetRange, percentInTarget }));
  clipboardText += textUtil.buildTextLine(t('{{lowRange}}   {{percentInLow}}', { lowRange, percentInLow }));
  clipboardText += textUtil.buildTextLine(t('{{- veryLowRange}}   {{percentInVeryLow}}', { veryLowRange, percentInVeryLow }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Avg. Glucose (CGM): {{avgGlucose}} {{- bgUnits}}', { avgGlucose, bgUnits }));
  clipboardText += textUtil.buildTextLine(t('% Time CGM Active: {{ cgmActive }}%', { cgmActive }));
  clipboardText += textUtil.buildTextLine(t('GMI (CGM): {{ gmi }}%', { gmi }));

  return clipboardText;
}
