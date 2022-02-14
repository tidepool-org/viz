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
import * as tandemData from './tandemData';
import * as nonTandemData from './nonTandemData';
import { insulinSettings } from './data';

const t = i18next.t.bind(i18next);

/**
 * nonTandemText
 * @param  {Object} patient     the patient object that contains the profile
 * @param  {String} units         MGDL_UNITS or MMOLL_UNITS
 * @param  {String} manufacturer  one of: animas, carelink, insulet, medtronic, microtech
 *
 * @return {String}               non tandem settings as a string table
 */
export function nonTandemText(patient, settings, units, manufacturer) {
  const textUtil = new TextUtil(patient);
  let settingsString = textUtil.buildDocumentHeader('Device Settings');

  if (manufacturer !== 'animas') {
    const { rows, columns } = insulinSettings(settings, manufacturer);

    settingsString += textUtil.buildTextTable(
      t('Insulin Settings'),
      rows,
      columns,
      { showHeader: false }
    );
  }

  _.map(nonTandemData.basalSchedules(settings), (schedule) => {
    const basal = nonTandemData.basal(schedule, settings, manufacturer);
    settingsString += textUtil.buildTextTable(
      basal.scheduleName,
      basal.rows,
      basal.columns,
    );
  });

  const sensitivity = nonTandemData.sensitivity(settings, manufacturer, units);
  settingsString += textUtil.buildTextTable(
    `${sensitivity.title} ${units}/U`,
    sensitivity.rows,
    sensitivity.columns,
  );

  const target = nonTandemData.target(settings, manufacturer, units);
  settingsString += textUtil.buildTextTable(
    `${target.title} ${units}`,
    target.rows,
    target.columns,
  );

  const ratio = nonTandemData.ratio(settings, manufacturer);
  const ratioUnits = _.get(settings, 'units.carb') === 'exchanges' ? 'U/exch' : 'g/U';
  settingsString += textUtil.buildTextTable(
    `${ratio.title} ${ratioUnits}`,
    ratio.rows,
    ratio.columns,
  );

  return settingsString;
}

/**
 * tandemText
 * @param  {Object} patient     the patient object that contains the profile
 * @param  {Object} settings    all settings data
 * @param  {String} units       MGDL_UNITS or MMOLL_UNITS
 *
 * @return {String}             tandem settings as a string table
 */
export function tandemText(patient, settings, units) {
  const textUtil = new TextUtil(patient);
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
      basal.columns,
    );

    settingsString += textUtil.buildTextTable(
      t('Insulin Settings'),
      rows,
      columns,
      { showHeader: false }
    );
  });

  return settingsString;
}
