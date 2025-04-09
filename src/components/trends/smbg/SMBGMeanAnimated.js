import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { TransitionMotion, spring } from 'react-motion';

import { classifyBgValue } from '../../../utils/bloodglucose';
import { springConfig } from '../../../utils/constants';
import withDefaultYPosition from '../common/withDefaultYPosition';

import SMBGMean from './SMBGMean';

import styles from './SMBGMeanAnimated.css';

export class SMBGMeanAnimated extends PureComponent {
  static defaultProps = {
    meanHeight: 10,
    meanWidth: 108,
  };

  static propTypes = {
    bgBounds: PropTypes.shape({
      veryHighThreshold: PropTypes.number.isRequired,
      targetUpperBound: PropTypes.number.isRequired,
      targetLowerBound: PropTypes.number.isRequired,
      veryLowThreshold: PropTypes.number.isRequired,
    }).isRequired,
    bgUnits: PropTypes.string.isRequired,
    datum: PropTypes.shape({
      id: PropTypes.string.isRequired,
      max: PropTypes.number,
      mean: PropTypes.number,
      min: PropTypes.number,
      msX: PropTypes.number.isRequired,
      msFrom: PropTypes.number.isRequired,
      msTo: PropTypes.number.isRequired,
    }),
    defaultY: PropTypes.number.isRequired,
    focusSmbgRange: PropTypes.func.isRequired,
    unfocusSmbgRange: PropTypes.func.isRequired,
    meanHeight: PropTypes.number.isRequired,
    someSmbgDataIsFocused: PropTypes.bool.isRequired,
    tooltipLeftThreshold: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.willEnter = this.willEnter.bind(this);
    this.willLeave = this.willLeave.bind(this);
  }

  willEnter() {
    const { defaultY } = this.props;
    return {
      y: defaultY,
      height: 0,
      opacity: 0,
    };
  }

  willLeave() {
    const { defaultY, meanHeight } = this.props;
    const shrinkOut = spring(0, springConfig);
    return {
      y: spring(defaultY, springConfig),
      height: spring(meanHeight, springConfig),
      opacity: shrinkOut,
    };
  }

  render() {
    const {
      bgBounds, bgUnits, datum, defaultY, meanHeight, someSmbgDataIsFocused, width, xScale, yScale,
    } = this.props;

    const xPos = xScale(datum.msX);
    const yPositions = {
      min: yScale(datum.min),
      mean: yScale(datum.mean),
      max: yScale(datum.max),
    };

    const bgValueClassification = classifyBgValue(bgBounds, bgUnits, datum.mean, 'fiveWay');

    const meanClasses = datum.mean ?
      cx({
        [styles.smbgMean]: true,
        [styles[`${bgValueClassification}FadeIn`]]: !someSmbgDataIsFocused,
        [styles[`${bgValueClassification}FadeOut`]]: someSmbgDataIsFocused,
      }) :
      cx({
        [styles.smbgMean]: true,
        [styles.transparent]: true,
      });

    const binLeftX = xScale(datum.msX) - width / 2 + styles.stroke / 2;
    const meanWidth = width - styles.stroke;

    return (
      <TransitionMotion
        defaultStyles={[{
          key: datum.id,
          style: {
            y: defaultY,
            height: 0,
            opacity: 0,
          },
        }]}
        styles={datum.min ? [{
          key: datum.id,
          style: {
            y: spring(yPositions.mean - meanHeight / 2, springConfig),
            height: spring(meanHeight, springConfig),
            opacity: spring(1.0, springConfig),
          },
        }] : []}
        willEnter={this.willEnter}
        willLeave={this.willLeave}
      >
        {(interpolated) => {
          if (interpolated.length === 0) {
            return null;
          }
          return (
            <SMBGMean
              classes={meanClasses}
              datum={datum}
              focusRange={this.props.focusSmbgRange}
              unfocusRange={this.props.unfocusSmbgRange}
              interpolated={interpolated[0]}
              positionData={{
                left: xPos,
                tooltipLeft: datum.msX > this.props.tooltipLeftThreshold,
                yPositions,
              }}
              width={meanWidth}
              x={binLeftX}
            />
          );
        }}
      </TransitionMotion>
    );
  }
}

export default withDefaultYPosition(SMBGMeanAnimated);
