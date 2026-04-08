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

import { formatLocalizedFromUTC } from '../../../utils/datetime';
import { MS_IN_HOUR, MS_IN_MIN } from '../../../utils/constants';
import { isLoop } from '../../../utils/device';
import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './FoodTooltip.css';

const t = i18next.t.bind(i18next);

export const getAbsorptionTime = (food) => _.round(_.get(food, 'nutrition.estimatedAbsorptionDuration', 0) * 1000 / MS_IN_HOUR, 1);

export const getCarbs = (food) => _.round(_.get(food, 'nutrition.carbohydrate.net', 0), 1);

export const getName = (food) => _.get(food, 'name');

const FoodTooltip = (props) => {
  const renderFood = () => {
    const food = props.food;
    const isManual = food?.tags?.manual;

    const rows = [
      <div key={'carb'} className={styles.carb}>
        <div className={styles.label}>{t('Carbs')}</div>
        <div className={styles.value}>
          {`${getCarbs(food)}`}
        </div>
        <div className={styles.units}>g</div>
      </div>,
    ];

    if (isManual) {
      rows.push(
        <div key={'manual'} className={styles.row}>
          <div className={styles.label}>{t('Source')}</div>
          <div className={styles.value}>
            {t('Manual')}
          </div>
        </div>
      );
    }

    if (isLoop(food)) {
      const dosingDecisions = food.dosingDecisions;
      const absorptionTime = getAbsorptionTime(food);
      const name = getName(food);

      if (absorptionTime > 0) {
        rows.unshift(
          <div key={'absorption'} className={styles.row}>
            <div className={styles.label}>{t('Absorption Time (hrs)')}</div>
            <div className={styles.value}>
              {`${absorptionTime}`}
            </div>
            <div className={styles.units}>hr</div>
          </div>
        );
      }

      if (!_.isEmpty(name)) {
        rows.unshift(
          <div key={'name'} className={styles.row}>
            <div className={styles.label}>{t('Type')}</div>
            <div className={styles.value}>
              {`${name}`}
            </div>
          </div>
        );
      }

      if (dosingDecisions && dosingDecisions.length > 0) {
        const firstDD = dosingDecisions[0];
        const latestDD = dosingDecisions.length > 1 ? dosingDecisions[dosingDecisions.length - 1] : null;

        const currentCarbs = getCarbs(food);
        const originalCarbs = latestDD?.originalFood?.nutrition?.carbohydrate?.net
          ?? firstDD?.originalFood?.nutrition?.carbohydrate?.net;
        const carbsWereEdited = originalCarbs != null && originalCarbs !== currentCarbs;

        // Update the carbs row label
        const carbRowIndex = rows.findIndex(r => r.key === 'carb');
        if (carbRowIndex !== -1) {
          rows[carbRowIndex] = (
            <div key={'carb'} className={styles.carb}>
              <div className={styles.label}>{carbsWereEdited ? t('Total Carbs (Edited)') : t('Total Carbs')}</div>
              <div className={styles.value}>{`${currentCarbs}`}</div>
              <div className={styles.units}>g</div>
            </div>
          );
        }

        const foodNormalTimeMs = _.isFinite(food.normalTime) ? food.normalTime : Date.parse(food.normalTime);
        const entryTimeDiffExceedsThreshold = _.isFinite(foodNormalTimeMs)
          && Math.abs(firstDD.time - foodNormalTimeMs) > 5 * MS_IN_MIN;
        const showDivider = carbsWereEdited || entryTimeDiffExceedsThreshold;

        if (showDivider) {
          rows.push(<div key={'divider'} className={styles.divider} />);
        }

        if (carbsWereEdited) {
          rows.push(
            <div key={'initialCarbs'} className={styles.row}>
              <div className={styles.label}>{t('Initial Carb Amount')}</div>
              <div className={styles.value}>{`${_.round(originalCarbs, 1)}`}</div>
              <div className={styles.units}>g</div>
            </div>
          );

          if (latestDD) {
            rows.push(
              <div key={'timeEntered'} className={styles.row}>
                <div className={styles.label}>{t('Time Entered')}</div>
                <div className={styles.value}>
                  {formatLocalizedFromUTC(firstDD.time, props.timePrefs, 'h:mm')}
                </div>
                <div className={styles.units}>
                  {formatLocalizedFromUTC(firstDD.time, props.timePrefs, 'a')}
                </div>
              </div>
            );
            rows.push(
              <div key={'timeLastEdited'} className={styles.row}>
                <div className={styles.label}>{t('Time Last Edited')}</div>
                <div className={styles.value}>
                  {formatLocalizedFromUTC(latestDD.time, props.timePrefs, 'h:mm')}
                </div>
                <div className={styles.units}>
                  {formatLocalizedFromUTC(latestDD.time, props.timePrefs, 'a')}
                </div>
              </div>
            );
          } else {
            rows.push(
              <div key={'timeEdited'} className={styles.row}>
                <div className={styles.label}>{t('Time Edited')}</div>
                <div className={styles.value}>
                  {formatLocalizedFromUTC(firstDD.time, props.timePrefs, 'h:mm')}
                </div>
                <div className={styles.units}>
                  {formatLocalizedFromUTC(firstDD.time, props.timePrefs, 'a')}
                </div>
              </div>
            );
          }
        } else {
          if (entryTimeDiffExceedsThreshold) {
            rows.push(
              <div key={'timeEntered'} className={styles.row}>
                <div className={styles.label}>{t('Time Entered')}</div>
                <div className={styles.value}>
                  {formatLocalizedFromUTC(firstDD.time, props.timePrefs, 'h:mm')}
                </div>
                <div className={styles.units}>
                  {formatLocalizedFromUTC(firstDD.time, props.timePrefs, 'a')}
                </div>
              </div>
            );
          }
        }
      }
    }

    return <div className={styles.container}>{rows}</div>;
  };

  const title = props.title ? props.title : (
    <div className={styles.title}>
      {formatLocalizedFromUTC(props.food.normalTime, props.timePrefs, 'h:mm a')}
    </div>
  );

  return (
    <Tooltip
      {...props}
      title={title}
      content={renderFood()}
    />
  );
};

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
  tailWidth: 8,
  tailHeight: 16,
  tailColor: colors.bolus,
  borderColor: colors.bolus,
  borderWidth: 2,
};

export default FoodTooltip;
