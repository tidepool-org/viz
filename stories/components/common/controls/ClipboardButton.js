import React from 'react';
import _ from 'lodash';

import ClipboardButton from '../../../../src/components/common/controls/ClipboardButton';
import * as profiles from '../../../../data/patient/profiles';

import { tandemText, nonTandemText } from '../../../../src/utils/settings/textData';
import { trendsText } from '../../../../src/utils/trends/data';
import { basicsText } from '../../../../src/utils/basics/data';
import { bgLogText } from '../../../../src/utils/bgLog/data';
import { MGDL_UNITS } from '../../../../src/utils/constants';

export default {
  title: 'Clipboard Button',
}

const animasFlatRateData = require('../../../../data/pumpSettings/animas/flatrate.json');
const animasMultiRateData = require('../../../../data/pumpSettings/animas/multirate.json');
const medtronicFlatRateData = require('../../../../data/pumpSettings/medtronic/flatrate.json');
const medtronicMultiRateData = require('../../../../data/pumpSettings/medtronic/multirate.json');
const medtronicAutomatedData = require('../../../../data/pumpSettings/medtronic/automated.json');
const omnipodFlatRateData = require('../../../../data/pumpSettings/omnipod/flatrate.json');
const omnipodMultiRateData = require('../../../../data/pumpSettings/omnipod/multirate.json');
const equilFlatRateData = require('../../../../data/pumpSettings/equil/flatrate.json');
const equilMultiRateData = require('../../../../data/pumpSettings/equil/multirate.json');
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

export const Default = () => (
  <Wrapper>
    <ClipboardButton />
  </Wrapper>
);

export const OnSuccessCallback = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={() => window.alert('onSuccess Called')} // eslint-disable-line no-undef,no-alert
    />
  </Wrapper>
);

OnSuccessCallback.story = {
  name: 'OnSuccess callback',
};

export const CustomText = () => (
  <Wrapper>
    <ClipboardButton
      buttonText="Click Me!"
      buttonTitle="I'm a custom title"
      successText="Thanks!"
      clipboardText="You copied me!"
    />
  </Wrapper>
);

export const AnimasFlatRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.animas.flatrate,
        MGDL_UNITS,
        'animas'
      )}
    />
  </Wrapper>
);

export const AnimasMultiRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.animas.multirate,
        MGDL_UNITS,
        'animas'
      )}
    />
  </Wrapper>
);

export const MedtronicFlatRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.medtronic.flatrate,
        MGDL_UNITS,
        'medtronic'
      )}
    />
  </Wrapper>
);

export const MedtronicMultiRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.medtronic.multirate,
        MGDL_UNITS,
        'medtronic'
      )}
    />
  </Wrapper>
);

export const MedtronicAutomatedRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.medtronic.automated,
        MGDL_UNITS,
        'medtronic'
      )}
    />
  </Wrapper>
);

export const OmniPodFlatRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.omnipod.flatrate,
        MGDL_UNITS,
        'insulet'
      )}
    />
  </Wrapper>
);

OmniPodFlatRate.story = {
  name: 'OmniPod Flat Rate',
};

export const OmniPodMultiRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.omnipod.multirate,
        MGDL_UNITS,
        'insulet'
      )}
    />
  </Wrapper>
);

OmniPodMultiRate.story = {
  name: 'OmniPod Multi Rate',
};

export const EquilFlatRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.equil.flatrate,
        MGDL_UNITS,
        'microtech'
      )}
    />
  </Wrapper>
);

export const EquilMultiRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={nonTandemText.bind(
        this,
        profiles.standard,
        data.settings.equil.multirate,
        MGDL_UNITS,
        'microtech'
      )}
    />
  </Wrapper>
);

export const TandemFlatRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.flatrate, MGDL_UNITS)}
    />
  </Wrapper>
);

export const TandemMultiRate = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={tandemText.bind(this, profiles.standard, data.settings.tandem.multirate, MGDL_UNITS)}
    />
  </Wrapper>
);

export const TrendsData = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={trendsText.bind(
        this,
        profiles.standard,
        data.trends.data,
        data.trends.stats,
        data.trends.chartPrefs
      )}
    />
  </Wrapper>
);

TrendsData.story = {
  parameters: { notes },
};

export const BasicsData = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={basicsText.bind(
        this,
        profiles.standard,
        data.basics.data,
        data.basics.stats,
        data.basics.aggregations
      )}
    />
  </Wrapper>
);

BasicsData.story = {
  parameters: { notes },
};

export const BgLogData = () => (
  <Wrapper>
    <ClipboardButton
      onSuccess={_.noop}
      getText={bgLogText.bind(this, profiles.standard, data.bgLog.data, data.bgLog.stats)}
    />
  </Wrapper>
);

BgLogData.story = {
  name: 'BG Log Data',
  parameters: { notes },
};
