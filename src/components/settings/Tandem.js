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

import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

import styles from './Tandem.css';

import ClipboardButton from '../common/controls/ClipboardButton';
import Header from './common/Header';
import Table from './common/Table';
import CollapsibleContainer from './common/CollapsibleContainer';
import { MGDL_UNITS, MMOLL_UNITS } from '../../utils/constants';
import { deviceName, insulinSettings } from '../../utils/settings/data';
import * as tandemData from '../../utils/settings/tandemData';
import { tandemText } from '../../utils/settings/textData';
import { isControlIQ } from '../../utils/device';
import { Trans } from 'react-i18next';

import i18next from 'i18next';
const t = i18next.t.bind(i18next);

const Tandem = (props) => {
  const {
    bgUnits,
    copySettingsClicked,
    openedSections,
    pumpSettings,
    timePrefs,
    toggleProfileExpansion,
    user,
    deviceDisplayName,
  } = props;

  function openSection(sectionName) {
    return _.get(openedSections, sectionName, false);
  }

  const tables = _.map(tandemData.basalSchedules(pumpSettings), (schedule) => {
    const basal = tandemData.basal(schedule, pumpSettings, bgUnits, styles);

    const {
      rows: settingsRows,
      columns: settingsColumns,
    } = insulinSettings(pumpSettings, 'tandem', schedule.name);

    return (
      <div className="settings-table-container" key={basal.scheduleName}>
        <CollapsibleContainer
          label={basal.title}
          labelClass={styles.collapsibleLabel}
          opened={openSection(basal.scheduleName)}
          toggleExpansion={_.partial(toggleProfileExpansion, basal.scheduleName)}
          twoLineLabel={false}
        >
          <Table
            rows={basal.rows}
            columns={basal.columns}
            tableStyle={styles.profileTable}
          />

          <div className={styles.categoryTitle}>{t('Pump Settings')}</div>

          <Table
            rows={settingsRows}
            title={{
              label: { main: 'Insulin Settings' },
              className: styles.insulinSettingsHeader,
            }}
            columns={settingsColumns}
            tableStyle={styles.settingsTableInverted}
          />

          {isControlIQ(pumpSettings) && (
            <div className={styles.annotations}>
              <Trans i18nKey="tandem.annotations">
                * - The numbers displayed here are the user-defined values. During automation, Tandem's Control-IQ Technology uses its own preset Insulin Duration and Target BG. However, users can set different values for these parameters that <strong>only</strong> apply in manual mode.
              </Trans>
            </div>
          )}
        </CollapsibleContainer>
      </div>
    );
  });

  return (
    <div>
      <div className={styles.header}>
        <Header
          deviceDisplayName={deviceDisplayName}
          deviceMeta={tandemData.deviceMeta(pumpSettings, timePrefs)}
        />
        <ClipboardButton
          buttonTitle={t('For email or notes')}
          onSuccess={copySettingsClicked}
          getText={tandemText.bind(this, user, pumpSettings, bgUnits)}
        />
      </div>
      <div>
        <span className={styles.title}>{t('Profile Settings')}</span>
        {tables}
      </div>
    </div>
  );
};

Tandem.propTypes = {
  bgUnits: PropTypes.oneOf([MMOLL_UNITS, MGDL_UNITS]).isRequired,
  copySettingsClicked: PropTypes.func.isRequired,
  deviceKey: PropTypes.oneOf(['tandem']).isRequired,
  deviceDisplayName: PropTypes.string.isRequired,
  openedSections: PropTypes.object.isRequired,
  pumpSettings: PropTypes.shape({
    activeSchedule: PropTypes.string.isRequired,
    units: PropTypes.object.isRequired,
    deviceId: PropTypes.string.isRequired,
    basalSchedules: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.arrayOf(
          PropTypes.shape({
            start: PropTypes.number.isRequired,
            rate: PropTypes.number.isRequired,
          })
        ),
      }).isRequired
    ).isRequired,
    bgTargets: PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.number.isRequired,
          target: PropTypes.number.isRequired,
        })
      ).isRequired
    ).isRequired,
    carbRatios: PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.number.isRequired,
          amount: PropTypes.number.isRequired,
        })
      ).isRequired
    ).isRequired,
    insulinSensitivities: PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.number.isRequired,
          amount: PropTypes.number.isRequired,
        })
      ).isRequired
    ).isRequired,
  }).isRequired,
  timePrefs: PropTypes.shape({
    timezoneAware: PropTypes.bool.isRequired,
    timezoneName: PropTypes.string,
  }).isRequired,
  toggleProfileExpansion: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
};

Tandem.defaultProps = {
  deviceDisplayName: deviceName('tandem'),
  deviceKey: 'tandem',
};

export default Tandem;
