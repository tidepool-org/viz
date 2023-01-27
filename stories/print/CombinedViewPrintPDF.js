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
import * as settings from '../../data/patient/settings';

import { MGDL_UNITS, MMOLL_UNITS } from '../../src/utils/constants';

/* global PDFDocument, blobStream, window */

const stories = storiesOf('Combined Views PDF', module);

let queries;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  queries = require('../../local/PDFDataQueries.json');
} catch (e) {
  queries = {};
}

const bgBounds = {
  [MGDL_UNITS]: {
    veryHighThreshold: 250,
    targetUpperBound: 180,
    targetLowerBound: 70,
    veryLowThreshold: 54,
  },
  [MMOLL_UNITS]: {
    veryHighThreshold: 13.9,
    targetUpperBound: 10,
    targetLowerBound: 3.9,
    veryLowThreshold: 3.0,
  },
};

function openPDF(dataUtil, { patient, bgUnits = MGDL_UNITS }) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, margin: MARGIN });
  const stream = doc.pipe(blobStream());
  const opts = {
    bgPrefs: {
      bgBounds: bgBounds[bgUnits],
      bgUnits,
    },
    timePrefs: {
      timezoneAware: true,
      timezoneName: 'US/Eastern',
    },
    numDays: {
      daily: 6,
      bgLog: 30,
    },
    patient,
  };

  const data = {};

  if (queries) {
    _.each(queries, (query, key) => {
      data[key] = dataUtil.query(query);
    });
  }

  createPrintView('basics', data.basics, opts, doc).render();
  createPrintView('daily', data.daily, opts, doc).render();
  createPrintView('bgLog', data.bgLog, opts, doc).render();
  createPrintView('settings', data.settings, opts, doc).render();

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
and then use this story to iterate on the Combined Print PDF outside of Tidepool Web!`;

profiles.longName = _.cloneDeep(profiles.standard);
profiles.longName.profile.fullName = 'Super Duper Extra Long Patient Name';

stories.add(`standard account (${MGDL_UNITS})`, ({ dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, { patient: {
      ...profiles.standard,
      ...settings.cannulaPrimeSelected,
    } })}
  >
    Open PDF in new tab
  </button>
), { notes });

stories.add(`standard account (${MMOLL_UNITS})`, ({ dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, {
      patient: {
        ...profiles.standard,
        ...settings.cannulaPrimeSelected,
      },
      bgUnits: MMOLL_UNITS,
    })}
  >
    Open PDF in new tab
  </button>
), { notes });

stories.add('fake child account', ({ dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, { patient: {
      ...profiles.fakeChildAcct,
      ...settings.tubingPrimeSelected,
    } })}
  >
    Open PDF in new tab
  </button>
), { notes });

stories.add('long patient name', ({ dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, { patient: {
      ...profiles.longName,
      ...settings.tubingPrimeSelected,
    } })}
  >
    Open PDF in new tab
  </button>
), { notes });
