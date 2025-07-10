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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import styles from './Tooltip.css';
import colors from '../../../colors';

const Tooltip = (props) => {
  const [offset, setOffset] = useState({ top: 0, left: 0 });
  const elementRef = useRef(null);
  const titleElemRef = useRef(null);
  const tailElemRef = useRef(null);

  const calculateOffset = useCallback((currentProps) => {
    if (elementRef.current) {
      const {
        content,
        offset: propOffset,
        side,
        tail,
        tailHeight,
        tailWidth,
        title
      } = currentProps;
      const newOffset = {};
      const tooltipRect = elementRef.current.getBoundingClientRect();

      const titleElementHeightOffset = (title && content)
        ? titleElemRef.current?.getBoundingClientRect()?.height || 0
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
            newOffset.top = -tooltipRect.height + propOffset.top + verticalOffset;
            newOffset.left = -tooltipRect.width / 2 + propOffset.left;
            break;

          case 'bottom':
            newOffset.top = propOffset.top + verticalOffset;
            newOffset.left = -tooltipRect.width / 2 + propOffset.left;
            break;

          case 'right':
            newOffset.top = -(tooltipRect.height + titleElementHeightOffset) / 2 + propOffset.top;
            newOffset.left = horizontalOffset;
            break;

          case 'left':
          default:
            newOffset.top = -(tooltipRect.height + titleElementHeightOffset) / 2 + propOffset.top;
            newOffset.left = -tooltipRect.width + horizontalOffset;
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
        newOffset.top = topOffset + verticalOffset;
        newOffset.left = leftOffset + horizontalOffset;
      }

      setOffset(newOffset);
    }
  }, []);

  useEffect(() => {
    calculateOffset(props);

    // In cases where the tooltip CSS width is not statically set, we may need to re-caculate
    // the offset after updates to get the proper positioning after browser reflow is complete,
    // but before repaint happens. The second call within requestAnimationFrame ensures the tooltip
    // is properly positioned on the first render.
    requestAnimationFrame(() => {
      calculateOffset(props);
    });
  }, [props, calculateOffset]);

  const renderTail = () => {
    const {
      backgroundColor = 'white',
      borderColor,
      borderWidth,
      offset: propOffset,
      side,
      tailHeight,
      tailWidth,
    } = props;

    const titleElemRect = titleElemRef.current ? titleElemRef.current.getBoundingClientRect() : null;

    const tailColor = props.tailColor || backgroundColor;
    const tailStyle = {};
    let innerTailStyle = {};

    const renderInnerTail = tailColor !== borderColor;

    // Set the appropriate border color and width, and position based on tail direction
    switch (side) {
      case 'top':
        tailStyle.left = `calc(50% - ${propOffset.left || 0}px)`;
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
        tailStyle.left = `calc(50% - ${propOffset.left || 0}px)`;
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
        tailStyle.top = `calc(50% - ${propOffset.top || 0}px)`;
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
        tailStyle.top = `calc(50% - ${propOffset.top || 0}px)`;
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
          ref={tailElemRef}
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
  };

  const renderTitle = (title) => {
    const { tail, content } = props;
    let renderedTitle = null;
    if (title) {
      renderedTitle = (
        <div ref={titleElemRef} className={styles.title}>
          <span>{title}</span>
          {tail && !content && renderTail()}
        </div>
      );
    }
    return renderedTitle;
  };

  const renderContent = (content) => {
    let renderedContent = null;
    const { tail } = props;
    if (content) {
      renderedContent = (
        <div className={styles.content}>
          <span>{content}</span>
          {tail && renderTail()}
        </div>
      );
    }
    return renderedContent;
  };

  const { title, content, position, backgroundColor, borderColor, borderWidth } = props;
  const top = position.top + offset.top;
  const left = position.left + offset.left;

  return (
    <div
      className={styles.tooltip}
      style={{ top, left, backgroundColor, borderColor, borderWidth: `${borderWidth}px` }}
      ref={elementRef}
    >
      {title && renderTitle(title)}
      {content && renderContent(content)}
    </div>
  );
};

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
