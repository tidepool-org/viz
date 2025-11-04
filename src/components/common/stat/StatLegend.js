import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import _ from 'lodash';

import colors from '../../../styles/colors.css';
import styles from './StatLegend.css';

class StatLegend extends PureComponent {
  static propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      legendTitle: PropTypes.string,
    })).isRequired,
  };

  static displayName = 'StatLegend';

  renderLegendItems = (items) => (
    _.map(items, (item) => (
      <li
        className={styles.StatLegendItem}
        key={item.id}
        style={{ borderBottomColor: colors[item.id] }}
      >
        <span className={styles.StatLegendTitle}>
          {item.legendTitle}
        </span>

        <div
          className={styles.LegendPattern}
          style={this.getLegendPatternStyle(item)}
        />
      </li>
    ))
  );

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
      <ul className={styles.StatLegend}>
        {this.renderLegendItems(this.props.items)}
      </ul>
    );
  }
}

export default StatLegend;
