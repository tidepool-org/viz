import cx from 'classnames';
import PropTypes from 'prop-types';

import React from 'react';

import norgie from './norgie.css';
import styles from './TwoLineCollapsibleContainerLabel.css';

const TwoLineCollapsibleContainerLabel = (props) => {
  const { className, isOpened, label: { main, secondary, units }, onClick } = props;
  const containerClasses = cx({
    label: true, // for testing
    [styles.collapsibleLabel]: !Boolean(className),
    [styles.labelContainer]: true,
    [className]: Boolean(className),
  });
  const norgieContainerClasses = cx({
    [styles.norgieLabelContainer]: true,
    [norgie.opened]: isOpened,
  });
  return (
    <div className={containerClasses} onClick={onClick}>
      <div className={styles.secondaryLabel}>{secondary}</div>
      <div className={norgieContainerClasses}>
        <div>
          {main}
          <span className={styles.secondaryText}>{units}</span>
        </div>
      </div>
    </div>
  );
};

TwoLineCollapsibleContainerLabel.propTypes = {
  className: PropTypes.string,
  isOpened: PropTypes.bool.isRequired,
  label: PropTypes.shape({
    main: PropTypes.string.isRequired,
    secondary: PropTypes.string.isRequired,
    units: PropTypes.string.isRequired,
  }),
  onClick: PropTypes.func.isRequired,
};

export default TwoLineCollapsibleContainerLabel;
