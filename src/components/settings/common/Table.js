/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

/* global document */

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import _ from 'lodash';

import StatTooltip from '../../common/tooltips/StatTooltip';
import InfoIcon from '../../common/stat/assets/info-outline-24-px.png';
import styles from './Table.css';

class Table extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {};

    this.setTableRef = ref => {
      this.table = ref;
    };

    this.setTooltipIconRef = ref => {
      this.tooltipIcon = ref;
    };

    this.setRowTooltipIconRefs = {};
    this.rowTooltipIcons = {};

    _.each(props.rows, (row, index) => {
      if (row.annotations?.length) {
        this.setRowTooltipIconRefs[index] = ref => {
          this.rowTooltipIcons[index] = ref;
        };
      }
    });
  }

  getItemField(item, field) {
    return item[field];
  }

  normalizeColumns() {
    const getItemField = this.getItemField;
    const { columns } = this.props;

    return _.map(columns, (column) => ({
      cell: getItemField,
      className: column.className,
      key: column.key,
      label: column.label,
    }));
  }

  renderHeader(normalizedColumns) {
    const cells = _.map(normalizedColumns,
      (column, key) => {
        const { label } = column;
        if (typeof label === 'object' && _.isEqual(_.keys(label), ['main', 'secondary'])) {
          return (
            <th key={key} className={column.className}>
              {label.main}<span className={styles.secondaryLabelWithMain}>{label.secondary}</span>
            </th>
          );
        }
        return (
          <th key={key} className={styles.secondaryLabelAlone}>
            {label}
          </th>
        );
      }
    );
    return (<thead key={`thead_${cells.length}`}><tr>{cells}</tr></thead>);
  }

  renderAnnotation(annotation) {
    return <StatTooltip annotations={[annotation]} />;
  }

  renderRow(normalizedColumns, rowKey, rowData) {
    const cells = _.map(normalizedColumns,
      (column, columnIndex) => (
        <td key={column.key}>
          {column.cell(rowData, column.key)}
          {columnIndex === 0 && rowData.annotations?.length && (
            <span
              className={styles.rowTooltipIcon}
            >
              <img
                src={InfoIcon}
                alt="Hover for more info"
                ref={this.setRowTooltipIconRefs[rowKey]}
                onMouseOver={this.handleTooltipIconMouseOver.bind(this, 'rowTooltipIcons', rowKey)}
                onMouseOut={this.handleTooltipIconMouseOut}
              />
            </span>
          )}
        </td>
      )
    );
    return (<tr key={rowKey}>{cells}</tr>);
  }

  renderRows(normalizedColumns) {
    const rowData = _.map(this.props.rows, (row, key) => (
      this.renderRow(normalizedColumns, key, row)
    ));
    return (<tbody key={`tbody_${rowData.length}`}>{rowData}</tbody>);
  }

  renderTooltip = () => {
    const annotations = _.isFinite(this.state.activeRow)
      ? this.props.rows[this.state.activeRow]?.annotations
      : this.props.annotations;

    return (
      <div className={styles.TableTooltipWrapper}>
        <StatTooltip
          annotations={annotations}
          offset={this.state.messageTooltipOffset}
          position={this.state.messageTooltipPosition}
          showDividers={this.props.showTooltipDividers}
          side={this.state.messageTooltipSide}
        />
      </div>
    );
  };

  handleTooltipIconMouseOver = (refName, activeRow) => {
    const isRowTooltip = _.isFinite(activeRow);
    const ref = isRowTooltip ? this[refName][activeRow] : this[refName];
    const { top, left, width, height } = ref.getBoundingClientRect();
    const {
      top: parentTop,
      left: parentLeft,
      height: parentHeight,
    } = this.table.getBoundingClientRect();

    const position = {
      top: (top - parentTop) + height / 2,
      left: (left - parentLeft) + width / 2,
    };

    const offset = {
      horizontal: width / 2,
      top: -parentHeight,
    };

    const side = (_.get(document, 'body.clientWidth', 0) - left < 225) ? 'left' : 'right';

    this.setState({
      activeRow,
      showTooltip: true,
      messageTooltipPosition: position,
      messageTooltipOffset: offset,
      messageTooltipSide: side,
    });
  };

  handleTooltipIconMouseOut = () => {
    this.setState({
      showTooltip: false,
      activeRow: null,
    });
  };

  render() {
    const normalizedColumns = this.normalizeColumns();
    const hasColumnLabels = _.some(normalizedColumns, 'label');

    const tableContents = [
      this.renderRows(normalizedColumns),
    ];

    if (hasColumnLabels) tableContents.unshift(this.renderHeader(normalizedColumns));

    if (!_.isEmpty(this.props.title)) {
      const { className, label: { main, secondary } } = this.props.title;
      const title = (
        <caption
          key={main}
          className={className}
        >
          {main}<span className={styles.secondaryLabelWithMain}>{secondary}</span>
          {this.props.annotations && (
            <span
              className={styles.tooltipIcon}
            >
              <img
                src={InfoIcon}
                alt="Hover for more info"
                ref={this.setTooltipIconRef}
                onMouseOver={this.handleTooltipIconMouseOver.bind(this, 'tooltipIcon')}
                onMouseOut={this.handleTooltipIconMouseOut}
              />
            </span>
          )}
        </caption>
      );
      tableContents.unshift(title);
    }

    return (
      <>
        <table ref={this.setTableRef} className={this.props.tableStyle}>
          {tableContents}
        </table>
        {this.state.showTooltip && this.renderTooltip()}
      </>
    );
  }
}

Table.propTypes = {
  title: PropTypes.shape({
    className: PropTypes.string.isRequired,
    label: PropTypes.object.isRequired,
  }),
  rows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  tableStyle: PropTypes.string.isRequired,
  annotations: PropTypes.arrayOf(PropTypes.string),
  showTooltipDividers: PropTypes.bool,
};

Table.defaultProps = {
  showTooltipDividers: false,
};

export default Table;
