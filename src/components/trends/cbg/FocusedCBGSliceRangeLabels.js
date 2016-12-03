/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
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
import React, { PropTypes } from 'react';

import { MGDL_UNITS, MMOLL_UNITS } from '../../../utils/constants';
import { displayBgValue } from '../../../utils/format';

import Tooltip from '../../common/tooltips/Tooltip';

import styles from './FocusedCBGSliceRangeLabels.css';

const FocusedCBGSliceRangeLabels = (props) => {
  const { focusedSlice } = props;
  if (!focusedSlice) {
    return null;
  }

  const { bgUnits, focusedKeys: keys, focusedSlice: { data, position } } = props;

  const positionByKey = {
    firstQuartile: 'bottom',
    min: 'bottom',
    max: 'top',
    ninetiethQuantile: 'top',
    tenthQuantile: 'bottom',
    thirdQuartile: 'top',
  };

  if (_.isEqual(keys, ['median'])) {
    return null;
  }
  return (
    <div>
      {_.map(keys, (key) => {
        const absPos = { left: position.left, top: position.topOptions[key] };

        return (
          <Tooltip
            borderWidth={0}
            content={<span className={styles.number}>{displayBgValue(data[key], bgUnits)}</span>}
            key={key}
            position={absPos}
            side={positionByKey[key]}
            tail={false}
          />
        );
      })}
    </div>
  );
};

FocusedCBGSliceRangeLabels.propTypes = {
  bgUnits: PropTypes.oneOf([MGDL_UNITS, MMOLL_UNITS]).isRequired,
  focusedKeys: PropTypes.arrayOf(PropTypes.oneOf([
    'firstQuartile',
    'max',
    'median',
    'min',
    'ninetiethQuantile',
    'tenthQuantile',
    'thirdQuartile',
  ])),
  focusedSlice: PropTypes.shape({
    data: PropTypes.shape({
      firstQuartile: PropTypes.number.isRequired,
      id: PropTypes.string.isRequired,
      max: PropTypes.number.isRequired,
      median: PropTypes.number.isRequired,
      min: PropTypes.number.isRequired,
      msFrom: PropTypes.number.isRequired,
      msTo: PropTypes.number.isRequired,
      msX: PropTypes.number.isRequired,
      ninetiethQuantile: PropTypes.number.isRequired,
      tenthQuantile: PropTypes.number.isRequired,
      thirdQuartile: PropTypes.number.isRequired,
    }).isRequired,
    position: PropTypes.shape({
      left: PropTypes.number.isRequired,
      tooltipLeft: PropTypes.bool.isRequired,
      topOptions: PropTypes.shape({
        firstQuartile: PropTypes.number.isRequired,
        max: PropTypes.number.isRequired,
        median: PropTypes.number.isRequired,
        min: PropTypes.number.isRequired,
        ninetiethQuantile: PropTypes.number.isRequired,
        tenthQuantile: PropTypes.number.isRequired,
        thirdQuartile: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }),
};

export default FocusedCBGSliceRangeLabels;
