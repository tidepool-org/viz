import _ from 'lodash';
import moment from 'moment-timezone';

import { getStatDefinition } from '../stat';
import { getTimezoneFromTimePrefs } from '../datetime';
import { CGM_DATA_KEY } from '../constants';

import {
  generateAmbulatoryGlucoseProfileFigure,
  generateChartSections,
  generateDailyGlucoseProfilesFigure,
  generatePercentInRangesFigure,
} from '../../modules/print/utils/AGPUtils';

/**
 * generateAGPFigureDefinitions
 * @param {Object} data - Data as provided by DataUtil from AGP pdf query
 */
export async function generateAGPFigureDefinitions(data) {
  const svgDataURLS = {};
  const bgSource = _.get(data, 'metaData.bgSources.current');
  const endpoints = _.get(data, 'data.current.endpoints', {});
  const sections = generateChartSections(data, bgSource);

  // Generate SVG data urls from Plotly figures
  const stats = {};
  const statsData = _.get(data, 'data.current.stats', {});
  _.forOwn(statsData, (statData, statType) => {
    const stat = getStatDefinition(statData, statType, {
      bgSource,
      days: endpoints.activeDays || endpoints.days,
      bgPrefs: data.bgPrefs,
    });
    stats[statType] = stat;
  });

  const percentInRangesStat = bgSource === CGM_DATA_KEY ? stats.timeInRange : stats.readingsInRange;

  // Generate percentInRanges figure
  if (sections.percentInRanges?.sufficientData) {
    svgDataURLS.percentInRanges = generatePercentInRangesFigure(sections.percentInRanges, percentInRangesStat, data.bgPrefs);
  }

  // Generate ambulatoryGlucoseProfile figure
  if (sections.ambulatoryGlucoseProfile.sufficientData) {
    const bgData = data?.data?.current?.data?.[bgSource] || [];
    svgDataURLS.ambulatoryGlucoseProfile = generateAmbulatoryGlucoseProfileFigure(sections.ambulatoryGlucoseProfile, bgData, data.bgPrefs, bgSource);
  }

  // Generate dailyGlucoseProfiles figures
  if (sections.dailyGlucoseProfiles.sufficientData) {
    const bgDataByDate = _.mapValues(data?.data?.current?.aggregationsByDate?.dataByDate, bgSource);
    // Group daily data by week
    const { newestDatum } = stats.bgExtents?.data?.raw || {};

    const weeklyDates = _.chunk(_.map(_.range(14), (val, index) => (
      moment.utc(newestDatum?.time).tz(getTimezoneFromTimePrefs(data.timePrefs)).subtract(index, 'days').format('YYYY-MM-DD')
    )).reverse(), 7);

    const week1Data = _.map(weeklyDates[0], date => ([[date], bgDataByDate[date]]));
    const week2Data = _.map(weeklyDates[1], date => ([[date], bgDataByDate[date]]));

    svgDataURLS.dailyGlucoseProfiles = [
      generateDailyGlucoseProfilesFigure(sections.dailyGlucoseProfiles, week1Data, data.bgPrefs, 'dddd'),
      generateDailyGlucoseProfilesFigure(sections.dailyGlucoseProfiles, week2Data, data.bgPrefs, 'ha'),
    ];
  }

  return svgDataURLS;
}
