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
import { mean } from 'd3-array';
import React, { PropTypes } from 'react';

import { classifyBgValue } from '../../../utils/bloodglucose';

import styles from './CBGMeanPerDayDots.css';

const CBGMeanPerDayDots = (props) => {
  const { bgBounds, dataGroupedByDay, focusedSlice: { data: { msX } }, xScale, yScale } = props;
  return (
    <g id="cbgMeansPerDay">
      {_.map(_.keys(dataGroupedByDay), (key) => {
        const dayData = dataGroupedByDay[key];
        const dayMean = mean(dayData, (d) => (d.value));
        return (
          <circle
            className={styles[classifyBgValue(bgBounds, dayMean)]}
            cx={xScale(msX)}
            cy={yScale(dayMean)}
            key={key}
            r={5}
          />
        );
      })}
    </g>
  );
};

CBGMeanPerDayDots.propTypes = {
  bgBounds: PropTypes.shape({
    veryHighThreshold: PropTypes.number.isRequired,
    targetUpperBound: PropTypes.number.isRequired,
    targetLowerBound: PropTypes.number.isRequired,
    veryLowThreshold: PropTypes.number.isRequired,
  }).isRequired,
  dataGroupedByDay: PropTypes.object.isRequired,
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
  }).isRequired,
  xScale: PropTypes.func.isRequired,
  yScale: PropTypes.func.isRequired,
};

export default CBGMeanPerDayDots;
