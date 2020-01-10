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

import React, { PropTypes } from 'react';

import LabeledCheckbox from '../../common/controls/LabeledCheckbox';

import styles from './RangeSelect.css';

import i18next from 'i18next';
const t = i18next.t.bind(i18next);

export const RangeSelect = (props) => (
  <div className={styles.container}>
    <LabeledCheckbox
      checked={props.displayFlags.cbg100Enabled}
      name="hundred"
      label={t('100% of Readings')}
      onFn={props.updateCbgRange.bind(this, 'cbg100Enabled', true)}
      offFn={props.updateCbgRange.bind(this, 'cbg100Enabled', false)}
    />
    <LabeledCheckbox
      checked={props.displayFlags.cbg80Enabled}
      name="eighty"
      label={t('80% of Readings')}
      onFn={props.updateCbgRange.bind(this, 'cbg80Enabled', true)}
      offFn={props.updateCbgRange.bind(this, 'cbg80Enabled', false)}
    />
    <LabeledCheckbox
      checked={props.displayFlags.cbg50Enabled}
      name="fifty"
      label={t('50% of Readings')}
      onFn={props.updateCbgRange.bind(this, 'cbg50Enabled', true)}
      offFn={props.updateCbgRange.bind(this, 'cbg50Enabled', false)}
    />
    <LabeledCheckbox
      checked={props.displayFlags.cbgMedianEnabled}
      name="median"
      label={t('Median')}
      onFn={props.updateCbgRange.bind(this, 'cbgMedianEnabled', true)}
      offFn={props.updateCbgRange.bind(this, 'cbgMedianEnabled', false)}
    />
  </div>
);

RangeSelect.propTypes = {
  displayFlags: PropTypes.shape({
    cbg100Enabled: PropTypes.bool.isRequired,
    cbg80Enabled: PropTypes.bool.isRequired,
    cbg50Enabled: PropTypes.bool.isRequired,
    cbgMedianEnabled: PropTypes.bool.isRequired,
  }).isRequired,
  updateCbgRange: PropTypes.func.isRequired,
};

export default RangeSelect;
