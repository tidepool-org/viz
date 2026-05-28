import _ from 'lodash';
import i18next from 'i18next';

import {
  AUTOMATED_BASAL_DEVICE_MODELS,
  DEXCOM_API_DEVICE_LABEL,
  pumpVocabulary,
  settingsOverrides,
} from './constants';

import { deviceName } from './settings/data';

const t = i18next.t.bind(i18next);

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
 * Check to see if datum is from Trio
 */
export function isTrio(datum = {}) {
  return datum.tags?.trio || (/^org\.nightscout\.Trio/).test(_.get(datum, 'origin.name', datum?.client?.name || ''));
}

/**
 * Check to see if datum is from Tidepool Loop
*/
export function isTidepoolLoop(datum = {}) {
  return (/^org\.tidepool\.[a-zA-Z0-9]*\.?Loop/).test(_.get(datum, 'origin.name', datum?.client?.name || ''));
}

/**
 * Check to see if datum is from Twiist Loop
*/
export function isTwiistLoop(datum = {}) {
  if (datum.type === 'upload') {
    const majorVersion = parseInt(_.get(datum, 'client.version', '0').split('.')[0], 10);
    return (/^com.sequelmedtech.tidepool-service/).test(_.get(datum, 'client.name', '')) && majorVersion >= 2;
  }
  return (/^com.dekaresearch.twiist/).test(_.get(datum, 'origin.name', datum?.client?.name || ''));
}

/**
 * Check to see if datum is from Control-IQ
 */
export function isControlIQ(datum = {}) {
  return _.get(datum, 'deviceId', '').indexOf('tandemCIQ') === 0;
}

/**
 * Check to see if datum is from LibreView API
 */
export function isLibreViewAPI(datum = {}) {
  const TARGET = 'org.tidepool.abbott.libreview.partner.api';
  return datum?.client?.name === TARGET || datum?.origin?.name === TARGET;
}

/**
 * Check to see if datum is from a known Loop device
 */
export function isLoop(datum = {}) {
  return datum.tags?.loop || isDIYLoop(datum) || isTidepoolLoop(datum) || isTwiistLoop(datum);
}

/**
 * Check to see if datum is from a Dexcom device
 */
export function isDexcom(datum = {}) {
  const TARGET = 'org.tidepool.oauth.dexcom.fetch';
  return datum.tags?.dexcom || datum.client?.name === TARGET || datum.origin?.name === TARGET || _.includes(datum.deviceManufacturers, 'Dexcom');
}

/**
 * Check if the provided datum was for an automated basal device
 * @param {String} manufacturer Manufacturer name
 * @param {Object} pumpSettingsOrUpload Tidepool pumpSettings or upload datum
 * @param {String} deviceModel Device model number
 * @returns {Boolean}
 */
export function isAutomatedBasalDevice(manufacturer, pumpSettingsOrUpload = {}, deviceModel) {
  return _.includes(_.get(AUTOMATED_BASAL_DEVICE_MODELS, deviceName(manufacturer), []), deviceModel)
    || (manufacturer === 'tandem' && isControlIQ(pumpSettingsOrUpload))
    || isLoop(pumpSettingsOrUpload)
    || isTrio(pumpSettingsOrUpload);
}

/**
 * Check if the provided datum was for an automated bolus device
 * @param {String} manufacturer Manufacturer name
 * @param {Object} pumpSettingsOrUpload Tidepool pumpSettings or upload datum
 * @returns {Boolean}
 */
export function isAutomatedBolusDevice(manufacturer, pumpSettingsOrUpload = {}) {
  return (manufacturer === 'tandem' && isControlIQ(pumpSettingsOrUpload))
    || isDIYLoop(pumpSettingsOrUpload)
    || isTrio(pumpSettingsOrUpload);
}

/**
 * Check if the provided datum was for a settings-overrideable device
 * @param {String} manufacturer Manufacturer name
 * @param {Object} pumpSettingsOrUpload Tidepool pumpSettings or upload datum
 * @returns {Boolean}
 */
export function isSettingsOverrideDevice(manufacturer, pumpSettingsOrUpload = {}) {
  return (manufacturer === 'tandem' && isControlIQ(pumpSettingsOrUpload))
  || isLoop(pumpSettingsOrUpload);
}

/**
 * Check if the provided datum was for a 1-minute CGM sample interval device
 * @param {Object} pumpSettingsOrUpload Tidepool pumpSettings or upload datum
 * @returns {Boolean}
 */
export function isOneMinCGMSampleIntervalDevice(pumpSettingsOrUpload = {}) {
  return isTwiistLoop(pumpSettingsOrUpload);
}

/**
 * Get the uppercased manufacturer name
 * @param {String} manufacturer Manufacturer name
 */
export function getUppercasedManufacturer(manufacturer = '') {
  return _.map(manufacturer.split(' '), part => {
    switch (part) {
      case 'diy':
        return _.upperCase(part);
      case 'twiist':
        return part;
      default:
        return _.upperFirst(part);
    }
  }).join(' ');
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

/**
 * Derive the display label for a device from its deviceId and the upload that owns its
 * current labeling (typically the upload pointed at by the latest pumpSettings, with a
 * newest-upload fallback). Returns the deviceId itself when no upload is available or
 * neither manufacturer/model nor a recognized origin signal is present.
 *
 * @param {String} deviceId
 * @param {Object|null} upload  upload datum or null
 * @returns {String}
 */
export function deriveLabel(deviceId, upload) {
  const dexcomC2CRegex = /^DexcomG\d+_.+$/;

  if (!upload && dexcomC2CRegex.test(deviceId)) return DEXCOM_API_DEVICE_LABEL;

  if (!upload) return deviceId;

  const isContinuous = _.get(upload, 'dataSetType') === 'continuous';
  const deviceManufacturer = _.get(upload, 'deviceManufacturers.0', '');
  const deviceModel = _.get(upload, 'deviceModel', '');
  let label = deviceId;

  if (deviceManufacturer || deviceModel) {
    if (deviceManufacturer === 'Dexcom' && isContinuous) {
      label = DEXCOM_API_DEVICE_LABEL;
    } else if (deviceManufacturer === 'Abbott' && isContinuous) {
      label = t('FreeStyle Libre (from LibreView)');
    } else if (deviceManufacturer === 'Sequel' && isContinuous) {
      label = t('twiist');
    } else {
      label = _.reject([deviceManufacturer, deviceModel], _.isEmpty).join(' ');
    }
  } else if (isTrio(upload)) {
    label = 'Trio';
  }

  if (deviceId.indexOf('tandemCIQ') === 0) label = [label, `(${t('Control-IQ')})`].join(' ');

  return label;
}

/**
 * Get the render-friendly name for a device
 * @param {Object} device a device object from the DataUtil instance "devices" property
 * @returns {String|null} render-friendly name for device or null if unable
 */
export function getDeviceName(device) {
  if (!!device.deviceName && device.deviceName !== 'Unknown') return device.deviceName;

  if (!!device.label) return device.label;

  if (!!device.id) return device.id;

  return null;
}

/**
 * Get a unique list of render-friendly names from a list of devices
 * @param {Array<Object>} deviceList an array of device objects from the DataUtil instance "devices" property
 * @returns {Array<String>} unique array of render-friendly names for each device
 */
export function getDeviceNames(deviceList = []) {
  return _.chain(deviceList)
    .map(d => getDeviceName(d))
    .compact()
    .uniq()
    .value();
}
