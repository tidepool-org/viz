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

/* eslint-disable max-len */

import _ from 'lodash';

import PrintView from '../../../src/modules/print/PrintView';

import * as patients from '../../../data/patient/profiles';

import {
  getTimezoneFromTimePrefs,
  formatBirthdate,
  formatCurrentDate,
} from '../../../src/utils/datetime';

import {
  DEFAULT_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
} from '../../../src/modules/print/utils/constants';

import Doc from '../../helpers/pdfDoc';
import { getPatientFullName } from '../../../src/utils/misc';

describe('PrintView', () => {
  let Renderer;

  const data = {
    bgPrefs: {
      bgBounds: {
        veryHighThreshold: 300,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 54,
      },
      bgUnits: 'mg/dL',
    },
    timePrefs: {
      timezoneAware: true,
      timezoneName: 'US/Pacific',
    },
    metaData: {
      bgSources: { current: 'cbg' },
      latestPumpUpload: { manufacturer: 'PumpCo' },
    },
    data: {
      current: {
        endpoints: {
          range: [100, 200],
        },
        stats: {
          averageGlucose: {
            averageGlucose: 12.8,
            total: 70,
          },
        },
        aggregationsByDate: { myAggregation: 'foo' },
      },
    },
  };

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
    patient: patients.standard,

    width: 8.5 * DPI - (2 * MARGIN),
    title: 'Print View',
  };

  beforeEach(() => {
    doc = new Doc({ margin: MARGIN });
    Renderer = new PrintView(doc, data, opts);
    Renderer.doc.font.resetHistory();
  });

  describe('class constructor', () => {
    it('should instantiate without errors', () => {
      expect(Renderer).to.be.an('object');
    });

    it('should set default properties as provided by constructor args', () => {
      expect(Renderer.doc).to.eql(doc);
      expect(Renderer.data).to.eql(data);

      const overrideOpts = [
        'title',
        'debug',
        'dpi',
        'margins',
        'defaultFontSize',
        'footerFontSize',
        'headerFontSize',
        'largeFontSize',
        'smallFontSize',
        'extraSmallFontSize',
        'width',
        'height',
        'patient',
      ];

      _.each(overrideOpts, opt => {
        expect(Renderer[opt]).to.equal(opts[opt]);
      });

      expect(Renderer.bgUnits).to.equal(data.bgPrefs.bgUnits);
      expect(Renderer.bgBounds).to.eql(data.bgPrefs.bgBounds);
      expect(Renderer.timezone).to.equal(getTimezoneFromTimePrefs(data.timePrefs));
      expect(Renderer.endpoints).to.eql(data.data.current.endpoints);
      expect(Renderer.bgSource).to.equal(data.metaData.bgSources.current);
      expect(Renderer.latestPumpUpload).to.eql(data.metaData.latestPumpUpload);
      expect(Renderer.manufacturer).to.equal(data.metaData.latestPumpUpload.manufacturer);
      expect(Renderer.stats.averageGlucose.data.raw.averageGlucose).to.eql(data.data.current.stats.averageGlucose.averageGlucose);
      expect(Renderer.aggregationsByDate).to.eql(data.data.current.aggregationsByDate);
    });

    it('should set fallback default properties when not provided by constructor args', () => {
      const fallbackOpts = [
        'debug',
        'dpi',
        'margins',
        'defaultFontSize',
        'footerFontSize',
        'headerFontSize',
        'largeFontSize',
        'smallFontSize',
        'extraSmallFontSize',
        'width',
        'height',
      ];

      const strippedOpts = _.cloneDeep(opts);

      _.forEach(fallbackOpts, opt => {
        delete(strippedOpts[opt]);
      });

      const strippedRenderer = new PrintView(doc, data, opts);

      _.each(fallbackOpts, opt => {
        expect(strippedRenderer[opt]).to.not.be.undefined;
      });
    });

    it('should set patientTags, sites, and showHeaderBadges from constructor args', () => {
      const patientTags = [{ id: 't2', name: 'Zeta' }, { id: 't1', name: 'alpha' }];
      const sites = [{ id: 's1', name: 'North' }, { id: 's2', name: 'Downtown' }];

      const badgeRenderer = new PrintView(doc, data, {
        ...opts,
        patientTags,
        sites,
        showHeaderBadges: true,
      });

      expect(badgeRenderer.patientTags).to.eql(patientTags);
      expect(badgeRenderer.sites).to.eql(sites);
      expect(badgeRenderer.showHeaderBadges).to.be.true;
    });

    it('should default patientTags and sites to empty arrays and showHeaderBadges to false', () => {
      expect(Renderer.patientTags).to.eql([]);
      expect(Renderer.sites).to.eql([]);
      expect(Renderer.showHeaderBadges).to.be.false;
    });

    it('should set data to an empty object when not provided to constructor', () => {
      const noDataRenderer = new PrintView(doc, undefined, opts);
      expect(noDataRenderer.data).to.eql({});
    });

    it('should set it\'s own required initial instance properties', () => {
      const requiredProps = [
        { prop: 'font', type: 'string' },
        { prop: 'boldFont', type: 'string' },
        { prop: 'colors', type: 'object' },
        { prop: 'tableSettings', type: 'object' },
        { prop: 'topEdge', type: 'number', value: Renderer.margins.top },
        { prop: 'leftEdge', type: 'number', value: Renderer.margins.left },
        { prop: 'rightEdge', type: 'number', value: Renderer.margins.left + Renderer.width },
        { prop: 'bottomEdge', type: 'number', value: Renderer.margins.top + Renderer.height },
        { prop: 'patientInfoBox', type: 'object', value: {
          width: 0,
          height: 0,
        } },
        { prop: 'chartArea', type: 'object' },
        { prop: 'initialChartArea', type: 'object' },
        { prop: 'totalPages', type: 'number', value: 0 },
        { prop: 'initialTotalPages', type: 'number', value: 0 },
        { prop: 'currentPageIndex', type: 'number', value: -1 },
      ];

      _.each(requiredProps, item => {
        expect(Renderer[item.prop]).to.be.a(item.type);
        item.hasOwnProperty('value') && expect(Renderer[item.prop]).to.eql(item.value);
      });
    });

    it('should remove any existing listeners assigned to the doc\'s pageAdded event', () => {
      sinon.assert.calledWith(Renderer.doc.removeAllListeners, 'pageAdded');
    });

    it('should assign the newPage function as a callback to the doc\'s pageAdded event', () => {
      sinon.assert.calledWith(Renderer.doc.on, 'pageAdded', Renderer.newPage);
    });

    it('should subtract the header and footer size from the chart area', () => {
      expect(Renderer.chartArea.topEdge).to.be.above(Renderer.initialChartArea.topEdge);
      expect(Renderer.chartArea.bottomEdge).to.be.below(Renderer.initialChartArea.bottomEdge);
    });

    it('should set up addSVG method', () => {
      expect(Renderer.addSVG).to.be.a('function');
    });
  });

  describe('newPage', () => {
    it('should default the `showProfile` option to true', () => {
      const options = {};
      Renderer.newPage(null, options);
      expect(options.showProfile).to.be.true;
    });

    it('should render a header and footer with provided dateText and options', () => {
      sinon.stub(Renderer, 'renderHeader').returns(Renderer);
      sinon.stub(Renderer, 'renderFooter');
      const dateText = 'my date';
      const options = { showProfile: false };

      Renderer.newPage(dateText, options);
      sinon.assert.calledWith(Renderer.renderHeader, dateText, options);
      sinon.assert.calledWith(Renderer.renderFooter, options);
    });

    it('should increment `currentPageIndex` each time it\'s called', () => {
      expect(Renderer.currentPageIndex).to.equal(-1);
      Renderer.newPage();
      expect(Renderer.currentPageIndex).to.equal(0);
      Renderer.newPage();
      expect(Renderer.currentPageIndex).to.equal(1);
    });

    it('should increment `totalPages` each time it\'s called', () => {
      expect(Renderer.totalPages).to.equal(0);
      Renderer.newPage();
      expect(Renderer.totalPages).to.equal(1);
      Renderer.newPage();
      expect(Renderer.totalPages).to.equal(2);
    });

    it('should reset the font styles after rendering the footer', () => {
      sinon.stub(Renderer, 'renderHeader').returns(Renderer);
      sinon.stub(Renderer, 'renderFooter');
      Renderer.doc.font.resetHistory();
      Renderer.doc.fontSize.resetHistory();
      Renderer.newPage();

      sinon.assert.calledOnce(Renderer.doc.font);
      sinon.assert.calledOnce(Renderer.doc.fontSize);
      sinon.assert.callOrder(
        Renderer.renderHeader,
        Renderer.renderFooter,
        Renderer.doc.font,
        Renderer.doc.fontSize
      );
    });

    it('should maintain the previous page\'s column layout and position', () => {
      expect(Renderer.layoutColumns).to.be.undefined;

      Renderer.setLayoutColumns({ width: Renderer.width, count: 3 });
      Renderer.goToLayoutColumnPosition(1);

      expect(Renderer.layoutColumns.activeIndex).to.equal(1);
      expect(Renderer.layoutColumns.count).to.equal(3);

      Renderer.newPage();

      expect(Renderer.layoutColumns.activeIndex).to.equal(1);
      expect(Renderer.layoutColumns.count).to.equal(3);
    });

    it('should call `setNewPageTablePosition` when rendering a table', () => {
      const setNewPageTablePositionSpy = sinon.spy(Renderer, 'setNewPageTablePosition');

      Renderer.table = undefined;
      Renderer.newPage();

      sinon.assert.callCount(setNewPageTablePositionSpy, 0);

      Renderer.table = {
        pos: {
          x: 100,
          y: 100,
        },
        pdf: doc,
      };

      Renderer.newPage();
      sinon.assert.callCount(setNewPageTablePositionSpy, 1);
    });
  });

  describe('setNewPageTablePosition', () => {
    it('should maintain the previous page\'s table x position when in a layout column', () => {
      Renderer.setLayoutColumns({ width: 100, count: 3, gutter: 10 });
      Renderer.goToLayoutColumnPosition(1);

      const xPos = Renderer.layoutColumns.columns[1].x;
      const yPos = 300;

      Renderer.doc.x = xPos;
      Renderer.doc.y = yPos;

      Renderer.table = {
        pos: {
          x: xPos,
          y: yPos,
        },
        pdf: doc,
      };

      Renderer.setNewPageTablePosition();

      expect(Renderer.doc.y).to.equal(Renderer.chartArea.topEdge);
      expect(Renderer.table.pos.y).to.equal(Renderer.chartArea.topEdge);

      expect(Renderer.doc.x).to.equal(xPos);
      expect(Renderer.table.pos.x).to.equal(xPos);
    });

    it('should use the left edge as the x position when not in a layout column', () => {
      Renderer.layoutColumns = undefined;

      Renderer.doc.x = 200;
      Renderer.doc.y = 100;

      Renderer.table = {
        pos: {
          x: 200,
          y: 100,
        },
        pdf: doc,
      };

      Renderer.setNewPageTablePosition();

      expect(Renderer.doc.y).to.equal(Renderer.chartArea.topEdge);
      expect(Renderer.table.pos.y).to.equal(Renderer.chartArea.topEdge);

      expect(Renderer.doc.x).to.equal(Renderer.chartArea.leftEdge);
      expect(Renderer.table.pos.x).to.equal(Renderer.chartArea.leftEdge);
    });
  });

  describe('setLayoutColumns', () => {
    it('should define an equal spaced column layout when type is unspecified', () => {
      Renderer.setLayoutColumns({ count: 3 });
      expect(Renderer.layoutColumns.type).to.equal('equal');
    });

    it('should define an equal spaced column layout with correct count and gutters', () => {
      const colCount = 3;

      Renderer.setLayoutColumns({
        type: 'equal',
        count: colCount,
        gutter: 10,
        width: 120,
      });

      expect(Renderer.layoutColumns.type).to.equal('equal');
      expect(Renderer.layoutColumns.columns.length).to.equal(colCount);
      expect(Renderer.layoutColumns.columns[0].width).to.equal(100 / colCount);
      expect(Renderer.layoutColumns.columns[1].width).to.equal(100 / colCount);
      expect(Renderer.layoutColumns.columns[2].width).to.equal(100 / colCount);
    });

    it('should define a percentage-based column layout with correct count and gutters', () => {
      const colCount = 3;

      Renderer.setLayoutColumns({
        type: 'percentage',
        gutter: 10,
        width: 1020,
        widths: [30, 40, 30],
      });

      expect(Renderer.layoutColumns.type).to.equal('percentage');
      expect(Renderer.layoutColumns.columns.length).to.equal(colCount);
      expect(Renderer.layoutColumns.columns[0].width).to.equal(300);
      expect(Renderer.layoutColumns.columns[1].width).to.equal(400);
      expect(Renderer.layoutColumns.columns[2].width).to.equal(300);
    });
  });

  describe('updateLayoutColumnPosition', () => {
    it('should update the position of a layout column to the current doc cursor position', () => {
      Renderer.doc.y = Renderer.chartArea.topEdge;

      const activeColumn = 0;
      Renderer.setLayoutColumns({ count: 3 });
      Renderer.goToLayoutColumnPosition(activeColumn);

      expect(Renderer.layoutColumns.columns[activeColumn].x).to.equal(Renderer.chartArea.leftEdge);
      expect(Renderer.layoutColumns.columns[activeColumn].y).to.equal(Renderer.chartArea.topEdge);

      Renderer.doc.x = 400;
      Renderer.doc.y = 500;

      Renderer.updateLayoutColumnPosition(activeColumn);
      expect(Renderer.layoutColumns.columns[activeColumn].x).to.equal(400);
      expect(Renderer.layoutColumns.columns[activeColumn].y).to.equal(500);
    });
  });

  describe('goToLayoutColumnPosition', () => {
    it('should move the doc cursor to a layout column position', () => {
      Renderer.doc.x = Renderer.chartArea.leftEdge;
      Renderer.doc.y = Renderer.chartArea.topEdge;

      const activeColumn = 1;
      Renderer.setLayoutColumns({ count: 3, width: 900 });

      expect(Renderer.doc.x).to.equal(Renderer.chartArea.leftEdge);
      expect(Renderer.doc.y).to.equal(Renderer.chartArea.topEdge);

      Renderer.goToLayoutColumnPosition(activeColumn);

      expect(Renderer.doc.x).to.equal(Renderer.chartArea.leftEdge + 300);
      expect(Renderer.doc.y).to.equal(Renderer.chartArea.topEdge);
    });
  });

  describe('goToPage', () => {
    it('should set `currentPageIndex` to the provided index', () => {
      Renderer.initialTotalPages = 0;
      Renderer.currentPageIndex = 2;
      Renderer.goToPage(1);
      expect(Renderer.currentPageIndex).to.equal(1);
    });

    it('should call `doc.switchToPage` with the provided index + initialTotalPages ', () => {
      Renderer.initialTotalPages = 2;
      Renderer.goToPage(1);
      sinon.assert.calledWith(Renderer.doc.switchToPage, 3);
    });
  });

  describe('getShortestLayoutColumn', () => {
    it('should return the index of the column with the top-most y position', () => {
      Renderer.doc.y = 100;
      Renderer.setLayoutColumns({ count: 3, width: 900 });

      expect(Renderer.getShortestLayoutColumn()).to.equal(0);

      Renderer.doc.y = 200;
      Renderer.updateLayoutColumnPosition(0);
      expect(Renderer.getShortestLayoutColumn()).to.equal(1);

      Renderer.doc.y = 300;
      Renderer.updateLayoutColumnPosition(0);
      Renderer.updateLayoutColumnPosition(1);

      expect(Renderer.getShortestLayoutColumn()).to.equal(2);
    });
  });

  describe('getLongestLayoutColumn', () => {
    it('should return the index of the column with the bottom-most y position', () => {
      Renderer.doc.y = 100;
      Renderer.setLayoutColumns({ count: 3, width: 900 });

      expect(Renderer.getLongestLayoutColumn()).to.equal(0);

      Renderer.doc.y = 200;
      Renderer.updateLayoutColumnPosition(0);
      expect(Renderer.getLongestLayoutColumn()).to.equal(0);

      Renderer.doc.y = 300;
      Renderer.updateLayoutColumnPosition(2);

      expect(Renderer.getLongestLayoutColumn()).to.equal(2);

      Renderer.doc.y = 400;
      Renderer.updateLayoutColumnPosition(1);

      expect(Renderer.getLongestLayoutColumn()).to.equal(1);
    });
  });

  describe('getActiveColumnWidth', () => {
    it('should return the width of the active column', () => {
      Renderer.setLayoutColumns({
        type: 'percentage',
        gutter: 10,
        width: 1020,
        widths: [30, 40, 30],
      });

      Renderer.goToLayoutColumnPosition(1);
      expect(Renderer.getActiveColumnWidth()).to.equal(400);
    });
  });

  describe('getDateRange', () => {
    it('should return the formatted date range when provided date strings and format', () => {
      const result = Renderer.getDateRange('2017-12-01', '2017-12-10', 'YYYY-MM-DD');
      expect(result).to.equal('Dec 1 - Dec 10, 2017');
    });

    it('should return the formatted date range when provided date timestamps', () => {
      Renderer.timezone = 'UTC';
      const result = Renderer.getDateRange(Date.parse('2017-12-01T00:00:00.000Z'), Date.parse('2017-12-10T00:00:00.000Z'));
      expect(result).to.equal('Dec 1 - Dec 10, 2017');
    });

    it('should allow setting a custom prefix', () => {
      Renderer.timezone = 'UTC';
      const result = Renderer.getDateRange(Date.parse('2017-12-01T00:00:00.000Z'), Date.parse('2017-12-10T00:00:00.000Z'), null, 'My Prefix: ');
      expect(result).to.equal('My Prefix: Dec 1 - Dec 10, 2017');
    });

    it('should allow setting a custom month format to use', () => {
      Renderer.timezone = 'UTC';
      const result = Renderer.getDateRange(Date.parse('2017-12-01T00:00:00.000Z'), Date.parse('2017-12-10T00:00:00.000Z'), null, '', 'MMMM');
      expect(result).to.equal('December 1 - December 10, 2017');
    });
  });

  describe('setFill', () => {
    it('should call doc fill methods with default args', () => {
      Renderer.setFill();
      sinon.assert.calledWith(Renderer.doc.fillColor, 'black');
      sinon.assert.calledWith(Renderer.doc.fillOpacity, 1);
    });

    it('should call doc fill methods with provided args', () => {
      Renderer.setFill('blue', 0.5);
      sinon.assert.calledWith(Renderer.doc.fillColor, 'blue');
      sinon.assert.calledWith(Renderer.doc.fillOpacity, 0.5);
    });
  });

  describe('setStroke', () => {
    it('should call doc stroke methods with default args', () => {
      Renderer.setStroke();
      sinon.assert.calledWith(Renderer.doc.strokeColor, 'black');
      sinon.assert.calledWith(Renderer.doc.strokeOpacity, 1);
    });

    it('should call doc stroke methods with provided args', () => {
      Renderer.setStroke('blue', 0.5);
      sinon.assert.calledWith(Renderer.doc.strokeColor, 'blue');
      sinon.assert.calledWith(Renderer.doc.strokeOpacity, 0.5);
    });
  });

  describe('resetText', () => {
    it('should reset the doc text style', () => {
      sinon.spy(Renderer, 'setFill');

      Renderer.resetText();
      sinon.assert.calledOnce(Renderer.setFill);
      sinon.assert.calledWith(Renderer.doc.lineGap, 0);
      sinon.assert.calledWith(Renderer.doc.fontSize, opts.defaultFontSize);
      sinon.assert.calledWith(Renderer.doc.font, Renderer.font);
    });
  });

  describe('renderSectionHeading', () => {
    it('should render a section heading provided as a string', () => {
      Renderer.renderSectionHeading('hello');
      sinon.assert.calledWith(Renderer.doc.text, 'hello');
    });

    it('should render a section heading provided as an object with text and subText keys', () => {
      Renderer.renderSectionHeading({
        text: 'hello',
        subText: 'there',
      });

      sinon.assert.calledWith(Renderer.doc.text, 'hello');
      sinon.assert.calledWith(Renderer.doc.text, ' there');
    });

    it('should set default font and font sizes for the text and subText', () => {
      Renderer.renderSectionHeading({
        text: 'hello',
        subText: 'there',
      });

      sinon.assert.calledWith(Renderer.doc.fontSize, Renderer.headerFontSize);
      sinon.assert.calledWith(Renderer.doc.font, Renderer.font);

      sinon.assert.calledWith(Renderer.doc.fontSize, Renderer.defaultFontSize);
    });

    it('should override default font sizes for the text and subText', () => {
      Renderer.renderSectionHeading({
        text: 'hello',
        subText: 'there',
      }, {
        font: 'mainFont',
        fontSize: 16,
        subTextFont: 'otherFont',
        subTextFontSize: 18,
      });

      sinon.assert.calledWith(Renderer.doc.fontSize, 16);
      sinon.assert.calledWith(Renderer.doc.font, 'mainFont');

      sinon.assert.calledWith(Renderer.doc.fontSize, 18);
      sinon.assert.calledWith(Renderer.doc.font, 'otherFont');
    });

    it('should default to the current doc position', () => {
      Renderer.doc.x = Renderer.chartArea.leftEdge;
      Renderer.doc.y = Renderer.chartArea.topEdge;

      const xPos = Renderer.doc.x;
      const yPos = Renderer.doc.y;
      Renderer.renderSectionHeading('hello');

      sinon.assert.calledWithMatch(Renderer.doc.text, 'hello', xPos, yPos);
    });

    it('should override the current doc position with provided args', () => {
      Renderer.doc.x = Renderer.chartArea.leftEdge;
      Renderer.doc.y = Renderer.chartArea.topEdge;

      Renderer.renderSectionHeading('hello', {
        xPos: 100,
        yPos: 300,
      });

      sinon.assert.calledWithMatch(Renderer.doc.text, 'hello', 100, 300);
    });

    it('should reset the text style when done', () => {
      sinon.spy(Renderer, 'resetText');
      Renderer.renderSectionHeading('hello');

      sinon.assert.calledOnce(Renderer.resetText);
    });

    it('should move the cursor down a default or specified amount when done', () => {
      Renderer.renderSectionHeading('hello');
      sinon.assert.calledOnce(Renderer.doc.moveDown);
      sinon.assert.calledWith(Renderer.doc.moveDown, 1);

      Renderer.renderSectionHeading('hello', { moveDown: 3.5 });
      sinon.assert.calledWith(Renderer.doc.moveDown, 3.5);
    });
  });

  describe('renderBadge', () => {
    it('should draw a rounded rect in the badge colour with the text on top', () => {
      Renderer.renderBadge('Zeta', 100, 50);

      sinon.assert.calledOnce(Renderer.doc.roundedRect);
      sinon.assert.calledWith(Renderer.doc.fill, Renderer.colors.badge);
      sinon.assert.calledWith(Renderer.doc.font, Renderer.boldFont);
      sinon.assert.calledWith(Renderer.doc.fillColor, 'white');
      sinon.assert.calledWith(Renderer.doc.text, 'Zeta');
    });

    it('should honour colour and font overrides', () => {
      Renderer.renderBadge('Zeta', 10, 20, { fillColor: '#123456', textColor: '#abcdef', fontSize: 12 });

      sinon.assert.calledWith(Renderer.doc.fill, '#123456');
      sinon.assert.calledWith(Renderer.doc.fillColor, '#abcdef');
      sinon.assert.calledWith(Renderer.doc.fontSize, 12);
    });

    it('should return the badge size, and only measure when `draw` is false', () => {
      const { width, height } = Renderer.renderBadge('Zeta', 10, 20, { draw: false });

      expect(width).to.be.above(Renderer.doc.widthOfString());
      expect(height).to.be.above(Renderer.doc.currentLineHeight());
      sinon.assert.notCalled(Renderer.doc.roundedRect);
      sinon.assert.notCalled(Renderer.doc.text);
    });
  });

  describe('renderHeaderBadges', () => {
    const patientTags = [{ id: 't2', name: 'Zeta' }, { id: 't1', name: 'alpha' }];
    const sites = [{ id: 's1', name: 'North' }, { id: 's2', name: 'Downtown' }];

    // Stubbed widthOfString returns 20 and currentLineHeight 10, so every
    // default badge measures 29.4 x 14.6 and four fit on one 149pt row
    const badgeWidth = 29.4;
    const badgeHeight = 14.6;
    const gap = 3.5;
    const blockX = 200;
    const blockY = 36;

    const makeItems = (count, prefix) => _.times(count, i => ({ id: `${prefix}${i}`, name: `${prefix} ${i}` }));

    const drawnBadges = renderer => _.filter(
      renderer.renderBadge.getCalls(),
      call => _.get(call.args[3], 'draw') !== false
    );

    const countLabelCalls = renderer => _.filter(
      renderer.doc.text.getCalls(),
      call => _.startsWith(call.args[0], '+')
    );

    const createRenderer = (tags, sitesArg) => {
      const badgeRenderer = new PrintView(doc, data, { ...opts, patientTags: tags, sites: sitesArg });
      sinon.spy(badgeRenderer, 'renderBadge');
      return badgeRenderer;
    };

    it('should render one badge per item, tags first then sites, in the order received', () => {
      Renderer = createRenderer(patientTags, sites);
      Renderer.renderHeaderBadges({ x: blockX, y: blockY });

      const drawn = drawnBadges(Renderer);
      expect(_.map(drawn, 'args[0]')).to.eql(['Zeta', 'alpha', 'North', 'Downtown']);
      sinon.assert.callCount(Renderer.doc.roundedRect, 4);
      expect(Renderer.badgeBlock).to.eql({ width: 149, height: badgeHeight, hiddenCount: 0 });
    });

    it('should right-align each row inside the block', () => {
      Renderer = createRenderer(patientTags, []);
      Renderer.renderHeaderBadges({ x: blockX, y: blockY });

      const rowWidth = badgeWidth * 2 + gap;
      const drawn = drawnBadges(Renderer);
      expect(drawn[0].args[1]).to.be.closeTo(blockX + 149 - rowWidth, 0.001);
      expect(drawn[1].args[1]).to.be.closeTo(blockX + 149 - badgeWidth, 0.001);
      expect(drawn[0].args[2]).to.equal(blockY);
    });

    it('should wrap to a second row when the pills exceed the block width', () => {
      Renderer = createRenderer(makeItems(3, 'tag'), makeItems(2, 'site'));
      const block = Renderer.renderHeaderBadges({ x: blockX, y: blockY });

      const drawn = drawnBadges(Renderer);
      expect(drawn).to.have.lengthOf(5);
      expect(_.map(drawn.slice(0, 4), 'args[2]')).to.eql([blockY, blockY, blockY, blockY]);
      expect(drawn[4].args[2]).to.be.closeTo(blockY + badgeHeight + gap, 0.001);
      expect(block.height).to.be.closeTo(badgeHeight * 2 + gap, 0.001);
      expect(block.hiddenCount).to.equal(0);
      expect(countLabelCalls(Renderer)).to.have.lengthOf(0);
    });

    it('should stop after two rows and write a single +N counting hidden tags and sites together', () => {
      Renderer = createRenderer(makeItems(7, 'tag'), makeItems(5, 'site'));
      Renderer.doc.widthOfString.callsFake(text => (_.startsWith(text, '+') ? 8 : 20));

      const block = Renderer.renderHeaderBadges({ x: blockX, y: blockY });

      expect(drawnBadges(Renderer)).to.have.lengthOf(8);
      const labels = countLabelCalls(Renderer);
      expect(labels).to.have.lengthOf(1);
      expect(labels[0].args[0]).to.equal('+4');
      sinon.assert.calledWith(Renderer.doc.fontSize, 5.8);
      sinon.assert.calledWith(Renderer.doc.fillColor, Renderer.colors.badge);
      expect(block.hiddenCount).to.equal(4);
      expect(block.height).to.be.closeTo(badgeHeight * 2 + gap, 0.001);
    });

    it('should drop the last visible pill when the +N label would not otherwise fit', () => {
      Renderer = createRenderer(makeItems(9, 'tag'), []);
      const block = Renderer.renderHeaderBadges({ x: blockX, y: blockY });

      expect(drawnBadges(Renderer)).to.have.lengthOf(7);
      const labels = countLabelCalls(Renderer);
      expect(labels).to.have.lengthOf(1);
      expect(labels[0].args[0]).to.equal('+2');
      expect(block.hiddenCount).to.equal(2);
    });

    it('should draw nothing and return height 0 when both arrays are empty', () => {
      Renderer = createRenderer([], []);
      const block = Renderer.renderHeaderBadges({ x: blockX, y: blockY });

      expect(block).to.eql({ width: 149, height: 0, hiddenCount: 0 });
      sinon.assert.notCalled(Renderer.renderBadge);
      sinon.assert.notCalled(Renderer.doc.roundedRect);
      sinon.assert.notCalled(Renderer.doc.text);
    });
  });

  describe('renderCellStripe', () => {
    const pos = {
      x: 100,
      y: 200,
    };

    const column = {
      fillStripe: {
        color: 'blue',
        opacity: 0.6,
        width: 8,
      },
      headerFillStripe: {
        color: 'green',
        opacity: 0.7,
        width: 10,
      },
      height: 30,
      headerHeight: 40,
    };

    beforeEach(() => {
      sinon.spy(Renderer, 'setFill');
    });

    afterEach(() => {
      Renderer.setFill.resetHistory();
    });

    it('should not render a fill stripe when missing column fill stripe definition', () => {
      const stripe = Renderer.renderCellStripe({}, {}, pos);

      expect(stripe).to.eql({
        width: 0,
        height: 0,
        color: Renderer.colors.grey,
        opacity: 1,
        background: false,
        padding: 0,
      });

      sinon.assert.notCalled(Renderer.setFill);
      sinon.assert.notCalled(Renderer.doc.rect);
      sinon.assert.notCalled(Renderer.doc.fill);
    });

    it('should render a fill stripe with default styles in a table cell', () => {
      const stripe = Renderer.renderCellStripe({}, { fillStripe: true, height: 20 }, pos);

      sinon.assert.calledWith(Renderer.setFill, Renderer.colors.grey, 1);
      sinon.assert.calledWith(Renderer.doc.rect, pos.x + 0.25, pos.y + 0.25, 6);
      sinon.assert.calledOnce(Renderer.doc.fill);

      expect(stripe).to.eql({
        width: 6,
        height: 20,
        color: Renderer.colors.grey,
        opacity: 1,
        background: false,
        padding: 0,
      });
    });

    it('should render a fill stripe with custom styles from column def in a standard cell', () => {
      const paddedColumn = _.assign({}, column, {
        fillStripe: _.assign({}, column.fillStripe, {
          padding: 5,
        }),
      });

      const stripe = Renderer.renderCellStripe({}, paddedColumn, pos);
      const height = stripe.height - 0.5 - (2 * paddedColumn.fillStripe.padding);
      const xPos = pos.x + 0.25 + paddedColumn.fillStripe.padding;
      const yPos = pos.y + 0.25 + paddedColumn.fillStripe.padding;

      sinon.assert.calledWith(Renderer.setFill, 'blue', 0.6);
      sinon.assert.calledWith(Renderer.doc.rect, xPos, yPos, 8, height);
      sinon.assert.calledOnce(Renderer.doc.fill);

      expect(stripe).to.eql({
        width: 8,
        height: 30,
        color: 'blue',
        opacity: 0.6,
        background: false,
        padding: 5,
      });
    });

    it('should render a fill stripe with custom styles from data def in a standard cell', () => {
      const colData = {
        _fillStripe: {
          color: 'orange',
          opacity: 0.9,
          width: 100,
        },
        _renderedContent: {
          height: 80,
        },
      };

      const stripe = Renderer.renderCellStripe(colData, {}, pos);
      const height = stripe.height - 0.5;
      const xPos = pos.x + 0.25;
      const yPos = pos.y + 0.25;

      sinon.assert.calledWith(Renderer.setFill, 'orange', 0.9);
      sinon.assert.calledWith(Renderer.doc.rect, xPos, yPos, 100, height);
      sinon.assert.calledOnce(Renderer.doc.fill);

      expect(stripe).to.eql({
        width: 100,
        height: 80,
        color: 'orange',
        opacity: 0.9,
        background: false,
        padding: 0,
      });
    });

    it('should render a fill stripe with custom styles from column def in a header cell', () => {
      const isHeader = true;
      const stripe = Renderer.renderCellStripe({}, column, pos, isHeader);
      const height = stripe.height - 0.5;

      sinon.assert.calledWith(Renderer.setFill, 'green', 0.7);
      sinon.assert.calledWith(Renderer.doc.rect, pos.x + 0.25, pos.y + 0.25, 10, height);
      sinon.assert.calledOnce(Renderer.doc.fill);

      expect(stripe).to.eql({
        width: 10,
        height: 40,
        color: 'green',
        opacity: 0.7,
        background: false,
        padding: 0,
      });
    });
  });

  describe('renderCustomTextCell', () => {
    const table = {};

    const cellData = {
      cell: {
        text: 'foo',
        subText: 'bar',
        note: 'baz',
      },
      header: {
        text: 'dog',
        subText: 'cat',
        note: 'mouse',
      },
      stringCell: 'pow',
    };

    const draw = true;

    const column = {
      id: 'cell',
      width: 100,
    };

    const headerColumn = {
      id: 'header',
      width: 200,
    };

    const pos = {
      x: 100,
      y: 200,
    };

    const padding = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    };

    beforeEach(() => {
      sinon.spy(Renderer, 'renderCellStripe');
      Renderer.doc.font.resetHistory();
      Renderer.doc.fontSize.resetHistory();
    });

    afterEach(() => {
      Renderer.renderCellStripe.resetHistory();
    });

    it('should make the call to render a cell stripe', () => {
      Renderer.renderCustomTextCell(table, cellData, draw, column, pos, padding);

      sinon.assert.calledOnce(Renderer.renderCellStripe);
    });

    it('should render a standard cell with a text string provided', () => {
      const stringColumn = _.assign({}, column, {
        id: 'stringCell',
      });

      Renderer.renderCustomTextCell(table, cellData, draw, stringColumn, pos, padding);

      sinon.assert.calledWith(Renderer.doc.text, 'pow');
    });

    it('should render a header cell with a text string provided', () => {
      const stringColumn = _.assign({}, headerColumn, {
        header: 'chicken',
      });

      Renderer.renderCustomTextCell(table, cellData, draw, stringColumn, pos, padding, true);

      sinon.assert.calledWith(Renderer.doc.text, 'chicken');
    });

    it('should render a standard cell with a text, subtext, and note object provided', () => {
      Renderer.renderCustomTextCell(table, cellData, draw, column, pos, padding);

      sinon.assert.calledWith(Renderer.doc.text, 'foo');
      sinon.assert.calledWith(Renderer.doc.text, 'bar');
      sinon.assert.calledWith(Renderer.doc.text, 'baz');
    });

    it('should render a header cell with a text, subtext, and note object provided', () => {
      Renderer.renderCustomTextCell(table, cellData, draw, headerColumn, pos, padding, true);

      sinon.assert.calledWith(Renderer.doc.text, 'dog');
      sinon.assert.calledWith(Renderer.doc.text, 'cat');
      sinon.assert.calledWith(Renderer.doc.text, 'mouse');
    });

    it('should use proper default font styles in a standard cell', () => {
      Renderer.renderCustomTextCell(table, cellData, draw, column, pos, padding);

      sinon.assert.alwaysCalledWith(Renderer.doc.font, Renderer.font);
      sinon.assert.neverCalledWith(Renderer.doc.font, Renderer.boldFont);
      sinon.assert.alwaysCalledWith(Renderer.doc.fontSize, Renderer.defaultFontSize);
    });

    it('should use proper default font styles in a header cell', () => {
      Renderer.renderCustomTextCell(table, cellData, draw, headerColumn, pos, padding, true);

      sinon.assert.calledWith(Renderer.doc.font, Renderer.boldFont);
      sinon.assert.calledWith(Renderer.doc.font, Renderer.font);
      sinon.assert.alwaysCalledWith(Renderer.doc.fontSize, Renderer.defaultFontSize);
    });

    it('should use left alignment by default in a standard cell', () => {
      Renderer.renderCustomTextCell(table, cellData, draw, column, pos, padding);

      sinon.assert.calledWith(
        Renderer.doc.text,
        'foo',
        pos.x,
        pos.y,
        {
          continued: true,
          align: 'left',
          width: 100,
        }
      );
    });

    it('should use left alignment by default in a header cell', () => {
      Renderer.renderCustomTextCell(table, cellData, draw, headerColumn, pos, padding, true);

      sinon.assert.calledWith(
        Renderer.doc.text,
        'dog',
        pos.x,
        pos.y,
        {
          continued: true,
          align: 'left',
          width: 200,
        }
      );
    });

    it('should allow custom font styles and alignment in a standard cell', () => {
      const customColumn = _.assign({}, column, {
        align: 'left',
        font: 'comic sans',
        fontSize: 13,
        subTextFontSize: 11,
        noteFontSize: 9,
      });

      Renderer.doc.y = 100;
      Renderer.renderCustomTextCell(table, cellData, draw, customColumn, pos, padding);

      sinon.assert.calledWith(Renderer.doc.font, 'comic sans');
      sinon.assert.calledWith(Renderer.doc.fontSize, 13);
      sinon.assert.calledWith(Renderer.doc.fontSize, 9);

      sinon.assert.calledWith(
        Renderer.doc.text,
        'foo',
        pos.x,
        pos.y,
        {
          continued: true,
          align: 'left',
          width: 100,
        }
      );

      sinon.assert.calledWith(
        Renderer.doc.text,
        'bar',
        pos.x,
        pos.y + 1, // should offset by 1 for half the difference between the text and the subText fontSizes
        {
          align: 'left',
          width: 100,
        }
      );

      sinon.assert.calledWith(
        Renderer.doc.text,
        'baz',
        pos.x,
        Renderer.doc.y + 1, // should offset by 1 for half the difference between the text and the subText fontSizes
        {
          align: 'left',
          width: 100,
        }
      );
    });

    it('should offset the text position when right aligned', () => {
      const customColumn = _.assign({}, column, {
        align: 'right',
        font: 'comic sans',
        fontSize: 13,
        noteFontSize: 9,
      });

      Renderer.doc.widthOfString = sinon.stub().returns(40);

      Renderer.renderCustomTextCell(table, cellData, draw, customColumn, pos, padding);

      sinon.assert.calledWith(Renderer.doc.font, 'comic sans');
      sinon.assert.calledWith(Renderer.doc.fontSize, 13);
      sinon.assert.calledWith(Renderer.doc.fontSize, 9);

      sinon.assert.calledWith(
        Renderer.doc.text,
        'foo',
        pos.x - 40, // should subtract the width of subText string from the x position
        pos.y,
        {
          continued: true,
          align: 'right',
          width: 100,
        }
      );
    });

    it('should allow custom font styles and alignment in a header cell', () => {
      const customColumn = _.assign({}, headerColumn, {
        headerAlign: 'center',
        headerFont: 'courrier new',
        fontSize: 15,
        subTextFontSize: 11,
        noteFontSize: 11,
      });
      Renderer.doc.y = 100;

      Renderer.renderCustomTextCell(table, cellData, draw, customColumn, pos, padding, true);

      sinon.assert.calledWith(Renderer.doc.font, 'courrier new');
      sinon.assert.calledWith(Renderer.doc.fontSize, 15);
      sinon.assert.calledWith(Renderer.doc.fontSize, 11);

      sinon.assert.calledWith(
        Renderer.doc.text,
        'dog',
        pos.x,
        pos.y,
        {
          continued: true,
          align: 'center',
          width: 200,
        }
      );

      sinon.assert.calledWith(
        Renderer.doc.text,
        'cat',
        pos.x,
        pos.y + 2, // should offset by 2 for half the difference between the text and the subText fontSizes
        {
          align: 'center',
          width: 200,
        }
      );

      sinon.assert.calledWith(
        Renderer.doc.text,
        'mouse',
        pos.x,
        Renderer.doc.y + 2, // should offset by 2 for half the difference between the text and the subText fontSizes
        {
          align: 'center',
          width: 200,
        }
      );
    });

    it('should allow rendering a specified row in bold', () => {
      const customData = _.assign({}, cellData, {
        _bold: true,
      });

      Renderer.renderCustomTextCell(table, customData, draw, column, pos, padding);
      sinon.assert.calledWith(Renderer.doc.font, Renderer.boldFont);
    });
  });

  describe('renderTableHeading', () => {
    let renderTable;
    let resetText;

    const defaultColumns = [
      {
        id: 'heading',
        align: 'left',
        height: 24,
        cache: false,
      },
    ];

    const defaultRows = [
      {
        heading: {},
        note: undefined,
      },
    ];

    const defaultOpts = {
      columnDefaults: {
        headerBorder: '',
      },
      bottomMargin: 0,
      showHeaders: false,
    };

    beforeEach(() => {
      renderTable = sinon.stub(Renderer, 'renderTable');
      resetText = sinon.stub(Renderer, 'resetText');
      defaultColumns[0].renderer = Renderer.renderCustomTextCell;
      defaultColumns[0].font = Renderer.boldFont;
      defaultColumns[0].fontSize = Renderer.largeFontSize;
    });

    afterEach(() => {
      renderTable.restore();
      resetText.restore();
    });

    it('should render a table heading with default settings when no args provided', () => {
      Renderer.renderTableHeading();

      sinon.assert.calledWith(
        Renderer.renderTable,
        defaultColumns,
        defaultRows,
        defaultOpts,
      );
    });

    it('should render a table heading with custom settings when args provided', () => {
      const heading = {
        text: 'foo',
        note: 'bar',
      };

      const customOpts = {
        height: 60,
        align: 'right',
        font: 'comic sans',
        fontSize: 22,
      };

      Renderer.renderTableHeading(heading, customOpts);

      sinon.assert.calledWith(
        Renderer.renderTable,
        [_.assign({}, defaultColumns[0], {
          height: customOpts.height,
          align: customOpts.align,
          font: customOpts.font,
          fontSize: customOpts.fontSize,
        })],
        [{ heading, note: heading.note }],
        _.assign({}, defaultOpts, customOpts),
      );
    });
  });

  describe('renderTable', () => {
    const columns = [
      {
        id: 'name',
        fill: 'blue',
      },
      {
        id: 'value',
      },
    ];

    const rows = [
      { name: 'one', value: 1 },
      { name: 'two', value: 2 },
      { name: 'three', value: 3 },
    ];

    const defaultOpts = {
      columnDefaults: {
        headerBorder: 'TBLR',
        border: 'TBLR',
        align: 'left',
        padding: [7, 5, 3, 5],
        headerPadding: [7, 5, 3, 5],
        fill: false,
      },
      bottomMargin: 20,
    };

    class Table {
      constructor() {
        this.addHeader = sinon.stub().returns(this);
        this.addPlugin = sinon.stub().returns(this);
        this.onCellBackgroundAdd = sinon.stub().resolves(true);
        this.onCellBackgroundAdded = sinon.stub().resolves(true);
        this.onCellBorderAdd = sinon.stub().resolves(true);
        this.onCellBorderAdded = sinon.stub().resolves(true);
        this.onRowAdd = sinon.stub().resolves(true);
        this.onRowAdded = sinon.stub().resolves(true);
        this.onHeaderAdd = sinon.stub().resolves(true);
        this.onPageAdd = sinon.stub().resolves(true);
        this.onPageAdded = sinon.stub().resolves(true);
        this.onBodyAdded = sinon.stub().resolves(true);
        this.setColumnsDefaults = sinon.stub().returns(this);
        this.addColumns = sinon.stub().returns(this);
        this.addBody = sinon.stub().returns(this);
        this.bottomMargin = 20;
        this.pdf = {
          addPage: sinon.stub(),
          switchToPage: sinon.stub(),
        };
      }
    }

    let TableStub;
    let FitColumnStub;
    let setFill;
    let setStroke;
    let resetText;

    beforeEach(() => {
      /* eslint-disable new-cap */
      TableStub = new sinon.stub().returns(new Table());
      FitColumnStub = new sinon.stub().resolves(true);
      /* eslint-enable new-cap */

      defaultOpts.columnDefaults.borderColor = Renderer.tableSettings.colors.border;
      defaultOpts.pos = {
        maxY: Renderer.chartArea.bottomEdge,
      };

      TableStub.resetHistory();
      FitColumnStub.resetHistory();

      setFill = sinon.spy(Renderer, 'setFill');
      setStroke = sinon.spy(Renderer, 'setStroke');
      resetText = sinon.spy(Renderer, 'resetText');
    });

    afterEach(() => {
      setFill.resetHistory();
      setStroke.resetHistory();
      resetText.resetHistory();
    });

    it('should render a table with default settings when no args provided', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);

      sinon.assert.calledWithNew(TableStub);
      sinon.assert.calledWith(TableStub, Renderer.doc, defaultOpts);
      sinon.assert.calledWith(Renderer.table.setColumnsDefaults, defaultOpts.columnDefaults);
      sinon.assert.calledWith(Renderer.table.addColumns, []);
      sinon.assert.calledWith(Renderer.table.addBody, []);
    });

    it('should render a table with custom rows, columns, and opts extending defaults', () => {
      const customOpts = {
        bottomMargin: 80,
      };

      Renderer.renderTable(columns, rows, customOpts, TableStub, FitColumnStub);

      sinon.assert.calledWith(TableStub, Renderer.doc, _.defaultsDeep({}, customOpts, defaultOpts));
      sinon.assert.calledWith(Renderer.table.setColumnsDefaults, defaultOpts.columnDefaults);
      sinon.assert.calledWith(Renderer.table.addColumns, columns);
      sinon.assert.calledWith(Renderer.table.addBody, rows);
    });

    it('should initialize the FitColumn table plugin when required', () => {
      Renderer.renderTable([], [], { flexColumn: 'test' }, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.addPlugin);
      sinon.assert.calledWith(FitColumnStub, { column: 'test' });
    });

    it('should add a listener for the `onPageAdd` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onPageAdd);
    });

    it('should add a listener for the `onPageAdded` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onPageAdded);
    });

    it('should add a listener for the `onHeaderAdd` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onHeaderAdd);
    });

    it('should add a listener for the `onCellBackgroundAdd` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onCellBackgroundAdd);
    });

    it('should add a listener for the `onCellBackgroundAdded` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onCellBackgroundAdded);
    });

    it('should add a listener for the `onCellBorderAdd` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onCellBorderAdd);
    });

    it('should add a listener for the `onCellBorderAdded` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onCellBorderAdded);
    });

    it('should add a listener for the `onRowAdd` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onRowAdd);
    });

    it('should add a listener for the `onRowAdded` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onRowAdded);
    });

    it('should add a listener for the `onBodyAdded` table event', () => {
      Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
      sinon.assert.calledOnce(Renderer.table.onBodyAdded);
    });

    describe('onPageAdd', () => {
      it('should call `addPage` and not `switchToPage` or `setNewPageTablePosition` when we are on the last page in the document', () => {
        Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
        sinon.spy(Renderer, 'setNewPageTablePosition');

        Renderer.initialTotalPages = 2;
        Renderer.totalPages = 4; // 2 pages have been added to the initial count
        Renderer.currentPageIndex = 1; // zero-based index, so this is the last page

        sinon.assert.notCalled(Renderer.table.pdf.addPage);

        Renderer.onPageAdd(Renderer.table, {}, { cancel: false });
        sinon.assert.calledOnce(Renderer.table.pdf.addPage);
        sinon.assert.notCalled(Renderer.table.pdf.switchToPage);
        sinon.assert.notCalled(Renderer.setNewPageTablePosition);
      });

      it('should call `switchToPage` and `setNewPageTablePosition` and not `addPage` when we are not on the last page in the document', () => {
        Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
        sinon.spy(Renderer, 'setNewPageTablePosition');

        Renderer.table.pos = {
          x: 100,
          y: 100,
        };

        Renderer.table.pdf = Renderer.doc;

        Renderer.initialTotalPages = 0;
        Renderer.totalPages = 2; // 2 pages have been added to the initial count
        Renderer.currentPageIndex = 0; // zero-based index, so this is the first of 2 pages

        sinon.assert.notCalled(Renderer.table.pdf.switchToPage);
        sinon.assert.notCalled(Renderer.setNewPageTablePosition);

        Renderer.onPageAdd(Renderer.table, {}, { cancel: false });
        sinon.assert.calledOnce(Renderer.table.pdf.switchToPage);
        sinon.assert.calledOnce(Renderer.setNewPageTablePosition);
        sinon.assert.notCalled(Renderer.table.pdf.addPage);
      });
    });

    describe('onPageAdded', () => {
      it('should add a table header when row is not a header row', () => {
        Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
        sinon.assert.notCalled(Renderer.table.addHeader);

        Renderer.onPageAdded(Renderer.table);
        sinon.assert.calledOnce(Renderer.table.addHeader);
      });

      it('should not add a table header when row is a header row', () => {
        Renderer.renderTable([], [], {}, TableStub, FitColumnStub);
        sinon.assert.notCalled(Renderer.table.addHeader);

        Renderer.onPageAdded(Renderer.table, { _isHeader: true });
        sinon.assert.notCalled(Renderer.table.addHeader);
      });
    });

    describe('onHeaderAdd', () => {
      it('should set _isHeader to true on the row', () => {
        const row = {};
        Renderer.onHeaderAdd(Renderer.table, row);
        expect(row._isHeader).to.be.true; // eslint-disable-line no-underscore-dangle
      });
    });

    describe('onCellBackgroundAdd', () => {
      it('should set the standard cell fill color when defined as a string', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          columns[0],
          rows[0],
          0,
          false,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWith(Renderer.setFill, 'blue', 1);
      });

      it('should set the standard cell fill color and opacity when defined as an object', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          {
            fill: {
              color: 'yellow',
              opacity: 0.4,
            },
          },
          rows[0],
          0,
          false,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWith(Renderer.setFill, 'yellow', 0.4);
      });

      it('should set the header cell fill color when defined as a string', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          {
            headerFill: 'magenta',
          },
          rows[0],
          0,
          true,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWith(Renderer.setFill, 'magenta', 1);
      });

      it('should set the header cell fill color and opacity when defined as an object', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          {
            headerFill: {
              color: 'red',
              opacity: 0.5,
            },
          },
          rows[0],
          0,
          true,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWith(Renderer.setFill, 'red', 0.5);
      });

      it('should not set the fill styles when not defined', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          columns[1],
          rows[0],
          0,
          false,
        );

        sinon.assert.notCalled(Renderer.setFill);
      });

      it('should set even zebra fill style when defined but fill color not set', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          { zebra: true, fill: true },
          rows[0],
          0,
          false,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWithExactly(
          Renderer.setFill,
          Renderer.tableSettings.colors.zebraEven,
          1
        );
      });

      it('should set odd zebra fill style when defined but fill color not set', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          { zebra: true, fill: true },
          rows[1],
          1,
          false,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWithExactly(
          Renderer.setFill,
          Renderer.tableSettings.colors.zebraOdd,
          1
        );
      });

      it('should set even zebra fill style at full opacity when fill color set as object', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          {
            zebra: true,
            fill: {
              color: 'yellow',
              opacity: 0.4,
            },
          },
          rows[0],
          0,
          false,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWithExactly(
          Renderer.setFill,
          'yellow',
          0.4
        );
      });

      it('should set odd zebra fill style at half opacity when fill color set as object', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          {
            zebra: true,
            fill: {
              color: 'yellow',
              opacity: 0.4,
            },
          },
          rows[1],
          1,
          false,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWithExactly(
          Renderer.setFill,
          'yellow',
          0.2
        );
      });

      it('should set zebra header fill style when defined but fill color not set', () => {
        Renderer.onCellBackgroundAdd(
          Renderer.table,
          { zebra: true, headerFill: true },
          rows[1],
          1,
          true,
        );

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWithExactly(
          Renderer.setFill,
          Renderer.tableSettings.colors.zebraHeader,
          1
        );
      });
    });

    describe('onCellBackgroundAdded', () => {
      it('should reset to the default fill styles', () => {
        Renderer.onCellBackgroundAdded();

        sinon.assert.calledOnce(Renderer.setFill);
        sinon.assert.calledWithExactly(Renderer.setFill);
      });
    });

    describe('onCellBorderAdd', () => {
      it('should set the border width', () => {
        Renderer.onCellBorderAdd(Renderer.table, {});

        sinon.assert.calledOnce(Renderer.doc.lineWidth);
        sinon.assert.calledWithExactly(Renderer.doc.lineWidth, Renderer.tableSettings.borderWidth);
      });

      it('should set the border color to black by default', () => {
        Renderer.onCellBorderAdd(Renderer.table, {});

        sinon.assert.calledOnce(Renderer.setStroke);
        sinon.assert.calledWithExactly(Renderer.setStroke, 'black', 1);
      });
    });

    describe('onCellBorderAdded', () => {
      it('should reset to the default stroke styles', () => {
        Renderer.onCellBorderAdded();

        sinon.assert.calledOnce(Renderer.setStroke);
        sinon.assert.calledWithExactly(Renderer.setStroke);
      });
    });

    describe('onRowAdd', () => {
      it('should set the font to bold if required', () => {
        Renderer.onRowAdd(Renderer.table, { _bold: true });

        sinon.assert.calledOnce(Renderer.doc.font);
        sinon.assert.calledWithExactly(Renderer.doc.font, Renderer.boldFont);
      });

      it('should not set the font to bold if not required', () => {
        Renderer.onRowAdd(Renderer.table, {});

        sinon.assert.notCalled(Renderer.doc.font);
      });
    });

    describe('onRowAdded', () => {
      it('should reset to the default text styles', () => {
        Renderer.onRowAdded();

        sinon.assert.calledOnce(Renderer.resetText);
        sinon.assert.calledWithExactly(Renderer.resetText);
      });
    });

    describe('onBodyAdded', () => {
      it('should properly update the pdf cursor position after rendering', () => {
        Renderer.doc.x = 150;
        Renderer.doc.y = 200;

        Renderer.onBodyAdded({
          pos: { x: 100 },
          bottomMargin: 50,
        });

        expect(Renderer.doc.x).to.equal(100);
        expect(Renderer.doc.y).to.equal(250);
      });

      it('should default to the page\'s left margin when the table position isn\'t set', () => {
        Renderer.doc.x = 150;

        Renderer.onBodyAdded(new Table());

        expect(Renderer.doc.x).to.equal(36);
      });
    });
  });

  describe('renderPatientInfo', () => {
    const textCalls = () => _.map(Renderer.doc.text.getCalls(), 'args[0]');

    it('should render the patient name, then the MRN line, then the DOB line', () => {
      Renderer.renderPatientInfo();

      expect(textCalls()).to.eql([
        getPatientFullName(opts.patient),
        'MRN: ',
        'mrn123',
        'DOB: ',
        formatBirthdate(opts.patient),
      ]);
    });

    it('should render the name in bold and each label regular with a bold value', () => {
      Renderer.renderPatientInfo();

      const fontBeforeText = _.map(Renderer.doc.text.getCalls(), call => (
        _.last(_.filter(Renderer.doc.font.getCalls(), fontCall => fontCall.calledBefore(call))).args[0]
      ));

      expect(fontBeforeText).to.eql([
        Renderer.boldFont,
        Renderer.font,
        Renderer.boldFont,
        Renderer.font,
        Renderer.boldFont,
      ]);

      sinon.assert.calledWith(Renderer.doc.fontSize, 9);
    });

    it('should lay the block out from the right edge within the configured patient width', () => {
      Renderer.doc.y = Renderer.margins.top;
      Renderer.renderPatientInfo();

      const patientX = Renderer.rightEdge - Renderer.headerLayout.patientWidth;
      sinon.assert.calledWith(Renderer.doc.text, getPatientFullName(opts.patient), patientX, Renderer.margins.top, {
        width: Renderer.headerLayout.patientWidth,
        height: sinon.match.number,
        ellipsis: true,
      });
      sinon.assert.calledWith(Renderer.doc.text, 'MRN: ', patientX, sinon.match.number, {
        width: Renderer.headerLayout.patientWidth,
        height: sinon.match.number,
        ellipsis: true,
        continued: true,
      });

      expect(Renderer.patientInfoBox.width).to.equal(Renderer.headerLayout.patientWidth);
      expect(Renderer.patientInfoBox.height).to.be.a('number');
    });

    it('should cap the name at two lines and the MRN and DOB lines at one line, clipped with an ellipsis', () => {
      Renderer.doc.currentLineHeight.returns(12);
      Renderer.renderPatientInfo();

      const optionsFor = text => _.find(Renderer.doc.text.getCalls(), call => call.args[0] === text).args[3];

      expect(optionsFor(getPatientFullName(opts.patient))).to.include({ height: 24, ellipsis: true });
      expect(optionsFor('MRN: ')).to.include({ height: 12, ellipsis: true, continued: true });
      expect(optionsFor('DOB: ')).to.include({ height: 12, ellipsis: true, continued: true });
      sinon.assert.calledWith(Renderer.doc.lineGap, 0);
    });

    it('should skip the MRN line when the patient has no MRN', () => {
      const patient = _.cloneDeep(opts.patient);
      delete patient.profile.patient.mrn;

      Renderer = new PrintView(doc, data, { ...opts, patient });
      Renderer.renderPatientInfo();

      expect(textCalls()).to.not.include('MRN: ');
      expect(textCalls()).to.include('DOB: ');
    });

    it('should render a truncated MRN if over 15 characters', () => {
      const patient = _.cloneDeep(opts.patient);
      patient.profile.patient.mrn = '1234567890123456';

      Renderer = new PrintView(doc, data, {
        ...opts,
        patient,
      });

      Renderer.renderPatientInfo();
      sinon.assert.calledWith(Renderer.doc.text, '12345…0123456');
    });

    it('should reset the text styles after rendering', () => {
      Renderer.renderPatientInfo();
      sinon.assert.calledWith(Renderer.doc.font.lastCall, Renderer.font);
      sinon.assert.calledWith(Renderer.doc.fontSize.lastCall, Renderer.defaultFontSize);
    });
  });

  describe('renderTitle', () => {
    it('should be a function', () => {
      expect(Renderer.renderTitle).to.be.a('function');
    });

    it('should render the title under the logo at the left margin, independent of the patient box', () => {
      Renderer.patientInfoBox = { width: 500, height: 500 };
      Renderer.currentPageIndex = 0;
      Renderer.renderTitle();

      const y = Renderer.margins.top + Renderer.logoHeight + Renderer.headerLayout.titleGap;
      sinon.assert.calledWith(Renderer.doc.text, 'Print View', Renderer.margins.left, y, { lineBreak: false });
      sinon.assert.calledWith(Renderer.doc.fontSize, 11.5);
      sinon.assert.calledWith(Renderer.doc.font, Renderer.font);
    });

    it('should render the page title as is for the first rendered page', () => {
      Renderer.doc.text.reset();
      Renderer.currentPageIndex = 0;
      Renderer.renderTitle();
      sinon.assert.calledWith(Renderer.doc.text, 'Print View');
    });

    it('should render the page title with (cont.)` for subsequent pages', () => {
      Renderer.doc.text.reset();
      Renderer.currentPageIndex = 1;
      Renderer.renderTitle();
      sinon.assert.calledWith(Renderer.doc.text, 'Print View (cont.)');
    });

    it('should calculate the width and height of the title', () => {
      Renderer.renderTitle();
      expect(Renderer.titleWidth).to.be.a('number');
      expect(Renderer.titleWidth > 0).to.be.true;
      expect(Renderer.titleHeight).to.be.a('number');
      expect(Renderer.titleHeight > 0).to.be.true;
    });
  });

  describe('renderDateText', () => {
    it('should render the date text once, left aligned in the configured column beside the logo', () => {
      const text = 'Date range';

      Renderer.renderDateText(text);

      const x = Renderer.margins.left + Renderer.logoWidth + Renderer.headerLayout.dateGap;
      sinon.assert.calledOnce(Renderer.doc.text);
      sinon.assert.calledWith(Renderer.doc.text, text, x, sinon.match.number, {
        width: Renderer.headerLayout.dateWidth,
        align: 'left',
        lineGap: 3,
      });
      sinon.assert.calledWith(Renderer.doc.fontSize, 9);
    });

    it('should vertically centre the text on the provided block height', () => {
      Renderer.doc.heightOfString.returns(10);
      Renderer.renderDateText('Date range', { blockHeight: 30 });

      sinon.assert.calledWith(Renderer.doc.text, 'Date range', sinon.match.number, Renderer.margins.top + 10);
      expect(Renderer.dateTextHeight).to.equal(10);
    });

    it('should not offset the text above the header top when it is taller than the block', () => {
      Renderer.doc.heightOfString.returns(40);
      Renderer.renderDateText('Date range', { blockHeight: 30 });

      sinon.assert.calledWith(Renderer.doc.text, 'Date range', sinon.match.number, Renderer.margins.top);
    });
  });

  describe('renderLogo', () => {
    it('should be a function', () => {
      expect(Renderer.renderLogo).to.be.a('function');
    });

    it('should render the Tidepool logo at the top left margin at the configured width', () => {
      Renderer.renderLogo();
      sinon.assert.calledOnce(Renderer.doc.image);
      sinon.assert.calledWith(
        Renderer.doc.image,
        'images/tidepool-logo-408x46.png',
        Renderer.margins.left,
        Renderer.margins.top,
        { width: 108 }
      );
      expect(Renderer.logoWidth).to.equal(108);
      expect(Renderer.logoHeight).to.be.closeTo(108 * (46 / 408), 0.001);
    });
  });

  describe('renderDebugGrid', () => {
    it('should be a function', () => {
      expect(Renderer.renderDebugGrid).to.be.a('function');
    });

    // Not really used for anything except local debugging,
    // so no need to test deeply
  });

  describe('renderHeader', () => {
    const patientTags = [{ id: 't2', name: 'Zeta' }, { id: 't1', name: 'alpha' }];
    const sites = [{ id: 's1', name: 'North' }, { id: 's2', name: 'Downtown' }];

    const spyHeaderParts = renderer => {
      sinon.spy(renderer, 'renderPatientInfo');
      sinon.spy(renderer, 'renderTitle');
      sinon.spy(renderer, 'renderLogo');
      sinon.spy(renderer, 'renderDateText');
      sinon.spy(renderer, 'renderHeaderBadges');
    };

    const ruleCall = renderer => _.find(
      renderer.doc.moveTo.getCalls(),
      call => call.args[0] === renderer.margins.left && call.args[1] > renderer.margins.top
    );

    it('should be a function', () => {
      expect(Renderer.renderHeader).to.be.a('function');
    });

    it('should render the logo and title but skip the profile, badges, and date by default', () => {
      spyHeaderParts(Renderer);

      Renderer.renderHeader();

      sinon.assert.calledOnce(Renderer.renderLogo);
      sinon.assert.calledOnce(Renderer.renderTitle);
      sinon.assert.notCalled(Renderer.renderPatientInfo);
      sinon.assert.notCalled(Renderer.renderHeaderBadges);
      sinon.assert.notCalled(Renderer.renderDateText);
    });

    it('should draw the horizontal rule under the header content and store its position', () => {
      Renderer.renderHeader();

      const rule = ruleCall(Renderer);
      expect(rule).to.be.an('object');
      expect(Renderer.headerBottom).to.equal(rule.args[1]);
      sinon.assert.calledWith(Renderer.doc.lineTo, Renderer.rightEdge, Renderer.headerBottom);
      sinon.assert.calledWith(Renderer.doc.stroke, 'black');
    });

    it('should reset the text styles after rendering', () => {
      Renderer.renderHeader('my date', { showProfile: true });
      sinon.assert.calledWith(Renderer.doc.font.lastCall, Renderer.font);
      sinon.assert.calledWith(Renderer.doc.fontSize.lastCall, Renderer.defaultFontSize);
      sinon.assert.calledWith(Renderer.doc.fillColor.lastCall, 'black');
    });

    context('`showProfile` option is true', () => {
      it('should call `renderPatientInfo` at the right edge and draw the vertical divider', () => {
        spyHeaderParts(Renderer);
        Renderer.renderHeader(null, { showProfile: true });

        const patientX = Renderer.rightEdge - Renderer.headerLayout.patientWidth;
        sinon.assert.calledOnce(Renderer.renderPatientInfo);
        sinon.assert.calledWith(Renderer.renderPatientInfo, {
          x: patientX,
          width: Renderer.headerLayout.patientWidth,
        });

        const dividerX = patientX - Renderer.headerLayout.dividerGap;
        sinon.assert.calledWith(Renderer.doc.moveTo, dividerX, Renderer.margins.top);
        sinon.assert.calledWith(Renderer.doc.lineTo, dividerX, Renderer.headerBottom);
      });

      it('should measure then draw `renderHeaderBadges` centred between the date column and the divider when the flag is set and items exist', () => {
        Renderer = new PrintView(doc, data, { ...opts, patientTags, sites, showHeaderBadges: true });
        spyHeaderParts(Renderer);

        Renderer.renderHeader(null, { showProfile: true });

        const { badgeWidth, dividerGap, patientWidth } = Renderer.headerLayout;
        const x = Renderer.rightEdge - patientWidth - dividerGap * 2 - badgeWidth;
        sinon.assert.calledTwice(Renderer.renderHeaderBadges);
        sinon.assert.calledWith(Renderer.renderHeaderBadges.firstCall, { x, width: badgeWidth, draw: false });
        sinon.assert.calledWith(Renderer.renderHeaderBadges.secondCall, {
          x,
          y: Renderer.margins.top + (Renderer.getHeaderBlockHeight() - Renderer.badgeBlock.height) / 2,
          width: badgeWidth,
        });
      });

      it('should not call `renderHeaderBadges` when the flag is false', () => {
        Renderer = new PrintView(doc, data, { ...opts, patientTags, sites, showHeaderBadges: false });
        spyHeaderParts(Renderer);

        Renderer.renderHeader(null, { showProfile: true });
        sinon.assert.notCalled(Renderer.renderHeaderBadges);
      });

      it('should not call `renderHeaderBadges` when both arrays are empty', () => {
        Renderer = new PrintView(doc, data, { ...opts, patientTags: [], sites: [], showHeaderBadges: true });
        spyHeaderParts(Renderer);

        Renderer.renderHeader(null, { showProfile: true });
        sinon.assert.notCalled(Renderer.renderHeaderBadges);
      });

      it('should keep the header rule above the chart area for a two-row badge block', () => {
        const manyTags = _.times(5, i => ({ id: `t${i}`, name: `Tag ${i}` }));
        Renderer = new PrintView(doc, data, { ...opts, patientTags: manyTags, sites, showHeaderBadges: true });

        Renderer.renderHeader('Date range: Jan 1, 2026 - Feb 1, 2026', { showProfile: true });

        expect(Renderer.badgeBlock.height).to.be.above(Renderer.badgeBlock.width / 10);
        expect(Renderer.headerBottom).to.be.below(Renderer.chartArea.topEdge);
      });
    });

    context('`showProfile` option is false', () => {
      it('should skip the patient block, divider, and badges but still draw the rule', () => {
        Renderer = new PrintView(doc, data, { ...opts, patientTags, sites, showHeaderBadges: true });
        spyHeaderParts(Renderer);

        Renderer.renderHeader(null, { showProfile: false });

        sinon.assert.notCalled(Renderer.renderPatientInfo);
        sinon.assert.notCalled(Renderer.renderHeaderBadges);
        sinon.assert.calledOnce(Renderer.doc.moveTo);
        expect(ruleCall(Renderer)).to.be.an('object');
        expect(Renderer.headerBottom).to.be.above(Renderer.margins.top + Renderer.logoHeight);
        expect(Renderer.headerBottom).to.be.below(Renderer.chartArea.topEdge);
      });
    });

    context('`dateText` arg is provided', () => {
      it('should call `renderDateText` with `dateText` and the measured block height', () => {
        spyHeaderParts(Renderer);
        Renderer.renderHeader('my date', { showProfile: true });
        sinon.assert.calledWith(Renderer.renderDateText, 'my date', { blockHeight: sinon.match.number });
      });
    });
  });

  describe('renderFooter', () => {
    it('should be a function', () => {
      expect(Renderer.renderFooter).to.be.a('function');
    });


    it('should set and render a default `helpText` option', () => {
      const options = {};
      Renderer.renderFooter(options);
      expect(options.helpText).to.equal('Questions or feedback? Please email support@tidepool.org or visit support.tidepool.org.');

      sinon.assert.calledWith(
        Renderer.doc.text,
        'Questions or feedback? Please email support@tidepool.org or visit support.tidepool.org.'
      );
    });

    it('should render the provided footer help text', () => {
      Renderer.renderFooter({ helpText: 'get help' });

      sinon.assert.calledWith(
        Renderer.doc.text,
        'get help'
      );
    });

    it('should render the date printed in the configured timezone', () => {
      Renderer.renderFooter();
      sinon.assert.calledWith(Renderer.doc.text, `Printed on: ${formatCurrentDate(Renderer.timezone)}`);
    });
  });

  describe('renderSVGImage', () => {
    it('should be a function', () => {
      expect(Renderer.renderSVGImage).to.be.a('function');
    });

    it('should call `addSVG` with appropriate args', () => {
      const addSVGSpy = sinon.spy(Renderer, 'addSVG');
      const svgDataURL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDo';
      const x = 1;
      const y = 2;
      const width = 3;
      const height = 4;

      Renderer.renderSVGImage(svgDataURL, x, y, width, height);
      sinon.assert.calledWith(addSVGSpy, 'PHN2ZyB4bWxucz0iaHR0cDo', x, y, { assumePt: true, width, height });
      addSVGSpy.restore();
    });
  });

  describe('setFooterSize', () => {
    it('should be a function', () => {
      expect(Renderer.setFooterSize).to.be.a('function');
    });

    it('should set the footer size', () => {
      const bottomEdge = Renderer.chartArea.bottomEdge - Renderer.doc.currentLineHeight() * 3;

      Renderer.setFooterSize();
      expect(Renderer.chartArea.bottomEdge).to.equal(bottomEdge);
    });
  });

  describe('setHeaderSize', () => {
    it('should be a function', () => {
      expect(Renderer.setHeaderSize).to.be.a('function');
    });

    it('should set the footer size', () => {
      const topEdge = Renderer.chartArea.topEdge + Renderer.doc.currentLineHeight() * 4;

      Renderer.setHeaderSize();
      expect(Renderer.chartArea.topEdge).to.equal(topEdge);
    });
  });
});
