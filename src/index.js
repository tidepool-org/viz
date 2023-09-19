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
import BolusTooltip from './components/daily/bolustooltip/BolusTooltip';
import PumpSettingsOverrideTooltip from './components/daily/pumpsettingsoverridetooltip/PumpSettingsOverrideTooltip';
import SMBGTooltip from './components/daily/smbgtooltip/SMBGTooltip';
import Stat from './components/common/stat/Stat';
import CBGTooltip from './components/daily/cbgtooltip/CBGTooltip';
import FoodTooltip from './components/daily/foodtooltip/FoodTooltip';

import { formatBgValue } from './utils/format';
import { generateBgRangeLabels, isCustomBgRange, reshapeBgClassesToBgBounds } from './utils/bloodglucose';
import { getTotalBasalFromEndpoints, getGroupDurations } from './utils/basal';
import { DEFAULT_BG_BOUNDS } from './utils/constants';

import {
  formatDateRange,
  getLocalizedCeiling,
  getOffset,
  getTimezoneFromTimePrefs,
} from './utils/datetime';

import {
  commonStats,
  getStatAnnotations,
  getStatData,
  getStatDefinition,
  getStatTitle,
  statBgSourceLabels,
  statFetchMethods,
} from './utils/stat';

import { bgLogText } from './utils/bgLog/data';
import { trendsText } from './utils/trends/data';
import TextUtil from './utils/text/TextUtil';
import { generateAGPFigureDefinitions } from './utils/print/plotly';

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
  CBGDateTraceLabel,
  ClipboardButton,
  FocusedRangeLabels,
  FocusedSMBGPointLabel,
  Loader,
  RangeSelect,
  TwoOptionToggle,
  Tooltip,
  BolusTooltip,
  PumpSettingsOverrideTooltip,
  SMBGTooltip,
  Stat,
  CBGTooltip,
  FoodTooltip,
};

const containers = {
  PumpSettingsContainer,
  TrendsContainer,
};

const utils = {
  agp: {
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
  },
  datetime: {
    findBasicsStart,
    formatDateRange,
    getLocalizedCeiling,
    getOffset,
    getTimezoneFromTimePrefs,
  },
  stat: {
    commonStats,
    getStatAnnotations,
    getStatData,
    getStatDefinition,
    getStatTitle,
    statBgSourceLabels,
    statFetchMethods,
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
  },
};

export {
  components,
  containers,
  utils,
};
