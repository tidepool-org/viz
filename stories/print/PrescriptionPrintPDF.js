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
import PDFDocument from 'pdfkit';

import { createPrintView } from '../../src/modules/print/index';
import { MARGIN } from '../../src/modules/print/utils/constants';
import PrintView from '../../src/modules/print/PrintView';
import { base64ToArrayBuffer, waitForData } from '../../src/modules/print/pdfkitHelpers';

import * as profiles from '../../data/patient/profiles';
import { MGDL_UNITS } from '../../src/utils/constants';
import { prescriptionData } from '../../data/print/fixtures';

/* global window */
/* eslint-disable max-len */

const stories = storiesOf('Prescription View PDF', module);

function openPDF({ patient }) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, margin: MARGIN });

  const opts = {
    patient,
  };

  const data = {
    ...prescriptionData,
    bgPrefs: { bgUnits: MGDL_UNITS },
  };

  createPrintView('prescription', data, opts, doc).render();
  PrintView.renderPageNumbers(doc);

  waitForData(doc)
    .then(dataUrl => {
      const byte = base64ToArrayBuffer(dataUrl);
      const blob = new Blob([byte], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');
    })
    .catch(error => {
      console.log(error);
    });

  doc.end();
}

stories.add('standard account', () => (
  <button onClick={() => openPDF({ patient: profiles.standard })}>
    Open PDF in new tab
  </button>
));
