import React from 'react';
import PropTypes from 'prop-types';
import i18next from 'i18next';

import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../colors';
import styles from './EventTooltip.css';
import { EVENT_PUMP_SHUTDOWN } from '../../../utils/constants';

import tandemShutDownImage from './images/tandemShutDownImage.png';

const t = i18next.t.bind(i18next);

const EventTooltip = (props) => {
  const content = {
    [EVENT_PUMP_SHUTDOWN]: {
      title: t('Prior to this time, the pump was shut down'),
      description: t('Tidepool does not show data from before a pump is shut down. When the pump is turned off, its internal clock stops. This makes it hard to trust the timestamps on any data recorded right before shutdown. We can\'t verify that the device time was accurate at that point or correct for any clock drift that may have occurred.'),
      image: <img src={tandemShutDownImage} alt={t('Pump Shutdown')} />,
    },
  };

  const renderEvent = () => {
    const { title, description, image } = content[props.event?.tags?.event] || {};

    return (
      <div className={styles.wrapper}>
        <div className={styles.image}>{image}</div>
        <div className={styles.eventTitle}>{title}</div>
        <div className={styles.eventDescription}>{description}</div>
      </div>
    );
  };

  return (
    <Tooltip
      {...props}
      boxShadow="0px 4px 11px 0px rgba(0, 0, 0, 0.15)"
      content={renderEvent()}
    />
  );
};

EventTooltip.propTypes = {
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
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  borderRadius: PropTypes.number,
  showDividers: PropTypes.bool,
  event: PropTypes.shape({
    eventType: PropTypes.string,
    normalTime: PropTypes.number.isRequired,
  }).isRequired,
  timePrefs: PropTypes.object.isRequired,
};

EventTooltip.defaultProps = {
  annotations: [],
  tail: false,
  side: 'bottom',
  borderColor: colors.gray10,
  borderWidth: 1,
};

export default EventTooltip;
