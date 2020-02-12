import _ from 'lodash';
import { range } from 'd3-array';
import PropTypes from 'prop-types';
import React from 'react';

import { formatClocktimeFromMsPer24, THREE_HRS } from '../../../utils/datetime';

import styles from './XAxisLabels.css';

const XAxisLabels = (props) => {
  const { data, margins, xOffset, xScale, yOffset } = props;
  const yPos = margins.top - yOffset;

  return (
    <g id="xAxisLabels">
      {_.map(data, (msInDay) => {
        const displayTime = formatClocktimeFromMsPer24(msInDay, 'h a');
        return (
          <text
            className={styles.text}
            key={msInDay}
            x={xScale(msInDay) + xOffset}
            y={yPos}
          >
            {displayTime}
          </text>
        );
      })}
    </g>
  );
};

XAxisLabels.defaultProps = {
  data: _.map(range(0, 8), (i) => (i * THREE_HRS)),
  xOffset: 5,
  yOffset: 5,
};

XAxisLabels.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  margins: PropTypes.shape({
    top: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  xOffset: PropTypes.number.isRequired,
  xScale: PropTypes.func.isRequired,
  yOffset: PropTypes.number.isRequired,
};

export default XAxisLabels;
