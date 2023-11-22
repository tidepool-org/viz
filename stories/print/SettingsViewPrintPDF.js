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
import PDFDocument from 'pdfkit';

import { createPrintView } from '../../src/modules/print/index';
import { MARGIN } from '../../src/modules/print/utils/constants';
import PrintView from '../../src/modules/print/PrintView';
import { base64ToArrayBuffer, waitForData } from '../../src/modules/print/pdfkitHelpers';

import * as profiles from '../../data/patient/profiles';

/* global window */
/* eslint-disable max-len */

export default { title: 'Settings View PDF' };

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
          settings: { ...dataFixture, normalTime: dataFixture.time },
        },
      },
      bgPrefs: { bgUnits: dataFixture.units?.bg },
    };
  }

  createPrintView('settings', data, opts, doc).render();
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
and then use this story to iterate on the Settings Print PDF outside of Tidepool Web!`;

profiles.longName = _.cloneDeep(profiles.standard);
profiles.longName.profile.fullName = 'Super Duper Extra Long Patient Name';

export const StandardAccount = (opts, { dataUtil }) => (
  <button onClick={() => openPDF(dataUtil, { patient: profiles.standard })}>
    Open PDF in new tab
  </button>
);

StandardAccount.story = {
  name: 'standard account',
  parameters: { notes },
};

export const AnimasFlatRate = (opts, { dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, { patient: profiles.longName }, animasDataFlatRate, 'animas')}
  >
    Open PDF in new tab
  </button>
);

AnimasFlatRate.story = {
  name: 'animas flat rate',
  parameters: { notes },
};

export const AnimasMultiRate = (opts, { dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, { patient: profiles.longName }, animasDataMultiRate, 'animas')}
  >
    Open PDF in new tab
  </button>
);

AnimasMultiRate.story = {
  name: 'animas multi rate',
  parameters: { notes },
};

export const MedtronicFlatRate = (opts, { dataUtil }) => (
  <button
    onClick={() =>
      openPDF(dataUtil, { patient: profiles.longName }, medtronicDataFlatRate, 'medtronic')
    }
  >
    Open PDF in new tab
  </button>
);

MedtronicFlatRate.story = {
  name: 'medtronic flat rate',
  parameters: { notes },
};

export const MedtronicMultiRate = (opts, { dataUtil }) => (
  <button
    onClick={() =>
      openPDF(dataUtil, { patient: profiles.longName }, medtronicDataMultiRate, 'medtronic')
    }
  >
    Open PDF in new tab
  </button>
);

MedtronicMultiRate.story = {
  name: 'medtronic multi rate',
  parameters: { notes },
};

export const MedtronicAutomatedRate = (opts, { dataUtil }) => (
  <button
    onClick={() =>
      openPDF(dataUtil, { patient: profiles.longName }, medtronicDataAutomated, 'medtronic')
    }
  >
    Open PDF in new tab
  </button>
);

MedtronicAutomatedRate.story = {
  name: 'medtronic automated rate',
  parameters: { notes },
};

export const MedtronicAutomatedInactiveRate = (opts, { dataUtil }) => {
  const inactiveAutomatedBasaldata = _.assign({}, medtronicDataAutomated, {
    activeSchedule: 'Standard',
  });

  return (
    <button
      onClick={() =>
        openPDF(dataUtil, { patient: profiles.longName }, inactiveAutomatedBasaldata, 'medtronic')
      }
    >
      Open PDF in new tab
    </button>
  );
};

MedtronicAutomatedInactiveRate.story = {
  name: 'medtronic automated inactive rate',
  parameters: { notes },
};

export const OmnipodFlatRate = (opts, { dataUtil }) => (
  <button
    onClick={() =>
      openPDF(dataUtil, { patient: profiles.longName }, omnipodDataFlatRate, 'insulet')
    }
  >
    Open PDF in new tab
  </button>
);

OmnipodFlatRate.story = {
  name: 'omnipod flat rate',
  parameters: { notes },
};

export const OmnipodMultiRate = (opts, { dataUtil }) => (
  <button
    onClick={() =>
      openPDF(dataUtil, { patient: profiles.longName }, omnipodDataMultiRate, 'insulet')
    }
  >
    Open PDF in new tab
  </button>
);

OmnipodMultiRate.story = {
  name: 'omnipod multi rate',
  parameters: { notes },
};

export const TandemFlatRate = (opts, { dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, { patient: profiles.longName }, tandemDataFlatRate, 'tandem')}
  >
    Open PDF in new tab
  </button>
);

TandemFlatRate.story = {
  name: 'tandem flat rate',
  parameters: { notes },
};

export const TandemMultiRate = (opts, { dataUtil }) => (
  <button
    onClick={() => openPDF(dataUtil, { patient: profiles.longName }, tandemDataMultiRate, 'tandem')}
  >
    Open PDF in new tab
  </button>
);

TandemMultiRate.story = {
  name: 'tandem multi rate',
  parameters: { notes },
};
