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
import i18next from 'i18next';

import TextUtil from '../text/TextUtil';
import { getDeviceName } from '../device';
import * as tandemData from './tandemData';
import * as nonTandemData from './nonTandemData';
import { deviceName, insulinSettings, presetSettings } from './data';

const t = i18next.t.bind(i18next);

/**
 * displayedDeviceName
 * @param  {Object} [metaData]    upload metaData carrying devices
 * @param  {Object} settings      the pumpSettings datum currently displayed
 * @param  {String} manufacturer  manufacturer key of the displayed settings
 *
 * @return {String}  name of the device sharing the settings' serial number, else the manufacturer's display name
 */
function displayedDeviceName(metaData, settings, manufacturer) {
  // Loop-family uploads report `Unknown`, which several devices can share
  const serial = settings?.deviceSerialNumber;
  const device = serial && serial !== 'Unknown' && _.find(metaData?.devices, { serialNumber: serial });
  return (device && getDeviceName(device)) || deviceName(manufacturer);
}

/**
 * nonTandemText
 * @param  {Object} patient     the patient object that contains the profile
 * @param  {String} units         MGDL_UNITS or MMOLL_UNITS
 * @param  {String} manufacturer  one of: animas, carelink, insulet, medtronic, microtech, tidepool loop, diy loop, twiist
 * @param  {Object} [opts]        optional inputs for the document header
 * @param  {Object} [opts.copyAsTextMetadata] header fields: diagnosisTypeLabel, patientTags, sites
 * @param  {Object} [opts.metaData] upload metaData carrying devices
 *
 * @return {String}               non tandem settings as a string table
 */
export function nonTandemText(patient, settings, units, manufacturer, opts = {}) {
  const { copyAsTextMetadata, metaData } = opts;
  const textUtil = new TextUtil(patient, undefined, undefined, copyAsTextMetadata);
  let settingsString = textUtil.buildDocumentHeader('Device Settings');

  _.map(nonTandemData.basalSchedules(settings), (schedule) => {
    const basal = nonTandemData.basal(schedule, settings, manufacturer);
    settingsString += textUtil.buildTextTable(
      basal.scheduleName,
      basal.rows,
      basal.columns
    );
  });

  const target = nonTandemData.target(settings, manufacturer, units);
  settingsString += textUtil.buildTextTable(
    `${target.title} ${units}`,
    target.rows,
    target.columns
  );

  const ratio = nonTandemData.ratio(settings, manufacturer);
  const ratioUnits = _.get(settings, 'units.carb') === 'exchanges' ? 'U/exch' : 'g/U';
  settingsString += textUtil.buildTextTable(
    `${ratio.title} ${ratioUnits}`,
    ratio.rows,
    ratio.columns
  );

  const sensitivity = nonTandemData.sensitivity(settings, manufacturer, units);
  settingsString += textUtil.buildTextTable(
    `${sensitivity.title} ${units}/U`,
    sensitivity.rows,
    sensitivity.columns
  );

  if (!_.includes(['animas', 'microtech'], manufacturer)) {
    const { rows, columns } = insulinSettings(settings, manufacturer);

    settingsString += textUtil.buildTextTable(
      t('Insulin Settings'),
      rows,
      columns,
      { showHeader: false }
    );
  }

  const presets = presetSettings(settings, manufacturer);

  if (presets.rows.length) {
    settingsString += textUtil.buildTextTable(
      t('Presets'),
      presets.rows,
      presets.columns
    );
  }

  settingsString += textUtil.buildTextLine(`\n${t('Device')}`);
  settingsString += textUtil.buildTextLine(displayedDeviceName(metaData, settings, manufacturer));

  return settingsString;
}

/**
 * tandemText
 * @param  {Object} patient     the patient object that contains the profile
 * @param  {Object} settings    all settings data
 * @param  {String} units       MGDL_UNITS or MMOLL_UNITS
 * @param  {Object} [opts]      optional inputs for the document header
 * @param  {Object} [opts.copyAsTextMetadata] header fields: diagnosisTypeLabel, patientTags, sites
 * @param  {Object} [opts.metaData] upload metaData carrying devices
 *
 * @return {String}             tandem settings as a string table
 */
export function tandemText(patient, settings, units, opts = {}) {
  const { copyAsTextMetadata, metaData } = opts;
  const textUtil = new TextUtil(patient, undefined, undefined, copyAsTextMetadata);
  let settingsString = textUtil.buildDocumentHeader('Device Settings');

  const styles = {
    bolusSettingsHeader: '',
    basalScheduleHeader: '',
  };

  _.map(tandemData.basalSchedules(settings), (schedule) => {
    const basal = tandemData.basal(schedule, settings, units, styles);
    const { rows, columns } = insulinSettings(settings, 'tandem', schedule.name);

    settingsString += textUtil.buildTextTable(
      basal.scheduleName,
      basal.rows,
      basal.columns
    );

    settingsString += textUtil.buildTextTable(
      t('Insulin Settings'),
      rows,
      columns,
      { showHeader: false }
    );
  });

  settingsString += textUtil.buildTextLine(`\n${t('Device')}`);
  settingsString += textUtil.buildTextLine(displayedDeviceName(metaData, settings, 'tandem'));

  return settingsString;
}
