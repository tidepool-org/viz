import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './InfoTooltip.css';

const InfoTooltip = props => {
  const { content, ...tooltipProps } = props;

  const renderContent = () => {
    return (
      <div className={styles.container}>
        {content.title && <div className={styles.title}>{content.title}</div>}
        {content.subtitle && <div className={styles.subtitle}>{content.subtitle}</div>}

        {_.map(content.sections, (section, index) => (
          <div key={`section-${index}`}>
            {section.title && <div className={styles.row}>{section.title}</div>}

            {section.items.length && (
              <ul className={styles.items}>
                {_.map(section.items, (item, itemIndex) => (
                  <li key={`item-${itemIndex}`} className={styles.item}>{item}</li>
                ))}
              </ul>
            )}

            {section.note && <div className={styles.note}>{section.note}</div>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Tooltip
      {...tooltipProps}
      content={renderContent()}
    />
  );
};

InfoTooltip.propTypes = {
  ...Tooltip.propTypes,
  content: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    sections: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string,
      note: PropTypes.string,
      items: PropTypes.arrayOf(PropTypes.string),
    })),
  }).isRequired,
};

InfoTooltip.defaultProps = {
  content: {
    title: null,
    subtitle: null,
    sections: [],
  },
  tail: true,
  side: 'right',
  tailWidth: 9,
  tailHeight: 17,
  tailColor: colors.statDefault,
  borderColor: colors.statDefault,
  borderWidth: 2,
  offset: { top: 0, left: 0 },
};

export default InfoTooltip;
