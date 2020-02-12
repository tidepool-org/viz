import _ from 'lodash';
import { range } from 'd3-array';
import PropTypes from 'prop-types';
import React from 'react';

import * as datetime from '../../../utils/datetime';

import styles from './Background.css';

const Background = (props) => {
  const { data, margins, svgDimensions, xScale } = props;

  const width = svgDimensions.width - margins.left - margins.right;
  const height = svgDimensions.height - margins.top - margins.bottom;

  const lines = props.linesAtThreeHrs ? _.map(data, (val, i) => (
    <line
      className={styles.threeHrLine}
      key={`threeHrLine-${i}`}
      x1={xScale(val)}
      x2={xScale(val)}
      y1={margins.top}
      y2={svgDimensions.height - margins.bottom}
    />
  )) : null;

  return (
    <g id="background">
      <rect
        className={styles.background}
        x={margins.left}
        y={margins.top}
        width={width}
        height={height}
      />
      {lines}
    </g>
  );
};

Background.defaultProps = {
  data: _.map(range(1, 8), (i) => (i * datetime.THREE_HRS)),
  linesAtThreeHrs: false,
};

Background.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  linesAtThreeHrs: PropTypes.bool.isRequired,
  margins: PropTypes.shape({
    top: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  svgDimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  xScale: PropTypes.func.isRequired,
};

export default Background;
