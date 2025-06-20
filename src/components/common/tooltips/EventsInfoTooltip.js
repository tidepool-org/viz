import React from 'react';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';

import InfoTooltip from './InfoTooltip';

const EventsInfoTooltip = props => {
  const { t, ...tooltipProps } = props;

  const content = {
    title: t('Events Shown'),
    subtitle: t('Tidepool displays certain pump alarms, device time changes, and notes.'),
    sections: [
      {
        title: t('Pump Alarms Shown'),
        note: t('Please note that not all pump alarms are shown.'),
        items: [
          t('Insulin Delivery Stopped'),
          t('Pump Auto-Off'),
          t('Reservoir Empty'),
          t('Battery Power Out'),
          t('Occlusion Detected or Line Blocked'),
          t('Insulin Delivery Limit Exceeded'),
        ],
      },
    ]
  };

  return <InfoTooltip {...tooltipProps} content={content} />;
};

EventsInfoTooltip.propTypes = InfoTooltip.propTypes;
EventsInfoTooltip.defaultProps = InfoTooltip.defaultProps;

export default withTranslation()(EventsInfoTooltip);
