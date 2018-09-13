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

import * as Profiles from '../../data/patient/profiles';
import * as settings from '../../data/patient/settings';
import { data as dataStub } from '../../data/patient/data';

import { MGDL_UNITS, MMOLL_UNITS } from '../../src/utils/constants';

/* global PDFDocument, blobStream, window */

const stories = storiesOf('Basics View PDF', module);

let data;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data = require('../../local/print-view.json');
} catch (e) {
  data = dataStub;
}

const bgBounds = {
  [MGDL_UNITS]: {
    veryHighThreshold: 300,
    targetUpperBound: 180,
    targetLowerBound: 70,
    veryLowThreshold: 54,
  },
  [MMOLL_UNITS]: {
    veryHighThreshold: 16.7,
    targetUpperBound: 10,
    targetLowerBound: 3.9,
    veryLowThreshold: 3.12345,
  },
};

function openPDF({ patient, bgUnits = MGDL_UNITS }) {
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
    patient,
  };

  createPrintView('basics', data[bgUnits].basics, opts, doc).render();
  PrintView.renderPageNumbers(doc);

  doc.end();

  stream.on('finish', () => {
    window.open(stream.toBlobURL('application/pdf'));
  });
}

const notes = `Run \`window.downloadPrintViewData()\` from the console on a Tidepool Web data view.
Save the resulting file to the \`local/\` directory of viz as \`print-view.json\`,
and then use this story to iterate on the Basics Print PDF outside of Tidepool Web!`;

const profiles = _.cloneDeep(Profiles);
profiles.longName = _.cloneDeep(profiles.standard);
profiles.longName.profile.fullName = 'Super Duper Long Patient Name';

stories.add(`cannula prime (${MGDL_UNITS})`, () => (
  <button
    onClick={() => openPDF({ patient: {
      ...profiles.standard,
      ...settings.cannulaPrimeSelected,
    } })}
  >
    Open PDF in new tab
  </button>
), { notes });

stories.add(`tubing prime (${MMOLL_UNITS})`, () => (
  <button
    onClick={() => openPDF({
      patient: {
        ...profiles.standard,
        ...settings.tubingPrimeSelected,
      },
      bgUnits: MMOLL_UNITS,
    })}
  >
    Open PDF in new tab
  </button>
), { notes });

stories.add(`reservoir change (${MGDL_UNITS})`, () => (
  <button
    onClick={() => openPDF({
      patient: {
        ...profiles.standard,
        ...settings.reservoirChangeSelected,
      },
      bgUnits: MGDL_UNITS,
    })}
  >
    Open PDF in new tab
  </button>
), { notes });

stories.add(`site change source undefined (${MMOLL_UNITS})`, () => (
  <button
    onClick={() => openPDF({
      patient: {
        ...profiles.standard,
        ...settings.siteChangeSourceUndefined,
      },
      bgUnits: MMOLL_UNITS,
    })}
  >
    Open PDF in new tab
  </button>
), { notes });
