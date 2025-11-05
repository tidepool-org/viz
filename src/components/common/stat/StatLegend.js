import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import _ from 'lodash';

import colors from '../../../styles/colors.css';
import styles from './StatLegend.css';
import InfoIcon from './assets/info-outline-24-px.png';
import StatTooltip from '../tooltips/StatTooltip';

class StatLegend extends PureComponent {
  constructor(props) {
    super(props);

    this.initialState = {
      hoveredItem: null, // Track which item is being hovered
      messageTooltipPosition: { top: 0, left: 0 },
      messageTooltipOffset: { top: 0, left: 0, horizontal: 0 },
      messageTooltipSide: 'top',
    };

    this.state = this.initialState;
  }

  setLegendRef = ref => {
    this.legend = ref;
  };

  // Create individual refs for each tooltip icon
  setTooltipIconRef = (itemId) => (ref) => {
    if (!this.tooltipRefs) this.tooltipRefs = {};
    this.tooltipRefs[itemId] = ref;
  };

  handleTooltipIconMouseOver = (item) => () => {
    const tooltipIcon = this.tooltipRefs[item.id];

    if (tooltipIcon) {
      const { top, left, width, height } = tooltipIcon.getBoundingClientRect();

      const {
        top: parentTop,
        left: parentLeft,
      } = this.legend.getBoundingClientRect();

      const position = {
        top: ((top - parentTop) + height / 2),
        left: (left - parentLeft) + width / 2,
      };

      const offset = {
        horizontal: width / 2,
        top: 0,
      };

      const side = (_.get(document, 'body.clientWidth', 0) - left < 225) ? 'left' : 'right';

      this.setState({
        hoveredItem: item,
        messageTooltipPosition: position,
        messageTooltipOffset: offset,
        messageTooltipSide: side,
      });
    }
  };

  handleTooltipIconMouseOut = () => {
    this.setState(this.initialState);
  };

  static propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      legendTitle: PropTypes.string,
      pattern: PropTypes.shape({
        id: PropTypes.string,
        color: PropTypes.string,
      }),
      annotations: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
  };

  static displayName = 'StatLegend';

  renderLegendItems = (items) => (
    _.map(items, (item) => (
      <li
        className={styles.StatLegendItemWrapper}
        key={item.id}
      >
        <div className={styles.StatLegendItem}>
          <span className={styles.StatLegendTitle}>
            {item.legendTitle}
          </span>

          <div
            className={styles.LegendPattern}
            style={this.getLegendPatternStyle(item)}
          />
        </div>

        {item.annotations && (
          <span className={styles.tooltipIcon}>
            <img
              src={InfoIcon}
              alt="Hover for more info"
              ref={this.setTooltipIconRef(item.id)}
              onMouseOver={this.handleTooltipIconMouseOver(item)}
              onMouseOut={this.handleTooltipIconMouseOut}
            />
          </span>
        )}
      </li>
    ))
  );

  renderTooltip = () => {
    const { hoveredItem } = this.state;


    if (!hoveredItem || !hoveredItem.annotations) {
      return null;
    }

    return (
      <div className={styles.LegendTooltipWrapper}>
        <StatTooltip
          annotations={hoveredItem.annotations}
          offset={this.state.messageTooltipOffset}
          position={this.state.messageTooltipPosition}
          side={this.state.messageTooltipSide}
        />
      </div>
    );
  };

  getLegendPatternStyle = (item) => {
    if (item.pattern?.id === 'diagonalStripes') {
      return {
        backgroundColor: colors[item.id],
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          ${item.pattern.color} 0px,
          ${item.pattern.color} 2px,
          transparent 2px,
          transparent 5px
        )`
      };
    }

    return { backgroundColor: colors[item.id] };
  };

  render() {
    return (
      <ul
        className={styles.StatLegend}
        ref={this.setLegendRef}
      >
        {this.renderLegendItems(this.props.items)}
        {this.renderTooltip()}
      </ul>
    );
  }
}

export default StatLegend;
