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

import { classifyBgValue } from '../../../utils/bloodglucose';

import styles from './CBGDayTrace.css';

const CBGDayTrace = (props) => {
  const { bgBounds, data, date, xScale, yScale } = props;
  return (
    <g id={`individualCbgs-${date}`}>
      {_.map(data, (d) => (
        <circle
          className={styles[classifyBgValue(bgBounds, d.value)]}
          cx={xScale(d.msPer24)}
          cy={yScale(d.value)}
          key={d.id}
          r={2.5}
        />
      ))}
    </g>
  );
};

CBGDayTrace.propTypes = {
  bgBounds: PropTypes.shape({
    veryHighThreshold: PropTypes.number.isRequired,
    targetUpperBound: PropTypes.number.isRequired,
    targetLowerBound: PropTypes.number.isRequired,
    veryLowThreshold: PropTypes.number.isRequired,
  }).isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    // here only documenting the properties we actually use rather than the *whole* data model!
    id: PropTypes.string.isRequired,
    msPer24: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  })).isRequired,
  date: PropTypes.string.isRequired,
  xScale: PropTypes.func.isRequired,
  yScale: PropTypes.func.isRequired,
};

export default CBGDayTrace;
