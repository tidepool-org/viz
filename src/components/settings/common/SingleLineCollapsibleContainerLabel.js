import _ from 'lodash';
import cx from 'classnames';
import PropTypes from 'prop-types';

import React from 'react';

import norgie from './norgie.css';
import styles from './SingleLineCollapsibleContainerLabel.css';

const SingleLineCollapsibleContainerLabel = (props) => {
  const { className, isOpened, label: { main, secondary, units }, onClick } = props;
  const containerClasses = cx({
    label: true, // for testing
    [styles.collapsibleLabel]: !Boolean(className),
    [styles.labelContainer]: true,
    [className]: Boolean(className),
    [norgie.opened]: isOpened,
  });
  return (
    <div className={containerClasses} onClick={onClick}>
      <div>
        <span className={styles.mainText}>{main}</span>
        {_.isEmpty(secondary) ?
          null : (<span className={styles.secondaryText}>{secondary}</span>)}
        {_.isEmpty(units) ?
          null : (<span className={styles.secondaryText}>{units}</span>)}
      </div>
    </div>
  );
};

SingleLineCollapsibleContainerLabel.propTypes = {
  className: PropTypes.string,
  isOpened: PropTypes.bool.isRequired,
  label: PropTypes.shape({
    main: PropTypes.string.isRequired,
    secondary: PropTypes.string.isRequired,
    units: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default SingleLineCollapsibleContainerLabel;
