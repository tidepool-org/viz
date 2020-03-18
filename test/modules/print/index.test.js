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

  const sandbox = sinon.sandbox.create();

  let doc;

  sinon.stub(Module.utils.PrintView, 'renderPageNumbers');
  sinon.stub(Module.utils, 'BasicsPrintView').returns(new BasicsPrintView());
  sinon.stub(Module.utils, 'DailyPrintView').returns(new DailyPrintView());
  sinon.stub(Module.utils, 'BgLogPrintView').returns(new BgLogPrintView());
  sinon.stub(Module.utils, 'SettingsPrintView').returns(new SettingsPrintView());
  sinon.stub(Module.utils, 'blobStream').returns(new MemoryStream());

  beforeEach(() => {
    doc = new Doc({ pdf, margin });
    sandbox.stub(Module.utils, 'PDFDocument').returns(doc);
  });

  afterEach(() => {
    sandbox.restore();
    Module.utils.PrintView.renderPageNumbers.resetHistory();
    Module.utils.BasicsPrintView.resetHistory();
    Module.utils.DailyPrintView.resetHistory();
    Module.utils.BgLogPrintView.resetHistory();
    Module.utils.SettingsPrintView.resetHistory();
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
    doc.stream.end();

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

      expect(_result).to.eql(pdf);
    });
  });

  it('should only render the basics view when other views are disabled', () => {
    const basicsOnlyEnabledOpts = {
      basics: { disabled: false },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, basicsOnlyEnabledOpts);
    doc.stream.end();

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.BasicsPrintView);

      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);
    });
  });

  it('should only render the daily view when other views are disabled', () => {
    const dailyOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: false },
      bgLog: { disabled: true },
      settings: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, dailyOnlyEnabledOpts);
    doc.stream.end();

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.DailyPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);
    });
  });

  it('should only render the bgLog view when other views are disabled', () => {
    const bgLogOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: false },
      settings: { disabled: true },
    };

    const result = Module.createPrintPDFPackage(data, bgLogOnlyEnabledOpts);
    doc.stream.end();

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.BgLogPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.SettingsPrintView);
    });
  });

  it('should only render the settings view when other views are disabled', () => {
    const settingsOnlyEnabledOpts = {
      basics: { disabled: true },
      daily: { disabled: true },
      bgLog: { disabled: true },
      settings: { disabled: false },
    };

    const result = Module.createPrintPDFPackage(data, settingsOnlyEnabledOpts);
    doc.stream.end();

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.SettingsPrintView);

      sinon.assert.notCalled(Module.utils.BasicsPrintView);
      sinon.assert.notCalled(Module.utils.DailyPrintView);
      sinon.assert.notCalled(Module.utils.BgLogPrintView);
    });
  });

  it('should add the page numbers to the document', () => {
    const result = Module.createPrintPDFPackage(data, opts);
    doc.stream.end();

    return result.then(() => {
      sinon.assert.calledOnce(Module.utils.PrintView.renderPageNumbers);
    });
  });
});
