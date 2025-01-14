import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import { VictoryLabel, VictoryTooltip, TextSize } from 'victory';

import colors from '../../../styles/colors.css';

/* eslint-disable no-underscore-dangle */

export const HoverBarLabel = props => {
  const {
    barWidth,
    isDisabled,
    datum = { _x: 0, _y: 0 },
    domain,
    scale = {
      x: _.noop,
      y: _.noop,
    },
    style = {},
    text,
    tooltipText,
    // Victory animate sometimes passes undefined to the y prop which errors out the label rendering
    // but eventually settles on the correct value for the final render, but we default to 15 (the lowest
    // common observed value) to avoid the error
    // There's a lot of strange behavior with animate and it's being completely rewritten
    // see: https://github.com/FormidableLabs/victory/issues/2104
    y = 15,
  } = props;

  const tooltipFontSize = _.min([barWidth / 2, 12]);
  const tooltipHeight = tooltipFontSize * 1.2;
  const tooltipRadius = tooltipHeight / 2;

  const disabled = isDisabled();

  const tooltipStyle = _.assign({}, style, {
    fontSize: tooltipFontSize,
    display: disabled ? 'none' : 'inherit',
  });

  const tooltipTextSize = TextSize.approximateTextSize(tooltipText(datum), tooltipStyle);

  const labelStyle = _.assign({}, style, {
    pointerEvents: 'none',
  });

  const labelUnitsStyle = _.assign({}, labelStyle, {
    fontSize: labelStyle.fontSize / 2,
    baselineShift: -((labelStyle.fontSize / 2) * 0.25),
    fill: colors.statDefault,
  });

  const labelText = text(datum);
  const labelUnitsTextSize = TextSize.approximateTextSize(labelText[1] || '', labelUnitsStyle);

  // Ensure that the datum y value isn't below zero, or the tooltip will be incorrectly positioned
  const tooltipDatum = {
    ...datum,
    _y: _.max([datum._y, 0]),
  };

  return (
    <g className="HoverBarLabel">
      <VictoryLabel
        {...props}
        text={labelText[0]}
        renderInPortal={false}
        style={labelStyle}
        textAnchor="end"
        verticalAnchor="middle"
        x={scale.y(domain.y[1])}
        y={y}
        dx={-(labelUnitsTextSize.width * 1.9)}
      />
      <VictoryLabel
        {...props}
        text={labelText[1]}
        renderInPortal={false}
        style={labelUnitsStyle}
        textAnchor="end"
        verticalAnchor="middle"
        x={scale.y(domain.y[1])}
        y={y}
        dx={0}
      />
      {tooltipTextSize.width > 0 && (
        <VictoryTooltip
          {...props}
          cornerRadius={tooltipRadius}
          datum={tooltipDatum}
          x={scale.y(domain.y[1]) - style.paddingLeft - tooltipTextSize.width - (tooltipRadius * 2)}
          y={y}
          dx={0}
          flyoutStyle={{
            display: disabled ? 'none' : 'inherit',
            stroke: colors.axis,
            strokeWidth: 2,
            fill: colors.white,
          }}
          flyoutWidth={tooltipTextSize.width + (tooltipRadius * 2)}
          flyoutHeight={tooltipHeight}
          pointerLength={0}
          pointerWidth={0}
          renderInPortal={false}
          text={tooltipText}
          style={tooltipStyle}
        />
      )}
    </g>
  );
};

HoverBarLabel.propTypes = {
  datum: PropTypes.object,
  domain: PropTypes.object.isRequired,
  scale: PropTypes.object,
  text: PropTypes.func,
  y: PropTypes.number,
};

HoverBarLabel.displayName = 'HoverBarLabel';

export default HoverBarLabel;
