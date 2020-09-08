import bows from 'bows';
import crossfilter from 'crossfilter'; // eslint-disable-line import/no-unresolved
import moment from 'moment-timezone';
import _ from 'lodash';

import {
  getLatestPumpUpload,
  getLastManualBasalSchedule,
  isAutomatedBasalDevice,
} from './device';

import {
  hasExtended,
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
  MS_IN_DAY,
  MS_IN_HOUR,
  MS_IN_MIN,
  MGDL_UNITS,
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

    this.buildDimensions();
    this.buildFilters();
    this.buildSorts();
    this.endTimer('init total');
  };

  addData = (rawData = [], patientId, returnData = false) => {
    this.startTimer('addData');

    this.bolusToWizardIdMap = this.bolusToWizardIdMap || {};
    this.bolusDatumsByIdMap = this.bolusDatumsByIdMap || {};
    this.deviceUploadMap = this.deviceUploadMap || {};
    this.wizardDatumsByIdMap = this.wizardDatumsByIdMap || {};
    this.latestDatumByType = this.latestDatumByType || {};

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
    this.startTimer('processNormalizedData');
    _.each(data, this.joinWizardAndBolus);
    this.endTimer('processNormalizedData');

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
        'patientId',
        'size',
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
    d._deviceTime = d.deviceTime;
    /* eslint-enable no-underscore-dangle */
    d.time = Date.parse(d.time);
    d.deviceTime = d.deviceTime ? Date.parse(d.deviceTime) : d.time;

    // Generate a map of latest datums by type
    if (d.time > _.get(this.latestDatumByType, [d.type, 'time'], 0)) this.latestDatumByType[d.type] = d;

    // Populate mappings to be used for 2-way join of boluses and wizards
    if (d.type === 'wizard' && _.isString(d.bolus)) {
      this.wizardDatumsByIdMap[d.id] = d;
      this.bolusToWizardIdMap[d.bolus] = d.id;
    }
    if (d.type === 'bolus') {
      this.bolusDatumsByIdMap[d.id] = d;
    }

    // Generate a map of devices by deviceId
    if (d.deviceId && !this.deviceUploadMap[d.deviceId]) {
      this.deviceUploadMap[d.deviceId] = d.uploadId;
    }
  };

  joinWizardAndBolus = d => {
    if (_.includes(['bolus', 'wizard'], d.type)) {
      const isWizard = d.type === 'wizard';
      const fieldToPopulate = isWizard ? 'bolus' : 'wizard';
      const idMap = isWizard ? _.invert(this.bolusToWizardIdMap) : this.bolusToWizardIdMap;
      const datumMap = isWizard ? this.bolusDatumsByIdMap : this.wizardDatumsByIdMap;

      if (idMap[d.id]) d[fieldToPopulate] = _.omit(datumMap[idMap[d.id]], d.type);
    }
  };

  tagDatum = d => {
    if (d.type === 'basal') {
      d.tags = {
        suspend: d.deliveryType === 'suspend',
        temp: d.deliveryType === 'temp',
      };
    }

    if (d.type === 'bolus') {
      d.tags = {
        correction: isCorrection(d),
        extended: hasExtended(d),
        interrupted: isInterruptedBolus(d),
        manual: !d.wizard,
        override: isOverride(d),
        underride: isUnderride(d),
        wizard: !!d.wizard,
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
      this.normalizeDatumBgUnits(d, ['bgTarget', 'bgTargets'], ['target', 'low', 'high']);
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
    }

    if (d.type === 'bolus') {
      if (_.isObject(d.wizard)) this.normalizeDatumOut(d.wizard, fields);
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
              _.set(d, setPath, convertToMGDL(pathValue[key]));
            } else if (_.isPlainObject(pathValue)) {
              this.normalizeDatumBgUnits(pathValue, _.keys(pathValue), [key]);
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
      delete this.bgSources;
      delete this.bgPrefs;
      delete this.timePrefs;
      delete this.latestPumpUpload;
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
      const pumpIsAutomatedBasalDevice = isAutomatedBasalDevice(manufacturer, deviceModel);

      if (latestPumpSettings && pumpIsAutomatedBasalDevice) {
        const basalData = this.sort.byTime(this.filter.byType('basal').top(Infinity));
        latestPumpSettings.lastManualBasalSchedule = getLastManualBasalSchedule(basalData);
      }

      this.latestPumpUpload = {
        deviceModel,
        isAutomatedBasalDevice: pumpIsAutomatedBasalDevice,
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

  /* eslint-disable no-param-reassign */
  setDevices = () => {
    this.startTimer('setDevices');
    const uploadsById = _.keyBy(this.sort.byTime(this.filter.byType('upload').top(Infinity)), 'uploadId');
    this.devices = _.reduce(this.deviceUploadMap, (result, value, key) => {
      const upload = uploadsById[value];
      let device = { id: key };

      if (upload) {
        const deviceManufacturer = _.get(upload, 'deviceManufacturers.0', '');
        const deviceModel = _.get(upload, 'deviceModel', '');
        device = {
          bgm: _.includes(upload.deviceTags, 'bgm'),
          cgm: _.includes(upload.deviceTags, 'cgm'),
          id: key,
          label: deviceManufacturer || deviceModel ? [deviceManufacturer, deviceModel].join(' ') : id,
          pump: _.includes(upload.deviceTags, 'insulin-pump'),
          serialNumber: upload.deviceSerialNumber,
        };
      }

      result.push(device);
      return result;
    }, []);
    this.endTimer('setDevices');
  }
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
    };
    this.endTimer('setBgPrefs');
  };

  setReturnRawData = (returnRaw = false) => {
    this.returnRawData = returnRaw;
  };

  setExcludedDevices = (deviceIds = []) => {
    this.startTimer('setExcludedDevices');
    this.excludedDevices = deviceIds;
    this.endTimer('setExcludedDevices');
  }

  query = (query = {}) => {
    this.log('Query', query);

    this.startTimer('query total');
    const {
      activeDays,
      aggregationsByDate,
      bgPrefs,
      bgSource,
      endpoints,
      fillData,
      metaData,
      nextDays,
      prevDays,
      stats,
      timePrefs,
      types,
      raw,
      excludedDevices,
    } = query;

    // N.B. Must ensure that we get the desired endpoints in UTC time so that when we display in
    // the desired time zone, we have all the data.

    // Clear all previous filters
    this.clearFilters();

    this.setReturnRawData(raw);
    this.setBgSources(bgSource);
    this.setTypes(types);
    this.setStats(stats);
    if (bgPrefs) this.setBgPrefs(bgPrefs);
    if (timePrefs) this.setTimePrefs(timePrefs);
    this.setEndpoints(endpoints, nextDays, prevDays);
    this.setActiveDays(activeDays);
    this.setExcludedDevices(excludedDevices);

    const data = {};

    _.each(this.endpoints, (rangeEndpoints, rangeKey) => {
      this.activeRange = rangeKey;
      this.activeEndpoints = rangeEndpoints;
      data[rangeKey] = {};

      // Filter the data set by date range
      this.filter.byEndpoints(this.activeEndpoints.range);

      // Filter out any inactive days of the week
      this.filter.byActiveDays(this.activeDays);

      // Filter out any excluded devices
      this.filter.byDeviceIds(this.excludedDevices);

      // Generate the stats for current range
      if (this.stats.length && rangeKey === 'current') {
        data[rangeKey].stats = this.getStats(this.stats);
      }

      // Generate the aggregations for current range
      if (aggregationsByDate && rangeKey === 'current') {
        data[rangeKey].aggregationsByDate = this.getAggregationsByDate(aggregationsByDate);
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

    // Always reset `returnRawData` to `false` after each query
    this.setReturnRawData(false);

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
  }

  getMetaData = metaData => {
    this.startTimer('generate metaData');
    const allowedMetaData = [
      'bgSources',
      'latestDatumByType',
      'latestPumpUpload',
      'patientId',
      'size',
      'devices',
    ];

    const requestedMetaData = _.isString(metaData) ? _.map(metaData.split(','), _.trim) : metaData;

    const selectedMetaData = _.cloneDeep(_.pick(
      this,
      _.intersection(allowedMetaData, requestedMetaData),
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

      // Normalize data
      this.startTimer(`normalize | ${type} | ${this.activeRange}`);
      if (type === 'basal' && _.includes(['prev', 'next'], this.activeRange)) {
        typeData = this.sort.byTime(typeData);
        if (this.activeRange === 'prev') {
          // Normalize the basal data and add any basals overlapping the start
          typeData = this.addBasalOverlappingStart(typeData, fields);

          // Trim the first basal if it overlaps the start
          if (typeData.length) {
            typeData[0].normalTime = _.max([
              typeData[0].normalTime,
              this.activeEndpoints.range[0],
            ]);
          }
        } else {
          _.each(typeData, d => this.normalizeDatumOut(d, fields));

          // Trim last basal if it overlaps the range end
          if (typeData.length) {
            typeData[typeData.length - 1].normalEnd = _.min([
              typeData[typeData.length - 1].normalEnd,
              this.activeEndpoints.range[1],
            ]);
          }
        }
      } else {
        _.each(typeData, d => this.normalizeDatumOut(d, fields));
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

  addBasalOverlappingStart = (basalData, normalizeFields) => {
    _.each(basalData, d => this.normalizeDatumOut(d, normalizeFields));

    if (basalData.length && basalData[0].normalTime > this.activeEndpoints.range[0]) {
      // We need to ensure all the days of the week are active to ensure we get all basals
      this.filter.byActiveDays([0, 1, 2, 3, 4, 5, 6]);

      // Set the endpoints filter to the previous day
      this.filter.byEndpoints([
        this.activeEndpoints.range[0] - MS_IN_DAY,
        this.activeEndpoints.range[0],
      ]);

      // Fetch last basal from previous day
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
    }
    return basalData;
  };
}

export default DataUtil;
