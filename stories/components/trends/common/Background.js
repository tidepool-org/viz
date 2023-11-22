import { scaleLinear } from 'd3-scale';
import React from 'react';

// eslint-disable-next-line max-len
import Background from '../../../../src/components/trends/common/Background';

const w = 800;
const h = 450;
const props = {
  margins: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  svgDimensions: {
    width: w,
    height: h,
  },
  xScale: scaleLinear().domain([0, 864e5]).range([0, w]),
};

export default {
  title: 'Background',
};

export const WithoutLines = {
  render: () => (
    <svg width={w} height={h}>
      <Background {...props} />
    </svg>
  ),

  name: 'without lines',
};

export const WithLinesAtThreeHourIntervals = {
  render: () => (
    <svg width={w} height={h}>
      <Background {...props} linesAtThreeHrs />
    </svg>
  ),

  name: 'with lines at three-hour intervals',
};
