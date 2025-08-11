import React from 'react';
import PropTypes from 'prop-types';
import i18next from 'i18next';

import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../colors';
import styles from './AlarmTooltip.css';
import { getPumpVocabulary } from '../../../utils/device';
import { formatClocktimeFromMsPer24, getMsPer24 } from '../../../utils/datetime';

import {
  ALARM_NO_DELIVERY,
  ALARM_AUTO_OFF,
  ALARM_NO_INSULIN,
  ALARM_NO_POWER,
  ALARM_OCCLUSION,
  ALARM_OVER_LIMIT,
} from '../../../utils/constants';

const t = i18next.t.bind(i18next);

const AlarmTooltip = (props) => {
  const msPer24 = getMsPer24(props.alarm?.normalTime, props.timePrefs?.timezoneName);
  const clockTime = formatClocktimeFromMsPer24(msPer24);
  const deviceLabels = getPumpVocabulary(props.alarm?.source);
  const alarmType = deviceLabels[props.alarm?.alarmType] || props.alarm?.alarmType || t('Unknown Alarm');

  const renderAlarm = () => {
    let deviceAlarmTitle;

    switch (props.alarm?.alarmType) {
      case ALARM_NO_DELIVERY:
      case ALARM_AUTO_OFF:
      case ALARM_NO_INSULIN:
      case ALARM_NO_POWER:
      case ALARM_OCCLUSION:
      case ALARM_OVER_LIMIT:
        deviceAlarmTitle = t('Pump Alarm');
        break;
      default:
        deviceAlarmTitle = t('Device Alarm');
        break;
    }

    return (
      <div>
        <div className={styles.time}>{clockTime}</div>
        <div className={styles.deviceAlarmTitle}>{deviceAlarmTitle}</div>
        <div className={styles.alarmType}>{alarmType}</div>
      </div>
    );
  };

  return (
    <Tooltip
      {...props}
      content={renderAlarm()}
    />
  );
};

AlarmTooltip.propTypes = {
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
  alarm: PropTypes.shape({
    alarmType: PropTypes.string,
    normalTime: PropTypes.number.isRequired,
  }).isRequired,
  timePrefs: PropTypes.object.isRequired,
};

AlarmTooltip.defaultProps = {
  annotations: [],
  tail: true,
  side: 'bottom',
  tailWidth: 16,
  tailHeight: 8,
  tailColor: colors.gray30,
  borderColor: colors.gray30,
  borderWidth: 2,
};

export default AlarmTooltip;
