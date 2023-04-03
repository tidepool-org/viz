import _ from 'lodash';
import moment from 'moment-timezone';
import Plotly from 'plotly.js-dist-min';

import { getStatDefinition } from '../stat';
import { getTimezoneFromTimePrefs } from '../datetime';

import {
  generateAmbulatoryGlucoseProfileFigure,
  generateChartSections,
  generateDailyGlucoseProfilesFigure,
  generateTimeInRangesFigure,
} from '../../modules/print/utils/AGPUtils';

/**
 * generateAGPSVGDataURLS
 * @param {Object} data - Data as provided by DataUtil from AGP pdf query
 */
export async function generateAGPSVGDataURLS(data) {
  const svgDataURLS = {};
  const endpoints = _.get(data, 'data.current.endpoints', {});
  const manufacturer = _.get(data, 'metaData.latestPumpUpload.manufacturer');
  const sections = generateChartSections(data);

  // Generate SVG data urls from Plotly figures
  const stats = {};
  const statsData = _.get(data, 'data.current.stats', {});
  _.forOwn(statsData, (statData, statType) => {
    const stat = getStatDefinition(statData, statType, {
      bgSource: data.bgPrefs?.bgSource,
      days: endpoints.activeDays || endpoints.days,
      bgPrefs: data.bgPrefs,
      manufacturer,
    });
    stats[statType] = stat;
  });

  // Generate timeInRanges figure
  if (sections.timeInRanges.sufficientData) {
    svgDataURLS.timeInRanges = await Plotly.toImage(
      generateTimeInRangesFigure(sections.timeInRanges, stats.timeInRange, data.bgPrefs),
      { format: 'svg' }
    );
  }

  // Generate ambulatoryGlucoseProfile figure
  if (sections.ambulatoryGlucoseProfile.sufficientData) {
    const cbgData = data?.data?.current?.data?.cbg || [];
    svgDataURLS.ambulatoryGlucoseProfile = await Plotly.toImage(
      generateAmbulatoryGlucoseProfileFigure(sections.ambulatoryGlucoseProfile, cbgData, data.bgPrefs),
      { format: 'svg' }
    );
  }

  // Generate dailyGlucoseProfiles figures
  if (sections.dailyGlucoseProfiles.sufficientData) {
    const cbgDataByDate = _.mapValues(data?.data?.current?.aggregationsByDate?.dataByDate, 'cbg');

    // Group daily data by week
    const { newestDatum } = stats.sensorUsage?.data?.raw || {};

    const weeklyDates = _.chunk(_.map(_.range(14), (val, index) => (
      moment.utc(newestDatum.time).tz(getTimezoneFromTimePrefs(data.timePrefs)).subtract(index, 'days').format('YYYY-MM-DD')
    )).reverse(), 7);

    const week1Data = _.map(weeklyDates[0], date => ([[date], cbgDataByDate[date]]));
    const week2Data = _.map(weeklyDates[1], date => ([[date], cbgDataByDate[date]]));

    svgDataURLS.dailyGlucoseProfiles = [
      await Plotly.toImage(
        generateDailyGlucoseProfilesFigure(sections.dailyGlucoseProfiles, week1Data, data.bgPrefs, 'dddd'),
        { format: 'svg' }
      ),
      await Plotly.toImage(
        generateDailyGlucoseProfilesFigure(sections.dailyGlucoseProfiles, week2Data, data.bgPrefs, 'ha'),
        { format: 'svg' }
      ),
    ];
  }

  return svgDataURLS;
}
