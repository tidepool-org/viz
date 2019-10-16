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
import moment from 'moment';
import i18next from 'i18next';

import { getPumpVocabulary } from '../device';
import {
  generateBgRangeLabels,
  reshapeBgClassesToBgBounds,
} from '../bloodglucose';

import {
  SITE_CHANGE_RESERVOIR,
  SITE_CHANGE_TUBING,
  SITE_CHANGE_CANNULA,
  SITE_CHANGE_TYPE_UNDECLARED,
  AUTOMATED_DELIVERY,
  INSULET,
  TANDEM,
  ANIMAS,
  MEDTRONIC,
  pumpVocabulary,
} from '../constants';

import TextUtil from '../text/TextUtil';
import { statsText } from '../stat';

const t = i18next.t.bind(i18next);

// Exporting utils for easy stubbing in tests
export const utils = {
  reshapeBgClassesToBgBounds,
  statsText,
  TextUtil,
};

/**
 * Define sections and dimensions used in the basics view
 *
 * @param {Object} bgPrefs - bgPrefs object containing viz-style bgBounds
 * @returns {Object} sections
 */
export function defineBasicsSections(bgPrefs, manufacturer) {
  const bgLabels = generateBgRangeLabels(bgPrefs);
  bgLabels.veryLow = _.upperFirst(bgLabels.veryLow);
  bgLabels.veryHigh = _.upperFirst(bgLabels.veryHigh);

  const deviceLabels = getPumpVocabulary(manufacturer);

  const sectionNames = [
    'basals',
    'boluses',
    'fingersticks',
    'siteChanges',
  ];

  const sections = {};

  _.each(sectionNames, section => {
    let type = section;
    let dimensions;
    let title = '';
    let subTitle;
    let summaryTitle;
    let emptyText;
    const active = true;

    switch (section) {
      case 'basals':
        title = 'Basals';
        summaryTitle = t('Total basal events');
        dimensions = [
          { path: 'summary', key: 'total', label: t('Basal Events'), primary: true },
          { path: 'summary.subtotals', key: 'temp', label: t('Temp Basals') },
          { path: 'summary.subtotals', key: 'suspend', label: t('Suspends') },
          {
            path: 'summary.subtotals',
            key: 'automatedStop',
            label: t('{{automatedLabel}} Exited', {
              automatedLabel: deviceLabels[AUTOMATED_DELIVERY],
            }),
            hideEmpty: true,
          },
        ];
        break;

      case 'boluses':
        title = t('Bolusing');
        summaryTitle = t('Avg boluses / day');
        dimensions = [
          { path: 'summary', key: 'total', label: t('Avg per day'), average: true, primary: true },
          { path: 'summary.subtotals', key: 'wizard', label: t('Calculator'), percentage: true },
          { path: 'summary.subtotals', key: 'correction', label: t('Correction'), percentage: true },
          { path: 'summary.subtotals', key: 'extended', label: t('Extended'), percentage: true },
          { path: 'summary.subtotals', key: 'interrupted', label: t('Interrupted'), percentage: true },
          { path: 'summary.subtotals', key: 'override', label: t('Override'), percentage: true },
          { path: 'summary.subtotals', key: 'underride', label: t('Underride'), percentage: true },
        ];
        break;

      case 'fingersticks':
        title = t('BG readings');
        summaryTitle = t('Avg BG readings / day');
        dimensions = [
          { path: 'smbg.summary', key: 'total', label: t('Avg per day'), average: true, primary: true },
          { path: 'smbg.summary.subtotals', key: 'meter', label: t('Meter'), percentage: true },
          { path: 'smbg.summary.subtotals', key: 'manual', label: t('Manual'), percentage: true },
          { path: 'calibration.summary', key: 'total', label: t('Calibrations') },
          { path: 'smbg.summary.subtotals', key: 'veryLow', label: bgLabels.veryLow, percentage: true },
          { path: 'smbg.summary.subtotals', key: 'veryHigh', label: bgLabels.veryHigh, percentage: true },
        ];
        break;

      case 'siteChanges':
        title = t('Infusion site changes');
        break;

      default:
        type = false;
        break;
    }

    sections[section] = {
      active,
      title,
      subTitle,
      summaryTitle,
      emptyText,
      type,
      dimensions,
    };
  });

  return sections;
}

/**
 * Generate the day labels based on the days supplied by the processed basics view data
 *
 * @export
 * @param {Array} days - supplied by the processed basics view data
 * @returns {Array} labels - formatted day labels.  I.E. [Mon, Tues, Wed, ...]
 */
export function generateCalendarDayLabels(days) {
  const firstDay = moment.utc(days[0].date).day();

  return _.map(_.range(firstDay, firstDay + 7), dow => (
    moment.utc().day(dow).format('ddd')
  ));
}

/**
 * Set the availability of basics sections
 *
 * @export
 * @param {Object} Provided data with empty sections disabled and empty text statements provided
 */
export function disableEmptySections(sections, data) {
  /* eslint-disable no-param-reassign */
  const typeData = _.cloneDeep(data);

  const hasDataInRange = processedData => (
    processedData && (_.keys(processedData.byDate).length > 0)
  );

  const diabetesDataTypes = [
    'basals',
    'boluses',
  ];

  const getEmptyText = (section, sectionKey) => {
    /* eslint-disable max-len */
    let emptyText;

    switch (sectionKey) {
      case 'basals':
      case 'boluses':
        emptyText = t("This section requires data from an insulin pump, so there's nothing to display.");
        break;

      case 'siteChanges':
        emptyText = section.type === SITE_CHANGE_TYPE_UNDECLARED
          ? t("Please choose a preferred site change source from the 'Basics' web view to view this data.")
          : t("This section requires data from an insulin pump, so there's nothing to display.");
        break;

      case 'fingersticks':
        emptyText = t("This section requires data from a blood-glucose meter, so there's nothing to display.");
        break;

      default:
        emptyText = t('Why is this grey? There is not enough data to show this statistic.');
        break;
    }

    return emptyText;
    /* eslint-enable max-len */
  };

  _.each(sections, (section, key) => {
    const type = section.type;
    let disabled = false;

    if (_.includes(diabetesDataTypes, type)) {
      disabled = !hasDataInRange(typeData[type]);
    } else if (type === 'fingersticks') {
      const hasSMBG = hasDataInRange(typeData[type].smbg);
      const hasCalibrations = hasDataInRange(typeData[type].calibration);

      if (!hasCalibrations) {
        _.remove(sections[key].dimensions, filter => filter.path.indexOf('calibration') === 0);
      }

      disabled = !hasSMBG && !hasCalibrations;
    }

    if (disabled) {
      sections[key].emptyText = getEmptyText(section, key);
    }

    sections[key].disabled = disabled;
  });
  /* eslint-enable no-param-reassign */

  return sections;
}

/**
 * Get a keyed list of dates in range, designated as future, past, or most recent
 * @param {Array} range - The start and end points (Zulu timestamp or integer hammertime)
 * @param {String} timezone - A valid timezone, UTC if undefined
 * @returns {Object} Map of objects keyed by date
 */
export function findBasicsDays(range, timezone = 'UTC') {
  let currentDate = new Date(range[0]);
  const days = [];
  const dateOfUpload = moment.utc(Date.parse(range[1])).tz(timezone).format('YYYY-MM-DD');
  while (currentDate < moment.utc(Date.parse(range[1])).tz(timezone).endOf('isoWeek')) {
    const date = moment.utc(currentDate).tz(timezone).format('YYYY-MM-DD');
    const dateObj = { date };
    if (date < dateOfUpload) {
      dateObj.type = 'past';
    } else if (date === dateOfUpload) {
      dateObj.type = 'mostRecent';
    } else {
      dateObj.type = 'future';
    }
    days.push(dateObj);
    currentDate = moment.utc(currentDate).tz(timezone).add(1, 'days').toDate();
  }
  return days;
}

/**
 * Find the appropriate start endpoint for basics calendars given the timestamp of the latest datum
 * @param {String} timestamp - Zulu timestamp (Integer hammertime also OK)
 * @param {String} timezone - A valid timezone, UTC if undefined
 * @returns {String} ISO date string relative to provided timezone
 */
export function findBasicsStart(timestamp, timezone = 'UTC') {
  return moment.utc(Date.parse(timestamp)).tz(timezone)
    .startOf('isoWeek')
    .subtract(14, 'days')
    .toDate();
}

/**
 * Determine the site change source for the patient
 * @param {Object} patient
 * @param {String} manufacturer
 */
export function getSiteChangeSource(patient, manufacturer) {
  const {
    settings,
  } = patient;

  let siteChangeSource = SITE_CHANGE_TYPE_UNDECLARED;

  if (_.includes(_.map([ANIMAS, MEDTRONIC, TANDEM], _.lowerCase), manufacturer)) {
    siteChangeSource = _.get(settings, 'siteChangeSource');
    const allowedSources = [SITE_CHANGE_CANNULA, SITE_CHANGE_TUBING];

    if (!_.includes(allowedSources, siteChangeSource)) {
      siteChangeSource = SITE_CHANGE_TYPE_UNDECLARED;
    }
  } else if (manufacturer === _.lowerCase(INSULET)) {
    siteChangeSource = SITE_CHANGE_RESERVOIR;
  }

  return siteChangeSource;
}

/**
 * Get the device-specific label for the site change source
 * @param {String} siteChangeSource
 * @param {String} manufacturer
 */
export function getSiteChangeSourceLabel(siteChangeSource, manufacturer) {
  const fallbackSubtitle = siteChangeSource !== SITE_CHANGE_TYPE_UNDECLARED
    ? pumpVocabulary.default[SITE_CHANGE_RESERVOIR]
    : null;

  return _.get(
    pumpVocabulary,
    [_.upperFirst(manufacturer), siteChangeSource],
    fallbackSubtitle,
  );
}

/**
 * basicsText
 * @param  {Object} patient - the patient object that contains the profile
 * @param  {Object} data - DataUtil data object
 *
 * @return {String} Basics data as a formatted string
 */
export function basicsText(patient, data) {
  const {
    data: {
      current: {
        aggregationsByDate = {},
        stats = [],
        endpoints = {},
      },
    },
    bgPrefs,
    timePrefs,
    metaData: { latestPumpUpload },
  } = data;

  _.defaults(bgPrefs, {
    bgBounds: utils.reshapeBgClassesToBgBounds(bgPrefs),
  });

  const textUtil = new utils.TextUtil(patient, endpoints.range, timePrefs);

  let basicsString = textUtil.buildDocumentHeader('Basics');
  basicsString += textUtil.buildDocumentDates();
  basicsString += utils.statsText(stats, textUtil, bgPrefs);

  const manufacturer = _.get(latestPumpUpload, 'manufacturer');

  const sections = disableEmptySections(defineBasicsSections(
    bgPrefs,
    manufacturer,
  ), aggregationsByDate);

  const getSummaryTableData = (dimensions, statData, header) => {
    const rows = [];
    const columns = [
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ];

    _.each(dimensions, dimension => {
      let value = _.get(statData, [...dimension.path.split('.'), dimension.key], {});

      value = dimension.average
        ? Math.round(_.get(statData, [...dimension.path.split('.'), 'avgPerDay']))
        : _.get(value, 'count', value);

      const stat = {
        label: dimension.label,
        value: (value || 0).toString(),
      };

      if (dimension.primary) {
        stat.label = header;
        rows.unshift(stat);
      } else {
        if (value === 0 && dimension.hideEmpty) {
          return;
        }
        rows.push(stat);
      }
    });

    return { rows, columns };
  };

  const getSiteChangesTableData = (infusionSiteData, siteChangeSource) => {
    const rows = [];
    const columns = [
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ];

    _.each(_.valuesIn(infusionSiteData), datum => {
      const daysSince = _.get(datum, ['summary', 'daysSince', siteChangeSource]);
      if (daysSince) rows.push(daysSince);
    });

    return {
      columns,
      rows: [
        { label: 'Mean Duration', value: `${_.mean(rows)} days` },
        { label: 'Longest Duration', value: `${_.max(rows)} days` },
      ],
    };
  };

  if (!sections.fingersticks.disabled) {
    const fingersticks = getSummaryTableData(
      sections.fingersticks.dimensions,
      aggregationsByDate.fingersticks,
      sections.fingersticks.summaryTitle
    );

    basicsString += textUtil.buildTextTable(
      '',
      fingersticks.rows,
      fingersticks.columns,
      { showHeader: false }
    );
  }

  if (!sections.boluses.disabled) {
    const boluses = getSummaryTableData(
      sections.boluses.dimensions,
      aggregationsByDate.boluses,
      sections.boluses.summaryTitle
    );

    basicsString += textUtil.buildTextTable(
      '',
      boluses.rows,
      boluses.columns,
      { showHeader: false }
    );
  }

  const siteChangeSource = getSiteChangeSource(patient, manufacturer);
  sections.siteChanges.disabled = siteChangeSource === SITE_CHANGE_TYPE_UNDECLARED;

  if (!sections.siteChanges.disabled) {
    sections.siteChanges.subTitle = getSiteChangeSourceLabel(siteChangeSource, manufacturer);

    const siteChanges = getSiteChangesTableData(
      _.get(aggregationsByDate, 'siteChanges.byDate', {}),
      siteChangeSource,
    );

    basicsString += textUtil.buildTextTable(
      `${sections.siteChanges.title} from '${sections.siteChanges.subTitle}'`,
      siteChanges.rows,
      siteChanges.columns,
      { showHeader: false }
    );
  }

  if (!sections.basals.disabled) {
    const basals = getSummaryTableData(
      sections.basals.dimensions,
      aggregationsByDate.basals,
      sections.basals.summaryTitle
    );

    basicsString += textUtil.buildTextTable(
      '',
      basals.rows,
      basals.columns,
      { showHeader: false }
    );
  }

  return basicsString;
}
