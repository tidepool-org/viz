import _ from 'lodash';
import i18next from 'i18next';
const t = i18next.t.bind(i18next);

if (_.get(i18next, 'options.returnEmptyString') === undefined) {
  // Return key if no translation is present
  i18next.init({ returnEmptyString: false, nsSeparator: '|' });
}

export const AGP_TIR_MIN_HEIGHT = 5;

export const text = {
  reportHeader: t('AGP Report:'),
  reportSubHeader: t('Continuous glucose monitoring'),
  reportFooter: t('Patent pending \u2013 HealthPartners Institute dba International Diabetes Center \u2013 All Rights Reserved. \u00A92022'),
  timeInRanges: {
    title: t('Time in Ranges'),
    subtitle: t('Goals for Type 1 and Type 2 Diabetes'),
  },
  reportInfo: {
    dob: t('DOB:'),
  },
  glucoseMetrics: {
    title: t('Glucose metrics'),
  },
  ambulatoryGlucoseProfile: {
    title: t('Ambulatory Glucose Profile (AGP)'),
    description: t('AGP is a summary of glucose values from the report period, with median (50%) and other percentiles shown as if they occurred in a single day.'),
  },
  dailyThumbnails: {
    title: t('Daily Glucose Profiles'),
    description: t('Each daily profile represents a midnight-to-midnight period.'),
  },
};

export const fontSizes = {
  reportHeader: 14,
  reportSubHeader: 14,
  reportFooter: 7,
  reportInfo: {
    default: 10,
    label: 8,
  },
  section: {
    title: 9,
    subtitle: 8,
    description: 7,
  },
  timeInRanges: {
    values: 9,
    ticks: 7,
  },
};

const black = '#000000';
const white = '#FFFFFF';

export const colors = {
  text: {
    reportHeader: '#522398',
    label: '#626267',
    reportFooter: black,
    section: {
      title: black,
      subtitle: black,
      description: black,
    },
    reportInfo: black,
  },
  line: {
    default: '#626267',
    range: {
      target: '#00AA51',
      divider: white,
    },
  },
  white,
  black,
  background: {
    shaded: '#D9D9D9',
  },
  bgRange: {
    veryLow: '#CC0019',
    low: '#FF0000',
    // target: '#4DFF26 ',
    target: '#00AA51',
    high: '#FFBF00',
    veryHigh: '#FF6900',
    empty: '#626267',
  },
};
