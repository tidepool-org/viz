import bows from 'bows';
import crossfilter from 'crossfilter'; // eslint-disable-line import/no-unresolved
import moment from 'moment-timezone';
import _ from 'lodash';
import i18next from 'i18next';
import sundial from 'sundial';

import {
  getLatestPumpUpload,
  getLastManualBasalSchedule,
  isLoop,
  isAutomatedBasalDevice,
  isAutomatedBolusDevice,
  isSettingsOverrideDevice,
  isDIYLoop,
  isTidepoolLoop,
} from './device';

import {
  hasExtended,
  isAutomated,
  isCorrection,
  isInterruptedBolus,
  isOverride,
  isUnderride,
} from './bolus';

import { convertToMGDL } from './bloodglucose';

import {
  BGM_DATA_KEY,
  CGM_DATA_KEY,
  DEFAULT_BG_BOUNDS,
  DIABETES_DATA_TYPES,
  MS_IN_DAY,
  MS_IN_HOUR,
  MS_IN_MIN,
  MGDL_UNITS,
  DIY_LOOP,
  TIDEPOOL_LOOP,
} from './constants';

import {
  getMsPer24,
  getOffset,
  getTimezoneFromTimePrefs,
} from './datetime';


import StatUtil from './StatUtil';
import AggregationUtil from './AggregationUtil';
import { statFetchMethods } from './stat';
import SchemaValidator from './validation/schema';

const t = i18next.t.bind(i18next);

/* global __DEV__ */

export class DataUtil {
  /**
   * @param {Array} data Raw Tidepool data
   */
  constructor(Validator = SchemaValidator) {
    this.log = bows('DataUtil');

    /* eslint-disable no-console */
    this.startTimer = __DEV__ ? name => console.time(name) : _.noop;
    this.endTimer = __DEV__ ? name => console.timeEnd(name) : _.noop;
    /* eslint-enable no-console */

    this.validator = Validator;
    this.init();
  }

  init = () => {
    this.startTimer('init total');
    this.data = crossfilter([]);
    this.queryDataCount = 0;

    this.buildDimensions();
    this.buildFilters();
    this.buildSorts();
    this.initFilterChangeHandler();
    this.endTimer('init total');
  };

  addData = (rawData = [], patientId, returnData = false) => {
    this.startTimer('addData');

    this.bolusDatumsByIdMap = this.bolusDatumsByIdMap || {};
    this.bolusToWizardIdMap = this.bolusToWizardIdMap || {};
    this.deviceUploadMap = this.deviceUploadMap || {};
    this.latestDatumByType = this.latestDatumByType || {};
    this.pumpSettingsDatumsByIdMap = this.pumpSettingsDatumsByIdMap || {};
    this.wizardDatumsByIdMap = this.wizardDatumsByIdMap || {};
    this.wizardToBolusIdMap = this.wizardToBolusIdMap || {};
    this.bolusDosingDecisionDatumsByIdMap = this.bolusDosingDecisionDatumsByIdMap || {};
    this.matchedDevices = this.matchedDevices || {};

    if (_.isEmpty(rawData) || !patientId) return {};

    // First, we check to see if we already have data for a different patient stored. If so, we
    // clear all data so that we never mix patient data.
    if (this.patientId && this.patientId !== patientId) {
      this.removeData();
    }
    this.patientId = patientId;

    // We first clone the raw data so we don't mutate it at the source
    this.startTimer('cloneRawData');
    const data = _.cloneDeep(rawData);
    this.endTimer('cloneRawData');

    this.startTimer('normalizeDataIn');
    _.each(data, this.normalizeDatumIn);
    this.endTimer('normalizeDataIn');

    // Join wizard and bolus datums
    this.startTimer('joinWizardAndBolus');
    _.each(data, this.joinWizardAndBolus);
    this.endTimer('joinWizardAndBolus');

    // Join bolus and dosingDecision datums
    this.startTimer('joinBolusAndDosingDecision');
    _.each(data, this.joinBolusAndDosingDecision);
    this.endTimer('joinBolusAndDosingDecision');

    // Filter out any data that failed validation, and and duplicates by `id`
    this.startTimer('filterValidData');
    this.clearFilters();
    const validData = _.uniqBy(data, 'id');
    const rejectedData = _.remove(validData, d => d.reject || this.filter.byId(d.id).top(1).length);
    this.endTimer('filterValidData');

    this.startTimer('tagData');
    _.each(validData, this.tagDatum);
    this.endTimer('tagData');

    this.startTimer('addValidData');
    this.data.add(validData);
    this.endTimer('addValidData');

    this.log('validData', validData.length, 'of', data.length);
    if (rejectedData.length) this.log('rejectedData', rejectedData);

    this.setMetaData();
    this.endTimer('addData');

    const result = {
      metaData: this.getMetaData([
        'bgSources',
        'latestDatumByType',
        'latestPumpUpload',
        'latestTimeZone',
        'patientId',
        'size',
        'queryDataCount',
      ]),
    };

    if (returnData) {
      _.each(validData, d => this.normalizeDatumOut(d, '*'));
      result.data = validData;
    }

    return result;
  };

  /* eslint-disable no-param-reassign */
  normalizeDatumIn = d => {
    // Pre-process datums by type
    if (d.type === 'basal') {
      if (!d.rate && d.deliveryType === 'suspend') {
        d.rate = 0.0;
      }

      if (d.suppressed) {
        this.normalizeSuppressedBasal(d);
      }

      // Prevent ongoing basals with unknown durations from extending into the future
      if (_.isFinite(d.duration) && _.includes(_.map(d.annotations, 'code'), 'basal/unknown-duration')) {
        const currentTime = Date.parse(moment.utc().toISOString());
        const maxDuration = currentTime - Date.parse(d.time);
        d.duration = _.min([d.duration, maxDuration]);
        if (_.isFinite(d.suppressed?.duration)) d.suppressed.duration = d.duration;
      }
    }

    if (d.type === 'upload' && d.dataSetType === 'continuous') {
      if (!d.time) d.time = moment.utc().toISOString();
    }

    if (d.messagetext) {
      d.type = 'message';
      d.messageText = d.messagetext;
      d.parentMessage = d.parentmessage || null;
      d.time = d.timestamp;
    }

    // We validate datums before converting the time and deviceTime to hammerTime integers,
    // as we want to validate that they are valid ISO date strings
    this.validateDatumIn(d);
    if (d.reject) return;

    // Convert the time and deviceTime properties to hammertime,
    // which improves dimension filtering performance significantly over using ISO strings.
    // We store the original time strings, with labels prefaced with underscores, however,
    // for easier reference when debugging.
    /* eslint-disable no-underscore-dangle */
    d._time = d.time;
    d._deviceTime = d.deviceTime || d.time;
    /* eslint-enable no-underscore-dangle */
    d.time = Date.parse(d.time);
    d.deviceTime = d.deviceTime ? Date.parse(d.deviceTime) : d.time;

    // Generate a map of latest datums by type
    if (d.time > _.get(this.latestDatumByType, [d.type, 'time'], 0)) this.latestDatumByType[d.type] = d;

    // Also add timeChange deviceEvents to latest datums map to help determine a recommended timezone
    if (d.type === 'deviceEvent' && d.subType === 'timeChange') {
      if (d.time > _.get(this.latestDatumByType, ['timeChange', 'time'], 0)) this.latestDatumByType.timeChange = d;
    }

    // Populate mappings to be used for 2-way join of boluses and wizards
    if (d.type === 'wizard' && _.isString(d.bolus)) {
      this.wizardDatumsByIdMap[d.id] = d;
      this.bolusToWizardIdMap[d.bolus] = d.id;
      this.wizardToBolusIdMap[d.id] = d.bolus;
    }

    // Populate mappings to be used for 2-way join of boluses and dosing decisions
    if (d.type === 'dosingDecision' && _.includes(['normalBolus', 'simpleBolus', 'watchBolus'], d.reason)) {
      this.bolusDosingDecisionDatumsByIdMap[d.id] = d;
    }

    if (d.type === 'bolus') {
      this.bolusDatumsByIdMap[d.id] = d;
    }

    if (d.type === 'pumpSettings') {
      this.pumpSettingsDatumsByIdMap[d.id] = d;
    }

    // Generate a map of devices by deviceId
    if (!d.deviceId && _.get(d, 'origin.name') === 'com.apple.HealthKit') {
      const HKdeviceId = ['HealthKit'];
      if (_.get(d, 'origin.payload.sourceRevision.source.name')) {
        HKdeviceId.push(_.get(d, 'origin.payload.sourceRevision.source.name'));
      }
      HKdeviceId.push(d.uploadId.slice(0, 6));
      d.deviceId = HKdeviceId.join(' ');
    }
    if (!d.deviceId && _.get(d, 'payload.transmitterId', false)) {
      const dexDeviceId = ['Dexcom', d.uploadId.slice(0, 6)];
      d.deviceId = dexDeviceId.join(' ');
    }
    if (d.deviceId && !this.deviceUploadMap[d.deviceId]) {
      this.deviceUploadMap[d.deviceId] = d.uploadId;
    }
  };

  joinWizardAndBolus = d => {
    if (_.includes(['bolus', 'wizard'], d.type)) {
      const isWizard = d.type === 'wizard';
      const fieldToPopulate = isWizard ? 'bolus' : 'wizard';
      const idMap = isWizard ? this.wizardToBolusIdMap : this.bolusToWizardIdMap;
      const datumMap = isWizard ? this.bolusDatumsByIdMap : this.wizardDatumsByIdMap;

      if (idMap[d.id]) {
        const datumToPopulate = _.omit(datumMap[idMap[d.id]], d.type);

        if (isWizard && d.uploadId !== datumToPopulate.uploadId) {
          // Due to an issue stemming from a fix for wizard datums in Uploader >= v2.35.0, we have a
          // possibility of duplicates of older wizard datums from previous uploads. The boluses and
          // corrected wizards should both reference the same uploadId, so we can safely reject
          // wizards that don't reference the same upload as the bolus it's referencing.
          d.reject = true;
          d.rejectReason = ['Upload ID does not match referenced bolus'];
        } else {
          d[fieldToPopulate] = datumToPopulate;
        }
      }
    }
  };

  joinBolusAndDosingDecision = d => {
    if (d.type === 'bolus' && isLoop(d)) {
      const timeThreshold = MS_IN_MIN;

      const proximateDosingDecisions = _.filter(
        _.mapValues(this.bolusDosingDecisionDatumsByIdMap),
        ({ time }) => {
          const timeOffset = Math.abs(time - d.time);
          return timeOffset <= timeThreshold;
        }
      );

      const sortedProximateDosingDecisions = _.orderBy(proximateDosingDecisions, ({ time }) => Math.abs(time - d.time), 'asc');
      const dosingDecisionWithMatchingNormal = _.find(sortedProximateDosingDecisions, dosingDecision => dosingDecision.requestedBolus?.amount === d.normal);
      d.dosingDecision = dosingDecisionWithMatchingNormal || sortedProximateDosingDecisions[0];

      if (d.dosingDecision) {
        // attach associated pump settings to dosingDecisions
        const associatedPumpSettingsId = _.find(d.dosingDecision.associations, { reason: 'pumpSettings' })?.id;
        d.dosingDecision.pumpSettings = this.pumpSettingsDatumsByIdMap[associatedPumpSettingsId];

        // Translate relevant dosing decision data onto expected bolus fields
        d.expectedNormal = d.dosingDecision.requestedBolus?.amount;
        d.carbInput = d.dosingDecision.food?.nutrition?.carbohydrate?.net;
        d.bgInput = _.last(d.dosingDecision.bgHistorical || [])?.value;
        d.insulinOnBoard = d.dosingDecision.insulinOnBoard?.amount;
      }
    }
  };

  /**
   * Medtronic 5 and 7 series (which always have a deviceId starting with 'MedT-') carb exchange
   * data is converted to carbs at a rounded 1:15 ratio in the uploader, and needs to be
   * de-converted back into exchanges.
   */
  needsCarbToExchangeConversion = d => {
    const annotations = _.get(d, 'annotations', []);

    return (d.deviceId && d.deviceId.indexOf('MedT-') === 0)
      && d.carbUnits === 'exchanges'
      && _.isFinite(d.carbInput)
      && _.findIndex(annotations, { code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted' }) === -1;
  };

  /**
   * When deconverting the carbs to exchanges, we use a 15:1 ratio, and round to the nearest 0.5,
   * since that is the increment used when entering exchange values in the pump
   */
  getDeconvertedCarbExchange = d => {
    const deconvertedCarbInput = d.carbInput / 15;
    const increment = 0.5;
    const inverse = 1 / increment;
    return Math.round(deconvertedCarbInput * inverse) / inverse;
  };

  tagDatum = d => {
    if (d.type === 'basal') {
      d.tags = {
        suspend: d.deliveryType === 'suspend',
        temp: d.deliveryType === 'temp',
      };
    }

    if (d.type === 'bolus') {
      const isWizardOrDosingDecision = d.wizard || d.dosingDecision?.food?.nutrition?.carbohydrate?.net;

      d.tags = {
        automated: isAutomated(d),
        correction: isCorrection(d),
        extended: hasExtended(d),
        interrupted: isInterruptedBolus(d),
        manual: !isWizardOrDosingDecision && !isAutomated(d),
        override: isOverride(d),
        underride: isUnderride(d),
        wizard: !!isWizardOrDosingDecision,
      };
    }

    if (d.type === 'smbg') {
      d.tags = {
        manual: d.subType === 'manual',
        meter: d.subType !== 'manual',
      };
    }

    if (d.type === 'deviceEvent') {
      d.tags = {
        automatedSuspend: (
          d.subType === 'status'
          && d.status === 'suspended'
          && d.reason?.suspended === 'automatic'
          && d.payload?.suspended?.reason === 'Auto suspend by PLGS'
        ),
        calibration: d.subType === 'calibration',
        reservoirChange: d.subType === 'reservoirChange',
        cannulaPrime: d.subType === 'prime' && d.primeTarget === 'cannula',
        tubingPrime: d.subType === 'prime' && d.primeTarget === 'tubing',
      };
    }
  };

  validateDatumIn = d => {
    let validator = this.validator[d.type] || this.validator.common;
    if (_.isFunction(validator)) validator = { validator };

    // Run all validators and store the results in an array
    const validateResult = [];
    _.each(_.values(validator), (validationMethod, i) => {
      // only run validationMethod if it's the first or previous validations have all failed
      if (i === 0 || validateResult.indexOf(true) === -1) {
        validateResult.push(validationMethod(d));
      }
    });

    // Reject datum if none of the validators pass
    if (validateResult.indexOf(true) === -1) {
      d.reject = true;
      d.rejectReason = validateResult;
    }
  };

  normalizeDatumOut = (d, fields = []) => {
    if (this.returnRawData) {
      /* eslint-disable no-underscore-dangle */
      if (d._time) {
        d.time = d._time;
        delete d._time;
      }

      if (d._deviceTime) {
        d.deviceTime = d._deviceTime;
        delete d._deviceTime;
      }

      delete d.tags;

      if (_.includes(['bolus', 'wizard'], d.type)) {
        const isWizard = d.type === 'wizard';
        const fieldToRestore = isWizard ? 'bolus' : 'wizard';
        if (_.get(d, [fieldToRestore, 'id'])) d[fieldToRestore] = d[fieldToRestore].id;
      }

      if (d.type === 'message') {
        delete d.type;
        delete d.messageText;
        delete d.parentMessage;
        delete d.time;
      }

      return;
      /* eslint-enable no-underscore-dangle */
    }

    const { timezoneName } = this.timePrefs || {};
    const normalizeAllFields = fields[0] === '*';

    // Normal time post-processing
    this.normalizeDatumOutTime(d, fields);

    // Add source and serial number metadata
    if (d.uploadId && (normalizeAllFields || _.includes(fields, 'deviceSerialNumber'))) {
      d.deviceSerialNumber = _.get(this.uploadMap, [d.uploadId, 'deviceSerialNumber']);
    }
    if (!d.source) d.source = _.get(this.uploadMap, [d.uploadId, 'source'], 'Unspecified Data Source');

    // Additional post-processing by type
    if (d.type === 'basal') {
      d.normalEnd = d.normalTime + d.duration;
      d.subType = d.deliveryType;

      // Annotate any incomplete suspends
      if (normalizeAllFields || _.includes(fields, 'annotations')) {
        const intersectsIncompleteSuspend = _.some(
          this.incompleteSuspends,
          suspend => {
            const suspendStart = suspend[this.activeTimeField];
            return d.normalTime <= suspendStart && suspendStart <= d.normalEnd;
          }
        );

        if (intersectsIncompleteSuspend) {
          d.annotations = d.annotations || [];
          d.annotations.push({ code: 'basal/intersects-incomplete-suspend' });
          this.log('intersectsIncompleteSuspend', d.id);
        }
      }

      // Recurse as needed for suppressed basals
      if (d.suppressed && (normalizeAllFields || _.includes(fields, 'suppressed'))) this.normalizeDatumOut(d.suppressed, fields);
    }

    if (d.type === 'cbg' || d.type === 'smbg') {
      this.normalizeDatumBgUnits(d);

      if (normalizeAllFields || _.includes(fields, 'msPer24')) {
        d.msPer24 = getMsPer24(d.normalTime, timezoneName);
      }

      if (normalizeAllFields || _.includes(fields, 'localDate')) {
        d.localDate = moment.utc(d[this.activeTimeField]).tz(timezoneName || 'UTC').format('YYYY-MM-DD');
      }
    }

    if (d.type === 'pumpSettings') {
      this.normalizeDatumBgUnits(d, [], ['bgSafetyLimit']);
      this.normalizeDatumBgUnits(d, ['bgTarget', 'bgTargets'], ['target', 'range', 'low', 'high']);
      this.normalizeDatumBgUnits(d, ['bgTargetPreprandial', 'bgTargetPhysicalActivity'], ['low', 'high']);
      this.normalizeDatumBgUnits(d, ['insulinSensitivity', 'insulinSensitivities'], ['amount']);
      // Set basalSchedules object to an array sorted by name: 'standard' first, then alphabetical
      if (normalizeAllFields || _.includes(fields, 'basalSchedules')) {
        d.basalSchedules = _.flatten(_.partition(
          _.sortBy(_.map(d.basalSchedules, (value, name) => ({ name, value })), 'name'),
          ({ name }) => (name === 'standard')
        ));
      }
    }

    if (d.type === 'wizard') {
      this.normalizeDatumBgUnits(d, [], ['bgInput']);
      this.normalizeDatumBgUnits(d, ['bgTarget'], ['target', 'range', 'low', 'high']);
      this.normalizeDatumBgUnits(d, [], ['insulinSensitivity']);

      if (_.isObject(d.bolus)) this.normalizeDatumOut(d.bolus, fields);

      if (this.needsCarbToExchangeConversion(d)) {
        d.carbInput = this.getDeconvertedCarbExchange(d);
        d.insulinCarbRatio = _.round(15 / d.insulinCarbRatio, 1);
        d.annotations = d.annotations || [];
        d.annotations.push({ code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted' });
      }
    }

    if (d.type === 'dosingDecision') {
      this.normalizeDatumBgUnits(d, ['bgTargetSchedule'], ['low', 'high']);
      this.normalizeDatumBgUnits(d, ['bgForecast'], ['value']);
      this.normalizeDatumBgUnits(d, ['smbg'], ['value']);
      if (_.isObject(d.pumpSettings)) this.normalizeDatumOut(d.pumpSettings, fields);
    }

    if (d.type === 'bolus') {
      this.normalizeDatumBgUnits(d, [], ['bgInput']);
      if (_.isObject(d.wizard)) this.normalizeDatumOut(d.wizard, fields);
      if (_.isObject(d.dosingDecision)) this.normalizeDatumOut(d.dosingDecision, fields);
    }

    if (d.type === 'deviceEvent') {
      this.normalizeDatumBgUnits(d, ['bgTarget'], ['low', 'high']);
      const isOverrideEvent = d.subType === 'pumpSettingsOverride';

      if (_.isFinite(d.duration)) {
        // Loop is reporting these durations in seconds instead of the milliseconds historically
        // used by Tandem.
        // For now, until a fix is present, we'll convert.  Once a fix is present, we will only
        // convert for Loop versions prior to the fix.
        if (isOverrideEvent && isLoop(d)) d.duration = d.duration * 1000;
        d.normalEnd = d.normalTime + d.duration;

        // If the provided duration extends into the future, we truncate the normalEnd to the
        // latest diabetes datum end and recalculate the duration
        const currentTime = Date.parse(moment.utc().toISOString());
        if (d.normalEnd > currentTime) {
          d.normalEnd = this.latestDiabetesDatumEnd;
          d.duration = d.normalEnd - d.normalTime;
        }
      } else if (isOverrideEvent && _.isFinite(this.latestDiabetesDatumEnd)) {
        // Ongoing pump settings overrides will not have a duration with which to determine
        // normalEnd, so we will set it to the latest diabetes datum end.
        d.normalEnd = this.latestDiabetesDatumEnd;
        d.duration = d.normalEnd - d.normalTime;
      }
    }

    if (d.type === 'fill') {
      const localTime = d.normalTime + d.displayOffset * MS_IN_MIN;
      const normalTimeISO = moment.utc(d.normalTime).toISOString();

      d.normalEnd = d.normalTime + d.duration;
      d.msPer24 = getMsPer24(d.normalTime, timezoneName);
      d.hourOfDay = d.msPer24 / MS_IN_HOUR;
      d.fillDate = moment.utc(localTime).toISOString().slice(0, 10);
      d.id = `fill_${normalTimeISO.replace(/[^\w\s]|_/g, '')}`;
    }
  };

  normalizeDatumOutTime = d => {
    const { timezoneName } = this.timePrefs || {};

    if (timezoneName) {
      d.normalTime = d.time;
      d.displayOffset = -getOffset(d.time, timezoneName);
    } else {
      // TimezoneOffset is an optional attribute according to the Tidepool data model
      if (d.timezoneOffset != null && d.conversionOffset != null) {
        d.normalTime = d.time + (d.timezoneOffset * MS_IN_MIN + d.conversionOffset);
      } else {
        d.normalTime = !_.isEmpty(d.deviceTime) ? d.deviceTime : d.time;
      }

      // DisplayOffset always 0 when not timezoneAware
      d.displayOffset = 0;
      if (d.deviceTime && d.normalTime !== d.deviceTime) {
        d.warning = 'Combining `time` and `timezoneOffset` does not yield `deviceTime`.';
      }
    }
  };

  normalizeDatumBgUnits = (d, keysPaths = [], keys = ['value']) => {
    const units = _.get(this.bgPrefs, 'bgUnits');

    if (units && d.units) {
      d.units = _.isPlainObject(d.units) ? {
        ...d.units,
        bg: units,
      } : units;
    }

    // BG units are always stored in mmol/L in the backend, so we only need to convert to mg/dL
    if (units === MGDL_UNITS) {
      if (d.units) {
        d.units = _.isPlainObject(d.units) ? {
          ...d.units,
          bg: MGDL_UNITS,
        } : MGDL_UNITS;
      }

      const normalizeAtPath = path => {
        const pathValue = path ? _.get(d, path) : d;

        if (_.isPlainObject(pathValue) && _.keys(pathValue).length) {
          _.each(keys, (key) => {
            if (_.isNumber(pathValue[key])) {
              const setPath = _.reject([path, key], _.isEmpty);
              // in some cases, a path could be converted more than once, especially if a dosing decision
              // was shared with multple boluses due to proximity. We need to track which paths have
              // already been converted so we don't do it multiple times.
              if (d.bgNormalized?.[setPath.join('|')]) return;
              _.set(d, setPath, convertToMGDL(pathValue[key]));

              d.bgNormalized = {
                ...(d.bgNormalized || {}),
                [setPath.join('|')]: true,
              };
            } else if (path && _.isPlainObject(pathValue)) {
              // We sometimes need match the specified field keys within unknown object paths,
              // such as within Tandem pumpSettings datums, where the keys we want to target for
              // conversion are nested under object keys that match the user-provided schedule names
              // In these cases, we expect that a keyPath will be provided (via the `path` argumement),
              // which prevents accidentally changing the units of unintended paths.
              _.each(_.keys(pathValue), nestedKey => {
                let nestedValue = _.get(pathValue, [nestedKey]);

                if (_.isArray(nestedValue) || _.isPlainObject(nestedValue)) {
                  // Wrap plain objects in array to be able to handle them the same as collections
                  if (_.isPlainObject(nestedValue)) nestedValue = [nestedValue];

                  // Check each collection item for matches that need conversion
                  _.each(nestedValue, value => {
                    if (_.get(value, [key])) {
                      // we only recurse when a nested path object contains a matching key
                      this.normalizeDatumBgUnits(value, [], [key]);
                    }
                  });
                }
              });
            }
          });
        } else if (_.isArray(pathValue)) {
          _.each(pathValue, (item) => {
            this.normalizeDatumBgUnits(item, [], keys);
          });
        }
      };

      if (keysPaths.length) {
        _.each(keysPaths, normalizeAtPath);
      } else {
        normalizeAtPath();
      }
    }
  };

  normalizeSuppressedBasal = d => {
    if (d.suppressed.deliveryType === 'temp' && !d.suppressed.rate) {
      if (d.suppressed.percent && d.suppressed.suppressed &&
        d.suppressed.suppressed.deliveryType === 'scheduled' &&
        d.suppressed.suppressed.rate >= 0) {
        d.suppressed.rate = d.suppressed.percent * d.suppressed.suppressed.rate;
      }
    }

    // A suppressed should share these attributes with its parent
    d.suppressed.duration = d.duration;
    d.suppressed.time = Date.parse(d.time);
    if (d.deviceTime) d.suppressed.deviceTime = Date.parse(d.deviceTime);

    // Recurse as needed
    if (d.suppressed.suppressed) {
      this.normalizeSuppressedBasal(d.suppressed);
    }
  };
  /* eslint-enable no-param-reassign */

  /* eslint-disable no-param-reassign */
  removeData = (predicate = null) => {
    if (predicate) {
      this.log('Removing data where', predicate);
      if (_.isPlainObject(predicate)) predicate = _.matches(predicate);
      this.clearFilters();
      this.data.remove(predicate);
    } else {
      this.log('Reinitializing');
      this.bolusToWizardIdMap = {};
      this.bolusDatumsByIdMap = {};
      this.wizardDatumsByIdMap = {};
      this.latestDatumByType = {};
      this.deviceUploadMap = {};
      this.clearMatchedDevices();
      delete this.bgSources;
      delete this.bgPrefs;
      delete this.timePrefs;
      delete this.latestPumpUpload;
      delete this.devices;
      delete this.excludedDevices;
      this.init();
    }
  };
  /* eslint-enable no-param-reassign */

  updateDatum = updatedDatum => {
    this.log('Updating Datum', updatedDatum);
    this.clearFilters();

    const existingDatum = this.filter.byId(updatedDatum.id).top(1)[0];
    const updateDatumClone = _.cloneDeep(updatedDatum);

    // Attempt to update existing datum with normalized and validated update datum
    this.normalizeDatumIn(updateDatumClone);
    if (existingDatum && !updateDatumClone.reject) _.assign(existingDatum, updateDatumClone);

    // Reset the byId filter
    this.dimension.byId.filterAll();

    // Update the byTime dimension in case the time field was changed
    this.buildByTimeDimension();

    const resultingDatum = _.cloneDeep(existingDatum);
    this.normalizeDatumOut(resultingDatum, '*');

    return {
      datum: resultingDatum,
    };
  };

  buildByDayOfWeekDimension = () => {
    this.dimension.byDayOfWeek = this.data.dimension(
      d => moment.utc(d[this.activeTimeField || 'time']).tz(_.get(this, 'timePrefs.timezoneName', 'UTC')).day()
    );
  };

  buildByDateDimension = () => {
    this.dimension.byDate = this.data.dimension(
      d => moment.utc(d[this.activeTimeField || 'time']).tz(_.get(this, 'timePrefs.timezoneName', 'UTC')).format('YYYY-MM-DD')
    );
  };

  buildByIdDimension = () => {
    this.dimension.byId = this.data.dimension(d => d.id);
  };

  buildBySubTypeDimension = () => {
    this.dimension.bySubType = this.data.dimension(d => d.subType || '');
  };

  buildByTimeDimension = () => {
    this.dimension.byTime = this.data.dimension(d => d[this.activeTimeField || 'time']);
  };

  buildByTypeDimension = () => {
    this.dimension.byType = this.data.dimension(d => d.type);
  };

  buildByDeviceIdDimension = () => {
    this.dimension.byDeviceId = this.data.dimension(d => d.deviceId || '');
  };

  // N.B. May need to become smarter about creating and removing dimensions if we get above 8,
  // which would introduce additional performance overhead as per crossfilter docs.
  buildDimensions = () => {
    this.startTimer('buildDimensions');
    this.dimension = {};
    this.buildByDayOfWeekDimension();
    this.buildByDateDimension();
    this.buildByIdDimension();
    this.buildBySubTypeDimension();
    this.buildByTimeDimension();
    this.buildByTypeDimension();
    this.buildByDeviceIdDimension();
    this.endTimer('buildDimensions');
  };

  buildFilters = () => {
    this.startTimer('buildFilters');
    this.filter = {};

    this.filter.byActiveDays = activeDays => this.dimension.byDayOfWeek
      .filterFunction(d => _.includes(activeDays, d));

    this.filter.byEndpoints = endpoints => this.dimension.byTime.filterRange(endpoints);

    this.filter.byType = type => {
      this.activeType = type;
      return this.dimension.byType.filterExact(type);
    };

    this.filter.byTypes = (types = []) => {
      delete this.activeType;
      return this.dimension.byType.filterFunction(type => _.includes(types, type));
    };

    this.filter.bySubType = subType => {
      this.activeSubType = subType;
      return this.dimension.bySubType.filterExact(subType);
    };

    this.filter.byDeviceIds = (excludedDeviceIds = []) => this.dimension.byDeviceId.filterFunction(deviceId => !_.includes(excludedDeviceIds, deviceId));

    this.filter.byId = id => this.dimension.byId.filterExact(id);
    this.endTimer('buildFilters');
  };

  buildSorts = () => {
    this.startTimer('buildSorts');
    this.sort = {};
    this.sort.byTime = array => {
      const timeField = _.get(this, 'timePrefs.timezoneAware') ? 'time' : 'deviceTime';
      return array.sort((a, b) => a[timeField] - b[timeField]);
    };
    this.endTimer('buildSorts');
  };

  initFilterChangeHandler = () => {
    this.data.onChange(eventType => {
      if (eventType === 'filtered' && this.matchDevices) {
        if (_.includes([
          'basal',
          'bolus',
          'smbg',
          'cbg',
          'wizard',
          'food',
        ], this.dimension.byType.currentFilter())) {
          _.each(this.dimension.byDeviceId.top(Infinity), ({ deviceId }) => {
            if (deviceId && !this.matchedDevices[deviceId]) this.matchedDevices[deviceId] = true;
          });
        }
      }
    });
  };

  clearFilters = () => {
    this.startTimer('clearFilters');
    this.dimension.byTime.filterAll();
    this.dimension.byType.filterAll();
    this.dimension.bySubType.filterAll();
    this.dimension.byId.filterAll();
    this.dimension.byDayOfWeek.filterAll();
    this.dimension.byDeviceId.filterAll();
    this.endTimer('clearFilters');
  };

  setBgSources = current => {
    this.startTimer('setBgSources');
    this.clearFilters();

    const bgSources = {
      cbg: this.filter.byType(CGM_DATA_KEY).top(Infinity).length > 0,
      smbg: this.filter.byType(BGM_DATA_KEY).top(Infinity).length > 0,
      current: _.includes([CGM_DATA_KEY, BGM_DATA_KEY], current) ? current : undefined,
    };

    if (!bgSources.current) {
      if (_.get(this, 'bgSources.current')) {
        bgSources.current = this.bgSources.current;
      } else if (bgSources.cbg) {
        bgSources.current = CGM_DATA_KEY;
      } else if (bgSources.smbg) {
        bgSources.current = BGM_DATA_KEY;
      }
    }

    this.bgSources = bgSources;
    this.endTimer('setBgSources');
  };

  setLatestPumpUpload = () => {
    this.startTimer('setLatestPumpUpload');
    this.clearFilters();

    const uploadData = this.sort.byTime(this.filter.byType('upload').top(Infinity));
    const latestPumpUpload = _.cloneDeep(getLatestPumpUpload(uploadData));

    if (latestPumpUpload) {
      const latestUploadSource = _.get(this.uploadMap[latestPumpUpload.uploadId], 'source', '').toLowerCase();
      const manufacturer = latestUploadSource === 'carelink' ? 'medtronic' : latestUploadSource;
      const deviceModel = _.get(latestPumpUpload, 'deviceModel', '');

      const latestPumpSettings = _.cloneDeep(this.latestDatumByType.pumpSettings);
      const pumpIsAutomatedBasalDevice = isAutomatedBasalDevice(manufacturer, latestPumpSettings, deviceModel);
      const pumpIsAutomatedBolusDevice = isAutomatedBolusDevice(manufacturer, latestPumpSettings);
      const pumpIsSettingsOverrideDevice = isSettingsOverrideDevice(manufacturer, latestPumpSettings);

      if (latestPumpSettings && pumpIsAutomatedBasalDevice) {
        const basalData = this.sort.byTime(this.filter.byType('basal').top(Infinity));
        latestPumpSettings.lastManualBasalSchedule = getLastManualBasalSchedule(basalData);
      }

      this.latestPumpUpload = {
        deviceModel,
        isAutomatedBasalDevice: pumpIsAutomatedBasalDevice,
        isAutomatedBolusDevice: pumpIsAutomatedBolusDevice,
        isSettingsOverrideDevice: pumpIsSettingsOverrideDevice,
        manufacturer,
        settings: latestPumpSettings,
      };
    }
    this.endTimer('setLatestPumpUpload');
  };

  setUploadMap = () => {
    this.startTimer('setUploadMap');
    this.clearFilters();
    const uploadData = this.filter.byType('upload').top(Infinity);
    const pumpSettingsData = this.filter.byType('pumpSettings').top(Infinity);
    this.uploadMap = {};

    _.each(uploadData, upload => {
      const pumpSettings = _.find(pumpSettingsData, { uploadId: upload.uploadId });
      let source = 'Unknown';

      if (_.get(upload, 'source')) {
        source = upload.source;
      } else if (_.isArray(upload.deviceManufacturers) && !_.isEmpty(upload.deviceManufacturers)) {
        // Uploader does not specify `source` for CareLink uploads, so they incorrectly get set to
        // `Medtronic`, which should only be used for Medtronic Direct uploads. Check if
        // manufacturer equals Medtronic, then check pumpSettings array for uploads with that upload
        // ID and a source of `carelink`, then override appropriately.
        if (upload.deviceManufacturers[0] === 'Medtronic' && _.filter(pumpSettingsData, {
          uploadId: upload.uploadId,
          source: 'carelink',
        }).length) {
          source = 'carelink';
        } else {
          source = upload.deviceManufacturers[0];
        }
      } else if (isTidepoolLoop(pumpSettings)) {
        source = TIDEPOOL_LOOP.toLowerCase();
      } else if (isDIYLoop(pumpSettings)) {
        source = DIY_LOOP.toLowerCase();
      }

      this.uploadMap[upload.uploadId] = {
        source,
        deviceSerialNumber: upload.deviceSerialNumber || upload.serialNumber || 'Unknown',
      };
    });
    this.endTimer('setUploadMap');
  };

  setIncompleteSuspends = () => {
    this.startTimer('setIncompleteSuspends');
    this.clearFilters();
    const deviceEventData = this.sort.byTime(this.filter.byType('deviceEvent').top(Infinity));
    this.incompleteSuspends = _.filter(
      deviceEventData,
      ({ annotations = [] }) => _.find(annotations, { code: 'status/incomplete-tuple' })
    );
    this.endTimer('setIncompleteSuspends');
  };

  setSize = () => {
    this.startTimer('setSize');
    this.size = this.data.size();
    this.endTimer('setSize');
  };

  setLatestDiabetesDatumEnd = () => {
    const latestDiabetesDatum = _.maxBy(
      _.filter(
        _.values(this.latestDatumByType),
        ({ type }) => _.includes(DIABETES_DATA_TYPES, type)
      ),
      d => (d.duration ? d.time + d.duration : d.time)
    );

    this.latestDiabetesDatumEnd = latestDiabetesDatum ? latestDiabetesDatum.time + (latestDiabetesDatum.duration || 0) : null;
  };

  setLatestTimeZone = () => {
    let latestTimeZone;
    const latestUpload = this.latestDatumByType.upload;
    const latestTimeChangeEvent = this.latestDatumByType.timeChange;

    const latestTimeZoneOffsetDatum = _.maxBy(
      _.filter(
        _.values(this.latestDatumByType || {}),
        ({ timezoneOffset, type }) => _.includes([...DIABETES_DATA_TYPES, 'dosingDecision'], type) && _.isFinite(timezoneOffset)
      ),
      'time'
    );

    const createLatestTimeZone = (name, d, type) => {
      try {
        sundial.checkTimezoneName(name);
        const localizedTime = moment.utc(d.time).tz(name).format();
        latestTimeZone = { name, type: d.type, time: d.time };
        latestTimeZone.message = t('Defaulting to display in the timezone of most recent {{type}} at {{localizedTime}}', { localizedTime, type: type || d.type });
      } catch (e) {
        this.log('Invalid latest time zone:', name);
      }
    };

    if (latestTimeZoneOffsetDatum) {
      let { timezone } = latestTimeZoneOffsetDatum;

      if (!timezone) {
        // We calculate the nearest 'Etc/GMT' timezone from the timezone offset of the latest diabetes datum.
        // GMT offsets signs in Etc/GMT timezone names are reversed from the actual offset
        const offsetSign = Math.sign(latestTimeZoneOffsetDatum.timezoneOffset) === -1 ? '+' : '-';
        const offsetDuration = moment.duration(Math.abs(latestTimeZoneOffsetDatum.timezoneOffset), 'minutes');
        let offsetHours = offsetDuration.hours();
        const offsetMinutes = offsetDuration.minutes();
        if (offsetMinutes >= 30) offsetHours += 1;
        timezone = `Etc/GMT${offsetSign}${offsetHours}`;
      }

      createLatestTimeZone(timezone, latestTimeZoneOffsetDatum);

      // If the timeone on the latest upload record at the time of the latest diabetes datum has the
      // same UTC offset, we use that, since it will also have DST changeover info available.
      // We will also use the latest upload timezone if it's more recent than the diabetes datum.
      if (!_.isEmpty(latestUpload?.timezone)) {
        const uploadTimezoneOffsetAtLatestDiabetesTime = moment.utc(latestTimeZoneOffsetDatum.time).tz(latestUpload.timezone).utcOffset();

        if (
          uploadTimezoneOffsetAtLatestDiabetesTime === latestTimeZoneOffsetDatum.timezoneOffset ||
          latestUpload.time >= latestTimeZoneOffsetDatum.time
        ) {
          createLatestTimeZone(latestUpload.timezone, latestUpload);
        }
      }
    } else if (latestTimeChangeEvent?.to?.timeZoneName) {
      // Tidepool Mobile data only sends timezone info on `timeChange` device events, so for
      // accounts with only TM data, this is our best bet
      createLatestTimeZone(latestTimeChangeEvent.to.timeZoneName, latestTimeChangeEvent, 'time change');
    } else if (!_.isEmpty(latestUpload?.timezone)) {
      // Fallback to latest upload timezone if there is no diabetes data with timezone offsets
      createLatestTimeZone(latestUpload.timezone, latestUpload);
    }

    this.latestTimeZone = latestTimeZone;
  };

  /* eslint-disable no-param-reassign */
  setDevices = () => {
    this.startTimer('setDevices');
    const uploadsById = _.keyBy(this.sort.byTime(this.filter.byType('upload').top(Infinity)), 'uploadId');

    this.devices = _.reduce(this.deviceUploadMap, (result, value, key) => {
      const upload = uploadsById[value];
      let device = { id: key };

      if (upload) {
        const isContinuous = _.get(upload, 'dataSetType') === 'continuous';
        const deviceManufacturer = _.get(upload, 'deviceManufacturers.0', '');
        const deviceModel = _.get(upload, 'deviceModel', '');
        let label = key;

        if (deviceManufacturer || deviceModel) {
          if (deviceManufacturer === 'Dexcom' && isContinuous) {
            label = t('Dexcom API');
          } else if (deviceManufacturer === 'Abbott' && isContinuous) {
            label = t('FreeStyle Libre (from LibreView)');
          } else {
            label = _.reject([deviceManufacturer, deviceModel], _.isEmpty).join(' ');
          }
        }

        if (key.indexOf('tandemCIQ') === 0) label = [label, `(${t('Control-IQ')})`].join(' ');

        device = {
          bgm: _.includes(upload.deviceTags, 'bgm'),
          cgm: _.includes(upload.deviceTags, 'cgm'),
          id: key,
          label,
          pump: _.includes(upload.deviceTags, 'insulin-pump'),
          serialNumber: upload.deviceSerialNumber,
        };
      }

      result.push(device);
      return result;
    }, []);

    const allDeviceIds = _.keys(this.deviceUploadMap);
    const excludedDevices = this.excludedDevices || [];

    _.each(this.devices, device => {
      if (device.id.indexOf('tandemCIQ') === 0) {
        // Exclude pre-control-iq tandem uploads by default if we have data from the same device
        // from a version of uploader supports control-iq data. Otherwise, we have duplicate data.
        const preCIQDeviceID = device.id.replace('tandemCIQ', 'tandem');
        if (_.includes(allDeviceIds, preCIQDeviceID)) excludedDevices.push(preCIQDeviceID);
      }
    });

    this.setExcludedDevices(_.uniq(excludedDevices));

    this.endTimer('setDevices');
  };
  /* eslint-enable no-param-reassign */

  setMetaData = () => {
    this.startTimer('setMetaData');
    this.setSize();
    if (!this.bgPrefs) this.setBgPrefs();
    this.setBgSources();
    if (!this.timePrefs) this.setTimePrefs();
    this.setEndpoints();
    this.setActiveDays();
    this.setTypes();
    this.setUploadMap();
    this.setDevices();
    this.setLatestPumpUpload();
    this.setIncompleteSuspends();
    this.setLatestDiabetesDatumEnd();
    this.setLatestTimeZone();
    this.endTimer('setMetaData');
  };

  setEndpoints = (endpoints, nextDays = 0, prevDays = 0) => {
    this.startTimer('setEndpoints');
    this.endpoints = {
      current: { range: [0, Infinity] },
    };

    if (endpoints) {
      const { timezoneName } = this.timePrefs;
      const days = moment.utc(endpoints[1]).diff(moment.utc(endpoints[0])) / MS_IN_DAY;

      this.endpoints.current = {
        range: _.map(endpoints, e => moment.utc(e).valueOf()),
        days,
        activeDays: days,
      };

      if (nextDays > 0) {
        this.endpoints.next = {
          range: [
            this.endpoints.current.range[1],
            moment.utc(endpoints[1]).add(nextDays, 'days').valueOf(),
          ],
          days: nextDays,
          activeDays: nextDays,
        };

        if (timezoneName) {
          const nextStartIsDST = moment.utc(this.endpoints.next.range[0]).tz(timezoneName).isDST();
          const nextEndIsDST = moment.utc(this.endpoints.next.range[1]).tz(timezoneName).isDST();
          const nextOverlapsDSTChangeover = nextStartIsDST !== nextEndIsDST;

          if (nextOverlapsDSTChangeover) {
            const offset = nextEndIsDST ? -MS_IN_HOUR : MS_IN_HOUR;
            this.endpoints.next.range[1] = this.endpoints.next.range[1] + offset;
          }
        }
      }

      if (prevDays > 0) {
        this.endpoints.prev = {
          range: [
            moment.utc(endpoints[0]).subtract(prevDays, 'days').valueOf(),
            this.endpoints.current.range[0],
          ],
          days: prevDays,
          activeDays: prevDays,
        };

        if (timezoneName) {
          const prevStartIsDST = moment.utc(this.endpoints.prev.range[0]).tz(timezoneName).isDST();
          const prevEndIsDST = moment.utc(this.endpoints.prev.range[1]).tz(timezoneName).isDST();
          const prevOverlapsDSTChangeover = prevStartIsDST !== prevEndIsDST;

          if (prevOverlapsDSTChangeover) {
            const offset = prevStartIsDST ? -MS_IN_HOUR : MS_IN_HOUR;
            this.endpoints.prev.range[0] = this.endpoints.prev.range[0] + offset;
          }
        }
      }
    }
    this.endTimer('setEndpoints');
  };

  setActiveDays = activeDays => {
    this.startTimer('setActiveDays');
    this.activeDays = activeDays || [0, 1, 2, 3, 4, 5, 6];

    _.each(_.keys(this.endpoints), range => {
      if (this.endpoints[range].days) {
        this.log('this.endpoints[range].days', this.endpoints[range].days);
        this.endpoints[range].activeDays = _.filter(
          _.reduce([
            this.endpoints[range].range[0],
            ...(new Array(Math.round(this.endpoints[range].days) - 1)),
          ], (acc, date, index) => {
            let day;
            if (index === 0) {
              day = moment.utc(date).tz(_.get(this, 'timePrefs.timezoneName', 'UTC')).day();
            } else {
              const nextDay = acc[index - 1] + 1;
              day = nextDay > 6 ? nextDay - 7 : nextDay;
            }
            acc.push(day);
            return acc;
          }, []),
          dayOfWeek => _.includes(this.activeDays, dayOfWeek)
        ).length;
      }
    });
    this.endTimer('setActiveDays');
  };

  setStats = (stats = []) => {
    this.stats = _.isString(stats) ? _.map(stats.split(','), _.trim) : stats;
  };

  setTypes = types => {
    this.startTimer('setTypes');
    this.types = _.isArray(types) ? types : [];

    if (_.isPlainObject(types)) {
      this.types = _.map(types, (value, type) => ({
        type,
        ...value,
      }));
    } else if (types === '*') {
      const groupByType = this.dimension.byType.group();

      this.types = _.map(groupByType.all(), group => ({
        type: group.key,
        select: '*',
        sort: `${this.activeTimeField},asc`,
      }));

      groupByType.dispose();
    }

    if (this.types.length) this.queryDataCount += 1;
    this.endTimer('setTypes');
  };

  setTimePrefs = (timePrefs = {}) => {
    this.startTimer('setTimePrefs');
    const {
      timezoneAware = false,
    } = timePrefs;

    let timezoneName = timePrefs.timezoneName || undefined;

    if (timezoneAware) {
      timezoneName = getTimezoneFromTimePrefs(timePrefs);
    }

    const prevTimezoneName = _.get(this, 'timePrefs.timezoneName');
    const timezoneNameChanged = timezoneName !== prevTimezoneName;

    const prevTimezoneAware = _.get(this, 'timePrefs.timezoneAware');
    const timezoneAwareChanged = timezoneAware !== prevTimezoneAware;

    this.timePrefs = {
      timezoneAware,
      timezoneName,
    };

    const prevActiveTimeField = this.activeTimeField;
    this.activeTimeField = timezoneAware ? 'time' : 'deviceTime';
    const activeTimeFieldChanged = this.activeTimeField !== prevActiveTimeField;

    // Recreate the byTime, byDayOfWeek and byDayOfYear dimensions as needed
    // to index on the proper time field.
    const dimensionUpdates = {
      byDate: timezoneNameChanged || timezoneAwareChanged || activeTimeFieldChanged,
      byDayOfWeek: timezoneNameChanged || timezoneAwareChanged || activeTimeFieldChanged,
      byTime: timezoneAwareChanged || activeTimeFieldChanged,
    };

    if (dimensionUpdates.byDate) this.buildByDateDimension();
    if (dimensionUpdates.byDayOfWeek) this.buildByDayOfWeekDimension();
    if (dimensionUpdates.byTime) this.buildByTimeDimension();
    this.endTimer('setTimePrefs');
  };

  setBgPrefs = (bgPrefs = {}) => {
    this.startTimer('setBgPrefs');
    const {
      bgBounds = DEFAULT_BG_BOUNDS[MGDL_UNITS],
      bgClasses = {},
      bgUnits = MGDL_UNITS,
      ...rest
    } = bgPrefs;

    // bgClasses required for legacy tideline charts until we deprecate them
    _.defaults(bgClasses, {
      'very-low': { boundary: DEFAULT_BG_BOUNDS[bgUnits].veryLowThreshold },
      low: { boundary: DEFAULT_BG_BOUNDS[bgUnits].targetLowerBound },
      target: { boundary: DEFAULT_BG_BOUNDS[bgUnits].targetUpperBound },
      high: { boundary: DEFAULT_BG_BOUNDS[bgUnits].veryHighThreshold },
    });

    this.bgPrefs = {
      bgBounds,
      bgClasses,
      bgUnits,
      ...rest,
    };
    this.endTimer('setBgPrefs');
  };

  setReturnRawData = (returnRaw = false) => {
    this.returnRawData = returnRaw;
  };

  setExcludedDevices = (deviceIds = this.excludedDevices) => {
    this.startTimer('setExcludedDevices');
    this.excludedDevices = deviceIds;
    this.endTimer('setExcludedDevices');
  };

  clearMatchedDevices = () => {
    this.matchedDevices = {};
  };

  setExcludedDaysWithoutBolus = (excludeDaysWithoutBolus = false) => {
    this.excludeDaysWithoutBolus = excludeDaysWithoutBolus;
  };

  query = (query = {}) => {
    this.log('Query', query);

    this.startTimer('query total');
    const {
      activeDays,
      aggregationsByDate,
      bgPrefs,
      bgSource,
      endpoints,
      excludeDaysWithoutBolus,
      excludedDevices,
      fillData,
      metaData,
      nextDays,
      prevDays,
      raw,
      stats,
      timePrefs,
      types,
    } = query;

    // N.B. Must ensure that we get the desired endpoints in UTC time so that when we display in
    // the desired time zone, we have all the data.

    // Clear all previous filters
    this.clearFilters();

    // Clear matchedDevices metaData if the current endpoints change
    const activeDaysChanged = activeDays && !_.isEqual(activeDays, this.activeDays);
    const bgSourceChanged = bgSource !== this.bgSources?.current;
    const endpointsChanged = endpoints && !_.isEqual(endpoints, this.endpoints?.current?.range);
    const excludedDevicesChanged = excludedDevices && !_.isEqual(excludedDevices, this.excludedDevices);

    if (activeDaysChanged || bgSourceChanged || endpointsChanged || excludedDevicesChanged) {
      this.clearMatchedDevices();
    }

    this.setReturnRawData(raw);
    this.setBgSources(bgSource);
    this.setTypes(types);
    this.setStats(stats);
    if (bgPrefs) this.setBgPrefs(bgPrefs);
    if (timePrefs) this.setTimePrefs(timePrefs);
    this.setEndpoints(endpoints, nextDays, prevDays);
    this.setActiveDays(activeDays);
    this.setExcludedDevices(excludedDevices);
    this.setExcludedDaysWithoutBolus(excludeDaysWithoutBolus);

    const data = {};

    _.each(this.endpoints, (rangeEndpoints, rangeKey) => {
      this.activeRange = rangeKey;
      this.activeEndpoints = rangeEndpoints;
      this.matchDevices = false;
      data[rangeKey] = {};

      // Filter the data set by date range
      this.filter.byEndpoints(this.activeEndpoints.range);

      // Filter out any inactive days of the week
      this.filter.byActiveDays(this.activeDays);

      // Filter out any excluded devices
      this.filter.byDeviceIds(this.excludedDevices);

      if (rangeKey === 'current') {
        this.matchDevices = true;

        // Generate the aggregations for current range
        if (aggregationsByDate) {
          data[rangeKey].aggregationsByDate = this.getAggregationsByDate(aggregationsByDate);
        }

        if (this.excludeDaysWithoutBolus) {
          // Determine count of days with boluses for current range
          const bolusesByDate = _.get(
            data,
            [rangeKey, 'aggregationsByDate'],
            this.getAggregationsByDate('boluses')
          ).boluses.byDate;

          this.activeEndpoints.bolusDays = _.keys(bolusesByDate).length;
        }

        // Generate the stats for current range
        if (this.stats.length) {
          data[rangeKey].stats = this.getStats(this.stats);
        }
      }

      data[rangeKey].endpoints = this.activeEndpoints;

      // Generate the requested data
      if (this.types.length) {
        data[rangeKey].data = this.getTypeData(this.types);
      }

      // Generate the requested fillData
      if (fillData) {
        data[rangeKey].data = data[rangeKey].data || {};
        data[rangeKey].data.fill = this.getFillData(this.activeEndpoints.range, fillData);
      }
    });
    this.endTimer('query total');

    const result = {
      data,
      timePrefs: this.timePrefs,
      bgPrefs: this.bgPrefs,
      query,
    };

    if (metaData) result.metaData = this.getMetaData(metaData);

    // Always reset `returnRawData` and `matchDevices` to `false` after each query
    this.setReturnRawData(false);
    this.matchDevices = false;

    this.log('Result', result);

    return result;
  };

  getStats = stats => {
    this.startTimer('generate stats');
    const generatedStats = {};

    this.statUtil = new StatUtil(this);
    _.each(stats, stat => {
      const method = statFetchMethods[stat];

      if (_.isFunction(this.statUtil[method])) {
        this.startTimer(`stat | ${stat}`);
        generatedStats[stat] = this.statUtil[method]();
        this.endTimer(`stat | ${stat}`);
      }
    });
    delete this.statUtil;
    this.endTimer('generate stats');
    return generatedStats;
  };

  getAggregationsByDate = aggregationsByDate => {
    this.startTimer('generate aggregationsByDate');
    const selectedAggregationsByDate = _.isString(aggregationsByDate) ? _.map(aggregationsByDate.split(','), _.trim) : aggregationsByDate;
    const generatedAggregationsByDate = {};
    const groupByDate = this.dimension.byDate.group();

    const aggregationMethods = {
      basals: 'aggregateBasals',
      boluses: 'aggregateBoluses',
      fingersticks: 'aggregateFingersticks',
      siteChanges: 'aggregateSiteChanges',
      dataByDate: 'aggregateDataByDate',
      statsByDate: 'aggregateStatsByDate',
    };

    this.aggregationUtil = new AggregationUtil(this);

    _.each(selectedAggregationsByDate, aggregationType => {
      const method = aggregationMethods[aggregationType];

      if (_.isFunction(this.aggregationUtil[method])) {
        this.startTimer(`aggregation | ${aggregationType}`);
        generatedAggregationsByDate[aggregationType] = this.aggregationUtil[method](groupByDate);
        this.endTimer(`aggregation | ${aggregationType}`);
      }
    });

    groupByDate.dispose();
    delete this.aggregationUtil;

    this.endTimer('generate aggregationsByDate');
    return generatedAggregationsByDate;
  };

  getFillData = (endpoints, opts = {}) => {
    this.startTimer('generate fillData');
    const timezone = _.get(this, 'timePrefs.timezoneName', 'UTC');
    const days = this.activeEndpoints.days;
    const fillHours = 3;
    const fillBinCount = (24 / fillHours) * days;
    const duration = fillHours * MS_IN_HOUR;

    const start = moment.utc(endpoints[0]).tz(timezone).startOf('day').valueOf();

    const hourlyStarts = [start];
    for (let index = 1; index < 24 * days; index++) {
      hourlyStarts.push(hourlyStarts[index - 1] + MS_IN_HOUR);
    }

    const fillData = [];
    let prevFill = null;

    _.each(hourlyStarts, startTime => {
      const fill = {
        duration,
        time: startTime,
        type: 'fill',
      };
      this.normalizeDatumOut(fill);

      if (fill.hourOfDay % fillHours === 0) {
        if (opts.adjustForDSTChanges) {
          if (prevFill && fill.normalTime !== prevFill.normalEnd) {
            if (fill.normalTime > prevFill.normalEnd) {
              // Adjust for Fall Back gap
              prevFill.normalEnd = fill.normalTime;
            } else if (fill.normalTime < prevFill.normalEnd) {
              // Adjust for Spring Forward overlap
              prevFill.normalEnd = fill.normalTime;
            }

            fillData.splice(-1, 1, prevFill);
          }
        }

        if (fillData.length < fillBinCount) fillData.push(fill);
        prevFill = fill;
      }
    });

    this.endTimer('generate fillData');
    return fillData;
  };

  getMetaData = metaData => {
    this.startTimer('generate metaData');
    const allowedMetaData = [
      'bgSources',
      'latestDatumByType',
      'latestPumpUpload',
      'latestTimeZone',
      'patientId',
      'size',
      'devices',
      'excludedDevices',
      'matchedDevices',
      'queryDataCount',
    ];

    const requestedMetaData = _.isString(metaData) ? _.map(metaData.split(','), _.trim) : metaData;

    const selectedMetaData = _.cloneDeep(_.pick(
      this,
      _.intersection(allowedMetaData, requestedMetaData)
    ));

    _.each(selectedMetaData.latestDatumByType, d => this.normalizeDatumOut(d, ['*']));

    if (_.get(selectedMetaData, 'latestPumpUpload.settings')) {
      this.normalizeDatumOut(selectedMetaData.latestPumpUpload.settings, ['*']);
    }

    this.endTimer('generate metaData');
    return selectedMetaData;
  };

  getPreviousSiteChangeDatums = datum => {
    const prevFilters = {
      byType: this.activeType,
      bySubType: this.activeSubType,
    };

    // We need to ensure all the days of the week are active to ensure we get all siteChanges
    this.filter.byActiveDays([0, 1, 2, 3, 4, 5, 6]);

    // Set the endpoints filter catch all previous datums
    this.filter.byEndpoints([
      0,
      datum[this.activeTimeField],
    ]);

    this.filter.byType('deviceEvent');

    // Fetch previous prime and reservoirChange data
    const previousPrimeData = this.sort
      .byTime(_.cloneDeep(this.filter.bySubType('prime').top(Infinity)))
      .reverse();

    const previousReservoirChangeData = this.sort
      .byTime(_.cloneDeep(this.filter.bySubType('reservoirChange').top(Infinity)))
      .reverse();

    const previousSiteChangeDatums = {
      cannulaPrime: _.find(previousPrimeData, { primeTarget: 'cannula' }),
      tubingPrime: _.find(previousPrimeData, { primeTarget: 'tubing' }),
      reservoirChange: previousReservoirChangeData[0],
    };

    // Reset the endpoints, activeDays, type, and subType filters to the back to what they were
    this.filter.byActiveDays(this.activeDays);
    this.filter.byEndpoints(this.activeEndpoints.range);
    this.filter.byType(prevFilters.byType);
    this.filter.bySubType(prevFilters.bySubType);

    return previousSiteChangeDatums;
  };

  getTypeData = types => {
    const generatedData = {};

    _.each(types, ({ type, select = '*', sort = {} }) => {
      const fields = _.isString(select) ? _.map(select.split(','), _.trim) : select;
      const returnAllFields = fields[0] === '*';

      let typeData = _.cloneDeep(this.filter.byType(type).top(Infinity));
      _.each(typeData, d => this.normalizeDatumOut(d, fields));

      // Normalize data
      this.startTimer(`normalize | ${type} | ${this.activeRange}`);
      if (_.includes(['basal', 'deviceEvent'], type)) {
        typeData = this.sort.byTime(typeData);

        const trimOverlappingStart = () => {
          // Normalize the data data and add any datums overlapping the start
          let data = _.cloneDeep(typeData || []);
          if (type === 'deviceEvent') data = _.filter(data, { subType: 'pumpSettingsOverride' });

          const initalDataLength = data.length;

          data = type === 'deviceEvent'
            ? this.addPumpSettingsOverrideOverlappingStart(data, fields)
            : this.addBasalOverlappingStart(data, fields);

          if (data.length > initalDataLength) typeData.unshift(data[0]);

          // Trim the first datum if it overlaps the start
          if (typeData.length && _.isFinite(typeData[0].duration)) {
            typeData[0].normalTime = _.max([
              typeData[0].normalTime,
              this.activeEndpoints.range[0],
            ]);
          }
        };

        const trimOverlappingEnd = () => {
          // Trim last datum if it has a duration that overlaps the range end
          const indexOfLastDurationDatum = _.findLastIndex(typeData, d => _.isFinite(d.duration));
          if (indexOfLastDurationDatum > -1) {
            typeData[indexOfLastDurationDatum].normalEnd = _.min([
              typeData[indexOfLastDurationDatum].normalEnd,
              this.activeEndpoints.range[1],
            ]);
          }
        };

        if (this.activeRange === 'prev') {
          trimOverlappingStart();
        } else if (this.activeRange === 'next') {
          trimOverlappingEnd();
        } else if (this.activeRange === 'current') {
          if (!this.endpoints.prev) trimOverlappingStart();
          if (!this.endpoints.next) trimOverlappingEnd();
        }
      }
      this.endTimer(`normalize | ${type} | ${this.activeRange}`);

      // Sort data
      this.startTimer(`sort | ${type} | ${this.activeRange}`);
      let sortOpts = sort;
      if (_.isString(sortOpts)) {
        const sortArray = _.map(sort.split(','), _.trim);
        sortOpts = {
          field: sortArray[0],
          order: sortArray[1],
        };
      }

      if (sortOpts.field) {
        typeData = _.sortBy(typeData, [sortOpts.field]);
      }

      if (sortOpts.order === 'desc') typeData.reverse();
      this.endTimer(`sort | ${type} | ${this.activeRange}`);

      // Pick selected fields
      this.startTimer(`select fields | ${type} | ${this.activeRange}`);
      if (!returnAllFields) typeData = _.map(typeData, d => _.pick(d, fields));
      this.endTimer(`select fields | ${type} | ${this.activeRange}`);

      generatedData[type] = typeData;
    });

    return generatedData;
  };

  addBasalOverlappingStart = (basalData = [], normalizeFields) => {
    _.each(basalData, d => {
      if (!d.normalTime) this.normalizeDatumOut(d, normalizeFields);
    });

    // We need to ensure all the days of the week are active to ensure we get all basals
    this.filter.byActiveDays([0, 1, 2, 3, 4, 5, 6]);

    // Set the endpoints filter get all previous basal datums
    this.filter.byEndpoints([
      0,
      this.activeEndpoints.range[0],
    ]);

    // Fetch previous basal datum
    const previousBasalDatum = this.sort
      .byTime(this.filter.byType('basal').top(Infinity))
      .reverse()[0];

    if (previousBasalDatum) {
      this.normalizeDatumOut(previousBasalDatum, normalizeFields);

      // Add to top of basal data array if it overlaps the start endpoint
      const datumOverlapsStart = previousBasalDatum.normalTime < this.activeEndpoints.range[0]
        && previousBasalDatum.normalEnd > this.activeEndpoints.range[0];

      if (datumOverlapsStart) {
        basalData.unshift(previousBasalDatum);
      }
    }

    // Reset the endpoints and activeDays filters to the back to what they were
    this.filter.byEndpoints(this.activeEndpoints.range);
    this.filter.byActiveDays(this.activeDays);

    return basalData;
  };

  addPumpSettingsOverrideOverlappingStart = (pumpSettingsOverrideData = [], normalizeFields) => {
    _.each(pumpSettingsOverrideData, d => {
      if (!d.normalTime) this.normalizeDatumOut(d, normalizeFields);
    });

    // We need to ensure all the days of the week are active to ensure we get all override datums
    this.filter.byActiveDays([0, 1, 2, 3, 4, 5, 6]);

    // Set the endpoints filter get all previous override datums
    this.filter.byEndpoints([
      0,
      this.activeEndpoints.range[0],
    ]);

    // Fetch previous override datum
    const previousPumpSettingsOverrideDatum = _.cloneDeep(_.filter(
      this.sort.byTime(this.filter.byType('deviceEvent').top(Infinity)),
      { subType: 'pumpSettingsOverride' }
    ).reverse()[0]);

    if (previousPumpSettingsOverrideDatum) {
      this.normalizeDatumOut(previousPumpSettingsOverrideDatum, normalizeFields);


      // Add to top of pumpSettingsOverride data array if it overlaps the start endpoint
      const datumOverlapsStart = previousPumpSettingsOverrideDatum.normalTime < this.activeEndpoints.range[0]
      && previousPumpSettingsOverrideDatum.normalEnd > this.activeEndpoints.range[0];

      if (datumOverlapsStart) {
        pumpSettingsOverrideData.unshift(previousPumpSettingsOverrideDatum);
      }
    }

    // Reset the endpoints and activeDays filters to the back to what they were
    this.filter.byEndpoints(this.activeEndpoints.range);
    this.filter.byActiveDays(this.activeDays);

    return pumpSettingsOverrideData;
  };
}

export default DataUtil;
