import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import get from 'lodash/get';

import { formatLocalizedFromUTC } from '../../../utils/datetime';
import { SETTINGS_OVERRIDE } from '../../../utils/constants';
import { getPumpVocabulary } from '../../../utils/device';
import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './PumpSettingsOverrideTooltip.css';

class PumpSettingsOverrideTooltip extends PureComponent {
  renderPumpSettingsOverride() {
    const vocabulary = getPumpVocabulary(get(this.props.override, 'source'));
    const overrideLabel = vocabulary[SETTINGS_OVERRIDE];
    const overrideType = get(vocabulary[get(this.props.override, 'overrideType')], 'label');

    const rows = [
      <div key={'override type'} className={styles.overrideType}>
        <div className={styles.label}>{overrideLabel}</div>
        <div className={styles.value}>{overrideType}</div>
      </div>,
    ];

    return <div className={styles.container}>{rows}</div>;
  }

  render() {
    const overrideType = get(this.props.override, 'overrideType');
    const start = get(this.props.override, 'normalTime');
    const end = get(this.props.override, 'normalEnd');

    const title = this.props.title ? this.props.title : (
      <div className={styles.title}>
        {[
          formatLocalizedFromUTC(start, this.props.timePrefs, 'h:mm a'),
          formatLocalizedFromUTC(end, this.props.timePrefs, 'h:mm a'),
        ].join(' - ')}
      </div>
    );
    return (
      <Tooltip
        {...this.props}
        title={title}
        content={this.renderPumpSettingsOverride()}
        borderColor={this.props.borderColor || colors[overrideType]}
        tailColor={this.props.tailColor || colors[overrideType]}
      />
    );
  }
}

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
    duration: PropTypes.number.isRequired,
    overrideType: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
    normalTime: PropTypes.number.isRequired,
  }).isRequired,
  timePrefs: PropTypes.object.isRequired,
};

PumpSettingsOverrideTooltip.defaultProps = {
  tail: false,
  side: 'top',
  offset: { top: -2, left: 0 },
  borderWidth: 2,
};

export default PumpSettingsOverrideTooltip;
