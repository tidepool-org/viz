import _ from 'lodash';

import {
  AGP_BG_CLAMP_MGDL,
  AGP_BG_CLAMP_MMOLL,
  AGP_FONT_FAMILY,
  AGP_FOOTER_Y_PADDING,
  AGP_LOWER_QUANTILE,
  AGP_SECTION_BORDER_RADIUS,
  AGP_SECTION_HEADER_HEIGHT,
  AGP_TIR_MIN_HEIGHT,
  AGP_UPPER_QUANTILE,
  colors,
  fontSizes,
  text,
} from './AGPConstants';

import { DPI, MARGINS, WIDTH, HEIGHT } from './constants';
import { formatBgValue, formatPercentage } from '../../../utils/format';
import { ONE_HR } from '../../../utils/datetime';
import { mungeBGDataBins } from '../../../utils/bloodglucose';
import { MGDL_UNITS, MS_IN_DAY, MS_IN_HOUR } from '../../../utils/constants';
import moment from 'moment';

const boldText = textString => `<b>${String(textString)}</b>`;
const chartScaleToPixels = (paperPixelDimension, scaleValue) => scaleValue * paperPixelDimension;
const pixelsToChartScale = (paperPixelDimension, pixels) => pixels / paperPixelDimension;
const pointsToPixels = points => points * 0.75;

const createAnnotation = options => {
  const annotation = _.defaultsDeep(options, {
    arrowside: 'none',
    font: {
      color: colors.black,
      family: AGP_FONT_FAMILY,
    },
    showarrow: false,
  });

  return annotation;
};

export const generateChartSections = () => {
  const reportInfoAndMetricsWidth = DPI * 3.375;
  const chartRenderAreaTop = DPI * 0.75;
  const rightEdge = MARGINS.left + WIDTH;
  const bottomEdge = MARGINS.top + HEIGHT;
  const chartRenderAreaBottom = bottomEdge - (DPI * 0.75 - MARGINS.bottom);
  const sectionGap = DPI * 0.25;
  const sections = {};

  sections.timeInRanges = {
    x: MARGINS.left,
    y: chartRenderAreaTop,
    width: DPI * 3.875,
    height: DPI * 3,
    bordered: true,
    text: text.timeInRanges,
  };

  sections.reportInfo = {
    x: rightEdge - reportInfoAndMetricsWidth,
    y: chartRenderAreaTop,
    width: reportInfoAndMetricsWidth,
    height: DPI * 0.875,
    text: text.reportInfo,
  };

  sections.glucoseMetrics = {
    x: rightEdge - reportInfoAndMetricsWidth,
    y: sections.reportInfo.y + sections.reportInfo.height + sectionGap,
    width: reportInfoAndMetricsWidth,
    height: DPI * 1.875,
    bordered: true,
    text: text.glucoseMetrics,
  };

  sections.ambulatoryGlucoseProfile = {
    x: MARGINS.left,
    y: DPI * 4,
    width: WIDTH,
    height: DPI * 3.5,
    bordered: true,
    text: text.ambulatoryGlucoseProfile,
  };

  const dailyGlucoseProfilesHeight = DPI * 2.25;
  sections.dailyGlucoseProfiles = {
    x: MARGINS.left,
    y: chartRenderAreaBottom - dailyGlucoseProfilesHeight - AGP_FOOTER_Y_PADDING,
    width: WIDTH,
    height: dailyGlucoseProfilesHeight,
    bordered: true,
    text: text.dailyGlucoseProfiles,
  };

  return sections;
};

/**
 * Generates the Plotly figure for the AGP Time In Ranges chart
 * @param {*} section
 * @param {*} stat
 * @param {*} bgPrefs
 * @returns
 */
export const generateTimeInRangesFigure = (section, stat, bgPrefs) => {
  // Set chart plot within section borders
  const chartAreaWidth = section.width - 2;
  const chartAreaHeight = section.height - 2 - DPI * 0.25 - AGP_SECTION_BORDER_RADIUS;
  const plotMarginX = DPI * 0.5;
  const plotMarginTop = DPI * 0.425;
  const plotMarginBottom = DPI * 0.3;
  const paperWidth = chartAreaWidth - (plotMarginX * 2);
  const paperHeight = chartAreaHeight - (plotMarginTop + plotMarginBottom);
  const barWidth = DPI * 0.35;
  const barSeparatorPixelWidth = 2;
  const yScale = pixelsToChartScale.bind(null, paperHeight);
  const xScale = pixelsToChartScale.bind(null, paperWidth);

  const statTotal = _.get(stat, 'data.raw.counts.total', 0);
  if (statTotal > 0) {
    const rawCounts = _.get(stat, 'data.raw.counts', {});

    const statDatums = [
      { id: 'veryLow', value: rawCounts.veryLow },
      { id: 'low', value: rawCounts.low },
      { id: 'target', value: rawCounts.target },
      { id: 'high', value: rawCounts.high },
      { id: 'veryHigh', value: rawCounts.veryHigh },
    ];

    const chartData = _.reduce(statDatums, (res, datum, i) => {
      const value = _.toNumber(datum.value) / statTotal * 1;
      const renderedValue = _.max([value, AGP_TIR_MIN_HEIGHT / 100]);
      res.rawById[datum.id] = value;
      res.raw.push(value);
      res.rendered.push(renderedValue);
      res.ticks.push((res.ticks[i - 1] || 0) + renderedValue);
      return res;
    }, { rawById: {}, raw: [], rendered: [], ticks: [] });

    // Needs y-scale correction since we may exceed y domain limits due to minimum bar height
    const yScaleCorrection = 1 / _.last(chartData.ticks);
    chartData.rendered = _.map(chartData.rendered, value => value * yScaleCorrection);
    chartData.ticks = _.map(chartData.ticks, value => value * yScaleCorrection);

    const data = _.map(statDatums, (datum, index) => ({
      x: [stat.id],
      y: [chartData.rendered[index]],
      name: datum.id,
      type: 'bar',
      width: barWidth / paperWidth * 2,
      marker: {
        color: _.toNumber(datum.value) > 0 ? colors.bgRange[datum.id] : colors.bgRange.empty,
        line: {
          color: colors.line.range.divider,
          width: barSeparatorPixelWidth,
        },
      },
    }));

    const bgTicks = _.map([
      bgPrefs?.bgBounds?.veryLowThreshold,
      bgPrefs?.bgBounds?.targetLowerBound,
      bgPrefs?.bgBounds?.targetUpperBound,
      bgPrefs?.bgBounds?.veryHighThreshold,
      bgPrefs?.bgUnits,
    ], (tick, index) => createAnnotation({
      align: 'right',
      font: {
        size: fontSizes.timeInRanges.ticks,
      },
      text: index === 4 // bgUnits label
        ? boldText(tick)
        : boldText(formatBgValue(tick, bgPrefs, undefined, true)),
      x: 0,
      xanchor: 'right',
      xshift: -2,
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

    const bracketXExtents = [xScale(barWidth + 5), xScale(paperWidth - barWidth)];

    const bracketPos = {
      low: getBracketPosValues(...bracketXExtents, ...bracketYPos.slice(0, 2)),
      target: getBracketPosValues(...bracketXExtents, bracketYPos[2]),
      high: getBracketPosValues(...bracketXExtents, ...bracketYPos.slice(3)),
    };

    const brackets = _.map(_.values(bracketPos), pos => ({
      type: 'path',
      path: createBracketSVG(pos),
      line: { color: colors.line.default, width: 0.5 },
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

    const leaderXExtents = [xScale(barWidth / 2), xScale(barWidth + 2)];

    const leaderPos = {
      veryLow: [...leaderXExtents, ...leaderYPos.slice(0, 2)],
      veryHigh: [...leaderXExtents, ...leaderYPos.slice(2)],
    };

    const leaders = _.map(_.values(leaderPos), pos => ({
      type: 'path',
      path: createLeaderSVG(...pos),
      line: { color: colors.black, width: 0.5 },
      yref: 'paper',
    }));

    const rangePosY = {
      veryLow: bracketPos.low.posY2,
      low: bracketPos.low.posY,
      target: bracketPos.target.posY,
      high: bracketPos.high.posY2,
      veryHigh: bracketPos.high.posY,
    };

    const rangePosYOrderedKeys = [
      'veryLow',
      'low',
      'target',
      'high',
      'veryHigh',
    ];

    const rangeLabels = _.map(rangePosYOrderedKeys, range => createAnnotation({
      align: 'left',
      font: {
        size: fontSizes.timeInRanges.values,
      },
      text: boldText(text.bgRanges[range]),
      x: bracketXExtents[0],
      xanchor: 'left',
      xshift: -1,
      y: rangePosY[range],
      yanchor: 'bottom',
      yref: 'paper',
    }));

    const rangeValuesOrderedKeys = [
      'veryLow',
      'low',
      'high',
      'veryHigh',
    ];

    const rangeValues = _.map(rangeValuesOrderedKeys, range => createAnnotation({
      align: 'right',
      font: {
        size: fontSizes.timeInRanges.values,
      },
      text: boldText(formatPercentage(chartData.rawById[range], 0, true)),
      x: bracketXExtents[0] + (bracketXExtents[1] - bracketXExtents[0]) / 2,
      xanchor: 'right',
      xshift: -4,
      y: rangePosY[range],
      yanchor: 'bottom',
      yref: 'paper',
    }));

    const rangeSummaryPosY = {
      low: bracketPos.low.posY2 + bracketPos.low.subBracketYOffset,
      target: bracketPos.target.posY,
      high: bracketPos.high.posY2 + bracketPos.high.subBracketYOffset,
    };

    const combinedRangeSummaryValues = {
      low: chartData.rawById.veryLow + chartData.rawById.low,
      target: chartData.rawById.target,
      high: chartData.rawById.veryHigh + chartData.rawById.high,
    };

    const rangeSummaryOrderedKeys = [
      'low',
      'target',
      'high',
    ];

    const rangeSummaryValues = _.map(rangeSummaryOrderedKeys, range => createAnnotation({
      align: 'left',
      font: {
        size: fontSizes.timeInRanges.summaries,
      },
      text: boldText(formatPercentage(combinedRangeSummaryValues[range], 0, true)),
      x: bracketXExtents[0] + (bracketXExtents[1] - bracketXExtents[0]) / 2,
      xanchor: 'left',
      xshift: 3,
      y: rangeSummaryPosY[range],
      yanchor: 'bottom',
      yref: 'paper',
      yshift: -1,
    }));

    const goalsPos = {
      veryLow: {
        x: bracketXExtents[0],
        xanchor: 'left',
        xshift: -1,
        y: bracketPos.low.posY2,
        yshift: -12,
      },
      lowCombined: {
        x: bracketXExtents[1],
        xanchor: 'right',
        xshift: 1,
        y: bracketPos.low.posY2 + bracketPos.low.subBracketYOffset,
        yshift: 1,
      },
      target: {
        x: bracketXExtents[1],
        xanchor: 'right',
        xshift: 1,
        y: bracketPos.target.posY,
        yshift: 1,
      },
      highCombined: {
        x: bracketXExtents[1],
        xanchor: 'right',
        xshift: 1,
        y: bracketPos.high.posY2 + bracketPos.high.subBracketYOffset,
        yshift: 1,
      },
      veryHigh: {
        x: bracketXExtents[0],
        xanchor: 'left',
        xshift: -1,
        y: bracketPos.high.posY,
        yshift: 11,
      },
    };

    const goalsOrderedKeys = [
      'veryLow',
      'lowCombined',
      'target',
      'highCombined',
      'veryHigh',
    ];

    const goals = _.map(goalsOrderedKeys, range => createAnnotation({
      align: 'left',
      font: {
        color: colors.text.goals[range],
        size: fontSizes.timeInRanges.goals,
      },
      text: text.goals[range],
      yanchor: 'bottom',
      yref: 'paper',
      ...goalsPos[range],
    }));

    const subLabelsPos = {
      TIRtarget: {
        x: bracketXExtents[0] + (bracketXExtents[1] - bracketXExtents[0]) / 2,
        xanchor: 'left',
        xshift: -20,
        y: bracketPos.target.posY,
        yshift: -12,
      },
      TIRminutes: {
        x: xScale(paperWidth),
        xanchor: 'right',
        xref: 'paper',
        xshift: plotMarginX - 7,
        y: bracketPos.low.posY2,
        yshift: -12,
      },
    };

    const subLabelsOrderedKeys = [
      'TIRtarget',
      'TIRminutes',
    ];

    const subLabels = _.map(subLabelsOrderedKeys, label => createAnnotation({
      align: 'left',
      font: {
        color: colors.text.subLabels[label],
        size: fontSizes.timeInRanges.subLabels,
      },
      text: text.subLabels[label],
      yanchor: 'bottom',
      yref: 'paper',
      ...subLabelsPos[label],
    }));

    const rangeAnnotations = {
      veryLow: [
        rangeLabels[0],
        rangeValues[0],
        goals[0],
      ],
      low: [
        rangeLabels[1],
        rangeValues[1],
      ],
      lowSummary: [
        rangeSummaryValues[0],
        goals[1],
      ],
      target: [
        rangeLabels[2],
        rangeSummaryValues[1],
        goals[2],
        subLabels[0],
      ],
      high: [
        rangeLabels[3],
        rangeValues[2],
      ],
      veryHigh: [
        rangeLabels[4],
        rangeValues[3],
        goals[4],
      ],
      highSummary: [
        rangeSummaryValues[2],
        goals[3],
      ],
    };

    const layout = {
      barmode: 'stack',
      width: chartAreaWidth,
      height: chartAreaHeight,
      showlegend: false,

      margin: {
        l: plotMarginX,
        r: plotMarginX,
        b: plotMarginBottom,
        t: plotMarginTop,
      },

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
        ...rangeAnnotations.veryHigh,
        ...rangeAnnotations.high,
        ...rangeAnnotations.highSummary,
        ...rangeAnnotations.target,
        ...rangeAnnotations.low,
        ...rangeAnnotations.veryLow,
        ...rangeAnnotations.lowSummary,
        subLabels[1],
      ],

      shapes: [
        ...brackets,
        ...leaders,
      ],
    };

    const figure = { data, layout };
    return figure;
  }

  return null; // TODO: insufficient data text
};

export const generateAmbulatoryGlucoseProfileFigure = (section, cbgData, bgPrefs) => {
  // Set chart plot within section borders
  const chartAreaWidth = section.width - 2;
  const chartAreaHeight = section.height - 2 - DPI * 0.5 - AGP_SECTION_BORDER_RADIUS;
  const plotMarginX = DPI * 0.5;
  const plotMarginY = DPI * 0.25;
  const paperWidth = chartAreaWidth - (plotMarginX * 2);
  const paperHeight = chartAreaHeight - (plotMarginY * 2);

  if (cbgData.length > 0) { // TODO: proper data sufficiency check
    const yClamp = bgPrefs?.bgUnits === MGDL_UNITS ? AGP_BG_CLAMP_MGDL : AGP_BG_CLAMP_MMOLL;
    const chartData = mungeBGDataBins('cbg', ONE_HR, cbgData, [AGP_LOWER_QUANTILE, AGP_UPPER_QUANTILE]);

    // Smooth all bin quantiles according to AGP spec
    const quantileKeys = [
      'lowerQuantile',
      'firstQuartile',
      'median',
      'thirdQuartile',
      'upperQuantile',
    ];

    const firstDatum = chartData[0];
    const lastDatum = chartData[chartData.length - 1];

    const smoothDatum = (prev, curr, next) => {
      // return with current value if current bin, or both adjacent bins, are empty
      if ((!prev && !next) || !curr) {
        return curr;
      } else if (!prev || !next) {
        // Weight at 0-4-1 or 1-4-0 respectively if one of the adjacent bins is empty
        return _.sum([prev || 0, curr * 4, next || 0]) / 5;
      }
      // Weight at 1-4-1
      return _.sum([prev, curr * 4, next]) / 6;
    };

    const smoothedChartData = _.map(chartData, (datum, index) => ({
      ...datum,
      ..._.reduce(quantileKeys, (result, key) => {
        result[key] = smoothDatum( // eslint-disable-line no-param-reassign
          chartData[index - 1]?.[key] || lastDatum[key],
          datum[key],
          chartData[index + 1]?.[key] || firstDatum[key]
        );
        return result;
      }, {}),
    }));

    // Prepend/append extent datums to opposite ends to allow fully cyclic traces across the entire
    // X axis. Otherwise, the first and last 1/2 hours will not be rendered.
    const firstSmoothedDatum = smoothedChartData[0];
    const lastSmoothedDatum = smoothedChartData[smoothedChartData.length - 1];
    smoothedChartData.unshift({ ...lastSmoothedDatum, msX: firstSmoothedDatum.msX - ONE_HR });
    smoothedChartData.push({ ...firstSmoothedDatum, msX: lastSmoothedDatum.msX + ONE_HR });

    const quantileBand = (upperKey, lowerKey, key, bgRange, index) => ({
      name: key,
      type: 'scatter',
      x: [..._.map(smoothedChartData, 'msX'), ..._.map(_.reverse([...smoothedChartData]), 'msX')],
      y: [..._.map(smoothedChartData, upperKey), ..._.map(_.reverse([...smoothedChartData]), lowerKey)],
      yaxis: index === 0 ? 'y' : `y${index + 1}`,
      fill: 'tozerox',
      fillcolor: colors.ambulatoryGlucoseProfile[key][bgRange],
      mode: 'none',
      line: {
        simplify: false,
        shape: 'spline',
        smoothing: 0.5,
      },
    });

    const bgRangeKeys = [
      'veryLow',
      'low',
      'target',
      'high',
      'veryHigh',
    ];

    const bgTicks = [
      0,
      bgPrefs?.bgBounds?.veryLowThreshold,
      bgPrefs?.bgBounds?.targetLowerBound,
      bgPrefs?.bgBounds?.targetUpperBound,
      bgPrefs?.bgBounds?.veryHighThreshold,
      yClamp,
    ];

    const bgTickAnnotations = _.map(bgTicks, (tick, index) => {
      const isTarget = _.includes([2, 3], index);
      let yshift = 0;
      if (index === 0) yshift = 2;
      if (index === 1) yshift = -2;

      return createAnnotation({
        align: 'right',
        font: {
          color: isTarget ? colors.white : colors.text.ticks.bg,
          size: fontSizes.ambulatoryGlucoseProfile.bgTicks,
        },
        height: 9,
        text: index === 0
          ? boldText(tick)
          : boldText(formatBgValue(tick, bgPrefs, undefined, true)),
        y: tick / yClamp,
        yanchor: 'middle',
        yref: 'paper',
        yshift,
        xanchor: 'right',
        xref: 'x',
        xshift: -2,
        x: 0,
      });
    });

    const createbgTargetMarkerSVG = (posX, posY) => {
      const radiusX = 2;
      const radiusY = 2;
      const width = 22;
      const height = 10;
      const posXLeft = posX - width;
      const posYTop = posY + height / 2;
      const posYBottom = posY - height / 2;
      const arrowHeight = height / 2 - 1;

      return [
        `M ${posX} ${posY}`,
        `V ${posY - 1}`,
        `L ${posX - arrowHeight} ${posYBottom}`,
        `H ${posXLeft + radiusX}`,
        `Q ${posXLeft} ${posYBottom} ${posXLeft} ${posYBottom + radiusY}`,
        `V ${posYTop - radiusY}`,
        `Q ${posXLeft} ${posYTop} ${posXLeft + radiusX} ${posYTop}`,
        `H ${posX - arrowHeight}`,
        `L ${posX} ${posY + 1}`,
        `V ${posY}`,
      ].join(' ');
    };

    const bgTargetMarkers = _.map(_.slice(bgTicks, 2, 4), tick => ({
      fillcolor: colors.line.range.target,
      line: {
        width: 0,
      },
      tick,
      path: createbgTargetMarkerSVG(-1, tick / yClamp * paperHeight),
      type: 'path',
      xanchor: 0,
      xref: 'paper',
      xsizemode: 'pixel',
      yanchor: 0,
      yref: 'paper',
      ysizemode: 'pixel',
    }));

    const bgGridLines = _.map(bgTicks, (tick, index) => {
      const isTarget = _.includes([2, 3], index);

      return {
        layer: isTarget ? 'above' : 'below',
        line: {
          color: isTarget ? colors.line.range.target : colors.line.range.default,
          width: isTarget ? 2 : 1,
        },
        type: 'line',
        x0: index === 5 ? -1 : 0, // fills an empty pixel cap on top grid line
        x1: index === 5 ? paperWidth + 1 : paperWidth, // fills an empty pixel cap on top grid line
        xref: 'paper',
        xanchor: 0,
        xsizemode: 'pixel',
        y0: tick / yClamp,
        y1: tick / yClamp,
        yref: 'paper',
      };
    });

    const percentileTicks = _.map(quantileKeys, key => {
      if (firstSmoothedDatum[key] && lastSmoothedDatum[key]) {
        return (firstSmoothedDatum[key] + lastSmoothedDatum[key]) / 2;
      }
      return firstSmoothedDatum[key] || lastSmoothedDatum[key];
    });

    const percentileLabels = ['5%', '25%', '50%', '75%', '95%'];

    // Ensure that percentile ticks and annotations don't crowd
    const percentileTickYPositions = _.map(percentileTicks, tick => chartScaleToPixels(paperHeight, tick / yClamp));
    const percentileTickShiftedYPositions = [...percentileTickYPositions];
    const medianYPos = percentileTickYPositions[2];
    const minGap = pointsToPixels(fontSizes.ambulatoryGlucoseProfile.percentileTicks) + 2;
    percentileTickShiftedYPositions[1] = _.min([medianYPos - minGap, percentileTickShiftedYPositions[1]]);
    percentileTickShiftedYPositions[0] = _.min([percentileTickShiftedYPositions[1] - minGap, percentileTickShiftedYPositions[0]]);
    percentileTickShiftedYPositions[3] = _.max([medianYPos + minGap, percentileTickShiftedYPositions[3]]);
    percentileTickShiftedYPositions[4] = _.max([percentileTickShiftedYPositions[3] + minGap, percentileTickShiftedYPositions[4]]);
    const percentileTickYShifts = _.map(percentileTickShiftedYPositions, (shiftedYPos, index) => (shiftedYPos - percentileTickYPositions[index]));

    const percentileTickAnnotations = _.map(percentileTicks, (tick, index) => createAnnotation({
      align: 'left',
      font: {
        color: index === 2 ? colors.black : colors.text.ticks.percentile,
        size: fontSizes.ambulatoryGlucoseProfile.percentileTicks,
      },
      text: boldText(percentileLabels[index]),
      visible: tick / yClamp <= 1,
      y: tick / yClamp,
      yanchor: 'middle',
      yref: 'paper',
      yshift: percentileTickYShifts[index],
      xanchor: 'left',
      xref: 'x',
      xshift: 5,
      x: MS_IN_DAY,
    }));

    const percentileTickLines = _.map(percentileTicks, (tick, index) => ({
      line: {
        color: colors.line.ticks,
        width: 1,
      },
      type: 'line',
      visible: tick / yClamp <= 1,
      x0: paperWidth,
      x1: paperWidth + 5,
      xref: 'paper',
      xanchor: 0,
      xsizemode: 'pixel',
      y0: tick / yClamp,
      y1: tick / yClamp + pixelsToChartScale(paperHeight, percentileTickYShifts[index]),
      yref: 'paper',
    }));

    const quarterDayTicks = _.range(0, MS_IN_DAY + 1, MS_IN_HOUR * 6);

    const hourlyTicks = _.filter(
      _.range(0, MS_IN_DAY + 1, MS_IN_HOUR),
      tick => ((tick / MS_IN_HOUR) % 12 !== 0)
    );

    const hourlyTicksAnnotations = _.map(_.range(0, MS_IN_DAY + 1, MS_IN_HOUR * 3), tick => createAnnotation({
      align: 'center',
      font: {
        color: (tick / MS_IN_HOUR) % 12 === 0 ? colors.black : colors.darkGrey,
        size: fontSizes.ambulatoryGlucoseProfile.hourlyTicks,
      },
      text: boldText(moment.utc(tick).format('ha')),
      y: 0,
      yanchor: 'top',
      yref: 'y',
      yshift: -2,
      xanchor: 'middle',
      xref: 'x',
      x: tick,
    }));

    const data = [];
    const yAxes = [];

    _.each(bgRangeKeys, (bgRange, index) => {
      data.push(quantileBand('upperQuantile', 'lowerQuantile', 'outerQuantile', bgRange, index));
      data.push(quantileBand('thirdQuartile', 'firstQuartile', 'interQuartile', bgRange, index));

      data.push({
        name: 'median',
        type: 'scatter',
        x: _.map(smoothedChartData, 'msX'),
        y: _.map(smoothedChartData, 'median'),
        yaxis: index === 0 ? 'y' : `y${index + 1}`,
        mode: 'lines',
        fill: 'none',
        line: {
          color: colors.ambulatoryGlucoseProfile.median[bgRange],
          simplify: false,
          shape: 'spline',
          width: 3,
          smoothing: 0.5,
        },
      });

      const range = [bgTicks[index], bgTicks[index + 1]];

      const yAxis = {
        domain: [range[0] / yClamp, range[1] / yClamp],
        range,
        showgrid: false,
        showline: true,
        linecolor: colors.lightGrey,
        mirror: true,
        showticklabels: false,
        zeroline: false,
      };

      yAxes.push(yAxis);
    });

    const layout = {
      width: chartAreaWidth,
      height: chartAreaHeight,
      showlegend: false,

      margin: {
        l: plotMarginX,
        r: plotMarginX,
        b: plotMarginY,
        t: plotMarginY,
      },

      xaxis: {
        gridcolor: colors.line.ticks,
        linecolor: colors.line.ticks,
        range: [0, MS_IN_DAY],
        showgrid: true,
        showline: true,
        showticklabels: false,
        tickvals: quarterDayTicks,
        zeroline: false,
      },

      // secondary axis for hourly ticks
      xaxis2: {
        range: [0, MS_IN_DAY],
        overlaying: 'x',
        showgrid: false,
        showline: false,
        showticklabels: false,
        ticks: 'inside',
        tickcolor: colors.lightGrey,
        ticklen: 5,
        tickvals: hourlyTicks,
        zeroline: false,
      },

      ..._.reduce(yAxes, (result, axis, index) => {
        const axisKey = index === 0 ? 'yaxis' : `yaxis${index + 1}`;
        result[axisKey] = axis; // eslint-disable-line no-param-reassign
        return result;
      }, {}),

      annotations: [
        ...bgTickAnnotations,
        ...percentileTickAnnotations,
        ...hourlyTicksAnnotations,

        createAnnotation({
          font: {
            color: colors.text.ticks.bg,
            size: fontSizes.ambulatoryGlucoseProfile.bgUnits,
          },
          text: bgPrefs.bgUnits,
          x: 0,
          xanchor: 'right',
          xref: 'paper',
          xshift: -2,
          y: bgTicks[5] / yClamp,
          yanchor: 'top',
          yref: 'paper',
          yshift: -4,
        }),

        createAnnotation({
          font: {
            color: colors.black,
            size: fontSizes.ambulatoryGlucoseProfile.bgUnits,
          },
          text: boldText(text.ambulatoryGlucoseProfile.targetRange),
          x: 0,
          xanchor: 'right',
          xref: 'paper',
          xshift: -2,
          y: (bgTicks[2] + bgTicks[3]) / 2 / yClamp,
          yanchor: 'middle',
          yref: 'paper',
        }),
      ],

      shapes: [
        ...bgGridLines,
        ...bgTargetMarkers,
        ...percentileTickLines,
      ],
    };

    const groupedData = _.groupBy(data, 'name');

    const figure = {
      data: [
        ...groupedData.outerQuantile,
        ...groupedData.interQuartile,
        ...groupedData.median,
        // Dummy data to allow rendering overlay axes used for annotations, ticks, etc
        { visible: false, xaxis: 'x2' },
      ],
      layout,
    };

    return figure;
  }

  return null; // TODO: insufficient data text
};

export const generateDailyGlucoseProfilesFigure = (section, cbgData, bgPrefs) => {
  // Set chart plot within section borders
  const chartAreaWidth = section.width - 2;
  const chartAreaHeight = section.height - 2 - AGP_SECTION_HEADER_HEIGHT - AGP_SECTION_BORDER_RADIUS;
  const plotMarginX = DPI * 0.5;
  const plotMarginTop = DPI * 0.425;
  const plotMarginBottom = DPI * 0.3;
  const paperWidth = chartAreaWidth - (plotMarginX * 2);
  const paperHeight = chartAreaHeight - (plotMarginTop + plotMarginBottom);

  if (cbgData.length > 0) { // TODO: proper data sufficiency check
    const data = [];

    const layout = {
      barmode: 'stack',
      width: chartAreaWidth,
      height: chartAreaHeight,
      showlegend: false,

      margin: {
        l: plotMarginX,
        r: plotMarginX,
        b: plotMarginBottom,
        t: plotMarginTop,
      },

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
      ],

      shapes: [
      ],
    };

    const figure = { data, layout };
    return figure;
  }

  return null; // TODO: insufficient data text
};
