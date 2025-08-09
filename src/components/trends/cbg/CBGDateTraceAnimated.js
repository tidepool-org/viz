import _ from 'lodash';
import { TweenMax } from 'gsap';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { classifyBgValue } from '../../../utils/bloodglucose';

import styles from './CBGDateTraceAnimated.css';

export class CBGDateTraceAnimated extends PureComponent {
  static defaultProps = {
    animationDuration: 0.2,
    cbgRadius: 2.5,
  };

  static propTypes = {
    animationDuration: PropTypes.number.isRequired,
    bgBounds: PropTypes.shape({
      veryHighThreshold: PropTypes.number,
      targetUpperBound: PropTypes.number.isRequired,
      targetLowerBound: PropTypes.number.isRequired,
      veryLowThreshold: PropTypes.number,
    }).isRequired,
    bgUnits: PropTypes.string.isRequired,
    cbgRadius: PropTypes.number.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      // here only documenting the properties we actually use rather than the *whole* data model!
      id: PropTypes.string.isRequired,
      msPer24: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })).isRequired,
    date: PropTypes.string.isRequired,
    focusDateTrace: PropTypes.func.isRequired,
    onSelectDate: PropTypes.func.isRequired,
    topMargin: PropTypes.number.isRequired,
    unfocusDateTrace: PropTypes.func.isRequired,
    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
  }

  componentWillEnter(cb) {
    const { animationDuration, data } = this.props;
    const targets = _.map(data, (d) => (this[d.id]));
    TweenMax.staggerTo(
      targets, animationDuration, { opacity: 1, onComplete: cb }, animationDuration / targets.length
    );
  }

  componentWillLeave(cb) {
    const { animationDuration, data } = this.props;
    const targets = _.map(data, (d) => (this[d.id]));
    TweenMax.staggerTo(
      targets, animationDuration, { opacity: 0, onComplete: cb }, animationDuration / targets.length
    );
  }

  handleClick() {
    const { date, onSelectDate } = this.props;
    onSelectDate(date);
  }

  handleMouseOut() {
    const { unfocusDateTrace } = this.props;
    unfocusDateTrace();
  }

  render() {
    const { bgBounds, bgUnits, cbgRadius, data, date, topMargin, xScale, yScale } = this.props;

    return (
      <g id={`cbgDateTrace-${date}`}>
        {_.map(data, (d) => (
          <circle
            className={styles[classifyBgValue(bgBounds, bgUnits, d.value, 'fiveWay')]}
            cx={xScale(d.msPer24)}
            cy={yScale(d.value)}
            id={`cbgCircle-${d.id}`}
            key={d.id}
            onClick={this.handleClick}
            onMouseOver={() => {
              this.props.focusDateTrace(d, {
                left: xScale(d.msPer24),
                yPositions: {
                  top: yScale(d.value),
                  topMargin,
                },
              });
            }}
            onMouseOut={this.handleMouseOut}
            opacity={0}
            r={cbgRadius}
            ref={(node) => { this[d.id] = node; }}
          />
        ))}
      </g>
    );
  }
}

export default CBGDateTraceAnimated;
