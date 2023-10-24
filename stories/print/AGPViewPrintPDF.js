import React from 'react';
import _ from 'lodash';
import { storiesOf } from '@storybook/react';
import Plotly from 'plotly.js-basic-dist-min';
import PDFDocument from 'pdfkit';

import {
  withKnobs,
  optionsKnob as options,
  date,
  number,
} from '@storybook/addon-knobs';

import moment from 'moment';

import { MGDL_UNITS, MMOLL_UNITS, DEFAULT_BG_BOUNDS, CGM_DATA_KEY, BGM_DATA_KEY } from '../../src/utils/constants';
import { createPrintView } from '../../src/modules/print/index';
import { MARGIN } from '../../src/modules/print/utils/constants';
import { generateAGPFigureDefinitions } from '../../src/utils/print/plotly';

import PrintView from '../../src/modules/print/PrintView';
import { base64ToArrayBuffer, waitForData } from '../../src/modules/print/pdfkitHelpers';

import * as profiles from '../../data/patient/profiles';

/* global window */

const stories = storiesOf('AGP View PDF', module);
stories.addDecorator(withKnobs);
stories.addParameters({ options: { panelPosition: 'right' } });

const GROUP_CONFIG = 'CONFIG';

async function openPDF(dataUtil, { patient }, query, bgSource) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, margin: MARGIN });
  const data = dataUtil.query(query);
  const reportType = bgSource === BGM_DATA_KEY ? 'agpBGM' : 'agpCGM';

  const opts = {
    bgPrefs: query.bgPrefs,
    timePrefs: query.timePrefs,
    patient,
  };

  const images = await generateAGPFigureDefinitions(data);

  const promises = _.map(images, async (image, key) => {
    if (_.isArray(image)) {
      const processedArray = await Promise.all(
        _.map(image, async (img) => Plotly.toImage(img, { format: 'svg' }))
      );
      return [key, processedArray];
    } else {
      const processedValue = await Plotly.toImage(image, { format: 'svg' });
      return [key, processedValue];
    }
  });

  const processedEntries = await Promise.all(promises);
  opts.svgDataURLS = { [reportType]: _.fromPairs(processedEntries) };

  await createPrintView(reportType, data, opts, doc).render();
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

const notes = `Run the \`accountTool.py export\` from the \`tidepool-org/tools-private\` repo.
Save the resulting file to the \`local/\` directory of viz as \`rawData.json\`.

After generating a PDF in Tidepool web using the same account you just exported data from,
run \`window.downloadPDFDataQueries()\` from the console on a Tidepool Web data view.
Save the resulting file to the \`local/\` directory of viz as \`PDFDataQueries.json\`,
and then use this story to iterate on the AGP Print PDF outside of Tidepool Web!`;

profiles.longName = _.cloneDeep(profiles.standard);
profiles.longName.profile.fullName = 'Super Duper Extra Long Patient Name';

const daysInRange = 14;

const daysInRangeOptions = {
  range: true,
  min: 1,
  max: 30,
  step: 1,
};

const getDaysInRange = () => number('Days in Current Range', daysInRange, daysInRangeOptions, GROUP_CONFIG);

const timezones = {
  'US/Eastern': 'US/Eastern',
  'US/Central': 'US/Central',
  'US/Mountain': 'US/Mountain',
  'US/Pacific': 'US/Pacific',
  UTC: 'UTC',
};

const getTimePrefs = () => {
  const timeZoneName = options(
    'Time Zone',
    timezones,
    'US/Eastern',
    { display: 'select' },
    GROUP_CONFIG
  );

  const selectedTimeZone = timeZoneName !== 'None' ? timeZoneName : undefined;

  return selectedTimeZone ? {
    timezoneName: selectedTimeZone,
    timezoneAware: true,
  } : undefined;
};

const endMoment = latestDatum => moment.utc(latestDatum?.normalTime).tz(getTimePrefs().timezoneName).startOf('day').add(1, 'day');

const getEndMoment = latestDatum => {
  const endDate = date('End Date', endMoment(latestDatum).toDate(), GROUP_CONFIG);
  return moment.utc(endDate).tz(getTimePrefs().timezoneName);
};

const getBGPrefs = () => {
  const bgUnits = options('BG Units', { [MGDL_UNITS]: MGDL_UNITS, [MMOLL_UNITS]: MMOLL_UNITS }, MGDL_UNITS, { display: 'select' }, GROUP_CONFIG);

  return bgUnits !== 'None' ? {
    bgUnits,
    bgBounds: DEFAULT_BG_BOUNDS[bgUnits],
  } : undefined;
};

const getEndpoints = latestDatum => {
  const endDate = getEndMoment(latestDatum);

  const endpoints = [
    endDate.clone().subtract(getDaysInRange(), 'd').startOf('day').valueOf(),
    endDate.valueOf(),
  ];

  return endpoints;
};

stories.add('CGM', (opts, { dataUtil }) => {
  const bgSource = CGM_DATA_KEY;
  const latestBGDatum = dataUtil.getMetaData('latestDatumByType').latestDatumByType[bgSource];

  getTimePrefs();
  getEndpoints(latestBGDatum);
  getBGPrefs();

  const query = () => ({
    endpoints: getEndpoints(latestBGDatum),
    timePrefs: getTimePrefs(),
    bgPrefs: getBGPrefs(),
    bgSource,
    aggregationsByDate: 'dataByDate, statsByDate',
    stats: [
      'averageGlucose',
      'bgExtents',
      'coefficientOfVariation',
      'glucoseManagementIndicator',
      'sensorUsage',
      'timeInRange',
    ],
    types: { cbg: {} },
    metaData: ['bgSources'],
  });

  return (
    <button
      onClick={() => openPDF(dataUtil, { patient: profiles.longName }, query(), bgSource)}>
      Open PDF in new tab
    </button>
  );
}, { notes });

stories.add('BGM', (opts, { dataUtil }) => {
  const bgSource = BGM_DATA_KEY;
  const latestBGDatum = dataUtil.getMetaData('latestDatumByType').latestDatumByType[bgSource];

  getTimePrefs();
  getEndpoints(latestBGDatum);
  getBGPrefs();

  const query = () => ({
    endpoints: getEndpoints(latestBGDatum),
    timePrefs: getTimePrefs(),
    bgPrefs: getBGPrefs(),
    bgSource,
    aggregationsByDate: 'dataByDate, statsByDate',
    stats: [
      'averageGlucose',
      'bgExtents',
      'coefficientOfVariation',
      'glucoseManagementIndicator',
      'readingsInRange',
    ],
    types: { smbg: {} },
    metaData: ['bgSources'],
  });

  return (
    <button
      onClick={() => openPDF(dataUtil, { patient: profiles.longName }, query(), bgSource)}>
      Open PDF in new tab
    </button>
  );
}, { notes });
