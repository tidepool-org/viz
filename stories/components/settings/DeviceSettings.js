import React from 'react';

import { MMOLL_UNITS } from '../../../src/utils/constants';
import NonTandem from '../../../src/components/settings/NonTandem';
import Tandem from '../../../src/components/settings/Tandem';

const animasFlatRateData = require('../../../data/pumpSettings/animas/flatrate.json');
const animasMultiRateData = require('../../../data/pumpSettings/animas/multirate.json');

const timePrefs = { timezoneAware: false, timezoneName: 'Europe/London' };

const user = {
  profile: {
    fullName: 'Mary Smith',
    patient: {
      diagnosisDate: '1990-01-31',
      birthday: '1983-01-31',
    },
  },
};

export default {
  title: 'Device Settings',
};

export const animasFlatRate = {
  render: () => (
      <NonTandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        deviceKey={'animas'}
        openedSections={{ [animasFlatRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={animasFlatRateData}
        timePrefs={timePrefs}
        toggleBasalScheduleExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Animas flat rate'
};

export const animasMultiRate = {
  render: () => (
      <NonTandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        deviceKey={'animas'}
        openedSections={{ [animasMultiRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={animasMultiRateData}
        timePrefs={timePrefs}
        toggleBasalScheduleExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Animas multi rate'
};

const medtronicFlatRateData = require('../../../data/pumpSettings/medtronic/flatrate.json');
const medtronicMultiRateData = require('../../../data/pumpSettings/medtronic/multirate.json');
const medtronicAutomatedData = require('../../../data/pumpSettings/medtronic/automated.json');

export const medtronicFlatRate = {
  render: () => (
      <NonTandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        deviceKey={'medtronic'}
        openedSections={{ [medtronicFlatRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={medtronicFlatRateData}
        timePrefs={timePrefs}
        toggleBasalScheduleExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Medtronic flat rate'
};

export const medtronicMultiRate = {
  render: () => (
      <NonTandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        deviceKey={'medtronic'}
        openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={medtronicMultiRateData}
        timePrefs={timePrefs}
        toggleBasalScheduleExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Medtronic multi rate'
};

export const medtronicAutomated = {
  render: () => (
      <NonTandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        deviceKey={'medtronic'}
        openedSections={{ [medtronicAutomatedData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={medtronicAutomatedData}
        timePrefs={timePrefs}
        toggleBasalScheduleExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Medtronic automated'
};

const omnipodFlatRateData = require('../../../data/pumpSettings/omnipod/flatrate.json');
const omnipodMultiRateData = require('../../../data/pumpSettings/omnipod/multirate.json');

export const omnipodFlatRate = {
  render: () => (
      <NonTandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        deviceKey={'insulet'}
        openedSections={{ [omnipodFlatRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={omnipodFlatRateData}
        timePrefs={timePrefs}
        toggleBasalScheduleExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Omnipod flat rate'
};

export const omnipodMultiRate = {
  render: () => (
      <NonTandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        deviceKey={'insulet'}
        openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={omnipodMultiRateData}
        timePrefs={timePrefs}
        toggleBasalScheduleExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Omnipod multi rate'
};

const tandemFlatRateData = require('../../../data/pumpSettings/tandem/flatrate.json');
const tandemMultiRateData = require('../../../data/pumpSettings/tandem/multirate.json');

export const tandemFlatRate = {
  render: () => (
      <Tandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        openedSections={{ [tandemFlatRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={tandemFlatRateData}
        timePrefs={timePrefs}
        toggleProfileExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Tandem flat rate'
};

export const tandemMultiRate = {
  render: () => (
      <Tandem
        bgUnits={MMOLL_UNITS}
        copySettingsClicked={() => {}}
        openedSections={{ [tandemMultiRateData.activeSchedule]: true }}
        view={'display'}
        pumpSettings={tandemMultiRateData}
        timePrefs={timePrefs}
        toggleProfileExpansion={() => {}}
        user={user}
      />
    ),

  name: 'Tandem multi rate'
};
