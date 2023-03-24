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

import AGPPrintView from '../../../src/modules/print/AGPPrintView';
import PrintView from '../../../src/modules/print/PrintView';
import * as patients from '../../../data/patient/profiles';
import * as settings from '../../../data/patient/settings';

import { agpData as data } from '../../../data/print/fixtures';

import {
  DEFAULT_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
} from '../../../src/modules/print/utils/constants';

import Doc from '../../helpers/pdfDoc';

describe('AGPPrintView', () => {
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
    svgDataURLS: {
      timeInRanges: 'timeInRangesURL',
      ambulatoryGlucoseProfile: 'ambulatoryGlucoseProfileURL',
      dailyGlucoseProfiles: ['dailyProfilesWeek1URL', 'dailyProfilesWeek2URL'],
    },
  };

  const createRenderer = (renderData = data, renderOpts = opts) => (
    new AGPPrintView(doc, renderData, renderOpts)
  );

  beforeEach(async () => {
    doc = new Doc({ margin: MARGIN });
    Renderer = await createRenderer(data);
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

    it('should initialize the svgDataURLS prop', () => {
      expect(Renderer.svgDataURLS).to.eql(opts.svgDataURLS);
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

    it('should call the newPage method of the parent class with no arguments', () => {
      Renderer.newPage();
      sinon.assert.calledWithExactly(PrintView.prototype.newPage);
    });
  });

  describe('render', () => {
    context('insufficient data', () => {
      it('should call all the appropriate render methods', async () => {
        sinon.stub(Renderer, 'renderReportInfo');
        sinon.stub(Renderer, 'renderInsufficientData');
        sinon.stub(Renderer, 'renderGlucoseMetrics');
        sinon.stub(Renderer, 'renderTimeInRanges').resolves(null);
        sinon.stub(Renderer, 'renderAmbulatoryGlucoseProfile').resolves(null);
        sinon.stub(Renderer, 'renderDailyGlucoseProfiles').resolves(null);

        Renderer.sections.ambulatoryGlucoseProfile.sufficientData = false;
        Renderer.sections.dailyGlucoseProfiles.sufficientData = false;
        Renderer.sections.glucoseMetrics.sufficientData = false;
        Renderer.sections.timeInRanges.sufficientData = false;

        await Renderer.render();

        sinon.assert.calledOnce(Renderer.renderReportInfo);
        sinon.assert.calledOnce(Renderer.renderInsufficientData);
        sinon.assert.notCalled(Renderer.renderGlucoseMetrics);
        sinon.assert.notCalled(Renderer.renderTimeInRanges);
        sinon.assert.notCalled(Renderer.renderAmbulatoryGlucoseProfile);
        sinon.assert.notCalled(Renderer.renderDailyGlucoseProfiles);
      });
    });

    context('sufficient data', () => {
      it('should call all the appropriate render methods', async () => {
        sinon.stub(Renderer, 'renderReportInfo');
        sinon.stub(Renderer, 'renderInsufficientData');
        sinon.stub(Renderer, 'renderGlucoseMetrics');
        sinon.stub(Renderer, 'renderTimeInRanges').resolves(null);
        sinon.stub(Renderer, 'renderAmbulatoryGlucoseProfile').resolves(null);
        sinon.stub(Renderer, 'renderDailyGlucoseProfiles').resolves(null);

        await Renderer.render();

        sinon.assert.calledOnce(Renderer.renderReportInfo);
        sinon.assert.notCalled(Renderer.renderInsufficientData);
        sinon.assert.calledOnce(Renderer.renderGlucoseMetrics);
        sinon.assert.calledOnce(Renderer.renderTimeInRanges);
        sinon.assert.calledOnce(Renderer.renderAmbulatoryGlucoseProfile);
        sinon.assert.calledOnce(Renderer.renderDailyGlucoseProfiles);
      });
    });
  });

  describe('renderHeader', () => {
    beforeEach(() => {
      Renderer.renderHeader();
    });

    it('should render the header and subheader', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'AGP Report:');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Continuous glucose monitoring');
    });
  });

  describe('renderFooter', () => {
    let renderFooterSpy;

    beforeEach(() => {
      renderFooterSpy = sinon.spy(PrintView.prototype, 'renderFooter');
      Renderer.renderFooter();
    });

    afterEach(() => {
      renderFooterSpy.restore();
    });

    it('should render the logos', () => {
      sinon.assert.calledTwice(Renderer.doc.image);
    });


    it('should call the newPage method of the parent class with no arguments', () => {
      sinon.assert.calledWithExactly(PrintView.prototype.renderFooter);
    });
  });

  describe('renderInsufficientData', () => {
    beforeEach(() => {
      Renderer.renderInsufficientData();
    });

    it('should render the insufficient data text', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Insufficient data to generate an AGP Report.');
    });
  });

  describe('renderSectionContainer', () => {
    const bordered = { bordered: true };
    const withTitle = { text: { title: 'Title' } };
    const withSubtitle = { text: { title: 'Title', subtitle: 'Subtitle' } };
    const insufficientData = { sufficientData: false, text: { insufficientData: 'Insufficient Data' } };
    const withDescription = { text: { 'description': 'Description' } }; // eslint-disable-line quote-props

    it('should render the bordered section container', () => {
      Renderer.renderSectionContainer(bordered);
      sinon.assert.calledTwice(Renderer.doc.roundedRect);
      sinon.assert.calledOnce(Renderer.doc.rect);
    });

    it('should render the section title', () => {
      Renderer.renderSectionContainer(withTitle);
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Title');
    });

    it('should render the section subtitle', () => {
      Renderer.renderSectionContainer(withSubtitle);
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Subtitle');
    });

    it('should render the insufficient data text', () => {
      Renderer.renderSectionContainer(insufficientData);
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Insufficient Data');
    });

    it('should render the description text', () => {
      Renderer.renderSectionContainer(withDescription);
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Description');
    });
  });

  describe('renderReportInfo', () => {
    let renderSectionContainerSpy;

    beforeEach(() => {
      renderSectionContainerSpy = sinon.spy(Renderer, 'renderSectionContainer');
      Renderer.renderReportInfo();
    });

    afterEach(() => {
      renderSectionContainerSpy.restore();
    });

    it('should render the section container with appropriate args', () => {
      sinon.assert.calledWithMatch(renderSectionContainerSpy, {
        text: { dob: 'DOB:' },
        height: sinon.match.number,
        width: sinon.match.number,
        x: sinon.match.number,
        y: sinon.match.number,
      });
    });

    it('should render the patient name', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Mary Smith');
    });

    it('should render the patient DOB', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'DOB:');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Jan 31, 1983');
    });

    it('should render the report date range', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, '14 Days: March 3 - March 16, 2023');
    });

    it('should render the sensor usage', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Time CGM Active: 98.4%');
    });
  });

  describe('renderGlucoseMetrics', () => {
    let renderSectionContainerSpy;

    beforeEach(() => {
      renderSectionContainerSpy = sinon.spy(Renderer, 'renderSectionContainer');
      Renderer.renderGlucoseMetrics();
    });

    afterEach(() => {
      renderSectionContainerSpy.restore();
    });

    it('should render the section container with appropriate args', () => {
      sinon.assert.calledWithMatch(renderSectionContainerSpy, {
        bordered: true,
        height: sinon.match.number,
        width: sinon.match.number,
        x: sinon.match.number,
        y: sinon.match.number,
        sufficientData: true,
        text: {
          averageGlucose: {
            goal: { mgdl: 'Goal: <154 mg/dL', mmoll: 'Goal: <8.6 mmol/L' },
            label: 'Average Glucose',
          },
          coefficientOfVariation: {
            goal: 'Goal: <=36%',
            label: 'Glucose Variability',
            subLabel: 'Defined as percent coefficient of variation',
          },
          glucoseManagementIndicator: { goal: 'Goal: <7%', label: 'Glucose Management Indicator (GMI)' },
          title: 'Glucose metrics',
        },
      });
    });

    it('should render the average glucose', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Average Glucose');
      sinon.assert.calledWithMatch(Renderer.doc.text, '168');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'mg/dL');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Goal: <154 mg/dL');
    });

    it('should render the gmi', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Glucose Management Indicator (GMI)');
      sinon.assert.calledWithMatch(Renderer.doc.text, '7.3');
      sinon.assert.calledWithMatch(Renderer.doc.text, '%');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Goal: <7%');
    });

    it('should render the glucose variability', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Glucose Variability');
      sinon.assert.calledWithMatch(Renderer.doc.text, '39.8');
      sinon.assert.calledWithMatch(Renderer.doc.text, '%');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Goal: <=36%');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Defined as percent coefficient of variation');
    });
  });

  describe('renderTimeInRanges', () => {
    let renderSectionContainerSpy;
    let renderSVGImageSpy;

    beforeEach(() => {
      renderSectionContainerSpy = sinon.spy(Renderer, 'renderSectionContainer');
      renderSVGImageSpy = sinon.spy(Renderer, 'renderSVGImage');
      Renderer.renderTimeInRanges();
    });

    afterEach(() => {
      renderSectionContainerSpy.restore();
      renderSVGImageSpy.restore();
    });

    it('should render the section container with appropriate args', () => {
      sinon.assert.calledWithMatch(renderSectionContainerSpy, {
        bordered: true,
        height: sinon.match.number,
        width: sinon.match.number,
        x: sinon.match.number,
        y: sinon.match.number,
        sufficientData: true,
        text: {
          title: 'Time in Ranges',
          subtitle: 'Goals for Type 1 and Type 2 Diabetes',
        },
      });
    });

    it('should render the provided SVG image', () => {
      sinon.assert.calledWith(renderSVGImageSpy,
        'timeInRangesURL',
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
      );
    });
  });

  describe('renderAmbulatoryGlucoseProfile', () => {
    let renderSectionContainerSpy;
    let renderSVGImageSpy;

    beforeEach(() => {
      renderSectionContainerSpy = sinon.spy(Renderer, 'renderSectionContainer');
      renderSVGImageSpy = sinon.spy(Renderer, 'renderSVGImage');
      Renderer.renderAmbulatoryGlucoseProfile();
    });

    afterEach(() => {
      renderSectionContainerSpy.restore();
      renderSVGImageSpy.restore();
    });

    it('should render the section container with appropriate args', () => {
      sinon.assert.calledWithMatch(renderSectionContainerSpy, {
        bordered: true,
        sufficientData: true,
        text: {
          description: 'AGP is a summary of glucose values from the report period, with median (50%) and other percentiles shown as if they occurred in a single day.',
          insufficientData: 'Insufficient CGM data to generate AGP graph',
          targetRange: 'Target<br>Range',
          title: 'Ambulatory Glucose Profile (AGP)',
        },
        height: sinon.match.number,
        width: sinon.match.number,
        x: sinon.match.number,
        y: sinon.match.number,
      });
    });

    it('should render the provided SVG image', () => {
      sinon.assert.calledWith(renderSVGImageSpy,
        'ambulatoryGlucoseProfileURL',
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
      );
    });
  });

  describe('renderDailyGlucoseProfiles', () => {
    let renderSectionContainerSpy;
    let renderSVGImageSpy;

    beforeEach(() => {
      renderSectionContainerSpy = sinon.spy(Renderer, 'renderSectionContainer');
      renderSVGImageSpy = sinon.spy(Renderer, 'renderSVGImage');
      Renderer.renderDailyGlucoseProfiles();
    });

    afterEach(() => {
      renderSectionContainerSpy.restore();
      renderSVGImageSpy.restore();
    });

    it('should render the section container with appropriate args', () => {
      sinon.assert.calledWithMatch(renderSectionContainerSpy, {
        bordered: true,
        sufficientData: true,
        text: {
          description: 'Each daily profile represents a midnight-to-midnight period.',
          title: 'Daily Glucose Profiles',
        },
        height: sinon.match.number,
        width: sinon.match.number,
        x: sinon.match.number,
        y: sinon.match.number,
      });
    });

    it('should render the provided SVG images', () => {
      sinon.assert.calledWith(renderSVGImageSpy,
        'dailyProfilesWeek1URL',
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
      );

      sinon.assert.calledWith(renderSVGImageSpy,
        'dailyProfilesWeek2URL',
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
        sinon.match.number,
      );
    });
  });
});
