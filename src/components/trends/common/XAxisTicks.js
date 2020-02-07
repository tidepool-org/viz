import _ from 'lodash';
import { range } from 'd3-array';
import PropTypes from 'prop-types';

import React from 'react';

import * as datetime from '../../../utils/datetime';

import styles from './XAxisTicks.css';

const XAxisTicks = (props) => {
  const { data, margins, tickLength, xScale } = props;
  return (
    <g id="xAxisTicks">
      {_.map(data, (msInDay) => (
        <line
          className={styles.tick}
          key={msInDay}
          x1={xScale(msInDay)}
          x2={xScale(msInDay)}
          y1={margins.top}
          y2={margins.top - tickLength}
        />
      ))}
    </g>
  );
};

XAxisTicks.defaultProps = {
  data: _.map(range(0, 9), (i) => (i * datetime.THREE_HRS)),
  tickLength: 15,
};

XAxisTicks.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  margins: PropTypes.shape({
    top: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  tickLength: PropTypes.number.isRequired,
  xScale: PropTypes.func.isRequired,
};

export default XAxisTicks;
