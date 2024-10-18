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

import styles from './Header.css';

import i18next from 'i18next';
const t = i18next.t.bind(i18next);

class Header extends PureComponent {
  render() {
    return (
      <div>
        <ul className={`${styles.header} ${styles.headerExpanded}`}>
          <li className={styles.headerOuter}>
            <span className={styles.headerInner}>
              {t('Therapy Settings - Active at Upload on')} {this.props.deviceMeta.uploaded}
            </span>
          </li>
        </ul>
      </div>
    );
  }
}

Header.propTypes = {
  deviceMeta: PropTypes.object.isRequired,
};

export default Header;
