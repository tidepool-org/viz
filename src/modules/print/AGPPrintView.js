/* eslint-disable lodash/prefer-lodash-method */

import _ from 'lodash';
import i18next from 'i18next';
import Plotly from 'plotly.js';
import moment from 'moment/moment';

import PrintView from './PrintView';

import {
  AGP_FOOTER_Y_PADDING,
  AGP_SECTION_BORDER_RADIUS,
  AGP_SECTION_HEADER_HEIGHT,
  colors,
  fontSizes,
  text,
} from './utils/AGPConstants';

import {
  generateChartSections,
  generateTimeInRangesFigure,
  generateAmbulatoryGlucoseProfileFigure,
  generateDailyGlucoseProfilesFigure,
} from './utils/AGPUtils';

import { MGDL_UNITS, MS_IN_MIN } from '../../utils/constants';
import { getPatientFullName } from '../../utils/misc';
import { bankersRound } from '../../utils/format';
import { formatBirthdate, getOffset } from '../../utils/datetime';
import { formatDatum } from '../../utils/stat';

const agpLogo = require('./images/capturAGP-logo.png');
const t = i18next.t.bind(i18next);

class AGPPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);
    this.sections = generateChartSections();
    this.doc.addPage();
    this.initLayout();
  }

  newPage() {
    super.newPage();
  }

  initLayout() {
    this.setLayoutColumns({
      width: this.width,
      gutter: 15,
      type: 'percentage',
      widths: [25.5, 49, 25.5],
    });
  }

  async render() {
    // this.renderGuides();
    this.renderReportInfo();
    this.renderGlucoseMetrics();
    await this.renderTimeInRanges();
    await this.renderAmbulatoryGlucoseProfile();
    await this.renderDailyGlucoseProfiles();
  }

  renderHeader() {
    this.doc.font(this.boldFont).fontSize(fontSizes.reportHeader);
    const xPos = this.leftEdge;
    const yPos = this.topEdge;

    this.doc
      .fillColor(colors.text.reportHeader)
      .fillOpacity(1)
      .text(`${text.reportHeader} `, xPos, yPos, { continued: true })
      .font(this.font)
      .text(text.reportSubHeader);

    return this;
  }

  renderFooter() {
    this.doc.font(this.font).fontSize(fontSizes.reportFooter);
    const xPos = this.leftEdge;
    const yPos = this.bottomEdge - this.doc.currentLineHeight() * 1.25 - AGP_FOOTER_Y_PADDING;

    this.doc
      .fillColor(colors.text.reportFooter)
      .fillOpacity(1)
      .text(text.reportFooter, xPos, yPos);

    this.logoWidth = 70;
    const logoX = this.doc.page.width - this.logoWidth - this.margins.right;
    const logoY = this.bottomEdge - this.logoWidth * 0.175 - AGP_FOOTER_Y_PADDING;

    this.doc.image(agpLogo, logoX, logoY, { width: this.logoWidth });
    super.renderFooter();

    return this;
  }

  renderGuides() {
    // page margins
    this.doc.lineWidth(1)
      .dash(3, { space: 4 })
      .rect(this.margins.left, this.margins.top, this.width, this.height)
      .stroke('#EEEEEE');

    _.each(_.values(this.sections), section => {
      this.doc.lineWidth(1)
        .rect(section.x, section.y, section.width, section.height)
        .stroke('#EEEEEE');
    });

    this.doc.undash();
  }

  renderSectionContainer(section) {
    this.resetText();

    if (section.bordered) {
      // Draw section container
      this.doc
        .roundedRect(section.x, section.y, section.width, section.height, AGP_SECTION_BORDER_RADIUS)
        .fill(colors.background.shaded);
      this.doc
        .rect(section.x + 1, section.y + 1 + AGP_SECTION_HEADER_HEIGHT, section.width - 2, AGP_SECTION_BORDER_RADIUS)
        .fill(colors.white);
      this.doc
        .roundedRect(section.x + 1, section.y + 1 + AGP_SECTION_HEADER_HEIGHT, section.width - 2, section.height - 2 - AGP_SECTION_HEADER_HEIGHT, AGP_SECTION_BORDER_RADIUS - 1)
        .fill(colors.white);
    }

    // Add section titles, subtitles, and descriptions
    if (section.text?.title) {
      const titlePaddingX = 8;
      const titleXPos = section.x + titlePaddingX;
      const titleYPos = section.y + 1 + ((AGP_SECTION_HEADER_HEIGHT - this.doc.currentLineHeight()) / 2);
      this.setFill(colors.text.section.title);

      this.doc.font(this.boldFont)
        .fontSize(fontSizes.section.title);

      this.doc.text(section.text.title, titleXPos, titleYPos);

      if (section.text?.subtitle) {
        const subtitleXPos = titleXPos + this.doc.widthOfString(section.text.title) + (this.dpi * 0.4);

        this.setFill(colors.text.section.subtitle);

        this.doc.font(this.font)
          .fontSize(fontSizes.section.subtitle);

        this.doc.text(section.text.subtitle, subtitleXPos, section.y + 1 + ((AGP_SECTION_HEADER_HEIGHT - this.doc.currentLineHeight()) / 2));
      }
    }
  }

  renderReportInfo() {
    const section = this.sections.reportInfo;
    this.renderSectionContainer(section);

    const patientName = _.truncate(getPatientFullName(this.patient), { length: 32 });
    const patientBirthdate = formatBirthdate(this.patient);
    const { cgmDaysWorn = 0, oldestDatum, newestDatum, sensorUsageAGP } = this.stats.sensorUsage?.data?.raw || {};

    let cgmDaysWornText = cgmDaysWorn === 1
      ? t('{{cgmDaysWorn}} Day', { cgmDaysWorn })
      : t('{{cgmDaysWorn}} Days', { cgmDaysWorn });

    if (cgmDaysWorn >= 1) {
      cgmDaysWornText += `: ${cgmDaysWorn === 1
        ? moment.utc(newestDatum?.time - getOffset(newestDatum?.time, this.timezone) * MS_IN_MIN).format('MMMM D, YYYY')
        : this.getDateRange(oldestDatum?.time, newestDatum?.time, undefined, '', 'MMMM')
      }`;
    }

    const renderInfoRow = (mainText, subTextLabel, subText) => {
      const x = this.doc.x;
      const y = this.doc.y;
      let subTextWidth = 0;

      if (subText) {
        this.doc
          .font(this.boldFont)
          .fontSize(fontSizes.reportInfo.default);

        subTextWidth = this.doc.widthOfString(subText);

        this.doc.text(subText, x, y, {
          align: 'right',
          width: section.width,
        });

        if (subTextLabel) {
          this.doc
            .font(this.font)
            .fontSize(fontSizes.reportInfo.label);

          this.doc.text(subTextLabel, x, y + 1, {
            align: 'right',
            width: section.width - subTextWidth - this.dpi * 0.025,
          });
        }
      }

      this.doc
        .font(this.boldFont)
        .fontSize(fontSizes.reportInfo.default)
        .text(mainText, x, y);

      const lineYPos = y + this.doc.currentLineHeight() + this.dpi * 0.025;

      this.doc
        .moveTo(section.x, lineYPos)
        .lineWidth(0.25)
        .lineTo(section.x + section.width, lineYPos)
        .strokeColor(colors.line.default)
        .stroke();

      this.doc.x = x;
    };

    this.doc.x = section.x;
    this.doc.y = section.y + this.dpi * 0.05;
    renderInfoRow(patientName, text.reportInfo.dob, patientBirthdate);
    this.doc.moveDown(1);
    renderInfoRow(cgmDaysWornText);
    this.doc.moveDown(1);
    renderInfoRow(t('Time CGM Active: {{activeTime}}%', {
      activeTime: bankersRound(sensorUsageAGP, 1),
    }));
  }

  renderGlucoseMetrics() {
    const section = this.sections.glucoseMetrics;
    this.renderSectionContainer(section);

    const paddingX = this.dpi * 0.2;
    const xExtents = [section.x + paddingX, section.x + section.width - paddingX];

    const glucoseStats = [
      this.stats.averageGlucose,
      this.stats.glucoseManagementIndicator,
      this.stats.coefficientOfVariation,
    ];

    this.doc.x = section.x;
    this.doc.y = section.y + this.dpi * 0.375;

    _.each(glucoseStats, (stat, index) => {
      const paddingY = 8;
      const statWidth = xExtents[1] - xExtents[0];
      const y = this.doc.y;
      const isAverageGlucose = stat.id === 'averageGlucose';
      const isShaded = index % 2 !== 0;

      const { value, suffix } = formatDatum(
        _.get(stat.data, _.get(stat.data, 'dataPaths.summary')),
        _.get(stat, 'dataFormat.summary'),
        { bgPrefs: this.bgPrefs, data: stat.data, useAGPFormat: true }
      );

      const units = suffix || this.bgUnits;

      this.doc
        .font(this.boldFont)
        .fontSize(fontSizes.glucoseMetrics.labels)
        .lineGap(-1.5);

      if (isShaded) {
        this.doc
          .rect(section.x, y - paddingY, section.width, this.doc.currentLineHeight() * 2.25 + paddingY * 2)
          .fill(colors.background.shaded);
      }

      this.setFill();

      this.doc
        .text(text.glucoseMetrics[stat.id].label, xExtents[0], y);

      const valueYShift = (fontSizes.glucoseMetrics.values - fontSizes.glucoseMetrics.labels) / 2;
      const unitsFontSize = isAverageGlucose ? fontSizes.glucoseMetrics.bgUnits : fontSizes.glucoseMetrics.values;
      const unitsYShift = isAverageGlucose ? valueYShift - 2.15 : valueYShift;

      this.doc
        .fontSize(unitsFontSize)
        .text(`${units}`, xExtents[0], y - unitsYShift, { align: 'right', width: statWidth });

      const valueXShift = this.doc.widthOfString(units) + 1;

      this.doc
        .fontSize(fontSizes.glucoseMetrics.values)
        .text(`${value}`, xExtents[0], y - valueYShift, { align: 'right', width: statWidth - valueXShift });

      this.doc
        .font(this.font)
        .fontSize(fontSizes.glucoseMetrics.subLabels);

      const bgUnitsKey = this.bgUnits === MGDL_UNITS ? 'mgdl' : 'mmoll';
      const goal = isAverageGlucose
        ? text.glucoseMetrics[stat.id].goal[bgUnitsKey]
        : text.glucoseMetrics[stat.id].goal;

      this.setFill(colors.text.goals.glucoseMetrics);

      this.doc
        .lineGap(1.3)
        .text(goal);

      this.doc
        .fontSize(fontSizes.glucoseMetrics.subLabels);

      if (text.glucoseMetrics[stat.id].subLabel) this.doc.text(text.glucoseMetrics[stat.id].subLabel);
      this.doc.moveDown(1.25);
    });

    this.resetText();
  }

  async renderTimeInRanges() {
    const section = this.sections.timeInRanges;
    this.renderSectionContainer(section);

    // Set chart plot within section borders
    const chartAreaX = section.x + 1;
    const chartAreaY = section.y + 1 + this.dpi * 0.25;
    const chartAreaWidth = section.width - 2;
    const chartAreaHeight = section.height - 2 - this.dpi * 0.25 - AGP_SECTION_BORDER_RADIUS;

    // Generate image from Plotly figure
    const figure = generateTimeInRangesFigure(section, this.stats.timeInRange, this.bgPrefs);
    const plotDataURL = await Plotly.toImage(figure, { format: 'svg', width: chartAreaWidth, height: chartAreaHeight });
    const plotDataURLArr = plotDataURL.split(',');
    const rawChartSVG = decodeURIComponent(plotDataURLArr[1]);
    this.addSVG(rawChartSVG, chartAreaX, chartAreaY, { assumePt: true });
  }

  async renderAmbulatoryGlucoseProfile() {
    const section = this.sections.ambulatoryGlucoseProfile;
    this.renderSectionContainer(section);

    // Set chart plot within section borders
    const chartAreaX = section.x + 1;
    const chartAreaY = section.y + 1 + this.dpi * 0.25;
    const chartAreaWidth = section.width - 2;
    const chartAreaHeight = section.height - 2 - this.dpi * 0.25 - AGP_SECTION_BORDER_RADIUS;

    // Generate image from Plotly figure
    const figure = generateAmbulatoryGlucoseProfileFigure(section, this.data, this.bgPrefs);
    const plotDataURL = await Plotly.toImage(figure, { format: 'svg', width: chartAreaWidth, height: chartAreaHeight });
    const plotDataURLArr = plotDataURL.split(',');
    const rawChartSVG = decodeURIComponent(plotDataURLArr[1]);
    this.addSVG(rawChartSVG, chartAreaX, chartAreaY, { assumePt: true });
  }

  async renderDailyGlucoseProfiles() {
    const section = this.sections.dailyGlucoseProfiles;
    this.renderSectionContainer(section);

    // Set chart plot within section borders
    const chartAreaX = section.x + 1;
    const chartAreaY = section.y + 1 + this.dpi * 0.25;
    const chartAreaWidth = section.width - 2;
    const chartAreaHeight = section.height - 2 - this.dpi * 0.25 - AGP_SECTION_BORDER_RADIUS;

    // Generate image from Plotly figure
    const figure = generateDailyGlucoseProfilesFigure(section, this.data, this.bgPrefs);
    const plotDataURL = await Plotly.toImage(figure, { format: 'svg', width: chartAreaWidth, height: chartAreaHeight });
    const plotDataURLArr = plotDataURL.split(',');
    const rawChartSVG = decodeURIComponent(plotDataURLArr[1]);
    this.addSVG(rawChartSVG, chartAreaX, chartAreaY, { assumePt: true });
  }
}

export default AGPPrintView;
