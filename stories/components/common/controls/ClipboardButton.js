import React from 'react';
import _ from 'lodash';
import { storiesOf } from '@storybook/react';

import ClipboardButton from '../../../../src/components/common/controls/ClipboardButton';
import * as profiles from '../../../../data/patient/profiles';

import { tandemText, nonTandemText } from '../../../../src/utils/settings/textData';
import { trendsText } from '../../../../src/utils/trends/data';
import { basicsText } from '../../../../src/utils/basics/data';
import { bgLogText } from '../../../../src/utils/bgLog/data';
import { MGDL_UNITS } from '../../../../src/utils/constants';

const stories = storiesOf('ClipboardButton', module);

const animasFlatRateData = require('../../../../data/pumpSettings/animas/flatrate.json');
const animasMultiRateData = require('../../../../data/pumpSettings/animas/multirate.json');
const medtronicFlatRateData = require('../../../../data/pumpSettings/medtronic/flatrate.json');
const medtronicMultiRateData = require('../../../../data/pumpSettings/medtronic/multirate.json');
const medtronicAutomatedData = require('../../../../data/pumpSettings/medtronic/automated.json');
const omnipodFlatRateData = require('../../../../data/pumpSettings/omnipod/flatrate.json');
const omnipodMultiRateData = require('../../../../data/pumpSettings/omnipod/multirate.json');
const equilFlatRateData = require('../../../../data/pumpSettings/equil/flatrate.json');
const equilMultiRateData = require('../../../../data/pumpSettings/equil/multirate.json');
const loopFlatRateData = require('../../../../data/pumpSettings/loop/flatrate.json');
const loopMultiRateData = require('../../../../data/pumpSettings/loop/multirate.json');
const tandemFlatRateData = require('../../../../data/pumpSettings/tandem/flatrate.json');
const tandemMultiRateData = require('../../../../data/pumpSettings/tandem/multirate.json');

/* eslint-disable max-len */

const data = {
  settings: {
    animas: {
      flatrate: animasFlatRateData,
      multirate: animasMultiRateData,
    },
    medtronic: {
      flatrate: medtronicFlatRateData,
      multirate: medtronicMultiRateData,
      automated: medtronicAutomatedData,
    },
    omnipod: {
      flatrate: omnipodFlatRateData,
      multirate: omnipodMultiRateData,
    },
    equil: {
      flatrate: equilFlatRateData,
      multirate: equilMultiRateData,
    },
    loop: {
      flatrate: loopFlatRateData,
      multirate: loopMultiRateData,
    },
    tandem: {
      flatrate: tandemFlatRateData,
      multirate: tandemMultiRateData,
    },
  },
};

try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data.trends = require('../../../../local/data-trends.json');
} catch (e) {
  data.trends = {};
}

try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data.basics = require('../../../../local/data-basics.json');
} catch (e) {
  data.basics = {};
}

try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data.bgLog = require('../../../../local/data-bgLog.json');
} catch (e) {
  data.bgLog = {};
}

const notes = `Run \`window.downloadChartData()\` from the console on a Tidepool Web basics, bgLog and/or
trends data view. Save the resulting file to the \`local/\` directory of viz as
\`data-[basics|bgLog|trends].json\`, and then use this story to iterate on the copied text`;

const Wrapper = ({ children }) => (
  <div
    style={{
      maxWidth: '300px',
      border: '1px solid #ccc',
      padding: '30px',
      margin: 'auto',
    }}
  >
    {children}
  </div>
);

stories.add('Default', () => (
  <Wrapper>
    <ClipboardButton />
  </Wrapper>
));

stories.add('OnSuccess callback', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={() => window.alert('onSuccess Called')} // eslint-disable-line no-undef,no-alert
    />
  </Wrapper>
));

stories.add('Custom Text', () => (
  <Wrapper>
    <ClipboardButton
      buttonText="Click Me!"
      buttonTitle="I'm a custom title"
      successText="Thanks!"
      clipboardText="You copied me!"
    />
  </Wrapper>
));

stories.add('Animas Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.animas.flatrate, MGDL_UNITS, 'animas')}
    />
  </Wrapper>
));

stories.add('Animas Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.animas.multirate, MGDL_UNITS, 'animas')}
    />
  </Wrapper>
));

stories.add('Medtronic Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.medtronic.flatrate, MGDL_UNITS, 'medtronic')}
    />
  </Wrapper>
));

stories.add('Medtronic Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.medtronic.multirate, MGDL_UNITS, 'medtronic')}
    />
  </Wrapper>
));

stories.add('Medtronic Automated Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.medtronic.automated, MGDL_UNITS, 'medtronic')}
    />
  </Wrapper>
));

stories.add('OmniPod Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.omnipod.flatrate, MGDL_UNITS, 'insulet')}
    />
  </Wrapper>
));

stories.add('OmniPod Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.omnipod.multirate, MGDL_UNITS, 'insulet')}
    />
  </Wrapper>
));

stories.add('Equil Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.equil.flatrate, MGDL_UNITS, 'microtech')}
    />
  </Wrapper>
));

stories.add('Equil Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.equil.multirate, MGDL_UNITS, 'microtech')}
    />
  </Wrapper>
));

stories.add('Loop Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.loop.flatrate, MGDL_UNITS, 'tidepool loop')}
    />
  </Wrapper>
));

stories.add('Loop Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.loop.multirate, MGDL_UNITS, 'tidepool loop')}
    />
  </Wrapper>
));

stories.add('Tandem Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.flatrate, MGDL_UNITS)}
    />
  </Wrapper>
));

stories.add('Tandem Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.multirate, MGDL_UNITS)}
    />
  </Wrapper>
));

stories.add('Trends Data', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={trendsText.bind(this, profiles.standard, data.trends.data, data.trends.stats, data.trends.chartPrefs)}
    />
  </Wrapper>
), { notes });

stories.add('Basics Data', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={basicsText.bind(this, profiles.standard, data.basics.data, data.basics.stats, data.basics.aggregations)}
    />
  </Wrapper>
), { notes });

stories.add('BG Log Data', () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={bgLogText.bind(this, profiles.standard, data.bgLog.data, data.bgLog.stats)}
    />
  </Wrapper>
), { notes });

/* eslint-enable max-len */
