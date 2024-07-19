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
import _ from 'lodash';

import { formatLocalizedFromUTC } from '../../../utils/datetime';

import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './FoodTooltip.css';
import i18next from 'i18next';
import { MS_IN_HOUR } from '../../../utils/constants';
import { isLoop } from '../../../utils/device';
import { is } from 'bluebird';

const t = i18next.t.bind(i18next);

class FoodTooltip extends PureComponent {
  getAbsorptionTime(food) {
    return _.round(_.get(food, 'nutrition.estimatedAbsorptionDuration', 0) * 1000 / MS_IN_HOUR, 1);
  }

  getCarbs(food) {
    return _.round(_.get(food, 'nutrition.carbohydrate.net', 0), 1);
  }

  getName(food) {
    return _.get(food, 'name');
  }


  renderFood() {
    const food = this.props.food;

    const rows = [
      <div key={'carb'} className={styles.carb}>
        <div className={styles.label}>{t('Carbs')}</div>
        <div className={styles.value}>
          {`${this.getCarbs(food)}`}
        </div>
        <div className={styles.units}>g</div>
      </div>,
    ];

    if (isLoop(food)) {
      const absorptionTime = this.getAbsorptionTime(food);
      const name = this.getName(food);
      const latestUpdatedTime = food.payload?.userUpdatedDate;
      const timeOfEntry = food.payload?.userCreatedDate !== food.normalTime ? food.payload?.userCreatedDate : undefined;

      rows.unshift(...[
        (
          <div key={'name'} className={styles.row}>
            <div className={styles.label}>{t('Type')}</div>
            <div className={styles.value}>
              {`${name}`}
            </div>
          </div>
        ),
        (
          <div key={'absorption'} className={styles.row}>
            <div className={styles.label}>{t('Absorption Time (hrs)')}</div>
            <div className={styles.value}>
              {`${absorptionTime}`}
            </div>
            <div className={styles.units}>hr</div>
          </div>
        )
      ]);

      if (latestUpdatedTime || timeOfEntry) {
        rows.push(<div className={styles.divider} />)

        if (latestUpdatedTime) {
          rows.push((
            <div key={'latestUpdatedTime'} className={styles.row}>
              <div className={styles.label}>{t('Last Edited')}</div>
              <div className={styles.value}>
                {formatLocalizedFromUTC(latestUpdatedTime, this.props.timePrefs, 'h:mm')}
              </div>
              <div className={styles.units}>
                {formatLocalizedFromUTC(latestUpdatedTime, this.props.timePrefs, 'a')}
              </div>
            </div>
          ))
        } else {
          rows.push((
            <div key={'timeOfEntry'} className={styles.row}>
              <div className={styles.label}>{t('Time of Entry')}</div>
              <div className={styles.value}>
                {formatLocalizedFromUTC(timeOfEntry, this.props.timePrefs, 'h:mm')}
              </div>
              <div className={styles.units}>
                {formatLocalizedFromUTC(timeOfEntry, this.props.timePrefs, 'a')}
              </div>
            </div>
          ))
        }
      }
    }

    return <div className={styles.container}>{rows}</div>;
  }

  render() {
    const title = this.props.title ? this.props.title : (
      <div className={styles.title}>
        {formatLocalizedFromUTC(this.props.food.normalTime, this.props.timePrefs, 'h:mm a')}
      </div>
    );
    return (
      <Tooltip
        {...this.props}
        title={title}
        content={this.renderFood()}
      />
    );
  }
}

FoodTooltip.propTypes = {
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
  food: PropTypes.shape({
    nutrition: PropTypes.shape({
      carbohydrate: PropTypes.shape({
        net: PropTypes.number.isRequired,
        units: PropTypes.string.isRequired,
      }).isRequired,
      estimatedAbsorptionDuration: PropTypes.number,
    }).isRequired,
  }).isRequired,
  timePrefs: PropTypes.object.isRequired,
};

FoodTooltip.defaultProps = {
  tail: true,
  side: 'right',
  tailWidth: 9,
  tailHeight: 17,
  tailColor: colors.bolus,
  borderColor: colors.bolus,
  borderWidth: 2,
};

export default FoodTooltip;
