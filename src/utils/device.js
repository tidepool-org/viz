import _ from 'lodash';

import { AUTOMATED_BASAL_DEVICE_MODELS, pumpVocabulary } from './constants';
import { deviceName } from './settings/data';

/**
 * Get the latest upload datum
 * @param {Array} uploadData Array of Tidepool upload data
 * @returns {Object} The latest upload datum
 */
export function getLatestPumpUpload(uploadData = []) {
  return _.findLast(uploadData, { deviceTags: ['insulin-pump'] });
}

/**
 * Get the latest upload datum
 * @param {Array} basalData Array of Tidepool basal data
 * @returns {Object} The latest manual basal schedule name, else undefined
 */
export function getLastManualBasalSchedule(basalData = []) {
  const lastManualBasal = _.findLast(basalData, { deliveryType: 'scheduled' });
  return _.get(lastManualBasal, 'scheduleName');
}

/**
 * Check if the provided upload datum was for an automated basal device
 * @param {String} manufacturer Manufacturer name
 * @param {String} deviceModel Device model number
 * @returns {Boolean}
 */
export function isAutomatedBasalDevice(manufacturer, deviceModel) {
  return _.includes(
    _.get(AUTOMATED_BASAL_DEVICE_MODELS, deviceName(manufacturer), []),
    deviceModel
  );
}

/**
 * Get a pump terminology vocabulary, with default fallbacks for missing keys
 * @param {String} manufacturer Manufacturer name
 * @returns {Object} pump vocabulary
 */
export function getPumpVocabulary(manufacturer) {
  const vocabulary = _.cloneDeep(pumpVocabulary);
  return _.defaults(
    _.get(vocabulary, deviceName(manufacturer), {}),
    vocabulary.default
  );
}

/**
 * postProcessBolusAggregations
 *
 * Post processor for crossfilter reductio bolus aggregations
 *
 * @param {Function} priorResults - returns the data from the active crossfilter reductio reducer
 * @returns {Object} formatted total and subtotal data for bolus aggregations
 */
export const postProcessCalibrationAggregations = priorResults => () => {
  const data = _.filter(
    _.cloneDeep(priorResults()),
    ({ value: { dataList } }) => !_.isEmpty(dataList)
  );

  const processedData = {};

  _.each(data, dataForDay => {
    const {
      value: {
        calibration,
      },
    } = dataForDay;

    processedData[dataForDay.key] = {
      total: calibration.count,
      subtotals: {
        calibration: calibration.count,
      },
    };
  });

  return {
    summary: {
      total: _.sumBy(_.values(processedData), dateData => dateData.total),
      subtotals: _.reduce(_.map(_.values(processedData), 'subtotals'), (acc, subtotals) => {
        const tags = _.keysIn(subtotals);
        _.each(tags, tag => {
          acc[tag] = (acc[tag] || 0) + subtotals[tag];
        });
        return acc;
      }, {}),
    },
    byDate: processedData,
  };
};
