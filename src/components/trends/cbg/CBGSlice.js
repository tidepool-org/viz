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

import { select } from 'd3-selection';
import React, { PropTypes } from 'react';

import { classifyBgValue } from '../../../utils/bloodglucose';

import styles from './CBGSlice.css';

const CBGSlice = (props) => {
  const { datum } = props;
  if (!datum) {
    return null;
  }
  const { bgBounds, isFocused } = props;
  const { medianRadius, sliceCapRadius, xScale, yPositions } = props;
  const { focusSlice, unfocusSlice: unfocus } = props;

  function getClass(category) {
    return isFocused ? styles.focused : styles[category];
  }

  const focusMedian = () => {
    const left = xScale(datum.msX);
    focusSlice(datum, {
      left,
      tooltipLeft: datum.msX > props.tooltipLeftThreshold,
      topOptions: yPositions,
    }, ['median']);
  };

  function renderRoundedRect(category, y1Accessor, y2Accessor) {
    const left = xScale(datum.msX);
    const focus = () => {
      focusSlice(datum, {
        left,
        tooltipLeft: datum.msX > props.tooltipLeftThreshold,
        topOptions: yPositions,
      }, [y1Accessor, y2Accessor]);
    };
    return (
      <rect
        className={`cbgSliceRect ${getClass(category)}`}
        key={`${category}-${datum.id}`}
        id={`${category}-${datum.id}`}
        onMouseOver={(e) => {
          // ditto comments below
          if (!e.relatedTarget) {
            focus();
          } else if (!select(e.relatedTarget).classed('cbgMeanCircle')) {
            focus();
          }
        }}
        onMouseOut={(e) => {
          // when mouseout is triggered b/c the mouses "leaves" the slice
          // to move onto a cbg mean circle *within* the slice
          // the e.target will be the rect/slice and the relatedTarget
          // will be the circle/mean, so we can suppress the call to unfocus()
          // in this case
          // TODO: fix arrow functions in props (=== bad/non-performant!)
          if (!e.relatedTarget) {
            unfocus();
          } else if (!select(e.relatedTarget).classed('cbgMeanCircle')) {
            unfocus();
          }
        }}
        x={left - sliceCapRadius}
        width={2 * sliceCapRadius}
        y={yPositions[y2Accessor]}
        height={yPositions[y1Accessor] - yPositions[y2Accessor]}
        rx={sliceCapRadius}
        ry={sliceCapRadius}
      />
    );
  }

  return (
    <g id={`cbgSlice-${datum.id}`}>
      {[
        renderRoundedRect('rangeSlice', 'min', 'max'),
        renderRoundedRect('outerSlice', 'tenthQuantile', 'ninetiethQuantile'),
        renderRoundedRect('quartileSlice', 'firstQuartile', 'thirdQuartile'),
        <ellipse
          className={isFocused ?
            styles.focused : styles[classifyBgValue(bgBounds, datum.median)]}
          key={`individualMedian-${datum.id}`}
          id={`individualMedian-${datum.id}`}
          onMouseOver={focusMedian}
          onMouseOut={unfocus}
          cx={xScale(datum.msX)}
          cy={yPositions.median}
          rx={medianRadius}
          ry={medianRadius - 1}
        />,
      ]}
    </g>
  );
};

CBGSlice.defaultProps = {
  medianRadius: 7,
  sliceCapRadius: 9,
};

CBGSlice.propTypes = {
  bgBounds: PropTypes.shape({
    veryHighThreshold: PropTypes.number.isRequired,
    targetUpperBound: PropTypes.number.isRequired,
    targetLowerBound: PropTypes.number.isRequired,
    veryLowThreshold: PropTypes.number.isRequired,
  }).isRequired,
  // if there's a gap in data, a `datum` may not exist, so not required
  datum: PropTypes.shape({
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
  }),
  focusSlice: PropTypes.func.isRequired,
  isFocused: PropTypes.bool.isRequired,
  medianRadius: PropTypes.number.isRequired,
  sliceCapRadius: PropTypes.number.isRequired,
  tooltipLeftThreshold: PropTypes.number.isRequired,
  unfocusSlice: PropTypes.func.isRequired,
  xScale: PropTypes.func.isRequired,
  yPositions: PropTypes.shape({
    min: PropTypes.number.isRequired,
    tenthQuantile: PropTypes.number.isRequired,
    firstQuartile: PropTypes.number.isRequired,
    median: PropTypes.number.isRequired,
    thirdQuartile: PropTypes.number.isRequired,
    ninetiethQuantile: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
};

export default CBGSlice;
