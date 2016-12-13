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

import Tooltip from '../../common/tooltips/Tooltip';

import { MGDL_UNITS, MMOLL_UNITS } from '../../../utils/constants';
import { displayBgValue } from '../../../utils/format';
import { millisecondsAsTimeOfDay } from '../../../utils/datetime';

import styles from './FocusedCBGSliceLabel.css';

const FocusedCBGSliceLabel = (props) => {
  const { focusedKeys, focusedSlice } = props;
  if (_.isEmpty(focusedSlice) || _.isEmpty(focusedKeys) || focusedKeys.length === 1) {
    return null;
  }
  const { bgUnits, keysToPercentageLabelMap } = props;
  const { data, position } = focusedSlice;
  const timeFrom = millisecondsAsTimeOfDay(data.msFrom);
  const timeTo = millisecondsAsTimeOfDay(data.msTo);
  return (
    <Tooltip
      title={<span className={styles.titleText}>{timeFrom} - {timeTo}</span>}
      content={
        <span className={styles.explainerText}>
          {`${keysToPercentageLabelMap[focusedKeys[0]]}% of readings are between
           ${displayBgValue(data[focusedKeys[0]], bgUnits)} and
            ${displayBgValue(data[focusedKeys[1]], bgUnits)}`}
        </span>
      }
      offset={{ top: 0, left: position.tooltipLeft ? 10 : -10 }}
      position={{ left: position.left, top: position.yPositions.median }}
      side={position.tooltipLeft ? 'right' : 'left'}
      tail={false}
    />
  );
};

FocusedCBGSliceLabel.defaultProps = {
  keysToPercentageLabelMap: {
    firstQuartile: 50,
    min: 100,
    max: 100,
    ninetiethQuantile: 80,
    tenthQuantile: 80,
    thirdQuartile: 50,
  },
};

FocusedCBGSliceLabel.propTypes = {
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
      yPositions: PropTypes.shape({
        firstQuartile: PropTypes.number.isRequired,
        max: PropTypes.number.isRequired,
        median: PropTypes.number.isRequired,
        min: PropTypes.number.isRequired,
        ninetiethQuantile: PropTypes.number.isRequired,
        tenthQuantile: PropTypes.number.isRequired,
        thirdQuartile: PropTypes.number.isRequired,
        topMargin: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  keysToPercentageLabelMap: PropTypes.shape({
    firstQuartile: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
    ninetiethQuantile: PropTypes.number.isRequired,
    tenthQuantile: PropTypes.number.isRequired,
    thirdQuartile: PropTypes.number.isRequired,
  }).isRequired,
};

export default FocusedCBGSliceLabel;
