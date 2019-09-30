import React from 'react';
import _ from 'lodash';
import { storiesOf } from '@storybook/react';

import ClipboardButton from '../../../../src/components/common/controls/ClipboardButton';
import * as profiles from '../../../../data/patient/profiles';

import { tandemText, nonTandemText } from '../../../../src/utils/settings/textData';
import { MGDL_UNITS } from '../../../../src/utils/constants';

const stories = storiesOf('ClipboardButton', module);

const animasFlatRateData = require('../../../../data/pumpSettings/animas/flatrate.json');
const animasMultiRateData = require('../../../../data/pumpSettings/animas/multirate.json');
const medtronicFlatRateData = require('../../../../data/pumpSettings/medtronic/flatrate.json');
const medtronicMultiRateData = require('../../../../data/pumpSettings/medtronic/multirate.json');
const medtronicAutomatedData = require('../../../../data/pumpSettings/medtronic/automated.json');
const omnipodFlatRateData = require('../../../../data/pumpSettings/omnipod/flatrate.json');
const omnipodMultiRateData = require('../../../../data/pumpSettings/omnipod/multirate.json');
const tandemFlatRateData = require('../../../../data/pumpSettings/tandem/flatrate.json');
const tandemMultiRateData = require('../../../../data/pumpSettings/tandem/multirate.json');

const data = {
  stats: {},
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
    tandem: {
      flatrate: tandemFlatRateData,
      multirate: tandemMultiRateData,
    },
  },
};

try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data.stats.trends = require('../../local/stat-trends.json');
} catch (e) {
  data.stats.trends = {};
}

try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data.stats.basics = require('../../local/stat-basics.json');
} catch (e) {
  data.stats.basics = {};
}

const notes = `Run \`window.downloadStatsData()\` from the console on a Tidepool Web basics and/or
trends data view. Save the resulting file to the \`local/\` directory of viz as
\`stats-[basics|trends].json\`, and then use this story to iterate on the copied text`;

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
    />
  </Wrapper>
));

stories.add('Animas Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.animas.flatrate, MGDL_UNITS, 'animas')}
    />
  </Wrapper>
));

stories.add('Animas Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.animas.multirate, MGDL_UNITS, 'animas')}
    />
  </Wrapper>
));

stories.add('Medtronic Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.medtronic.flatrate, MGDL_UNITS, 'medtronic')}
    />
  </Wrapper>
));

stories.add('Medtronic Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.medtronic.multirate, MGDL_UNITS, 'medtronic')}
    />
  </Wrapper>
));

stories.add('Medtronic Automated Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.medtronic.automated, MGDL_UNITS, 'medtronic')}
    />
  </Wrapper>
));

stories.add('OmniPod Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.omnipod.flatrate, MGDL_UNITS, 'omnipod')}
    />
  </Wrapper>
));

stories.add('OmniPod Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={nonTandemText.bind(this, profiles.standard, data.settings.omnipod.multirate, MGDL_UNITS, 'omnipod')}
    />
  </Wrapper>
));

stories.add('Tandem Flat Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.flatrate, MGDL_UNITS)}
    />
  </Wrapper>
));

stories.add('Tandem Multi Rate', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.multirate, MGDL_UNITS)}
    />
  </Wrapper>
));

stories.add('Trends Data', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.multirate, MGDL_UNITS)}
    />
  </Wrapper>
), { notes });

stories.add('Basics Data', () => (
  <Wrapper>
    <ClipboardButton
      buttonTitle={'For email or notes'}
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.multirate, MGDL_UNITS)}
    />
  </Wrapper>
), { notes });
