import _ from 'lodash';
import * as AGPUtils from '../../../../src/modules/print/utils/AGPUtils';
import { colors, AGP_FONT_FAMILY } from '../../../../src/modules/print/utils/AGPConstants';


import { createAGPData } from '../../../../data/print/fixtures';
import { BGM_DATA_KEY, CGM_DATA_KEY, MS_IN_MIN } from '../../../../src/utils/constants';

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

    const top7DaysLessThan1HourDataEach = _.cloneDeep(cbgAGPData);
    top7DaysLessThan1HourDataEach.data.current.stats.bgExtents.bgDaysWorn = 7;
    top7DaysLessThan1HourDataEach.data.current.aggregationsByDate.statsByDate['2023-03-16'].sensorUsage.count = 0;
    sensorUSage69Percent24HrsData.data.current.stats.sensorUsage.sensorUsageAGP = 69;

    const exactly7DaysGreaterThan1HourDataEach = _.cloneDeep(cbgAGPData);
    exactly7DaysGreaterThan1HourDataEach.data.current.stats.bgExtents.bgDaysWorn = 7;

    const top7DaysLessThan70PercentMeanUsage = _.cloneDeep(cbgAGPData);
    delete top7DaysLessThan70PercentMeanUsage.data.current.aggregationsByDate.statsByDate['2023-03-16'];
    _.each(top7DaysLessThan70PercentMeanUsage.data.current.aggregationsByDate.statsByDate, (stats, date) => {
      const maxPossibleReadings = 288;
      top7DaysLessThan70PercentMeanUsage.data.current.aggregationsByDate.statsByDate[date].sensorUsage.count = maxPossibleReadings * 0.69;
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
