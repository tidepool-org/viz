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

/* global */
import Promise from 'bluebird';
import _ from 'lodash';
import PDFDocument from 'pdfkit';

import i18next from 'i18next';
import PrintView from './PrintView';
import BasicsPrintView from './BasicsPrintView';
import DailyPrintView from './DailyPrintView';
import BgLogPrintView from './BgLogPrintView';
import SettingsPrintView from './SettingsPrintView';
import AGPPrintView from './AGPPrintView';
import { base64ToArrayBuffer, waitForData } from '../print/pdfkitHelpers';

import * as constants from './utils/constants';

if (_.get(i18next, 'options.returnEmptyString') === undefined) {
  // Return key if no translation is present
  i18next.init({ returnEmptyString: false, nsSeparator: '|' });
}

const t = i18next.t.bind(i18next);

// Exporting utils for easy stubbing in tests
export const utils = {
  PDFDocument: class PDFDocumentStub {},
  blobStream: function blobStreamStub() {},
  PrintView,
  BasicsPrintView,
  DailyPrintView,
  BgLogPrintView,
  SettingsPrintView,
  AGPPrintView,
};

/**
 * createPrintView
 * @param {Object} doc - PDFKit document instance
 * @param {Object} data - pre-munged data for the daily print view
 * @param {Object} bgPrefs - user's blood glucose thresholds & targets
 * @param {Object} timePrefs - object containing timezoneAware Boolean, timezoneName String or null
 * @param {Number} numDays - number of days of daily view to include in printout
 * @param {Object} patient - full tidepool patient object
 *
 * @return {Object} dailyPrintView instance
 */
export function createPrintView(type, data, opts, doc) {
  const {
    patient,
    svgDataURLS,
  } = opts;

  let Renderer;
  let renderOpts = {
    // TODO: set this up as a Webpack Define plugin to pull from env variable
    // maybe that'll be tricky through React Storybook?
    debug: false,
    defaultFontSize: constants.DEFAULT_FONT_SIZE,
    dpi: constants.DPI,
    footerFontSize: constants.FOOTER_FONT_SIZE,
    headerFontSize: constants.HEADER_FONT_SIZE,
    height: constants.HEIGHT,
    margins: constants.MARGINS,
    patient,
    smallFontSize: constants.SMALL_FONT_SIZE,
    svgDataURLS,
    width: constants.WIDTH,
  };

  switch (type) {
    case 'daily':
      Renderer = utils.DailyPrintView;

      renderOpts = _.assign(renderOpts, {
        chartsPerPage: 3,
        summaryHeaderFontSize: 10,
        summaryWidthAsPercentage: 0.18,
        title: t('Daily Charts'),
      });
      break;

    case 'basics':
      Renderer = utils.BasicsPrintView;

      renderOpts = _.assign(renderOpts, {
        title: t('The Basics'),
      });
      break;

    case 'bgLog':
      Renderer = utils.BgLogPrintView;

      renderOpts = _.assign(renderOpts, {
        title: t('BG Log'),
      });
      break;

    case 'settings':
      Renderer = utils.SettingsPrintView;

      renderOpts = _.assign(renderOpts, {
        title: t('Pump Settings'),
      });
      break;

    case 'agp':
      Renderer = utils.AGPPrintView;

      renderOpts = _.assign(renderOpts, {
        title: t('AGP Charts'),
      });
      break;

    default:
      return null;
  }

  return new Renderer(doc, data, renderOpts);
}

/**
 * createPrintPDFPackage
 * @param {Array} data - Object of tideline-preprocessed Tidepool diabetes data & notes;
 *                       grouped by type
 * @param {Object} opts - an object of print options (see destructured param below)
 *
 * @return {Promise} - Promise that resolves with an object containing the pdf blob and url
 */
export function createPrintPDFPackage(data, opts) {
  const {
    patient,
    basics = {},
    daily = {},
    bgLog = {},
    settings = {},
    agp = {},
  } = opts;

  if (_.get(patient, 'preferences.displayLanguageCode')) {
    i18next.changeLanguage(patient.preferences.displayLanguageCode);
  }

  const pdfOpts = _.cloneDeep(opts);

  return new Promise(async (resolve, reject) => {
    const DocLib = typeof PDFDocument !== 'undefined' ? PDFDocument : utils.PDFDocument;

    /* NB: if you don't set the `margin` (or `margins` if not all are the same)
    then when you are using the .text() command a new page will be added if you specify
    coordinates outside of the default margin (or outside of the margins you've specified)
    */
    const doc = new DocLib({ autoFirstPage: false, bufferPages: true, margin: constants.MARGIN });

    if (!basics.disabled) createPrintView('basics', data.basics, pdfOpts, doc).render();
    if (!daily.disabled) createPrintView('daily', data.daily, pdfOpts, doc).render();
    if (!bgLog.disabled) createPrintView('bgLog', data.bgLog, pdfOpts, doc).render();
    if (!settings.disabled) createPrintView('settings', data.settings, pdfOpts, doc).render();
    if (!agp.disabled) await createPrintView('agp', data.agp, pdfOpts, doc).render();

    if (
      _.every(
        [basics, daily, bgLog, settings, agp],
        (section) => section.disabled
      )
    ) {
      PrintView.renderNoData(doc);
    }

    PrintView.renderPageNumbers(doc);

    waitForData(doc)
      .then(dataUrl => {
        const byte = base64ToArrayBuffer(dataUrl);
        const blob = new Blob([byte], { type: 'application/pdf' });
        const pdf = {
          blob,
          url: URL.createObjectURL(blob),
        };
        return resolve(pdf);
      })
      .catch(error => reject(error));

    doc.end();
  });
}

export default createPrintPDFPackage;
