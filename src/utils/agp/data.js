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
import { getTimezoneFromTimePrefs } from '../datetime';

const t = i18next.t.bind(i18next);

/**
 * agpCGMText
 * @param  {Object} patient - the patient object that contains the profile
 * @param  {Object} pdf - pdf object outputted from generatePDF
 *
 * @return {String}  agpCGM data as a formatted string
 */
export function agpCGMText(patient, pdf) {
  const agpCGM = pdf?.data?.agpCGM;

  if (!agpCGM || !patient) return '';

  const { fullName, birthDate } = patient;

  const {
    timePrefs,
    bgPrefs,
    data: {
      current: {
        stats: {
          bgExtents: { newestDatum, oldestDatum },
          averageGlucose: { averageGlucose },
          timeInRange: { counts },
        },
      },
    },
  } = agpCGM;

  const { bgUnits, bgBounds } = bgPrefs || {};
  const { targetUpperBound, targetLowerBound, veryLowThreshold } = bgBounds || {};

  const timezoneName = getTimezoneFromTimePrefs(timePrefs);

  const currentDate = moment().format('MMMM Do, YYYY');

  const startDate = moment.utc(oldestDatum?.time).tz(timezoneName);
  const endDate   = moment.utc(newestDatum?.time).tz(timezoneName);
  const startYear = startDate.year();
  const endYear   = endDate.year();

  let dateRange;
  if (startYear !== endYear) {
    dateRange = `${startDate.format('MMMM D, YYYY')} - ${endDate.format('MMMM D, YYYY')}`;
  } else {
    dateRange = `${startDate.format('MMMM D')} - ${endDate.format('MMMM D')}, ${endDate.format('YYYY')}`;
  }

  const targetRange  = `${targetLowerBound}-${targetUpperBound}`;
  const lowRange     = `${veryLowThreshold}-${targetLowerBound}`;
  const veryLowRange = `<${veryLowThreshold}`;

  const percentInTarget  = formatPercentage(counts.target / counts.total, 0, true);
  const percentInLow     = formatPercentage(counts.low / counts.total, 0, true);
  const percentInVeryLow = formatPercentage(counts.veryLow / counts.total, 0, true);

  const avgGlucose = averageGlucose ? formatDatum({ value: averageGlucose }, 'bgValue', { bgPrefs, useAGPFormat: true })?.value : null;

  const textUtil = new TextUtil();
  let clipboardText = '';

  clipboardText += textUtil.buildTextLine(fullName);
  clipboardText += textUtil.buildTextLine(t('Date of birth: {{birthDate}}', { birthDate }));
  clipboardText += textUtil.buildTextLine(t('Exported from Tidepool TIDE: {{currentDate}}', { currentDate }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Reporting Period: {{dateRange}}', { dateRange }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Avg. Daily Time In Range ({{- bgUnits}})', { bgUnits }));
  clipboardText += textUtil.buildTextLine(t('{{targetRange}}   {{percentInTarget}}', { targetRange, percentInTarget }));
  clipboardText += textUtil.buildTextLine(t('{{lowRange}}   {{percentInLow}}', { lowRange, percentInLow }));
  clipboardText += textUtil.buildTextLine(t('{{- veryLowRange}}   {{percentInVeryLow}}', { veryLowRange, percentInVeryLow }));
  clipboardText += textUtil.buildTextLine('');
  clipboardText += textUtil.buildTextLine(t('Avg. Glucose (CGM): {{avgGlucose}} {{- bgUnits}}', { avgGlucose, bgUnits }));

  return clipboardText;
}
