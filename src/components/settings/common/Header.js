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

import React from 'react';

import styles from './Header.css';

class Header extends React.Component {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = { serialNumberExpanded: false };
  }

  handleClick() {
    this.setState({ serialNumberExpanded: !this.state.serialNumberExpanded });
  }

  render() {
    const headerClass = this.state.serialNumberExpanded ?
      styles.headerExpanded :
      styles.headerClosed;

    return (
      <div>
        <ul className={`${styles.header} ${headerClass}`} onClick={this.handleClick}>
          <li className={styles.headerOuter}>
            <span className={styles.headerInner}>{this.props.deviceType}</span>
          </li>
          <li className={styles.headerOuter}>
            <span className={styles.headerInner}>Uploaded on {this.props.deviceMeta.uploaded}</span>
          </li>
          <li className={styles.headerOuter}>
            <span className={styles.headerInner}>
              Serial Number: {this.props.deviceMeta.serial}
            </span>
          </li>
        </ul>
      </div>
    );
  }
}

Header.propTypes = {
  deviceType: React.PropTypes.string.isRequired,
  deviceMeta: React.PropTypes.object.isRequired,
};

export default Header;
