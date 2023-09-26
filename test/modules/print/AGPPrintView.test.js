import AGPPrintView from '../../../src/modules/print/AGPPrintView';
import PrintView from '../../../src/modules/print/PrintView';
import * as patients from '../../../data/patient/profiles';
import * as settings from '../../../data/patient/settings';
import _ from 'lodash';

import { createAGPData } from '../../../data/print/fixtures';

import {
  DEFAULT_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
} from '../../../src/modules/print/utils/constants';

import Doc from '../../helpers/pdfDoc';
import { BGM_DATA_KEY, CGM_DATA_KEY } from '../../../src/utils/constants';

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
      percentInRanges: 'percentInRangesURL',
      ambulatoryGlucoseProfile: 'ambulatoryGlucoseProfileURL',
      dailyGlucoseProfiles: ['dailyProfilesWeek1URL', 'dailyProfilesWeek2URL'],
    },
  };

  const cbgAGPData = createAGPData(CGM_DATA_KEY);
  const smbgAGPData = createAGPData(BGM_DATA_KEY);

  const createRenderer = (renderData = cbgAGPData, renderOpts = opts) => (
    new AGPPrintView(doc, renderData, renderOpts)
  );

  beforeEach(async () => {
    doc = new Doc({ margin: MARGIN });
    Renderer = await createRenderer(cbgAGPData);
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
        sinon.stub(Renderer, 'renderPercentInRanges').resolves(null);
        sinon.stub(Renderer, 'renderAmbulatoryGlucoseProfile').resolves(null);
        sinon.stub(Renderer, 'renderDailyGlucoseProfiles').resolves(null);

        Renderer.sections.ambulatoryGlucoseProfile.sufficientData = false;
        Renderer.sections.dailyGlucoseProfiles.sufficientData = false;
        Renderer.sections.glucoseMetrics.sufficientData = false;
        Renderer.sections.percentInRanges.sufficientData = false;

        await Renderer.render();

        sinon.assert.calledOnce(Renderer.renderReportInfo);
        sinon.assert.calledOnce(Renderer.renderInsufficientData);
        sinon.assert.notCalled(Renderer.renderGlucoseMetrics);
        sinon.assert.notCalled(Renderer.renderPercentInRanges);
        sinon.assert.notCalled(Renderer.renderAmbulatoryGlucoseProfile);
        sinon.assert.notCalled(Renderer.renderDailyGlucoseProfiles);
      });
    });

    context('sufficient data', () => {
      it('should call all the appropriate render methods', async () => {
        sinon.stub(Renderer, 'renderReportInfo');
        sinon.stub(Renderer, 'renderInsufficientData');
        sinon.stub(Renderer, 'renderGlucoseMetrics');
        sinon.stub(Renderer, 'renderPercentInRanges').resolves(null);
        sinon.stub(Renderer, 'renderAmbulatoryGlucoseProfile').resolves(null);
        sinon.stub(Renderer, 'renderDailyGlucoseProfiles').resolves(null);

        await Renderer.render();

        sinon.assert.calledOnce(Renderer.renderReportInfo);
        sinon.assert.notCalled(Renderer.renderInsufficientData);
        sinon.assert.calledOnce(Renderer.renderGlucoseMetrics);
        sinon.assert.calledOnce(Renderer.renderPercentInRanges);
        sinon.assert.calledOnce(Renderer.renderAmbulatoryGlucoseProfile);
        sinon.assert.calledOnce(Renderer.renderDailyGlucoseProfiles);
      });
    });
  });

  describe('renderHeader', () => {
    context('CGM Report', () => {
      beforeEach(() => {
        Renderer = createRenderer(cbgAGPData);
        Renderer.renderHeader();
      });

      it('should render the header and subheader', () => {
        sinon.assert.calledWithMatch(Renderer.doc.text, 'AGP Report:');
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Continuous Glucose Monitoring');
      });
    });

    context('BGM Report', () => {
      beforeEach(() => {
        Renderer = createRenderer(smbgAGPData);
        Renderer.renderHeader();
      });

      it('should render the header and subheader', () => {
        sinon.assert.calledWithMatch(Renderer.doc.text, 'AGP Report:');
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Blood Glucose Monitoring');
      });
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


    it('should call the renderFooter method of the parent class with no arguments', () => {
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
    const insufficientData = { sufficientData: false, text: { insufficientData: 'Insufficient Data', insufficientDataTitle: 'Insufficient Data Title' } };
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

    it('should render the insufficient data title text', () => {
      Renderer.renderSectionContainer(insufficientData);
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Insufficient Data Title');
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
        text: { dob: 'DOB:', mrn: 'MRN:' },
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

    it('should render the patient MRN', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'MRN:');
      sinon.assert.calledWithMatch(Renderer.doc.text, 'mrn123');
    });

    it('should render a truncated MRN if over 15 characters', () => {
      const patient = _.cloneDeep(opts.patient);
      patient.profile.patient.mrn = '1234567890123456';

      Renderer = new PrintView(doc, cbgAGPData, {
        ...opts,
        patient,
      });

      Renderer.renderPatientInfo();
      sinon.assert.calledWithMatch(Renderer.doc.text, 'MRN:');
      sinon.assert.calledWith(Renderer.doc.text, 'MRN: 12345…0123456');
    });

    it('should render the report date range', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, '14 Days: March 3 - March 16, 2023');
    });

    it('should render the sensor usage', () => {
      sinon.assert.calledWithMatch(Renderer.doc.text, 'Time CGM Active: 98.4%');
    });
  });

  describe('renderGlucoseMetrics', () => {
    context('CGM Report', () => {
      let renderSectionContainerSpy;
      beforeEach(() => {
        Renderer = createRenderer(cbgAGPData);
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

    context('BGM Report', () => {
      let renderSectionContainerSpy;
      beforeEach(() => {
        Renderer = createRenderer(smbgAGPData);
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
            title: 'BGM Statistics',
            averageGlucose: {
              label: 'Average Glucose',
            },
            bgExtents: {
              label: 'Lowest/Highest Glucose',
            },
            coefficientOfVariation: {
              label: 'Glucose Variability',
              subLabel: 'Defined as percent coefficient of variation',
              goal: 'Goal: <=36%',
            },
            dailyReadingsInRange: {
              label: 'Average Readings/Day',
            },
            readingsInRange: {
              label: 'Number of Readings',
            },
          },
        });
      });

      it('should render the total number of readings', () => {
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Number of Readings');
        sinon.assert.calledWithMatch(Renderer.doc.text, '3797');
      });

      it('should render the average number of readings per day', () => {
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Average Readings/Day');
        sinon.assert.calledWithMatch(Renderer.doc.text, '271.2');
      });

      it('should render the average glucose', () => {
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Average Glucose');
        sinon.assert.calledWithMatch(Renderer.doc.text, '168');
        sinon.assert.calledWithMatch(Renderer.doc.text, 'mg/dL');
      });

      it('should render the bg extents', () => {
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Lowest/Highest Glucose');
        sinon.assert.calledWithMatch(Renderer.doc.text, '52/238 mg/dL');
      });

      it('should render the glucose variability', () => {
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Glucose Variability');
        sinon.assert.calledWithMatch(Renderer.doc.text, '39.8');
        sinon.assert.calledWithMatch(Renderer.doc.text, '%');
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Goal: <=36%');
        sinon.assert.calledWithMatch(Renderer.doc.text, 'Defined as percent coefficient of variation');
      });
    });
  });

  describe('renderPercentInRanges', () => {
    let renderSectionContainerSpy;
    let renderSVGImageSpy;

    beforeEach(() => {
      renderSectionContainerSpy = sinon.spy(Renderer, 'renderSectionContainer');
      renderSVGImageSpy = sinon.spy(Renderer, 'renderSVGImage');
      Renderer.renderPercentInRanges();
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
        'percentInRangesURL',
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
