import _ from 'lodash';

import TextUtil from '../text/TextUtil';
import { statsText } from '../stat';
import { reshapeBgClassesToBgBounds } from '../bloodglucose';
import { formatBgValue } from '../format';
import { formatLocalizedFromUTC } from '../datetime';

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
    data: {
      current: {
        endpoints = {},
      },
    },
    bgPrefs,
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

  return bgLogString;
}
