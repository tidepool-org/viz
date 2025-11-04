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

require('./styles/colors.css');

import _ from 'lodash';
import CBGDateTraceLabel from './components/trends/cbg/CBGDateTraceLabel';
import FocusedRangeLabels from './components/trends/common/FocusedRangeLabels';
import FocusedSMBGPointLabel from './components/trends/smbg/FocusedSMBGPointLabel';
import Loader from './components/common/loader/Loader';
import ClipboardButton from './components/common/controls/ClipboardButton';
import RangeSelect from './components/trends/cbg/RangeSelect';
import TwoOptionToggle from './components/common/controls/TwoOptionToggle';
import PumpSettingsContainer from './components/settings/common/PumpSettingsContainer';
import TrendsContainer from './components/trends/common/TrendsContainer';
import Tooltip from './components/common/tooltips/Tooltip';
import CgmSampleIntervalTooltip from './components/common/tooltips/CgmSampleIntervalTooltip';
import EventsInfoTooltip from './components/common/tooltips/EventsInfoTooltip';
import BolusTooltip from './components/daily/bolustooltip/BolusTooltip';
import PumpSettingsOverrideTooltip from './components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip';
import SMBGTooltip from './components/daily/smbgtooltip/SMBGTooltip';
import Stat from './components/common/stat/Stat';
import CBGTooltip from './components/daily/cbgtooltip/CBGTooltip';
import AlarmTooltip from './components/daily/alarmtooltip/AlarmTooltip';
import FoodTooltip from './components/daily/foodtooltip/FoodTooltip';
import EventTooltip from './components/daily/eventtooltip/EventTooltip';

import { formatBgValue, formatPercentage, formatStatsPercentage, bankersRound } from './utils/format';
import { generateBgRangeLabels, isCustomBgRange, reshapeBgClassesToBgBounds } from './utils/bloodglucose';
import { getTotalBasalFromEndpoints, getGroupDurations } from './utils/basal';
import {
  DEFAULT_BG_BOUNDS,
  ADA_STANDARD_BG_BOUNDS,
  ADA_GESTATIONAL_T2_BG_BOUNDS,
  ADA_OLDER_HIGH_RISK_BG_BOUNDS,
  ADA_PREGNANCY_T1_BG_BOUNDS,
  GLYCEMIC_RANGES_PRESET,
  GLYCEMIC_RANGES_TYPE
} from './utils/constants';

import colors from './colors';

import {
  formatDateRange,
  formatTimeAgo,
  getLocalizedCeiling,
  getOffset,
  getTimezoneFromTimePrefs,
} from './utils/datetime';

import { deviceName } from './utils/settings/data';

import {
  commonStats,
  statFormats,
  formatDatum,
  getStatAnnotations,
  getStatData,
  getStatDefinition,
  getStatTitle,
  statBgSourceLabels,
  statFetchMethods,
} from './utils/stat';

import { getGlycemicRangesPreset } from './utils/glycemicRanges';

import { bgLogText } from './utils/bgLog/data';
import { trendsText } from './utils/trends/data';
import { agpCGMText } from './utils/agp/data';
import TextUtil from './utils/text/TextUtil';
import { generateAGPFigureDefinitions } from './utils/print/plotly';
import AGPConstants from './modules/print/utils/AGPConstants';

import {
  basicsText,
  findBasicsStart,
  defineBasicsAggregations,
  processBasicsAggregations,
} from './utils/basics/data';

const i18next = require('i18next');
if (_.get(i18next, 'options.returnEmptyString') === undefined) {
  // Return key if no translation is present
  i18next.init({ returnEmptyString: false, nsSeparator: '|' });
}

const components = {
  AlarmTooltip,
  BolusTooltip,
  CBGDateTraceLabel,
  CBGTooltip,
  CgmSampleIntervalTooltip,
  ClipboardButton,
  EventsInfoTooltip,
  EventTooltip,
  FocusedRangeLabels,
  FocusedSMBGPointLabel,
  FoodTooltip,
  Loader,
  PumpSettingsOverrideTooltip,
  RangeSelect,
  SMBGTooltip,
  Stat,
  Tooltip,
  TwoOptionToggle,
};

const containers = {
  PumpSettingsContainer,
  TrendsContainer,
};

const utils = {
  agp: {
    AGPConstants,
    generateAGPFigureDefinitions,
  },
  basal: {
    getGroupDurations,
    getTotalBasalFromEndpoints,
  },
  bg: {
    formatBgValue,
    generateBgRangeLabels,
    isCustomBgRange,
    reshapeBgClassesToBgBounds,
  },
  constants: {
    DEFAULT_BG_BOUNDS,
    ADA_STANDARD_BG_BOUNDS,
    ADA_OLDER_HIGH_RISK_BG_BOUNDS,
    ADA_PREGNANCY_T1_BG_BOUNDS,
    ADA_GESTATIONAL_T2_BG_BOUNDS,
    GLYCEMIC_RANGES_PRESET,
    GLYCEMIC_RANGES_TYPE,
  },
  datetime: {
    findBasicsStart,
    formatDateRange,
    formatTimeAgo,
    getLocalizedCeiling,
    getOffset,
    getTimezoneFromTimePrefs,
  },
  stat: {
    bankersRound,
    commonStats,
    formatDatum,
    formatPercentage,
    formatStatsPercentage,
    getStatAnnotations,
    getStatData,
    getStatDefinition,
    getStatTitle,
    statBgSourceLabels,
    statFetchMethods,
    statFormats,
  },
  settings: {
    deviceName,
  },
  aggregation: {
    defineBasicsAggregations,
    processBasicsAggregations,
  },
  text: {
    TextUtil,
    trendsText,
    basicsText,
    bgLogText,
    agpCGMText,
  },
  glycemicRanges: {
    getGlycemicRangesPreset,
  }
};

export {
  colors,
  components,
  containers,
  utils,
};
