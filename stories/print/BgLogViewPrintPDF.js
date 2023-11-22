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

import React from 'react';
import PDFDocument from 'pdfkit';

import { createPrintView } from '../../src/modules/print/index';
import { MARGIN } from '../../src/modules/print/utils/constants';
import PrintView from '../../src/modules/print/PrintView';
import { base64ToArrayBuffer, waitForData } from '../../src/modules/print/pdfkitHelpers';

import * as profiles from '../../data/patient/profiles';

/* global window */

export default { title: 'BG Log View PDF' };

let queries;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  queries = require('../../local/PDFDataQueries.json');
} catch (e) {
  queries = {};
}

function openPDF(dataUtil, { patient }) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, margin: MARGIN });
  const opts = {
    bgPrefs: queries.bgLog.bgPrefs,
    timePrefs: queries.bgLog.timePrefs,
    patient,
  };

  const data = queries.bgLog ? dataUtil.query(queries.bgLog) : {};

  createPrintView('bgLog', data, opts, doc).render();
  PrintView.renderPageNumbers(doc);

  waitForData(doc)
    .then((dataUrl) => {
      const byte = base64ToArrayBuffer(dataUrl);
      const blob = new Blob([byte], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');
    })
    .catch((error) => {
      console.log(error);
    });

  doc.end();
}

const notes = `Run the \`accountTool.py export\` from the \`tidepool-org/tools-private\` repo.
Save the resulting file to the \`local/\` directory of viz as \`rawData.json\`.

After generating a PDF in Tidepool web using the same account you just exported data from,
run \`window.downloadPDFDataQueries()\` from the console on a Tidepool Web data view.
Save the resulting file to the \`local/\` directory of viz as \`PDFDataQueries.json\`,
and then use this story to iterate on the BG Log Print PDF outside of Tidepool Web!`;

export const StandardAccount = (opts, { dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.standard })}>
    Open PDF in new tab
  </button>
);

StandardAccount.story = {
  name: 'standard account',
  parameters: { notes },
};
