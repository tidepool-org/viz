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

/* eslint-disable lodash/prefer-lodash-method */

import _ from 'lodash';
import i18next from 'i18next';
import { range } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import moment from 'moment-timezone';

import PrintView from './PrintView';

import { calculateBasalPath, getBasalSequencePaths } from '../render/basal';
import getBolusPaths from '../render/bolus';
import { getBasalPathGroups, getBasalPathGroupType } from '../../utils/basal';
import { getPumpVocabulary } from '../../utils/device';
import { formatDatum, getStatDefinition, statFormats } from '../../utils/stat';
import {
  classifyBgValue,
  getOutOfRangeThreshold,
} from '../../utils/bloodglucose';
import {
  getBolusFromInsulinEvent,
  getCarbs,
  getDelivered,
  getExtendedPercentage,
  getMaxDuration,
  getMaxValue,
  getNormalPercentage,
  getWizardFromInsulinEvent,
} from '../../utils/bolus';
import {
  formatLocalizedFromUTC,
  formatDuration,
  getOffset,
} from '../../utils/datetime';
import {
  formatBgValue,
  formatDecimalNumber,
  formatPercentage,
  removeTrailingZeroes,
} from '../../utils/format';

import {
  ALARM,
  AUTOMATED_DELIVERY,
  EVENT_HEALTH,
  EVENT_NOTES,
  EVENT_PHYSICAL_ACTIVITY,
  MMOLL_UNITS,
  MS_IN_MIN,
  PHYSICAL_ACTIVITY,
  PREPRANDIAL,
  SCHEDULED_DELIVERY,
  SLEEP,
} from '../../utils/constants';

import {
  processBasalRange,
  processBgRange,
  processBolusRange,
  processBasalSequencesForDate,
} from '../../utils/print/data';

import colors from '../../colors';
import { text } from 'pdfkit';

const t = i18next.t.bind(i18next);

const eventImages = {
  [ALARM]: 'images/alarm.png',
  [EVENT_HEALTH]: 'images/event-health.png',
  [EVENT_PHYSICAL_ACTIVITY]: 'images/event-physical_activity.png',
  [EVENT_NOTES  ]: 'images/event-notes.png',
};

class DailyPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);

    this.isAutomatedBasalDevice = _.get(this, 'latestPumpUpload.isAutomatedBasalDevice', false);
    this.isAutomatedBolusDevice = _.get(this, 'latestPumpUpload.isAutomatedBolusDevice', false);

    this.hasCarbExchanges = _.some(
      _.get(data, 'data.current.data.wizard', []),
      { type: 'wizard', carbUnits: 'exchanges' }
    );

    this.hasAlarms = _.some(
      _.get(data, 'data.current.data.deviceEvent', []),
      d => !!d.tags?.alarm
    );

    const deviceLabels = getPumpVocabulary(this.manufacturer);

    this.basalGroupLabels = {
      automated: deviceLabels[AUTOMATED_DELIVERY],
      manual: deviceLabels[SCHEDULED_DELIVERY],
    };

    this.pumpSettingsOverrideLabels = {
      [SLEEP]: deviceLabels[SLEEP],
      [PHYSICAL_ACTIVITY]: deviceLabels[PHYSICAL_ACTIVITY],
      [PREPRANDIAL]: deviceLabels[PREPRANDIAL],
    };

    // this.randomizeBooleans = () => {
    //   this.hasAlarms = Math.random() > 0.5;
    //   this.isAutomatedBasalDevice = Math.random() > 0.5;
    //   this.isAutomatedBolusDevice = Math.random() > 0.5;
    //   this.hasCarbExchanges = Math.random() > 0.5;
    // };

    // this.randomizeBooleans();

    // this.hasAlarms = true;
    // this.isAutomatedBasalDevice = true;
    // this.isAutomatedBolusDevice = true;
    // this.hasCarbExchanges = true;

    const legendItems = [
      {
        type: 'cbg',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData => dateData.cbg?.length > 0),
        labels: [t('CGM')],
      },
      {
        type: 'smbg',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData => dateData.smbg?.length > 0),
        labels: [t('BGM')],
      },
      {
        type: 'bolus',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData => dateData.bolus?.length > 0),
        labels: this.isAutomatedBolusDevice ? [t('Bolus'), t('manual &'), t('automated')] : [t('Bolus')],
      },
      {
        type: 'override',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData => _.some(dateData.bolus, event => {
          const wizard = getWizardFromInsulinEvent(event);
          return wizard && wizard.recommended;
        })),
        labels: [t('Override'), t('up & down')],
      },
      {
        type: 'interrupted',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData => _.some(dateData.bolus, event => {
          const bolus = getBolusFromInsulinEvent(event);
          return bolus.expectedNormal && bolus.expectedNormal !== bolus.normal;
        })),
        labels: [t('Interrupted')],
      },
      {
        type: 'extended',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData => _.some(dateData.bolus, event => {
          const bolus = getBolusFromInsulinEvent(event);
          return bolus.extended || bolus.expectedExtended;
        })),
        labels: [t('Combo /'), t('Extended')],
      },
      {
        type: 'insulin',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData => dateData.insulin?.length > 0),
        labels: [t('Insulin, other')],
      },
      {
        type: 'carbs',
        show: _.some(this.aggregationsByDate?.dataByDate, dateData =>
          _.some([...(dateData.bolus || []), ...(dateData.insulin || [])], event => getCarbs(event)) ||
          _.some(dateData.food || [], event => _.get(event, 'nutrition.carbohydrate.net'))
        ),
        labels: this.hasCarbExchanges ? [t('Carbs'), t('Carb exch.')] : [t('Carbs')],
      },
      {
        type: 'basals',
        show: _.some(this.aggregationsByDate.dataByDate, dateData => dateData.basal?.length > 0),
        labels: this.isAutomatedBasalDevice ? [t('Basals'), t('automated &'), t('manual')] : [t('Basals')],
      },
      {
        type: EVENT_PHYSICAL_ACTIVITY,
        show: _.some(this.aggregationsByDate.dataByDate, dateData =>
          _.some(dateData.physicalActivity || [], event => !!event.tags?.event)
        ),
        labels: [t('Exercise'), t('event')],
      },
      {
        type: EVENT_HEALTH,
        show: _.some(this.aggregationsByDate.dataByDate, dateData =>
          _.some([...(dateData.reportedState || []), ...(dateData.deviceEvent || [])], event => event.tags?.event === EVENT_HEALTH)
        ),
        labels: [t('Health'), t('event')],
      },
      {
        type: EVENT_NOTES,
        show: _.some(this.aggregationsByDate.dataByDate, dateData =>
          _.some([...(dateData.reportedState || []), ...(dateData.deviceEvent || [])], event => event.tags?.event === EVENT_NOTES)
        ),
        labels: [t('Note')],
      },
      {
        type: 'alarms',
        show: this.hasAlarms,
        labels: [t('Pump'), t('Alarm')],
        footNoteReference: 1,
      },
    ];

    this.legendItemsToShow = _.filter(legendItems, 'show');
    // this.legendItemsToShow = [...legendItems];

    // const minItems = 1;
    // const maxItems = legendItems.length;
    // const numItemsToShow = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

    // // Shuffle the array and take the first numItemsToShow items
    // const shuffled = [...legendItems].sort(() => 0.5 - Math.random());
    // this.legendItemsToShow = shuffled.slice(0, numItemsToShow);

    this.bgAxisFontSize = 5;
    this.carbsFontSize = 5.5;
    this.eventFontSize = 7.5;

    this.summaryHeaderFontSize = opts.summaryHeaderFontSize;

    this.chartsPerPage = opts.chartsPerPage;
    this.numDays = this.endpoints.activeDays;

    // render options
    this.bolusWidth = 3;
    this.carbRadius = 4.25;
    this.eventRadius = 5.5;
    this.cbgRadius = 1;
    this.markerRadius = 4.25;
    this.extendedLineThickness = 0.75;
    this.interruptedLineThickness = 0.5;
    this.smbgRadius = 3;
    this.triangleHeight = 1.25;

    const undelivered = '#B2B2B2';

    this.colors = _.assign(this.colors, {
      axes: '#858585',
      bolus: {
        automated: '#B2B2B2',
        delivered: 'black',
        other: 'black',
        extendedPath: 'black',
        extendedExpectationPath: undelivered,
        extendedTriangle: 'black',
        extendedTriangleInterrupted: undelivered,
        interrupted: 'white',
        overrideTriangle: 'white',
        programmed: 'black',
        undelivered,
        underride: undelivered,
        underrideTriangle: 'white',
      },
      pattern: {
        other: '#BFBFBF',
      },
      carbs: '#F8D48E',
      carbExchanges: '#FFB686',
      lightDividers: '#D8D8D8',
    });

    this.rightEdge = this.margins.left + this.width;
    this.bottomEdge = this.margins.top + this.height;

    this.gapBtwnSummaryAndChartAsPercentage = 0.04;
    this.chartArea = {
      bottomEdge: opts.margins.top + opts.height,
      leftEdge: opts.margins.left +
        (opts.summaryWidthAsPercentage + this.gapBtwnSummaryAndChartAsPercentage) * this.width,
      topEdge: opts.margins.top,
    };

    this.chartArea.width = this.rightEdge - this.chartArea.leftEdge;
    this.initialChartArea = _.clone(this.chartArea);

    this.summaryArea = {
      rightEdge: opts.margins.left + opts.summaryWidthAsPercentage * this.width,
    };

    this.bgRange = processBgRange(this.aggregationsByDate.dataByDate);
    this.bolusRange = processBolusRange(this.aggregationsByDate.dataByDate, this.timezone);
    this.basalRange = processBasalRange(this.aggregationsByDate.dataByDate);

    this.summaryArea.width = this.summaryArea.rightEdge - this.margins.left;

    const dates = _.keys(this.aggregationsByDate.dataByDate);
    dates.sort();

    // const numDays = _.min([this.numDays, dates.length]) - 1; // TODO: delete this line - just removing a date for debugging
    const numDays = _.min([this.numDays, dates.length]);
    const selectedDates = _.slice(dates, -Math.abs(numDays));

    this.chartsByDate = {};
    this.initialChartsByDate = {};

    _.each(selectedDates, (date) => {
      const dateData = this.aggregationsByDate.dataByDate[date];

      const bounds = [
        moment.utc(date).tz(this.timezone).valueOf(),
        moment.utc(date).tz(this.timezone).add(1, 'day').valueOf(),
      ];

      const utcBounds = [
        bounds[0] + getOffset(bounds[0], this.timezone) * MS_IN_MIN,
        bounds[1] + getOffset(bounds[1], this.timezone) * MS_IN_MIN,
      ];

      processBasalSequencesForDate(dateData, utcBounds);

      this.chartsByDate[date] = { data: dateData, utcBounds, date };
      this.initialChartsByDate[date] = _.cloneDeep(this.chartsByDate[date]);
    });

    this.chartsPlaced = this.initialChartsPlaced = 0;
    this.chartIndex = this.initialChartIndex = 0;

    // kick off the dynamic calculation of chart area based on font sizes for header and footer
    this.setHeaderSize().setFooterSize().calculateChartMinimums(this.chartArea);

    // calculate heights and place charts in preparation for rendering
    _.each(selectedDates, (date) => {
      this.calculateDateChartHeight(this.chartsByDate[date]);
    });

    while (this.chartsPlaced < selectedDates.length) {
      this.placeChartsOnPage();
    }

    _.each(this.chartsByDate, (dateChart) => {
      this.makeScales(dateChart);
    });
  }

  newPage() {
    const charts = _.filter(this.chartsByDate, chart => chart.page === this.currentPageIndex + 1);
    const start = _.head(charts)?.date;
    const end = _.last(charts)?.date;

    if (start && end) {
      super.newPage(this.getDateRange(start, end, 'YYYY-MM-DD', t('Date range: ')));
      this.renderLegend();
    }
  }

  calculateChartMinimums(chartArea) {
    const legendHeight = this.doc.fontSize(9).currentLineHeight() * 5;
    this.doc.fontSize(this.defaultFontSize);
    const { topEdge, bottomEdge } = chartArea;
    const totalHeight = bottomEdge - legendHeight - topEdge;
    const perChart = totalHeight / 3.25;
    this.chartMinimums = {
      notesEtc: perChart * (3 / 20),
      bgEtcChart: perChart * (9 / 20),
      bolusDetails: perChart * (4 / 20),
      basalChart: perChart * (3 / 20),
      belowBasal: perChart * (1 / 20),
      paddingBelow: (totalHeight * (1 / 13)) / 3,
      total: perChart,
    };

    return this;
  }

  calculateDateChartHeight({ data, date }) {
    this.doc.fontSize(this.smallFontSize);
    const lineHeight = this.doc.currentLineHeight() * 1.25;

    const threeHrBinnedBoluses = _.groupBy(data.bolus, (d) => {
      const bolus = getBolusFromInsulinEvent(d);
      return bolus.threeHrBin;
    });
    const maxBolusStack = _.max(_.map(
      _.keys(threeHrBinnedBoluses),
      (key) => {
        const totalLines = _.reduce(threeHrBinnedBoluses[key], (lines, insulinEvent) => {
          const bolus = getBolusFromInsulinEvent(insulinEvent);
          if (bolus.extended || bolus.expectedExtended) {
            return lines + 2;
          }
          return lines + 1;
        }, 0);
        return totalLines;
      }
    ));

    const { notesEtc, bgEtcChart, basalChart, belowBasal, total } = this.chartMinimums;
    const bolusDetailsHeight = lineHeight * maxBolusStack;
    const totalGivenMaxBolusStack = bolusDetailsHeight +
      notesEtc + bgEtcChart + basalChart + belowBasal;

    const { bolusDetails: minBolusDetails } = this.chartMinimums;

    this.chartsByDate[date].bolusDetailsHeight = _.max([minBolusDetails, bolusDetailsHeight]);
    this.chartsByDate[date].chartHeight = _.max([total, totalGivenMaxBolusStack]);

    return this;
  }

  makeScales(dateChart) {
    const {
      notesEtc,
      bgEtcChart,
      basalChart,
      belowBasal,
    } = this.chartMinimums;

    this.bgRange[1] = _.max([this.bgRange[1], this.bgBounds.targetUpperBound]);

    // Calculate the maximum BG yScale value
    this.bgScaleYLimit = _.min([this.bgRange[1], this.bgBounds.clampThreshold]);

    dateChart.bgScale = scaleLinear() // eslint-disable-line no-param-reassign
      .domain([0, this.bgScaleYLimit])
      .range([
        dateChart.topEdge + notesEtc + bgEtcChart + this.cbgRadius,
        dateChart.topEdge + notesEtc - this.cbgRadius,
      ])
      .clamp(true);
    dateChart.bolusScale = scaleLinear() // eslint-disable-line no-param-reassign
      .domain([0, this.bolusRange[1] || 1])
      .range([
        dateChart.topEdge + notesEtc + bgEtcChart,
        dateChart.topEdge + notesEtc + (bgEtcChart / 3),
      ]);
    dateChart.basalScale = scaleLinear() // eslint-disable-line no-param-reassign
      .domain([0, this.basalRange[1]])
      .range([
        dateChart.bottomEdge - belowBasal,
        dateChart.bottomEdge - belowBasal - basalChart,
      ]);
    dateChart.xScale = scaleLinear() // eslint-disable-line no-param-reassign
      .domain([dateChart.utcBounds[0], dateChart.utcBounds[1]])
      // TODO: change to this.bolusWidth / 2 assuming boluses will be wider than cbgs
      .range([this.chartArea.leftEdge + this.cbgRadius, this.rightEdge - this.cbgRadius]);

    return this;
  }

  placeChartsOnPage() {
    const { topEdge, bottomEdge } = this.chartArea;
    let totalChartHeight = 0;
    const dates = _.keys(this.chartsByDate);
    const startingIndexThisPage = this.chartIndex;
    let chartsOnThisPage = 0;
    const limit = _.min([dates.length, startingIndexThisPage + this.chartsPerPage]);
    for (let i = startingIndexThisPage; i < limit; ++i) {
      const thisChartHeight = this.chartsByDate[dates[i]].chartHeight;
      const nextTotalHeight = totalChartHeight + thisChartHeight + this.chartMinimums.paddingBelow;
      if (nextTotalHeight > (bottomEdge - topEdge)) {
        this.chartIndex = i;
        break;
      }
      this.chartIndex = i + 1;
      totalChartHeight += thisChartHeight + this.chartMinimums.paddingBelow;
      chartsOnThisPage += 1;
      this.chartsPlaced += 1;
    }
    for (let i = startingIndexThisPage; i < startingIndexThisPage + chartsOnThisPage; ++i) {
      const chart = this.chartsByDate[dates[i]];
      chart.page = this.currentPageIndex + 1;
      if (i === startingIndexThisPage) {
        chart.topEdge = this.chartArea.topEdge;
        chart.bottomEdge = this.chartArea.topEdge + chart.chartHeight;
      } else {
        chart.topEdge =
          this.chartsByDate[dates[i - 1]].bottomEdge + this.chartMinimums.paddingBelow;
        chart.bottomEdge = chart.topEdge + chart.chartHeight;
      }
    }

    this.doc.addPage();

    return this;
  }

  renderEventPath(path) {
    const fillColor = this.colors.bolus[path.type];

    if (path.type === 'programmed') {
      if (path.subType === 'automated') {
        this.doc.path(path.d)
          .lineWidth(0.5)
          .stroke(fillColor);
      } else {
        this.doc.path(path.d)
          .lineWidth(0.5)
          .dash(0.5, { space: 1 })
          .stroke(fillColor);
      }
    } else {
      this.doc.path(path.d)
        .fill(_.get(this.colors.bolus, path.subType, fillColor));

      if (path.pattern) {

        this.doc.save();
        this.doc.path(path.d).clip();

        this.doc.path(path.pattern)
          .lineWidth(1)
          .stroke(this.colors.pattern[path.subType]);

        this.doc.path(path.d).lineWidth(0.5).stroke(fillColor);
        this.doc.restore();
      }
    }
  }

  render() {
    _.each(this.chartsByDate, (dateChart) => {
      this.goToPage(dateChart.page);
      this.renderSummary(dateChart)
        .renderXAxes(dateChart)
        .renderYAxes(dateChart)
        .renderDeviceEvents(dateChart)
        .renderCbgs(dateChart)
        .renderSmbgs(dateChart)
        .renderInsulinEvents(dateChart)
        .renderFoodCarbs(dateChart)
        .renderBolusDetails(dateChart)
        .renderBasalPaths(dateChart)
        .renderBasalRates(dateChart)
        .renderPumpSettingsOverrides(dateChart)
        .renderChartDivider(dateChart);
    });

    if (this.hasAlarms) this.renderAlarmsFootnote();
  }

  renderAlarmsFootnote() {
    this.resetText();
    this.doc
      .fontSize(this.smallFontSize)
      .fillColor(colors.gray50)
      .text(
        t('1 - The Pump Alarm icon indicates that one of the following alarms occurred: Cassette Empty, Battery Empty, or Line Blocked. Please note that pump alarms are only shown for the twiist AID system and not all alarms are shown.'),
        this.leftEdge,
        this.chartFootnotesYPos
      );
  }

  renderSummary({ date, topEdge }) {
    const smallIndent = this.margins.left + 4;
    const statsIndent = 6;
    const widthWithoutIndent = this.summaryArea.width - statsIndent;
    let first = true;

    const bgPrecision = this.bgUnits === MMOLL_UNITS ? 1 : 0;

    const statsData = _.get(this.aggregationsByDate, ['statsByDate', date], {});
    const stats = {};
    _.forOwn(statsData, (statData, statType) => {
      const stat = getStatDefinition(statData, statType, {
        bgSource: this.bgSource,
        days: 1,
        bgPrefs: this.bgPrefs,
        manufacturer: this.manufacturer,
      });
      stats[statType] = stat;
    });

    const { target, veryLow, low } = _.get(stats, 'timeInRange.data.raw.durations', {});
    const totalCbgDuration = _.get(stats, 'timeInRange.data.total.value', {});
    const { averageGlucose } = _.get(stats, 'averageGlucose.data.raw', {});
    const { carbs } = _.get(stats, 'carbs.data.raw', {});
    const { basal: totalBasal, bolus: totalBolus, insulin: totalOther } = _.get(stats, 'totalInsulin.data.raw', {});
    const totalInsulin = (totalBasal || 0) + (totalBolus || 0) + (totalOther || 0);

    this.doc.fillColor('black')
      .fillOpacity(1)
      .font(this.boldFont)
      .fontSize(this.summaryHeaderFontSize)
      .text(moment(date, 'YYYY-MM-DD').format('ddd, MMM D, Y'), this.margins.left, topEdge);

    const yPos = (function (doc) { // eslint-disable-line func-names
      let value = topEdge + doc.currentLineHeight() * 1.5;
      return {
        current: () => (value),
        small: () => {
          value += (doc.currentLineHeight() * 0.75);
          return value;
        },
        update: () => {
          value += (doc.currentLineHeight() * 1.25);
          return value;
        },
      };
    }(this.doc));

    this.doc.moveTo(this.margins.left, yPos.current())
      .lineTo(this.summaryArea.rightEdge, yPos.current())
      .lineWidth(0.5)
      .stroke(this.colors.lightDividers);

    if (totalCbgDuration > 0) {
      first = false;
      this.doc.fontSize(this.smallFontSize)
        .lineGap(this.doc.currentLineHeight() * 0.25)
        .text(t('Time in Target'), smallIndent, yPos.update());

      yPos.update();

      const { targetUpperBound, targetLowerBound, veryLowThreshold } = this.bgBounds;

      const upperTarget = formatDecimalNumber(targetUpperBound, bgPrecision);
      const lowerTarget = formatDecimalNumber(targetLowerBound, bgPrecision);

      this.doc.font(this.font)
        .text(
          `${lowerTarget} - ${upperTarget}`,
          { indent: statsIndent, continued: true, width: widthWithoutIndent }
        )
        .text(`${formatPercentage(target / totalCbgDuration)}`, { align: 'right' });

      yPos.update();

      const lowerStat = (
        veryLowThreshold
          ? { bound: veryLowThreshold, value: veryLow }
          : { bound: targetLowerBound, value: low }
      );

      this.doc
        .text(
          t('Below {{threshold}}', {
            threshold: formatDecimalNumber(lowerStat.bound, bgPrecision),
          }),
          { indent: statsIndent, continued: true, width: widthWithoutIndent }
        )
        .text(`${formatPercentage(lowerStat.value / totalCbgDuration)}`, { align: 'right' });

      yPos.update();
    }

    if (totalInsulin > 0) {
      if (!first) {
        this.doc.moveTo(this.margins.left, yPos.update())
          .lineTo(this.summaryArea.rightEdge, yPos.current())
          .stroke(this.colors.lightDividers);
      } else {
        first = false;
      }

      const ratioTitle = this.isAutomatedBasalDevice
        ? t('Time in {{automatedLabel}}', {
          automatedLabel: this.basalGroupLabels.automated,
        })
        : t('Basal:Bolus Ratio');

      this.doc.fontSize(this.smallFontSize).font(this.boldFont)
        .text(ratioTitle, smallIndent, yPos.update());

      yPos.update();

      const ratio = this.isAutomatedBasalDevice
        ? ['manual', 'automated']
        : ['basal', 'bolus', 'other'];

      const showRatioOther = !this.isAutomatedBasalDevice && _.isFinite(totalOther);

      const percentages = {
        basal: formatPercentage(totalBasal / totalInsulin),
        bolus: formatPercentage(totalBolus / totalInsulin),
        other: formatPercentage(totalOther / totalInsulin),
      };

      const labels = {
        basal: t('Basal'),
        bolus: t('Bolus'),
        other: t('Other'),
      };

      if (this.isAutomatedBasalDevice) {
        const { automated, manual } = _.get(stats, 'timeInAuto.data.raw', {});
        const totalBasalDuration = automated + manual;
        percentages.automated = formatPercentage(automated / totalBasalDuration);
        percentages.manual = formatPercentage(manual / totalBasalDuration);

        labels.automated = this.basalGroupLabels.automated;
        labels.manual = this.basalGroupLabels.manual;
      }

      const primary = {
        [ratio[0]]: percentages[ratio[0]],
        [ratio[1]]: percentages[ratio[1]],
      };

      const secondary = {
        [ratio[0]]: this.isAutomatedBasalDevice ? '' : `, ${formatDecimalNumber(totalBasal, 1)} U`,
        [ratio[1]]: this.isAutomatedBasalDevice ? '' : `, ${formatDecimalNumber(totalBolus, 1)} U`,
      };

      if (showRatioOther) {
        primary[ratio[2]] = percentages[ratio[2]];
        secondary[ratio[2]] = `, ${formatDecimalNumber(totalOther, 1)} U`;
      }

      this.doc.font(this.font)
        .text(
          labels[ratio[0]],
          { indent: statsIndent, continued: true, width: widthWithoutIndent }
        )
        .text(
          `${primary[ratio[0]]}${secondary[ratio[0]]}`,
          { align: 'right' }
        );

      yPos.update();

      this.doc.font(this.font)
        .text(
          labels[ratio[1]],
          { indent: statsIndent, continued: true, width: widthWithoutIndent }
        )
        .text(
          `${primary[ratio[1]]}${secondary[ratio[1]]}`,
          { align: 'right' }
        );

      yPos.update();

      if (showRatioOther) {
        this.doc.font(this.font)
          .text(
            labels[ratio[2]],
            { indent: statsIndent, continued: true, width: widthWithoutIndent }
          )
          .text(
            `${primary[ratio[2]]}${secondary[ratio[2]]}`,
            { align: 'right' }
          );

        yPos.update();
      }
    }

    if (averageGlucose) {
      if (!first) {
        this.doc.moveTo(this.margins.left, yPos.update())
          .lineTo(this.summaryArea.rightEdge, yPos.current())
          .stroke(this.colors.lightDividers);
      } else {
        first = false;
      }

      this.doc.fontSize(this.smallFontSize).font(this.boldFont)
        .text(
          t('Avg Glucose'),
          smallIndent,
          yPos.update(),
          { continued: true, width: widthWithoutIndent }
        )
        .font(this.font)
        .text(
          `${formatDecimalNumber(averageGlucose, bgPrecision)} ${this.bgUnits}`,
          { align: 'right' }
        );

      yPos.small();
    }

    if (totalInsulin > 0) {
      if (!first) {
        this.doc.moveTo(this.margins.left, yPos.update())
          .lineTo(this.summaryArea.rightEdge, yPos.current())
          .stroke(this.colors.lightDividers);
      } else {
        first = false;
      }

      this.doc.fontSize(this.smallFontSize).font(this.boldFont)
        .text(
          t('Total Insulin'),
          smallIndent,
          yPos.update(),
          { continued: true, width: widthWithoutIndent }
        )
        .font(this.font)
        .text(
          `${formatDecimalNumber(totalInsulin, 1)} U`,
          { align: 'right' }
        );

      yPos.small();
    }

    if (_.get(carbs, 'grams') > 0 || _.get(carbs, 'exchanges') > 0) {
      const formattedCarbs = formatDatum({ value: carbs }, statFormats.carbs);
      const carbValues = _.get(formattedCarbs, 'value');
      const carbSuffixes = _.get(formattedCarbs, 'suffix');

      if (!first) {
        this.doc.moveTo(this.margins.left, yPos.update())
          .lineTo(this.summaryArea.rightEdge, yPos.current())
          .stroke(this.colors.lightDividers);
      } else {
        first = false;
      }

      this.doc.fontSize(this.smallFontSize).font(this.boldFont)
        .text(
          t('Total Carbs'),
          smallIndent,
          yPos.update(),
          { continued: true, width: widthWithoutIndent }
        )
        .font(this.font)
        .text(
          _.map(carbValues, (value, i) => `${value} ${carbSuffixes[i]}`).join(', '),
          { align: 'right' }
        );
    }

    return this;
  }

  renderXAxes({ bolusDetailsHeight, topEdge, date }) {
    const {
      notesEtc,
      bgEtcChart,
      basalChart,
    } = this.chartMinimums;

    this.doc.lineWidth(0.25);

    // render x-axis for bgEtcChart
    const bottomOfBgEtcChart = topEdge + notesEtc + bgEtcChart;
    this.doc.moveTo(this.chartArea.leftEdge, bottomOfBgEtcChart)
      .lineTo(this.rightEdge, bottomOfBgEtcChart)
      .stroke(this.colors.axes);

    // render bottom border of bolusDetails
    const bottomOfBolusDetails = bottomOfBgEtcChart + bolusDetailsHeight;

    this.doc.moveTo(this.chartArea.leftEdge, bottomOfBolusDetails)
      .lineTo(this.rightEdge, bottomOfBolusDetails)
      .stroke(this.colors.axes);

    // render x-axis for basalChart
    const bottomOfBasalChart = bottomOfBolusDetails + basalChart;
    this.chartsByDate[date].bottomOfBasalChart = bottomOfBasalChart;

    this.doc.moveTo(this.chartArea.leftEdge, bottomOfBasalChart)
      .lineTo(this.rightEdge, bottomOfBasalChart)
      .stroke(this.colors.axes);

    return this;
  }

  renderYAxes({ bgScale, bottomOfBasalChart, utcBounds, date, topEdge, xScale }) {
    const end = utcBounds[1];
    let current = utcBounds[0];
    const threeHrLocs = [current];
    while (current < end) {
      current = moment.utc(current)
        .add(3, 'h')
        .valueOf();
      threeHrLocs.push(current);
    }
    const chart = this.chartsByDate[date];
    chart.bolusDetailPositions = Array(8);
    chart.bolusDetailWidths = Array(8);

    // render the vertical lines at three-hr intervals
    _.each(threeHrLocs, (loc, i) => {
      let xPos = xScale(loc);
      if (i === 0) {
        xPos = this.chartArea.leftEdge;
      }
      if (i === 8) {
        xPos = this.rightEdge;
      }
      if (i > 0) {
        chart.bolusDetailWidths[i - 1] = xPos - chart.bolusDetailPositions[i - 1];
      }
      if (i < 8) {
        chart.bolusDetailPositions[i] = xPos;

        this.doc.font(this.font).fontSize(this.smallFontSize)
          .text(
            formatLocalizedFromUTC(loc, this.timePrefs, 'ha').slice(0, -1),
            xPos,
            topEdge,
            { indent: 3 }
          );
      }

      this.doc.moveTo(xPos, topEdge)
        .lineTo(xPos, bottomOfBasalChart)
        .lineWidth(0.25)
        .stroke(this.colors.axes);
    });

    // render the BG axis labels and guides
    const opts = {
      align: 'right',
      width: this.chartArea.leftEdge - this.summaryArea.rightEdge - 3,
    };

    const renderedBounds = _.pickBy(this.bgBounds, bound => (bound <= this.bgScaleYLimit));

    _.each(renderedBounds, (bound, key) => {
      if (!bound) return;

      const bgTick = formatBgValue(bound, this.bgPrefs);
      const xPos = this.chartArea.leftEdge;
      const yPos = bgScale(bound);

      if (key === 'targetUpperBound' || key === 'targetLowerBound') {
        this.doc
          .moveTo(xPos, yPos)
          .lineTo(xPos + this.chartArea.width, yPos)
          .lineWidth(0.25)
          .dash(3, { space: 4 })
          .stroke(this.colors.axes);

        this.setStroke();
        this.doc.undash();
      }

      this.doc.font(this.font)
        .fontSize(this.bgAxisFontSize)
        .fillColor(this.colors.axis)
        .text(
          `${bgTick}`,
          this.summaryArea.rightEdge,
          yPos - this.doc.currentLineHeight() / 2,
          opts
        );
    });

    return this;
  }

  renderCbgs({ bgScale, data: { cbg: cbgs }, xScale }) {
    _.each(cbgs, (cbg) => {
      this.doc.circle(xScale(cbg.normalTime), bgScale(cbg.value), 1)
        .fill(this.colors[classifyBgValue(this.bgBounds, this.bgUnits, cbg.value, 'threeWay')]);
    });

    return this;
  }

  renderSmbgs({ bgScale, data: { smbg: smbgs }, xScale }) {
    _.each(smbgs, (smbg) => {
      const xPos = xScale(smbg.normalTime);
      const yPos = bgScale(smbg.value);
      const smbgLabel = formatBgValue(smbg.value, this.bgPrefs, getOutOfRangeThreshold(smbg));
      const labelWidth = this.doc.widthOfString(smbgLabel);
      const labelOffsetX = labelWidth / 2;
      let labelStartX = xPos - labelOffsetX;
      const labelEndX = labelStartX + labelWidth;

      this.doc.circle(xPos, yPos, this.smbgRadius)
        .fill(this.colors[classifyBgValue(this.bgBounds, this.bgUnits, smbg.value, 'threeWay')]);

      // Ensure label is printed within chart area for the x-axis
      if (labelStartX <= this.chartArea.leftEdge) {
        labelStartX = labelStartX + (this.chartArea.leftEdge - labelStartX) + 1;
      }
      if (labelEndX >= this.rightEdge) {
        labelStartX = labelStartX - (labelEndX - this.rightEdge) - 1;
      }

      this.doc.font(this.boldFont)
        .fontSize(this.smallFontSize)
        .fillColor('black')
        .text(
          smbgLabel,
          labelStartX,
          yPos - 12.5,
          {
            lineBreak: false,
          }
        );
    });

    return this;
  }

  renderInsulinEvents({ bolusScale, data, xScale }) {
    const insulinEvents = _.orderBy([
      ...data?.insulin || [],
      ...data?.bolus || [],
    ], ['type', 'normalTime'], ['desc', 'asc']);

    _.each(insulinEvents, (insulinEvent) => {
      const paths = getBolusPaths(insulinEvent, xScale, bolusScale, {
        bolusWidth: this.bolusWidth,
        extendedLineThickness: this.extendedLineThickness,
        interruptedLineThickness: this.interruptedLineThickness,
        triangleHeight: this.triangleHeight,
      });
      _.each(paths, (path) => {
        this.renderEventPath(path);
      });
      const carbs = getCarbs(insulinEvent);
      const circleOffset = 1;
      const textOffset = 1.75;
      const carbUnits = _.get(getWizardFromInsulinEvent(insulinEvent), 'carbUnits');
      const carbFillColor = (carbUnits === 'exchanges') ? this.colors.carbExchanges : this.colors.carbs;
      if (carbs) {
        const carbsX = xScale(getBolusFromInsulinEvent(insulinEvent).normalTime);
        const carbsY = bolusScale(getMaxValue(insulinEvent)) - this.carbRadius - circleOffset;
        this.doc.circle(carbsX, carbsY, this.carbRadius)
          .fill(carbFillColor);
        this.doc.font(this.font)
          .fontSize(this.carbsFontSize)
          .fillColor('black')
          .text(
            carbs,
            carbsX - this.carbRadius * 2,
            carbsY - textOffset,
            { align: 'center', width: this.carbRadius * 4 }
          );
      }
    });

    return this;
  }

  renderFoodCarbs({ data: { food }, xScale, topEdge }) {
    const carbsY = topEdge + 15;
    const textOffset = 1.75;

    _.each(food, foodEvent => {
      const carbs = _.get(foodEvent, 'nutrition.carbohydrate.net');

      if (carbs) {
        const carbsX = xScale(foodEvent.normalTime);

        this.doc.circle(carbsX, carbsY, this.carbRadius)
          .fill(this.colors.carbs);

        this.doc.font(this.font)
          .fontSize(this.carbsFontSize)
          .fillColor('black')
          .text(
            Math.round(carbs),
            carbsX - this.carbRadius * 2,
            carbsY - textOffset,
            { align: 'center', width: this.carbRadius * 4 }
          );
      }
    });

    return this;
  }

  renderDeviceEvents({ data: { deviceEvent = [], physicalActivity = [], reportedState = [] }, xScale, topEdge }) {
    const eventY = topEdge + 15 - this.eventRadius;
    const alarms = _.filter(deviceEvent, event => !!event.tags.alarm);
    const events = _.sortBy(_.filter([...physicalActivity, ...reportedState], event => !!event.tags.event), 'normalTime');

    _.each(events, event => {
      const eventX = xScale(event.normalTime) - this.eventRadius;
      this.doc
        .circle(eventX + this.eventRadius, eventY + this.eventRadius, this.eventRadius + 1)
        .fill('white');

      this.doc.image(eventImages[event.tags.event], eventX, eventY, {
        width: this.eventRadius * 2,
      });
    });

    _.each(alarms, alarm => {
      const alarmX = xScale(alarm.normalTime) - this.eventRadius;

      this.doc
        .circle(alarmX + this.eventRadius, eventY + this.eventRadius, this.eventRadius + 1)
        .fill('white');

      this.doc.image(eventImages[ALARM], alarmX, eventY, {
        width: this.eventRadius * 2,
      });
    });

    return this;
  }

  renderBolusDetails({
    bolusDetailPositions,
    bolusDetailWidths,
    bolusScale,
    data: { bolus: insulinEvents },
  }) {
    this.doc.font(this.font)
      .fontSize(this.smallFontSize)
      .fillColor('black');

    const topOfBolusDetails = bolusScale.range()[0] + 2;

    const grouped = _.groupBy(
      _.map(insulinEvents, (d) => (getBolusFromInsulinEvent(d))),
      (d) => (d.threeHrBin / 3)
    );

    _.each(grouped, (binOfBoluses, i) => {
      const groupWidth = bolusDetailWidths[i] - 2;
      const groupXPos = bolusDetailPositions[i];
      const yPos = (function (doc) { // eslint-disable-line func-names
        let value = topOfBolusDetails;
        return {
          current: () => (value),
          update: () => {
            value += (doc.currentLineHeight() * 1.2);
            return value;
          },
        };
      }(this.doc));
      _.each(_.sortBy(binOfBoluses, 'normalTime'), (bolus) => {
        const displayTime = formatLocalizedFromUTC(bolus.normalTime, this.timePrefs, 'h:mma')
          .slice(0, -1);
        this.doc.text(
          displayTime,
          groupXPos,
          yPos.current(),
          { continued: true, indent: 2, width: groupWidth }
        ).text(
          removeTrailingZeroes(formatDecimalNumber(getDelivered(bolus), 2)),
          { align: 'right' }
        );

        if (bolus.extended != null) {
          const normalPercentage = getNormalPercentage(bolus);
          const extendedPercentage = getExtendedPercentage(bolus);
          const durationOpts = { ascii: true };
          const durationText = `${formatDuration(getMaxDuration(bolus), durationOpts)}`;
          const percentagesText = Number.isNaN(normalPercentage) ?
            `over ${durationText}` : `${extendedPercentage} ${durationText}`;
          this.doc.text(
            percentagesText,
            groupXPos,
            yPos.update(),
            { indent: 2, width: groupWidth }
          );
        }
        yPos.update();
      });
    });

    return this;
  }

  renderBasalRates(chart) {
    const { bottomOfBasalChart, data: { basal }, xScale } = chart;

    const currentSchedule = {
      rate: 0,
      duration: 0,
      index: -1,
    };

    const labeledSchedules = [];
    _.each(basal, datum => {
      if (datum.subType === 'scheduled' && datum.rate > 0 && datum.duration >= 60 * MS_IN_MIN) {
        const newRate = currentSchedule.rate !== datum.rate;

        if (newRate) {
          labeledSchedules.push({
            normalTime: datum.normalTime,
            rate: datum.rate,
            duration: currentSchedule.duration + datum.duration,
          });

          currentSchedule.rate = datum.rate;
          currentSchedule.index ++;
          currentSchedule.duration = 0;
        } else if (labeledSchedules.length) {
          labeledSchedules[currentSchedule.index].duration += datum.duration;
        } else {
          currentSchedule.duration += datum.duration;
        }
      }
    });

    this.setFill();

    _.each(labeledSchedules, schedule => {
      const start = xScale(schedule.normalTime);

      this.doc.fontSize(this.extraSmallFontSize);
      const label = `${parseFloat(formatDecimalNumber(schedule.rate, 3))}`;
      const xPos = start;
      const yPos = bottomOfBasalChart + 2;

      this.doc.text(label, xPos, yPos);
    });

    this.resetText();

    return this;
  }

  renderBasalPaths({ basalScale, data: { basal, basalSequences: sequences }, xScale }) {
    _.each(sequences, (sequence) => {
      // Skip empty basal sequences -- otherwise getBasalSequencePaths throws error
      if (_.filter(sequence).length) {
        const paths = getBasalSequencePaths(sequence, xScale, basalScale);

        _.each(paths, (path) => {
          const opacity = _.includes(['scheduled', 'automated'], path.basalType) ? 0.4 : 0.2;
          const fillColor = path.basalType === 'automated'
            ? this.colors.basalAutomated
            : this.colors.basal;

          const lineWidth = path.type === 'border--undelivered--automated' ? 1.5 : 0.5;

          if (path.renderType === 'fill') {
            this.doc
              .path(path.d)
              .fillColor(fillColor)
              .fillOpacity(opacity)
              .fill();
          } else if (path.renderType === 'stroke') {
            this.doc
              .path(path.d)
              .lineWidth(lineWidth)
              .dash(1, { space: 2 })
              .stroke(this.colors.basal);
          }
        });
      }
    });

    if (!_.isEmpty(basal)) {
      const basalPathGroups = getBasalPathGroups(basal);

      // Split delivered path into individual segments based on subType
      _.each(basalPathGroups, (group, index) => {
        const firstDatum = group[0];
        const isAutomated = getBasalPathGroupType(firstDatum) === 'automated';
        const color = isAutomated
          ? this.colors.basalAutomated
          : this.colors.basal;

        const wholeDateDeliveredPath = calculateBasalPath(group, xScale, basalScale, {
          endAtZero: false,
          flushBottomOffset: -0.25,
          isFilled: false,
          startAtZero: false,
        });

        this.doc
          .path(wholeDateDeliveredPath)
          .lineWidth(0.5)
          .undash()
          .stroke(color);

        // Render group markers
        if (index > 0) {
          const xPos = xScale(firstDatum.normalTime);
          const yPos = basalScale.range()[1] + this.markerRadius + 1;
          const zeroBasal = basalScale.range()[0];
          const flushWithBottomOfScale = zeroBasal;

          const label = isAutomated
            ? this.basalGroupLabels.automated.charAt(0)
            : this.basalGroupLabels.manual.charAt(0);

          const labelColor = 'white';

          const labelWidth = this.doc
            .fontSize(5)
            .widthOfString(label);

          this.doc
            .circle(xPos, yPos, this.markerRadius)
            .fillColor(color)
            .fillOpacity(1)
            .fill();

          this.doc
            .moveTo(xPos, yPos)
            .lineWidth(0.75)
            .lineTo(xPos, flushWithBottomOfScale)
            .stroke(color);

          this.doc
            .fillColor(labelColor)
            .text(label, xPos - (labelWidth / 2), yPos - 2, {
              width: labelWidth,
              align: 'center',
            });
        }
      });
    }

    return this;
  }

  renderPumpSettingsOverrides({ basalScale, data: { deviceEvent }, xScale, utcBounds }) {
    const overrideData = _.filter(deviceEvent, { subType: 'pumpSettingsOverride' });

    const isFabricatedNewDayOverride = datum => _.includes(
      _.map(_.get(datum, 'annotations', []), 'code'),
      'tandem/pumpSettingsOverride/fabricated-from-new-day'
    );

    // Because the new datums are fabricated at upload when they cross midnight, we stitch them
    // together by adding the fabricated datum's duration to the previous one, so long as the
    // previous one is not also a fabricated datum.
    const stitchedData = _.reduce(overrideData, (res, datum) => {
      const prevDatum = res[res.length - 1];

      if (prevDatum && (
        isFabricatedNewDayOverride(datum) && !isFabricatedNewDayOverride(prevDatum))
      ) {
        res[res.length - 1].normalEnd = datum.normalEnd;
        res[res.length - 1].duration += datum.duration;
      } else {
        res.push(datum);
      }

      return res;
    }, []);

    _.each(stitchedData, datum => {
      const overrideStart = _.max([datum.normalTime, utcBounds[0]]);
      const overrideEnd = _.min([datum.normalTime + datum.duration, utcBounds[1]]);
      const xPos = xScale(overrideStart);
      const yPos = basalScale.range()[1] + this.markerRadius + 1;
      const bottomOfScale = basalScale.range()[0];
      const label = _.get(this.pumpSettingsOverrideLabels, [datum.overrideType, 'marker'], (datum.overrideType || 'O').toUpperCase()).charAt(0);
      const labelColor = 'white';
      const color = this.colors[datum.overrideType];

      const labelWidth = this.doc
        .fontSize(5)
        .widthOfString(label);

      this.doc
        .circle(xPos, yPos, this.markerRadius)
        .fillColor(color)
        .fillOpacity(1)
        .fill();

      this.doc
        .moveTo(xPos, yPos)
        .lineWidth(0.75)
        .lineTo(xPos, bottomOfScale)
        .stroke(color);

      this.doc
        .moveTo(xPos, yPos)
        .lineWidth(0.5)
        .lineTo(xScale(overrideEnd), yPos)
        .dash(1, { space: 2 })
        .stroke(color);

      this.doc.undash();

      this.doc
        .fillColor(labelColor)
        .text(label, xPos - (labelWidth / 2), yPos - 2, {
          width: labelWidth,
          align: 'center',
        });
    });

    return this;
  }

  renderChartDivider({ bottomEdge, bottomOfBasalChart }) {
    const isLastChartOnPage = bottomEdge + this.chartMinimums.total > this.chartArea.bottomEdge;

    const padding = (bottomEdge - bottomOfBasalChart) + this.chartMinimums.paddingBelow;
    const yPos = bottomOfBasalChart + padding / 2;

    if (!isLastChartOnPage) {
      this.doc
        .moveTo(this.leftEdge, yPos)
        .lineWidth(1)
        .lineTo(this.rightEdge, yPos)
        .stroke(this.colors.lightGrey);

      this.chartFootnotesYPos = yPos + 10;
    } else {
      this.chartFootnotesYPos = yPos - 10;
    }
  }

  renderLegend() {
    this.doc.fontSize(9);

    const itemGap = 14;
    const legendXPadding = 7;
    const legendYPadding = 4;
    const lineYpadding = 0.5;
    const lineHeight = this.doc.currentLineHeight();
    const paddedLineHeight = lineHeight + (lineYpadding * 2);

    // Calculate available width for legend items
    const availableWidth = this.width - (legendXPadding * 2);

    // Function to calculate item width
    const getItemWidth = (item) => {
      let itemWidth = 0;
      switch (item.type) {
      case 'cbg':
        itemWidth = 16 + 4 + this.doc.widthOfString(t('CGM'));
        break;
      case 'smbg':
        itemWidth = (this.smbgRadius * 3) + 4 + this.doc.widthOfString(t('BGM'));
        break;
      case 'bolus':
        if (this.isAutomatedBolusDevice) {
        itemWidth = (this.bolusWidth * 3) + 4 + this.doc.widthOfString(t('automated'));
        } else {
        itemWidth = this.bolusWidth + 4 + this.doc.widthOfString(t('Bolus'));
        }
        break;
      case 'override':
        itemWidth = (this.bolusWidth * 3) + 4 + this.doc.widthOfString(t('up & down'));
        break;
      case 'interrupted':
        itemWidth = this.bolusWidth + 4 + this.doc.widthOfString(t('Interrupted'));
        break;
      case 'extended':
        itemWidth = (this.bolusWidth / 2) + 10 + 4 + this.doc.widthOfString(t('Extended'));
        break;
      case 'carbs':
        itemWidth = this.carbRadius + 4 + this.doc.widthOfString(t('Carbs (g)'));
        break;
      case 'basals':
        if (this.isAutomatedBasalDevice) {
        itemWidth = 23 + 4 + this.doc.widthOfString(t('automated'));
        } else {
        itemWidth = 23 + 4 + this.doc.widthOfString(t('Basals'));
        }
        break;
      case EVENT_PHYSICAL_ACTIVITY:
        itemWidth = (this.eventRadius * 2) + 4 + this.doc.widthOfString(t('Exercise'));
        break;
      case EVENT_NOTES:
        itemWidth = (this.eventRadius * 2) + 4 + this.doc.widthOfString(t('Note'));
        break;
      case EVENT_HEALTH:
        itemWidth = (this.eventRadius * 2) + 4 + this.doc.widthOfString(t('Health'));
        break;
      case 'alarms':
        itemWidth = (this.eventRadius * 2) + 4 + this.doc.widthOfString(t('Alarm'));
        break;
      }
      return itemWidth;
    };

    // Chunk items into rows based on available width
    const legendRows = [];
    let currentRow = [];
    let currentRowWidth = 0;

    _.each(this.legendItemsToShow, item => {
      const itemWidth = getItemWidth(item);
      const nextItemWidth = currentRowWidth + (currentRow.length > 0 ? itemGap : 0) + itemWidth;

      if (currentRow.length === 0 || nextItemWidth <= availableWidth) {
        currentRow.push(item);
        currentRowWidth = nextItemWidth;
      } else {
        // Start new row
        legendRows.push(currentRow);
        currentRow = [item];
        currentRowWidth = itemWidth;
      }
    });

    // Add the last row if it has items
    if (currentRow.length > 0) {
      legendRows.push(currentRow);
    }

    // Calculate legend height based on content
    let maxLines = 2;
    _.each(legendRows[0], (item) => {
      if (item.labels.length > maxLines) {
        maxLines = item.labels.length;
      }
    });

    const baseHeight = (paddedLineHeight * 2);
    const additionalHeight = maxLines > 2 ? (lineHeight + lineYpadding)  * (maxLines - 2) : 0;
    const firstRowHeight = (baseHeight + additionalHeight) + (legendYPadding * 2);
    const subsequentRowHeight = paddedLineHeight;
    const legendHeight = firstRowHeight + (subsequentRowHeight + legendYPadding) * (legendRows.length - 1);
    const legendTop = this.bottomEdge - lineHeight * 2 - legendHeight;

    let rowHeights = _.map(legendRows, (_, rowIndex) => rowIndex === 0
      ? firstRowHeight
      : subsequentRowHeight,
    );

    let rowVerticalMiddles = _.map(legendRows, (_, rowIndex) => rowIndex === 0
      ? legendTop + firstRowHeight * 0.5
      : legendTop + firstRowHeight + ((rowIndex - 1) * subsequentRowHeight) + (subsequentRowHeight * 0.5)
    );

    // TODO: Confirm it's acceptable to remove the Legend title
    this.doc.fillColor('black').fillOpacity(1)
      .text(t('Legend'), this.margins.left, legendTop - lineHeight * 1.5);

    this.doc.lineWidth(1)
      .rect(this.margins.left, legendTop, this.width, legendHeight)
      .stroke('black');

    this.doc.fontSize(this.smallFontSize);

    const labelOptions = { lineBreak: false }; // Prevent line breaks in legend labels from overflowing and forcing a new page

    const renderLabels = (item, cursor, rowIndex) => {
      const { labels } = item;

      // Set up consistent y-positions for legend text based on number of rows
      const singleLineTextYPos = rowVerticalMiddles[rowIndex] - (lineHeight / 2);

      const textYPos = {
        single: [singleLineTextYPos],
        double: [singleLineTextYPos - paddedLineHeight / 2, singleLineTextYPos + paddedLineHeight / 2],
        triple: [
          singleLineTextYPos - paddedLineHeight,
          singleLineTextYPos,
          singleLineTextYPos + paddedLineHeight,
        ],
      };

      cursor += 4; // Small gap between symbol and label
      const labelWidths = [];
      let labelRows = 'single';

      if (labels.length === 2) {
        labelRows = 'double';
      } else if (labels.length === 3) {
        labelRows = 'triple';
      }

      this.doc.fontSize(this.smallFontSize);
      this.setFill('black');

      _.each(labels, (label, index) => {
        const renderFootnoteReference = item.footNoteReference && index === labels.length - 1;
        this.doc.text(label, cursor, textYPos[labelRows][index], { ...labelOptions, continued: renderFootnoteReference });

        if (renderFootnoteReference) {
          this.doc.fontSize(this.smallFontSize - 2);
          this.doc.text(item.footNoteReference, this.doc.x, this.doc.y - 2);
        }

        labelWidths.push(this.doc.widthOfString(label));
      });

      cursor += _.max(labelWidths);
      return cursor;
    };

    // Render the legend items for the current row
    const renderRow = (items, rowIndex) => {
      let cursor = this.margins.left + legendXPadding;
      const rowHeight = rowHeights[rowIndex];
      const rowVerticalMiddle = rowVerticalMiddles[rowIndex];

      _.each(items, item => {
        if (rowIndex > 0) {
          // Render all second row item labels in single line to save vertical space
          item.labels = [item.labels.join(' ')];
        }

        switch (item.type) {
          case 'cbg': {
            const traceWidth = 16;
            const vertOffsetAdjustments = [2.25, 1, 0.25, 0, 0, -0.25, -1, -2.25];

            _.each(_.map(range(0, traceWidth, 2), (d) => ([d, d - 7])), (pair) => {
              const [horizOffset, vertOffset] = pair;
              const adjustedVertOffset = vertOffset + vertOffsetAdjustments[horizOffset / 2];
              let fill;

              if (horizOffset < 4) {
                fill = 'high';
              } else if (horizOffset < 12) {
                fill = 'target';
              } else {
                fill = 'low';
              }

              this.doc
                .circle(cursor + horizOffset, rowVerticalMiddle + adjustedVertOffset, this.cbgRadius)
                .fill(this.colors[fill]);
            });

            cursor += traceWidth;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'smbg': {
            this.doc.circle(cursor, rowVerticalMiddle, this.smbgRadius)
              .fill(this.colors.target);

            this.doc.circle(cursor + this.smbgRadius * 2, rowVerticalMiddle - this.smbgRadius * 2, this.smbgRadius)
              .fill(this.colors.high);

            this.doc.circle(cursor + this.smbgRadius * 2, rowVerticalMiddle + this.smbgRadius * 2, this.smbgRadius)
              .fill(this.colors.low);

            cursor += this.smbgRadius * 3;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'bolus': {
            const bolusOpts = {
              bolusWidth: this.bolusWidth,
              extendedLineThickness: this.extendedLineThickness,
              interruptedLineThickness: this.interruptedLineThickness,
              triangleHeight: this.triangleHeight,
            };

            const bolusGap = 2;
            const bolusXScaleWidth = this.isAutomatedBolusDevice ? this.bolusWidth * 2 + bolusGap : this.bolusWidth;

            const normalBolusXScale = scaleLinear()
              .domain([0, bolusXScaleWidth])
              .range([cursor, cursor + bolusXScaleWidth]);

            const legendBolusYScale = scaleLinear()
              .domain([0, 10])
              .range([rowVerticalMiddle + (rowHeight / 4), rowVerticalMiddle - (rowHeight / 4)]);

            const normalPaths = getBolusPaths(
              { normal: 10, normalTime: 0 },
              normalBolusXScale,
              legendBolusYScale,
              bolusOpts
            );

            _.each(normalPaths, (path) => {
              this.renderEventPath(path);
            });

            if (this.isAutomatedBolusDevice) {
              const automatedPaths = getBolusPaths(
                { normal: 7, normalTime: this.bolusWidth + bolusGap, subType: 'automated' },
                normalBolusXScale,
                legendBolusYScale,
                bolusOpts
              );

              _.each(automatedPaths, (path) => {
                this.renderEventPath(path);
              });
            }

            cursor += bolusXScaleWidth;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'override':{
            const bolusGap = 2;
            const bolusXScaleWidth = this.bolusWidth * 2 + bolusGap;

            const rideBolusXScale = scaleLinear()
              .domain([0, bolusXScaleWidth])
              .range([cursor, cursor + bolusXScaleWidth]);

            const legendBolusYScaleForRide = scaleLinear()
              .domain([0, 10])
              .range([rowVerticalMiddle + (rowHeight / 4), rowVerticalMiddle - (rowHeight / 4)]);

            const overridePaths = getBolusPaths(
              {
                type: 'wizard',
                recommended: { net: 8, carb: 8, correction: 0 },
                bolus: { normal: 10, normalTime: 0 },
              },
              rideBolusXScale,
              legendBolusYScaleForRide,
              {
                bolusWidth: this.bolusWidth,
                extendedLineThickness: this.extendedLineThickness,
                interruptedLineThickness: this.interruptedLineThickness,
                triangleHeight: this.triangleHeight,
              }
            );

            _.each(overridePaths, (path) => {
              this.renderEventPath(path);
            });

            const underridePaths = getBolusPaths(
              {
                type: 'wizard',
                recommended: { net: 10, carb: 8, correction: 2 },
                bolus: { normal: 5, normalTime: this.bolusWidth + bolusGap },
              },
              rideBolusXScale,
              legendBolusYScaleForRide,
              {
                bolusWidth: this.bolusWidth,
                extendedLineThickness: this.extendedLineThickness,
                interruptedLineThickness: this.interruptedLineThickness,
                triangleHeight: this.triangleHeight,
              }
            );

            _.each(underridePaths, (path) => {
              this.renderEventPath(path);
            });

            cursor += bolusXScaleWidth;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'interrupted': {
            const bolusXScaleWidth = this.bolusWidth;

            const interruptedBolusXScale = scaleLinear()
              .domain([0, bolusXScaleWidth])
              .range([cursor, cursor + bolusXScaleWidth]);

            const legendBolusYScaleForInterrupted = scaleLinear()
              .domain([0, 10])
              .range([rowVerticalMiddle + (rowHeight / 4), rowVerticalMiddle - (rowHeight / 4)]);

            const interruptedPaths = getBolusPaths(
              {
                normal: 6,
                expectedNormal: 10,
                normalTime: 0,
              },
              interruptedBolusXScale,
              legendBolusYScaleForInterrupted,
              {
                bolusWidth: this.bolusWidth,
                extendedLineThickness: this.extendedLineThickness,
                interruptedLineThickness: this.interruptedLineThickness,
                triangleHeight: this.triangleHeight,
              }
            );

            _.each(interruptedPaths, (path) => {
              this.renderEventPath(path);
            });

            cursor += bolusXScaleWidth;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'extended': {
            const bolusXScaleWidth = this.bolusWidth;
            const extendedDuration = 10;

            const extendedBolusXScale = scaleLinear()
              .domain([0, bolusXScaleWidth])
              .range([cursor, cursor + bolusXScaleWidth]);

            const legendBolusYScaleForExtended = scaleLinear()
              .domain([0, 10])
              .range([rowVerticalMiddle + (rowHeight / 4), rowVerticalMiddle - (rowHeight / 4)]);

            const extendedPaths = getBolusPaths(
              {
                normal: 5,
                extended: 5,
                duration: extendedDuration,
                normalTime: 0,
              },
              extendedBolusXScale,
              legendBolusYScaleForExtended,
              {
                bolusWidth: this.bolusWidth,
                extendedLineThickness: this.extendedLineThickness,
                interruptedLineThickness: this.interruptedLineThickness,
                triangleHeight: this.triangleHeight,
              }
            );

            _.each(extendedPaths, (path) => {
              this.renderEventPath(path);
            });

            cursor += extendedDuration;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'carbs': {
            const carbsYPos = {
              circle: rowVerticalMiddle,
              carbs: rowVerticalMiddle - this.carbRadius / 2,
            };

            if (this.hasCarbExchanges) {
              carbsYPos.circle -= (paddedLineHeight / 2 + 1);
              carbsYPos.carbs -= (paddedLineHeight / 2 + 1);
            }

            this.doc.circle(cursor, carbsYPos.circle, this.carbRadius).fill(this.colors.carbs);

            this.doc.fillColor('black').fontSize(this.carbsFontSize)
              .text('25', cursor - this.carbRadius, carbsYPos.carbs, { align: 'center', width: this.carbRadius * 2 });

            if (this.hasCarbExchanges) {
              const exchangesYPos = {
                circle: carbsYPos.circle + paddedLineHeight,
                carbs: carbsYPos.carbs + paddedLineHeight,
              };

              this.doc.circle(cursor, exchangesYPos.circle, this.carbRadius).fill(this.colors.carbExchanges);

              this.doc.fillColor('black').fontSize(this.carbsFontSize)
                .text('2', cursor - this.carbRadius, exchangesYPos.carbs, { align: 'center', width: this.carbRadius * 2 });
            }

            cursor += this.carbRadius;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'basals': {
            const legendBasalXScale = scaleLinear()
              .domain([0, 10])
              .range([cursor, cursor + 50]);

            const legendBasalYScale = scaleLinear()
              .domain([0, 2.5])
              .range([rowVerticalMiddle + (rowHeight / 4), rowVerticalMiddle - (rowHeight / 3)]);

            const basalData = this.isAutomatedBasalDevice ? {
              basal: [
                { subType: 'scheduled', rate: 0, duration: 0, normalTime: 0 },
                { subType: 'automated', rate: 1, duration: 2, normalTime: 0 },
                { subType: 'scheduled', rate: 1, duration: 2, normalTime: 2.25 },
              ],
              basalSequences: [
                [{ subType: 'scheduled', rate: 0, duration: 0, normalTime: 0 }],
                [{ subType: 'automated', rate: 1, duration: 2, normalTime: 0 }],
                [{ subType: 'scheduled', rate: 1, duration: 2, normalTime: 2.25 }],
              ],
            } : {
              basal: [
                { subType: 'scheduled', rate: 2, duration: 2, normalTime: 0 },
                { subType: 'temp', rate: 1.5, duration: 2, normalTime: 2, suppressed: { rate: 2 } },
              ],
              basalSequences: [
                [{ subType: 'scheduled', rate: 2, duration: 2, normalTime: 0 }],
                [{ subType: 'temp', rate: 1.5, duration: 2, normalTime: 2, suppressed: { rate: 2 } }],
              ],
            };

            this.renderBasalPaths({
              basalScale: legendBasalYScale,
              data: basalData,
              xScale: legendBasalXScale,
            });

            cursor += 22;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case EVENT_PHYSICAL_ACTIVITY: {
            this.doc.image(eventImages[EVENT_PHYSICAL_ACTIVITY], cursor, rowVerticalMiddle - this.eventRadius, {
              width: this.eventRadius * 2,
            });

            cursor += this.eventRadius * 2;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case EVENT_NOTES: {
            this.doc.image(eventImages[EVENT_NOTES], cursor, rowVerticalMiddle - this.eventRadius, {
              width: this.eventRadius * 2,
            });

            cursor += this.eventRadius * 2;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case EVENT_HEALTH: {
            this.doc.image(eventImages[EVENT_HEALTH], cursor, rowVerticalMiddle - this.eventRadius, {
              width: this.eventRadius * 2,
            });

            cursor += this.eventRadius * 2;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }

          case 'alarms': {
            this.doc.image(eventImages[ALARM], cursor, rowVerticalMiddle - this.eventRadius, {
              width: this.eventRadius * 2,
            });

            cursor += this.eventRadius * 2;
            cursor = renderLabels(item, cursor, rowIndex);
            break;
          }
        }

        // Add fixed gap between items
        cursor += itemGap;
      });
    };

    _.each(legendRows, renderRow);

    return this;
  }
}

export default DailyPrintView;
