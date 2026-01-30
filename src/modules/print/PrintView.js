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
import PdfTable from 'voilab-pdf-table';
import PdfTableFitColumn from 'voilab-pdf-table/plugins/fitcolumn';
import i18next from 'i18next';

import SVGtoPDF from 'svg-to-pdfkit';

import {
  getOffset,
  getTimezoneFromTimePrefs,
  formatBirthdate,
  formatCurrentDate,
  formatDateRange,
} from '../../utils/datetime';

import { getStatDefinition } from '../../utils/stat';
import { getPatientFullName } from '../../utils/misc';
import { getDeviceName } from '../../utils/device';

import {
  DPI,
  MARGINS,
  WIDTH,
  HEIGHT,
  DEFAULT_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
} from './utils/constants';

import { BG_COLORS, MS_IN_MIN } from '../../utils/constants';
import './registerStaticFiles';

const t = i18next.t.bind(i18next);

const patternImages = {
  diagonalStripes: 'images/diagonalStripes.png',
};

class PrintView {
  constructor(doc, data = {}, opts) {
    this.doc = doc;
    this.addSVG = SVGtoPDF.bind(null, this.doc);

    this.title = opts.title;
    this.data = _.cloneDeep(data);
    this.bgPrefs = _.get(this.data, 'bgPrefs');
    this.bgUnits = _.get(this.data, 'bgPrefs.bgUnits');
    this.bgBounds = _.get(this.data, 'bgPrefs.bgBounds');
    this.timePrefs = _.get(this.data, 'timePrefs');
    this.timezone = getTimezoneFromTimePrefs(this.timePrefs);
    this.endpoints = _.get(this.data, 'data.current.endpoints', {});
    this.bgSource = _.get(this.data, 'metaData.bgSources.current');
    this.latestPumpUpload = _.get(this.data, 'metaData.latestPumpUpload');
    this.manufacturer = _.get(this.latestPumpUpload, 'manufacturer');
    this.devices = _.get(this.data, 'metaData.devices', []);

    this.stats = {};
    const statsData = _.get(this.data, 'data.current.stats', {});
    _.forOwn(statsData, (statData, statType) => {
      const stat = getStatDefinition(statData, statType, {
        bgSource: this.bgSource,
        days: this.endpoints.activeDays || this.endpoints.days,
        bgPrefs: this.bgPrefs,
        manufacturer: this.manufacturer,
      });
      this.stats[statType] = stat;
    });

    this.aggregationsByDate = _.get(this.data, 'data.current.aggregationsByDate', {});

    this.debug = opts.debug || false;

    this.dpi = opts.dpi || DPI;
    this.margins = opts.margins || MARGINS;

    this.font = 'Helvetica';
    this.boldFont = 'Helvetica-Bold';

    this.defaultFontSize = opts.defaultFontSize || DEFAULT_FONT_SIZE;
    this.footerFontSize = opts.footerFontSize || FOOTER_FONT_SIZE;
    this.headerFontSize = opts.headerFontSize || HEADER_FONT_SIZE;
    this.largeFontSize = opts.largeFontSize || LARGE_FONT_SIZE;
    this.smallFontSize = opts.smallFontSize || SMALL_FONT_SIZE;
    this.extraSmallFontSize = opts.extraSmallFontSize || EXTRA_SMALL_FONT_SIZE;

    this.width = opts.width || WIDTH;
    this.height = opts.height || HEIGHT;

    this.patient = opts.patient;
    this.patientInfoBox = {
      width: 0,
      height: 0,
    };

    this.colors = {
      ...BG_COLORS,
      basal: '#19A0D7',
      basalAutomated: '#00B2C3',
      sleep: '#4457D9',
      physicalActivity: '#758CFF',
      preprandial: '#4457D9',
      bolus: '#7CD0F0',
      insulin: '#7CD0F0',
      bolusAutomated: '#00B2C3',
      presets: '#F4F5FF',
      smbg: '#6480FB',
      siteChange: '#FCD144',
      basalHeader: '#DCF1F9',
      smbgHeader: '#E8ECFE',
      bolusHeader: '#EBF7FC',
      grey: '#6D6D6D',
      faintGrey: '#D9D9D9',
      lightGrey: '#979797',
      darkGrey: '#4E4E4F',
      primaryText: '#4F6A92'
    };

    this.tableSettings = {
      colors: {
        border: this.colors.grey,
        tableHeader: this.colors.basal,
        zebraHeader: '#FAFAFA',
        zebraEven: '#FAFAFA',
        zebraOdd: '#FFFFFF',
      },
      borderWidth: 0.5,
    };

    this.leftEdge = this.margins.left;
    this.rightEdge = this.margins.left + this.width;
    this.topEdge = this.margins.top;
    this.bottomEdge = this.margins.top + this.height;

    this.chartArea = {
      bottomEdge: this.margins.top + opts.height,
      leftEdge: this.margins.left,
      topEdge: this.margins.top,
    };

    this.chartArea.width = this.rightEdge - this.chartArea.leftEdge;
    this.initialChartArea = _.clone(this.chartArea);

    this.totalPages = this.initialTotalPages = this.doc.bufferedPageRange().count || 0;
    this.currentPageIndex = -1;

    // kick off the dynamic calculation of chart area based on font sizes for header and footer
    this.setHeaderSize().setFooterSize();

    // Auto-bind callback methods
    this.newPage = this.newPage.bind(this);
    this.setNewPageTablePosition = this.setNewPageTablePosition.bind(this);
    this.renderCustomTextCell = this.renderCustomTextCell.bind(this);

    // Clear previous and set up pageAdded listeners :/
    this.doc.removeAllListeners('pageAdded');
    this.doc.on('pageAdded', this.newPage);

    // Unset any text styles lingering from previous reports
    if (this.initialTotalPages > 0) this.resetText();
  }

  newPage(dateText, opts = {}) {
    _.defaults(opts, { showProfile: true });

    if (this.debug) {
      this.renderDebugGrid();
    }

    const currentFont = {
      name: _.get(this.doc, '_font.name', this.font),
      size: _.get(this.doc, '_fontSize', this.defaultFontSize),
      color: _.get(this.doc, '_fillColor', []),
    };

    this.currentPageIndex++;
    this.totalPages++;

    this.renderHeader(dateText, opts).renderFooter(opts);
    this.doc.x = this.chartArea.leftEdge;
    this.doc.y = this.chartArea.topEdge;

    // Set font styles back to what they were before the page break
    // This is needed because the header and footer rendering changes it
    // and any tables that need to continue rendering on the new page are affected.
    this.doc
      .font(currentFont.name)
      .fontSize(currentFont.size);

    this.setFill(...currentFont.color);

    if (this.table) {
      this.setNewPageTablePosition();
    }

    if (this.layoutColumns) {
      this.setLayoutColumns({
        activeIndex: this.layoutColumns.activeIndex,
        count: this.layoutColumns.count,
        gutter: this.layoutColumns.gutter,
        type: this.layoutColumns.type,
        width: this.layoutColumns.width,
        widths: this.layoutColumns.widths,
      });

      this.goToLayoutColumnPosition(this.layoutColumns.activeIndex);
    }
  }

  setNewPageTablePosition() {
    const xPos = this.layoutColumns
      ? _.get(this, `layoutColumns.columns.${this.layoutColumns.activeIndex}.x`)
      : this.chartArea.leftEdge;

    this.doc.x = this.table.pos.x = xPos;
    this.doc.y = this.table.pos.y = this.chartArea.topEdge;

    this.table.pdf.lineWidth(this.tableSettings.borderWidth);
  }

  setLayoutColumns(opts) {
    const {
      activeIndex = 0,
      columns = [],
      count = _.get(opts, 'widths.length', 0),
      gutter = 0,
      type = 'equal',
      width = this.chartArea.width,
      widths = [],
    } = opts;

    const availableWidth = width - (gutter * (count - 1));

    switch (type) {
      case 'percentage': {
        let combinedWidths = 0;
        let i = 0;

        do {
          const columnWidth = availableWidth * widths[i] / 100;

          columns.push({
            x: this.chartArea.leftEdge + (gutter * i) + combinedWidths,
            y: this.doc.y,
            width: columnWidth,
          });

          i++;
          combinedWidths += columnWidth;
        } while (i < count);

        break;
      }

      case 'equal':
      default: {
        const columnWidth = availableWidth / count;
        let i = 0;

        do {
          columns.push({
            x: this.chartArea.leftEdge + (gutter * i) + (columnWidth * i),
            y: this.doc.y,
            width: columnWidth,
          });
          i++;
        } while (i < count);

        break;
      }
    }

    this.layoutColumns = {
      activeIndex,
      columns,
      count,
      gutter,
      type,
      width,
      widths,
    };
  }

  updateLayoutColumnPosition(index) {
    this.layoutColumns.columns[index].x = this.doc.x;
    this.layoutColumns.columns[index].y = this.doc.y;
  }

  goToLayoutColumnPosition(index) {
    this.doc.x = this.layoutColumns.columns[index].x;
    this.doc.y = this.layoutColumns.columns[index].y;
    this.layoutColumns.activeIndex = index;
  }

  goToPage(index) {
    this.doc.switchToPage(this.initialTotalPages + index);
    this.currentPageIndex = index;
  }

  getShortestLayoutColumn() {
    let shortest;
    let shortestIndex;
    _.each(this.layoutColumns.columns, (column, colIndex) => {
      if (!shortest || (shortest > column.y)) {
        shortest = column.y;
        shortestIndex = colIndex;
      }
    });

    return shortestIndex;
  }

  getLongestLayoutColumn() {
    let longest;
    let longestIndex;
    _.each(_.get(this, 'layoutColumns.columns', []), (column, colIndex) => {
      if (!longest || (longest < column.y)) {
        longest = column.y;
        longestIndex = colIndex;
      }
    });

    return longestIndex;
  }

  getActiveColumnWidth() {
    return this.layoutColumns.columns[this.layoutColumns.activeIndex].width;
  }

  getDateRange(startDate, endDate, dateParseFormat, prefix, monthFormat) {
    let start = startDate;
    let end = endDate;

    if (_.isNumber(startDate) && _.isNumber(endDate)) {
      start = startDate - getOffset(startDate, this.timezone) * MS_IN_MIN;
      end = endDate - getOffset(endDate, this.timezone) * MS_IN_MIN;
    }

    return t('{{prefix}}{{dateRange}}', {
      prefix,
      dateRange: formatDateRange(start, end, dateParseFormat, monthFormat),
    });
  }

  lockFillandStroke() {
    this.fillLocked = true;
    this.strokeLocked = true;
  }

  unlockFillandStroke() {
    this.fillLocked = false;
    this.strokeLocked = false;
  }

  setFill(color = 'black', opacity = 1) {
    if (this.fillLocked) return;
    this.doc
      .fillColor(color)
      .fillOpacity(opacity);
  }

  setStroke(color = 'black', opacity = 1) {
    if (this.strokeLocked) return;
    this.doc
      .strokeColor(color)
      .strokeOpacity(opacity);
  }

  resetText() {
    this.setFill();
    this.doc
      .lineGap(0)
      .fontSize(this.defaultFontSize)
      .font(this.font);
  }

  renderSectionHeading(heading, opts = {}) {
    const {
      xPos = this.doc.x,
      yPos = this.doc.y,
      font = _.get(opts, 'font', this.font),
      fontSize = _.get(opts, 'fontSize', this.headerFontSize),
      subTextFont = _.get(opts, 'subTextFont', this.font),
      subTextFontSize = _.get(opts, 'subTextFontSize', this.defaultFontSize),
      moveDown = 1,
    } = opts;

    const text = _.isString(heading) ? heading : heading.text;
    const subText = _.get(heading, 'subText', false);

    const textHeight = this.doc
      .font(font)
      .fontSize(fontSize)
      .heightOfString(' ');

    const subTextHeight = this.doc
      .font(subTextFont)
      .fontSize(subTextFontSize)
      .heightOfString(' ');

    const subTextYOffset = (textHeight - subTextHeight) / 1.75;

    this.doc
      .font(font)
      .fontSize(fontSize)
      .text(text, xPos, yPos, _.defaults(opts, {
        align: 'left',
        continued: !!subText,
      }));

    if (subText) {
      this.doc
        .font(subTextFont)
        .fontSize(subTextFontSize)
        .text(` ${subText}`, xPos, yPos + subTextYOffset);
    }

    this.resetText();
    this.doc.moveDown(moveDown);
  }

  renderCellStripe(data = {}, column = {}, pos = {}, isHeader = false) {
    const fillStripeKey = isHeader ? 'headerFillStripe' : 'fillStripe';
    const fillKey = isHeader ? 'headerFill' : 'fill';
    const heightKey = isHeader ? 'headerHeight' : 'height';

    const height = _.get(column, heightKey, column.height)
                || _.get(data, '_renderedContent.height', 0);

    const stripe = {
      width: 0,
      height,
      padding: 0,
      color: this.colors.grey,
      opacity: 1,
      background: false,
    };

    const fillStripe = _.get(data, `_${fillStripeKey}`, column[fillStripeKey]);
    const fill = _.get(data, `_${fillKey}`, column[fillKey]);

    if (fillStripe) {
      const stripeDefined = _.isPlainObject(fillStripe);

      stripe.color = stripeDefined
        ? _.get(fillStripe, 'color', this.colors.grey)
        : _.get(fill, 'color', this.colors.grey);

      stripe.opacity = stripeDefined ? _.get(fillStripe, 'opacity', 1) : 1;
      stripe.width = stripeDefined ? _.get(fillStripe, 'width', 6) : 6;
      stripe.background = _.get(fillStripe, 'background', false);
      stripe.padding = _.get(fillStripe, 'padding', 0);

      this.setFill(stripe.color, stripe.opacity);

      const xPos = pos.x + 0.25 + stripe.padding;
      const yPos = pos.y + 0.25 + stripe.padding;
      const stripeWidth = stripe.width;
      const stripeHeight = stripe.height - 0.5 - (2 * stripe.padding);

      if (stripe.width > 0) {
        this.doc
          .rect(xPos, yPos, stripeWidth, stripeHeight)
          .fill();

        if (patternImages[fillStripe.patternOverlay]) {
          this.doc.save();
          this.doc.rect(xPos, yPos, stripeWidth, stripeHeight).clip();
          this.doc.fillOpacity(1);
          this.doc.image(patternImages[fillStripe.patternOverlay], xPos, yPos, { cover: [stripeWidth, stripeHeight] });
          this.doc.restore();
        }
      }

      this.setFill();
    }

    return stripe;
  }

  renderCustomTextCell(tb, data, draw, column, pos, padding, isHeader) {
    let {
      text = '',
      subText = '',
      note,
    } = _.get(data, column.id, column.header || {});

    if ((!isHeader && _.isString(data[column.id])) || _.isString(column.header)) {
      text = isHeader ? column.header : data[column.id];
      subText = note = null;
    }

    if (!draw) {
      // In pre-draw phase, we use the text to measure height for the container
      if (data?.hasDynamicHeight && text) {
        const { font = this.font, fontSize = this.defaultFontSize } = column;
        this.doc.font(font).fontSize(fontSize);

        return text;
      }

      return ' ';
    }

    if (draw) {
      const alignKey = isHeader ? 'headerAlign' : 'align';
      const align = _.get(column, alignKey, 'left');

      const stripe = this.renderCellStripe(data, column, pos, isHeader);
      const stripeOffset = stripe.background ? 0 : stripe.width;

      const xPos = pos.x + _.get(padding, 'left', 0) + stripeOffset;
      let yPos = pos.y + padding.top;

      // eslint-disable-next-line no-underscore-dangle
      const boldRow = data._bold || isHeader;

      const width = column.width - _.get(padding, 'left', 0) - _.get(padding, 'right', 0);

      const heightKey = isHeader ? 'headerHeight' : 'height';

      const height = _.get(column, heightKey, column.height)
                  || _.get(data, '_renderedContent.height', 0);

      const fontKey = isHeader ? 'headerFont' : 'font';
      const fontSize = _.get(column, 'fontSize', this.defaultFontSize);

      const subTextFontSize = _.get(column, 'subTextFontSize', this.defaultFontSize);
      const subTextYOffset = Math.ceil((fontSize - subTextFontSize) / 2);

      this.doc
        .font(_.get(column, fontKey, boldRow ? this.boldFont : this.font))
        .fontSize(fontSize);

      if (column.valign === 'center') {
        const textHeight = this.doc.heightOfString(text, { width });
        yPos += (height - textHeight) / 2 + 1;
      }

      let textRightPadding = 0;
      if (subText && align === 'right') {
        textRightPadding = this.doc.widthOfString(subText);
      }

      this.doc.text(text, xPos - textRightPadding, yPos, {
        continued: !!subText,
        align,
        width,
      });
      this.doc.font(this.font).fontSize(subTextFontSize);

      if (subText) {
        this.doc.text(`${subText}`, xPos, yPos + subTextYOffset, {
          align,
          width,
        });
      }

      if (note) {
        this.doc
          .fontSize(_.get(column, 'noteFontSize', this.defaultFontSize))
          .text(note, xPos, this.doc.y + subTextYOffset, {
            align,
            width,
          });
      }
    }

    return ' ';
  }

  renderTableHeading(heading = {}, opts = {}) {
    const fontSize = _.get(opts, 'fontSize', this.largeFontSize);
    const cellHeight = fontSize * 2;

    this.doc
      .font(this.font)
      .fontSize(fontSize);

    const columns = [
      {
        id: 'heading',
        align: _.get(opts, 'align', 'left'),
        height: _.get(opts, 'height', _.get(heading, 'note') ? cellHeight + 13 : cellHeight),
        cache: false,
        renderer: this.renderCustomTextCell,
        font: _.get(opts, 'font', this.boldFont),
        fontSize,
      },
    ];

    const rows = [
      {
        heading,
        note: _.get(heading, 'note'),
      },
    ];

    this.renderTable(columns, rows, _.defaultsDeep(opts, {
      columnDefaults: {
        headerBorder: '',
      },
      bottomMargin: 0,
      showHeaders: false,
    }));

    this.resetText();
  }

  renderTable(columns = [], rows = [], opts = {}, Table = PdfTable, FitColumn = PdfTableFitColumn) {
    this.doc.lineWidth(this.tableSettings.borderWidth);

    _.defaultsDeep(opts, {
      columnDefaults: {
        borderColor: this.tableSettings.colors.border,
        headerBorder: 'TBLR',
        border: 'TBLR',
        align: 'left',
        padding: [7, 5, 3, 5],
        headerPadding: [7, 5, 3, 5],
        fill: _.get(opts, 'columnDefaults.fill', _.get(opts, 'columnDefaults.zebra', false)),
      },
      bottomMargin: 20,
      pos: {
        maxY: this.chartArea.bottomEdge,
      },
    });

    // There is a bug in the PDF table plugin where it will render empty headers even if showHeaders
    // is false when a table spills over onto a new page. We remove the header border and padding in
    // to work around this, and cause it to effectively render nothing.
    // eslint-disable-next-line no-param-reassign
    if (opts.showHeaders === false) columns = columns.map(column => ({ ...column, headerBorder: '', headerPadding: [0, 0, 0, 0] }));

    const {
      flexColumn,
    } = opts;

    const table = this.table = new Table(this.doc, opts);

    if (flexColumn) {
      table.addPlugin(new FitColumn({
        column: flexColumn,
      }));
    }

    table.onPageAdd(this.onPageAdd.bind(this));

    table.onPageAdded(this.onPageAdded.bind(this));

    table.onCellBackgroundAdd(this.onCellBackgroundAdd.bind(this));

    table.onCellBackgroundAdded(this.onCellBackgroundAdded.bind(this));

    table.onCellBorderAdd(this.onCellBorderAdd.bind(this));

    table.onCellBorderAdded(this.onCellBorderAdded.bind(this));

    table.onRowAdd(this.onRowAdd.bind(this));

    table.onRowAdded(this.onRowAdded.bind(this));

    table.onBodyAdded(this.onBodyAdded.bind(this));

    table
      .setColumnsDefaults(opts.columnDefaults)
      .addColumns(columns)
      .addBody(rows);
  }

  onPageAdd(tb, row, ev) {
    const currentPageIndex = this.initialTotalPages + this.currentPageIndex;

    if (currentPageIndex + 1 === this.totalPages) {
      tb.pdf.addPage();
    } else {
      this.currentPageIndex++;
      tb.pdf.switchToPage(this.initialTotalPages + this.currentPageIndex);
      this.setNewPageTablePosition();
    }

    // cancel event so the automatic page add is not triggered
    ev.cancel = true; // eslint-disable-line no-param-reassign
  }

  onPageAdded(tb, row) {
    const tableLabel = _.get(row, '_renderedContent.data.label', undefined);
    const tableData = _.get(row, '_renderedContent.data.value', undefined);

    const isPageBreakAtTableStart = !_.isNil(tableLabel) && _.isNil(tableData);

    if (isPageBreakAtTableStart) return; // prevent double header on new page

    tb.addHeader();
  }

  onBodyAdded(tb) {
    // Restore x position after table is drawn
    this.doc.x = _.get(tb, 'pos.x', this.doc.page.margins.left);

    // Add margin to the bottom of the table
    this.doc.y += tb.bottomMargin;
  }

  onCellBackgroundAdd(tb, column, row, index, isHeader) {
    const {
      fill,
      headerFill,
      zebra,
    } = column;

    const isEven = index % 2 === 0;

    const fillKey = isHeader ? headerFill : fill;

    if (fillKey) {
      const fillDefined = _.isPlainObject(fillKey);
      let color;
      let opacity;

      if (!fillDefined) {
        opacity = 1;

        if (zebra) {
          if (isHeader) {
            color = this.tableSettings.colors.zebraHeader;
          } else {
            color = isEven
              ? this.tableSettings.colors.zebraEven
              : this.tableSettings.colors.zebraOdd;
          }
        } else {
          color = fillKey || 'white';
        }
      } else {
        const defaultOpacity = _.get(fillKey, 'opacity', 1);

        color = _.get(fillKey, 'color', 'white');
        opacity = zebra && !isEven ? defaultOpacity / 2 : defaultOpacity;
      }

      this.setFill(color, opacity);
    }

    /* eslint-disable no-underscore-dangle */
    if (row._fill) {
      const {
        color,
        opacity,
      } = row._fill;

      this.setFill(color, opacity);
    }
    /* eslint-enable no-underscore-dangle */
  }

  onCellBackgroundAdded() {
    this.setFill();
  }

  onCellBorderAdd(tb, column) {
    const borderWidth = _.get(column, 'borderWidth', this.tableSettings.borderWidth);

    this.doc.lineWidth(borderWidth);
    this.setStroke(_.get(column, 'borderColor', 'black'), 1);
  }

  onCellBorderAdded() {
    this.doc.lineWidth(this.tableSettings.borderWidth);
    this.setStroke();
  }

  onRowAdd(tb, row) {
    // eslint-disable-next-line no-underscore-dangle
    if (row._bold) {
      this.doc.font(this.boldFont);
    }
  }

  onRowAdded() {
    this.resetText();
  }

  renderPatientInfo() {
    const patientName = _.truncate(getPatientFullName(this.patient), { length: 32 });
    const patientBirthdate = formatBirthdate(this.patient);
    let patientMRN = this.patient?.clinicPatientMRN || this.patient?.profile?.patient?.mrn;
    const xOffset = this.margins.left;
    const yOffset = this.margins.top;

    this.doc
      .lineWidth(1)
      .fontSize(10)
      .text(patientName, xOffset, yOffset, {
        lineGap: 2,
      });

    const patientNameWidth = this.doc.widthOfString(patientName);
    const patientDOB = t('DOB: {{birthdate}}', { birthdate: patientBirthdate });

    this.doc
      .fontSize(10)
      .text(patientDOB);

    const patientBirthdayWidth = this.doc.widthOfString(patientDOB);
    this.patientInfoBox.height = this.doc.y;

    let patientMRNWidth = 0;

    if (patientMRN) {
      if (patientMRN.length > 15) {
        patientMRN = `${patientMRN.slice(0, 5)}\u2026${patientMRN.slice(-7)}`;
      }

      const patientMRNText = t('MRN: {{mrn}}', { mrn: patientMRN });

      this.doc
        .moveDown(0.15)
        .fontSize(10)
        .text(patientMRNText);

      patientMRNWidth = this.doc.widthOfString(patientMRNText);
      this.patientInfoBox.height = this.doc.y;
    }

    this.patientInfoBox.width = _.max([patientNameWidth, patientBirthdayWidth, patientMRNWidth]);

    // Render the divider between the patient info and title
    const padding = 10;

    this.doc
      .moveTo(this.margins.left + this.patientInfoBox.width + padding, this.margins.top)
      .lineTo(this.margins.left + this.patientInfoBox.width + padding, this.patientInfoBox.height)
      .stroke('black');

    this.dividerWidth = padding * 2 + 1;
  }

  getDeviceNames() {
    return _.chain(this.devices)
      .map(d => getDeviceName(d))
      .compact()
      .uniq()
      .value();
  }

  getDeviceNamesHeaderContent() {
    const deviceNames = this.getDeviceNames();

    if (!deviceNames.length) return null;

    const label = t('Devices');
    const devicesText = deviceNames.join(', ');

    return { label, devicesText };
  }

  renderDeviceNamesHeader() {
    const content = this.getDeviceNamesHeaderContent();
    if (!content) return;

    const { label, devicesText } = content;

    this.doc.font(this.font).fontSize(this.defaultFontSize);
    const labelWidth = this.doc.widthOfString(label) + 10;

    const rows = [{ label, text: devicesText, hasDynamicHeight: true }];

    const tableColumns = [
      {
        id: 'label',
        cache: false,
        renderer: this.renderCustomTextCell,
        width: labelWidth,
        fontSize: this.defaultFontSize,
        font: this.boldFont,
        align: 'left',
        border: 'B',
        borderWidth: 1,
        borderColor: 'black',
        padding: [0, 0, 7, 0]
      },
      {
        id: 'text',
        cache: false,
        renderer: this.renderCustomTextCell,
        width: this.width - labelWidth,
        fontSize: this.defaultFontSize,
        font: this.font,
        align: 'left',
        border: 'B',
        borderWidth: 1,
        borderColor: 'black',
        padding: [0, 0, 7, 0]
      },
    ];

    this.doc.x = this.margins.left;
    this.doc.y = this.chartArea.topEdge;

    this.renderTable(tableColumns, rows, {
      showHeaders: false,
      bottomMargin: 10,
    });
  }

  renderTitle(opts = {}) {
    _.defaults(opts, { titleOffset: 21 });
    const lineHeight = this.doc.fontSize(14).currentLineHeight();
    const xOffset = this.margins.left + this.patientInfoBox.width + opts.titleOffset;

    const yOffset = (
      this.margins.top + ((this.patientInfoBox.height - this.margins.top) / 2 - (lineHeight / 2))
    );

    const title = this.currentPageIndex === 0
      ? this.title
      : t('{{title}} (cont.)', { title: this.title });

    this.doc.text(title, xOffset, yOffset);
    this.titleWidth = this.doc.widthOfString(title);
  }

  renderDateText(dateText = '') {
    const MAX_CHARS_PER_LINE = 45;
    const TOP_PADDING = 2.5;
    const lineHeight = this.doc.fontSize(14).currentLineHeight();

    // Calculate the remaining available width so we can
    // center the print text between the patient/title text and the logo
    const availableWidth = this.doc.page.width - _.reduce([
      this.patientInfoBox.width,
      this.dividerWidth,
      this.titleWidth,
      this.logoWidth,
      this.margins.left,
      this.margins.right,
    ], (a, b) => (a + b), 0);

    const xOffset = (
      this.margins.left + this.patientInfoBox.width + this.dividerWidth + this.titleWidth
    );

    const yOffset = (
      this.margins.top + ((this.patientInfoBox.height - this.margins.top) / 2 - (lineHeight / 2))
    );

    const shouldSplitLines = dateText.length > MAX_CHARS_PER_LINE && dateText.includes(' - ');

    if (!shouldSplitLines) {
      this.doc
        .fontSize(10)
        .text(dateText, xOffset, yOffset + TOP_PADDING, {
          width: availableWidth,
          align: 'center',
        });

      return;
    }

    // Date is too long to render on one line, we need to render on 2 lines
    const [
      yOffsetLine1,
      yOffsetLine2
    ] = [
      this.margins.top + ((this.patientInfoBox.height - this.margins.top) / 2 - lineHeight),
      this.margins.top + ((this.patientInfoBox.height - this.margins.top) / 2)
    ];

    const lines = dateText.split(' - ');
    const dateTextLine1 = lines[0].concat(' - ');
    const dateTextLine2 = lines[1] || '';

    const RIGHT_PADDING = 20;

    this.doc
      .fontSize(10)
      .text(dateTextLine1, xOffset - RIGHT_PADDING, yOffsetLine1 + TOP_PADDING, {
        width: availableWidth,
        align: 'right',
      });

    this.doc
      .fontSize(10)
      .text(dateTextLine2, xOffset - RIGHT_PADDING, yOffsetLine2 + TOP_PADDING, {
        width: availableWidth,
        align: 'right',
      });
  }

  renderLogo() {
    this.logoWidth = 100;
    const lineHeight = this.doc.fontSize(14).currentLineHeight();
    const xOffset = this.doc.page.width - this.logoWidth - this.margins.right;

    const yOffset = (
      this.margins.top + ((this.patientInfoBox.height - this.margins.top) / 2 - (lineHeight / 2 + 1))
    );

    this.doc.image('images/tidepool-logo-408x46.png', xOffset, yOffset, { width: this.logoWidth });
  }

  renderDebugGrid() {
    const minorLineColor = '#B8B8B8';
    const numMinorLines = 5;
    let thisLineYPos = this.margins.top;
    while (thisLineYPos <= (this.bottomEdge)) {
      this.doc.moveTo(this.margins.left, thisLineYPos)
        .lineTo(this.rightEdge, thisLineYPos)
        .lineWidth(0.25)
        .stroke('red');
      if (thisLineYPos !== this.bottomEdge) {
        for (let i = 1; i < numMinorLines + 1; ++i) {
          const innerLinePos = thisLineYPos + this.dpi * (i / (numMinorLines + 1));
          this.doc.moveTo(this.margins.left, innerLinePos)
            .lineTo(this.rightEdge, innerLinePos)
            .lineWidth(0.05)
            .stroke(minorLineColor);
        }
      }
      thisLineYPos += this.dpi;
    }

    let thisLineXPos = this.margins.left;
    while (thisLineXPos <= (this.rightEdge)) {
      this.doc.moveTo(thisLineXPos, this.margins.top)
        .lineTo(thisLineXPos, this.bottomEdge)
        .lineWidth(0.25)
        .stroke('red');
      for (let i = 1; i < numMinorLines + 1; ++i) {
        const innerLinePos = thisLineXPos + this.dpi * (i / (numMinorLines + 1));
        if (innerLinePos <= this.rightEdge) {
          this.doc.moveTo(innerLinePos, this.margins.top)
            .lineTo(innerLinePos, this.bottomEdge)
            .lineWidth(0.05)
            .stroke(minorLineColor);
        }
      }
      thisLineXPos += this.dpi;
    }

    return this;
  }

  renderHeader(dateText, opts = {}) {
    if (opts.showProfile) {
      this.renderPatientInfo();
    } else {
      this.patientInfoBox.width = 0;
      this.patientInfoBox.height = 70;
      _.defaults(opts, { titleOffset: 0 });
    }

    this.renderTitle(opts);

    this.renderLogo();

    if (dateText) this.renderDateText(dateText);

    this.doc.moveDown();

    const lineHeight = this.doc.fontSize(14).currentLineHeight();
    const height = lineHeight * 0.25 + this.patientInfoBox.height;
    this.doc
      .moveTo(this.margins.left, height)
      .lineTo(this.margins.left + this.width, height)
      .stroke('black');

    // TODO: remove this; it is just for exposing/debugging the chartArea.topEdge adjustment
    if (this.debug) {
      this.doc
        .fillColor('#E8E8E8', 0.3333333333)
        .rect(this.margins.left, this.margins.top, this.width, lineHeight * 4)
        .fill();
    }

    return this;
  }

  renderFooter(opts = {}) {
    this.doc.fontSize(this.footerFontSize);

    _.defaults(opts, {
      helpText: t('Questions or feedback? Please email support@tidepool.org or visit support.tidepool.org.'),
    });

    const printDateText = `Printed on: ${formatCurrentDate()}`;
    const printDateWidth = this.doc.widthOfString(printDateText);

    const pageCountWidth = this.doc.widthOfString('Page 1 of 1');

    const xPos = this.margins.left;
    const yPos = (this.height + this.margins.top) - this.doc.currentLineHeight() * 1.5;
    const innerWidth = (this.width) - printDateWidth - pageCountWidth;

    this.doc
      .fillColor(this.colors.lightGrey)
      .fillOpacity(1)
      .text(printDateText, xPos, yPos)
      .text(opts.helpText, xPos + printDateWidth, yPos, {
        width: innerWidth,
        align: 'center',
      });

    this.setFill();

    return this;
  }

  static renderPageNumbers(doc) {
    const pageCount = doc.bufferedPageRange().count;
    let page = 0;
    while (page < pageCount) {
      page++;
      doc.switchToPage(page - 1);
      doc.fontSize(FOOTER_FONT_SIZE).fillColor('#979797').fillOpacity(1);
      doc.text(
        t('Page {{page}} of {{pageCount}}', { page, pageCount }),
        MARGINS.left,
        (HEIGHT + MARGINS.top) - doc.currentLineHeight() * 1.5,
        { align: 'right' }
      );
    }
  }

  static renderNoData(doc) {
    doc.addPage();
    doc.text('Insufficient data for patient to generate any report.');
  }

  renderSVGImage(svgDataURL = '', x, y, width, height) {
    let rawChartSVG;
    if (svgDataURL.startsWith('<svg')) {
      rawChartSVG = svgDataURL;
    } else {
      const svgDataURLArr = svgDataURL.split(',');
      rawChartSVG = decodeURIComponent(svgDataURLArr[1]);
    }
    this.addSVG(rawChartSVG, x, y, { assumePt: true, width, height });
  }

  setFooterSize() {
    this.doc.fontSize(this.footerFontSize);
    const lineHeight = this.doc.currentLineHeight();
    this.chartArea.bottomEdge = this.chartArea.bottomEdge - lineHeight * 3;

    return this;
  }

  setHeaderSize() {
    this.doc.fontSize(this.headerFontSize);
    const lineHeight = this.doc.currentLineHeight();
    this.chartArea.topEdge = this.chartArea.topEdge + lineHeight * 4;

    return this;
  }
}

export default PrintView;
