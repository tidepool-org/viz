import _ from 'lodash';
import i18next from 'i18next';

import TextUtil from '../text/TextUtil';
import { statsText } from '../stat';
import { reshapeBgClassesToBgBounds } from '../bloodglucose';
import { formatBgValue } from '../format';
import { formatLocalizedFromUTC } from '../datetime';

const t = i18next.t.bind(i18next);

// Exporting utils for easy stubbing in tests
export const utils = {
  reshapeBgClassesToBgBounds,
  statsText,
  TextUtil,
};

/**
 * trendsText
 * @param  {Object} patient - the patient object that contains the profile
 * @param  {Object} data - DataUtil data object
 * @param  {Array} stats - Processed stats array
 * @param  {Object} chartPrefs - trends chartPrefs object from blip
 *
 * @return {String}  Trends data as a formatted string
 */
export function bgLogText(patient, data, stats) {
  const {
    bgPrefs,
    data: {
      current: {
        endpoints = {},
      },
    },
    metaData,
    timePrefs,
  } = data;

  _.defaults(bgPrefs, {
    bgBounds: utils.reshapeBgClassesToBgBounds(bgPrefs),
  });

  const textUtil = new utils.TextUtil(patient, endpoints.range, timePrefs);
  let bgLogString = textUtil.buildDocumentHeader('BG Log');
  bgLogString += textUtil.buildDocumentDates();
  bgLogString += utils.statsText(stats, textUtil, bgPrefs);
  bgLogString += textUtil.buildTextLine();

  const smbgData = _.filter(
    data?.data?.combined || [],
    d => d.type === 'smbg' && d.normalTime >= endpoints.range[0] && d.normalTime < endpoints.range[1]
  );

  bgLogString += _.map(smbgData.reverse(), d => ([
    formatLocalizedFromUTC(d.normalTime, timePrefs, 'ddd, MMM D, YYYY h:mm A'),
    formatBgValue(d.value, bgPrefs),
    `(${_.capitalize(d.subType || 'meter')})`,
  ].join('\t'))).join('\n');


  const devices = _.filter(metaData?.devices, ({ id }) => metaData?.matchedDevices[id]);

  if (devices.length) {
    const textLines = [
      `\n\n${t('Devices Uploaded')}`,
      ..._.map(devices, ({ id, label }) => label || id),
    ];

    _.each(textLines, line => {
      bgLogString += textUtil.buildTextLine(line);
    });
  }

  return bgLogString;
}
