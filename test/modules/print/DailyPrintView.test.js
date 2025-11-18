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

import _ from 'lodash';
import moment from 'moment';

import DailyPrintView from '../../../src/modules/print/DailyPrintView';
import PrintView from '../../../src/modules/print/PrintView';
import * as patients from '../../../data/patient/profiles';
import { dailyData as data } from '../../../data/print/fixtures';

import {
  DEFAULT_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
} from '../../../src/modules/print/utils/constants';

import { getBasalPathGroups } from '../../../src/utils/basal';
import { formatDecimalNumber, formatBgValue } from '../../../src/utils/format';

import Doc from '../../helpers/pdfDoc';
import { MS_IN_HOUR, MMOLL_UNITS, DEFAULT_BG_BOUNDS, ADA_OLDER_HIGH_RISK_BG_BOUNDS } from '../../../src/utils/constants';

describe.only('DailyPrintView', () => {
  let Renderer;
  const sampleDate = '2017-01-02';

  const DPI = 72;
  const MARGIN = DPI / 2;

  let doc;

  const opts = {
    chartsPerPage: 3,
    debug: false,
    dpi: DPI,
    defaultFontSize: DEFAULT_FONT_SIZE,
    footerFontSize: FOOTER_FONT_SIZE,
    headerFontSize: HEADER_FONT_SIZE,
    largeFontSize: LARGE_FONT_SIZE,
    smallFontSize: SMALL_FONT_SIZE,
    extraSmallFontSize: EXTRA_SMALL_FONT_SIZE,
    height: 11 * DPI - (2 * MARGIN),
    margins: {
      left: MARGIN,
      top: MARGIN,
      right: MARGIN,
      bottom: MARGIN,
    },
    patient: patients.standard,
    summaryHeaderFontSize: 10,
    summaryWidthAsPercentage: 0.18,
    width: 8.5 * DPI - (2 * MARGIN),
    title: 'Daily View',
  };

  const mmollBgPrefs = {
    bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
    bgClasses: {
      'very-low': { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryLowThreshold },
      low: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].targetLowerBound },
      target: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].targetUpperBound },
      high: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryHighThreshold },
    },
    bgUnits: MMOLL_UNITS,
  };

  beforeEach(() => {
    doc = new Doc({ margin: MARGIN });
    Renderer = new DailyPrintView(doc, data, opts);
  });

  describe('class constructor', () => {
    it('should instantiate without errors', () => {
      expect(Renderer).to.be.an('object');
    });

    it('should extend the `PrintView` class', () => {
      expect(Renderer instanceof PrintView).to.be.true;
    });

    it('should set it\'s own required initial instance properties', () => {
      const requiredProps = [
        { prop: 'font', type: 'string' },
        { prop: 'boldFont', type: 'string' },
        { prop: 'bgAxisFontSize', type: 'number' },
        { prop: 'carbsFontSize', type: 'number' },
        { prop: 'summaryHeaderFontSize', type: 'number' },
        { prop: 'chartsPerPage', type: 'number', value: opts.chartsPerPage },
        { prop: 'numDays', type: 'number', value: data.data.current.endpoints.activeDays },
        { prop: 'bolusWidth', type: 'number' },
        { prop: 'bolusRange', type: 'array' },
        { prop: 'bgRange', type: 'array' },
        { prop: 'basalRange', type: 'array' },
        { prop: 'carbRadius', type: 'number' },
        { prop: 'cbgRadius', type: 'number' },
        { prop: 'markerRadius', type: 'number' },
        { prop: 'extendedLineThickness', type: 'number' },
        { prop: 'interruptedLineThickness', type: 'number' },
        { prop: 'smbgRadius', type: 'number' },
        { prop: 'triangleHeight', type: 'number' },
        { prop: 'initialTotalPages', type: 'number', value: 0 },
        { prop: 'initialChartsPlaced', type: 'number', value: 0 },
        { prop: 'initialChartIndex', type: 'number', value: 0 },
        { prop: 'colors', type: 'object' },
        { prop: 'gapBtwnSummaryAndChartAsPercentage', type: 'number' },
        { prop: 'rightEdge', type: 'number', value: Renderer.margins.left + Renderer.width },
        { prop: 'bottomEdge', type: 'number', value: Renderer.margins.top + Renderer.height },
        { prop: 'patientInfoBox', type: 'object', value: {
          width: 0,
          height: 0,
        } },
        { prop: 'summaryArea', type: 'object', value: {
          rightEdge: opts.margins.left + opts.summaryWidthAsPercentage * Renderer.width,
          width: (opts.margins.left + opts.summaryWidthAsPercentage * Renderer.width)
                 - Renderer.margins.left,
        } },
        { prop: 'chartArea', type: 'object' },
        { prop: 'isAutomatedBasalDevice', type: 'boolean' },
        { prop: 'isAutomatedBolusDevice', type: 'boolean' },
        { prop: 'hasCarbExchanges', type: 'boolean' },
        { prop: 'basalGroupLabels', type: 'object' },
        { prop: 'pumpSettingsOverrideLabels', type: 'object' },
        { prop: 'legendItems', type: 'array' },
        { prop: 'initialChartArea', type: 'object', value: {
          bottomEdge: opts.margins.top + opts.height,
          leftEdge: opts.margins.left +
          (opts.summaryWidthAsPercentage + Renderer.gapBtwnSummaryAndChartAsPercentage) *
          Renderer.width,
          topEdge: opts.margins.top,
          width: Renderer.rightEdge - (opts.margins.left +
          (opts.summaryWidthAsPercentage + Renderer.gapBtwnSummaryAndChartAsPercentage) *
          Renderer.width),
        } },
      ];

      _.each(requiredProps, item => {
        expect(Renderer[item.prop]).to.be.a(item.type);
        item.hasOwnProperty('value') && expect(Renderer[item.prop]).to.eql(item.value);
      });

      _.each(_.keys(data.dataByDate), date => {
        expect(Renderer.initialChartsByDate[date]).to.eql(data.dataByDate[date]);
      });
    });

    it('should kick off the dynamic calculation of chart area based on header and footer', () => {
      expect(Renderer.chartArea.bottomEdge).to.not.eql(Renderer.initialChartArea.bottomEdge);
      expect(Renderer.chartArea.topEdge).to.not.eql(Renderer.initialChartArea.topEdge);

      expect(Renderer.chartMinimums).to.be.an('object');
    });

    it('should assign the newPage function as a callback to the doc\'s pageAdded event', () => {
      sinon.assert.calledWith(Renderer.doc.on, 'pageAdded', Renderer.newPage);
    });

    it('should calculate heights in preparation for rendering', () => {
      expect(Renderer.chartsByDate[sampleDate].bolusDetailsHeight).to.be.a('number');
      expect(Renderer.chartsByDate[sampleDate].bolusDetailsHeight > 0).to.be.true;

      expect(Renderer.chartsByDate[sampleDate].chartHeight).to.be.a('number');
      expect(Renderer.chartsByDate[sampleDate].chartHeight > 0).to.be.true;
    });

    it('should place charts in preparation for rendering', () => {
      expect(Renderer.chartsPlaced).to.be.a('number');
      expect(Renderer.chartsPlaced > 0).to.be.true;

      sinon.assert.callCount(Renderer.doc.addPage, 2);
    });

    it('should make chart scales in preparation for rendering', () => {
      expect(Renderer.chartsByDate[sampleDate].bgScale).to.be.a('function');
      expect(Renderer.chartsByDate[sampleDate].bolusScale).to.be.a('function');
      expect(Renderer.chartsByDate[sampleDate].basalScale).to.be.a('function');
      expect(Renderer.chartsByDate[sampleDate].xScale).to.be.a('function');
    });
  });

  describe('getLegendItems', () => {
    beforeEach(() => {
      // Reset any state that might affect legend items
      Renderer.hasAlarms = false;
      Renderer.hasCarbExchanges = false;
      Renderer.isAutomatedBolusDevice = false;
    });

    it('should return basic legend items for standard pump data', () => {
      const legendItems = Renderer.getLegendItems();

      expect(legendItems).to.be.an('array');
      expect(legendItems.length).to.be.greaterThan(0);

      // Should include basic items
      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('cgm');
      expect(itemIds).to.include('bgm');
      expect(itemIds).to.include('bolus');
      expect(itemIds).to.include('basal');
      expect(itemIds).to.include('carbs');
    });

    it('should include carb exchanges when present in dataset', () => {
      Renderer.hasCarbExchanges = true;
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('carbExchanges');

      const carbExchangeItem = legendItems.find(item => item.id === 'carbExchanges');
      expect(carbExchangeItem.legendTitle).to.equal('Carb exch.');
    });

    it('should not include carb exchanges when not present in dataset', () => {
      Renderer.hasCarbExchanges = false;
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.not.include('carbExchanges');
    });

    it('should include automated bolus items when device supports automated boluses', () => {
      Renderer.isAutomatedBolusDevice = true;
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('bolusAutomated');

      const automatedBolusItem = _.find(legendItems, item => item.id === 'bolusAutomated');
      expect(automatedBolusItem.legendTitle).to.contain('automated');
    });

    it('should include alarm items when alarms are present', () => {
      Renderer.hasAlarms = true;
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('alarm');

      const alarmItem = _.find(legendItems, item => item.id === 'alarm');
      expect(alarmItem.legendTitle).to.contain('Alarm');
    });

    it('should include pump settings override items', () => {
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('override');

      const overrideItem = _.find(legendItems, item => item.id === 'override');
      expect(overrideItem.legendTitle).to.equal('Override');
    });

    it('should include interrupted bolus items', () => {
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('interrupted');

      const interruptedItem = _.find(legendItems, item => item.id === 'interrupted');
      expect(interruptedItem.legendTitle).to.equal('Interrupted');
    });

    it('should include extended bolus items', () => {
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('extended');

      const extendedItem = _.find(legendItems, item => item.id === 'extended');
      expect(extendedItem.legendTitle).to.contain('Extended');
    });

    it('should include automated basal items when device supports automated basals', () => {
      Renderer.isAutomatedBasalDevice = true;
      const legendItems = Renderer.getLegendItems();

      const itemIds = _.map(legendItems, item => item.id);
      expect(itemIds).to.include('basalAutomated');

      const automatedBasalItem = _.find(legendItems, item => item.id === 'basalAutomated');
      expect(automatedBasalItem.legendTitle).to.contain('automated');
    });

    it('should return items with correct structure', () => {
      const legendItems = Renderer.getLegendItems();

      _.forEach(legendItems, item => {
        expect(item).to.have.property('id');
        expect(item).to.have.property('legendTitle');
        expect(item.id).to.be.a('string');
        expect(item.legendTitle).to.be.a('string');

        // Some items may have patterns or annotations
        if (item.pattern) {
          expect(item.pattern).to.have.property('id');
          if (item.pattern.color) {
            expect(item.pattern.color).to.be.a('string');
          }
        }

        if (item.annotations) {
          expect(item.annotations).to.be.an('array');
        }
      });
    });

    it('should include pattern information for appropriate items', () => {
      const legendItems = Renderer.getLegendItems();

      // Find items that should have patterns (if any)
      const patternItems = _.filter(legendItems, item => item.pattern);

      _.forEach(patternItems, item => {
        expect(item.pattern).to.have.property('id');
        expect(item.pattern.id).to.be.a('string');
      });
    });

    it('should maintain consistent order of legend items', () => {
      const legendItems1 = Renderer.getLegendItems();
      const legendItems2 = Renderer.getLegendItems();

      expect(legendItems1.length).to.equal(legendItems2.length);

      _.forEach(legendItems1, (item, index) => {
        expect(item.id).to.equal(legendItems2[index].id);
        expect(item.legendTitle).to.equal(legendItems2[index].legendTitle);
      });
    });

    context('with different device configurations', () => {
      it('should return different legend items for automated devices', () => {
        const standardLegendItems = Renderer.getLegendItems();

        Renderer.isAutomatedBasalDevice = true;
        Renderer.isAutomatedBolusDevice = true;
        const automatedLegendItems = Renderer.getLegendItems();

        expect(automatedLegendItems.length).to.be.greaterThan(standardLegendItems.length);
      });

      it('should return different legend items when alarms and carb exchanges are present', () => {
        const basicLegendItems = Renderer.getLegendItems();

        Renderer.hasAlarms = true;
        Renderer.hasCarbExchanges = true;
        const extendedLegendItems = Renderer.getLegendItems();

        expect(extendedLegendItems.length).to.be.greaterThan(basicLegendItems.length);
      });
    });
  });

  describe('calculateChartMinimums', () => {
    it('should calculate the minimum area available to the charts', () => {
      Renderer.calculateChartMinimums(Renderer.initialChartArea);
      const legendHeight = Renderer.doc.fontSize(9).currentLineHeight() * 5;
      const { topEdge, bottomEdge } = Renderer.initialChartArea;
      const totalHeight = bottomEdge - legendHeight - topEdge;

      expect(Renderer.chartMinimums.total).to.equal(totalHeight / 3.25);
    });
  });

  describe('calculateDateChartHeight', () => {
    it('should be a function', () => {
      expect(Renderer.calculateDateChartHeight).to.be.a('function');
    });

    // Functionality already confirmed in constructor tests
  });

  describe('makeScales', () => {
    it('should be a function', () => {
      expect(Renderer.makeScales).to.be.a('function');
    });

    it('should set the bgScaleYLimit to a minimum of the BG target upper bound', () => {
      Renderer.bgRange[1] = 100;
      Renderer.makeScales(Renderer.chartsByDate[sampleDate]);

      expect(Renderer.bgScaleYLimit).to.equal(180);
    });

    it('should set the bgScaleYLimit to a maximum of the BG clamp threshold', () => {
      Renderer.bgRange[1] = 800;
      Renderer.makeScales(Renderer.chartsByDate[sampleDate]);

      expect(Renderer.bgScaleYLimit).to.equal(600);
    });

    // Remaining functionality already confirmed in constructor tests
  });

  describe('newPage', () => {
    let newPageSpy;

    beforeEach(() => {
      newPageSpy = sinon.spy(PrintView.prototype, 'newPage');
    });

    afterEach(() => {
      newPageSpy.restore();
    });

    it('should call the newPage method of the parent class with a date range string', () => {
      Renderer.newPage();
      sinon.assert.calledWith(
        PrintView.prototype.newPage,
        'Date range: Dec 28, 2016 - Jan 2, 2017'
      );
    });

    it('should render a legend', () => {
      sinon.stub(Renderer, 'renderLegend');

      Renderer.newPage();
      sinon.assert.called(Renderer.renderLegend);
    });
  });

  describe('placeChartsOnPage', () => {
    it('should be a function', () => {
      expect(Renderer.placeChartsOnPage).to.be.a('function');
    });

    // Functionality already confirmed in constructor tests
  });

  describe('renderEventPath', () => {
    it('should render an svg path', () => {
      const path = {
        d: 'path',
      };

      const programmedPath = {
        d: 'programmedPath',
        type: 'programmed',
      };

      const automatedPath = {
        d: 'automatedPath',
        type: 'programmed',
        subType: 'automated',
      };

      Renderer.renderEventPath(path);
      sinon.assert.calledWith(Renderer.doc.path, path.d);
      sinon.assert.calledOnce(Renderer.doc.path);
      sinon.assert.calledOnce(Renderer.doc.fill);

      Renderer.doc.path.resetHistory();
      Renderer.doc.fill.resetHistory();

      Renderer.renderEventPath(programmedPath);
      sinon.assert.calledWith(Renderer.doc.path, programmedPath.d);
      sinon.assert.calledOnce(Renderer.doc.path);
      sinon.assert.calledOnce(Renderer.doc.lineWidth);
      sinon.assert.calledOnce(Renderer.doc.dash);
      sinon.assert.calledOnce(Renderer.doc.stroke);

      Renderer.doc.path.resetHistory();
      Renderer.doc.lineWidth.resetHistory();
      Renderer.doc.dash.resetHistory();
      Renderer.doc.stroke.resetHistory();

      Renderer.renderEventPath(automatedPath);
      sinon.assert.calledWith(Renderer.doc.path, automatedPath.d);
      sinon.assert.calledOnce(Renderer.doc.path);
      sinon.assert.calledOnce(Renderer.doc.lineWidth);
      sinon.assert.calledOnce(Renderer.doc.stroke);
    });
  });

  describe('render', () => {
    it('should call all the appropriate render methods for each page and chart', () => {
      sinon.stub(Renderer, 'renderSummary').returns(Renderer);
      sinon.stub(Renderer, 'renderXAxes').returns(Renderer);
      sinon.stub(Renderer, 'renderYAxes').returns(Renderer);
      sinon.stub(Renderer, 'renderDeviceEvents').returns(Renderer);
      sinon.stub(Renderer, 'renderCbgs').returns(Renderer);
      sinon.stub(Renderer, 'renderSmbgs').returns(Renderer);
      sinon.stub(Renderer, 'renderInsulinEvents').returns(Renderer);
      sinon.stub(Renderer, 'renderFoodCarbs').returns(Renderer);
      sinon.stub(Renderer, 'renderBolusDetails').returns(Renderer);
      sinon.stub(Renderer, 'renderBasalPaths').returns(Renderer);
      sinon.stub(Renderer, 'renderBasalRates').returns(Renderer);
      sinon.stub(Renderer, 'renderPumpSettingsOverrides').returns(Renderer);
      sinon.stub(Renderer, 'renderChartDivider').returns(Renderer);
      sinon.stub(Renderer, 'goToPage');

      const numCharts = _.keys(Renderer.chartsByDate).length;

      Renderer.render();

      sinon.assert.callCount(Renderer.goToPage, numCharts);

      sinon.assert.callCount(Renderer.renderSummary, numCharts);
      sinon.assert.callCount(Renderer.renderXAxes, numCharts);
      sinon.assert.callCount(Renderer.renderYAxes, numCharts);
      sinon.assert.callCount(Renderer.renderDeviceEvents, numCharts);
      sinon.assert.callCount(Renderer.renderCbgs, numCharts);
      sinon.assert.callCount(Renderer.renderSmbgs, numCharts);
      sinon.assert.callCount(Renderer.renderInsulinEvents, numCharts);
      sinon.assert.callCount(Renderer.renderFoodCarbs, numCharts);
      sinon.assert.callCount(Renderer.renderBolusDetails, numCharts);
      sinon.assert.callCount(Renderer.renderBasalPaths, numCharts);
      sinon.assert.callCount(Renderer.renderBasalRates, numCharts);
      sinon.assert.callCount(Renderer.renderPumpSettingsOverrides, numCharts);
      sinon.assert.callCount(Renderer.renderChartDivider, numCharts);
    });
  });

  describe('renderSummary', () => {
    let args;

    const setArgs = (renderer) => ({
      date: sampleDate,
      data: renderer.chartsByDate[sampleDate].data,
      topEdge: 100,
    });

    beforeEach(() => {
      args = setArgs(Renderer);
      Renderer.aggregationsByDate.statsByDate[sampleDate] = {
        averageGlucose: {
          averageGlucose: 120,
        },
        carbs: {
          carbs: {
            grams: 10.2,
            exchanges: 2.45,
          },
        },
        timeInRange: {
          durations: {
            target: MS_IN_HOUR * 3,
            veryLow: MS_IN_HOUR,
            total: MS_IN_HOUR * 4,
          },
        },
        totalInsulin: {
          basal: 10,
          bolus: 20,
        },
        timeInAuto: {
          manual: MS_IN_HOUR * 3,
          automated: MS_IN_HOUR * 7,
        },
      };
      Renderer.renderSummary(args);
    });

    afterEach(() => {
      Renderer.doc.text.resetHistory();
    });

    it('should render a formatted date', () => {
      const formattedDate = moment(sampleDate, 'YYYY-MM-DD').format('ddd, MMM D, YYYY');

      sinon.assert.calledWith(Renderer.doc.text, formattedDate);
    });

    it('should render the time in target and time below veryLowThreshold', () => {
      const { targetUpperBound, targetLowerBound, veryLowThreshold } = Renderer.bgBounds;

      sinon.assert.calledWith(Renderer.doc.text, 'Time in Target');
      sinon.assert.calledWith(Renderer.doc.text, `${targetLowerBound} - ${targetUpperBound}`);
      sinon.assert.calledWith(Renderer.doc.text, '75%');
      sinon.assert.calledWith(Renderer.doc.text, `Below ${veryLowThreshold}`);
      sinon.assert.calledWith(Renderer.doc.text, '25%');
    });

    it('should render the basal to bolus ratio for non-automated-basal devices', () => {
      sinon.assert.calledWith(Renderer.doc.text, 'Basal:Bolus Ratio');

      sinon.assert.calledWith(Renderer.doc.text, 'Basal');
      sinon.assert.calledWith(Renderer.doc.text, '33%, 10.0 U');

      sinon.assert.calledWith(Renderer.doc.text, 'Bolus');
      sinon.assert.calledWith(Renderer.doc.text, '67%, 20.0 U');
    });

    it('should render the time in auto ratio for automated-basal devices', () => {
      Renderer.isAutomatedBasalDevice = true;
      Renderer.doc.text.resetHistory();
      Renderer.renderSummary(args);
      sinon.assert.calledWith(Renderer.doc.text, 'Time in Automated');

      sinon.assert.calledWith(Renderer.doc.text, 'Manual');
      sinon.assert.calledWith(Renderer.doc.text, '30%');

      sinon.assert.calledWith(Renderer.doc.text, 'Automated');
      sinon.assert.calledWith(Renderer.doc.text, '70%');
    });

    it('should render the Average BG stat if available', () => {
      sinon.assert.calledWith(Renderer.doc.text, 'Avg Glucose');
      sinon.assert.calledWith(Renderer.doc.text, '120 mg/dL');
    });

    it('should render the total daily insulin', () => {
      sinon.assert.calledWith(Renderer.doc.text, 'Total Insulin');
      sinon.assert.calledWith(Renderer.doc.text, '30.0 U');
    });

    it('should render the total carbs intake', () => {
      sinon.assert.calledWith(Renderer.doc.text, 'Total Carbs');
      sinon.assert.calledWith(Renderer.doc.text, '10 g, 2.5 exch');
    });

    context('mmol/L support', () => {
      beforeEach(() => {
        Renderer = new DailyPrintView(doc, _.assign({}, data, { bgPrefs: mmollBgPrefs }), opts);
        args = setArgs(Renderer);
        Renderer.aggregationsByDate.statsByDate[sampleDate] = {
          averageGlucose: {
            averageGlucose: 12.25,
          },
          timeInRange: {
            durations: {
              target: MS_IN_HOUR * 3,
              veryLow: MS_IN_HOUR,
              total: MS_IN_HOUR * 4,
            },
          },
        };
        Renderer.renderSummary(args);
      });

      it('should render the time in target range labels in mmol/L with correct formatting', () => {
        const { targetUpperBound, targetLowerBound, veryLowThreshold } = Renderer.bgBounds;
        const text = {
          targetUpper: formatDecimalNumber(targetUpperBound, 1),
          targetLower: formatDecimalNumber(targetLowerBound, 1),
          veryLow: formatDecimalNumber(veryLowThreshold, 1),
        };
        sinon.assert.calledWith(Renderer.doc.text, 'Time in Target');
        sinon.assert.calledWith(Renderer.doc.text, `${text.targetLower} - ${text.targetUpper}`);
        sinon.assert.calledWith(Renderer.doc.text, `Below ${text.veryLow}`);
      });

      it('should render the Average BG in mmol/L with correct formatting', () => {
        sinon.assert.calledWith(Renderer.doc.text, 'Avg Glucose');
        sinon.assert.calledWith(Renderer.doc.text, '12.3 mmol/L');
      });
    });

    context('mmol/L support with non-standard range that has no veryLow threshold', () => {
      const nonStandardBgPrefs = {
        bgBounds: ADA_OLDER_HIGH_RISK_BG_BOUNDS[MMOLL_UNITS],
        bgClasses: {
          'very-low': { boundary: ADA_OLDER_HIGH_RISK_BG_BOUNDS[MMOLL_UNITS].veryLowThreshold }, // is null
          low: { boundary: ADA_OLDER_HIGH_RISK_BG_BOUNDS[MMOLL_UNITS].targetLowerBound },
          target: { boundary: ADA_OLDER_HIGH_RISK_BG_BOUNDS[MMOLL_UNITS].targetUpperBound },
          high: { boundary: ADA_OLDER_HIGH_RISK_BG_BOUNDS[MMOLL_UNITS].veryHighThreshold },
        },
        bgUnits: MMOLL_UNITS,
      };

      beforeEach(() => {
        Renderer = new DailyPrintView(doc, _.assign({}, data, { bgPrefs: nonStandardBgPrefs }), opts);
        args = setArgs(Renderer);
        Renderer.aggregationsByDate.statsByDate[sampleDate] = {
          averageGlucose: {
            averageGlucose: 12.25,
          },
          timeInRange: {
            durations: {
              target: MS_IN_HOUR * 3,
              veryLow: MS_IN_HOUR,
              total: MS_IN_HOUR * 4,
            },
          },
        };
        Renderer.renderSummary(args);
      });

      it('should render the time in target range labels in mmol/L with correct formatting', () => {
        const { targetUpperBound, targetLowerBound } = Renderer.bgBounds;
        const text = {
          targetUpper: formatDecimalNumber(targetUpperBound, 1),
          targetLower: formatDecimalNumber(targetLowerBound, 1),
        };
        sinon.assert.calledWith(Renderer.doc.text, 'Time in Target');
        sinon.assert.calledWith(Renderer.doc.text, `${text.targetLower} - ${text.targetUpper}`);
        sinon.assert.calledWith(Renderer.doc.text, `Below ${text.targetLower}`);
      });
    });
  });

  describe('renderXAxes', () => {
    it('should render X axis at the bottom of the bg, bolus, and basal charts', () => {
      const args = {
        bolusDetailsHeight: 100,
        topEdge: 150,
        date: sampleDate,
      };

      const {
        notesEtc,
        bgEtcChart,
        basalChart,
      } = Renderer.chartMinimums;

      const bottomOfBgEtcChart = args.topEdge + notesEtc + bgEtcChart;
      const bottomOfBolusInfo = bottomOfBgEtcChart + args.bolusDetailsHeight;
      const bottomOfBasalChart = bottomOfBolusInfo + basalChart;

      Renderer.renderXAxes(args);
      sinon.assert.calledWith(Renderer.doc.moveTo, Renderer.chartArea.leftEdge, bottomOfBgEtcChart);
      sinon.assert.calledWith(Renderer.doc.moveTo, Renderer.chartArea.leftEdge, bottomOfBolusInfo);
      sinon.assert.calledWith(Renderer.doc.moveTo, Renderer.chartArea.leftEdge, bottomOfBasalChart);

      sinon.assert.calledWith(Renderer.doc.lineTo, Renderer.rightEdge, bottomOfBasalChart);
      sinon.assert.calledWith(Renderer.doc.lineTo, Renderer.rightEdge, bottomOfBolusInfo);
      sinon.assert.calledWith(Renderer.doc.lineTo, Renderer.rightEdge, bottomOfBasalChart);

      sinon.assert.calledThrice(Renderer.doc.stroke);
    });
  });

  describe('renderYAxes', () => {
    const setArgs = (renderer) => ({
      bgScale: sinon.stub().returns(100),
      bottomOfBasalChart: 150,
      utcBounds: renderer.chartsByDate[sampleDate].utcBounds,
      date: sampleDate,
      topEdge: 350,
      xScale: sinon.stub().returns(100),
    });

    it('should render Y axis lines, times and bg bounds', () => {
      const args = setArgs(Renderer);
      Renderer.renderYAxes(args);

      // Should draw a vertical line for every 3hr slot,
      // plus a final one to close the chart and the 2 BG target lines
      sinon.assert.callCount(Renderer.doc.lineTo, 24 / 3 + 1 + 2);
      sinon.assert.calledWith(Renderer.doc.moveTo, sinon.match.number, args.topEdge);
      sinon.assert.calledWith(Renderer.doc.lineTo, sinon.match.number, args.bottomOfBasalChart);

      // Should render the timeslot time in the format 9a or 12p
      sinon.assert.calledWith(Renderer.doc.text, sinon.match(/\d?(\d)[a|p]/));
    });

    it('should not render a BG bound higher than the `bgScaleYLimit` value', () => {
      Renderer.bgScaleYLimit = 305;

      const args = setArgs(Renderer);
      Renderer.renderYAxes(args);

      const timeSlotTextCalls = 8;

      sinon.assert.callCount(Renderer.doc.text, timeSlotTextCalls + 4);
      Renderer.doc.text.resetHistory();

      Renderer.bgScaleYLimit = 180;

      Renderer.renderYAxes(args);
      sinon.assert.callCount(Renderer.doc.text, timeSlotTextCalls + 3);
    });

    context('mg/dL support', () => {
      beforeEach(() => {
        Renderer = new DailyPrintView(doc, data, opts);
        Renderer.bgScaleYLimit = 305;

        Renderer.renderYAxes(setArgs(Renderer));
      });

      it('should render bg bounds in mmol/L with proper formatting', () => {
        sinon.assert.calledWith(Renderer.doc.text, '250');
        sinon.assert.calledWith(Renderer.doc.text, '180');
        sinon.assert.calledWith(Renderer.doc.text, '70');
        sinon.assert.calledWith(Renderer.doc.text, '54');
      });
    });

    context('mmol/L support', () => {
      beforeEach(() => {
        Renderer = new DailyPrintView(doc, _.assign({}, data, { bgPrefs: mmollBgPrefs }), opts);

        Renderer.renderYAxes(setArgs(Renderer));
      });

      it('should render bg bounds in mmol/L with proper formatting', () => {
        sinon.assert.calledWith(Renderer.doc.text, '13.9');
        sinon.assert.calledWith(Renderer.doc.text, '10.0');
        sinon.assert.calledWith(Renderer.doc.text, '3.9');
        sinon.assert.calledWith(Renderer.doc.text, '3.0');
      });
    });
  });

  describe('renderCbgs', () => {
    it('should render cbg data', () => {
      const cbgCount = Renderer.chartsByDate[sampleDate].data.cbg.length;

      Renderer.renderCbgs(Renderer.chartsByDate[sampleDate]);
      sinon.assert.callCount(Renderer.doc.circle, cbgCount);
    });
  });

  describe('renderSmbgs', () => {
    it('should render smbg data as a cirle with a value', () => {
      const smbgCount = Renderer.chartsByDate[sampleDate].data.smbg.length;

      Renderer.renderSmbgs(Renderer.chartsByDate[sampleDate]);
      sinon.assert.callCount(Renderer.doc.circle, smbgCount);

      _.each(Renderer.chartsByDate[sampleDate].data.smbg, smbg => {
        const smbgLabel = formatBgValue(smbg.value, Renderer.bgPrefs);
        sinon.assert.calledWith(Renderer.doc.text, smbgLabel);
      });
    });

    context('mmol/L support', () => {
      beforeEach(() => {
        Renderer = new DailyPrintView(doc, _.assign({}, data, { bgPrefs: mmollBgPrefs }), opts);
        Renderer.renderSmbgs(Renderer.chartsByDate[sampleDate]);
      });

      it('should render smbg data in mmol/L with proper formatting', () => {
        const smbgCount = Renderer.chartsByDate[sampleDate].data.smbg.length;

        sinon.assert.callCount(Renderer.doc.circle, smbgCount);

        _.each(Renderer.chartsByDate[sampleDate].data.smbg, smbg => {
          const smbgLabel = formatBgValue(smbg.value, Renderer.bgPrefs);
          expect(smbgLabel.indexOf('.')).to.equal(smbgLabel.length - 2);
          sinon.assert.calledWith(Renderer.doc.text, smbgLabel);
        });
      });
    });
  });

  describe('renderInsulinEvents', () => {
    it('should graph bolus and carb events', () => {
      const bolusCount = Renderer.chartsByDate[sampleDate].data.bolus.length;

      sinon.stub(Renderer, 'renderEventPath');
      Renderer.renderInsulinEvents(Renderer.chartsByDate[sampleDate]);

      expect(Renderer.renderEventPath.callCount >= bolusCount).to.be.true;
      sinon.assert.calledOnce(Renderer.doc.circle);
      sinon.assert.calledWith(Renderer.doc.fill, Renderer.colors.carbs);
      sinon.assert.neverCalledWith(Renderer.doc.fill, Renderer.colors.carbExchanges);
      sinon.assert.calledWith(Renderer.doc.text, 80);
    });

    it('should graph carb exchange events', () => {
      Renderer.chartsByDate[sampleDate].data.bolus[2].carbUnits = 'exchanges';
      Renderer.chartsByDate[sampleDate].data.bolus[2].carbInput = 3;
      Renderer.renderInsulinEvents(Renderer.chartsByDate[sampleDate]);

      sinon.assert.calledOnce(Renderer.doc.circle);
      sinon.assert.neverCalledWith(Renderer.doc.fill, Renderer.colors.carbs);
      sinon.assert.calledWith(Renderer.doc.fill, Renderer.colors.carbExchanges);
      sinon.assert.calledWith(Renderer.doc.text, 3);
    });
  });

  describe('renderFoodCarbs', () => {
    it('should graph food carb events, rounded to nearest integer', () => {
      Renderer.renderFoodCarbs(Renderer.chartsByDate[sampleDate]);

      sinon.assert.calledOnce(Renderer.doc.circle);
      sinon.assert.calledWith(Renderer.doc.text, 65);
    });
  });

  describe('renderBolusDetails', () => {
    it('should render bolus details', () => {
      const bolusCount = Renderer.chartsByDate[sampleDate].data.bolus.length;
      Renderer.chartsByDate[sampleDate].bolusDetailWidths = Array(8);
      Renderer.chartsByDate[sampleDate].bolusDetailPositions = Array(8);

      Renderer.renderBolusDetails(Renderer.chartsByDate[sampleDate]);

      // We expect 2 calls to doc.text() for each of our 3 sample data boluses
      // Plus one more for the extended one
      const expectedTextCallCount = bolusCount * 2 + 1;

      sinon.assert.callCount(Renderer.doc.text, expectedTextCallCount);
    });
  });

  describe('renderBasalPaths', () => {
    it('should render basal paths', () => {
      const basalData = Renderer.chartsByDate[sampleDate].data.basal;
      const groups = getBasalPathGroups(basalData);

      Renderer.renderBasalPaths(Renderer.chartsByDate[sampleDate]);

      expect(groups.length).to.equal(2);

      const expectedOutlinesPaths = groups.length; // one outline for each group
      const expectedBasalSequencePaths = 2; // one scheduled sequence, one automated

      sinon.assert.callCount(Renderer.doc.path, expectedOutlinesPaths + expectedBasalSequencePaths);

      // Should render both automated and manual basal sequences in appropriate colors
      expect(Renderer.doc.fillColor.getCall(0).args[0]).to.equal(Renderer.colors.basal);
      expect(Renderer.doc.fillColor.getCall(1).args[0]).to.equal(Renderer.colors.basalAutomated);

      // Should render both automated and manual basal outlines in appropriate colors
      expect(Renderer.doc.stroke.getCall(0).args[0]).to.equal(Renderer.colors.basal);
      expect(Renderer.doc.stroke.getCall(1).args[0]).to.equal(Renderer.colors.basalAutomated);
    });

    it('should render basal group markers', () => {
      const basalData = Renderer.chartsByDate[sampleDate].data.basal;
      const groups = getBasalPathGroups(basalData);

      Renderer.renderBasalPaths(Renderer.chartsByDate[sampleDate]);

      expect(groups.length).to.equal(2);

      const expectedMarkersCount = 1; // one marker for each group, not including the first

      sinon.assert.callCount(Renderer.doc.circle, expectedMarkersCount);
      sinon.assert.callCount(Renderer.doc.lineTo, expectedMarkersCount);
      sinon.assert.callCount(Renderer.doc.text, expectedMarkersCount);
      sinon.assert.calledWith(Renderer.doc.text, 'A');
    });
  });

  describe('renderBasalRates', () => {
    it('should render basal rates for manual (not automated) basals', () => {
      Renderer.renderBasalRates(Renderer.chartsByDate[sampleDate]);

      sinon.assert.callCount(Renderer.doc.text, 1);
      sinon.assert.calledWith(Renderer.doc.text, '0.625');
    });
  });

  describe('renderPumpSettingsOverrides', () => {
    it('should render basal group markers', () => {
      const deviceEventData = Renderer.chartsByDate[sampleDate].data.deviceEvent;
      const overrideData = _.filter(deviceEventData, { subType: 'pumpSettingsOverride' });

      Renderer.renderPumpSettingsOverrides(Renderer.chartsByDate[sampleDate]);

      expect(overrideData.length).to.equal(2);

      const expectedMarkersCount = 2;

      sinon.assert.callCount(Renderer.doc.circle, expectedMarkersCount);
      sinon.assert.callCount(Renderer.doc.lineTo, expectedMarkersCount * 2);
      sinon.assert.callCount(Renderer.doc.text, expectedMarkersCount);
      sinon.assert.calledWith(Renderer.doc.text, 'E');
      sinon.assert.calledWith(Renderer.doc.text, 'Z');
    });
  });

  describe('renderChartDivider', () => {
    it('should not render a chart divider if it\'s not the last one on a page', () => {
      Renderer.renderChartDivider(Renderer.chartsByDate['2017-01-01']);

      sinon.assert.callCount(Renderer.doc.lineTo, 1);
      sinon.assert.calledWith(Renderer.doc.lineTo, Renderer.rightEdge);
    });

    it('should not render a chart divider if it\'s the last one on a page', () => {
      Renderer.renderChartDivider(Renderer.chartsByDate['2017-01-02']);

      sinon.assert.callCount(Renderer.doc.lineTo, 0);
    });
  });

  describe('renderLegend', () => {
    it('should render the legend', () => {
      sinon.stub(Renderer, 'renderEventPath');
      sinon.stub(Renderer, 'renderBasalPaths');

      Renderer.hasAlarms = true;
      Renderer.renderLegend();

      sinon.assert.calledWith(Renderer.doc.text, 'CGM');
      sinon.assert.calledWith(Renderer.doc.text, 'BGM');
      sinon.assert.calledWith(Renderer.doc.text, 'Bolus');
      sinon.assert.calledWith(Renderer.doc.text, 'Override');
      sinon.assert.calledWith(Renderer.doc.text, 'up & down');
      sinon.assert.calledWith(Renderer.doc.text, 'Interrupted');
      sinon.assert.calledWith(Renderer.doc.text, 'Combo /');
      sinon.assert.calledWith(Renderer.doc.text, 'Extended');
      sinon.assert.calledWith(Renderer.doc.text, 'Basals');
      sinon.assert.calledWith(Renderer.doc.text, 'Carbs (g)');
      sinon.assert.neverCalledWith(Renderer.doc.text, 'Carb exch.');

      // All of the bolus visual elements are called by renderEventPath
      // And the paths total 13
      sinon.assert.callCount(Renderer.renderEventPath, 13);

      // CGM and BGM data calls (11) + one for carbs
      sinon.assert.callCount(Renderer.doc.circle, 12);

      sinon.assert.callCount(Renderer.renderBasalPaths, 1);
    });

    it('should render the legend with carb exchanges when present in dataset', () => {
      doc = new Doc({ margin: MARGIN });
      Renderer = new DailyPrintView(doc, {
        ...data,
        data: { current: { data: { wizard: [{ type: 'wizard', carbUnits: 'exchanges' }] } } },
      }, opts);

      sinon.stub(Renderer, 'renderEventPath');
      sinon.stub(Renderer, 'renderBasalPaths');

      Renderer.renderLegend();

      sinon.assert.calledWith(Renderer.doc.text, 'Carbs (g)');
      sinon.assert.calledWith(Renderer.doc.text, 'Carb exch.');

      // one for carbs + 1 for carb exchanges
      sinon.assert.callCount(Renderer.doc.circle, 2);
    });

    it('should render the legend with automated boluses when pump is an automated bolus device', () => {
      doc = new Doc({ margin: MARGIN });
      Renderer = new DailyPrintView(doc, {
        ...data,
        metaData: {
          ...data.metaData,
          latestPumpUpload: { isAutomatedBolusDevice: true },
        },
      }, opts);

      sinon.stub(Renderer, 'renderEventPath');
      sinon.stub(Renderer, 'renderBasalPaths');

      Renderer.renderLegend();

      sinon.assert.calledWith(Renderer.doc.text, 'Bolus');
      sinon.assert.calledWith(Renderer.doc.text, 'manual &');
      sinon.assert.calledWith(Renderer.doc.text, 'automated');
    });

    it('should render the legend with pump alarms when present in dataset', () => {
      doc = new Doc({ margin: MARGIN });
      Renderer = new DailyPrintView(doc, {
        ...data,
        data: { current: { data: { deviceEvent: [{ type: 'deviceEvent', tags: { alarm: true } }] } } },
      }, opts);

      sinon.stub(Renderer, 'renderEventPath');
      sinon.stub(Renderer, 'renderBasalPaths');

      Renderer.renderLegend();

      sinon.assert.calledWith(Renderer.doc.text, 'Pump');
      sinon.assert.calledWith(Renderer.doc.text, 'Alarm');
      sinon.assert.calledWith(Renderer.doc.image, 'images/alarm.png');
    });
  });
});
