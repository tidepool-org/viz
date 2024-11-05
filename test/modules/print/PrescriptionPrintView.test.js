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

import PrescriptionPrintView from '../../../src/modules/print/PrescriptionPrintView';
import PrintView from '../../../src/modules/print/PrintView';
import * as patients from '../../../data/patient/profiles';
import * as settings from '../../../data/patient/settings';

import { prescriptionData as data } from '../../../data/print/fixtures';

import {
  DEFAULT_FONT_SIZE,
  FOOTER_FONT_SIZE,
  HEADER_FONT_SIZE,
  LARGE_FONT_SIZE,
  SMALL_FONT_SIZE,
  EXTRA_SMALL_FONT_SIZE,
} from '../../../src/modules/print/utils/constants';

import Doc from '../../helpers/pdfDoc';

describe('PrescriptionPrintView', () => {
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
    new PrescriptionPrintView(doc, renderData, renderOpts)
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

    it('should add the first pdf page', () => {
      sinon.assert.calledOnce(Renderer.doc.addPage);
    });

    it('should initialize the page layout', () => {
      const initLayoutSpy = sinon.stub(PrescriptionPrintView.prototype, 'initLayout');
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

    it('should call the newPage method of the parent class with appropriate args', () => {
      Renderer.newPage();
      sinon.assert.calledWith(PrintView.prototype.newPage, null, sinon.match({ showProfile: false, helpText: null }));
    });
  });

  describe('initLayout', () => {
    it('should initialize the page layout', () => {
      sinon.stub(Renderer, 'setLayoutColumns');

      Renderer.initLayout();

      sinon.assert.calledWithMatch(Renderer.setLayoutColumns, {
        width: Renderer.chartArea.width,
        gutter: 0,
        type: 'percentage',
        widths: [50, 50],
      });
    });
  });

  describe('render', () => {
    it('should call all the appropriate render methods', () => {
      sinon.stub(Renderer, 'renderPatientProfile');
      sinon.stub(Renderer, 'renderTherapySettings');

      Renderer.render();

      sinon.assert.calledOnce(Renderer.renderPatientProfile);
      sinon.assert.calledOnce(Renderer.renderTherapySettings);
    });
  });

  describe('renderPatientProfile', () => {
    it('should set the pdf cursor in the left column', () => {
      sinon.stub(Renderer, 'goToLayoutColumnPosition');

      Renderer.renderPatientProfile();

      sinon.assert.calledWith(Renderer.goToLayoutColumnPosition, 0);
    });

    it('should render the profile data in appropriate columns', () => {
      sinon.stub(Renderer, 'goToLayoutColumnPosition');
      sinon.stub(Renderer, 'renderSectionHeading');

      Renderer.renderPatientProfile();

      sinon.assert.calledWith(Renderer.renderSectionHeading, 'Patient Profile');

      expect(Renderer.goToLayoutColumnPosition.getCall(0).args[0]).to.equal(0);
      expect(Renderer.doc.text.getCall(0).args[0]).to.equal('Name: Test Patient');
      expect(Renderer.doc.text.getCall(1).args[0]).to.equal('Email: test+patient@gmail.com');
      expect(Renderer.doc.text.getCall(2).args[0]).to.equal('Type of Account: Caregiver');
      expect(Renderer.doc.text.getCall(3).args[0]).to.equal('Caregiver Name: Test Caregiver');

      expect(Renderer.goToLayoutColumnPosition.getCall(1).args[0]).to.equal(1);
      expect(Renderer.doc.text.getCall(4).args[0]).to.equal('Birthdate: 11/11/1999');
      expect(Renderer.doc.text.getCall(5).args[0]).to.equal('Gender: Male');
      expect(Renderer.doc.text.getCall(6).args[0]).to.equal('Activation Code: 5TX5LT');

      sinon.assert.callOrder(
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.doc.text,
      );
    });
  });

  describe('renderTherapySettings', () => {
    it('should set the pdf cursor in appropriate columns', () => {
      sinon.stub(Renderer, 'goToLayoutColumnPosition');

      Renderer.renderTherapySettings();

      sinon.assert.calledWith(Renderer.goToLayoutColumnPosition, 0);
    });

    it('should render the therapy settings data', () => {
      sinon.stub(Renderer, 'goToLayoutColumnPosition');
      sinon.stub(Renderer, 'renderSectionHeading');

      Renderer.renderTherapySettings();

      sinon.assert.calledWith(Renderer.renderSectionHeading, 'Therapy Settings');

      expect(Renderer.goToLayoutColumnPosition.getCall(0).args[0]).to.equal(0);
      expect(Renderer.doc.text.getCall(0).args[0]).to.equal('Glucose Safety Limit');
      expect(Renderer.goToLayoutColumnPosition.getCall(1).args[0]).to.equal(1);
      expect(Renderer.doc.text.getCall(1).args[0]).to.equal('80 mg/dL');

      expect(Renderer.goToLayoutColumnPosition.getCall(2).args[0]).to.equal(0);
      expect(Renderer.doc.text.getCall(2).args[0]).to.equal('Correction Range');
      expect(Renderer.goToLayoutColumnPosition.getCall(3).args[0]).to.equal(1);
      expect(Renderer.doc.text.getCall(3).args[0]).to.equal('00:00: 115 - 125 mg/dL');
      expect(Renderer.doc.text.getCall(4).args[0]).to.equal('00:30: 115 - 125 mg/dL');
      expect(Renderer.doc.text.getCall(5).args[0]).to.equal('01:00: 115 - 125 mg/dL');
      expect(Renderer.doc.text.getCall(6).args[0]).to.equal('01:30: 115 - 125 mg/dL');
      expect(Renderer.doc.text.getCall(7).args[0]).to.equal('02:00: 110 - 120 mg/dL');
      expect(Renderer.doc.text.getCall(8).args[0]).to.equal('02:30: 115 - 125 mg/dL');

      expect(Renderer.goToLayoutColumnPosition.getCall(4).args[0]).to.equal(0);
      expect(Renderer.doc.text.getCall(9).args[0]).to.equal('Pre-meal Correction Range');
      expect(Renderer.goToLayoutColumnPosition.getCall(5).args[0]).to.equal(1);
      expect(Renderer.doc.text.getCall(10).args[0]).to.equal('80 - 100 mg/dL');

      sinon.assert.callOrder(
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.doc.text,
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
        Renderer.goToLayoutColumnPosition,
        Renderer.doc.text,
      );

      // No need to assert that every provided row from the fixture data renders - the pattern above
      // is sufficient to capture going back and forth between single value and value array rows.
    });
  });
});
