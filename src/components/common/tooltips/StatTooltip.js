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

import PropTypes from 'prop-types';
import React from 'react';
import Markdown from 'react-markdown';
import _ from 'lodash';
import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './StatTooltip.css';

const StatTooltip = (props) => {
  const renderMessages = () => {
    const annotations = props.annotations;
    const rows = [];

    _.each(annotations, (message, index) => {
      rows.push(
        <Markdown
          key={`message-${index}`}
          className={styles.message}
          children={message}
          linkTarget="_blank"
        />
      );
      if (index !== annotations.length - 1) {
        rows.push(
          <div
            key={`divider-${index}`}
            className={props.showDividers ? styles.divider : styles.hiddenDivider}
          />
        );
      }
    });

    return <div className={styles.container}>{rows}</div>;
  };

  return (
    <Tooltip
      {...props}
      content={renderMessages()}
    />
  );
};

StatTooltip.propTypes = {
  annotations: PropTypes.arrayOf(PropTypes.string),
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  offset: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number,
    horizontal: PropTypes.number,
  }),
  title: PropTypes.node,
  tail: PropTypes.bool.isRequired,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']).isRequired,
  tailColor: PropTypes.string.isRequired,
  tailWidth: PropTypes.number.isRequired,
  tailHeight: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string.isRequired,
  borderWidth: PropTypes.number.isRequired,
  showDividers: PropTypes.bool,
};

StatTooltip.defaultProps = {
  annotations: [],
  tail: true,
  side: 'right',
  tailWidth: 8,
  tailHeight: 16,
  tailColor: colors.statDefault,
  borderColor: colors.statDefault,
  borderWidth: 2,
  showDividers: true,
};

export default StatTooltip;
