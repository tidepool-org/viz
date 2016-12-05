/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2014–2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

import _ from 'lodash';
import util from 'util';

import filterMaker from './filterMaker';

function loggable(val) {
  return typeof val === 'object' ? JSON.stringify(val) : val;
}

function error(...args) {
  throw new Error(util.format.apply(util, args));
}

function matchesRegex(regex) {
  return (val) => {
    if (!regex.test(val)) {
      error(`should match the regex [${regex}], got [${loggable(val)}]`);
    }
  };
}

function typeOf(match) {
  return (item) => {
    if (typeof item !== match) {
      error(`should be of type [${match}], value was [${loggable(item)}]`);
    }
  };
}

export const togetherWith = (primaryField, fields) => {
  let fieldList = fields;
  if (!_.isArray(fields)) {
    fieldList = [fields];
  }

  return (item) => {
    if (item[primaryField] != null) {
      for (let i = 0; i < fieldList.length; ++i) {
        if (item[fieldList[i]] == null) {
          const present = _.pick(item, primaryField, fieldList);
          error(
            `Fields ${fieldList} are expected when field ${primaryField} exists.
            Value(s) were ${present}`
          );
        }
      }
    }
  };
};

const isAnId = matchesRegex(/^[A-Za-z0-9\-_]+$/);
// deviceTime is the raw, non-timezone-aware string w/o timezone offset info
const isADeviceTime = matchesRegex(/^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)$/);

// eslint-disable-next-line max-len
const isoPattern = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/;

export default function schematron(...args) {
  if (args.length > 0) {
    return filterMaker(args);
  }

  let optional = false;
  const fns = [];

  return _.assign(
    (item) => {
      if (optional && (item === undefined || item === null)) {
        return;
      } else if (!optional && item === undefined) {
        error('is required');
      }

      for (let i = 0; i < fns.length; ++i) {
        fns[i](item);
      }
    },
    {
      array: function checkArray(fn) {
        fns.push((item) => {
          if (!_.isArray(item)) {
            error(`should be an array, value was [${loggable(item)}]`);
          }

          if (fn) {
            for (let i = 0; i < item.length; ++i) {
              fn(item[i]);
            }
          }
        });

        return this;
      },

      banned: function checkBanned() {
        optional = true;

        fns.push((item) => {
          if (item !== undefined) {
            error(`should not exist, but found with value [${item}]`);
          }
        });

        return this;
      },

      boolean: function checkIsBoolean() {
        fns.push(typeOf('boolean'));

        return this;
      },

      ifExists: function checkOptional() {
        optional = true;

        return this;
      },

      in: function checkValueIn(vals) {
        const obj = {};
        for (let i = 0; i < vals.length; ++i) {
          obj[vals[i]] = true;
        }

        fns.push((item) => {
          if (obj[item] == null) {
            error(`should be one of [${vals}], got [${item}]`);
          }
        });

        return this;
      },

      isADeviceTime: function checkIsDeviceTime() {
        fns.push(isADeviceTime);

        return this;
      },

      isId: function checkIsId() {
        fns.push(isAnId);

        return this;
      },

      isNull: function checkIsNull() {
        fns.push((item) => {
          if (item !== null) {
            error(`should be null, got [${item}]`);
          }
        });

        return this;
      },

      isISODateTime: function checkIsISODateTime() {
        fns.push((item) => {
          if (!isoPattern.test(item)) {
            error(`should be an ISO 8601 datetime string, got [${item}]`);
          }
        });

        return this;
      },

      minLength: function checkMinLength(length) {
        fns.push((item) => {
          if (item.length < length) {
            error(`should have a length >= [${length}], got [${item.length}]`);
          }
        });

        return this;
      },

      max: function checkMax(max) {
        fns.push((item) => {
          if (item > max) {
            error(`should be <= [${max}], got [${item}]`);
          }
        });

        return this;
      },

      min: function checkMin(min) {
        fns.push((item) => {
          if (item < min) {
            error(`should be >= [${min}], got [${item}]`);
          }
        });

        return this;
      },

      number: function checkIsNumber() {
        fns.push((item) => {
          if (!_.isFinite(item)) {
            error(`should be a finite number, got [${loggable(item)}]`);
          }
        });

        return this;
      },

      object: function checkIsObject(...fieldConstraints) {
        fns.push(typeOf('object'));
        if (fieldConstraints.length > 0) {
          fns.push(schematron(fieldConstraints[0]));
        }

        return this;
      },

      oneOf: function checkAlternatives(...choices) {
        const alts = [];
        for (let i = 0; i < choices.length; ++i) {
          alts.push(choices[i]);
        }
        fns.push((item) => {
          const errors = [];
          for (let i = 0; i < alts.length; ++i) {
            try {
              alts[i](item);
            } catch (err) {
              errors.push(err);
            }
          }
          if (errors.length > (alts.length - 1)) {
            const loggableErrs = _.pluck(errors, 'message').join(' ');
            error(`[${loggable(item)}] failed all possible schemas: ${loggableErrs}`);
          }
        });

        return this;
      },

      regex: function checkMatchesRegex(regex) {
        fns.push(matchesRegex(regex));

        return this;
      },

      string: function checkIsString() {
        fns.push(typeOf('string'));

        return this;
      },
    }
  );
}
