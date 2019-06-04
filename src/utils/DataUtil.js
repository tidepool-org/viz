import bows from 'bows';
import crossfilter from 'crossfilter'; // eslint-disable-line import/no-unresolved
import moment from 'moment-timezone';
import _ from 'lodash';

import {
  BGM_DATA_KEY,
  CGM_DATA_KEY,
  DEFAULT_BG_BOUNDS,
  MS_IN_DAY,
  MS_IN_MIN,
  MGDL_UNITS,
} from './constants';

import {
  convertToMGDL,
} from './bloodglucose';

import {
  addDuration,
  getMsPer24,
  getOffset,
  getTimezoneFromTimePrefs,
} from './datetime';

import { getLatestPumpUpload } from './device';
import StatUtil from './StatUtil';
import { statFetchMethods } from './stat';
import Validator from './validation/schema';

/* global __DEV__ */

export class DataUtil {
  /**
   * @param {Array} data Raw Tidepool data
   */
  constructor(data = []) {
    this.log = bows('DataUtil');
    this.startTimer = __DEV__ ? name => console.time(name) : _.noop;
    this.endTimer = __DEV__ ? name => console.timeEnd(name) : _.noop;
    this.init(data);
  }

  init = data => {
    this.startTimer('init total');
    this.data = crossfilter([]);
    this.rejectedData = [];
    this.endpoints = {};

    this.buildDimensions();
    this.buildFilters();
    this.buildSorts();

    this.addData(data);
    this.endTimer('init total');
  };

  addData = rawData => {
    this.startTimer('addData');
    const data = _.cloneDeep(rawData);
    _.each(data, this.normalizeDatumIn);

    const validData = _.uniqBy(data, 'id');
    const rejectedData = _.remove(validData, 'reject');
    this.data.add(validData);
    this.rejectedData.push(...rejectedData);

    this.log('addData', validData.length, 'of', data.length);
    if (this.rejectedData.length) this.log('rejectedData', this.rejectedData);

    this.setMetaData();
    this.endTimer('addData');
  };

  /* eslint-disable no-param-reassign */
  // TODO: add any one-time nurseshark munging
  // annotate basals
  // Medtronic/carelink upload source fix
  // probably more... see brainstorm doc: https://docs.google.com/document/d/167TsKkWcay9uAA260Iufx0zVu3E6wxXDeTrDttcoMAk
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

    if (d.type === 'deviceEvent') {
      if (_.find(d.annotations, { code: 'status/unknown-previous' })) {
        // TODO: handle with schema validation
        d.errorMessage = new Error('Bad pump status deviceEvent.').message;
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
    // which improves dimension filtering performance significantly over using ISO strings
    d.time = Date.parse(d.time);
    if (d.deviceTime) d.deviceTime = Date.parse(d.deviceTime);
  };

  validateDatumIn = d => {
    let validator = Validator[d.type] || Validator.common;

    if (_.isFunction(validator)) validator = [validator];

    // Run all validators and store the results in an array
    const validateResult = [];
    _.each(validator, (validationMethod, i) => {
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

  normalizeDatumOut = d => {
    const { timezoneName } = this.timePrefs || {};

    // Normal time post-processing
    if (timezoneName) {
      d.normalTime = d.time;
      d.displayOffset = -getOffset(d.time, timezoneName);
    } else {
      // timezoneOffset is an optional attribute according to the Tidepool data model
      if (d.timezoneOffset != null && d.conversionOffset != null) {
        d.normalTime = addDuration(d.time, d.timezoneOffset * MS_IN_MIN + d.conversionOffset);
      } else {
        d.normalTime = _.isEmpty(d.deviceTime) ? d.time : `${d.deviceTime}.000Z`;
      }

      // displayOffset always 0 when not timezoneAware
      d.displayOffset = 0;
      if (d.deviceTime && d.normalTime.slice(0, -5) !== d.deviceTime) {
        d.warning = 'Combining `time` and `timezoneOffset` does not yield `deviceTime`.';
      }
    }

    // Add source and serial number metadata
    if (d.uploadId) {
      d.deviceSerialNumber = _.get(this.uploadMap, [d.uploadId, 'deviceSerialNumber']);
    }
    if (!d.source) d.source = _.get(this.uploadMap, [d.uploadId, 'source'], 'Unspecified Data Source');

    // Additional post-processing by type
    if (d.type === 'basal') {
      d.normalEnd = addDuration(d.normalTime, d.duration);
      d.subType = d.deliveryType;
    }

    if (d.type === 'cbg' || d.type === 'smbg') {
      this.normalizeDatumBgUnits(d);
      d.msPer24 = getMsPer24(d.normalTime, timezoneName);
    }

    if (d.type === 'pumpSettings') {
      this.normalizeDatumBgUnits(d, ['bgTarget', 'bgTargets'], ['target', 'low', 'high']);
      this.normalizeDatumBgUnits(d, ['insulinSensitivity', 'insulinSensitivities'], ['amount']);
      // Set basalSchedules object to an array sorted by name: 'standard' first, then alphabetical
      d.basalSchedules = _.flatten(_.partition(
        _.sortBy(_.map(d.basalSchedules, (value, name) => ({ name, value })), 'name'),
        ({ name }) => (name === 'standard')
      ));
    }

    if (d.type === 'wizard') {
      this.normalizeDatumBgUnits(d, [], ['bgInput']);
      this.normalizeDatumBgUnits(d, ['bgTarget'], ['target', 'range', 'low', 'high']);
      this.normalizeDatumBgUnits(d, [], ['insulinSensitivity']);
      // replace bolus ID reference with bolus datums
      if (_.isString(d.bolus)) {
        d.bolus = this.filter.byId(d.bolus).top(1)[0];
        this.normalizeDatumOut(d.bolus);
      }
    }
  };

  normalizeDatumBgUnits = (d, keysPaths = [], keys = ['value']) => {
    // BG units are always stored in mmol/L in the backend, so we only need to convert to mg/dL
    if (_.get(this.bgPrefs, 'bgUnits') === MGDL_UNITS) {
      if (d.units) {
        d.units = _.isPlainObject(d.units) ? {
          ...d.units,
          bg: MGDL_UNITS,
        } : MGDL_UNITS;
      }

      const normalizeAtPath = path => {
        const pathValue = path ? _.get(d, path) : d;

        if (_.isPlainObject(pathValue)) {
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
    d.suppressed.time = d.time;
    d.suppressed.deviceTime = d.deviceTime;

    // Recurse as needed
    if (d.suppressed.suppressed) {
      this.normalizeSuppressedBasal(d.suppressed);
    }
  };
  /* eslint-enable no-param-reassign */

  removeData = predicate => {
    this.clearFilters();
    this.data.remove(predicate);
  };

  // N.B. May need to become smarter about creating and removing dimensions if we get above 8,
  // where performance will drop as per crossfilter docs.
  buildDimensions = () => {
    this.startTimer('buildDimensions');
    this.dimension = {
      byTime: this.data.dimension(d => d.time),
      byType: this.data.dimension(d => d.type),
      byId: this.data.dimension(d => d.id),
      byDayOfWeek: null, // (re)created in `setTimePrefs` whenever the timezone is set or changed
    };
    this.endTimer('buildDimensions');
  };

  buildFilters = () => {
    this.startTimer('buildFilters');
    this.filter = {};

    this.filter.byActiveDays = activeDays => this.dimension.byDayOfWeek
      .filterFunction(d => _.includes(activeDays, d));

    this.filter.byEndpoints = endpoints => this.dimension.byTime.filterRange(endpoints);

    this.filter.byType = type => this.dimension.byType.filterExact(type);
    this.filter.byId = id => this.dimension.byId.filterExact(id);
    this.endTimer('buildFilters');
  };

  buildSorts = () => {
    this.startTimer('buildSorts');
    this.sort = {};
    this.sort.byTime = array => {
      const timeField = _.get(this, 'timePrefs.timezoneAware') ? 'time' : 'deviceTime';
      return crossfilter.quicksort.by(d => d[timeField])(array, 0, array.length);
    };
    this.endTimer('buildSorts');
  };

  clearFilters = () => {
    this.dimension.byTime.filterAll();
    this.dimension.byType.filterAll();
    this.dimension.byId.filterAll();
    if (this.dimension.byDayOfWeek) this.dimension.byDayOfWeek.filterAll();
  };

  setBgSources = (current) => {
    const bgSources = {
      cbg: this.filter.byType(CGM_DATA_KEY).top(Infinity).length > 0,
      smbg: this.filter.byType(BGM_DATA_KEY).top(Infinity).length > 0,
      current,
    };

    if (!bgSources.current) {
      if (bgSources.cbg) {
        bgSources.current = CGM_DATA_KEY;
      } else if (bgSources.smbg) {
        bgSources.current = BGM_DATA_KEY;
      }
    }

    this.bgSources = bgSources;
  };

  setLatestPump = () => {
    const uploadData = this.sort.byTime(this.filter.byType('upload').top(Infinity));
    const latestPumpUpload = getLatestPumpUpload(uploadData);
    const latestUploadSource = _.get(latestPumpUpload, 'source', '').toLowerCase();

    this.latestPump = {
      deviceModel: _.get(latestPumpUpload, 'deviceModel', ''),
      manufacturer: latestUploadSource === 'carelink' ? 'medtronic' : latestUploadSource,
    };
  };

  setLatestPump = () => {
    this.startTimer('setLatestPump');
    const uploadData = this.sort.byTime(this.filter.byType('upload').top(Infinity));
    const latestPumpUpload = getLatestPumpUpload(uploadData);
    const latestUploadSource = _.get(latestPumpUpload, 'source', '').toLowerCase();

    this.latestPump = {
      deviceModel: _.get(latestPumpUpload, 'deviceModel', ''),
      manufacturer: latestUploadSource === 'carelink' ? 'medtronic' : latestUploadSource,
    };
    this.endTimer('setLatestPump');
  };

  setUploadMap = () => {
    this.startTimer('setUploadMap');
    const uploadData = this.sort.byTime(this.filter.byType('upload').top(Infinity));
    const pumpSettingsData = this.filter.byType('pumpSettings').top(Infinity);

    this.uploadMap = {};

    _.each(uploadData, upload => {
      let source = 'Unknown';

      if (_.has(upload, 'source')) {
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
        deviceSerialNumber: upload.deviceSerialNumber || 'Unknown',
      };
    });
    this.endTimer('setUploadMap');
  }

  setMetaData = () => {
    this.startTimer('setMetaData');
    this.setLatestPump();
    this.setUploadMap();
    this.endTimer('setMetaData');
  };

  setEndpoints = endpoints => {
    this.endpoints = {};

    if (endpoints) {
      const days = moment.utc(endpoints[1]).diff(moment.utc(endpoints[0])) / MS_IN_DAY;
      this.endpoints.current = {
        range: _.map(endpoints, e => moment.utc(e).valueOf()),
        days,
        activeDays: days,
      };

      this.endpoints.next = {
        range: [
          this.endpoints.current.range[1],
          moment.utc(endpoints[1]).add(this.endpoints.current.days, 'days').valueOf(),
        ],
        days,
        activeDays: days,
      };

      this.endpoints.prev = {
        range: [
          moment.utc(endpoints[0]).subtract(this.endpoints.current.days, 'days').valueOf(),
          this.endpoints.current.range[0],
        ],
        days,
        activeDays: days,
      };
    }
  };

  setActiveDays = activeDays => {
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
  };

  setTypes = types => {
    this.types = _.isArray(types) ? types : [];

    if (_.isPlainObject(types)) {
      this.types = _.map(types, (value, type) => ({
        type,
        ...value,
      }));
    }
  };

  setTimePrefs = (timePrefs = {}) => {
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

    const timeField = timezoneAware ? 'time' : 'deviceTime';

    if (timezoneNameChanged) {
      this.log('Timezone Change', prevTimezoneName, 'to', timezoneName);

      // Recreate the byDayOfWeek dimension to account for the new timezone.
      if (this.dimension.byDayOfWeek) this.dimension.byDayOfWeek.dispose();
      this.dimension.byDayOfWeek = this.data.dimension(
        d => moment.utc(d[timeField]).tz(timezoneName || 'UTC').day()
      );
    }

    if (timezoneAwareChanged) {
      this.log('Time Field Change', timeField === 'time' ? 'deviceTime' : 'time', 'to', timeField);

      this.dimension.byTime.dispose();
      this.dimension.byTime = this.data.dimension(d => d[timeField]);
    }

    this.timePrefs = {
      timezoneAware,
      timezoneName,
    };
  };

  setBGPrefs = (bgPrefs = {}) => {
    const {
      bgBounds = DEFAULT_BG_BOUNDS[MGDL_UNITS],
      bgUnits = MGDL_UNITS,
    } = bgPrefs;

    this.bgPrefs = {
      bgBounds,
      bgUnits,
    };
  };

  query = (query = {}) => {
    this.startTimer('query total');
    const {
      activeDays,
      endpoints,
      stats,
      timePrefs,
      bgPrefs,
      bgSource,
      types,
    } = query;

    // N.B. Must ensure that we get the desired endpoints in UTC time so that when we display in
    // the desired time zone, we have all the data.

    // Clear all previous filters
    this.clearFilters();

    this.setBgSources(bgSource);
    this.setTypes(types);
    this.setBGPrefs(bgPrefs);
    this.setTimePrefs(timePrefs);
    this.setEndpoints(endpoints);
    this.setActiveDays(activeDays);

    const data = {
      current: {},
      next: {},
      prev: {},
    };

    _.each(_.keys(data), range => {
      if (this.endpoints[range]) {
        this.activeRange = range;
        this.activeEndpoints = this.endpoints[range];

        // Filter the data set by date range
        this.filter.byEndpoints(this.activeEndpoints.range);

        // Filter out any inactive days of the week
        this.filter.byActiveDays(this.activeDays);

        // Generate the stats for current range
        if (range === 'current' && stats) {
          data[range].stats = this.generateStats(stats);
        }

        data[range].endpoints = this.activeEndpoints;

        // Generate the requested data
        if (this.types.length) {
          data[range].data = this.generateTypeData(this.types);
        }
      }
    });
    this.endTimer('query total');

    const result = {
      data,
      timePrefs: this.timePrefs,
      bgPrefs: this.bgPrefs,
      metaData: {
        latestPump: this.latestPump,
        bgSources: this.bgSources,
      },
    };

    this.log('Query, Result', query, result);

    return result;
  };

  generateStats = (stats) => {
    this.startTimer('generate stats');
    const selectedStats = _.isString(stats) ? _.map(stats.split(','), _.trim) : stats;
    const generatedStats = {};

    this.statUtil = new StatUtil(this);
    _.each(selectedStats, stat => {
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

  generateTypeData = (types) => {
    const generatedData = {};

    _.each(types, ({ type, select, sort = {} }) => {
      const fields = _.isString(select) ? _.map(select.split(','), _.trim) : select;
      let typeData = _.cloneDeep(this.filter.byType(type).top(Infinity));

      if (type === 'wizard') {
        // For wizard datums, we now set the type filter to 'bolus' so we can add bolus info to
        // wizards in the `normalizeDatumOut` method.
        this.filter.byType('bolus');
      }

      // Normalize data
      this.startTimer(`normalize | ${type} | ${this.activeRange}`);
      _.each(typeData, this.normalizeDatumOut);
      this.endTimer(`normalize | ${type} | ${this.activeRange}`);

      if (type === 'wizard') {
        // For wizard datums, we now unset the byId filter that was set when adding the 'bolus' info
        // to wizards in the `normalizeDatumOut` method.
        this.dimension.byId.filterAll();
      }

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
      typeData = _.map(typeData, d => _.pick(d, fields));
      this.endTimer(`select fields | ${type} | ${this.activeRange}`);

      generatedData[type] = typeData;
    });

    return generatedData;
  };

  addBasalOverlappingStart = (basalData) => {
    _.each(basalData, this.normalizeDatumOut);

    if (basalData.length && basalData[0].normalTime > this.endpoints[0]) {
      // We need to ensure all the days of the week are active to ensure we get all basals
      this.filter.byActiveDays([0, 1, 2, 3, 4, 5, 6]);

      // Set the endpoints filter to the previous day
      this.filter.byEndpoints([
        addDuration(this.endpoints[0], -MS_IN_DAY),
        this.endpoints[0],
      ]);

      // Fetch last basal from previous day
      const previousBasalDatum = this.sort
        .byTime(this.filter.byType('basal').top(Infinity))
        .reverse()[0];

      // Add to top of basal data array if it overlaps the start endpoint
      const datumOverlapsStart = previousBasalDatum
        && previousBasalDatum.normalTime < this.endpoints[0]
        && previousBasalDatum.normalEnd > this.endpoints[0];

      if (datumOverlapsStart) {
        basalData.unshift(previousBasalDatum);
      }

      // Reset the endpoints and activeDays filters to the back to what they were
      this.filter.byEndpoints(this.activeEndpoints.range);
      this.filter.byActiveDays(this.activeDays);
    }
    return basalData;
  };
}

export default DataUtil;
