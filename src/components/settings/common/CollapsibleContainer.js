import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Collapse } from 'react-collapse';

import SingleLineCollapsibleContainerLabel from './SingleLineCollapsibleContainerLabel';
import TwoLineCollapsibleContainerLabel from './TwoLineCollapsibleContainerLabel';

import styles from './CollapsibleContainer.css';

const CollapsibleContainer = (props) => {
  const { label, labelClass, opened, toggleExpansion } = props;
  let renderedLabel = (
    <SingleLineCollapsibleContainerLabel
      className={labelClass}
      isOpened={opened}
      label={label}
      onClick={toggleExpansion}
    />
  );
  const { twoLineLabel, label: { secondary } } = props;
  if (twoLineLabel && !_.isEmpty(secondary)) {
    renderedLabel = (
      <TwoLineCollapsibleContainerLabel
        className={labelClass}
        isOpened={opened}
        label={label}
        onClick={toggleExpansion}
      />
    );
  }

  return (
    <div>
      {renderedLabel}
      <Collapse
        className={styles.collapsibleContainer}
        isOpened={opened}
        springConfig={{ stiffness: 120, damping: 20 }}
      >
        <div>{props.children}</div>
      </Collapse>
    </div>
  );
};

CollapsibleContainer.defaultProps = {
  twoLineLabel: true,
};

CollapsibleContainer.propTypes = {
  children: PropTypes.element.isRequired,
  label: PropTypes.shape({
    main: PropTypes.string.isRequired,
    secondary: PropTypes.string.isRequired,
    units: PropTypes.string.isRequired,
  }).isRequired,
  labelClass: PropTypes.string.isRequired,
  opened: PropTypes.bool.isRequired,
  toggleExpansion: PropTypes.func.isRequired,
  twoLineLabel: PropTypes.bool,
};

export default CollapsibleContainer;
