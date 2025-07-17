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

import * as datetime from '../datetime';
import * as format from '../format';
import { getPumpVocabulary, isControlIQ, isLoop } from '../device';

import {
  MAX_BOLUS,
  MAX_BASAL,
  INSULIN_DURATION,
  PHYSICAL_ACTIVITY,
  PREPRANDIAL,
} from '../../utils/constants';

const t = i18next.t.bind(i18next);
const DISPLAY_PRECISION_PLACES = 3;

/**
 * noData
 * @param  {ANY} val value to check
 *
 * @return {Boolean}     true if value is defined, not null, not empty string, false otherwise
 */
export function noData(val) {
  return val == null || (typeof val === 'string' && _.isEmpty(val));
}

/**
 * deviceName
 * @param  {String} manufacturer one of: animas, insulet, medtronic, tandem, microtech, loop
 *
 * @return {String}              name for given manufacturer
 */
export function deviceName(manufacturer) {
  const DEVICE_DISPLAY_NAME_BY_MANUFACTURER = {
    animas: 'Animas',
    insulet: 'OmniPod',
    medtronic: 'Medtronic',
    tandem: 'Tandem',
    microtech: 'Equil',
    'diy loop': 'DIY Loop',
    'tidepool loop': 'Tidepool Loop',
    twiist: 'twiist',
  };
  return DEVICE_DISPLAY_NAME_BY_MANUFACTURER[manufacturer] || manufacturer;
}

/**
 * getBasalRate
 * @private
 * @param  {Array} scheduleData  basal schedule
 * @param  {Number} startTime    milliseconds from start of day
 * @return {String}              formatted basal rate
 */
function getBasalRate(scheduleData, startTime) {
  const rate = _.find(scheduleData, (schedule) =>
    schedule.start === startTime
  ).rate;

  if (noData(rate)) {
    return '';
  }
  return format.formatDecimalNumber(rate, DISPLAY_PRECISION_PLACES);
}

/**
 * getValue
 * @private
 * @param  {Array} scheduleData  scheduleData
 * @param  {String} fieldName    field to search for
 * @param  {Number} startTime    milliseconds from start of day
 *
 * @return {String}              value of field for startTime
 */
function getValue(scheduleData, fieldName, startTime) {
  const val = _.find(scheduleData, (schedule) =>
    schedule.start === startTime
  )[fieldName];

  if (noData(val)) {
    return '';
  }
  return val;
}

/**
 * getBloodGlucoseValue
 * @private
 * @param  {Array} scheduleData  scheduleData
 * @param  {String} fieldName    field to search format
 * @param  {Number} startTime    milliseconds from start of day
 * @param  {String} units        MGDL_UNITS or MMOLL_UNITS
 *
 * @return {String}              formatted blood glucose value
 */
function getBloodGlucoseValue(scheduleData, fieldName, startTime, units) {
  const bgValue = getValue(scheduleData, fieldName, startTime);
  if (noData(bgValue)) {
    return '';
  }
  return format.formatBgValue(bgValue, { bgUnits: units });
}

/**
 * getStarts
 * @private
 * @param  {Array} timedData array with time based data
 *
 * @return {Array}           array of start times in milliseconds
 */
function getStarts(timedData) {
  return _.map(timedData, 'start');
}

/**
 * getTotalBasalRates
 * @param  {Array} scheduleData  basal schedule data
 *
 * @return {String}              formatted total of basal rates
 */
export function getTotalBasalRates(scheduleData) {
  const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
  const DAY_IN_MILLISECONDS = 86400000;

  let total = 0;
  for (let i = scheduleData.length - 1; i >= 0; i--) {
    const start = scheduleData[i].start;
    let finish = DAY_IN_MILLISECONDS;
    const next = i + 1;
    if (next < scheduleData.length) {
      finish = scheduleData[next].start;
    }
    const hrs = (finish - start) / HOUR_IN_MILLISECONDS;
    const amount = parseFloat(scheduleData[i].rate.toFixed(DISPLAY_PRECISION_PLACES)) * hrs;
    total += parseFloat(amount.toFixed(DISPLAY_PRECISION_PLACES));
  }
  return format.formatDecimalNumber(total, DISPLAY_PRECISION_PLACES);
}

/**
 * getScheduleLabel
 * @param  {String} scheduleName  basal schedule name
 * @param  {String} activeName    name of active basal schedule at time of upload
 * @param  {String} deviceKey    one of: animas, carelink, insulet, medtronic, tandem, microtech, tidepool loop, diy loop, twiist
 * @param  {Boolean} noUnits      whether units should be included in label object
 *
 * @return {Object}              object representing basal schedule label
 */
export function getScheduleLabel(scheduleName, activeName, deviceKey, noUnits) {
  const CAPITALIZED = ['carelink', 'medtronic'];
  let displayName = scheduleName;
  if (_.includes(CAPITALIZED, deviceKey)) {
    displayName = _.map(scheduleName.split(' '), (part) => (_.upperFirst(part))).join(' ');
  }
  return {
    main: displayName,
    secondary: scheduleName === activeName ? 'Active at upload' : '',
    units: noUnits ? '' : 'U/hr',
  };
}

/**
 * getScheduleNames
 * @param  {Object} settingsData object with basal schedule properties
 *
 * @return {Array}               array of basal schedule names
 */
export function getScheduleNames(settingsData) {
  return _.keysIn(settingsData);
}

/**
 * getTimedSchedules
 * @param  {Array} settingsData array of basal schedules
 *
 * @return {Array}              array of {name, position} basal objects
 */
export function getTimedSchedules(settingsData) {
  const names = _.map(settingsData, 'name');
  const schedules = [];
  for (let i = names.length - 1; i >= 0; i--) {
    schedules.push({ name: names[i], position: i });
  }
  return schedules;
}

/**
 * getDeviceMeta
 * @param  {Object} settingsData all settings data
 * @param  {Object} timePrefs    timezone preferences object
 *
 * @return {Object}              filtered meta data
 */
export function getDeviceMeta(settingsData = {}, timePrefs) {
  const utc = settingsData.normalTime;
  const uploadedTime = utc ?
    datetime.formatLocalizedFromUTC(utc, timePrefs, 'MMM D, YYYY') :
    false;
  return {
    schedule: settingsData.activeSchedule || 'unknown',
    uploaded: uploadedTime || 'unknown',
    serial: settingsData.deviceSerialNumber || 'unknown',
  };
}

/**
 * processBasalRateData
 * @param  {Object} scheduleData basal schedule object
 *
 * @return {Array}               array of formatted schedule entries
 */
export function processBasalRateData(scheduleData) {
  const starts = getStarts(scheduleData.value);
  const noRateData = [{ start: '-', rate: '-' }];

  if (starts.length === 0) {
    return noRateData;
  } else if (starts.length === 1) {
    if (Number(getBasalRate(scheduleData.value, starts[0])) === 0) {
      return noRateData;
    }
  }

  const data = _.map(starts, (startTime) => ({
    start: datetime.formatClocktimeFromMsPer24(
      startTime
    ),
    rate: getBasalRate(
      scheduleData.value,
      startTime
    ),
  }));

  data.push({
    start: 'Total',
    rate: getTotalBasalRates(scheduleData.value),
  });
  return data;
}

/**
 * processBgTargetData
 * @param  {Array} targetsData  array of blood glucose targets
 * @param  {String} bgUnits     MGDL_UNITS or MMOLL_UNITS
 * @param  {Object} keys        key names as {columnTwo, columnThree}
 *
 * @return {Array}              formatted bloog glucose target data
 */
export function processBgTargetData(targetsData, bgUnits, keys) {
  return _.map(getStarts(targetsData), (startTime) => ({
    start: datetime.formatClocktimeFromMsPer24(
      startTime
    ),
    columnTwo: getBloodGlucoseValue(
      targetsData,
      keys.columnTwo,
      startTime,
      bgUnits
    ),
    columnThree: getBloodGlucoseValue(
      targetsData,
      keys.columnThree,
      startTime,
      bgUnits
    ),
  }));
}

/**
 * processCarbRatioData
 * @param  {Array} carbRatioData  array of carb ratio data
 *
 * @return {Array}                array of formatted carb ratio objects
 */
export function processCarbRatioData(carbRatioData) {
  return _.map(getStarts(carbRatioData), (startTime) => ({
    start: datetime.formatClocktimeFromMsPer24(
      startTime
    ),
    amount: getValue(
      carbRatioData,
      'amount',
      startTime
    ),
  }));
}

/**
 * processSensitivityData
 * @param  {Array} sensitivityData  array of sensitivity data
 * @param  {String} bgUnits         MGDL_UNITS or MMOLL_UNITS
 *
 * @return {Array}                  array of formatted sensitivity objects
 */
export function processSensitivityData(sensitivityData, bgUnits) {
  return _.map(getStarts(sensitivityData), (startTime) => ({
    start: datetime.formatClocktimeFromMsPer24(
      startTime
    ),
    amount: getBloodGlucoseValue(
      sensitivityData,
      'amount',
      startTime,
      bgUnits
    ),
  }));
}

/**
 * processTimedSettings
 * @param  {Object} pumpSettings entire pump settings object
 * @param  {Object} schedule     {name, position} schedule object
 * @param  {String} bgUnits      MGDL_UNITS or MMOLL_UNITS
 *
 * @return {Array}               array of formatted objects with
 *                                 {start, rate, bgTarget, carbRatio, insulinSensitivity}
 */
export function processTimedSettings(pumpSettings, schedule, bgUnits) {
  const data = _.map(getStarts(pumpSettings.bgTargets[schedule.name]), (startTime) => ({
    start: datetime.formatClocktimeFromMsPer24(
      startTime
    ),
    rate: getBasalRate(
      pumpSettings.basalSchedules[schedule.position].value,
      startTime
    ),
    bgTarget: getBloodGlucoseValue(
      pumpSettings.bgTargets[schedule.name],
      'target',
      startTime,
      bgUnits
    ),
    carbRatio: getValue(
      pumpSettings.carbRatios[schedule.name],
      'amount',
      startTime
    ),
    insulinSensitivity: getBloodGlucoseValue(
      pumpSettings.insulinSensitivities[schedule.name],
      'amount',
      startTime,
      bgUnits
    ),
  }));

  data.push({
    start: 'Total',
    rate: getTotalBasalRates(
      pumpSettings.basalSchedules[schedule.position].value
    ),
    bgTarget: '',
    carbRatio: '',
    insulinSensitivity: '',
  });
  return data;
}

/**
 * startTimeAndValue
 * @param {TYPE} accessor key for value displayed in this column
 *
 * @return {Array} array of objects describing table columns
 */
export function startTimeAndValue(valueKey) {
  return [
    { key: 'start', label: 'Start time' },
    { key: valueKey, label: 'Value' },
  ];
}

/**
 * insulinSettings
 *
 * @param  {Object} settings       object with pump settings data
 * @param  {String} manufacturer   one of: animas, carelink, insulet, medtronic, tandem, microtech, tidepool loop, diy loop, twiist
 * @param  {String} [scheduleName] name of schedule for tandem settings
 */
export function insulinSettings(settings, manufacturer, scheduleName) {
  const bgUnits = settings?.units?.bg;
  const deviceLabels = getPumpVocabulary(manufacturer);
  const maxBasal = _.get(settings, scheduleName ? `basal[${scheduleName}].rateMaximum.value` : 'basal.rateMaximum.value');
  const maxBolus = _.get(settings, scheduleName ? `bolus[${scheduleName}].amountMaximum.value` : 'bolus.amountMaximum.value');
  let insulinDurationUnits = _.get(settings, scheduleName ? `bolus[${scheduleName}].calculator.insulin.units` : 'bolus.calculator.insulin.units');
  let insulinDuration = _.get(settings, scheduleName ? `bolus[${scheduleName}].calculator.insulin.duration` : 'bolus.calculator.insulin.duration');

  if (_.includes(['diy loop', 'tidepool loop', 'twiist'], manufacturer)) {
    insulinDuration = _.get(settings, 'insulinModel.actionDuration');
    insulinDurationUnits = 'milliseconds';
  }

  const columns = [
    { key: 'setting' },
    { key: 'value' },
  ];

  if (insulinDurationUnits === 'minutes') {
    const durationInHours = Math.floor(insulinDuration / 60);
    const minutesRemainder = insulinDuration % 60;

    insulinDuration = (minutesRemainder > 0)
      ? `${durationInHours}:${_.padStart(minutesRemainder, 2, '0')}`
      : durationInHours;
  }

  if (insulinDurationUnits === 'milliseconds') {
    const durationInHours = Math.floor(insulinDuration / 60 / 60);
    const minutesRemainder = insulinDuration % 60;

    insulinDuration = (minutesRemainder > 0)
      ? `${durationInHours}:${_.padStart(minutesRemainder, 2, '0')}`
      : durationInHours;
  }

  const rows = [
    { setting: deviceLabels[MAX_BASAL], value: maxBasal ? `${format.formatDecimalNumber(maxBasal, DISPLAY_PRECISION_PLACES)} U/hr` : '-' },
    { setting: deviceLabels[MAX_BOLUS], value: maxBolus ? `${maxBolus} U` : '-' },
    { setting: deviceLabels[INSULIN_DURATION] + (isControlIQ(settings) ? '*' : ''), value: insulinDuration ? `${insulinDuration} hrs` : '-' },
  ];

  if (isLoop(settings)) {
    const insulinModelLabels = {
      rapidAdult: t('Rapid-Acting - Adults'),
      rapidChild: t('Rapid Acting - Children'),
      fiasp: t('Fiasp'),
      lyumjev: t('Lyumjev'),
      afrezza: t('Afrezza'),
    };

    const insulinModel = {
      label: insulinModelLabels[settings?.insulinModel?.modelType] || settings?.insulinModel?.modelType || t('Unknown'),
      peakMinutes: _.isFinite(settings?.insulinModel?.actionPeakOffset) ? settings.insulinModel.actionPeakOffset / 60 : null,
    };

    const device = deviceName(manufacturer);

    const insulinModelAnnotations = [
      t('{{device}} assumes that the insulin it has delivered is actively working to lower your glucose for 6 hours. This setting cannot be changed.', { device }),
    ];

    if (insulinModel.peakMinutes) insulinModelAnnotations.push(t('The {{label}} model assumes peak activity at {{peakMinutes}} minutes.', insulinModel));

    rows.unshift({
      annotations: [t('{{device}} will deliver basal and recommend bolus insulin only if your glucose is predicted to be above this limit for the next three hours.', { device })],
      setting: t('Glucose Safety Limit'),
      value: `${format.formatBgValue(settings?.bgSafetyLimit, { bgUnits })} ${bgUnits}`,
    });

    rows.splice(3, 1, {
      annotations: insulinModelAnnotations,
      setting: t('Insulin Model'),
      value: insulinModel.label,
    });
  }

  // Tandem insulin settings do not have max basal
  if (manufacturer === 'tandem') rows.shift();

  return {
    columns,
    rows,
  };
}

/**
 * presetSettings
 *
 * @param  {Object} settings       object with pump settings data
 * @param  {String} manufacturer   one of: tidepool loop, diy loop, twiist
 */
export function presetSettings(settings, manufacturer) {
  const deviceLabels = getPumpVocabulary(manufacturer);
  const bgUnits = settings?.units?.bg;
  const correctionRange = range => `${format.formatBgValue(range?.low, { bgUnits })}-${format.formatBgValue(range?.high, { bgUnits })}`;

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'value', label: `${t('Correction Range')} (${bgUnits})` },
  ];

  const rows = [];
  if (settings?.bgTargetPreprandial) rows.push({ name: deviceLabels[PREPRANDIAL]?.label, value: correctionRange(settings?.bgTargetPreprandial) });
  if (settings?.bgTargetPhysicalActivity) rows.push({ name: deviceLabels[PHYSICAL_ACTIVITY]?.label, value: correctionRange(settings?.bgTargetPhysicalActivity) });

  return {
    columns,
    rows,
  };
}
