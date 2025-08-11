import PropTypes from 'prop-types';
import React from 'react';
import get from 'lodash/get';
import i18next from 'i18next';

import { formatLocalizedFromUTC } from '../../../utils/datetime';
import { formatBgValue } from '../../../utils/format';
import { SETTINGS_OVERRIDE } from '../../../utils/constants';
import { getPumpVocabulary } from '../../../utils/device';
import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './PumpSettingsOverrideTooltip.css';

const t = i18next.t.bind(i18next);

const PumpSettingsOverrideTooltip = (props) => {
  const renderPumpSettingsOverride = () => {
    const vocabulary = getPumpVocabulary(get(props.override, 'source'));
    const overrideLabel = vocabulary[SETTINGS_OVERRIDE];
    const overrideType = get(vocabulary[get(props.override, 'overrideType')], 'label');
    const { low: targetLow, high: targetHigh } = get(props.override, 'bgTarget', {});
    const showTarget = targetLow && targetHigh;
    const bgUnits = get(props.bgPrefs, 'bgUnits');

    const rows = [
      <div key={'override type'} className={styles.overrideType}>
        <div className={showTarget ? styles.boldLabel : styles.label}>{overrideLabel}</div>
        <div className={styles.value}>{overrideType}</div>
      </div>,
    ];

    if (showTarget) {
      let value;
      if (targetLow === targetHigh) {
        value = `${formatBgValue(targetLow, props.bgPrefs)}`;
      } else {
        value = `${formatBgValue(targetLow, props.bgPrefs)}-${formatBgValue(targetHigh, props.bgPrefs)}`;
      }

      rows.push(
        <div className={styles.target}>
          <div className={styles.label}>{t('Correction Range')}{bgUnits ? ` (${bgUnits})` : ''}</div>
          <div className={styles.value}>{value}</div>
        </div>
      );
    }

    return <div className={styles.container}>{rows}</div>;
  };

  const overrideType = get(props.override, 'overrideType');
  const start = get(props.override, 'normalTime');
  const end = get(props.override, 'normalEnd');

  const title = props.title ? props.title : (
    <div className={styles.title}>
      {[
        formatLocalizedFromUTC(start, props.timePrefs, 'h:mm a'),
        formatLocalizedFromUTC(end, props.timePrefs, 'h:mm a'),
      ].join(' - ')}
    </div>
  );

  return (
    <Tooltip
      {...props}
      title={title}
      content={renderPumpSettingsOverride()}
      borderColor={props.borderColor || colors[overrideType]}
      tailColor={props.tailColor || colors[overrideType]}
    />
  );
};

PumpSettingsOverrideTooltip.propTypes = {
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
  tailColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number.isRequired,
  override: PropTypes.shape({
    normalEnd: PropTypes.number.isRequired,
    normalTime: PropTypes.number.isRequired,
    overrideType: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
  }).isRequired,
  timePrefs: PropTypes.object.isRequired,
  bgPrefs: PropTypes.object.isRequired,
};

PumpSettingsOverrideTooltip.defaultProps = {
  tail: false,
  side: 'top',
  offset: { top: -2, left: 0 },
  borderWidth: 2,
};

export default PumpSettingsOverrideTooltip;
