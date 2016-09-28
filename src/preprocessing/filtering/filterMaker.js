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

export default function filterMaker(...args) {
  if (args.length === 1) {
    const element = args[0];

    switch (typeof element) {
      case 'function':
        return element;
      case 'object':
        if (_.isArray(element)) {
          const fns = new Array(element.length);
          for (let i = 0; i < element.length; ++i) {
            fns[i] = filterMaker(element[i]);
          }

          return (item) => {
            for (let i = 0; i < fns.length; ++i) {
              fns[i](item);
            }
          };
        }
        return filterMaker(_.map(_.keys(element), (key) => {
          const fn = filterMaker(element[key]);

          return (item) => {
            try {
              fn(item[key]);
            } catch (err) {
              err.message = `.${key} ${err.message}`;
              throw err;
            }
          };
        }));
      default:
        if (!_.isArray(element)) {
          throw new Error('filterMaker must be given an object, function, or array.');
        }
    }
  }
  return filterMaker(args);
}
