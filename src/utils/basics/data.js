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
 * @param {String} manufacturer Manufacturer name
 * @param {Object} pumpUpload Tidepool latest pump upload datum
 * @returns {Object} sections
 */
export function defineBasicsAggregations(bgPrefs, manufacturer, pumpUpload = {}) {
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
    let summaryTitle;
    let perRow = 3;

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
          { path: 'summary.subtotals', key: 'wizard', label: t('Calculator'), percentage: true, selectorIndex: 0 },
          { path: 'summary.subtotals', key: 'correction', label: t('Correction'), percentage: true, selectorIndex: 1 },
          { path: 'summary.subtotals', key: 'extended', label: t('Extended'), percentage: true, selectorIndex: 4 },
          { path: 'summary.subtotals', key: 'interrupted', label: t('Interrupted'), percentage: true, selectorIndex: 5 },
          { path: 'summary.subtotals', key: 'override', label: t('Override'), percentage: true, selectorIndex: 2 },
          { path: 'summary.subtotals', key: 'underride', label: t('Underride'), percentage: true, selectorIndex: 6 },
        ];

        if (pumpUpload.isAutomatedBolusDevice) {
          dimensions.push(...[
            { path: 'summary.subtotals', key: 'manual', label: t('Manual'), percentage: true, selectorIndex: 3 },
            { path: 'summary.subtotals', key: 'automated', label: t('Automated'), percentage: false, selectorIndex: 7 },
          ]);
          perRow = 4;
        }
        break;

      case 'fingersticks':
        title = t('BG readings');
        summaryTitle = t('Avg BG readings / day');
        dimensions = [
          { path: 'smbg.summary', key: 'total', label: t('Avg per day'), average: true, primary: true },
          { path: 'smbg.summary.subtotals', key: 'meter', label: t('Meter'), percentage: true },
          { path: 'smbg.summary.subtotals', key: 'manual', label: t('Manual'), percentage: true },
          { path: 'calibration.summary.subtotals', key: 'calibration', label: t('Calibrations'), hideEmpty: true },
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
      dimensions,
      perRow,
      summaryTitle,
      title,
      type,
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
 * Determine the site change source for the patient
 * @param {Object} patient
 * @param {String} manufacturer
 */
export function getSiteChangeSource(patient = {}, manufacturer) {
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
 * Set the availability of basics sections
 *
 * @export
 * @param {Object} Provided data with empty sections disabled and empty text statements provided
 */
export function processBasicsAggregations(aggregations, data, patient, manufacturer) {
  /* eslint-disable no-param-reassign, max-len */
  const aggregationData = _.cloneDeep(data);

  const hasDataInRange = processedData => (
    processedData && (_.keys(processedData.byDate).length > 0)
  );

  const diabetesDataTypes = [
    'basals',
    'boluses',
  ];

  const getEmptyText = (aggregation, aggregationKey) => {
    /* eslint-disable max-len */
    let emptyText;

    switch (aggregationKey) {
      case 'basals':
      case 'boluses':
        emptyText = t("This section requires data from an insulin pump, so there's nothing to display.");
        break;

      case 'siteChanges':
        emptyText = hasDataInRange(aggregationData[aggregationKey])
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

  _.each(aggregations, (aggregation, key) => {
    const type = aggregation.type;
    let disabled = false;

    if (_.includes(diabetesDataTypes, type)) {
      disabled = !hasDataInRange(aggregationData[type]);
    } else if (type === 'fingersticks') {
      const hasSMBG = hasDataInRange(aggregationData[type].smbg);
      const hasCalibrations = hasDataInRange(aggregationData[type].calibration);
      disabled = !hasSMBG && !hasCalibrations;
    } else if (type === 'siteChanges') {
      aggregations[key].source = getSiteChangeSource(patient, manufacturer);
      aggregations[key].manufacturer = manufacturer;
      disabled = aggregations[key].source === SITE_CHANGE_TYPE_UNDECLARED;
      if (!disabled) {
        aggregations[key].subTitle = getSiteChangeSourceLabel(
          aggregations[key].source,
          manufacturer
        );
      }
    }

    if (disabled) {
      aggregations[key].emptyText = getEmptyText(aggregation, key);
    }

    aggregations[key].disabled = disabled;
  });
  /* eslint-enable no-param-reassign */

  return aggregations;
}

/**
 * Get a keyed list of dates in range, designated as future, past, or most recent
 * @param {Array} range - The start and end points (Zulu timestamp or integer hammertime)
 * @param {String} timezone - A valid timezone, UTC if undefined
 * @returns {Object} Map of objects keyed by date
 */
export function findBasicsDays(range, timezone = 'UTC') {
  const days = [];
  const rangeStartDate = moment.utc(range[0]).tz(timezone).format('YYYY-MM-DD');
  const rangeEndDate = moment.utc(range[1]).tz(timezone).subtract(1, 'ms').format('YYYY-MM-DD');
  let currentDate = moment.utc(range[0]).tz(timezone).startOf('isoWeek').toDate();
  while (currentDate < moment.utc(range[1]).tz(timezone).endOf('isoWeek')) {
    const date = moment.utc(currentDate).tz(timezone).format('YYYY-MM-DD');
    const dateObj = { date };
    if (date < rangeStartDate || date > rangeEndDate) {
      dateObj.type = 'outOfRange';
    } else {
      dateObj.type = 'inRange';
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
  return moment.utc(_.isInteger(timestamp) ? timestamp : Date.parse(timestamp)).tz(timezone)
    .startOf('isoWeek')
    .subtract(14, 'days')
    .toDate();
}

/**
 * basicsText
 * @param  {Object} patient - the patient object that contains the profile
 * @param  {Object} data - DataUtil data object
 * @param  {Array} stats - Processed stats array
 * @param  {Object} stats - Processed aggregations object
 *
 * @return {String} Basics data as a formatted string
 */
export function basicsText(patient, data, stats, aggregations) {
  const {
    data: {
      aggregationsByDate = {},
      current: {
        endpoints = {},
      },
    },
    bgPrefs,
    timePrefs,
    query,
  } = data;

  const textUtil = new utils.TextUtil(patient, endpoints.range, timePrefs);

  let basicsString = textUtil.buildDocumentHeader('Basics');
  basicsString += textUtil.buildDocumentDates();

  if (_.get(query, 'excludeDaysWithoutBolus')) {
    basicsString += textUtil.buildTextLine(t('Days with no boluses have been excluded from bolus calculations'));
  }

  basicsString += utils.statsText(stats, textUtil, bgPrefs);

  const getSummaryTableData = (dimensions, statData, header) => {
    const rows = [];
    const columns = [
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ];

    _.each(dimensions, dimension => {
      const pathValue = _.get(statData, [...dimension.path.split('.'), dimension.key]);

      const value = dimension.average
        ? Math.round(_.get(statData, [...dimension.path.split('.'), 'avgPerDay']))
        : _.get(pathValue, 'count', pathValue || 0);

      const stat = {
        label: dimension.label,
        value: value.toString(),
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
        { label: 'Mean Duration', value: `${Math.round(_.mean(rows) * 10) / 10} days` },
        { label: 'Longest Duration', value: `${_.max(rows)} days` },
      ],
    };
  };

  if (!aggregations.fingersticks.disabled) {
    const fingersticks = getSummaryTableData(
      aggregations.fingersticks.dimensions,
      aggregationsByDate.fingersticks,
      aggregations.fingersticks.summaryTitle
    );

    basicsString += textUtil.buildTextTable(
      '',
      fingersticks.rows,
      fingersticks.columns,
      { showHeader: false }
    );
  }

  if (!aggregations.boluses.disabled) {
    const boluses = getSummaryTableData(
      aggregations.boluses.dimensions,
      aggregationsByDate.boluses,
      aggregations.boluses.summaryTitle
    );

    basicsString += textUtil.buildTextTable(
      '',
      boluses.rows,
      boluses.columns,
      { showHeader: false }
    );
  }

  if (!aggregations.siteChanges.disabled) {
    const siteChanges = getSiteChangesTableData(
      _.get(aggregationsByDate, 'siteChanges.byDate', {}),
      aggregations.siteChanges.source,
    );

    basicsString += textUtil.buildTextTable(
      `${aggregations.siteChanges.title} from '${aggregations.siteChanges.subTitle}'`,
      siteChanges.rows,
      siteChanges.columns,
      { showHeader: false }
    );
  }

  if (!aggregations.basals.disabled) {
    const basals = getSummaryTableData(
      aggregations.basals.dimensions,
      aggregationsByDate.basals,
      aggregations.basals.summaryTitle
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
