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
import MemoryStream from 'memorystream';

import * as Module from '../../../src/modules/print';
import Doc from '../../helpers/pdfDoc';

// Mock pdfkit so the source code falls back to utils.PDFDocument (which we stub)
jest.mock('pdfkit', () => ({ __esModule: true, default: undefined }));

// Mock pdfkitHelpers so waitForData resolves immediately in tests
jest.mock('../../../src/modules/print/pdfkitHelpers', () => ({
  waitForData: jest.fn().mockResolvedValue(''),
  base64ToArrayBuffer: jest.fn().mockReturnValue(new Uint8Array(0)),
}));

describe('print module', () => {
  const pdf = {
    url: 'someURL',
    blob: 'someBlob',
  };

  const margin = 36;

  const data = {
    daily: { type: 'daily' },
    bgLog: { type: 'bgLog' },
    basics: { type: 'basics' },
    settings: { type: 'settings' },
    agpCGM: { type: 'agpCGM' },
    agpBGM: { type: 'agpBGM' },
  };

  const opts = {
    patient: {},
  };

  class DailyPrintView {
    render() {}
  }

  class BgLogPrintView {
    render() {}
  }

  class BasicsPrintView {
    render() {}
  }

  class SettingsPrintView {
    render() {}
  }

  function AGPPrintView() {
    return {
      render: sinon.stub().resolves(null),
    };
  }

  class PrescriptionPrintView {
    render() {}
  }

  class TagsAndSitesPrintView {
    render() {}
  }

  const sandbox = sinon.createSandbox();

  let doc;

  sinon.stub(Module.utils.PrintView, 'renderPageNumbers');
  sinon.stub(Module.utils.PrintView, 'renderNoData');
  sinon.stub(Module.utils, 'BasicsPrintView').returns(new BasicsPrintView());
  sinon.stub(Module.utils, 'DailyPrintView').returns(new DailyPrintView());
  sinon.stub(Module.utils, 'BgLogPrintView').returns(new BgLogPrintView());
  sinon.stub(Module.utils, 'SettingsPrintView').returns(new SettingsPrintView());
  sinon.stub(Module.utils, 'AGPPrintView').returns(new AGPPrintView());
  sinon.stub(Module.utils, 'PrescriptionPrintView').returns(new PrescriptionPrintView());
  sinon.stub(Module.utils, 'TagsAndSitesPrintView').returns(new TagsAndSitesPrintView());
  sinon.stub(Module.utils, 'blobStream').returns(new MemoryStream());

  beforeEach(() => {
    doc = new Doc({ pdf, margin });
    sandbox.stub(Module.utils, 'PDFDocument').returns(doc);
    global.URL.createObjectURL = jest.fn(() => pdf.url);
  });

  afterEach(() => {
    sandbox.restore();
    delete global.URL.createObjectURL;
    Module.utils.PrintView.renderPageNumbers.resetHistory();
    Module.utils.PrintView.renderNoData.resetHistory();
    Module.utils.BasicsPrintView.resetHistory();
    Module.utils.DailyPrintView.resetHistory();
    Module.utils.BgLogPrintView.resetHistory();
    Module.utils.SettingsPrintView.resetHistory();
    Module.utils.AGPPrintView.resetHistory();
    Module.utils.PrescriptionPrintView.resetHistory();
    Module.utils.TagsAndSitesPrintView.resetHistory();
    Module.utils.blobStream.resetHistory();
  });

  it('should export a createPrintPDFPackage method', () => {
    expect(Module.createPrintPDFPackage).to.be.a('function');
  });

  it('should export a createPrintView method', () => {
    expect(Module.createPrintView).to.be.a('function');
  });

  it('should render and return the complete pdf data package when all data is available', () => {
    const result = Module.createPrintPDFPackage(data, opts);

    return result.then(_result => {
      sinon.assert.calledOnce(Module.utils.BasicsPrintView);
      sinon.assert.calledWithMatch(
        Module.utils.BasicsPrintView,
        doc,
        data.basics,
        {
          patient: opts.patient,
          patientTags: [],
          sites: [],
          title: 'The Basics',
        },
      );

      sinon.assert.calledOnce(Module.utils.DailyPrintView);
      sinon.assert.calledWithMatch(
        Module.utils.DailyPrintView,
        doc,
        data.daily,
        {
          patient: opts.patient,
          patientTags: [],
          sites: [],
          title: 'Daily Charts',
        },
      );

      sinon.assert.calledOnce(Module.utils.BgLogPrintView);
      sinon.assert.calledWithMatch(
        Module.utils.BgLogPrintView,
        doc,
        data.bgLog,
        {
          patient: opts.patient,
          patientTags: [],
          sites: [],
          title: 'BG Log',
        },
      );

      sinon.assert.calledOnce(Module.utils.SettingsPrintView);
      sinon.assert.calledWithMatch(
        Module.utils.SettingsPrintView,
        doc,
        data.settings,
        {
          patient: opts.patient,
          patientTags: [],
          sites: [],
          title: 'Pump Settings',
        },
      );

      sinon.assert.calledTwice(Module.utils.AGPPrintView);
      sinon.assert.calledWithMatch(
        Module.utils.AGPPrintView,
        doc,
        data.agpCGM,
        {
          patient: opts.patient,
          patientTags: [],
          sites: [],
        },
      );
      sinon.assert.calledWithMatch(
        Module.utils.AGPPrintView,
        doc,
        data.agpBGM,
        {
          patient: opts.patient,
        },
      );

      expect(_result.url).to.equal(pdf.url);
      expect(_result.blob).to.be.instanceof(Blob);
    });
  });

  it('should pass patientTags and sites through to every view in the order received', () => {
    const patientTags = [{ id: 't2', name: 'Zeta' }, { id: 't1', name: 'alpha' }];
    const sites = [{ id: 's1', name: 'North' }, { id: 's2', name: 'Downtown' }];

    const result = Module.createPrintPDFPackage(data, { ...opts, patientTags, sites });

    return result.then(() => {
      _.each([
        Module.utils.BasicsPrintView,
        Module.utils.DailyPrintView,
        Module.utils.BgLogPrintView,
        Module.utils.SettingsPrintView,
        Module.utils.AGPPrintView,
      ], View => {
        const renderOpts = View.firstCall.args[2];
        expect(renderOpts.patientTags).to.eql(patientTags);
        expect(renderOpts.sites).to.eql(sites);
      });
    });
  });

  it('should default patientTags and sites to empty arrays when omitted from opts', () => {
    const result = Module.createPrintPDFPackage(data, opts);

    return result.then(() => {
      _.each([
        Module.utils.BasicsPrintView,
        Module.utils.DailyPrintView,
        Module.utils.BgLogPrintView,
        Module.utils.SettingsPrintView,
        Module.utils.AGPPrintView,
      ], View => {
        const renderOpts = View.firstCall.args[2];
        expect(renderOpts.patientTags).to.eql([]);
        expect(renderOpts.sites).to.eql([]);
      });
    });
  });

  it('should only render the basics view when other views are disabled', () => {
    const basicsOnlyEnabledOpts = {
      basics: { disabled: false },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: true },
      agpCGM: { disabled: true },
      agpBGM: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, basicsOnlyEnabledOpts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.BasicsPrintView);

      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);
      sinon.assert.notCalled(Module.utils.AGPPrintView);
    });
  });

  it('should only render the daily view when other views are disabled', () => {
    const dailyOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: false },
      bgLog: { disabled: true },
      settings: { disabled: true },
      agpCGM: { disabled: true },
      agpBGM: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, dailyOnlyEnabledOpts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.DailyPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);
      sinon.assert.notCalled(Module.utils.AGPPrintView);
    });
  });

  it('should only render the bgLog view when other views are disabled', () => {
    const bgLogOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: false },
      settings: { disabled: true },
      agpCGM: { disabled: true },
      agpBGM: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, bgLogOnlyEnabledOpts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.BgLogPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.AGPPrintView);
    });
  });

  it('should only render the settings view when other views are disabled', () => {
    const settingsOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: false },
      agpCGM: { disabled: true },
      agpBGM: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, settingsOnlyEnabledOpts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.SettingsPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.AGPPrintView);
    });
  });

  it('should only render the agp CGM view when other views are disabled', () => {
    const agpOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: true },
      agpCGM: { disabled: false },
      agpBGM: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, agpOnlyEnabledOpts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.AGPPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);
    });
  });

  it('should only render the agp BGM view when other views are disabled', () => {
    const agpOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: true },
      agpCGM: { disabled: true },
      agpBGM: { disabled: false },
    };

    const result = Module.createPrintPDFPackage(data, agpOnlyEnabledOpts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.AGPPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);
    });
  });

  it('should render insufficient data message when all views are disabled', () => {
    const allDisabledOpts = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: true },
      agpCGM: { disabled: true },
      agpBGM: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, allDisabledOpts);

    return result.then(() => {
      sinon.assert.notCalled(Module.utils.AGPPrintView);
      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);

      sinon.assert.calledOnce(Module.utils.PrintView.renderNoData);
    });
  });

  it('should only render the prescription view if provided via pdfType option', () => {
    const allDisabledOpts = {
      pdfType: 'prescription',
    };

    const result = Module.createPrintPDFPackage(data, allDisabledOpts);

    return result.then(() => {
      sinon.assert.notCalled(Module.utils.AGPPrintView);
      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);

      sinon.assert.calledOnce(Module.utils.PrescriptionPrintView);
    });
  });

  describe('tags and sites page', () => {
    const patientTags = [{ id: 't2', name: 'Zeta' }, { id: 't1', name: 'alpha' }];
    const sites = [{ id: 's1', name: 'North' }, { id: 's2', name: 'Downtown' }];

    const allSectionsDisabled = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: true },
      agpCGM: { disabled: true },
      agpBGM: { disabled: true },
    };

    it('should export the view on utils', () => {
      expect(Module.utils.TagsAndSitesPrintView).to.be.a('function');
    });

    it('should render it after both agp views and before the basics view', () => {
      const result = Module.createPrintPDFPackage(data, { ...opts, patientTags, sites });

      return result.then(() => {
        sinon.assert.calledOnce(Module.utils.TagsAndSitesPrintView);

        sinon.assert.callOrder(
          Module.utils.AGPPrintView,
          Module.utils.TagsAndSitesPrintView,
          Module.utils.BasicsPrintView,
        );

        // callOrder only sees the first agp call, so pin the second one as well
        expect(Module.utils.AGPPrintView.secondCall.callId)
          .to.be.below(Module.utils.TagsAndSitesPrintView.firstCall.callId);
      });
    });

    it('should not render it when neither agp section is enabled', () => {
      const agpDisabledOpts = {
        ...opts,
        patientTags,
        sites,
        agpCGM: { disabled: true },
        agpBGM: { disabled: true },
      };

      const result = Module.createPrintPDFPackage(data, agpDisabledOpts);

      return result.then(() => {
        sinon.assert.notCalled(Module.utils.AGPPrintView);
        sinon.assert.notCalled(Module.utils.TagsAndSitesPrintView);
        sinon.assert.calledOnce(Module.utils.BasicsPrintView);
      });
    });

    it('should render it when only the agp CGM section is enabled', () => {
      const result = Module.createPrintPDFPackage(data, {
        ...opts,
        patientTags,
        sites,
        agpBGM: { disabled: true },
      });

      return result.then(() => {
        sinon.assert.calledOnce(Module.utils.TagsAndSitesPrintView);
      });
    });

    it('should render it when only the agp BGM section is enabled', () => {
      const result = Module.createPrintPDFPackage(data, {
        ...opts,
        patientTags,
        sites,
        agpCGM: { disabled: true },
      });

      return result.then(() => {
        sinon.assert.calledOnce(Module.utils.TagsAndSitesPrintView);
      });
    });

    it('should not render it when both data arrays are empty', () => {
      const result = Module.createPrintPDFPackage(data, { ...opts, patientTags: [], sites: [] });

      return result.then(() => {
        sinon.assert.notCalled(Module.utils.TagsAndSitesPrintView);
      });
    });

    it('should not render it when neither data array is passed', () => {
      const result = Module.createPrintPDFPackage(data, opts);

      return result.then(() => {
        sinon.assert.notCalled(Module.utils.TagsAndSitesPrintView);
      });
    });

    it('should render it when only one of the two arrays has entries', () => {
      const result = Module.createPrintPDFPackage(data, { ...opts, sites });

      return result.then(() => {
        sinon.assert.calledOnce(Module.utils.TagsAndSitesPrintView);
      });
    });

    it('should pass it the title and both arrays in the order received', () => {
      const result = Module.createPrintPDFPackage(data, { ...opts, patientTags, sites });

      return result.then(() => {
        const renderOpts = Module.utils.TagsAndSitesPrintView.firstCall.args[2];

        expect(renderOpts.title).to.equal('Tags & Sites');
        expect(renderOpts.patientTags).to.eql(patientTags);
        expect(renderOpts.sites).to.eql(sites);
      });
    });

    const cgmTimePrefs = { timezoneAware: true, timezoneName: 'US/Pacific' };
    const bgmTimePrefs = { timezoneAware: true, timezoneName: 'Europe/London' };

    const dataWithTimePrefs = {
      ...data,
      agpCGM: { ...data.agpCGM, timePrefs: cgmTimePrefs },
      agpBGM: { ...data.agpBGM, timePrefs: bgmTimePrefs },
      basics: { ...data.basics, timePrefs: { timezoneAware: true, timezoneName: 'Asia/Tokyo' } },
    };

    it('should give it the timePrefs of the agp section it follows', () => {
      const result = Module.createPrintPDFPackage(dataWithTimePrefs, { ...opts, patientTags, sites });

      return result.then(() => {
        expect(Module.utils.TagsAndSitesPrintView.firstCall.args[1])
          .to.eql({ timePrefs: bgmTimePrefs });
      });
    });

    it('should take the agp CGM timePrefs when the agp BGM section is disabled', () => {
      const result = Module.createPrintPDFPackage(dataWithTimePrefs, {
        ...opts,
        patientTags,
        sites,
        agpBGM: { disabled: true },
      });

      return result.then(() => {
        expect(Module.utils.TagsAndSitesPrintView.firstCall.args[1])
          .to.eql({ timePrefs: cgmTimePrefs });
      });
    });
  });

  it('should add the page numbers to the document', () => {
    const result = Module.createPrintPDFPackage(data, opts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.PrintView.renderPageNumbers);
    });
  });
});
