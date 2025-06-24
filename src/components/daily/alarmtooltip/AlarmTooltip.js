/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import i18next from 'i18next';

import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../colors';
import styles from './AlarmTooltip.css';
import { getPumpVocabulary } from '../../../utils/device';
import { formatClocktimeFromMsPer24, getMsPer24 } from '../../../utils/datetime';

const t = i18next.t.bind(i18next);

class AlarmTooltip extends PureComponent {
  constructor(props) {
    super(props);
    this.msPer24 = getMsPer24(props.alarm?.normalTime, props.timePrefs?.timezoneName);
    this.clockTime = formatClocktimeFromMsPer24(this.msPer24);
    this.deviceLabels = getPumpVocabulary(props.alarm?.source);
    this.alarmType = this.deviceLabels[props.alarm?.alarmType] || props.alarm?.alarmType || t('Unknown Alarm');
  }

  static propTypes = {
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

  static defaultProps = {
    annotations: [],
    tail: true,
    side: 'bottom',
    tailWidth: 16,
    tailHeight: 8,
    tailColor: colors.gray30,
    borderColor: colors.gray30,
    borderWidth: 2,
  };

  renderAlarm() {
    return (
      <div>
        <div className={styles.time}>{this.clockTime}</div>
        <div className={styles.title}>{t('Pump Alarm')}</div>
        <div className={styles.description}>{this.alarmType}</div>
      </div>
    );
  }

  render() {
    return (
      <Tooltip
        {...this.props}
        content={this.renderAlarm()}
      />
    );
  }
}

export default AlarmTooltip;
