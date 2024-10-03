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
const t = i18next.t.bind(i18next);

if (_.get(i18next, 'options.returnEmptyString') === undefined) {
  // Return key if no translation is present
  i18next.init({ returnEmptyString: false, nsSeparator: '|' });
}

export const BG_HIGH = t('High');
export const BG_LOW = t('Low');

const STIFFNESS = 180;
const DAMPING = 40;
const PRECISION = 0.1;

export const springConfig = { stiffness: STIFFNESS, damping: DAMPING, precision: PRECISION };

export const MGDL_CLAMP_TOP = 400;
export const MMOLL_CLAMP_TOP = 22.5;

export const MGDL_UNITS = t('mg/dL');
export const MMOLL_UNITS = t('mmol/L');
export const MGDL_PER_MMOLL = 18.01559;

export const DEFAULT_BG_BOUNDS = {
  [MGDL_UNITS]: {
    veryLowThreshold: 54,
    targetLowerBound: 70,
    targetUpperBound: 180,
    veryHighThreshold: 250,
    extremeHighThreshold: 350,
    clampThreshold: 600,
  },
  [MMOLL_UNITS]: {
    veryLowThreshold: 3.0,
    targetLowerBound: 3.9,
    targetUpperBound: 10.0,
    veryHighThreshold: 13.9,
    extremeHighThreshold: 19.4,
    clampThreshold: 33.3,
  },
};

export const LBS_PER_KG = 2.2046226218;

const ONE_WEEK = 7;
const TWO_WEEKS = 14;
const FOUR_WEEKS = 28;

export const trends = { extentSizes: { ONE_WEEK, TWO_WEEKS, FOUR_WEEKS } };

export const MS_IN_DAY = 864e5;
export const MS_IN_HOUR = 864e5 / 24;
export const MS_IN_MIN = MS_IN_HOUR / 60;

export const CGM_READINGS_ONE_DAY = 288;
export const CGM_DATA_KEY = 'cbg';
export const BGM_DATA_KEY = 'smbg';

export const NO_SITE_CHANGE = 'noSiteChange';
export const SITE_CHANGE = 'siteChange';
export const SITE_CHANGE_RESERVOIR = 'reservoirChange';
export const SITE_CHANGE_TUBING = 'tubingPrime';
export const SITE_CHANGE_CANNULA = 'cannulaPrime';

export const AUTOMATED_DELIVERY = 'automatedDelivery';
export const AUTOMATED_SUSPEND = 'automatedSuspend';
export const AUTOMATED_MODE_EXITED = 'automatedModeExited';
export const SCHEDULED_DELIVERY = 'scheduledDelivery';
export const SETTINGS_OVERRIDE = 'settingsOverride';
export const SLEEP = 'sleep';
export const PHYSICAL_ACTIVITY = 'physicalActivity';
export const PREPRANDIAL = 'preprandial';
export const MAX_BOLUS = 'maxBolus';
export const MAX_BASAL = 'maxBasal';
export const INSULIN_DURATION = 'insulinDuration';

export const SITE_CHANGE_TYPE_UNDECLARED = 'undeclared';

export const INSULET = 'Insulet';
export const TANDEM = 'Tandem';
export const ANIMAS = 'Animas';
export const TIDEPOOL_LOOP = 'Tidepool Loop';
export const DIY_LOOP = 'DIY Loop';
export const MEDTRONIC = 'Medtronic';
export const MICROTECH = 'Microtech';

export const pumpVocabulary = {
  [ANIMAS]: {
    [SITE_CHANGE_RESERVOIR]: t('Go Rewind'),
    [SITE_CHANGE_TUBING]: t('Go Prime'),
    [SITE_CHANGE_CANNULA]: t('Fill Cannula'),
  },
  [INSULET]: {
    [SITE_CHANGE_RESERVOIR]: t('Change Pod'),
    [SITE_CHANGE_TUBING]: t('Activate Pod'),
    [SITE_CHANGE_CANNULA]: t('Prime'),
    [MAX_BOLUS]: t('Maximum Bolus'),
    [MAX_BASAL]: t('Max Basal Rate'),
    [INSULIN_DURATION]: t('Duration of Insulin Action'),
  },
  [MEDTRONIC]: {
    [SITE_CHANGE_RESERVOIR]: t('Rewind'),
    [SITE_CHANGE_TUBING]: t('Prime'),
    [SITE_CHANGE_CANNULA]: t('Prime Cannula'),
    [AUTOMATED_DELIVERY]: t('Auto Mode'),
    [SCHEDULED_DELIVERY]: t('Manual'),
    [MAX_BOLUS]: t('Max Bolus'),
    [MAX_BASAL]: t('Max Basal'),
    [INSULIN_DURATION]: t('Active Insulin Time'),
  },
  [MICROTECH]: {
    [SITE_CHANGE_RESERVOIR]: t('Rewind'),
    [SITE_CHANGE_TUBING]: t('Prime Reservoir'),
    [SITE_CHANGE_CANNULA]: t('Prime Cannula'),
  },
  [TANDEM]: {
    [SITE_CHANGE_RESERVOIR]: t('Change Cartridge'),
    [SITE_CHANGE_TUBING]: t('Fill Tubing'),
    [SITE_CHANGE_CANNULA]: t('Fill Cannula'),
    [AUTOMATED_DELIVERY]: t('Automation'),
    [SCHEDULED_DELIVERY]: t('Manual'),
    [SETTINGS_OVERRIDE]: t('Activity'),
    [SLEEP]: { label: t('Sleep'), marker: t('Z') },
    [PHYSICAL_ACTIVITY]: { label: t('Exercise'), marker: t('E') },
    [MAX_BOLUS]: t('Max Bolus'),
    [INSULIN_DURATION]: t('Insulin Duration'),
  },
  [TIDEPOOL_LOOP]: {
    [AUTOMATED_DELIVERY]: t('Automation'),
    [AUTOMATED_MODE_EXITED]: t('Off'),
    [SCHEDULED_DELIVERY]: t('Manual'),
    [SETTINGS_OVERRIDE]: t('Preset'),
    [PHYSICAL_ACTIVITY]: { label: t('Workout'), marker: t('W') },
    [MAX_BOLUS]: t('Maximum Bolus'),
    [MAX_BASAL]: t('Maximum Basal Rate'),
  },
  [DIY_LOOP]: {
    [AUTOMATED_DELIVERY]: t('Automation'),
    [AUTOMATED_MODE_EXITED]: t('Off'),
    [SCHEDULED_DELIVERY]: t('Manual'),
    [SETTINGS_OVERRIDE]: t('Preset'),
    [PHYSICAL_ACTIVITY]: { label: t('Workout'), marker: t('W') },
    [MAX_BOLUS]: t('Maximum Bolus'),
    [MAX_BASAL]: t('Maximum Basal Rate'),
  },
  default: {
    [SITE_CHANGE_RESERVOIR]: t('Change Cartridge'),
    [SITE_CHANGE_TUBING]: t('Fill Tubing'),
    [SITE_CHANGE_CANNULA]: t('Fill Cannula'),
    [AUTOMATED_DELIVERY]: t('Automated'),
    [AUTOMATED_SUSPEND]: t('Automated Suspend'),
    [AUTOMATED_MODE_EXITED]: t('Exited'),
    [SCHEDULED_DELIVERY]: t('Manual'),
    [SETTINGS_OVERRIDE]: t('Settings Override'),
    [SLEEP]: { label: t('Sleep'), marker: t('Z') },
    [PHYSICAL_ACTIVITY]: { label: t('Exercise'), marker: t('E') },
    [PREPRANDIAL]: { label: t('Premeal'), marker: t('P') },
    [MAX_BOLUS]: t('Max Bolus'),
    [MAX_BASAL]: t('Max Basal'),
    [INSULIN_DURATION]: t('Insulin Duration'),
  },
};

export const settingsOverrides = {
  [TANDEM]: [
    SLEEP,
    PHYSICAL_ACTIVITY,
  ],
  [TIDEPOOL_LOOP]: [
    PHYSICAL_ACTIVITY,
    PREPRANDIAL,
  ],
  [DIY_LOOP]: [
    PREPRANDIAL,
  ],
  default: [
    SLEEP,
    PHYSICAL_ACTIVITY,
    PREPRANDIAL,
  ],
};

export const AUTOMATED_BASAL_DEVICE_MODELS = {
  [MEDTRONIC]: ['1580', '1581', '1582', '1780', '1781', '1782'],
};
export const BG_DATA_TYPES = [
  'cbg',
  'smbg',
];

export const DIABETES_DATA_TYPES = [
  ...BG_DATA_TYPES,
  'basal',
  'bolus',
  'wizard',
  'food',
];

export const BG_COLORS = {
  veryLow: '#FB5951',
  low: '#FF8B7C',
  target: '#76D3A6',
  high: '#BB9AE7',
  veryHigh: '#8C65D6',
};
