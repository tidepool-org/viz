import React from 'react';
import { withTranslation } from 'react-i18next';

import InfoTooltip from './InfoTooltip';

const EventsInfoTooltip = props => {
  const { t, ...tooltipProps } = props;

  const content = {
    title: t('Events Shown'),
    subtitle: t('Tidepool displays certain pump alarms, device time changes, and notes.'),
    sections: [
      {
        title: t('Pump Alarms Shown'),
        note: t('Please note that pump alarms are only shown for twiist devices and not all alarms are shown.'),
        items: [
          t('Reservoir Empty'),
          t('Battery Empty'),
          t('Line Blocked'),
        ],
      },
    ]
  };

  return <InfoTooltip {...tooltipProps} content={content} offset={{ top: 60, left: 0 }} />;
};

EventsInfoTooltip.propTypes = InfoTooltip.propTypes;
EventsInfoTooltip.defaultProps = InfoTooltip.defaultProps;

export default withTranslation()(EventsInfoTooltip);
