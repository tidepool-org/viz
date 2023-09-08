import _ from 'lodash';

import {
  AGP_BG_CLAMP_MGDL,
  AGP_BG_CLAMP_MMOLL,
  AGP_FONT_FAMILY,
  AGP_FOOTER_Y_PADDING,
  AGP_LOWER_QUANTILE,
  AGP_SECTION_BORDER_RADIUS,
  AGP_SECTION_DESCRIPTION_HEIGHT,
  AGP_SECTION_HEADER_HEIGHT,
  AGP_TIR_MIN_HEIGHT,
  AGP_TIR_MIN_TARGET_HEIGHT,
  AGP_UPPER_QUANTILE,
  colors,
  fontSizes,
  text,
} from './AGPConstants';

import { DPI, MARGINS, WIDTH, HEIGHT } from './constants';
import { bankersRound, formatBgValue, formatPercentage } from '../../../utils/format';
import { ONE_HR, getTimezoneFromTimePrefs } from '../../../utils/datetime';
import { classifyBgValue, mungeBGDataBins } from '../../../utils/bloodglucose';
import { MGDL_UNITS, MS_IN_DAY, MS_IN_HOUR, BGM_DATA_KEY, CGM_DATA_KEY } from '../../../utils/constants';
import moment from 'moment';

export const boldText = textString => `<b>${String(textString)}</b>`;
export const chartScaleToPixels = (paperPixelDimension, scaleValue) => scaleValue * paperPixelDimension;
export const pixelsToChartScale = (paperPixelDimension, pixels) => pixels / paperPixelDimension;
export const pointsToPixels = points => points * 0.75;

export const createAnnotation = options => {
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

export const calculateCGMDataSufficiency = (data = {}) => {
  const { statsByDate } = data.data?.current?.aggregationsByDate;
  const { newestDatum, bgDaysWorn } = data.data?.current?.stats?.bgExtents || {};

  const {
    count,
    sampleFrequency,
    sensorUsageAGP,
  } = data.data?.current?.stats?.sensorUsage || {};

  const sufficiencyBySection = {
    ambulatoryGlucoseProfile: true,
    dailyGlucoseProfiles: true,
    glucoseMetrics: true,
    percentInRanges: true,
  };

  const hoursOfCGMData = (count * sampleFrequency) / MS_IN_HOUR;

  if (hoursOfCGMData < 24) {
    // Show nothing if <24 hours total cgm time
    return {
      ambulatoryGlucoseProfile: false,
      dailyGlucoseProfiles: false,
      glucoseMetrics: false,
      percentInRanges: false,
    };
  } else if (hoursOfCGMData === 24) {
    // Hide agp if only 24 hours total cgm time, but show other sections conditional on sufficiency
    const sufficencyMet = sensorUsageAGP >= 70;

    return {
      ambulatoryGlucoseProfile: false,
      dailyGlucoseProfiles: sufficencyMet,
      glucoseMetrics: sufficencyMet,
      percentInRanges: sufficencyMet,
    };
  }

  const cgmCalendarDays = _.map(_.range(_.max([bgDaysWorn, 7])), (val, index) => (
    moment.utc(newestDatum.time).tz(getTimezoneFromTimePrefs(data.timePrefs)).subtract(index, 'days').format('YYYY-MM-DD')
  )).reverse();

  const sensorUsageByDate = _.map(cgmCalendarDays, (date, index) => {
    const {
      count: countForDate,
      sampleFrequency: sampleFrequencyForDate,
      newestDatum: newestDatumForDate = {},
      oldestDatum: oldestDatumForDate = {},
    } = statsByDate[date]?.sensorUsage || {};

    if (!sampleFrequencyForDate || !countForDate) {
      return { sufficiencyMet: false, sensorUsage: 0 };
    }

    const minCount = MS_IN_HOUR / sampleFrequencyForDate;

    let maxPossibleReadings = 0;
    if (index === 0) {
      maxPossibleReadings = bankersRound((MS_IN_DAY - oldestDatumForDate.msPer24) / sampleFrequencyForDate);
    } else if (index === cgmCalendarDays.length - 1) {
      maxPossibleReadings = bankersRound(newestDatumForDate.msPer24 / sampleFrequencyForDate);
    } else {
      maxPossibleReadings = bankersRound(MS_IN_DAY / sampleFrequencyForDate);
    }

    const sensorUsage = maxPossibleReadings > 0 ? countForDate / maxPossibleReadings * 100 : 0;
    const sufficiencyMet = countForDate >= minCount;

    return ({ count: countForDate, date, maxPossibleReadings, sensorUsage, sufficiencyMet });
  });

  // AGP section requires that each day in the top 7 have at least an hour of data, and an average
  // sensore usage of 70%
  const sufficientDays = _.filter(sensorUsageByDate, { sufficiencyMet: true });
  const topSevenSufficientDays = _.slice(_.orderBy(sufficientDays, ['sensorUsage'], ['desc']), 0, 7);

  if (topSevenSufficientDays.length < 7) {
    sufficiencyBySection.ambulatoryGlucoseProfile = false;
  } else {
    const topSevenDaysSensorUsageMean = _.meanBy(topSevenSufficientDays, 'sensorUsage');
    sufficiencyBySection.ambulatoryGlucoseProfile = topSevenDaysSensorUsageMean >= 70;
  }

  return sufficiencyBySection;
};

export const calculateBGMDataSufficiency = (data = {}) => {
  const totalReadings = data.data?.current?.data?.smbg?.length || 0;

  const sufficiencyBySection = {
    ambulatoryGlucoseProfile: totalReadings > 30,
    dailyGlucoseProfiles: totalReadings > 0,
    glucoseMetrics: totalReadings > 0,
    percentInRanges: totalReadings > 0,
  };

  return sufficiencyBySection;
};

export const generateChartSections = (data, bgSource) => {
  const reportInfoAndMetricsWidth = DPI * 3.375;
  const chartRenderAreaTop = DPI * 0.75;
  const rightEdge = MARGINS.left + WIDTH;
  const bottomEdge = MARGINS.top + HEIGHT;
  const chartRenderAreaBottom = bottomEdge - (DPI * 0.75 - MARGINS.bottom);
  const sectionGap = DPI * 0.25;
  const sections = {};
  const dataSufficiency = bgSource === CGM_DATA_KEY
    ? calculateCGMDataSufficiency(data)
    : calculateBGMDataSufficiency(data);

  sections.percentInRanges = {
    bgSource,
    x: MARGINS.left,
    y: chartRenderAreaTop,
    width: DPI * 3.875,
    height: DPI * 3,
    bordered: true,
    text: text.percentInRanges[bgSource],
    sufficientData: dataSufficiency.percentInRanges,
  };

  sections.reportInfo = {
    bgSource,
    x: rightEdge - reportInfoAndMetricsWidth,
    y: chartRenderAreaTop,
    width: reportInfoAndMetricsWidth,
    height: DPI * (bgSource === CGM_DATA_KEY ? 0.875 : 0.55),
    text: text.reportInfo,
  };

  sections.glucoseMetrics = {
    bgSource,
    x: rightEdge - reportInfoAndMetricsWidth,
    y: sections.reportInfo.y + sections.reportInfo.height + sectionGap,
    width: reportInfoAndMetricsWidth,
    height: DPI * (bgSource === CGM_DATA_KEY ? 1.875 : 2.2),
    bordered: true,
    text: text.glucoseMetrics[bgSource],
    sufficientData: dataSufficiency.glucoseMetrics,
  };

  sections.ambulatoryGlucoseProfile = {
    bgSource,
    x: MARGINS.left,
    y: DPI * 4,
    width: WIDTH,
    height: DPI * 3.5,
    bordered: true,
    text: text.ambulatoryGlucoseProfile[bgSource],
    sufficientData: dataSufficiency.ambulatoryGlucoseProfile,
  };

  const dailyGlucoseProfilesHeight = DPI * 2.25;
  sections.dailyGlucoseProfiles = {
    bgSource,
    x: MARGINS.left,
    y: chartRenderAreaBottom - dailyGlucoseProfilesHeight - AGP_FOOTER_Y_PADDING,
    width: WIDTH,
    height: dailyGlucoseProfilesHeight,
    bordered: true,
    text: text.dailyGlucoseProfiles[bgSource],
    sufficientData: dataSufficiency.dailyGlucoseProfiles,
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
export const generatePercentInRangesFigure = (section, stat, bgPrefs) => {
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
  if (section.sufficientData) {
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
      const minHeight = datum.id === 'target' ? AGP_TIR_MIN_TARGET_HEIGHT : AGP_TIR_MIN_HEIGHT;
      const renderedValue = _.max([value, minHeight / 100]);
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
        size: fontSizes.percentInRanges.ticks,
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
      const minBracketYOffSet = yScale(13);

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
        yScale(AGP_TIR_MIN_TARGET_HEIGHT),
        1 - (yScale(AGP_TIR_MIN_TARGET_HEIGHT)),
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
      yScale(-11),

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
        size: fontSizes.percentInRanges.values,
      },
      text: boldText(text.bgRanges[range]),
      x: bracketXExtents[0],
      xanchor: 'left',
      xshift: -1,
      y: rangePosY[range],
      yanchor: 'bottom',
      yref: 'paper',
      yshift: -1,
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
        size: fontSizes.percentInRanges.values,
      },
      text: boldText(formatPercentage(chartData.rawById[range], 0, true)),
      x: bracketXExtents[0] + (bracketXExtents[1] - bracketXExtents[0]) / 2,
      xanchor: 'right',
      xshift: -4,
      y: rangePosY[range],
      yanchor: 'bottom',
      yref: 'paper',
      yshift: -1,
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
        size: fontSizes.percentInRanges.summaries,
      },
      text: boldText(formatPercentage(combinedRangeSummaryValues[range], 0, true)),
      x: bracketXExtents[0] + (bracketXExtents[1] - bracketXExtents[0]) / 2,
      xanchor: 'left',
      xshift: section.bgSource === CGM_DATA_KEY ? 3 : 28,
      y: rangeSummaryPosY[range],
      yanchor: 'bottom',
      yref: 'paper',
      yshift: -2,
    }));

    const goalsPos = {
      veryLow: {
        x: bracketXExtents[0],
        xanchor: 'left',
        xshift: -1,
        y: bracketPos.low.posY2,
        yshift: -11,
      },
      lowCombined: {
        x: bracketXExtents[1],
        xanchor: 'right',
        xshift: 1,
        y: bracketPos.low.posY2 + bracketPos.low.subBracketYOffset,
        yshift: 0,
      },
      target: {
        x: bracketXExtents[1],
        xanchor: 'right',
        xshift: 1,
        y: bracketPos.target.posY,
        yshift: 0,
      },
      highCombined: {
        x: bracketXExtents[1],
        xanchor: 'right',
        xshift: 1,
        y: bracketPos.high.posY2 + bracketPos.high.subBracketYOffset,
        yshift: 0,
      },
      veryHigh: {
        x: bracketXExtents[0],
        xanchor: 'left',
        xshift: -1,
        y: bracketPos.high.posY,
        yshift: 9,
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
        size: fontSizes.percentInRanges.goals,
      },
      text: text.goals[range],
      yanchor: 'bottom',
      yref: 'paper',
      ...goalsPos[range],
    }));

    const subLabelsPos = {
      TIRtarget: {
        x: xScale(paperWidth),
        xanchor: 'right',
        xref: 'paper',
        xshift: plotMarginX - 15,
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
        size: fontSizes.percentInRanges.subLabels,
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
        section.bgSource === CGM_DATA_KEY && goals[0],
      ],
      low: [
        rangeLabels[1],
        rangeValues[1],
      ],
      lowSummary: [
        rangeSummaryValues[0],
        section.bgSource === CGM_DATA_KEY && goals[1],
      ],
      target: [
        rangeLabels[2],
        rangeSummaryValues[1],
        section.bgSource === CGM_DATA_KEY && goals[2],
        section.bgSource === CGM_DATA_KEY && subLabels[0],
      ],
      high: [
        rangeLabels[3],
        rangeValues[2],
      ],
      veryHigh: [
        rangeLabels[4],
        rangeValues[3],
        section.bgSource === CGM_DATA_KEY && goals[4],
      ],
      highSummary: [
        rangeSummaryValues[2],
        section.bgSource === CGM_DATA_KEY && goals[3],
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
        section.bgSource === CGM_DATA_KEY && subLabels[1],
      ],

      shapes: [
        ...brackets,
        ...leaders,
      ],
    };

    const figure = { data, layout };
    return figure;
  }

  return null;
};

export const generateAmbulatoryGlucoseProfileFigure = (section, bgData, bgPrefs, bgSource) => {
  // Set chart plot within section borders
  const chartAreaWidth = section.width - 2;
  const chartAreaHeight = section.height - 2 - (AGP_SECTION_HEADER_HEIGHT + AGP_SECTION_DESCRIPTION_HEIGHT) - AGP_SECTION_BORDER_RADIUS;
  const plotMarginX = DPI * 0.5;
  const plotMarginY = DPI * 0.2;
  const paperWidth = chartAreaWidth - (plotMarginX * 2);
  const paperHeight = chartAreaHeight - (plotMarginY * 2);

  if (section.sufficientData || bgSource === BGM_DATA_KEY) {
    const yClamp = bgPrefs?.bgUnits === MGDL_UNITS ? AGP_BG_CLAMP_MGDL : AGP_BG_CLAMP_MMOLL;
    const chartData = mungeBGDataBins(bgSource, ONE_HR, bgData, [AGP_LOWER_QUANTILE, AGP_UPPER_QUANTILE]);

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

    const quantileSegment = (upperKey, lowerKey, key, bgRange, index, segmentData) => ({
      name: key,
      type: 'scatter',
      x: [..._.map(segmentData, 'msX'), ..._.map(_.reverse([...segmentData]), 'msX')],
      y: [..._.map(segmentData, upperKey), ..._.map(_.reverse([...segmentData]), lowerKey)],
      yaxis: index === 0 ? 'y' : `y${index + 1}`,
      fill: 'toself',
      fillcolor: colors.ambulatoryGlucoseProfile[key][bgRange],
      mode: 'none',
      line: {
        simplify: false,
        shape: 'line',
        smoothing: 0,
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
      if (index === 0) yshift = 4;
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
      const isClamp = index === 5;
      const isTarget = _.includes([2, 3], index);
      const isZero = index === 0;

      return {
        layer: (bgSource === CGM_DATA_KEY && (isTarget || isClamp)) ? 'above' : 'below',
        line: {
          color: isTarget ? colors.line.range.target : colors.line.range.default,
          width: isTarget ? 2 : 1,
        },
        type: 'line',
        x0: isClamp || isZero ? -1 : 0, // fills an empty pixel cap on top grid line
        x1: isClamp || isZero ? paperWidth + 1 : paperWidth, // fills an empty pixel cap on top grid line
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

      return bgSource === CGM_DATA_KEY
        ? firstSmoothedDatum[key] || lastSmoothedDatum[key]
        : undefined;
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
      name: bgRangeKeys[index],
      text: boldText(percentileLabels[index]),
      visible: _.isFinite(tick) && tick / yClamp <= 1,
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
      visible: _.isFinite(tick) && tick / yClamp <= 1,
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
      yshift: 0,
      xanchor: 'middle',
      xref: 'x',
      x: tick,
    }));

    const data = [];
    const yAxes = [];
    const bgmMedian = [];
    const legend = [];
    let showLegend = false;

    _.each(bgRangeKeys, (bgRange, index) => {
      const range = [bgTicks[index], bgTicks[index + 1]];

      if (bgSource === CGM_DATA_KEY) {
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
      } else if (bgSource === BGM_DATA_KEY) {
        if (section.sufficientData) {
          _.each(smoothedChartData, (bin, i) => {
            const segmentData = [smoothedChartData[i - 1], bin];

            const bandData = _.filter(
              segmentData,
              ({ thirdQuartile, firstQuartile } = {}) => _.isFinite(thirdQuartile) && _.isFinite(firstQuartile)
            );

            if (bandData.length === 2) {
              data.push(quantileSegment('thirdQuartile', 'firstQuartile', 'interQuartile', bgRange, index, bandData));
            }

            const medianData = _.filter(
              segmentData,
              ({ median } = {}) => _.isFinite(median)
            );

            const isLastDrawableSegment = i === smoothedChartData.length - 1;

            // Show legend if the interquartile ranges don't extend to the chart edge
            if (isLastDrawableSegment && bandData.length < 2) {
              const medianTickYPos = (segmentData[0].median + segmentData[1].median) / 2;
              showLegend = medianTickYPos > yClamp / 2 ? 'bottom' : 'top';
            }

            if (medianData.length === 2) {
              const medianWidth = 3;
              const isFirstDrawableSegment = i === 1;

              let x0 = medianData[0].msX / MS_IN_DAY;
              let x1 = medianData[1].msX / MS_IN_DAY;
              let y0 = medianData[0].median;
              let y1 = medianData[1].median;

              if (isFirstDrawableSegment) {
                x0 = 0;
                y0 = y1 - ((y1 - y0) / 2);
              }

              if (isLastDrawableSegment) {
                x1 = 1;
                y1 = y1 - ((y1 - y0) / 2);
              }

              bgmMedian.push({
                type: 'line',
                x0,
                x1,
                y0,
                y1,
                line: {
                  color: colors.ambulatoryGlucoseProfile.median[bgRange],
                  width: medianWidth,
                },
                xref: 'paper',
                xsizemode: 'scaled',
                yref: index === 0 ? 'y' : `y${index + 1}`,
                ysizemode: 'scaled',
              });

              const lineEndRadius = medianWidth / 2;
              const rx = pixelsToChartScale(paperWidth, lineEndRadius);
              const ry = pixelsToChartScale(paperHeight, lineEndRadius) * yClamp;

              // add circles at line end to smooth out any sharp gaps between interconnected segments
              const previousSegmentData = [smoothedChartData[i - 2], smoothedChartData[i - 1]];

              if (_.filter(
                previousSegmentData,
                ({ median } = {}) => _.isFinite(median)
              ).length === 2) {
                const lineEnd = segmentData[0];
                bgmMedian.push({
                  type: 'circle',
                  x0: lineEnd.msX / MS_IN_DAY - rx,
                  x1: lineEnd.msX / MS_IN_DAY + rx,
                  y0: lineEnd.median - ry,
                  y1: lineEnd.median + ry,
                  line: { width: 0 },
                  fillcolor: colors.ambulatoryGlucoseProfile.median[bgRange],
                  xref: 'paper',
                  xsizemode: 'scaled',
                  yref: index === 0 ? 'y' : `y${index + 1}`,
                  ysizemode: 'scaled',
                });
              }
            }
          });
        } else {
          // No AGP data to plot, but need to add dummy datums so that the readings will plot
        }
      }

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

    if (showLegend) {
      const legendRangeWidth = 5;
      const legendRangeHeight = 15;
      const legendXOffset = pixelsToChartScale(paperWidth, 4);

      const legendYOffset = showLegend === 'top'
        ? 1 - pixelsToChartScale(paperHeight, legendRangeHeight * 5 + 4)
        : pixelsToChartScale(paperHeight, 4);

      _.each(percentileTickAnnotations, (tick, tickIndex) => {
        // Create legend range and update tick position to be adjacent to the legend
        const showTick = _.includes([0, 2, 4], tickIndex);
        const isTarget = tickIndex === 2;
        const yPos = tickIndex * legendRangeHeight;

        legend.push({
          type: 'rect',
          x0: 0,
          x1: legendRangeWidth,
          y0: yPos,
          y1: yPos + legendRangeHeight,
          line: { width: 0 },
          fillcolor: colors.ambulatoryGlucoseProfile.interQuartile[tick.name],
          xanchor: 1 + legendXOffset,
          xref: 'paper',
          xsizemode: 'pixel',
          yanchor: 0 + legendYOffset,
          yref: 'paper',
          ysizemode: 'pixel',
        });

        if (isTarget) {
          legend.push({
            type: 'line',
            x0: 0,
            x1: legendRangeWidth,
            y0: yPos + legendRangeHeight / 2,
            y1: yPos + legendRangeHeight / 2,
            line: {
              color: colors.ambulatoryGlucoseProfile.median.target,
              width: 3,
            },
            xanchor: 1 + legendXOffset,
            xref: 'paper',
            xsizemode: 'pixel',
            yanchor: 0 + legendYOffset,
            yref: 'paper',
            ysizemode: 'pixel',
          });
        }

        if (showTick) {
          let tickYPosOffset = 0.5;
          let tickTextIndex = tickIndex + 1;

          if (tickIndex > 0) {
            tickYPosOffset = (isTarget ? legendRangeHeight / 2 : legendRangeHeight - 0.5);
            tickTextIndex = isTarget ? tickIndex : tickIndex - 1;
          }

          percentileTickLines.push({
            type: 'line',
            x0: 0,
            x1: 5,
            y0: yPos + tickYPosOffset,
            y1: yPos + tickYPosOffset,
            line: {
              color: colors.line.ticks,
              width: 1,
            },
            xanchor: 1 + pixelsToChartScale(paperWidth, legendRangeWidth) + legendXOffset,
            xref: 'paper',
            xsizemode: 'pixel',
            yanchor: 0 + legendYOffset,
            yref: 'paper',
            ysizemode: 'pixel',
          });

          percentileTickAnnotations.push(createAnnotation({
            align: 'left',
            font: {
              color: isTarget ? colors.black : colors.text.ticks.percentile,
              size: fontSizes.ambulatoryGlucoseProfile.percentileTicks,
            },
            name: bgRangeKeys[tickIndex],
            text: boldText(percentileLabels[tickTextIndex]),
            xanchor: 'left',
            xref: 'paper',
            xshift: 5,
            x: 1 + pixelsToChartScale(paperWidth, legendRangeWidth) + legendXOffset,
            y: pixelsToChartScale(paperHeight, yPos + tickYPosOffset),
            yanchor: 'middle',
            yref: 'paper',
            yshift: chartScaleToPixels(paperHeight, legendYOffset),
          }));
        }
      });
    }

    let targetReadings = [];
    let lowReadings = [];
    let veryLowReadings = [];
    let highReadings = [];
    let veryHighReadings = [];

    if (bgSource === BGM_DATA_KEY) {
      const bgPlotRadius = 2.25;
      const rx = pixelsToChartScale(paperWidth, bgPlotRadius);
      const ry = pixelsToChartScale(paperHeight, bgPlotRadius);

      const renderBgReadings = bgRange => _.map(_.filter(bgData, ({ value }) => classifyBgValue(bgPrefs.bgBounds, value, 'fiveWay') === bgRange), d => ({
        type: 'circle',
        x0: d.msPer24 / (MS_IN_DAY) - rx,
        x1: d.msPer24 / (MS_IN_DAY) + rx,
        y0: _.min([d.value, yClamp]) / yClamp - ry,
        y1: _.min([d.value, yClamp]) / yClamp + ry,
        fillcolor: colors.bgReadings[bgRange],
        line: {
          color: colors.black,
          width: 0.25,
        },
        xref: 'paper',
        xsizemode: 'scaled',
        yref: 'paper',
        ysizemode: 'scaled',
      }));

      veryLowReadings = renderBgReadings('veryLow');
      lowReadings = renderBgReadings('low');
      targetReadings = renderBgReadings('target');
      highReadings = renderBgReadings('high');
      veryHighReadings = renderBgReadings('veryHigh');
    }

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
        showline: false,
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
          text: bgPrefs?.bgUnits,
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
          text: boldText(text.ambulatoryGlucoseProfile[bgSource].targetRange),
          x: 0,
          xanchor: 'right',
          xref: 'paper',
          xshift: -2,
          y: _.mean(_.slice(bgTicks, 2, 4)) / yClamp,
          yanchor: 'middle',
          yref: 'paper',
        }),
      ],

      shapes: [
        ...bgGridLines,
        ...bgTargetMarkers,
        ...targetReadings,
        ...lowReadings,
        ...veryLowReadings,
        ...highReadings,
        ...veryHighReadings,
        ...bgmMedian,
        ...percentileTickLines,
        ...legend,
      ],
    };

    const figure = {
      data: [
        ...data,
        // Dummy data to ensure that all axes render (plotly will not render axes lines if empty)
        { visible: false, xaxis: 'x2' },
        ..._.map(yAxes, (axis, i) => ({ visible: false, yaxis: i === 0 ? 'y' : `y${i + 1}` })),
      ],
      layout,
    };

    return figure;
  }

  return null;
};

export const generateDailyGlucoseProfilesFigure = (section, bgData, bgPrefs, dateLabelFormat) => {
  // Set chart plot within section borders
  const chartAreaWidth = section.width - 2;
  const chartAreaHeight = section.height - 2 - (AGP_SECTION_HEADER_HEIGHT + AGP_SECTION_DESCRIPTION_HEIGHT) - AGP_SECTION_BORDER_RADIUS;
  const plotHeight = chartAreaHeight / 2;
  const plotMarginX = DPI * 0.5;
  const plotMarginTop = DPI * 0.2;
  const plotMarginBottom = 1;
  const paperWidth = chartAreaWidth - (plotMarginX * 2);
  const paperHeight = plotHeight - (plotMarginTop + plotMarginBottom);

  if (section.sufficientData) {
    const yClamp = bgPrefs?.bgUnits === MGDL_UNITS ? AGP_BG_CLAMP_MGDL : AGP_BG_CLAMP_MMOLL;

    const bgRangeKeys = [
      'low',
      'target',
      'high',
    ];

    const bgTicks = [
      0,
      bgPrefs?.bgBounds?.targetLowerBound,
      bgPrefs?.bgBounds?.targetUpperBound,
      yClamp,
    ];

    const bgTickAnnotations = _.map(_.slice(bgTicks, 1, 3), tick => createAnnotation({
      align: 'right',
      font: {
        color: colors.text.ticks.dailyProfileBg,
        size: fontSizes.dailyGlucoseProfiles.bgTicks,
      },
      text: boldText(formatBgValue(tick, bgPrefs, undefined, true)),
      y: tick / yClamp,
      yanchor: 'middle',
      yref: 'paper',
      xanchor: 'right',
      xref: 'x',
      xshift: -2,
      x: 0,
    }));

    const bgGridLines = _.map(bgTicks, (tick, index) => {
      const isClamp = index === 3;
      const isTarget = _.includes([1, 2], index);
      const isZero = index === 0;

      return {
        layer: isTarget || isClamp ? 'above' : 'below',
        line: {
          color: isTarget ? colors.line.range.dailyProfileTarget : colors.line.range.default,
          width: 1,
        },
        type: 'line',
        x0: isClamp || isZero ? -1 : 0, // fills an empty pixel gap on top grid line
        x1: isClamp || isZero ? paperWidth + 1 : paperWidth, // fills an empty pixel gap on top grid line
        xref: 'paper',
        xanchor: 0,
        xsizemode: 'pixel',
        y0: tick / yClamp,
        y1: tick / yClamp,
        yref: 'paper',
      };
    });

    const halfDayTicks = _.range(0, MS_IN_DAY * 7 + 1, MS_IN_HOUR * 12);

    const halfDayTickAnnotations = _.map(_.filter(halfDayTicks, (tick, index) => index % 2 !== 0), (tick, index) => createAnnotation({
      align: 'center',
      font: {
        color: colors.black,
        size: dateLabelFormat === 'ha'
          ? fontSizes.dailyGlucoseProfiles.timeTicks
          : fontSizes.dailyGlucoseProfiles.weekdayTicks,
      },
      text: dateLabelFormat === 'ha'
        ? boldText(moment.utc(tick).format(dateLabelFormat))
        : boldText(moment.utc(String(bgData[index][0])).format(dateLabelFormat)),
      y: 1,
      yanchor: 'bottom',
      yref: 'paper',
      yshift: 1,
      xanchor: 'middle',
      xref: 'x',
      x: tick,
    }));

    const calendarDays = _.flatten(_.map(bgData, (d) => d[0]));

    const calendarDayAnnotations = _.map(calendarDays, (date, index) => createAnnotation({
      align: 'left',
      font: {
        color: colors.text.calendarDates,
        size: fontSizes.dailyGlucoseProfiles.calendarDates,
      },
      text: boldText(moment.utc(date).format('D')),
      y: 1,
      yanchor: 'top',
      yref: 'paper',
      yshift: 0,
      xanchor: 'left',
      xref: 'x',
      xshift: 0,
      x: index * MS_IN_DAY,
    }));

    const data = [];
    const yAxes = [];

    const combinedData = _.flatten(_.map(bgData, (d, index) => (_.map(d[1], dayData => ({
      ...dayData,
      msPer24: dayData.msPer24 + MS_IN_DAY * index,
      bgRange: dayData.type === BGM_DATA_KEY
        ? classifyBgValue(bgPrefs.bgBounds, dayData.value)
        : undefined,
    })))));

    let lowReadings = [];
    let targetReadings = [];
    let highReadings = [];

    if (section.bgSource === CGM_DATA_KEY) {
      _.each(bgRangeKeys, (bgRange, index) => {
        const isLow = index === 0;
        const isTarget = index === 1;
        const firstDatum = _.first(combinedData);
        const lastDatum = _.last(combinedData);
        const range = [bgTicks[index], bgTicks[index + 1]];
        const fillYExentRangeIndex = isLow ? 1 : 0;

        data.push({
          name: 'rangeFill',
          type: 'scatter',
          x: isTarget
            ? [0, MS_IN_DAY * 7, MS_IN_DAY * 7, 0]
            : [firstDatum?.msPer24, ..._.map(combinedData, 'msPer24'), lastDatum?.msPer24, firstDatum?.msPer24],
          y: isTarget
            ? [range[1], range[1], range[0], range[0]]
            : [range[fillYExentRangeIndex], ..._.map(combinedData, 'value'), range[fillYExentRangeIndex], range[fillYExentRangeIndex]],
          yaxis: index === 0 ? 'y' : `y${index + 1}`,
          mode: 'none',
          fill: 'tonextx',
          fillcolor: colors.dailyGlucoseProfiles[bgRange].fill,
          line: {
            color: colors.dailyGlucoseProfiles[bgRange].line,
            simplify: false,
            width: 1,
          },
        });

        data.push({
          name: 'median',
          type: 'scatter',
          x: _.map(combinedData, 'msPer24'),
          y: _.map(combinedData, 'value'),
          yaxis: index === 0 ? 'y' : `y${index + 1}`,
          mode: 'lines',
          fill: 'none',
          line: {
            color: colors.dailyGlucoseProfiles[bgRange].line,
            simplify: false,
            width: 1,
          },
        });

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
    }

    if (section.bgSource === BGM_DATA_KEY) {
      const bgPlotRadius = 2;
      const rx = pixelsToChartScale(paperWidth, bgPlotRadius);
      const ry = pixelsToChartScale(paperHeight, bgPlotRadius);

      const renderBgReadings = bgRange => _.map(_.filter(combinedData, { bgRange }), d => ({
        type: 'circle',
        x0: d.msPer24 / (MS_IN_DAY * 7) - rx,
        x1: d.msPer24 / (MS_IN_DAY * 7) + rx,
        y0: _.min([d.value, yClamp]) / yClamp - ry,
        y1: _.min([d.value, yClamp]) / yClamp + ry,
        fillcolor: colors.bgReadings[bgRange],
        line: {
          color: colors.black,
          width: 0.25,
        },
        xref: 'paper',
        xsizemode: 'scaled',
        yref: 'paper',
        ysizemode: 'scaled',
      }));

      lowReadings = renderBgReadings('low');
      targetReadings = renderBgReadings('target');
      highReadings = renderBgReadings('high');

      data.push({
        name: 'rangeFill',
        type: 'scatter',
        x: [0, MS_IN_DAY * 7, MS_IN_DAY * 7, 0],
        y: [bgTicks[2], bgTicks[2], bgTicks[1], bgTicks[1]],
        yaxis: 'y',
        mode: 'none',
        fill: 'tonextx',
        fillcolor: colors.dailyGlucoseProfiles.target.fill,
        line: {
          color: colors.dailyGlucoseProfiles.target.line,
          simplify: false,
          width: 1,
        },
      });

      const yAxis = {
        domain: [0, 1],
        range: [0, yClamp],
        showgrid: false,
        showline: true,
        linecolor: colors.lightGrey,
        mirror: true,
        showticklabels: false,
        zeroline: false,
      };

      yAxes.push(yAxis);
    }

    const layout = {
      width: chartAreaWidth,
      height: plotHeight,
      showlegend: false,

      margin: {
        l: plotMarginX,
        r: plotMarginX,
        b: plotMarginBottom,
        t: plotMarginTop,
      },

      xaxis: {
        gridcolor: colors.line.ticks,
        linecolor: colors.line.ticks,
        range: [0, MS_IN_DAY * 7],
        showgrid: true,
        showline: false,
        showticklabels: false,
        tickvals: halfDayTicks,
        zeroline: false,
      },

      ..._.reduce(yAxes, (result, axis, index) => {
        const axisKey = index === 0 ? 'yaxis' : `yaxis${index + 1}`;
        result[axisKey] = axis; // eslint-disable-line no-param-reassign
        return result;
      }, {}),

      annotations: [
        ...bgTickAnnotations,
        ...halfDayTickAnnotations,
        ...calendarDayAnnotations,

        createAnnotation({
          font: {
            color: colors.text.ticks.bg,
            size: fontSizes.dailyGlucoseProfiles.bgUnits,
          },
          text: boldText(bgPrefs?.bgUnits),
          textangle: 270,
          x: 0,
          xanchor: 'right',
          xref: 'paper',
          xshift: -18,
          y: _.mean(_.slice(bgTicks, 1, 3)) / yClamp,
          yanchor: 'middle',
          yref: 'paper',
          yshift: 0,
        }),
      ],

      shapes: [
        ...bgGridLines,
        ...targetReadings,
        ...lowReadings,
        ...highReadings,
      ],
    };

    const figure = {
      data: [
        ...data,
        // Dummy data to ensure that all axes render (plotly will not render axes lines if empty)
        ..._.map(yAxes, (axis, i) => ({ visible: false, yaxis: i === 0 ? 'y' : `y${i + 1}` })),
      ],
      layout,
    };

    return figure;
  }

  return null;
};
