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
import cx from 'classnames';
import { select } from 'd3-selection';
import React, { PropTypes } from 'react';

import { classifyBgValue } from '../../../utils/bloodglucose';

import styles from './CBGSlice.css';

const CBGSlice = (props) => {
  const { datum } = props;
  if (!datum) {
    return null;
  }
  const { aCbgDateIsFocused, bgBounds, cornerRadius, focusedSliceKeys, isFocused } = props;
  const { medianHeight, sliceHalfWidth, xScale, yPositions } = props;
  const { focusSlice, unfocusSlice: unfocus } = props;

  function getClass(category) {
    if (isFocused) {
      switch (focusedSliceKeys.join(' ')) {
        case 'min max':
          if (category === 'rangeSlice') {
            return styles[`${category}Hovered`];
          }
          return styles[category];
        case 'tenthQuantile ninetiethQuantile':
          if (category === 'outerSlice') {
            return styles[`${category}Hovered`];
          } else if (category === 'quartileSlice') {
            return styles.focused;
          }
          return styles[category];
        case 'firstQuartile thirdQuartile':
          if (category === 'quartileSlice') {
            return styles[`${category}Hovered`];
          }
          return styles[category];
        default:
          return styles[category];
      }
    }
    return styles[category];
  }

  const focusMedian = () => {
    const left = xScale(datum.msX);
    focusSlice(datum, {
      left,
      tooltipLeft: datum.msX > props.tooltipLeftThreshold,
      yPositions,
    }, ['median']);
  };

  function renderRoundedRect(category, y1Accessor, y2Accessor) {
    const left = xScale(datum.msX);
    const focus = () => {
      focusSlice(datum, {
        left,
        tooltipLeft: datum.msX > props.tooltipLeftThreshold,
        yPositions,
      }, [y1Accessor, y2Accessor]);
    };
    return (
      <rect
        className={`cbgSliceRect ${getClass(category)}`}
        key={`${category}-${datum.id}`}
        id={`${category}-${datum.id}`}
        onMouseOver={focus}
        onMouseOut={(e) => {
          // when mouseout is triggered b/c the mouses "leaves" the slice
          // to move onto a cbg circle *within* the slice
          // the e.target will be the rect/slice and the relatedTarget
          // will be the circle, so we can suppress the call to unfocus()
          // in this case
          // TODO: fix use of arrow functions in props!
          if (!e.relatedTarget) {
            unfocus();
          } else if (!select(e.relatedTarget).classed('cbgCircle')) {
            unfocus();
          }
        }}
        x={left - sliceHalfWidth}
        width={2 * sliceHalfWidth}
        y={yPositions[y2Accessor]}
        height={yPositions[y1Accessor] - yPositions[y2Accessor]}
        rx={cornerRadius}
        ry={cornerRadius}
      />
    );
  }

  const medianClasses = cx({
    [styles.median]: true,
    [styles.medianBackgrounded]: aCbgDateIsFocused,
    [styles[classifyBgValue(bgBounds, datum.median)]]: !aCbgDateIsFocused,
  });

  return (
    <g id={`cbgSlice-${datum.id}`}>
      {[
        renderRoundedRect('rangeSlice', 'min', 'max'),
        renderRoundedRect('outerSlice', 'tenthQuantile', 'ninetiethQuantile'),
        renderRoundedRect('quartileSlice', 'firstQuartile', 'thirdQuartile'),
        (isFocused && !_.isEqual(focusedSliceKeys, ['min', 'max'])) ? null : (
          <rect
            className={medianClasses}
            key={`individualMedian-${datum.id}`}
            id={`individualMedian-${datum.id}`}
            onMouseOver={focusMedian}
            onMouseOut={unfocus}
            // add one to account for stroke
            // TODO: export stroke-width from CBGSlice.css if keeping
            x={xScale(datum.msX) - sliceHalfWidth + 1}
            y={yPositions.median - medianHeight / 2}
            // subtract two to account for stroke
            // TODO: export stroke-width from CBGSlice.css if keeping
            width={2 * sliceHalfWidth - 2}
            height={medianHeight}
            rx={cornerRadius}
            ry={cornerRadius}
            style={{ pointerEvents: 'none' }}
          />
        ),
      ]}
    </g>
  );
};

CBGSlice.defaultProps = {
  cornerRadius: 2,
  medianHeight: 10,
  sliceHalfWidth: 8,
};

CBGSlice.propTypes = {
  aCbgDateIsFocused: PropTypes.bool.isRequired,
  bgBounds: PropTypes.shape({
    veryHighThreshold: PropTypes.number.isRequired,
    targetUpperBound: PropTypes.number.isRequired,
    targetLowerBound: PropTypes.number.isRequired,
    veryLowThreshold: PropTypes.number.isRequired,
  }).isRequired,
  categoryToSliceKeysMap: PropTypes.shape({
    rangeSlice: PropTypes.array.isRequired,
    outerSlice: PropTypes.array.isRequired,
    quartileSlice: PropTypes.array.isRequired,
  }).isRequired,
  cornerRadius: PropTypes.number.isRequired,
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
  focusedSliceKeys: PropTypes.arrayOf(PropTypes.oneOf([
    'firstQuartile',
    'max',
    'median',
    'min',
    'ninetiethQuantile',
    'tenthQuantile',
    'thirdQuartile',
  ])),
  focusSlice: PropTypes.func.isRequired,
  isFocused: PropTypes.bool.isRequired,
  medianHeight: PropTypes.number.isRequired,
  sliceHalfWidth: PropTypes.number.isRequired,
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
    topMargin: PropTypes.number.isRequired,
  }).isRequired,
};

export default CBGSlice;
