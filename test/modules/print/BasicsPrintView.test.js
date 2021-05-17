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

import BasicsPrintView from '../../../src/modules/print/BasicsPrintView';
import PrintView from '../../../src/modules/print/PrintView';
import * as patients from '../../../data/patient/profiles';
import * as settings from '../../../data/patient/settings';

import { basicsData as data } from '../../../data/print/fixtures';

import {
  DEFAULT_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
} from '../../../src/modules/print/utils/constants';

import Doc from '../../helpers/pdfDoc';

describe('BasicsPrintView', () => {
  let Renderer;

  const DPI = 72;
  const MARGIN = DPI / 2;

  let doc;

  const opts = {
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
    patient: {
      ...patients.standard,
      ...settings.reservoirChangeSelected,
    },
    width: 8.5 * DPI - (2 * MARGIN),
    title: 'The Basics',
  };

  const createRenderer = (renderData = data, renderOpts = opts) => (
    new BasicsPrintView(doc, renderData, renderOpts)
  );

  beforeEach(() => {
    doc = new Doc({ margin: MARGIN });
    Renderer = createRenderer(data);
  });

  describe('class constructor', () => {
    it('should instantiate without errors', () => {
      expect(Renderer).to.be.an('object');
    });

    it('should extend the `PrintView` class', () => {
      expect(Renderer instanceof PrintView).to.be.true;
    });

    it('should add section data', () => {
      expect(Renderer.sections).to.be.an('object');
    });

    it('should add the first pdf page', () => {
      sinon.assert.calledOnce(Renderer.doc.addPage);
    });

    it('should initialize the page layout', () => {
      const initLayoutSpy = sinon.stub(BasicsPrintView.prototype, 'initLayout');
      Renderer = createRenderer();
      sinon.assert.calledOnce(Renderer.initLayout);

      initLayoutSpy.restore();
    });
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
      sinon.assert.calledWith(PrintView.prototype.newPage, 'Date range: Sep 18 - Oct 7, 2017');
    });
  });

  describe('initCalendar', () => {
    it('should initialize the calendar data', () => {
      expect(Renderer.calendar).to.be.undefined;

      Renderer.initCalendar();

      expect(Renderer.calendar).to.be.an('object');
      expect(Renderer.calendar.labels).to.be.an('array');
      expect(Renderer.calendar.columns).to.be.an('array');
      expect(Renderer.calendar.days).to.be.an('array').and.have.lengthOf(21);
      expect(Renderer.calendar.pos).to.eql({});
      expect(Renderer.calendar.headerHeight).to.equal(15);
    });
  });

  describe('initLayout', () => {
    it('should initialize the page layout', () => {
      sinon.stub(Renderer, 'setLayoutColumns');

      Renderer.initLayout();

      sinon.assert.calledWithMatch(Renderer.setLayoutColumns, {
        type: 'percentage',
        width: Renderer.chartArea.width,
      });
    });
  });

  describe('render', () => {
    it('should call all the appropriate render methods', () => {
      sinon.stub(Renderer, 'renderStats');
      sinon.stub(Renderer, 'renderCalendars');
      sinon.stub(Renderer, 'RenderCalendarSummaries');

      Renderer.render();

      sinon.assert.calledOnce(Renderer.renderStats);
      sinon.assert.calledOnce(Renderer.renderCalendars);
      sinon.assert.calledOnce(Renderer.RenderCalendarSummaries);
    });
  });

  describe('renderStats', () => {
    it('should set the pdf cursor to the first page', () => {
      sinon.stub(Renderer, 'goToPage');

      Renderer.renderStats();

      sinon.assert.calledWith(Renderer.goToPage, 0);
    });

    it('should set the pdf cursor in the left column', () => {
      sinon.stub(Renderer, 'goToLayoutColumnPosition');

      Renderer.renderStats();

      sinon.assert.calledWith(Renderer.goToLayoutColumnPosition, 0);
    });

    it('should call all the appropriate render methods', () => {
      sinon.stub(Renderer, 'renderAggregatedStats');

      Renderer.renderStats();

      sinon.assert.calledOnce(Renderer.renderAggregatedStats);
    });
  });

  describe('renderCalendars', () => {
    it('should set the pdf cursor to the first page', () => {
      sinon.stub(Renderer, 'goToPage');

      Renderer.renderCalendars();

      sinon.assert.calledWith(Renderer.goToPage, 0);
    });

    it('should set the pdf cursor in the center column', () => {
      sinon.stub(Renderer, 'goToLayoutColumnPosition');

      Renderer.renderCalendars();

      sinon.assert.calledWith(Renderer.goToLayoutColumnPosition, 1);
    });

    it('should call the calendar init method', () => {
      sinon.spy(Renderer, 'initCalendar');

      Renderer.renderCalendars();

      sinon.assert.calledOnce(Renderer.initCalendar);
    });

    it('should render the smbg calendar section with the appropriate data', () => {
      sinon.stub(Renderer, 'renderCalendarSection');

      Renderer.renderCalendars();

      sinon.assert.calledWithMatch(Renderer.renderCalendarSection, {
        title: Renderer.sections.fingersticks.title,
        data: Renderer.aggregationsByDate.fingersticks.smbg.byDate,
        type: 'smbg',
        disabled: Renderer.sections.fingersticks.disabled,
        emptyText: Renderer.sections.fingersticks.emptyText,
      });
    });

    it('should render the bolus calendar section with the appropriate data', () => {
      sinon.stub(Renderer, 'renderCalendarSection');

      Renderer.renderCalendars();

      sinon.assert.calledWithMatch(Renderer.renderCalendarSection, {
        title: {
          text: Renderer.sections.boluses.title,
          subText: '(days with no boluses have been excluded)',
        },
        data: Renderer.aggregationsByDate.boluses.byDate,
        type: 'bolus',
        disabled: Renderer.sections.boluses.disabled,
        emptyText: Renderer.sections.boluses.emptyText,
      });
    });

    it('should render the sitechange calendar section with the appropriate data', () => {
      sinon.stub(Renderer, 'renderCalendarSection');

      Renderer.renderCalendars();
      sinon.assert.calledWithMatch(Renderer.renderCalendarSection, {
        title: {
          text: Renderer.sections.siteChanges.title,
          subText: `(from '${Renderer.sections.siteChanges.subTitle}')`,
        },
        data: Renderer.aggregationsByDate.siteChanges.byDate,
        type: 'siteChange',
        disabled: Renderer.sections.siteChanges.disabled,
        emptyText: Renderer.sections.siteChanges.emptyText,
      });
    });

    it('should render the basal calendar section with the appropriate data', () => {
      sinon.stub(Renderer, 'renderCalendarSection');

      Renderer.renderCalendars();

      sinon.assert.calledWithMatch(Renderer.renderCalendarSection, {
        title: Renderer.sections.basals.title,
        data: Renderer.aggregationsByDate.basals.byDate,
        type: 'basal',
        disabled: Renderer.sections.basals.disabled,
        emptyText: Renderer.sections.basals.emptyText,
      });
    });
  });

  describe('RenderCalendarSummaries', () => {
    it('should set the pdf cursor to the first page', () => {
      sinon.stub(Renderer, 'goToPage');

      Renderer.RenderCalendarSummaries();

      sinon.assert.calledWith(Renderer.goToPage, 0);
    });

    it('should set the pdf cursor in the right column', () => {
      sinon.stub(Renderer, 'goToLayoutColumnPosition');

      Renderer.RenderCalendarSummaries();

      sinon.assert.calledWith(Renderer.goToLayoutColumnPosition, 2);
    });

    it('should render the smbg calendar summary with the appropriate data', () => {
      sinon.stub(Renderer, 'renderCalendarSummary');

      Renderer.RenderCalendarSummaries();

      sinon.assert.calledWithMatch(Renderer.renderCalendarSummary, {
        dimensions: Renderer.sections.fingersticks.dimensions,
        header: Renderer.sections.fingersticks.summaryTitle,
        data: Renderer.aggregationsByDate.fingersticks,
        type: 'smbg',
        disabled: Renderer.sections.fingersticks.disabled,
      });
    });

    it('should render the bolus calendar summary with the appropriate data', () => {
      sinon.stub(Renderer, 'renderCalendarSummary');

      Renderer.RenderCalendarSummaries();

      sinon.assert.calledWithMatch(Renderer.renderCalendarSummary, {
        dimensions: Renderer.sections.boluses.dimensions,
        header: Renderer.sections.boluses.summaryTitle,
        data: Renderer.aggregationsByDate.boluses,
        type: 'bolus',
        disabled: Renderer.sections.boluses.disabled,
      });
    });

    it('should render the basal calendar summary with the appropriate data', () => {
      sinon.stub(Renderer, 'renderCalendarSummary');

      Renderer.RenderCalendarSummaries();

      sinon.assert.calledWithMatch(Renderer.renderCalendarSummary, {
        dimensions: Renderer.sections.basals.dimensions,
        header: Renderer.sections.basals.summaryTitle,
        data: Renderer.aggregationsByDate.basals,
        type: 'basal',
        disabled: Renderer.sections.basals.disabled,
      });
    });
  });

  describe('renderAggregatedStats', () => {
    beforeEach(() => {
      sinon.stub(Renderer, 'renderSimpleStat');
      sinon.stub(Renderer, 'renderHorizontalBarStat');

      Renderer.stats = {
        carbs: 'carbsStub',
        coefficientOfVariation: 'coefficientOfVariationStub',
        totalInsulin: 'totalInsulinStub',
        timeInAuto: 'timeInAutoStub',
        timeInRange: 'timeInRangeStub',
        readingsInRange: 'readingsInRangeStub',
        averageDailyDose: 'averageDailyDoseStub',
        sensorUsage: 'sensorUsageStub',
      };
    });

    it('should render the timeInRange stat, but only if present', () => {
      Renderer.stats.timeInRange = null;
      Renderer.renderAggregatedStats();
      sinon.assert.neverCalledWith(Renderer.renderHorizontalBarStat, null);

      Renderer.stats.timeInRange = 'timeInRangeStub';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderHorizontalBarStat,
        'timeInRangeStub',
        {
          heading: {
            text: 'BG Distribution',
            note: 'Showing CGM data',
          },
        }
      );
    });

    it('should render the readingsInRange stat, but only if present', () => {
      Renderer.stats.readingsInRange = null;
      Renderer.renderAggregatedStats();
      sinon.assert.neverCalledWith(Renderer.renderHorizontalBarStat, null);

      Renderer.stats.readingsInRange = 'readingsInRangeStub';
      Renderer.bgSource = 'smbg';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderHorizontalBarStat,
        'readingsInRangeStub',
        {
          heading: {
            text: 'BG Distribution',
            note: 'Showing BGM data',
          },
        }
      );
    });

    it('should render the totalInsulin stat', () => {
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderHorizontalBarStat,
        'totalInsulinStub',
        {
          heading: 'Avg. Daily Insulin Ratio',
          secondaryFormatKey: 'tooltip',
          fillOpacity: 0.5,
        }
      );
    });

    it('should render the sensorUsage stat, but only if present', () => {
      Renderer.stats.sensorUsage = null;
      Renderer.renderAggregatedStats();
      sinon.assert.neverCalledWith(Renderer.renderSimpleStat, null);

      Renderer.stats.sensorUsage = 'sensorUsageStub';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderSimpleStat, 'sensorUsageStub');
    });

    it('should render the timeInAuto stat, but only if present', () => {
      Renderer.stats.timeInAuto = null;
      Renderer.renderAggregatedStats();
      sinon.assert.neverCalledWith(Renderer.renderHorizontalBarStat, null);

      Renderer.stats.timeInAuto = 'timeInAutoStub';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderHorizontalBarStat,
        'timeInAutoStub',
        {
          heading: 'Time In Automated Ratio',
          fillOpacity: 0.5,
        }
      );
    });

    it('should render the timeInOverride stat, but only if present', () => {
      Renderer.stats.timeInOverride = null;
      Renderer.renderAggregatedStats();
      sinon.assert.neverCalledWith(Renderer.renderHorizontalBarStat, null);

      Renderer.stats.timeInOverride = 'timeInOverrideStub';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderHorizontalBarStat,
        'timeInOverrideStub',
        {
          heading: 'Time In Settings Override',
          fillOpacity: 0.5,
        }
      );
    });

    it('should render the carbs stat', () => {
      Renderer.stats.carbs = 'carbsStub';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderSimpleStat, 'carbsStub');
    });

    it('should render the coefficientOfVariation stat', () => {
      Renderer.stats.coefficientOfVariation = 'coefficientOfVariationStub';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderSimpleStat, 'coefficientOfVariationStub');
    });

    it('should render the averageDailyDose stat', () => {
      Renderer.stats.averageDailyDose = 'averageDailyDoseStub';
      Renderer.renderAggregatedStats();
      sinon.assert.calledWith(Renderer.renderSimpleStat, 'averageDailyDoseStub');
    });
  });

  describe('defineStatColumns', () => {
    let defaultColumns;

    beforeEach(() => {
      Renderer.setLayoutColumns({
        width: 100,
        count: 1,
      });

      defaultColumns = [
        {
          id: 'label',
          cache: false,
          renderer: Renderer.renderCustomTextCell,
          width: Renderer.getActiveColumnWidth() * 0.65 - Renderer.tableSettings.borderWidth,
          height: 30,
          fontSize: Renderer.defaultFontSize,
          font: Renderer.font,
          align: 'left',
          headerAlign: 'left',
          border: 'TBL',
          headerBorder: 'TBL',
          valign: 'center',
          header: false,
        },
        {
          id: 'value',
          cache: false,
          renderer: Renderer.renderCustomTextCell,
          width: Renderer.getActiveColumnWidth() * 0.35 - Renderer.tableSettings.borderWidth,
          height: 30,
          fontSize: Renderer.defaultFontSize,
          font: Renderer.boldFont,
          align: 'right',
          headerAlign: 'right',
          border: 'TBR',
          headerBorder: 'TBR',
          valign: 'center',
          header: false,
        },
      ];
    });

    it('should return default column definitions', () => {
      const result = Renderer.defineStatColumns();

      expect(result).to.eql(defaultColumns);
    });

    it('should return customized column definitions', () => {
      const result = Renderer.defineStatColumns({
        height: 50,
        labelWidth: 40,
        valueWidth: 100,
        statFont: 'comic sans',
        statFontSize: 40,
        valueFont: 'courrier new',
        valueFontSize: 50,
        labelHeader: 'My Stat',
        valueHeader: 'Values',
      });

      expect(result[0].height).to.equal(50);
      expect(result[0].width).to.equal(40 - Renderer.tableSettings.borderWidth);
      expect(result[0].font).to.equal('comic sans');
      expect(result[0].fontSize).to.equal(40);
      expect(result[0].header).to.equal('My Stat');

      expect(result[1].height).to.equal(50);
      expect(result[1].width).to.equal(100 - Renderer.tableSettings.borderWidth);
      expect(result[1].font).to.equal('courrier new');
      expect(result[1].fontSize).to.equal(50);
      expect(result[1].header).to.equal('Values');
    });
  });

  describe('renderSimpleStat', () => {
    beforeEach(() => {
      sinon.stub(Renderer, 'setFill');
      sinon.stub(Renderer, 'renderTable');
    });

    it('should render a simple stat with name and value with active styles', () => {
      Renderer.renderSimpleStat({ title: 'My stat' });

      sinon.assert.calledWith(Renderer.setFill, 'black', 1);
      sinon.assert.calledOnce(Renderer.renderTable);
    });

    it('should render a simple stat with name and value with disabled styles', () => {
      Renderer.renderSimpleStat({ title: 'My stat', dataFormat: { summary: 'bgCount' } });

      sinon.assert.calledWith(Renderer.setFill, Renderer.colors.lightGrey, 1);
      sinon.assert.calledOnce(Renderer.renderTable);
    });
  });

  describe('renderHorizontalBarStat', () => {
    beforeEach(() => {
      sinon.stub(Renderer, 'renderTableHeading');
      sinon.stub(Renderer, 'renderTable');
    });

    it('should render a stat heading', () => {
      Renderer.renderHorizontalBarStat(
        Renderer.stats.totalInsulin,
        {
          heading: {
            text: 'Stat Title',
            subText: 'Stat Subtext',
            note: 'Stat Note',
          },
        }
      );

      sinon.assert.calledWith(Renderer.renderTableHeading, {
        text: 'Stat Title',
        subText: 'Stat Subtext',
        note: 'Stat Note',
      });
    });

    it('should render a stat heading with default empty text if no stat data', () => {
      Renderer.renderHorizontalBarStat(
        'My Stat',
        {
          heading: {
            text: 'Stat Title',
            subText: 'Stat Subtext',
            note: 'Stat Note',
          },
        }
      );

      sinon.assert.calledWith(Renderer.renderTableHeading, {
        text: 'Stat Title',
        subText: 'Stat Subtext',
        note: 'No data available',
      });
    });

    it('should render a stat heading with custom empty text if no stat data', () => {
      Renderer.renderHorizontalBarStat(
        'My Stat',
        {
          heading: {
            text: 'Stat Title',
            subText: 'Stat Subtext',
            note: 'Stat Note',
          },
          emptyText: 'Custom empty text',
        }
      );

      sinon.assert.calledWith(Renderer.renderTableHeading, {
        text: 'Stat Title',
        subText: 'Stat Subtext',
        note: 'Custom empty text',
      });
    });

    it('should render a stat table with primary and secondary values, and custom fill opacity', () => {
      Renderer.renderHorizontalBarStat(
        Renderer.stats.totalInsulin,
        {
          heading: 'Insulin Ratio',
          primaryFormatKey: 'label',
          secondaryFormatKey: 'tooltip',
          fillOpacity: 0.5,
        }
      );

      sinon.assert.calledWith(Renderer.renderTable,
        [sinon.match({ id: 'value' })],
        [
          {
            _fillStripe: sinon.match({ color: Renderer.colors.basal, opacity: 0.5 }),
            value: { note: 'Basal (0.7 U)', subText: '%', text: '33' },
          },
          {
            _fillStripe: sinon.match({ color: Renderer.colors.bolus, opacity: 0.5 }),
            value: { note: 'Bolus (1.3 U)', subText: '%', text: '67' },
          },
        ],
      );
    });
  });

  describe('renderCalendarSection', () => {
    beforeEach(() => {
      Renderer.setLayoutColumns({
        width: 100,
        count: 1,
      });

      Renderer.initCalendar();

      sinon.stub(Renderer, 'renderSectionHeading');
      sinon.stub(Renderer, 'renderEmptyText');
      sinon.stub(Renderer, 'renderTable');
    });

    it('should render a calendar section with empty text for disabled sections', () => {
      Renderer.renderCalendarSection({
        title: 'My Disabled Section',
        active: true,
        disabled: true,
        emptyText: 'Sorry, nothing to show here',
      });

      sinon.assert.calledWith(Renderer.renderSectionHeading, 'My Disabled Section');
      sinon.assert.calledWith(Renderer.renderEmptyText, 'Sorry, nothing to show here');

      sinon.assert.notCalled(Renderer.renderTable);
    });

    it('should render a calendar section for enabled sections', () => {
      Renderer.renderCalendarSection({
        title: 'My Active Section',
        active: true,
        disabled: false,
      });

      sinon.assert.calledWith(Renderer.renderSectionHeading, 'My Active Section');

      // Table rendered once with just one row, to calculate height, and then with all the rows
      sinon.assert.calledTwice(Renderer.renderTable);
      sinon.assert.calledWith(Renderer.renderTable, [
        sinon.match({ header: 'Mon', renderer: Renderer.renderCalendarCell }),
        sinon.match({ header: 'Tue', renderer: Renderer.renderCalendarCell }),
        sinon.match({ header: 'Wed', renderer: Renderer.renderCalendarCell }),
        sinon.match({ header: 'Thu', renderer: Renderer.renderCalendarCell }),
        sinon.match({ header: 'Fri', renderer: Renderer.renderCalendarCell }),
        sinon.match({ header: 'Sat', renderer: Renderer.renderCalendarCell }),
        sinon.match({ header: 'Sun', renderer: Renderer.renderCalendarCell }),
      ]);

      sinon.assert.notCalled(Renderer.renderEmptyText);
    });
  });

  describe('renderCalendarCell', () => {
    beforeEach(() => {
      sinon.stub(Renderer, 'setFill');
      sinon.stub(Renderer, 'setStroke');
      sinon.stub(Renderer, 'renderCountGrid');
    });

    it('should render a calendar count cell if count > 0', () => {
      Renderer.renderCalendarCell(
        {},
        { test: {
          color: 'blue',
          count: 30,
        } },
        true,
        { id: 'test', disabled: true },
        {
          x: 100,
          y: 200,
        },
        {
          top: 0,
          left: 0,
        }
      );

      sinon.assert.calledOnce(Renderer.renderCountGrid);
      sinon.assert.calledWith(Renderer.setFill, 'blue');
    });

    it('should not render a calendar count cell if not count > 0', () => {
      Renderer.renderCalendarCell(
        {},
        { test: {
          color: 'blue',
          count: 0,
        } },
        true,
        { id: 'test', disabled: true },
        {
          x: 100,
          y: 200,
        },
        {
          top: 0,
          left: 0,
        }
      );
    });

    it('should render a sitechange cell showing days since last sitechange', () => {
      Renderer.sections.siteChanges.source = 'fillCannula';

      Renderer.renderCalendarCell(
        {},
        { test: {
          color: 'blue',
          type: 'siteChange',
          daysSince: 3,
        } },
        true,
        { id: 'test', disabled: true },
        {
          x: 100,
          y: 200,
        },
        {
          top: 0,
          left: 0,
        }
      );

      sinon.assert.calledWith(Renderer.setStroke, Renderer.colors.grey);
      sinon.assert.calledWith(Renderer.doc.lineWidth, 1);

      sinon.assert.callCount(Renderer.doc.moveTo, 2);
      sinon.assert.callCount(Renderer.doc.lineTo, 2);
      sinon.assert.callCount(Renderer.doc.stroke, 2);

      sinon.assert.callCount(Renderer.doc.circle, 1);
      sinon.assert.callCount(Renderer.doc.fillAndStroke, 1);

      sinon.assert.calledOnce(Renderer.doc.image);

      sinon.assert.callCount(Renderer.doc.text, 2);
      sinon.assert.calledWith(Renderer.doc.text, '3 days');
    });

    it('should render a sitechange cell without days since last sitechange when NaN', () => {
      Renderer.sections.siteChanges.source = 'fillCannula';

      Renderer.renderCalendarCell(
        {},
        { test: {
          color: 'blue',
          type: 'siteChange',
          daysSince: NaN,
        } },
        true,
        { id: 'test', disabled: true },
        {
          x: 100,
          y: 200,
        },
        {
          top: 0,
          left: 0,
        }
      );

      sinon.assert.calledWith(Renderer.setStroke, Renderer.colors.grey);
      sinon.assert.calledWith(Renderer.doc.lineWidth, 1);

      sinon.assert.callCount(Renderer.doc.moveTo, 2);
      sinon.assert.callCount(Renderer.doc.lineTo, 2);
      sinon.assert.callCount(Renderer.doc.stroke, 2);

      sinon.assert.callCount(Renderer.doc.circle, 1);
      sinon.assert.callCount(Renderer.doc.fillAndStroke, 1);

      sinon.assert.calledOnce(Renderer.doc.image);

      sinon.assert.callCount(Renderer.doc.text, 1);
    });
  });

  describe('renderCountGrid', () => {
    const largeRadius = 15;
    const smallRadius = 4.5;

    beforeEach(() => {
      sinon.spy(Renderer, 'renderCountGrid');
    });

    it('should render a single count grid when count <= 9', () => {
      Renderer.renderCountGrid(
        9,
        100,
        {
          x: 0,
          y: 0,
        },
      );

      sinon.assert.callCount(Renderer.doc.circle, 9);
      sinon.assert.callCount(Renderer.doc.fill, 9);

      sinon.assert.alwaysCalledWith(
        Renderer.doc.circle,
        sinon.match.typeOf('number'),
        sinon.match.typeOf('number'),
        largeRadius
      );

      sinon.assert.callCount(Renderer.renderCountGrid, 1);
    });

    it('should render smaller recursive count grids when count > 9', () => {
      Renderer.renderCountGrid(
        10,
        100,
        {
          x: 0,
          y: 0,
        },
      );

      sinon.assert.callCount(Renderer.doc.circle, 10);
      sinon.assert.callCount(Renderer.doc.fill, 10);

      sinon.assert.calledWith(
        Renderer.doc.circle,
        sinon.match.typeOf('number'),
        sinon.match.typeOf('number'),
        largeRadius
      );

      sinon.assert.calledWith(
        Renderer.doc.circle,
        sinon.match.typeOf('number'),
        sinon.match.typeOf('number'),
        smallRadius
      );

      sinon.assert.callCount(Renderer.renderCountGrid, 2);
    });

    it('should render smaller recursive count grids to a max count of 17', () => {
      Renderer.renderCountGrid(
        83,
        100,
        {
          x: 0,
          y: 0,
        },
      );

      sinon.assert.callCount(Renderer.doc.circle, 17);
      sinon.assert.callCount(Renderer.doc.fill, 17);
    });
  });

  describe('renderCalendarSummary', () => {
    beforeEach(() => {
      Renderer.setLayoutColumns({
        width: 100,
        count: 1,
      });

      Renderer.initCalendar();

      sinon.spy(Renderer, 'defineStatColumns');
      sinon.stub(Renderer, 'renderTable');
    });

    it('should not render a table if section is disabled', () => {
      Renderer.renderCalendarSummary({
        disabled: true,
      });

      sinon.assert.notCalled(Renderer.renderTable);
    });

    it('should call defineStatColumns with custom opts', () => {
      Renderer.renderCalendarSummary({
        dimensions: Renderer.sections.basals.dimensions,
        header: Renderer.sections.basals.summaryTitle,
        data: Renderer.aggregationsByDate.basals,
        type: 'basal',
        disabled: false,
      });

      sinon.assert.calledOnce(Renderer.defineStatColumns);
      sinon.assert.calledWith(Renderer.defineStatColumns, {
        labelWidth: 75,
        valueWidth: 25,
        height: 20,
        labelHeader: 'Total basal events',
        valueHeader: '10',
      });
    });

    it('should render a table if section is enabled', () => {
      Renderer.renderCalendarSummary({
        dimensions: Renderer.sections.basals.dimensions,
        header: Renderer.sections.basals.summaryTitle,
        data: Renderer.aggregationsByDate.basals,
        type: 'basal',
        disabled: false,
      });

      sinon.assert.calledOnce(Renderer.renderTable);
    });
  });

  describe('renderEmptyText', () => {
    beforeEach(() => {
      Renderer.setLayoutColumns({
        width: 100,
        count: 1,
      });

      sinon.spy(Renderer, 'getActiveColumnWidth');
      sinon.stub(Renderer, 'resetText');
      sinon.stub(Renderer, 'setFill');
    });

    it('should render text with the appropriate styles and width', () => {
      Renderer.renderEmptyText('No data to show');

      sinon.assert.calledWith(Renderer.setFill, Renderer.colors.lightGrey);

      sinon.assert.calledOnce(Renderer.getActiveColumnWidth);

      sinon.assert.calledWith(Renderer.doc.fontSize, Renderer.defaultFontSize);
      sinon.assert.calledWith(Renderer.doc.text, 'No data to show', { width: 100 });
    });

    it('should move down and reset the text styles when finished', () => {
      Renderer.renderEmptyText('No data to show');

      sinon.assert.calledOnce(Renderer.resetText);
      sinon.assert.calledOnce(Renderer.doc.moveDown);
    });
  });
});
