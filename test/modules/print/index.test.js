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

  it('should add the page numbers to the document', () => {
    const result = Module.createPrintPDFPackage(data, opts);

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.PrintView.renderPageNumbers);
    });
  });
});
