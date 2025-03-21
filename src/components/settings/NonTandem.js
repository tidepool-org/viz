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

import ClipboardButton from '../common/controls/ClipboardButton';
import Header from './common/Header';
import Table from './common/Table';
import CollapsibleContainer from './common/CollapsibleContainer';
import { MGDL_UNITS, MMOLL_UNITS } from '../../utils/constants';
import * as nonTandemData from '../../utils/settings/nonTandemData';
import { deviceName, insulinSettings, presetSettings } from '../../utils/settings/data';
import { nonTandemText } from '../../utils/settings/textData';
import { isLoop } from '../../utils/device';

import styles from './NonTandem.css';

import i18next from 'i18next';
const t = i18next.t.bind(i18next);

const NonTandem = (props) => {
  const {
    bgUnits,
    copySettingsClicked,
    deviceKey,
    openedSections,
    pumpSettings,
    timePrefs,
    toggleBasalScheduleExpansion,
    user,
  } = props;

  let lookupKey = deviceKey;

  if (deviceKey === 'carelink') {
    lookupKey = 'medtronic';
  }

  const showCategoryTitle = !isLoop(pumpSettings);

  function buildTable(rows, columns, title, tableStyle, annotations) {
    return (
      <Table
        annotations={annotations}
        title={title}
        rows={rows}
        columns={columns}
        tableStyle={tableStyle}
      />
    );
  }

  function openSection(sectionName) {
    return _.get(openedSections, sectionName, false);
  }

  function renderInsulinSettings() {
    const { rows, columns } = insulinSettings(pumpSettings, lookupKey);

    return (
      <div className={styles.categoryContainer}>
        {buildTable(
          rows,
          columns,
          {
            label: { main: t('Insulin Settings') },
            className: styles.insulinSettingsHeader,
          },
          styles.settingsTableInverted
        )}
      </div>
    );
  }

  function renderPresetSettings() {
    const { rows, columns } = presetSettings(pumpSettings, lookupKey);

    return rows.length ? (
      <div className={styles.categoryContainer}>
        {buildTable(
          rows,
          columns,
          {
            label: { main: t('Presets') },
            className: styles.presetSettingsHeader,
          },
          styles.settingsTable
        )}
      </div>
    ) : null;
  }

  function renderBasalsData() {
    return _.map(nonTandemData.basalSchedules(pumpSettings), (schedule) => {
      const basal = nonTandemData.basal(schedule, pumpSettings, deviceKey);
      const toggleFn = _.partial(toggleBasalScheduleExpansion, basal.scheduleName);

      let labelClass = styles.singleLineBasalScheduleHeader;

      if (basal.isAutomated) {
        labelClass = styles.automatedSingleLineBasalScheduleHeader;

        // We only show automated basal schedules if active at upload
        if (!basal.activeAtUpload) {
          return null;
        }

        basal.title.secondary = basal.title.secondary.toLowerCase();

        const title = {
          label: basal.title,
          className: styles.automatedBasalHeaderBackground,
        };

        return (
          <div className={styles.categoryContainer} key={schedule}>
            {buildTable(
              basal.rows,
              basal.columns,
              title,
              [labelClass, styles.settingsTable].join(' ')
            )}
          </div>
        );
      }

      if (isLoop(pumpSettings)) {
        labelClass = styles.basalScheduleHeader;
        basal.title.secondary = basal.title.secondary.toLowerCase();

        const title = {
          label: { main: t('Basal Rates'), secondary: 'U/hr' },
          className: styles.singleLineBasalScheduleHeader,
        };

        return (
          <div className={styles.categoryContainer} key={schedule}>
            {buildTable(
              basal.rows,
              basal.columns,
              title,
              styles.basalTable
            )}
          </div>
        );
      }

      if (basal.activeAtUpload) {
        labelClass = styles.twoLineBasalScheduleHeader;
      }

      return (
        <div className={styles.categoryContainer} key={schedule}>
          <CollapsibleContainer
            label={basal.title}
            labelClass={labelClass}
            opened={openSection(basal.scheduleName)}
            toggleExpansion={toggleFn}
            twoLineLabel
          >
            {buildTable(
              basal.rows,
              basal.columns,
              null,
              styles.basalTable
            )}
          </CollapsibleContainer>
        </div>
      );
    });
  }

  function renderSensitivityData() {
    const sensitivity = nonTandemData.sensitivity(pumpSettings, lookupKey, bgUnits);
    const title = {
      label: {
        main: sensitivity.title,
        secondary: `${bgUnits}/U`,
      },
      className: styles.bolusSettingsHeader,
    };
    return (
      <div className={styles.categoryContainer}>
        {buildTable(
          sensitivity.rows,
          sensitivity.columns,
          title,
          styles.settingsTable
        )}
      </div>
    );
  }

  function renderRatioData() {
    const ratio = nonTandemData.ratio(pumpSettings, lookupKey);
    const title = {
      label: {
        main: ratio.title,
        secondary: _.get(pumpSettings, 'units.carb') === 'exchanges' ? 'U/exch' : 'g/U',
      },
      className: styles.bolusSettingsHeader,
    };

    return (
      <div className={styles.categoryContainer}>
        {buildTable(
          ratio.rows,
          ratio.columns,
          title,
          styles.settingsTable
        )}
      </div>
    );
  }

  function renderTargetData() {
    const target = nonTandemData.target(pumpSettings, lookupKey, bgUnits);
    const title = {
      label: {
        main: target.title,
        secondary: bgUnits,
      },
      className: styles.bolusSettingsHeader,
    };

    return (
      <div className={styles.categoryContainer}>
        {buildTable(
          target.rows,
          target.columns,
          title,
          styles.settingsTable,
          target.annotations
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <Header
          deviceDisplayName={deviceName(lookupKey)}
          deviceMeta={nonTandemData.deviceMeta(pumpSettings, timePrefs)}
        />
        <ClipboardButton
          buttonTitle={t('For email or notes')}
          onSuccess={copySettingsClicked}
          getText={nonTandemText.bind(this, user, pumpSettings, bgUnits, lookupKey)}
        />
      </div>
      <div className={styles.settingsContainer}>
        <div className={styles.basalSettingsContainer}>
          {showCategoryTitle && <div className={styles.categoryTitle}>{t('Basal Rates')}</div>}
          {renderBasalsData()}
        </div>
        <div className={styles.bolusSettingsContainer}>
          {showCategoryTitle && <div className={styles.categoryTitle}>{nonTandemData.bolusTitle(lookupKey)}</div>}
          <div className={styles.bolusSettingsInnerContainer}>
            {renderTargetData()}
            {renderRatioData()}
            {renderSensitivityData()}
          </div>
        </div>
      </div>
      {!_.includes(['animas', 'microtech'], lookupKey) && (
        <div className={styles.settingsContainerLeftAligned}>
          {showCategoryTitle && <div className={styles.categoryTitle}>{t('Pump Settings')}</div>}
          <div className={styles.insulinSettingsInnerContainer}>
            {renderInsulinSettings()}
            {renderPresetSettings()}
          </div>
        </div>
      )}
    </div>
  );
};

NonTandem.propTypes = {
  bgUnits: PropTypes.oneOf([MMOLL_UNITS, MGDL_UNITS]).isRequired,
  copySettingsClicked: PropTypes.func.isRequired,
  deviceKey: PropTypes.oneOf(['animas', 'carelink', 'insulet', 'medtronic', 'microtech', 'diy loop', 'tidepool loop', 'twiist']).isRequired,
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
      })
    ).isRequired,
    bgTarget: PropTypes.arrayOf(
      PropTypes.shape({
        start: PropTypes.number.isRequired,
        target: PropTypes.number,
        range: PropTypes.number,
      })
    ).isRequired,
    carbRatio: PropTypes.arrayOf(
      PropTypes.shape({
        start: PropTypes.number.isRequired,
        amount: PropTypes.number.isRequired,
      })
    ).isRequired,
    insulinSensitivity: PropTypes.arrayOf(
      PropTypes.shape({
        start: PropTypes.number.isRequired,
        amount: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  timePrefs: PropTypes.shape({
    timezoneAware: PropTypes.bool.isRequired,
    timezoneName: PropTypes.string,
  }).isRequired,
  toggleBasalScheduleExpansion: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
};

export default NonTandem;
