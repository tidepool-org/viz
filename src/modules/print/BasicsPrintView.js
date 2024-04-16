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
import moment from 'moment';
import i18next from 'i18next';

import PrintView from './PrintView';

import {
  defineBasicsAggregations,
  generateCalendarDayLabels,
  processBasicsAggregations,
  findBasicsDays,
} from '../../utils/basics/data';

import { formatDatum, statBgSourceLabels } from '../../utils/stat';
import { getPumpVocabulary } from '../../utils/device';

import {
  AUTOMATED_DELIVERY,
  SITE_CHANGE_CANNULA,
  SITE_CHANGE_RESERVOIR,
  SITE_CHANGE_TUBING,
  NO_SITE_CHANGE,
  SETTINGS_OVERRIDE,
  SITE_CHANGE,
} from '../../utils/constants';

const siteChangeImages = {
  [SITE_CHANGE_CANNULA]: 'images/sitechange-cannula.png',
  [SITE_CHANGE_RESERVOIR]: 'images/sitechange-reservoir.png',
  [SITE_CHANGE_TUBING]: 'images/sitechange-tubing.png',
};

const t = i18next.t.bind(i18next);

class BasicsPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);

    this.sections = _.isEmpty(this.aggregationsByDate) ? {} : processBasicsAggregations(
      defineBasicsAggregations(
        this.bgPrefs,
        this.manufacturer,
        this.latestPumpUpload
      ),
      this.aggregationsByDate,
      this.patient,
      this.manufacturer
    );

    // Auto-bind callback methods
    this.renderCalendarCell = this.renderCalendarCell.bind(this);

    this.doc.addPage();
    this.initLayout();
  }

  newPage() {
    super.newPage(this.getDateRange(this.endpoints.range[0], this.endpoints.range[1] - 1, undefined, t('Date range: ')));
  }

  initCalendar() {
    const columnWidth = this.getActiveColumnWidth();
    const calendar = {};

    calendar.days = findBasicsDays(this.endpoints.range, this.timePrefs.timezoneName);
    calendar.labels = generateCalendarDayLabels(calendar.days);

    calendar.headerHeight = 15;

    calendar.columns = _.map(calendar.labels, label => ({
      id: label,
      header: label,
      width: columnWidth / 7,
      height: columnWidth / 7,
      cache: false,
      renderer: this.renderCalendarCell,
      headerBorder: '',
      headerPadding: [4, 2, 0, 2],
      padding: [3, 2, 3, 2],
    }));

    calendar.pos = {};

    this.calendar = calendar;
  }

  initLayout() {
    this.setLayoutColumns({
      width: this.chartArea.width,
      gutter: 15,
      type: 'percentage',
      widths: [25.5, 49, 25.5],
    });
  }

  render() {
    this.renderStats();
    this.renderCalendars();
    this.RenderCalendarSummaries();
  }

  renderStats() {
    this.goToPage(0);
    this.goToLayoutColumnPosition(0);
    this.renderAggregatedStats();
  }

  renderCalendars() {
    this.goToPage(0);
    this.goToLayoutColumnPosition(1);
    this.initCalendar();

    this.renderCalendarSection({
      title: this.sections.fingersticks.title,
      data: this.aggregationsByDate.fingersticks.smbg.byDate,
      type: 'smbg',
      disabled: this.sections.fingersticks.disabled,
      emptyText: this.sections.fingersticks.emptyText,
    });

    this.renderCalendarSection({
      title: {
        text: this.sections.boluses.title,
        subText: _.get(this.data, 'query.excludeDaysWithoutBolus') ? t('(days with no boluses have been excluded)') : false,
      },
      data: this.aggregationsByDate.boluses.byDate,
      type: 'bolus',
      disabled: this.sections.boluses.disabled,
      emptyText: this.sections.boluses.emptyText,
    });

    const siteChangesSubTitle = this.sections.siteChanges.subTitle;

    this.renderCalendarSection({
      title: {
        text: this.sections.siteChanges.title,
        subText: siteChangesSubTitle ? t("(from '{{source}}')", { source: this.sections.siteChanges.subTitle }) : false,
      },
      data: this.aggregationsByDate.siteChanges.byDate,
      type: 'siteChange',
      disabled: this.sections.siteChanges.disabled,
      emptyText: this.sections.siteChanges.emptyText,
    });

    this.renderCalendarSection({
      title: this.sections.basals.title,
      data: this.aggregationsByDate.basals.basal.byDate,
      type: 'basal',
      disabled: this.sections.basals.disabled,
      emptyText: this.sections.basals.emptyText,
      bottomMargin: 0,
    });
  }

  RenderCalendarSummaries() {
    this.goToPage(0);
    this.goToLayoutColumnPosition(2);

    this.renderCalendarSummary({
      dimensions: this.sections.fingersticks.dimensions,
      header: this.sections.fingersticks.summaryTitle,
      data: this.aggregationsByDate.fingersticks,
      type: 'smbg',
      disabled: this.sections.fingersticks.disabled,
    });

    this.renderCalendarSummary({
      dimensions: this.sections.boluses.dimensions,
      header: this.sections.boluses.summaryTitle,
      data: this.aggregationsByDate.boluses,
      type: 'bolus',
      disabled: this.sections.boluses.disabled,
    });

    this.renderCalendarSummary({
      dimensions: this.sections.basals.dimensions,
      header: this.sections.basals.summaryTitle,
      data: this.aggregationsByDate.basals,
      type: 'basal',
      disabled: this.sections.basals.disabled,
    });
  }

  renderAggregatedStats() {
    const {
      averageDailyDose,
      averageGlucose,
      carbs,
      coefficientOfVariation,
      glucoseManagementIndicator,
      readingsInRange,
      sensorUsage,
      standardDev,
      timeInAuto,
      timeInOverride,
      timeInRange,
      totalInsulin,
    } = this.stats;

    if (timeInRange) {
      this.renderHorizontalBarStat(
        timeInRange,
        {
          heading: {
            text: 'BG Distribution',
            note: t('Showing {{source}} data', { source: statBgSourceLabels[this.bgSource] }),
          },
          secondaryFormatKey: 'tooltip',
        }
      );
    }

    if (readingsInRange) {
      this.renderHorizontalBarStat(
        readingsInRange,
        {
          heading: {
            text: 'BG Distribution',
            note: t('{{source}} data from {{count}} readings', {
              source: statBgSourceLabels[this.bgSource],
              count: readingsInRange.data?.raw?.counts?.total,
            }),
          },
          secondaryFormatKey: 'tooltip',
        }
      );
    }

    if (averageGlucose) this.renderSimpleStat(averageGlucose);
    if (sensorUsage) this.renderSimpleStat(sensorUsage);

    this.renderHorizontalBarStat(
      totalInsulin,
      {
        heading: t('Avg. Daily Insulin Ratio'),
        secondaryFormatKey: 'tooltip',
        fillOpacity: 0.5,
      }
    );

    if (timeInAuto) {
      const automatedLabel = getPumpVocabulary(this.manufacturer)[AUTOMATED_DELIVERY];
      this.renderHorizontalBarStat(
        timeInAuto,
        {
          heading: t('Time In {{automatedLabel}} Ratio', { automatedLabel }),
          fillOpacity: 0.5,
          secondaryFormatKey: 'tooltip',
        }
      );
    }

    if (timeInOverride) {
      const overrideLabel = getPumpVocabulary(this.manufacturer)[SETTINGS_OVERRIDE];
      this.renderHorizontalBarStat(
        timeInOverride,
        {
          heading: t('Time In {{overrideLabel}}', { overrideLabel }),
          fillOpacity: 0.5,
          secondaryFormatKey: 'tooltip',
        }
      );
    }

    const hasCarbGramsData = _.get(carbs, 'data.raw.carbs.grams', 0) > 0;
    const hasCarbExchangeData = _.get(carbs, 'data.raw.carbs.exchanges', 0) > 0;

    if (hasCarbGramsData && hasCarbExchangeData) {
      carbs.title = [
        carbs.title,
        t('Avg. Daily Carb Exchanges'),
      ];
    }

    this.renderSimpleStat(carbs);
    this.renderSimpleStat(averageDailyDose);
    if (glucoseManagementIndicator) this.renderSimpleStat(glucoseManagementIndicator);
    this.renderSimpleStat(standardDev);
    this.renderSimpleStat(coefficientOfVariation);
  }

  defineStatColumns(opts = {}) {
    const columnWidth = this.getActiveColumnWidth();

    const {
      height = 30,
      labelWidth = columnWidth * 0.65,
      valueWidth = columnWidth * 0.35,
      statFont = this.font,
      statFontSize = this.defaultFontSize,
      valueFont = this.boldFont,
      valueFontSize = this.defaultFontSize,
      labelHeader = false,
      valueHeader = false,
    } = opts;

    const columns = [
      {
        id: 'label',
        cache: false,
        renderer: this.renderCustomTextCell,
        width: Math.round(labelWidth) - this.tableSettings.borderWidth,
        height,
        fontSize: statFontSize,
        font: statFont,
        align: 'left',
        headerAlign: 'left',
        border: 'TBL',
        headerBorder: 'TBL',
        valign: 'center',
        header: labelHeader,
      },
      {
        id: 'value',
        cache: false,
        renderer: this.renderCustomTextCell,
        width: Math.round(valueWidth) - this.tableSettings.borderWidth,
        height,
        fontSize: valueFontSize,
        font: valueFont,
        align: 'right',
        headerAlign: 'right',
        border: 'TBR',
        headerBorder: 'TBR',
        valign: 'center',
        header: valueHeader,
      },
    ];

    return columns;
  }

  renderSimpleStat(stat) {
    const label = !_.isArray(stat.title) ? _.compact([stat.title]) : stat.title;

    const value = formatDatum(
      _.get(stat.data, _.get(stat.data, 'dataPaths.summary')),
      _.get(stat, 'dataFormat.summary'),
      { bgPrefs: this.bgPrefs, data: stat.data }
    );

    // Ensure zero values are not stripped by _.compact when setting values array
    if (value.value === 0) value.value = [value.value];
    if (!_.isArray(value.value)) value.value = _.compact([value.value]);
    if (!_.isArray(value.suffix)) value.suffix = _.compact([value.suffix]);

    const tableColumns = this.defineStatColumns();

    this.setFill(value.id === 'statDisabled' ? this.colors.lightGrey : 'black', 1);

    const rows = _.map(value.value, (v, i) => ({
      label: label[i] || '',
      value: {
        text: `${v}`,
        subText: `${_.get(value, ['suffix', i], '')}`,
      },
    }));

    this.renderTable(tableColumns, rows, {
      showHeaders: false,
      bottomMargin: 15,
    });

    this.setFill();
  }

  renderHorizontalBarStat(stat, opts = {}) {
    _.defaults(opts, {
      heading: {
        text: stat.title,
        subText: null,
        note: null,
      },
      primaryFormatKey: 'label',
      secondaryFormatKey: null,
      emptyText: t('No data available'),
      fillOpacity: 0.75,
    });

    const columnWidth = this.getActiveColumnWidth();

    const statHasData = _.get(stat, 'data.total.value') > 0;
    if (!statHasData && _.isPlainObject(opts.heading)) {
      opts.heading.note = opts.emptyText; // eslint-disable-line no-param-reassign
    }

    this.renderTableHeading(opts.heading, {
      columnDefaults: {
        width: columnWidth,
        noteFontSize: this.smallFontSize,
      },
      height: opts.heading.note ? 30 : 16,
      font: this.font,
      fontSize: this.defaultFontSize,
    });

    if (!statHasData) this.doc.moveDown(1.25);

    this.doc.fontSize(this.smallFontSize);

    if (statHasData) {
      const statDatums = _.get(stat, 'data.data', []);
      const statTotal = _.get(stat, 'data.total.value', 1);

      const tableColumns = [
        {
          id: 'value',
          cache: false,
          renderer: this.renderCustomTextCell,
          width: columnWidth,
          height: 35,
          fontSize: this.largeFontSize,
          font: this.boldFont,
          noteFontSize: this.smallFontSize - 1,
          align: 'left',
        },
      ];

      const rows = _.map(statDatums, datum => {
        const { id } = datum;

        let color = this.colors[id];
        if (id === 'veryHigh') color = this.colors.high;
        if (id === 'veryLow') color = this.colors.low;

        const value = formatDatum(
          datum,
          _.get(stat, 'dataFormat.label'),
          { bgPrefs: this.bgPrefs, data: stat.data }
        );

        let note = datum.legendTitle;
        if (stat.units) note += ` ${stat.units}`;

        let secondaryValue;
        if (opts.secondaryFormatKey) {
          secondaryValue = formatDatum(
            datum,
            _.get(stat, ['dataFormat', opts.secondaryFormatKey]),
            { bgPrefs: this.bgPrefs, data: stat.data }
          );

          if (stat.id === 'readingsInRange') secondaryValue.suffix += 'readings/day';
          note += ` (${secondaryValue.value} ${secondaryValue.suffix})`;
        }

        const stripePadding = 2;

        return {
          value: {
            text: value.value,
            subText: value.suffix,
            note,
          },
          _fillStripe: {
            color,
            opacity: opts.fillOpacity,
            width: (columnWidth - (2 * stripePadding)) * (_.toNumber(datum.value) / statTotal),
            background: true,
            padding: stripePadding,
          },
        };
      }).reverse();

      this.renderTable(tableColumns, rows, {
        showHeaders: false,
        bottomMargin: 15,
      });
    }
  }

  renderCalendarSection(opts) {
    const {
      title,
      data,
      type,
      bottomMargin = 20,
      disabled,
      emptyText,
    } = opts;

    const columnWidth = this.getActiveColumnWidth();

    let headingMoveDown = 0.25;

    const renderSectionHeading = (moveDown = 0) => this.renderSectionHeading(title, {
      width: columnWidth,
      fontSize: this.largeFontSize,
      moveDown,
    });

    if (disabled) {
      renderSectionHeading(headingMoveDown);
      this.renderEmptyText(emptyText);
    } else {
      const isSiteChange = type === 'siteChange';
      let priorToFirstSiteChange = false;
      const siteChangeSource = this.sections.siteChanges.source;

      if (isSiteChange) {
        priorToFirstSiteChange = _.some(data, ({ summary = {} }) => _.isNaN(summary.daysSince));
      }

      const chunkedDayMap = _.chunk(_.map(this.calendar.days, (day, index) => {
        const date = moment.utc(day.date);
        const dateLabelMask = (index === 0 || date.date() === 1) ? 'MMM D' : 'D';

        let dayType = day.type;

        if (isSiteChange) {
          if (dayType === 'inRange') {
            dayType = data[day.date] ? SITE_CHANGE : NO_SITE_CHANGE;
          }

          if (dayType === NO_SITE_CHANGE && priorToFirstSiteChange) {
            dayType = 'outOfRange';
          }

          if (dayType === SITE_CHANGE && priorToFirstSiteChange) {
            priorToFirstSiteChange = false;
          }
        }

        return {
          color: this.colors[type],
          count: _.get(data, `${day.date}.total`, _.get(data, `${day.date}.count`, 0)),
          dayOfWeek: date.format('ddd'),
          daysSince: _.get(data, `${day.date}.summary.daysSince[${siteChangeSource}]`),
          label: date.format(dateLabelMask),
          type: dayType,
        };
      }), 7);

      const rows = _.map(chunkedDayMap, week => {
        const values = {};

        _.each(week, day => {
          values[day.dayOfWeek] = day;
        });

        return values;
      });

      this.doc.fontSize(this.largeFontSize);
      const headingHeight = this.doc.heightOfString(' ');
      let headingYPos = this.doc.y;

      this.doc.fontSize(this.smallFontSize);
      const headerHeight = this.doc.heightOfString(' ');

      this.doc.moveDown(headingMoveDown);
      const currentYPos = headingHeight + this.doc.y;

      this.doc.y = currentYPos + headerHeight;

      this.calendar.pos[type] = {
        y: currentYPos + headerHeight + 4.25,
        pageIndex: this.currentPageIndex,
      };

      if (!this.calendar.rowHeight) {
        // Calculate row height by rendering a single row with invisible fill and stroke
        this.doc.fillOpacity(0);
        this.doc.strokeOpacity(0);
        this.lockFillandStroke();

        this.renderTable(this.calendar.columns, [rows[0]], {
          bottomMargin: 0,
        });

        this.calendar.rowHeight = this.doc.y - this.calendar.pos[type].y;

        // Reset fill and stroke opacities
        this.unlockFillandStroke();
        this.doc.fillOpacity(1);
        this.doc.strokeOpacity(1);
      } else {
        // Check to see if there's room on the current page, and if not, render on a new page
        const calendarHeight = this.calendar.pos[type].y + (this.calendar.rowHeight * rows.length);
        if (calendarHeight > this.chartArea.bottomEdge) {
          if (this.initialTotalPages + this.currentPageIndex + 1 < this.totalPages) {
            this.goToPage(this.currentPageIndex + 1);
          } else {
            this.doc.addPage();
          }

          this.doc.moveDown(headingMoveDown);
          headingMoveDown = 0;
          headingYPos = this.chartArea.topEdge;

          this.calendar.pos[type] = {
            y: headingYPos + headingHeight + headerHeight + 4.25,
            pageIndex: this.currentPageIndex,
          };
        }
      }

      this.doc.y = headingYPos;
      renderSectionHeading(headingMoveDown);

      this.doc.fontSize(this.smallFontSize);
      this.renderTable(this.calendar.columns, rows, {
        bottomMargin,
      });
    }
  }

  renderCalendarCell(tb, data, draw, column, pos, padding) {
    if (draw) {
      const {
        color,
        count,
        type,
        daysSince,
        label,
      } = data[column.id];

      const xPos = pos.x + padding.left;
      const yPos = pos.y + padding.top;

      const isEmptyBolusDay = color === this.colors.bolus && count === 0;
      const isExcludedBolusDay = isEmptyBolusDay && _.get(this.data, 'query.excludeDaysWithoutBolus', false);

      this.setFill((type === 'outOfRange' || isExcludedBolusDay) ? this.colors.lightGrey : 'black', 1);

      this.doc
        .fontSize(this.extraSmallFontSize)
        .text(label, xPos, yPos);

      const width = column.width - _.get(padding, 'left', 0) - _.get(padding, 'right', 0);
      const height = column.height - _.get(padding, 'top', 0) - _.get(padding, 'bottom', 0);

      const gridHeight = height - (this.doc.y - yPos);
      const gridWidth = width > gridHeight ? gridHeight : width;

      const siteChangeTypes = [NO_SITE_CHANGE, SITE_CHANGE];
      const isSiteChange = _.includes(siteChangeTypes, type) ? type === SITE_CHANGE : null;

      if (isSiteChange !== null) {
        this.setStroke(this.colors.grey);
        this.doc.lineWidth(1);

        const isFirst = _.isNaN(daysSince);

        const linePos = {
          x: pos.x,
          y: pos.y + column.height / 2 - 1,
        };

        const dotPos = {
          x: linePos.x + column.width - 6,
          y: linePos.y,
        };

        this.doc
          .moveTo(isFirst ? dotPos.x : linePos.x, linePos.y)
          .lineTo(linePos.x + column.width, linePos.y)
          .stroke();

        if (isSiteChange) {
          const daysSinceLabel = daysSince === 1 ? 'day' : 'days';

          const siteChangeSource = this.sections.siteChanges.source;
          const imageWidth = width / 2.5;
          const imagePadding = (width - imageWidth) / 2;

          this.setStroke('white');
          this.doc.lineWidth(2);

          this.doc
            .moveTo(linePos.x + column.width / 2, linePos.y - 0.5)
            .lineTo(dotPos.x, linePos.y)
            .stroke();

          this.setFill(color);
          this.setStroke(this.colors.grey);

          this.doc
            .lineWidth(0.5)
            .circle(dotPos.x, dotPos.y, 2.5)
            .fillAndStroke();

          this.setFill();

          this.doc.image(siteChangeImages[siteChangeSource], xPos + imagePadding, this.doc.y, {
            width: imageWidth,
          });

          if (!isFirst) {
            this.doc.text(`${daysSince} ${daysSinceLabel}`, this.doc.x, this.doc.y + 2, {
              width,
              align: 'center',
            });
          }
        }
      } else if (count > 0) {
        const gridPos = {
          x: pos.x + (column.width - gridWidth) / 2,
          y: this.doc.y,
        };

        this.setFill(color);
        this.renderCountGrid(count, gridWidth, gridPos, color);
        this.setFill();
      }

      this.resetText();
    }

    return ' ';
  }

  renderCountGrid(count, width, pos) {
    const colCount = 3;
    const rowCount = 3;
    const gridSpaces = colCount * rowCount;
    const padding = width * 0.05;
    const maxCount = 17;
    const renderCount = count > maxCount ? maxCount : count;

    const {
      x: xPos,
      y: yPos,
    } = pos;

    const diameter = (width - padding * (colCount - 1)) / colCount;
    const radius = diameter / 2;

    const grid = _.times(rowCount, (row) => _.times(colCount, (col) => ({
      x: xPos + (col * diameter) + (padding * col),
      y: yPos + (row * diameter) + (padding * row),
    })));

    const countArray = _.fill(Array(renderCount), 1);
    const extrasArray = _.map(
      _.chunk(countArray.splice(gridSpaces), gridSpaces - 1),
      chunk => chunk.length
    ).reverse();

    const gridValues = _.map(
      _.fill(Array(gridSpaces), 0),
      (space, index) => (_.get(countArray, index, 0) + _.get(extrasArray, index, 0))
    );

    if (extrasArray.length) {
      gridValues.reverse();
    }

    const chunkedGridValues = _.chunk(gridValues, colCount);

    const renderColumn = rowIndex => (col, colIndex) => {
      const gridPos = grid[rowIndex][colIndex];
      const dot = chunkedGridValues[rowIndex][colIndex];

      if (dot > 1) {
        this.renderCountGrid(dot, diameter, gridPos);
      } else if (dot === 1) {
        this.doc
          .circle(gridPos.x + radius, gridPos.y + radius, radius)
          .fill();
      }
    };

    const renderRow = (row, rowIndex) => {
      _.each(row, renderColumn(rowIndex));
    };

    _.each(chunkedGridValues, renderRow);
  }

  renderCalendarSummary(opts) {
    const columnWidth = this.getActiveColumnWidth();

    const {
      dimensions,
      data,
      type,
      header,
      disabled,
    } = opts;

    if (!disabled) {
      let primaryDimension;
      const rows = [];

      _.each(dimensions, dimension => {
        const { path, key } = dimension;

        const valueObj = _.get(data, _.compact([...path.split('.').concat(key)]), 0);

        const isAverage = dimension.average;

        const value = isAverage
          ? Math.round(_.get(data, [...path.split('.').concat('avgPerDay')]))
          : _.get(valueObj, 'count', valueObj);

        const stat = {
          label: dimension.label,
          value: (value || 0).toString(),
        };

        if (dimension.primary) {
          stat.label = header;
          primaryDimension = stat;
        } else {
          if (value === 0 && dimension.hideEmpty) {
            return;
          }
          rows.push(stat);
        }
      });

      const tableColumns = this.defineStatColumns({
        labelWidth: columnWidth * 0.78,
        valueWidth: columnWidth * 0.22,
        height: 20,
        labelHeader: primaryDimension.label,
        valueHeader: (primaryDimension.value || 0).toString(),
      });

      tableColumns[0].headerFont = this.font;

      if (_.get(this, `calendar.pos[${type}]`)) {
        this.goToPage(this.calendar.pos[type].pageIndex);
        this.doc.y = this.calendar.pos[type].y;
      }

      this.renderTable(tableColumns, rows, {
        columnDefaults: {
          zebra: true,
          headerFill: {
            color: this.colors[`${type}Header`],
            opacity: 1,
          },
          headerRenderer: this.renderCustomTextCell,
          headerHeight: 28,
        },
        bottomMargin: 15,
      });
    }
  }

  renderEmptyText(text) {
    this.setFill(this.colors.lightGrey);

    this.doc
      .fontSize(this.defaultFontSize)
      .text(text, {
        width: this.getActiveColumnWidth(),
      })
      .moveDown(1.5);

    this.resetText();
  }
}

export default BasicsPrintView;
