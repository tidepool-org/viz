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
import _ from 'lodash';
import { storiesOf } from '@storybook/react';

import { createPrintView } from '../../src/modules/print/index';
import { MARGIN } from '../../src/modules/print/utils/constants';
import PrintView from '../../src/modules/print/PrintView';

import * as profiles from '../../data/patient/profiles';

/* global PDFDocument, blobStream, window */
/* eslint-disable max-len */

const stories = storiesOf('Settings View PDF', module);

let queries;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  queries = require('../../local/PDFDataQueries.json');
} catch (e) {
  queries = {};
}

import animasDataMultiRate from '../../data/pumpSettings/animas/multirate.json';
import animasDataFlatRate from '../../data/pumpSettings/animas/flatrate.json';
import medtronicDataMultiRate from '../../data/pumpSettings/medtronic/multirate.json';
import medtronicDataFlatRate from '../../data/pumpSettings/medtronic/flatrate.json';
import medtronicDataAutomated from '../../data/pumpSettings/medtronic/automated.json';
import omnipodDataMultiRate from '../../data/pumpSettings/omnipod/multirate.json';
import omnipodDataFlatRate from '../../data/pumpSettings/omnipod/flatrate.json';
import tandemDataMultiRate from '../../data/pumpSettings/tandem/multirate.json';
import tandemDataFlatRate from '../../data/pumpSettings/tandem/flatrate.json';

function openPDF(dataUtil, { patient }, dataFixture, manufacturer) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, margin: MARGIN });
  const stream = doc.pipe(blobStream());
  const opts = {
    bgPrefs: queries.settings.bgPrefs,
    timePrefs: queries.settings.timePrefs,
    patient,
  };
  let data = queries.settings ? dataUtil.query(queries.settings) : {};
  if (dataFixture) {
    data = {
      metaData: {
        latestPumpUpload: {
          manufacturer,
          settings: dataFixture,
        },
      },
    };
  }

  createPrintView('settings', data, opts, doc).render();
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
and then use this story to iterate on the Settings Print PDF outside of Tidepool Web!`;

profiles.longName = _.cloneDeep(profiles.standard);
profiles.longName.profile.fullName = 'Super Duper Long Patient Name';

stories.add('standard account', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.standard })}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('animas flat rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, animasDataFlatRate, 'animas')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('animas multi rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, animasDataMultiRate, 'animas')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('medtronic flat rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, medtronicDataFlatRate, 'medtronic')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('medtronic multi rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, medtronicDataMultiRate, 'medtronic')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('medtronic automated rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, medtronicDataAutomated, 'medtronic')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('medtronic automated inactive rate', ({ dataUtil }) => {
  const inactiveAutomatedBasaldata = _.assign({}, medtronicDataAutomated, {
    activeSchedule: 'Standard',
  });

  return (
    <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, inactiveAutomatedBasaldata, 'medtronic')}>
      Open PDF in new tab
    </button>
  );
}, { notes });

stories.add('omnipod flat rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, omnipodDataFlatRate, 'insulet')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('omnipod multi rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, omnipodDataMultiRate, 'insulet')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('tandem flat rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, tandemDataFlatRate, 'tandem')}>
    Open PDF in new tab
  </button>
), { notes });

stories.add('tandem multi rate', ({ dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.longName }, tandemDataMultiRate, 'tandem')}>
    Open PDF in new tab
  </button>
), { notes });
