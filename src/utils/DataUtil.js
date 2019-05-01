import bows from 'bows';
import crossfilter from 'crossfilter'; // eslint-disable-line import/no-unresolved
import moment from 'moment-timezone';
import _ from 'lodash';

import { DEFAULT_BG_BOUNDS, MS_IN_DAY, MGDL_UNITS } from './constants';
import { getTimezoneFromTimePrefs } from './datetime';

/* eslint-disable lodash/prefer-lodash-method */

export class DataUtil {
  /**
   * @param {Array} data Raw Tidepool data
   */
  constructor(data = []) {
    this.log = bows('DataUtil');
    this.init(data);
  }

  init = data => {
    this.data = crossfilter([]);
    this.endpoints = {};

    this.addData(data);

    this.buildDimensions();
    this.buildFilters();
    this.buildSorts();
  };

  addData = data => {
    this.data.add(_.filter(_.uniqBy(data, 'id'), _.isPlainObject)); // TODO: determine if lodash methods are performant enough
  }

  /**
   * TODO: need to figure out if I should only normalize datums
   * upon return
   *
   * Thinking this would be required for allowing the user to easily switch
   * timezones on the fly in a future UI
   *
   * This would mean requiring the client to send timeprefs
   * with the requests.
   *
   * It would also require possibly 'converting' the provided
   * endpoints to UTC time before filtering via the timePrefs object
   * (or sending them in UTC)
   *
   * This assumes that the data is stored in UTC -- need to confirm
   */
  normalizeDatum = datum => {
    const d = { ...datum };

    return d;
  }

  removeData = predicate => {
    this.clearFilters();
    this.data.remove(predicate);
  }

  buildDimensions = () => {
    this.dimension = {};
    this.dimension.byDate = this.data.dimension(
      d => moment.utc(d.time).tz('UTC').toISOString()
    );

    this.dimension.byDayOfWeek = this.data.dimension(
      d => moment.utc(d.time).tz('UTC').day()
    );

    this.dimension.byType = this.data.dimension(d => d.type);
  };

  buildFilters = () => {
    this.filter = {};
    this.filter.byActiveDays = activeDays => this.dimension.byDayOfWeek
      .filterFunction(d => _.includes(activeDays, d));

    this.filter.byEndpoints = endpoints => this.dimension.byDate.filterRange(endpoints);
    this.filter.byType = type => this.dimension.byType.filterExact(type);
  };

  buildSorts = () => {
    this.sort = {};
    this.sort.byDate = array => (
      crossfilter.quicksort.by(d => d.time)(array, 0, array.length)
    );
  };

  clearFilters = () => {
    this.dimension.byDate.filterAll();
    this.dimension.byDayOfWeek.filterAll();
    this.dimension.byType.filterAll();
  };

  setEndpoints = endpoints => {
    this.endpoints = {};

    if (endpoints) {
      this.endpoints.current = _.map(endpoints, e => moment.utc(e).toISOString());

      this.endpoints.daysInRange = moment.utc(endpoints[1])
        .diff(moment.utc(endpoints[0])) / MS_IN_DAY;

      this.endpoints.activeDaysInRange = this.endpoints.daysInRange;

      this.endpoints.next = [
        this.endpoints.current[1],
        moment.utc(endpoints[1]).add(this.endpoints.daysInRange, 'days').toISOString(),
      ];

      this.endpoints.prev = [
        moment.utc(endpoints[0]).subtract(this.endpoints.daysInRange, 'days').toISOString(),
        this.endpoints.current[0],
      ];
    }
  };

  setActiveDays = activeDays => {
    this.activeDays = activeDays || [0, 1, 2, 3, 4, 5, 6];

    const { daysInRange } = this.endpoints;
    if (daysInRange) {
      this.endpoints.activeDaysInRange = daysInRange / 7 * this.activeDays.length;
    }
  }

  setTypes = types => {
    this.types = _.isArray(types) ? types : [];

    if (_.isPlainObject(types)) {
      this.types = _.map(types, (value, type) => ({
        type,
        ...value,
      }));
    }
  }

  setTimezoneName = (timePrefs = {}) => {
    this.timezoneName = undefined;

    if (timePrefs.timezoneAware) {
      this.timezoneName = getTimezoneFromTimePrefs(timePrefs);
    }
  }

  setBGPrefs = (bgPrefs = {}) => {
    const {
      bgBounds = DEFAULT_BG_BOUNDS[MGDL_UNITS],
      bgUnits = MGDL_UNITS,
    } = bgPrefs;

    this.bgBounds = bgBounds;
    this.bgUnits = bgUnits;
  }

  queryData = (query = {}) => {
    const {
      activeDays,
      endpoints,
      // stats,
      timePrefs,
      bgPrefs,
      types,
    } = query;

    this.clearFilters();

    this.setEndpoints(endpoints);
    this.setActiveDays(activeDays);
    this.setTypes(types);
    this.setTimezoneName(timePrefs);
    this.setBGPrefs(bgPrefs);

    const data = {
      current: {},
      next: {},
      prev: {},
    };

    _.each(_.keys(data), range => {
      if (this.endpoints[range]) {
        // Filter the data set by date range
        this.filter.byEndpoints(this.endpoints[range]);

        data[range].range = this.endpoints[range];
        data[range].data = {};

        // Filter out any inactive days of the week
        if (this.activeDays) this.filter.byActiveDays(this.activeDays);

        _.each(this.types, ({ type, select, sort = {} }) => {
          const fields = _.isString(select) ? _.map(select.split(','), _.trim) : select;

          data[range].data[type] = _.map(
            this.sort.byDate(this.filter.byType(type).top(Infinity)),
            d => _.pick(d, fields));

          let sortOpts = sort;
          if (_.isString(sortOpts)) {
            const sortArray = _.map(sort.split(','), _.trim);
            sortOpts = {
              field: sortArray[0],
              order: sortArray[1],
            };
          }

          if (sortOpts.field && sortOpts.field !== 'time') {
            data[range].data[type] = _.sortBy(data[range].data[type], [sortOpts.field]);
          }

          if (sortOpts.order === 'desc') data[range].data[type].reverse();
        });
      }
    });

    return {
      data,
      timezoneName: this.timezoneName,
      bgUnits: this.bgUnits,
    };
  }
}

export default DataUtil;
