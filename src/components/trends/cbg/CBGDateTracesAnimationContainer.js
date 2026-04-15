import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import TransitionGroupPlus from 'react-transition-group-plus';

import CBGDateTraceAnimated from './CBGDateTraceAnimated';

const CBGDateTracesAnimationContainer = (props) => {
  const { bgBounds, bgUnits, data, dates, topMargin, xScale, yScale } = props;
  return (
    <TransitionGroupPlus component="g" id="cbgDateTraces" transitionMode="simultaneous">
      {_.map(dates, (localDate) => (
        <CBGDateTraceAnimated
          bgBounds={bgBounds}
          bgUnits={bgUnits}
          data={data[localDate]}
          date={localDate}
          focusDateTrace={props.focusCbgDateTrace}
          unfocusDateTrace={props.unfocusCbgDateTrace}
          key={localDate}
          onSelectDate={props.onSelectDate}
          topMargin={topMargin}
          xScale={xScale}
          yScale={yScale}
        />
      ))}
    </TransitionGroupPlus>
  );
};

CBGDateTracesAnimationContainer.propTypes = {
  bgBounds: PropTypes.shape({
    veryHighThreshold: PropTypes.number,
    targetUpperBound: PropTypes.number.isRequired,
    targetLowerBound: PropTypes.number.isRequired,
    veryLowThreshold: PropTypes.number,
  }).isRequired,
  data: PropTypes.object,
  dates: PropTypes.arrayOf(PropTypes.string),
  focusCbgDateTrace: PropTypes.func.isRequired,
  unfocusCbgDateTrace: PropTypes.func.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  topMargin: PropTypes.number.isRequired,
  xScale: PropTypes.func.isRequired,
  yScale: PropTypes.func.isRequired,
};

export default CBGDateTracesAnimationContainer;
