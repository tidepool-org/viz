import _ from 'lodash';
import { gsap } from 'gsap';
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
    unfocusSlice: PropTypes.func.isRequired,
    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
  }

  componentWillEnter(cb) {
    this.animateOpacity(1, cb);
  }

  componentWillLeave(cb) {
    this.animateOpacity(0, cb);
  }

  /*
   * NB: `cb` MUST be invoked when the animation finishes, or TransitionGroupPlus will never
   * unmount a leaving date trace and its (invisible) circles stay in the DOM and hoverable.
   */
  animateOpacity(opacity, cb) {
    const { animationDuration, data } = this.props;
    const targets = _.compact(_.map(data, (d) => (this[d.id])));
    if (_.isEmpty(targets)) {
      cb();
      return;
    }
    gsap.to(targets, {
      opacity,
      duration: animationDuration,
      stagger: animationDuration / targets.length,
      overwrite: true,
      onComplete: cb,
    });
  }

  handleClick() {
    const { date, onSelectDate } = this.props;
    onSelectDate(date);
  }

  handleMouseOut(e) {
    const { unfocusDateTrace, unfocusSlice } = this.props;
    unfocusDateTrace();
    // the slice segment we rolled off of to get here skipped its own unfocus (see
    // CBGSliceSegment.handleMouseOut), so unless we're moving onto another cbg or a slice
    // (which will focus itself), the slice must be unfocused from here or it stays focused indefinitely
    const relatedId = _.get(e, 'relatedTarget.id', '');
    if (relatedId.search('cbgCircle') === -1 && relatedId.search('cbgSlice') === -1) {
      unfocusSlice();
    }
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
