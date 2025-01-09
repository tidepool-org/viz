import PropTypes from 'prop-types';
import React from 'react';
import { Bar, Rect } from 'victory';
import _ from 'lodash';

import colors from '../../../styles/colors.css';

export const HoverBar = props => {
  const {
    barSpacing,
    barWidth,
    chartLabelWidth,
    cornerRadius,
    domain,
    index,
    scale = {
      x: _.noop,
      y: _.noop,
    },
    width,
    x
  } = props;

  const barGridWidth = barWidth / 6;
  const barGridRadius = _.get(cornerRadius, 'top', 2);
  const widthCorrection = (width - chartLabelWidth) / width;

  return (
    <g className="HoverBar">
      <g className="HoverBarTarget" pointerEvents="all">
        <Rect
          {...props}
          x={0}
          y={scale.x(index + 1) - (barWidth / 2) - (barSpacing / 2)}
          rx={barGridRadius}
          ry={barGridRadius}
          width={scale.y(domain.y[1])}
          height={barWidth + barSpacing}
          style={{
            stroke: 'transparent',
            fill: 'transparent',
          }}
          {...props.events}
        />
      </g>
      <g className="barBg" pointerEvents="none">
        <Rect
          {...props}
          x={0}
          y={scale.x(index + 1) - (barGridWidth / 2)}
          rx={barGridRadius}
          ry={barGridRadius}
          width={scale.y(domain.y[1]) - chartLabelWidth}
          height={barGridWidth}
          style={{
            stroke: 'transparent',
            fill: colors.axis,
          }}
        />
      </g>
      <g pointerEvents="none">
        <Bar
          {...props}
          width={scale.y(domain.x[1]) - chartLabelWidth}
          x={x * widthCorrection}
        />
      </g>
    </g>
  );
};

HoverBar.propTypes = {
  chartLabelWidth: PropTypes.number,
  domain: PropTypes.object.isRequired,
  scale: PropTypes.object,
  y: PropTypes.number,
};

HoverBar.displayName = 'HoverBar';

export default HoverBar;
