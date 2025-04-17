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
import { formatPercentage } from '../format';
import { formatDatum } from '../../utils/stat';

import {
  getOffset,
  getTimezoneFromTimePrefs,
  formatCurrentDate,
  formatDateRange,
  formatDuration,
} from '../datetime';

import { MS_IN_MIN } from '../constants';

const t = i18next.t.bind(i18next);

/**
 * agpCGMText
 * @param  {Object} patient - the patient object that contains the profile
 * @param  {Object} data - agpCGM object outputted from generatePDF
 *
 * @return {String}  agpCGM data as a formatted string
 */
export function agpCGMText(patient, data) {
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
          timeInRange: { counts, durations },
        },
      },
    },
  } = data;

  const { bgUnits, bgBounds } = bgPrefs || {};
  const { targetUpperBound, targetLowerBound, veryLowThreshold } = bgBounds || {};

  const timezone = getTimezoneFromTimePrefs(timePrefs);

  const currentDate = formatCurrentDate();

  const reportDaysText = bgDaysWorn === 1
    ? moment.utc(newestDatum?.time - getOffset(newestDatum?.time, timezone) * MS_IN_MIN).format('MMMM D, YYYY')
    : getDateRange(oldestDatum?.time, newestDatum?.time, undefined, '', 'MMMM', timezone);

  const targetRange = `${targetLowerBound}-${targetUpperBound}`;
  const lowRange = `${veryLowThreshold}-${targetLowerBound}`;
  const veryLowRange = `<${veryLowThreshold}`;

  const percentInTarget = formatPercentage(counts.target / counts.total, 0, true);
  const percentInLow = formatPercentage(counts.low / counts.total, 0, true);
  const percentInVeryLow = formatPercentage(counts.veryLow / counts.total, 0, true);

  const durationInTarget = formatDuration(durations.target, { condensed: true });
  const durationInLow = formatDuration(durations.low, { condensed: true });
  const durationInVeryLow = formatDuration(durations.veryLow, { condensed: true });

  const avgGlucose = averageGlucose ? formatDatum({ value: averageGlucose }, 'bgValue', { bgPrefs, useAGPFormat: true })?.value : null;

  const textUtil = new TextUtil();
  let clipboardText = '';

  clipboardText += textUtil.buildTextLine(fullName);
  clipboardText += textUtil.buildTextLine(t('Date of birth: {{birthDate}}', { birthDate }));
  clipboardText += textUtil.buildTextLine(t('Exported from Tidepool TIDE: {{currentDate}}', { currentDate }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Reporting Period: {{reportDaysText}}', { reportDaysText }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Avg. Daily Time In Range ({{- bgUnits}})', { bgUnits }));
  clipboardText += textUtil.buildTextLine(t('{{targetRange}}   {{percentInTarget}}   ({{ durationInTarget }})', { targetRange, percentInTarget, durationInTarget }));
  clipboardText += textUtil.buildTextLine(t('{{lowRange}}   {{percentInLow}}   ({{ durationInLow }})', { lowRange, percentInLow, durationInLow }));
  clipboardText += textUtil.buildTextLine(t('{{- veryLowRange}}   {{percentInVeryLow}}   ({{ durationInVeryLow }})', { veryLowRange, percentInVeryLow, durationInVeryLow }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Avg. Glucose (CGM): {{avgGlucose}} {{- bgUnits}}', { avgGlucose, bgUnits }));

  return clipboardText;
}
