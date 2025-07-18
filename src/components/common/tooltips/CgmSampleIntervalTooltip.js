import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';

import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './CgmSampleIntervalTooltip.css';

const CgmSampleIntervalTooltip = props => {
  const { t } = props;

  const renderContent = () => {
    const content = {
      title: t('Understanding your CGM Data'),
      subtitle: t('Your CGM provides two types of measurements:'),
      intervals: [
        {
          title: t('1. Real-time Data (1 min Data):'),
          annotations: [
            t('Updated every minute while wearing your device'),
            t('Used by your pump for automated insulin dosing'),
            t('May have gaps if connection is temporarily lost'),
            t('Not backfilled if your sensor loses connection with your phone'),
            t('Not used for the statistics we show in the sidebar or elsewhere in Tidepool'),
          ],
        },
        {
          title: t('2. Display Data (5 min Data):'),
          annotations: [
            t('Smoothed data created for easier viewing'),
            t('Not used by your pump for insulin decisions'),
            t('Automatically backfilled for up to 24 hours if connection is lost'),
            t('Used for the statistics we display in the sidebar and elsewhere in Tidepool'),
          ],
        },
      ],
    };

    return (
      <div className={styles.container}>
        <div className={styles.title}>{content.title}</div>
        <div className={styles.subtitle}>{content.subtitle}</div>

        {_.map(content.intervals, (interval, index) => (
          <div key={`interval-${index}`}>
            <div className={styles.row}>{interval.title}</div>

            <ul className={styles.annotations}>
              {_.map(interval.annotations, (annotation, annotationIndex) => (
                <li key={`annotation-${annotationIndex}`} className={styles.annotation}>{annotation}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Tooltip
      {...props}
      content={renderContent()}
    />
  );
};

CgmSampleIntervalTooltip.propTypes = {
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
};

CgmSampleIntervalTooltip.defaultProps = {
  annotations: [],
  tail: true,
  side: 'right',
  tailWidth: 9,
  tailHeight: 17,
  tailColor: colors.statDefault,
  borderColor: colors.statDefault,
  borderWidth: 2,
};

export default withTranslation()(CgmSampleIntervalTooltip);
