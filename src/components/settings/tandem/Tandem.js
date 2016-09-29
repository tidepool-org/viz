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

import React, { PropTypes } from 'react';
import _ from 'lodash';

import styles from './Tandem.css';

import Header from '../common/Header';
import Table from '../common/Table';
import CollapsibleContainer from '../common/CollapsibleContainer';

import * as constants from '../../../utils/constants';
import * as data from '../../../utils/settings/data';

const Tandem = (props) => {
  const { bgUnits, pumpSettings, timePrefs } = props;
  const schedules = data.getTimedSchedules(pumpSettings.basalSchedules);

  const COLUMNS = [
    { key: 'start',
      label: 'Start time',
      className: '' },
    { key: 'rate',
      label: <div>Basal Rates <span className={styles.lightText}>U/hr</span></div>,
      className: styles.basalSchedulesHeader },
    { key: 'bgTarget',
      label: <div>BG Target <span className={styles.lightText}>{bgUnits}</span></div>,
      className: styles.bolusSettingsHeader },
    { key: 'carbRatio',
      label: <div>I:C Ratio <span className={styles.lightText}>g/U</span></div>,
      className: styles.bolusSettingsHeader },
    { key: 'insulinSensitivity',
      label: <div>ISF <span className={styles.lightText}>{bgUnits}/U</span></div>,
      className: styles.bolusSettingsHeader },
  ];

  const tables = _.map(schedules, (schedule) => (
    <div key={schedule.name}>
      <CollapsibleContainer
        styledLabel={{
          label: data.getScheduleLabel(schedule.name, pumpSettings.activeSchedule,
            styles.lightText),
          className: styles.collapsibleHeader,
        }}
        openByDefault={schedule.name === pumpSettings.activeSchedule}
        openedStyle={styles.collapsibleOpened}
        closedStyle={styles.collapsibleClosed}
      >
        <Table
          rows={data.processTimedSettings(pumpSettings, schedule, bgUnits)}
          columns={COLUMNS}
          tableStyle={styles.basalTable}
        />
      </CollapsibleContainer>
    </div>
  ));
  return (
    <div>
      <Header
        deviceType="Tandem"
        deviceMeta={data.getDeviceMeta(pumpSettings, timePrefs)}
      />
      <div>
        <span className={styles.title}>Profile Settings</span>
        {tables}
      </div>
    </div>
  );
};

Tandem.propTypes = {
  bgUnits: PropTypes.oneOf([constants.MMOLL_UNITS, constants.MGDL_UNITS]).isRequired,
  timePrefs: PropTypes.shape({
    timezoneAware: React.PropTypes.bool.isRequired,
    timezoneName: React.PropTypes.oneOfType([React.PropTypes.string, null]),
  }).isRequired,
  pumpSettings: React.PropTypes.shape({
    activeSchedule: React.PropTypes.string.isRequired,
    units: React.PropTypes.object.isRequired,
    deviceId: React.PropTypes.string.isRequired,
    basalSchedules: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        value: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            start: React.PropTypes.number.isRequired,
            rate: React.PropTypes.number.isRequired,
          }),
        ),
      }).isRequired,
    ).isRequired,
    bgTargets: React.PropTypes.objectOf(
      React.PropTypes.arrayOf(
        React.PropTypes.shape({
          start: React.PropTypes.number.isRequired,
          target: React.PropTypes.number.isRequired,
        })
      ).isRequired,
    ).isRequired,
    carbRatios: React.PropTypes.objectOf(
      React.PropTypes.arrayOf(
        React.PropTypes.shape({
          start: React.PropTypes.number.isRequired,
          amount: React.PropTypes.number.isRequired,
        })
      ).isRequired,
    ).isRequired,
    insulinSensitivities: React.PropTypes.objectOf(
      React.PropTypes.arrayOf(
        React.PropTypes.shape({
          start: React.PropTypes.number.isRequired,
          amount: React.PropTypes.number.isRequired,
        })
      ).isRequired,
    ).isRequired,
  }).isRequired,
};

export default Tandem;
