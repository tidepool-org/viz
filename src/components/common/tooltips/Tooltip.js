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

/* global requestAnimationFrame */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './Tooltip.css';
import colors from '../../../colors';

class Tooltip extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { offset: { top: 0, left: 0 } };

    this.setElementRef = ref => {
      this.element = ref;
    };

    this.setTitleElemRef = ref => {
      this.titleElem = ref;
    };

    this.setTailElemRef = ref => {
      this.tailElem = ref;
    };
  }

  componentDidMount() {
    this.calculateOffset(this.props);

    // In cases where the tooltip CSS width is not statically set, we may need to re-caculate
    // the offset after updates to get the proper positioning after browser reflow is complete,
    // but before repaint happens. The second call within requestAnimationFrame ensures the tooltip
    // is properly positioned on the first render.
    requestAnimationFrame(() => {
      this.calculateOffset(this.props);
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.calculateOffset(nextProps);
  }

  calculateOffset(currentProps) {
    if (this.element) {
      const {
        content,
        offset: propOffset,
        side,
        tail,
        tailHeight,
        tailWidth,
        title
      } = currentProps;
      const offset = {};
      const tooltipRect = this.element.getBoundingClientRect();

      const titleElementHeightOffset = (title && content)
        ? this.titleElem?.getBoundingClientRect()?.height || 0
        : 0;

      const horizontalTailOffset = tail ? tailWidth * 2 : 0;
      const verticalTailOffset = tail ? tailHeight * 2 : 0;

      let horizontalOffset = horizontalTailOffset + ((propOffset.left != null)
        ? propOffset.left
        : (propOffset.horizontal || 0));

      if (side === 'left') {
        horizontalOffset = -horizontalOffset;
      }

      let verticalOffset = verticalTailOffset + ((propOffset.top != null)
        ? propOffset.top
        : (propOffset.vertical || 0));

      if (side === 'top') {
        verticalOffset = -verticalOffset;
      }

      if (tail) {
        // Position tooltip accounting for tail on all sides
        switch (side) {
          case 'top':
            offset.top = -tooltipRect.height + propOffset.top + verticalOffset;
            offset.left = -tooltipRect.width / 2 + propOffset.left;
            break;

          case 'bottom':
            offset.top = propOffset.top + verticalOffset;
            offset.left = -tooltipRect.width / 2 + propOffset.left;
            break;

          case 'right':
            offset.top = -(tooltipRect.height + titleElementHeightOffset) / 2 + propOffset.top;
            offset.left = horizontalOffset;
            break;

          case 'left':
          default:
            offset.top = -(tooltipRect.height + titleElementHeightOffset) / 2 + propOffset.top;
            offset.left = -tooltipRect.width + horizontalOffset;
        }
      } else {
        let leftOffset = 0;
        let topOffset = 0;

        switch (side) {
          case 'top':
            leftOffset = -tooltipRect.width / 2;
            topOffset = -tooltipRect.height;
            break;

          case 'bottom':
            leftOffset = -tooltipRect.width / 2;
            topOffset = 0;
            break;

          case 'right':
            leftOffset = 0;
            topOffset = -tooltipRect.height / 2;
            break;

          case 'left':
          default:
            leftOffset = -tooltipRect.width;
            topOffset = -tooltipRect.height / 2;
        }
        offset.top = topOffset + verticalOffset;
        offset.left = leftOffset + horizontalOffset;
      }

      this.setState({ offset });
    }
  }

  renderTail() {
    const {
      backgroundColor = 'white',
      borderColor,
      borderWidth,
      offset,
      side,
      tailHeight,
      tailWidth,
    } = this.props;

    const titleElemRect = this.titleElem ? this.titleElem.getBoundingClientRect() : null;

    const tailColor = this.props.tailColor || backgroundColor;
    const tailStyle = {};
    let innerTailStyle = {};

    const renderInnerTail = tailColor !== borderColor;

    // Set the appropriate border color and width, and position based on tail direction
    switch (side) {
      case 'top':
        tailStyle.left = `calc(50% - ${offset.left || 0}px)`;
        tailStyle.borderTopColor = borderColor;
        tailStyle.borderWidth = `${(tailHeight * 2) + borderWidth}px ${tailWidth + borderWidth}px`;

        if (renderInnerTail) {
          innerTailStyle = {
            ...tailStyle,
            top: `calc(100% - ${borderWidth + Math.ceil(tailHeight / tailWidth)}px)`,
            borderTopColor: tailColor,
          };
        }
        break;

      case 'bottom':
        tailStyle.left = `calc(50% - ${offset.left || 0}px)`;
        tailStyle.bottom = `calc(100% + ${titleElemRect?.height || 0}px)`;
        tailStyle.borderBottomColor = borderColor;
        tailStyle.borderWidth = `${(tailHeight * 2) + borderWidth}px ${tailWidth + borderWidth}px`;

        if (renderInnerTail) {
          innerTailStyle = {
            ...tailStyle,
            bottom: `calc(100% + ${titleElemRect?.height || 0}px - ${borderWidth + Math.ceil(tailHeight / tailWidth)}px)`,
            borderBottomColor: tailColor,
          };
        }
        break;

      case 'right':
        tailStyle.top = `calc(50% - ${offset.top || 0}px)`;
        tailStyle.borderRightColor = borderColor;
        tailStyle.borderWidth = `${tailHeight + borderWidth}px ${(tailWidth * 2) + borderWidth}px`;

        if (renderInnerTail) {
          innerTailStyle = {
            ...tailStyle,
            right: `calc(100% - ${borderWidth + (tailWidth / tailHeight)}px)`,
            borderRightColor: tailColor,
          };
        }
        break;

      case 'left':
      default:
        tailStyle.top = `calc(50% - ${offset.top || 0}px)`;
        tailStyle.borderLeftColor = borderColor;
        tailStyle.borderWidth = `${tailHeight + borderWidth}px ${(tailWidth * 2) + borderWidth}px`;

        if (renderInnerTail) {
          innerTailStyle = {
            ...tailStyle,
            left: `calc(100% - ${borderWidth + Math.ceil(tailWidth / tailHeight)}px)`,
            borderLeftColor: tailColor,
          };
        }
        break;
    }

    return (
      <div style={{ position: 'static' }}>
        <div
          ref={this.setTailElemRef}
          className={`${styles.tail} ${styles[side]}`}
          style={tailStyle}
        />

        {renderInnerTail && (
          <div
            className={`${styles.tail} ${styles[side]}`}
            style={innerTailStyle}
          />
        )}
      </div>
    );
  }

  renderTitle(title) {
    const { tail, content } = this.props;
    let renderedTitle = null;
    if (title) {
      renderedTitle = (
        <div ref={this.setTitleElemRef} className={styles.title}>
          <span>{title}</span>
          {tail && !content && this.renderTail()}
        </div>
      );
    }
    return renderedTitle;
  }

  renderContent(content) {
    let renderedContent = null;
    const { tail } = this.props;
    if (content) {
      renderedContent = (
        <div className={styles.content}>
          <span>{content}</span>
          {tail && this.renderTail()}
        </div>
      );
    }
    return renderedContent;
  }

  render() {
    const { title, content, position, backgroundColor, borderColor, borderWidth } = this.props;
    const { offset } = this.state;
    const top = position.top + offset.top;
    const left = position.left + offset.left;

    return (
      <div
        className={styles.tooltip}
        style={{ top, left, backgroundColor, borderColor, borderWidth: `${borderWidth}px` }}
        ref={this.setElementRef}
      >
        {title && this.renderTitle(title)}
        {content && this.renderContent(content)}
      </div>
    );
  }
}

Tooltip.displayName = 'Tooltip';

Tooltip.propTypes = {
  title: PropTypes.node,
  content: PropTypes.node,
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  offset: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number,
    horizontal: PropTypes.number,
  }).isRequired,
  tail: PropTypes.bool.isRequired,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']).isRequired,
  tailWidth: PropTypes.number.isRequired,
  tailHeight: PropTypes.number.isRequired,
  tailColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string.isRequired,
  borderWidth: PropTypes.number.isRequired,
};

Tooltip.defaultProps = {
  tail: true,
  side: 'left',
  tailWidth: 8,
  tailHeight: 8,
  borderColor: 'black',
  borderWidth: 2,
  offset: { top: 0, left: 0 },
};

export default Tooltip;
