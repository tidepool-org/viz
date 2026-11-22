import _ from 'lodash';
import moment from 'moment-timezone';
import * as AGPUtils from '../../../../src/modules/print/utils/AGPUtils';
import { colors, AGP_FONT_FAMILY } from '../../../../src/modules/print/utils/AGPConstants';


import { agpStatsByDate, createAGPData, toStatsBy24hPeriod } from '../../../../data/print/fixtures';
import { types as Types, generateGUID } from '../../../../data/types';
import DataUtil from '../../../../src/utils/DataUtil';
import { BGM_DATA_KEY, CGM_DATA_KEY, MGDL_UNITS, MS_IN_MIN } from '../../../../src/utils/constants';

const cbgAGPData = createAGPData(CGM_DATA_KEY);
const smbgAGPData = createAGPData(BGM_DATA_KEY);

describe('AGPUtils', () => {
  describe('boldText', () => {
    it('should wrap the provided value in bold tags', () => {
      expect(AGPUtils.boldText('foo')).to.equal('<b>foo</b>');
      expect(AGPUtils.boldText(100)).to.equal('<b>100</b>');
    });
  });

  describe('chartScaleToPixels', () => {
    it('should convert a chart scale position to a pixel value based on the chart paper height', () => {
      const paperHeight = 200;
      expect(AGPUtils.chartScaleToPixels(paperHeight, 0.5)).to.equal(100);
    });
  });

  describe('pixelsToChartScale', () => {
    it('should convert pixel value to a chart scale position based on the chart paper height', () => {
      const paperHeight = 200;
      expect(AGPUtils.pixelsToChartScale(paperHeight, 100)).to.equal(0.5);
    });
  });

  describe('pointsToPixels', () => {
    it('should convert points values to pixels', () => {
      const points = 100;
      expect(AGPUtils.pointsToPixels(points)).to.equal(75);
    });
  });

  describe('createAnnotation', () => {
    it('should extend an annotation definition with default properties', () => {
      const annotation1 = {
        foo: 'bar',
      };

      expect(AGPUtils.createAnnotation(annotation1)).to.eql({
        foo: 'bar',
        arrowside: 'none',
        font: {
          color: colors.black,
          family: AGP_FONT_FAMILY,
        },
        showarrow: false,
      });

      const annotation2 = {
        foo: 'bar',
        showarrow: true,
        arrowside: 'right',
      };

      expect(AGPUtils.createAnnotation(annotation2)).to.eql({
        foo: 'bar',
        arrowside: 'right',
        font: {
          color: colors.black,
          family: AGP_FONT_FAMILY,
        },
        showarrow: true,
      });
    });
  });

  describe('calculateCGMDataSufficiency', () => {
    const lessThan24HrsData = _.cloneDeep(cbgAGPData);
    lessThan24HrsData.data.current.stats.sensorUsage.sampleInterval = MS_IN_MIN * 60;
    lessThan24HrsData.data.current.stats.sensorUsage.count = 23;

    const sensorUSage70Percent24HrsData = _.cloneDeep(cbgAGPData);
    sensorUSage70Percent24HrsData.data.current.stats.sensorUsage.sampleInterval = MS_IN_MIN * 60;
    sensorUSage70Percent24HrsData.data.current.stats.sensorUsage.count = 24;
    sensorUSage70Percent24HrsData.data.current.stats.sensorUsage.sensorUsageAGP = 70;

    const sensorUSage69Percent24HrsData = _.cloneDeep(sensorUSage70Percent24HrsData);
    sensorUSage69Percent24HrsData.data.current.stats.sensorUsage.sensorUsageAGP = 69;

    // The fixture's 24-hour periods, keyed by the UTC ISO timestamp of their US/Eastern start
    const getPeriodKey = (date, startHour = 0) => moment.tz(date, 'US/Eastern').hour(startHour).toISOString();
    const getStatsBy24hPeriod = data => data.data.current.aggregationsByDate.statsBy24hPeriod;

    // Data worn for only the 7 periods from 2023-03-10 to 2023-03-16
    const withOnly7PeriodsWorn = data => {
      data.data.current.stats.bgExtents.bg24hPeriodsWorn = 7; // eslint-disable-line no-param-reassign
      _.each(['2023-03-03', '2023-03-04', '2023-03-05', '2023-03-06', '2023-03-07', '2023-03-08', '2023-03-09'], date => {
        delete getStatsBy24hPeriod(data)[getPeriodKey(date)]; // eslint-disable-line no-param-reassign
      });
      return data;
    };

    const top7DaysLessThan1HourDataEach = withOnly7PeriodsWorn(_.cloneDeep(cbgAGPData));
    getStatsBy24hPeriod(top7DaysLessThan1HourDataEach)[getPeriodKey('2023-03-16')].stats.sensorUsage.count = 0;
    sensorUSage69Percent24HrsData.data.current.stats.sensorUsage.sensorUsageAGP = 69;

    const exactly7DaysGreaterThan1HourDataEach = withOnly7PeriodsWorn(_.cloneDeep(cbgAGPData));

    const top7DaysLessThan70PercentMeanUsage = _.cloneDeep(cbgAGPData);
    delete getStatsBy24hPeriod(top7DaysLessThan70PercentMeanUsage)[getPeriodKey('2023-03-16')];
    _.each(getStatsBy24hPeriod(top7DaysLessThan70PercentMeanUsage), ({ stats }) => {
      const maxPossibleReadings = 288;
      stats.sensorUsage.count = maxPossibleReadings * 0.69; // eslint-disable-line no-param-reassign
    });

    // A 7-period window offset from midnight: the periods run 10:00 - 10:00 US/Eastern, ending
    // 2023-03-17 10:00 EDT. The newest datum falls on 2023-03-17, within the last period.
    const tenHours = MS_IN_MIN * 60 * 10;
    const exactly7OffsetPeriodsGreaterThan1HourDataEach = _.cloneDeep(cbgAGPData);
    exactly7OffsetPeriodsGreaterThan1HourDataEach.data.current.endpoints = {
      range: [1678424400000 + tenHours, 1679025600000 + tenHours],
      days: 7,
      activeDays: 7,
    };
    exactly7OffsetPeriodsGreaterThan1HourDataEach.data.current.stats.bgExtents.bg24hPeriodsWorn = 7;
    exactly7OffsetPeriodsGreaterThan1HourDataEach.data.current.stats.bgExtents.newestDatum.time = 1679059365000; // 2023-03-17 09:22:45 EDT
    exactly7OffsetPeriodsGreaterThan1HourDataEach.data.current.aggregationsByDate.statsBy24hPeriod = toStatsBy24hPeriod(
      _.omit(_.cloneDeep(agpStatsByDate), ['2023-03-03', '2023-03-04', '2023-03-05', '2023-03-06', '2023-03-07', '2023-03-08', '2023-03-09']),
      { startHour: 10 },
    );
    getStatsBy24hPeriod(exactly7OffsetPeriodsGreaterThan1HourDataEach)[getPeriodKey('2023-03-16', 10)].stats.bgExtents.newestDatum.time = 1679059365000;
    getStatsBy24hPeriod(exactly7OffsetPeriodsGreaterThan1HourDataEach)[getPeriodKey('2023-03-10', 10)].stats.bgExtents.oldestDatum.time = 1678460554000; // 2023-03-10 10:02:34 EST

    // A 14-day range whose newest datum falls 3 days before the end of the range, with exactly 7
    // periods worn: 2023-03-07 through 2023-03-13
    const exactly7PeriodsEndingBeforeRangeEnd = _.cloneDeep(cbgAGPData);
    exactly7PeriodsEndingBeforeRangeEnd.data.current.stats.bgExtents.bg24hPeriodsWorn = 7;
    exactly7PeriodsEndingBeforeRangeEnd.data.current.stats.bgExtents.newestDatum = _.cloneDeep(
      getStatsBy24hPeriod(exactly7PeriodsEndingBeforeRangeEnd)[getPeriodKey('2023-03-13')].stats.bgExtents.newestDatum
    );
    _.each(['2023-03-03', '2023-03-04', '2023-03-05', '2023-03-06', '2023-03-14', '2023-03-15', '2023-03-16'], date => {
      delete getStatsBy24hPeriod(exactly7PeriodsEndingBeforeRangeEnd)[getPeriodKey(date)];
    });

    context('fully sufficient data', () => {
      it('should return `true` for all sections ', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(cbgAGPData)).to.eql({
          ambulatoryGlucoseProfile: true,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });

    context('less than 24 hrs data', () => {
      it('should return `false` for all sections ', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(lessThan24HrsData)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: false,
          glucoseMetrics: false,
          percentInRanges: false,
        });
      });
    });

    context('24 hrs data', () => {
      it('should return `false` for agp, true for other sections if sensor usage >= 70% ', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(sensorUSage70Percent24HrsData)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });

        expect(AGPUtils.calculateCGMDataSufficiency(sensorUSage69Percent24HrsData)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: false,
          glucoseMetrics: false,
          percentInRanges: false,
        });
      });
    });

    context('less than 7 days with at least 1 hour of cgm data', () => {
      it('should return `false` for agp, true for other sections', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(top7DaysLessThan1HourDataEach)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });

    context('exactly 7 days with greater 1 hour of cgm data', () => {
      it('should return `true` for agp, true for other sections', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(exactly7DaysGreaterThan1HourDataEach)).to.eql({
          ambulatoryGlucoseProfile: true,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });

    context('top 7 days have at least 1 hour of cgm data, but less than 70% mean sensor usage', () => {
      it('should return `false` for agp, true for other sections', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(top7DaysLessThan70PercentMeanUsage)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });

    context('exactly 7 24-hour periods offset from midnight with greater than 1 hour of cgm data each', () => {
      it('should assess the 24-hour periods of the queried range rather than calendar dates', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(exactly7OffsetPeriodsGreaterThan1HourDataEach)).to.eql({
          ambulatoryGlucoseProfile: true,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });
    context('exactly 7 24-hour periods ending before the end of the queried range', () => {
      it('should assess the periods ending with the one containing the newest datum', () => {
        expect(AGPUtils.calculateCGMDataSufficiency(exactly7PeriodsEndingBeforeRangeEnd)).to.eql({
          ambulatoryGlucoseProfile: true,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });

    context('7 24-hour periods offset from midnight, queried from DataUtil, with data beginning after midnight in the first period', () => {
      const timePrefs = { timezoneAware: true, timezoneName: 'US/Eastern' };

      // cbg readings every 5 minutes from Oct 14 02:00 EDT to Oct 20 15:20 EDT
      const cbgData = _.map(
        _.range(Date.parse('2025-10-14T06:00:00.000Z'), Date.parse('2025-10-20T19:25:00.000Z'), MS_IN_MIN * 5),
        time => ({
          ..._.toPlainObject(new Types.CBG({ deviceTime: new Date(time).toISOString().slice(0, 19), raw: true })),
          id: generateGUID(),
        }),
      );

      // 7 periods from Oct 13 16:00 EDT to Oct 20 16:00 EDT. The first period's data all falls on
      // Oct 14, after midnight.
      const queryAGPData = aggregationsByDate => {
        const dataUtil = new DataUtil();
        dataUtil.addData(cbgData, 'patient-1');

        return dataUtil.query({
          endpoints: [Date.parse('2025-10-13T20:00:00.000Z'), Date.parse('2025-10-20T20:00:00.000Z')],
          aggregationsByDate,
          bgSource: CGM_DATA_KEY,
          stats: ['bgExtents', 'sensorUsage'],
          types: { cbg: {} },
          bgPrefs: { bgUnits: MGDL_UNITS },
          timePrefs,
        });
      };

      it('should assess the first period using the data it contains when stats by 24-hour period are queried', () => {
        const result = queryAGPData('dataByDate, statsBy24hPeriod');

        expect(result.data.current.stats.bgExtents.bg24hPeriodsWorn).to.equal(7);
        expect(_.keys(result.data.current.aggregationsByDate.statsBy24hPeriod)).to.have.lengthOf(7);

        expect(AGPUtils.calculateCGMDataSufficiency({ ...result, timePrefs })).to.eql({
          ambulatoryGlucoseProfile: true,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });

      it('should treat every period as having no data when stats by 24-hour period are not queried', () => {
        const result = queryAGPData('dataByDate, statsByDate');

        expect(result.data.current.aggregationsByDate.statsBy24hPeriod).to.be.undefined;

        expect(AGPUtils.calculateCGMDataSufficiency({ ...result, timePrefs })).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });
  });

  describe('calculateBGMDataSufficiency', () => {
    let bgData;

    beforeEach(() => {
      bgData = _.cloneDeep(smbgAGPData);
    });

    context('at least 30 readings', () => {
      it('should return `true` for all sections ', () => {
        bgData.data.current.data.smbg.length = 30;

        expect(AGPUtils.calculateBGMDataSufficiency(bgData)).to.eql({
          ambulatoryGlucoseProfile: true,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });

    context('between 1 and 30 readings', () => {
      it('should return `true` for all sections except ambulatoryGlucoseProfile', () => {
        bgData.data.current.data.smbg.length = 29;

        expect(AGPUtils.calculateBGMDataSufficiency(bgData)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });

        bgData.data.current.data.smbg.length = 1;

        expect(AGPUtils.calculateBGMDataSufficiency(bgData)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: true,
          glucoseMetrics: true,
          percentInRanges: true,
        });
      });
    });

    context('no readings', () => {
      it('should return `false` for all sections ', () => {
        bgData.data.current.data.smbg.length = 0;

        expect(AGPUtils.calculateBGMDataSufficiency(bgData)).to.eql({
          ambulatoryGlucoseProfile: false,
          dailyGlucoseProfiles: false,
          glucoseMetrics: false,
          percentInRanges: false,
        });
      });
    });
  });

  describe('generateChartSections', () => {
    it('should generate the `percentInRanges` section metadata', () => {
      expect(AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).percentInRanges).to.be.an('object').and.have.keys([
        'x',
        'y',
        'width',
        'height',
        'bordered',
        'text',
        'sufficientData',
        'bgSource',
      ]);
    });

    it('should generate the `reportInfo` section metadata', () => {
      expect(AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).reportInfo).to.be.an('object').and.have.keys([
        'x',
        'y',
        'width',
        'height',
        'text',
        'bgSource',
      ]);
    });

    it('should generate the `glucoseMetrics` section metadata', () => {
      expect(AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).glucoseMetrics).to.be.an('object').and.have.keys([
        'x',
        'y',
        'width',
        'height',
        'bordered',
        'text',
        'sufficientData',
        'bgSource',
      ]);
    });

    it('should generate the `ambulatoryGlucoseProfile` section metadata', () => {
      expect(AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).ambulatoryGlucoseProfile).to.be.an('object').and.have.keys([
        'x',
        'y',
        'width',
        'height',
        'bordered',
        'text',
        'sufficientData',
        'bgSource',
      ]);
    });

    it('should generate the `dailyGlucoseProfiles` section metadata', () => {
      expect(AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).dailyGlucoseProfiles).to.be.an('object').and.have.keys([
        'x',
        'y',
        'width',
        'height',
        'bordered',
        'text',
        'sufficientData',
        'bgSource',
      ]);
    });
  });

  describe('generatePercentInRangesFigure', () => {
    context('CGM report', () => {
      it('should return the time in ranges plotly figure if sufficient data is provided', () => {
        const section = AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).percentInRanges;
        const stat = cbgAGPData.data.current.stats.timeInRange;
        const bgPrefs = cbgAGPData.bgPrefs;
        const figure = AGPUtils.generatePercentInRangesFigure(section, stat, bgPrefs);
        expect(figure).to.be.an('object').and.have.keys(['data', 'layout']);
        expect(figure.data).to.be.an('array');

        expect(figure.layout).to.be.an('object').and.have.keys([
          'barmode',
          'width',
          'height',
          'showlegend',
          'margin',
          'xaxis',
          'yaxis',
          'annotations',
          'shapes',
        ]);
      });

      it('should return `null` if data provided is insufficient', () => {
        const section = {
          ...AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).percentInRanges,
          sufficientData: false,
        };

        const stat = cbgAGPData.data.current.stats.timeInRange;
        const bgPrefs = cbgAGPData.bgPrefs;
        const figure = AGPUtils.generatePercentInRangesFigure(section, stat, bgPrefs);
        expect(figure).to.be.null;
      });
    });

    context('BGM report', () => {
      it('should return the time in ranges plotly figure if sufficient data is provided', () => {
        const section = AGPUtils.generateChartSections(smbgAGPData, BGM_DATA_KEY).percentInRanges;
        const stat = smbgAGPData.data.current.stats.readingsInRange;
        const bgPrefs = smbgAGPData.bgPrefs;
        const figure = AGPUtils.generatePercentInRangesFigure(section, stat, bgPrefs);
        expect(figure).to.be.an('object').and.have.keys(['data', 'layout']);
        expect(figure.data).to.be.an('array');

        expect(figure.layout).to.be.an('object').and.have.keys([
          'barmode',
          'width',
          'height',
          'showlegend',
          'margin',
          'xaxis',
          'yaxis',
          'annotations',
          'shapes',
        ]);
      });

      it('should return `null` if data provided is insufficient', () => {
        const section = {
          ...AGPUtils.generateChartSections(smbgAGPData, BGM_DATA_KEY).percentInRanges,
          sufficientData: false,
        };

        const stat = smbgAGPData.data.current.stats.readingsInRange;
        const bgPrefs = smbgAGPData.bgPrefs;
        const figure = AGPUtils.generatePercentInRangesFigure(section, stat, bgPrefs);
        expect(figure).to.be.null;
      });
    });
  });

  describe('generateAmbulatoryGlucoseProfileFigure', () => {
    context('CGM report', () => {
      it('should return the ambulatory glucose profile plotly figure if sufficient data is provided', () => {
        const section = AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).ambulatoryGlucoseProfile;
        const bgData = cbgAGPData.data.current.data.cbg;
        const bgPrefs = cbgAGPData.bgPrefs;
        const figure = AGPUtils.generateAmbulatoryGlucoseProfileFigure(section, bgData, bgPrefs, CGM_DATA_KEY);
        expect(figure).to.be.an('object').and.have.keys(['data', 'layout']);
        expect(figure.data).to.be.an('array');

        expect(figure.layout).to.be.an('object').and.have.keys([
          'width',
          'height',
          'showlegend',
          'margin',
          'xaxis',
          'xaxis2',
          'yaxis',
          'yaxis2',
          'yaxis3',
          'yaxis4',
          'yaxis5',
          'annotations',
          'shapes',
        ]);
      });
    });

    context('BGM report', () => {
      it('should return the ambulatory glucose profile plotly figure if sufficient data is provided', () => {
        const section = AGPUtils.generateChartSections(smbgAGPData, BGM_DATA_KEY).ambulatoryGlucoseProfile;
        const bgData = smbgAGPData.data.current.data.smbg;
        const bgPrefs = smbgAGPData.bgPrefs;
        const figure = AGPUtils.generateAmbulatoryGlucoseProfileFigure(section, bgData, bgPrefs, BGM_DATA_KEY);
        expect(figure).to.be.an('object').and.have.keys(['data', 'layout']);
        expect(figure.data).to.be.an('array');

        expect(figure.layout).to.be.an('object').and.have.keys([
          'width',
          'height',
          'showlegend',
          'margin',
          'xaxis',
          'xaxis2',
          'yaxis',
          'yaxis2',
          'yaxis3',
          'yaxis4',
          'yaxis5',
          'annotations',
          'shapes',
        ]);
      });
    });
  });

  describe('generateDailyGlucoseProfilesFigure', () => {
    context('CGM report', () => {
      it('should return a daily glucose profile plotly figure if sufficient data is provided', () => {
        const section = AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).dailyGlucoseProfiles;

        const bgData = [
          ['2023-01-01', [{ value: 10, msPer24: 100000 }]],
          ['2023-01-02', [{ value: 20, msPer24: 200000 }]],
          ['2023-01-03', [{ value: 30, msPer24: 300000 }]],
          ['2023-01-04', [{ value: 40, msPer24: 400000 }]],
          ['2023-01-05', [{ value: 50, msPer24: 500000 }]],
          ['2023-01-06', [{ value: 60, msPer24: 600000 }]],
          ['2023-01-07', [{ value: 70, msPer24: 700000 }]],
        ];

        const bgPrefs = cbgAGPData.bgPrefs;
        const dateLabelFormat = 'h:a';
        const figure = AGPUtils.generateDailyGlucoseProfilesFigure(section, bgData, bgPrefs, dateLabelFormat);
        expect(figure).to.be.an('object').and.have.keys(['data', 'layout']);
        expect(figure.data).to.be.an('array');

        expect(figure.layout).to.be.an('object').and.have.keys([
          'width',
          'height',
          'showlegend',
          'margin',
          'xaxis',
          'yaxis',
          'yaxis2',
          'yaxis3',
          'annotations',
          'shapes',
        ]);
      });

      it('should return `null` if data provided is insufficient', () => {
        const section = {
          ...AGPUtils.generateChartSections(cbgAGPData, CGM_DATA_KEY).dailyGlucoseProfiles,
          sufficientData: false,
        };

        const bgData = [
          ['2023-01-01', [{ value: 10, msPer24: 100000 }]],
          ['2023-01-02', [{ value: 20, msPer24: 200000 }]],
          ['2023-01-03', [{ value: 30, msPer24: 300000 }]],
          ['2023-01-04', [{ value: 40, msPer24: 400000 }]],
          ['2023-01-05', [{ value: 50, msPer24: 500000 }]],
          ['2023-01-06', [{ value: 60, msPer24: 600000 }]],
          ['2023-01-07', [{ value: 70, msPer24: 700000 }]],
        ];

        const bgPrefs = cbgAGPData.bgPrefs;
        const dateLabelFormat = 'h:a';
        const figure = AGPUtils.generateDailyGlucoseProfilesFigure(section, bgData, bgPrefs, dateLabelFormat);
        expect(figure).to.be.null;
      });
    });

    context('BGM report', () => {
      it('should return a daily glucose profile plotly figure if sufficient data is provided', () => {
        const section = AGPUtils.generateChartSections(smbgAGPData, BGM_DATA_KEY).dailyGlucoseProfiles;

        const bgData = [
          ['2023-01-01', [{ value: 10, msPer24: 100000 }]],
          ['2023-01-02', [{ value: 20, msPer24: 200000 }]],
          ['2023-01-03', [{ value: 30, msPer24: 300000 }]],
          ['2023-01-04', [{ value: 40, msPer24: 400000 }]],
          ['2023-01-05', [{ value: 50, msPer24: 500000 }]],
          ['2023-01-06', [{ value: 60, msPer24: 600000 }]],
          ['2023-01-07', [{ value: 70, msPer24: 700000 }]],
        ];

        const bgPrefs = smbgAGPData.bgPrefs;
        const dateLabelFormat = 'h:a';
        const figure = AGPUtils.generateDailyGlucoseProfilesFigure(section, bgData, bgPrefs, dateLabelFormat);
        expect(figure).to.be.an('object').and.have.keys(['data', 'layout']);
        expect(figure.data).to.be.an('array');

        expect(figure.layout).to.be.an('object').and.have.keys([
          'width',
          'height',
          'showlegend',
          'margin',
          'xaxis',
          'yaxis',
          'annotations',
          'shapes',
        ]);
      });

      it('should return `null` if data provided is insufficient', () => {
        const section = {
          ...AGPUtils.generateChartSections(smbgAGPData, BGM_DATA_KEY).dailyGlucoseProfiles,
          sufficientData: false,
        };

        const bgData = [];
        const bgPrefs = smbgAGPData.bgPrefs;
        const dateLabelFormat = 'h:a';
        const figure = AGPUtils.generateDailyGlucoseProfilesFigure(section, bgData, bgPrefs, dateLabelFormat);
        expect(figure).to.be.null;
      });
    });
  });
});
