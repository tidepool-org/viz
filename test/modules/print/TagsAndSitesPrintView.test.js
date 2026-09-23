/* eslint-disable max-len */

import _ from 'lodash';

import TagsAndSitesPrintView from '../../../src/modules/print/TagsAndSitesPrintView';
import PrintView from '../../../src/modules/print/PrintView';
import * as patients from '../../../data/patient/profiles';

import {
  DEFAULT_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
} from '../../../src/modules/print/utils/constants';

import Doc from '../../helpers/pdfDoc';

describe('TagsAndSitesPrintView', () => {
  const DPI = 72;
  const MARGIN = DPI / 2;

  // Deliberately unsorted so the "order received" assertions cannot pass by accident
  const patientTags = [
    { id: 'tag-3', name: 'Zebra' },
    { id: 'tag-1', name: 'apple' },
    { id: 'tag-2', name: 'Mango' },
  ];

  const sites = [
    { id: 'site-2', name: 'Westside' },
    { id: 'site-1', name: 'Downtown' },
  ];

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
    patientTags,
    sites,
    title: 'Tags & Sites',
    width: 8.5 * DPI - (2 * MARGIN),
  };

  const names = (prefix, count) => _.times(count, index => ({ id: `${prefix}-${index}`, name: `${prefix} ${index}` }));

  let doc;
  let Renderer;

  const createRenderer = (renderOpts = {}) => new TagsAndSitesPrintView(doc, {}, { ...opts, ...renderOpts });

  // The stub doc reports a constant string height, so overflow is forced by raising it:
  // one row then measures 200 plus 14 points of padding against a 650 point column.
  const useTallRows = () => {
    doc.heightOfString = sinon.stub().returns(200);
  };

  const renderedNames = (spy, callIndex) => _.map(spy.getCall(callIndex).args[1], 'name');

  beforeEach(() => {
    doc = new Doc({ margin: MARGIN });

    // The stub doc never runs the pageAdded handler that seeds these, so stand them up
    // where a fresh pdfkit document would.
    doc.x = MARGIN;
    doc.y = MARGIN;

    Renderer = createRenderer();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('class constructor', () => {
    it('should instantiate without errors', () => {
      expect(Renderer).to.be.an('object');
    });

    it('should extend the `PrintView` class', () => {
      expect(Renderer instanceof PrintView).to.be.true;
    });

    it('should add the first pdf page', () => {
      sinon.assert.calledOnce(Renderer.doc.addPage);
    });

    it('should store the tags and the sites exactly as they were received', () => {
      expect(Renderer.patientTags).to.eql(patientTags);
      expect(Renderer.sites).to.eql(sites);
    });
  });

  describe('render', () => {
    let headingSpy;
    let tableSpy;

    beforeEach(() => {
      headingSpy = sinon.spy(PrintView.prototype, 'renderSectionHeading');
      tableSpy = sinon.spy(PrintView.prototype, 'renderTable');
    });

    it('should render the tags section and then the clinic sites section', () => {
      Renderer.render();

      sinon.assert.calledTwice(headingSpy);
      expect(headingSpy.getCall(0).args[0]).to.equal('Tags');
      expect(headingSpy.getCall(1).args[0]).to.equal('Clinic Sites');
      sinon.assert.calledTwice(tableSpy);
    });

    it('should pass one row per item in the order received', () => {
      Renderer.render();

      expect(renderedNames(tableSpy, 0)).to.eql(['Zebra', 'apple', 'Mango']);
      expect(renderedNames(tableSpy, 1)).to.eql(['Westside', 'Downtown']);
    });

    it('should render a single name column', () => {
      Renderer.render();

      const columns = tableSpy.getCall(0).args[0];
      expect(columns).to.have.length(1);
      expect(columns[0].id).to.equal('name');
    });

    it('should omit the tags section when there are no tags', () => {
      Renderer = createRenderer({ patientTags: [] });
      Renderer.render();

      sinon.assert.calledOnce(headingSpy);
      expect(headingSpy.getCall(0).args[0]).to.equal('Clinic Sites');
      sinon.assert.calledOnce(tableSpy);
      expect(renderedNames(tableSpy, 0)).to.eql(['Westside', 'Downtown']);
    });

    it('should omit the clinic sites section when there are no sites', () => {
      Renderer = createRenderer({ sites: [] });
      Renderer.render();

      sinon.assert.calledOnce(headingSpy);
      expect(headingSpy.getCall(0).args[0]).to.equal('Tags');
      sinon.assert.calledOnce(tableSpy);
      expect(renderedNames(tableSpy, 0)).to.eql(['Zebra', 'apple', 'Mango']);
    });

    it('should render nothing when both are empty', () => {
      Renderer = createRenderer({ patientTags: [], sites: [] });
      Renderer.render();

      sinon.assert.notCalled(headingSpy);
      sinon.assert.notCalled(tableSpy);
    });
  });

  describe('column and page flow', () => {
    let columnSpy;
    let tableSpy;

    beforeEach(() => {
      columnSpy = sinon.spy(PrintView.prototype, 'goToLayoutColumnPosition');
      tableSpy = sinon.spy(PrintView.prototype, 'renderTable');
    });

    it('should keep both sections in the first column when they fit', () => {
      Renderer.render();

      expect(_.map(columnSpy.args, '0')).to.eql([0]);
    });

    it('should continue the overflowing rows at the top of the next column without repeating the heading', () => {
      Renderer = createRenderer({ patientTags: names('Tag', 5), sites: [] });
      useTallRows();
      const headingSpy = sinon.spy(PrintView.prototype, 'renderSectionHeading');

      Renderer.render();

      expect(_.map(columnSpy.args, '0')).to.eql([0, 1]);
      sinon.assert.calledOnce(headingSpy);
      sinon.assert.calledTwice(tableSpy);
      expect(renderedNames(tableSpy, 0)).to.eql(['Tag 0', 'Tag 1', 'Tag 2']);
      expect(renderedNames(tableSpy, 1)).to.eql(['Tag 3', 'Tag 4']);
    });

    it('should add a page and resume in the first column once all three columns are full', () => {
      Renderer = createRenderer({ patientTags: names('Tag', 10), sites: [] });
      useTallRows();
      doc.addPage.resetHistory();

      Renderer.render();

      expect(_.map(columnSpy.args, '0')).to.eql([0, 1, 2, 0]);
      sinon.assert.calledOnce(doc.addPage);
      expect(renderedNames(tableSpy, 3)).to.eql(['Tag 9']);
    });

    it('should start the clinic sites in the next column when the tags fill the current one', () => {
      Renderer = createRenderer({ patientTags: names('Tag', 3), sites: names('Site', 2) });
      useTallRows();

      Renderer.render();

      expect(_.map(columnSpy.args, '0')).to.eql([0, 1]);
      expect(renderedNames(tableSpy, 0)).to.eql(['Tag 0', 'Tag 1', 'Tag 2']);
      expect(renderedNames(tableSpy, 1)).to.eql(['Site 0', 'Site 1']);
    });
  });

  describe('continuation flow', () => {
    const HEADING_HEIGHT = 30;

    let headings;
    let tableTops;

    // The stub doc does not advance `doc.y` for text, so the heading is given a height
    // here; without one there is nothing for the continuation column to line up under.
    beforeEach(() => {
      headings = [];
      tableTops = [];

      sinon.stub(PrintView.prototype, 'renderSectionHeading').callsFake(function consumeHeight(heading) {
        headings.push(heading);
        this.doc.y += HEADING_HEIGHT;
      });

      const { renderNameTable: original } = TagsAndSitesPrintView.prototype;

      sinon.stub(TagsAndSitesPrintView.prototype, 'renderNameTable').callsFake(function record(...args) {
        tableTops.push(this.doc.y);
        return original.apply(this, args);
      });
    });

    it('should start the continuation column level with the first table, not at the column top', () => {
      Renderer = createRenderer({ patientTags: names('Tag', 5), sites: [] });
      useTallRows();

      Renderer.render();

      expect(headings).to.eql(['Tags']);
      expect(tableTops).to.have.length(2);
      expect(tableTops[1]).to.equal(tableTops[0]);
    });

    it('should repeat the heading on a continuation page and start the table below it', () => {
      Renderer = createRenderer({ patientTags: names('Tag', 10), sites: [] });
      useTallRows();

      Renderer.render();

      expect(headings).to.eql(['Tags', 'Tags']);
      expect(tableTops).to.have.length(4);
      expect(_.uniq(tableTops.slice(0, 3))).to.eql([tableTops[0]]);
      expect(tableTops[3]).to.equal(Renderer.chartArea.topEdge + HEADING_HEIGHT);
    });

    it('should repeat the clinic sites heading when the sites are split over a page break', () => {
      Renderer = createRenderer({ patientTags: names('Tag', 7), sites: names('Site', 3) });
      useTallRows();
      doc.addPage.resetHistory();

      Renderer.render();

      expect(headings).to.eql(['Tags', 'Clinic Sites', 'Clinic Sites']);
      sinon.assert.calledOnce(doc.addPage);
      expect(_.last(tableTops)).to.equal(Renderer.chartArea.topEdge + HEADING_HEIGHT);
    });
  });

  describe('newPage', () => {
    it('should render the header badge block when there are tags or sites', () => {
      const badgeSpy = sinon.spy(PrintView.prototype, 'renderHeaderBadges');

      Renderer.newPage();

      sinon.assert.called(badgeSpy);
    });

    it('should not render the header badge block when there is nothing to show', () => {
      Renderer = createRenderer({ patientTags: [], sites: [] });
      const badgeSpy = sinon.spy(PrintView.prototype, 'renderHeaderBadges');

      Renderer.newPage();

      sinon.assert.notCalled(badgeSpy);
    });
  });
});
