import React from 'react';
import _ from 'lodash';
import { storiesOf } from '@storybook/react';
import Plotly from 'plotly.js-basic-dist-min';

import {
  withKnobs,
  optionsKnob as options,
  date,
  number,
} from '@storybook/addon-knobs';

import moment from 'moment';

import { MGDL_UNITS, MMOLL_UNITS, DEFAULT_BG_BOUNDS } from '../../src/utils/constants';
import { createPrintView } from '../../src/modules/print/index';
import { MARGIN } from '../../src/modules/print/utils/constants';
import { generateAGPFigureDefinitions } from '../../src/utils/print/plotly';

import PrintView from '../../src/modules/print/PrintView';

import * as profiles from '../../data/patient/profiles';

/* global PDFDocument, blobStream, window */

const stories = storiesOf('AGP View PDF', module);
stories.addDecorator(withKnobs);
stories.addParameters({ options: { panelPosition: 'right' } });

const GROUP_CONFIG = 'CONFIG';

let queries;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  queries = require('../../local/PDFDataQueries.json');
} catch (e) {
  queries = {};
}

async function openPDF(dataUtil, { patient }, query) {
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, margin: MARGIN });
  const stream = doc.pipe(blobStream());
  const data = dataUtil.query(query);

  const opts = {
    bgPrefs: queries.agp.bgPrefs,
    timePrefs: queries.agp.timePrefs,
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
  opts.svgDataURLS = _.fromPairs(processedEntries);

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

stories.add('standard account', ({ dataUtil }) => {
  const latestCBGDatum = dataUtil.getMetaData('latestDatumByType').latestDatumByType.cbg;
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

  const endMoment = () => moment.utc(latestCBGDatum?.normalTime).tz(getTimePrefs().timezoneName).startOf('day').add(1, 'day');

  const getEndMoment = () => {
    const endDate = date('End Date', endMoment().toDate(), GROUP_CONFIG);
    return moment.utc(endDate).tz(getTimePrefs().timezoneName);
  };

  const getBGPrefs = () => {
    const bgUnits = options('BG Units', { [MGDL_UNITS]: MGDL_UNITS, [MMOLL_UNITS]: MMOLL_UNITS }, MGDL_UNITS, { display: 'select' }, GROUP_CONFIG);

    return bgUnits !== 'None' ? {
      bgUnits,
      bgBounds: DEFAULT_BG_BOUNDS[bgUnits],
    } : undefined;
  };

  const getEndpoints = () => {
    const endDate = getEndMoment();

    const endpoints = [
      endDate.clone().subtract(getDaysInRange(), 'd').startOf('day').valueOf(),
      endDate.valueOf(),
    ];

    return endpoints;
  };

  getTimePrefs();
  getEndpoints();
  getBGPrefs();

  const query = () => ({
    endpoints: getEndpoints(),
    timePrefs: getTimePrefs(),
    bgPrefs: getBGPrefs(),
    bgSource: 'cbg',
    aggregationsByDate: 'dataByDate, statsByDate',
    stats: [
      'timeInRange',
      'averageGlucose',
      'sensorUsage',
      'glucoseManagementIndicator',
      'coefficientOfVariation',
    ],
    types: { cbg: {} },
  });

  return (
    <button
      onClick={() => openPDF(dataUtil, { patient: profiles.longName }, query())}>
      Open PDF in new tab
    </button>
  );
}, { notes });
