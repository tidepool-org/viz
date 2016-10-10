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
import _ from 'lodash';

import { THREE_HRS } from '../../../utils/datetime';
import { findBinForTimeOfDay } from '../../../utils/trends/data';

import styles from './SMBGDayPoints.css';

const SMBGDayPoints = (props) => {
  const { data } = props;
  if (!data) {
    return null;
  }

  const { day, xScale, yScale, grouped } = props;
  const radius = 7;

  return (
    <g id={`smbgDayPoints-${day}`}>
      {_.map(data, (smbg) => {
        const focus = () => {
          console.log('focused on: ', smbg);
        };
        const unfocus = () => {
          console.log('unfocus:', smbg.id);
        };
        const xPosition = (msPer24) => {
          if (grouped) {
            return xScale(findBinForTimeOfDay(THREE_HRS, msPer24));
          }
          return xScale(msPer24);
        };

        return (
          <circle
            className={styles.smbg}
            key={`smbg-${smbg.id}`}
            id={`smbg-${smbg.id}`}
            onMouseOver={focus}
            onMouseOut={unfocus}
            cx={xPosition(smbg.msPer24)}
            cy={yScale(smbg.value)}
            r={radius}
          />
        );
      })}
    </g>
  );
};

SMBGDayPoints.propTypes = {
  day: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    msPer24: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  })).isRequired,
  xScale: PropTypes.func.isRequired,
  yScale: PropTypes.func.isRequired,
  grouped: PropTypes.bool.isRequired,
  //focusSmbg: PropTypes.func.isRequired,
  //unfocusSmbg: PropTypes.func.isRequired,
};

export default SMBGDayPoints;
