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


import React, { PropTypes } from 'react';

import { MGDL_UNITS, MMOLL_UNITS } from '../../../utils/constants';
import { displayBgValue } from '../../../utils/format';

import Tooltip from '../../common/tooltips/Tooltip';

import styles from './FocusedCBGSliceMedianLabel.css';

const FocusedCBGSliceMedianLabel = (props) => {
  const { focusedSlice } = props;
  if (!focusedSlice) {
    return null;
  }

  const { bgUnits, focusedSlice: { data: { median }, position } } = props;

  const leftOffset = position.tooltipLeft ? -props.leftOffset : props.leftOffset;

  return (
    <Tooltip
      borderWidth={0}
      content={<span className={styles.number}>{`middle ${displayBgValue(median, bgUnits)}`}</span>}
      offset={{ left: leftOffset, top: 0 }}
      position={{ left: position.left, top: position.topOptions.median }}
      side={position.tooltipLeft ? 'left' : 'right'}
      tail={false}
    />
  );
};

FocusedCBGSliceMedianLabel.defaultProps = {
  leftOffset: 12,
};

FocusedCBGSliceMedianLabel.propTypes = {
  bgUnits: PropTypes.oneOf([MGDL_UNITS, MMOLL_UNITS]).isRequired,
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
  leftOffset: PropTypes.number.isRequired,
};

export default FocusedCBGSliceMedianLabel;
