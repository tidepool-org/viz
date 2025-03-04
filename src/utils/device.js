import _ from 'lodash';

import {
  AUTOMATED_BASAL_DEVICE_MODELS,
  pumpVocabulary,
  settingsOverrides,
} from './constants';

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
 * Get the latest manual basal schedule name from an array of basal data
 * @param {Array} basalData Array of Tidepool basal data
 * @returns {Object} The latest manual basal schedule name, else undefined
 */
export function getLastManualBasalSchedule(basalData = []) {
  const lastManualBasal = _.findLast(basalData, { deliveryType: 'scheduled' });
  return _.get(lastManualBasal, 'scheduleName');
}

/**
 * Check to see if datum is from DIY Loop
 */
export function isDIYLoop(datum = {}) {
  return (/^com\.[a-zA-Z0-9]*\.?loopkit\.Loop/).test(_.get(datum, 'origin.name', datum?.client?.name || ''));
}

/**
 * Check to see if datum is from Tidepool Loop
*/
export function isTidepoolLoop(datum = {}) {
  return (/^org\.tidepool\.[a-zA-Z0-9]*\.?Loop/).test(_.get(datum, 'origin.name', datum?.client?.name || ''));
}

/**
 * Check to see if and upload datum is from Twiist Loop
*/
export function isTwiistLoop(upload = {}) {
  const majorVersion = parseInt(_.get(upload, 'client.version', '0').split('.')[0]);
  return (/^com.sequelmedtech.tidepool-service/).test(_.get(upload, 'client.name', '')) && majorVersion >= 2;
}

/**
 * Check to see if datum is from a known Loop device
 */
export function isLoop(datum = {}) {
  return datum.tags?.loop || isDIYLoop(datum) || isTidepoolLoop(datum) || (datum.type === 'upload' && isTwiistLoop(datum));
}

/**
 * Check if the provided upload datum was for an automated basal device
 * @param {String} manufacturer Manufacturer name
 * @param {Object} pumpSettingsOrUpload Tidepool pumpSettings or upload datum
 * @param {String} deviceModel Device model number
 * @returns {Boolean}
 */
export function isAutomatedBasalDevice(manufacturer, pumpSettingsOrUpload = {}, deviceModel) {
  return _.includes(_.get(AUTOMATED_BASAL_DEVICE_MODELS, deviceName(manufacturer), []), deviceModel)
    || (manufacturer === 'tandem' && _.get(pumpSettingsOrUpload, 'deviceId', '').indexOf('tandemCIQ') === 0)
    || isLoop(pumpSettingsOrUpload);
}

/**
 * Check if the provided upload datum was for an automated bolus device
 * @param {String} manufacturer Manufacturer name
 * @param {Object} pumpSettingsOrUpload Tidepool pumpSettings or upload datum
 * @returns {Boolean}
 */
export function isAutomatedBolusDevice(manufacturer, pumpSettingsOrUpload = {}) {
  return (manufacturer === 'tandem' && _.get(pumpSettingsOrUpload, 'deviceId', '').indexOf('tandemCIQ') === 0)
    || isDIYLoop(pumpSettingsOrUpload);
}

/**
 * Check if the provided upload datum was for a settings-overrideable device
 * @param {String} manufacturer Manufacturer name
 * @param {Object} pumpSettingsOrUpload Tidepool pumpSettings or upload datum
 * @returns {Boolean}
 */
export function isSettingsOverrideDevice(manufacturer, pumpSettingsOrUpload = {}) {
  return (manufacturer === 'tandem' && _.get(pumpSettingsOrUpload, 'deviceId', '').indexOf('tandemCIQ') === 0)
  || isLoop(pumpSettingsOrUpload);
}

/**
 * Get the uppercased manufacturer name
 * @param {String} manufacturer Manufacturer name
 */
export function getUppercasedManufacturer(manufacturer = '') {
  return _.map(manufacturer.split(' '), part => (part === 'diy' ? _.upperCase(part) : _.upperFirst(part))).join(' ');
}

/**
 * Get a list of standard settings overrides for a settings-overrideable device,
 * with default fallbacks for missing keys
 * @param {String} manufacturer Manufacturer name
 * @returns {Array} settings overrides
 */
export function getSettingsOverrides(manufacturer) {
  return _.get(settingsOverrides, getUppercasedManufacturer(manufacturer), settingsOverrides.default);
}

/**
 * Get a pump terminology vocabulary, with default fallbacks for missing keys
 * @param {String} manufacturer Manufacturer name
 * @returns {Object} pump vocabulary
 */
export function getPumpVocabulary(manufacturer) {
  const vocabulary = _.cloneDeep(pumpVocabulary);
  return _.defaults(
    _.get(vocabulary, getUppercasedManufacturer(manufacturer), {}),
    vocabulary.default
  );
}
