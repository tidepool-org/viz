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
import React from 'react';
import _ from 'lodash';
import i18next from 'i18next';
import {
  classifyBgValue,
  reshapeBgClassesToBgBounds,
  getOutOfRangeThreshold,
} from '../../../utils/bloodglucose';
import { formatBgValue } from '../../../utils/format';
import { formatLocalizedFromUTC } from '../../../utils/datetime';
import { getOutOfRangeAnnotationMessage } from '../../../utils/annotations';
import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './CBGTooltip.css';

const t = i18next.t.bind(i18next);

const CBGTooltip = (props) => {
  const bgUnits = props.bgPrefs?.bgUnits || '';

  const renderCBG = () => {
    const cbg = props.cbg;
    const outOfRangeMessage = getOutOfRangeAnnotationMessage(cbg);
    const rows = [
      <div key={'bg'} className={styles.bg}>
        <div className={styles.label}>{t('Glucose')} ({bgUnits})</div>
        <div className={styles.value}>
          {`${formatBgValue(cbg.value, props.bgPrefs, getOutOfRangeThreshold(cbg))}`}
        </div>
      </div>,
    ];
    if (!_.isEmpty(outOfRangeMessage)) {
      const bgClass = classifyBgValue(
        reshapeBgClassesToBgBounds(props.bgPrefs),
        props.bgPrefs.bgUnits,
        props.cbg.value,
        'fiveWay'
      );
      rows.push(
        <div
          key={'divider'}
          className={styles.divider}
          style={{ backgroundColor: colors[bgClass] }}
        />
      );
      rows.push(
        <div key={'outOfRange'} className={styles.annotation}>
          {outOfRangeMessage[0].message.value}
        </div>
      );
    }

    return <div className={styles.container}>{rows}</div>;
  };

  const bgClass = classifyBgValue(
    reshapeBgClassesToBgBounds(props.bgPrefs),
    props.bgPrefs.bgUnits,
    props.cbg.value,
    'fiveWay'
  );
  const title = props.title ? props.title : (
    <div className={styles.title}>
      {formatLocalizedFromUTC(props.cbg.normalTime, props.timePrefs, 'h:mm a')}
    </div>
  );

  return (
    <Tooltip
      {...props}
      title={title}
      content={renderCBG()}
      borderColor={colors[bgClass]}
      tailColor={colors[bgClass]}
    />
  );
};

CBGTooltip.propTypes = {
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  offset: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number,
    horizontal: PropTypes.number,
  }),
  titls: PropTypes.node,
  tail: PropTypes.bool.isRequired,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']).isRequired,
  tailColor: PropTypes.string.isRequired,
  tailWidth: PropTypes.number.isRequired,
  tailHeight: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string.isRequired,
  borderWidth: PropTypes.number.isRequired,
  cbg: PropTypes.shape({
    type: PropTypes.string.isRequired,
    units: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  }).isRequired,
  timePrefs: PropTypes.object.isRequired,
  bgPrefs: PropTypes.shape({
    bgClasses: PropTypes.object.isRequired,
    bgUnits: PropTypes.string.isRequired,
  }).isRequired,
};

CBGTooltip.defaultProps = {
  tail: true,
  side: 'right',
  tailWidth: 8,
  tailHeight: 16,
  tailColor: colors.bolus,
  borderColor: colors.bolus,
  borderWidth: 2,
};

export default CBGTooltip;
