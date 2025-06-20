import React from 'react';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';

import InfoTooltip from './InfoTooltip';

const CgmSampleIntervalTooltip = props => {
  const { t, ...tooltipProps } = props;

  const content = {
    title: t('Understanding your CGM Data'),
    subtitle: t('Your CGM provides two types of measurements:'),
    sections: [
      {
        title: t('1. Real-time Data (1min Data):'),
        items: [
          t('Updated every minute while wearing your device'),
          t('Used by your pump for automated insulin dosing'),
          t('May have gaps if connection is temporarily lost'),
          t('Not backfilled if your sensor loses connection with your phone'),
          t('Not used for the statistics we show in the sidebar or elsewhere in Tidepool'),
        ],
      },
      {
        title: t('2. Display Data (5min Data):'),
        items: [
          t('Smoothed data created for easier viewing'),
          t('Not used by your pump for insulin decisions'),
          t('Automatically backfilled for up to 24 hours if connection is lost'),
          t('Used for the statistics we display in the sidebar and elsewhere in Tidepool'),
        ],
      },
    ]
  };

  return <InfoTooltip {...tooltipProps} content={content} />;
};

CgmSampleIntervalTooltip.propTypes = InfoTooltip.propTypes;
CgmSampleIntervalTooltip.defaultProps = InfoTooltip.defaultProps;

export default withTranslation()(CgmSampleIntervalTooltip);
