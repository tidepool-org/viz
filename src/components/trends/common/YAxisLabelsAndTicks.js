import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { MGDL_UNITS, MMOLL_UNITS } from '../../../utils/constants';
import { formatBgValue } from '../../../utils/format';

import styles from './YAxisLabelsAndTicks.css';

const BOUND_KEYS = ['targetLowerBound', 'targetUpperBound', 'veryHighThreshold', 'veryLowThreshold'];

const YAxisLabels = (props) => {
  const { bgPrefs, margins, textToTickGap, tickWidth, yScale } = props;
  const { bgBounds } = bgPrefs;

  // Some target range presets don't have a veryLow or veryHigh range
  const renderedBoundKeys = BOUND_KEYS.filter(bound => !!bgBounds[bound]);

  return (
    <g id="yAxisLabels">
      {_.map(renderedBoundKeys, (boundKey) => (
          <g id="yAxisLabel" key={boundKey}>
            <text
              className={styles.text}
              x={margins.left - tickWidth - textToTickGap}
              y={yScale(bgBounds[boundKey])}
            >
              {formatBgValue(bgBounds[boundKey], bgPrefs)}
            </text>
            <line
              className={styles.tick}
              x1={margins.left - tickWidth}
              x2={margins.left}
              y1={yScale(bgBounds[boundKey])}
              y2={yScale(bgBounds[boundKey])}
            />
          </g>
        )
      )}
    </g>
  );
};

YAxisLabels.defaultProps = {
  textToTickGap: 2,
  tickWidth: 8,
};

YAxisLabels.propTypes = {
  bgPrefs: PropTypes.shape({
    bgBounds: PropTypes.shape({
      veryHighThreshold: PropTypes.number,
      targetUpperBound: PropTypes.number.isRequired,
      targetLowerBound: PropTypes.number.isRequired,
      veryLowThreshold: PropTypes.number,
    }),
    bgUnits: PropTypes.oneOf([MGDL_UNITS, MMOLL_UNITS]).isRequired,
  }),
  margins: PropTypes.shape({
    top: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  textToTickGap: PropTypes.number.isRequired,
  tickWidth: PropTypes.number.isRequired,
  yScale: PropTypes.func.isRequired,
};

export default YAxisLabels;
