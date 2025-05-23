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
import i18next from 'i18next';

import { isControlIQ } from '../device';
import * as data from './data';

const t = i18next.t.bind(i18next);
/**
 * basalSchedules
 * @param  {Object} settings    object with basal schedule properties
 *
 * @return {Array}              array of basal schedule names
 */
export function basalSchedules(settings) {
  return data.getTimedSchedules(settings.basalSchedules);
}

/**
 * deviceMeta
 * @param  {Object} settingsData all settings data
 * @param  {Object} timePrefs    timezone preferences object
 *
 * @return {Object}              filtered meta data
 */
export function deviceMeta(settings, timePrefs) {
  return data.getDeviceMeta(settings, timePrefs);
}

/**
 * scheduleLabel
 * @private
 */
function scheduleLabel(scheduleName, activeScheduleName) {
  return data.getScheduleLabel(scheduleName, activeScheduleName, 'tandem', true);
}

/**
 * basalRows
 * @private
 */
function basalRows(schedule, settings, units) {
  return data.processTimedSettings(
    settings,
    schedule,
    units
  );
}

/**
 * basalColumns
 * @private
 */
function basalColumns(styles = {}, units, CIQAnnotation = false) {
  return [
    { key: 'start',
      label: 'Start time' },
    { key: 'rate',
      label: {
        main: t('Basal Rates'),
        secondary: 'U/hr',
      },
      className: styles.basalScheduleHeader },
    { key: 'bgTarget',
      label: {
        main: t('Target BG') + (CIQAnnotation ? '*' : ''),
        secondary: units,
      },
      className: styles.bolusSettingsHeader },
    { key: 'carbRatio',
      label: {
        main: t('Carb Ratio'),
        secondary: 'g/U',
      },
      className: styles.bolusSettingsHeader },
    { key: 'insulinSensitivity',
      label: {
        main: t('Correction Factor'),
        secondary: `${units}/U`,
      },
      className: styles.bolusSettingsHeader },
  ];
}

/**
 * basal
 *
 * @param  {Object} schedule       object schedule to build basal data from
 * @param  {Object} settings       object with pump settings data
 * @param  {String} units          MGDL_UNITS or MMOLL_UNITS
 * @param  {String} styles         object with applicable styles
 * @return {Object}                object with basal title, columns and rows
 */
export function basal(schedule, settings, units, styles = {}) {
  return {
    scheduleName: schedule.name,
    activeAtUpload: (schedule.name === settings.activeSchedule),
    title: scheduleLabel(schedule.name, settings.activeSchedule),
    columns: basalColumns(styles, units, isControlIQ(settings)),
    rows: basalRows(schedule, settings, units),
  };
}
