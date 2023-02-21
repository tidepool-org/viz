import React from 'react';
import _ from 'lodash';
import { storiesOf } from '@storybook/react';

import { createPrintView } from '../../src/modules/print/index';
import { MARGIN } from '../../src/modules/print/utils/constants';
import PrintView from '../../src/modules/print/PrintView';

import * as profiles from '../../data/patient/profiles';

/* global PDFDocument, blobStream, window */

const stories = storiesOf('AGP View PDF', module);

let queries;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  queries = require('../../local/PDFDataQueries.json');
} catch (e) {
  queries = {};
}

async function openPDF(dataUtil, { patient }) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, margin: MARGIN });
  const stream = doc.pipe(blobStream());
  const opts = {
    bgPrefs: queries.agp.bgPrefs,
    timePrefs: queries.agp.timePrefs,
    patient,
  };

  const data = queries.agp ? dataUtil.query(queries.agp) : {};

  await createPrintView('agp', data, opts, doc).render();
  PrintView.renderPageNumbers(doc);

  doc.end();

  stream.on('finish', () => {
    window.open(stream.toBlobURL('application/pdf'));
  });
}

const notes = `Run the \`accountTool.py export\` from the \`tidepool-org/tools-private\` repo.
Save the resulting file to the \`local/\` directory of viz as \`rawData.json\`.

After generating a PDF in Tidepool web using the same account you just exported data from,
run \`window.downloadPDFDataQueries()\` from the console on a Tidepool Web data view.
Save the resulting file to the \`local/\` directory of viz as \`PDFDataQueries.json\`,
and then use this story to iterate on the AGP Print PDF outside of Tidepool Web!`;

profiles.longName = _.cloneDeep(profiles.standard);
profiles.longName.profile.fullName = 'Super Duper Extra Long Patient Name';

stories.add('standard account', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName })}>
    Open PDF in new tab
  </button>
), { notes });
