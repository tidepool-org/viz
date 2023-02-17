/* eslint-disable lodash/prefer-lodash-method */

import _ from 'lodash';
import i18next from 'i18next';
import Plotly from 'plotly.js';
import moment from 'moment/moment';

import PrintView from './PrintView';

import {
  AGP_TIR_MIN_HEIGHT,
  colors,
  fontSizes,
  text,
} from './utils/AGPConstants';

import { boldText, renderScale } from './utils/AGPUtils';
import { MS_IN_MIN } from '../../utils/constants';
import { getPatientFullName } from '../../utils/misc';
import { formatDecimalNumber } from '../../utils/format';
import { formatBirthdate, getOffset } from '../../utils/datetime';

const agpLogo = require('./images/capturAGP-logo.png');
const t = i18next.t.bind(i18next);

class AGPPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);

    // TODO: override with AGP colors
    this.colors = _.assign(this.colors, {
      axes: '#858585',
    });

    console.log('this', this);

    this.cbgData = _.get(data, 'data.current.data.cbg', []);
    this.cbgStats = _.get(data, 'data.current.stats', {});

    const reportInfoAndMetricsWidth = this.dpi * 3.375;
    const chartRenderAreaTop = this.dpi * 0.75;
    const chartRenderAreaBottom = this.bottomEdge - (this.dpi * 0.75 - this.margins.bottom);
    const sectionGap = this.dpi * 0.25;
    this.chartSectionBorderRadius = 8;

    this.sections = {};
    this.sections.timeInRanges = {
      x: this.leftEdge,
      y: chartRenderAreaTop,
      width: this.dpi * 3.875,
      height: this.dpi * 3,
      bordered: true,
      text: text.timeInRanges,
    };

    this.sections.reportInfo = {
      x: this.rightEdge - reportInfoAndMetricsWidth,
      y: chartRenderAreaTop,
      width: reportInfoAndMetricsWidth,
      height: this.dpi * 0.875,
      text: text.reportInfo,
    };

    this.sections.glucoseMetrics = {
      x: this.rightEdge - reportInfoAndMetricsWidth,
      y: this.sections.reportInfo.y + this.sections.reportInfo.height + sectionGap,
      width: reportInfoAndMetricsWidth,
      height: this.dpi * 1.875,
      bordered: true,
      text: text.glucoseMetrics,
    };

    this.sections.ambulatoryGlucoseProfile = {
      x: this.leftEdge,
      y: this.dpi * 4,
      width: this.width,
      height: this.dpi * 3.75,
      bordered: true,
      text: text.ambulatoryGlucoseProfile,
    };

    const dailyThumbnailsHeight = this.dpi * 2.25;
    this.sections.dailyThumbnails = {
      x: this.leftEdge,
      y: chartRenderAreaBottom - dailyThumbnailsHeight,
      width: this.width,
      height: dailyThumbnailsHeight,
      bordered: true,
      text: text.dailyThumbnails,
    };

    this.doc.addPage();
    this.initLayout();

    this.imageRenderScale = 10;
    this.renderScale = renderScale.bind(null, this.imageRenderScale);
  }

  // we don't call the super here, since we don't want the standard tidepool header and footer
  // super.newPage(this.getDateRange(this.endpoints.range[0], this.endpoints.range[1] - 1));
  newPage() {}

  initLayout() {
    this.setLayoutColumns({
      width: this.width,
      gutter: 15,
      type: 'percentage',
      widths: [25.5, 49, 25.5],
    });
  }

  async render() {
    this.renderHeader();
    this.renderFooter();
    // this.renderGuides();
    this.renderSectionContainers();
    this.renderReportInfo();
    await this.renderTimeInRanges();
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
  }

  renderFooter() {
    this.doc.font(this.font).fontSize(fontSizes.reportFooter);
    const xPos = this.leftEdge;
    const yPos = this.bottomEdge - this.doc.currentLineHeight() * 1.25;

    this.doc
      .fillColor(colors.text.reportFooter)
      .fillOpacity(1)
      .text(text.reportFooter, xPos, yPos);

    this.logoWidth = 70;
    const logoX = this.doc.page.width - this.logoWidth - this.margins.right;
    const logoY = this.bottomEdge - this.logoWidth * 0.175;

    this.doc.image(agpLogo, logoX, logoY, { width: this.logoWidth });
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

  renderSectionContainers() {
    const headerHeight = this.dpi * 0.25;
    this.resetText();

    _.each(this.sections, section => {
      if (section.bordered) {
        // Draw section container
        this.doc
          .roundedRect(section.x, section.y, section.width, section.height, this.chartSectionBorderRadius)
          .fill(colors.background.shaded);
        this.doc
          .rect(section.x + 1, section.y + 1 + headerHeight, section.width - 2, this.chartSectionBorderRadius)
          .fill(colors.white);
        this.doc
          .roundedRect(section.x + 1, section.y + 1 + headerHeight, section.width - 2, section.height - 2 - headerHeight, this.chartSectionBorderRadius - 1)
          .fill(colors.white);
      }

      // Add section titles, subtitles, and descriptions
      if (section.text?.title) {
        const titlePaddingX = 8;
        const titleXPos = section.x + titlePaddingX;
        const titleYPos = section.y + 1 + ((headerHeight - this.doc.currentLineHeight()) / 2);
        this.setFill(colors.text.section.title);

        this.doc.font(this.boldFont)
          .fontSize(fontSizes.section.title);

        this.doc.text(section.text.title, titleXPos, titleYPos);

        if (section.text.subtitle) {
          const subtitleXPos = titleXPos + this.doc.widthOfString(section.text.title) + (this.dpi * 0.4);

          this.setFill(colors.text.section.subtitle);

          this.doc.font(this.font)
            .fontSize(fontSizes.section.subtitle);

          this.doc.text(section.text.subtitle, subtitleXPos, section.y + 1 + ((headerHeight - this.doc.currentLineHeight()) / 2));
        }
      }

      if (section.text?.description) {
        const descriptionPaddingX = this.dpi * 0.5;
        const descriptionXPos = section.x + descriptionPaddingX;
        const descriptionYPos = section.y + headerHeight + (this.dpi * 0.2);

        this.setFill(colors.text.section.description);

        this.doc.font(this.font)
          .fontSize(fontSizes.section.description);

        this.doc.text(section.text.description, descriptionXPos, descriptionYPos);
      }
    });
  }

  renderReportInfo() {
    const section = this.sections.reportInfo;
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
    renderInfoRow(`Time CGM Active: ${formatDecimalNumber(sensorUsageAGP, 1)}%`);
  }

  async renderTimeInRanges() {
    const stat = this.stats.timeInRange;
    const statHasData = _.get(stat, 'data.total.value') > 0;
    const { timeInRanges } = this.sections;

    // Set chart plot within section borders
    this.doc.x = timeInRanges.x + 1;
    this.doc.y = timeInRanges.y + 1 + this.dpi * 0.25;
    const chartAreaWidth = timeInRanges.width - 2;
    const chartAreaHeight = timeInRanges.height - 2 - this.dpi * 0.25 - this.chartSectionBorderRadius;
    const plotMarginX = this.dpi * 0.5;
    const plotMarginTop = this.dpi * 0.425;
    const plotMarginBottom = this.dpi * 0.3;
    const paperWidth = chartAreaWidth - (plotMarginX * 2);
    const paperHeight = chartAreaHeight - (plotMarginTop + plotMarginBottom);
    const barWidth = this.dpi * 0.375;
    const barSeparatorPixelWidth = 2;

    const yScale = pixels => pixels / paperHeight;
    const xScale = pixels => pixels / paperWidth;

    if (statHasData) {
      const statDatums = _.get(stat, 'data.data', []);
      const statTotal = _.get(stat, 'data.total.value', 1);

      const chartData = _.reduce(statDatums, (res, datum, i) => {
        const value = _.toNumber(datum.value) / statTotal * 1;
        const renderedValue = _.max([value, AGP_TIR_MIN_HEIGHT / 100]);
        res.raw.push(value);
        res.rendered.push(renderedValue);
        res.ticks.push((res.ticks[i - 1] || 0) + renderedValue);
        return res;
      }, { raw: [], rendered: [], ticks: [] });

      // Needs y-scale correction since we may exceed y domain limits due to minimum bar height
      const yScaleCorrection = 1 / _.last(chartData.ticks);
      chartData.rendered = chartData.rendered.map(value => value * yScaleCorrection);
      chartData.ticks = chartData.ticks.map(value => value * yScaleCorrection);

      console.log('statDatums', statDatums);
      console.log('chartData', chartData);

      const data = _.map(statDatums, (datum, index) => ({
        x: [stat.id],
        y: [chartData.rendered[index]],
        name: datum.id,
        type: 'bar',
        width: barWidth / paperWidth * 2,
        marker: {
          color: _.toNumber(datum.value) > 6 ? colors.bgRange[datum.id] : colors.bgRange.empty,
          line: {
            color: colors.line.range.divider,
            width: this.renderScale(barSeparatorPixelWidth),
          },
        },
      }));

      const rangeAnnotationStyles = {
        align: 'left',
        arrowside: 'none',
        font: {
          color: colors.black,
          size: this.renderScale(fontSizes.timeInRanges.values),
          family: 'Arial',
        },
        showarrow: false,
        x: 0,
        xanchor: 'left',
        xshift: this.renderScale(35),
        y: 1,
      };

      const bgTicks = _.map([
        this.bgBounds.veryLowThreshold,
        this.bgBounds.targetLowerBound,
        this.bgBounds.targetUpperBound,
        this.bgBounds.veryHighThreshold,
        this.bgUnits,
      ], (bound, index) => ({
        align: 'right',
        arrowside: 'none',
        font: {
          color: colors.black,
          size: this.renderScale(fontSizes.timeInRanges.ticks),
          family: 'Arial',
        },
        showarrow: false,
        text: boldText(bound),
        x: 0,
        xanchor: 'right',
        xshift: this.renderScale(-4),
        y: index === 4 // bgUnits label
          ? chartData.ticks[1] + ((chartData.ticks[2] - chartData.ticks[1]) / 2)
          : chartData.ticks[index],
        yanchor: 'middle',
      }));

      /* eslint-disable no-param-reassign */
      const getBracketPosValues = (posX, posX2, posY, posY2) => {
        const minBracketYOffSet = yScale(10);

        if (_.isNumber(posY2)) {
          const maxSubBracketYOffset = yScale(24);
          if (posY - posY2 < minBracketYOffSet) posY2 = posY - minBracketYOffSet;
          const subBracketXOffset = (posX2 - posX) / 2;
          const subBracketYOffset = _.min([(posY - posY2) / 2, maxSubBracketYOffset]);

          return {
            posX,
            posX2,
            posY,
            posY2,
            subBracketXOffset,
            subBracketYOffset,
          };
        }

        // Only a single Ypos is passed for the target bracket
        // We need to ensure it's not too close to the range enxtents to avoid potential crowding
        const targetBracketAllowedYRange = [
          yScale(AGP_TIR_MIN_HEIGHT) * 3 + yScale(barSeparatorPixelWidth * 5),
          1 - (yScale(AGP_TIR_MIN_HEIGHT) * 3 + yScale(barSeparatorPixelWidth * 5)),
        ];

        if (posY < targetBracketAllowedYRange[0]) posY = targetBracketAllowedYRange[0];
        if (posY > targetBracketAllowedYRange[1]) posY = targetBracketAllowedYRange[1];

        return { posX, posX2, posY };
      };
      /* eslint-enable no-param-reassign */

      const createBracketSVG = (pos) => {
        const {
          posX,
          posX2,
          posY,
          posY2,
          subBracketXOffset,
          subBracketYOffset,
        } = pos;

        if (_.isNumber(posY2)) {
          const radiusX = xScale(5);
          const radiusY = yScale(5);

          return [
            `M ${posX} ${posY}`,
            `H ${posX + subBracketXOffset - radiusX}`,
            `Q ${posX + subBracketXOffset} ${posY} ${posX + subBracketXOffset} ${posY - radiusY}`,
            `V ${posY2 + radiusY}`,
            `Q ${posX + subBracketXOffset} ${posY2} ${posX + subBracketXOffset - radiusX} ${posY2}`,
            `H ${posX}`,
            `M ${posX + subBracketXOffset} ${posY2 + subBracketYOffset}`,
            `H ${posX2}`,
          ].join(' ');
        }

        return [
          `M ${posX} ${posY}`,
          `H ${posX2}`,
        ].join(' ');
      };

      const bracketYPos = [
        // Low Brackets
        chartData.ticks[0],
        yScale(-12),

        // Target Bracket
        chartData.ticks[1] + ((chartData.ticks[2] - chartData.ticks[1]) / 2),

        // High Brackets
        chartData.ticks[4],
        chartData.ticks[2] + ((chartData.ticks[3] - chartData.ticks[2]) / 2),
      ];

      const bracketXExtents = [xScale(barWidth + 8), xScale(paperWidth - (barWidth + 8))];

      const bracketPos = {
        low: getBracketPosValues(...bracketXExtents, ...bracketYPos.slice(0, 2)),
        target: getBracketPosValues(...bracketXExtents, bracketYPos[2]),
        high: getBracketPosValues(...bracketXExtents, ...bracketYPos.slice(3)),
      };

      const brackets = _.map(_.values(bracketPos), pos => ({
        type: 'path',
        path: createBracketSVG(pos),
        line: { color: colors.line.default, width: this.renderScale(0.5) },
        yref: 'paper',
      }));

      const createLeaderSVG = (posX, posX2, posY, posY2) => {
        const isLowLeader = posY > posY2;
        const radiusX = xScale(5);
        const radiusY = isLowLeader ? yScale(-5) : yScale(5);

        return [
          `M ${posX} ${posY}`,
          `V ${posY2 - radiusY}`,
          `Q ${posX} ${posY2} ${posX + radiusX} ${posY2}`,
          `H ${posX2}`,
        ].join(' ');
      };

      const leaderYPos = [
        // Very Low Leader
        0,
        bracketPos.low.posY2 + yScale(6),

        // Very High Leader
        1,
        bracketPos.high.posY + yScale(6),
      ];

      const leaderXExtents = [xScale(barWidth / 2), xScale(barWidth + 4)];

      const leaderPos = {
        veryLow: [...leaderXExtents, ...leaderYPos.slice(0, 2)],
        veryHigh: [...leaderXExtents, ...leaderYPos.slice(2)],
      };

      const leaders = _.map(_.values(leaderPos), pos => ({
        type: 'path',
        path: createLeaderSVG(...pos),
        line: { color: colors.black, width: this.renderScale(0.5) },
        yref: 'paper',
      }));

      const layout = {
        barmode: 'stack',
        width: this.renderScale(chartAreaWidth),
        height: this.renderScale(chartAreaHeight),
        margin: {
          l: this.renderScale(plotMarginX),
          r: this.renderScale(plotMarginX),
          b: this.renderScale(plotMarginBottom),
          t: this.renderScale(plotMarginTop),
        },

        font: {
          color: colors.black,
          family: 'Arial',
          size: this.renderScale(7),
        },

        showlegend: false,

        xaxis: {
          range: [0, 1],
          showgrid: false,
          showline: false,
          showticklabels: false,
          zeroline: false,
        },

        yaxis: {
          range: [0, 1],
          showgrid: false,
          showline: false,
          showticklabels: false,
          zeroline: false,
        },

        annotations: [
          ...bgTicks,
          // {
          //   ...rangeAnnotationStyles,
          //   text: boldText(text.bgRanges.veryHigh),
          // },
          // {
          //   ...rangeAnnotationStyles,
          //   text: text.bgRanges.high,
          // },
          // {
          //   ...rangeAnnotationStyles,
          //   text: text.bgRanges.target,
          // },
          // {
          //   ...rangeAnnotationStyles,
          //   text: text.bgRanges.low,
          // },
          // {
          //   ...rangeAnnotationStyles,
          //   text: text.bgRanges.veryLow,
          // },
        ],

        shapes: [
          ...brackets,
          ...leaders,
        ],

        // TBD:
        // template: {
        //   // defaults to apply to a plot, such as colors, fonts, line widths, etc
        //   // https://plotly.com/javascript/reference/layout/#layout-template
        // },

        // meta: {
        //   // custom text variables - may come in useful for built-in data text (not necessary for annotations)
        //   // https://plotly.com/javascript/reference/layout/#layout-meta
        // },
      };

      const plotDataURL = await Plotly.toImage({ data, layout });
      this.doc.image(plotDataURL, undefined, undefined, { width: chartAreaWidth, height: chartAreaHeight });
    }
  }
}

export default AGPPrintView;
