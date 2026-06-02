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
import moment from 'moment';
import _ from 'lodash';
import i18next from 'i18next';

import { formatLocalizedFromUTC } from '../../../utils/datetime';
import { MS_IN_HOUR } from '../../../utils/constants';
import { isLoop, isTrio } from '../../../utils/device';
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

    if (isLoop(food) || isTrio(food)) {
      const { dosingDecision, originalDosingDecision } = food;
      const absorptionTime = getAbsorptionTime(food);
      const name = getName(food);
      const latestUpdatedTime = food.payload?.userUpdatedDate;
      const timeOfEntry = moment.utc(food.payload?.userCreatedDate).valueOf() !== food.normalTime ? food.payload?.userCreatedDate : undefined;

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

      if (dosingDecision) {
        const currentCarbs = getCarbs(food);
        // Initial carb amount comes from the earliest DD in the edit chain,
        // preferring its immutable `originalFood` snapshot over `food`. On
        // multi-edit chains the latest DD has no originalFood, and intermediate
        // DDs' food has been rewritten to the final value -- so reading either
        // of those would surface the post-edit number.
        const earliestDosingDecision = originalDosingDecision || dosingDecision;
        const originalCarbs = earliestDosingDecision.originalFood?.nutrition?.carbohydrate?.net
          ?? earliestDosingDecision.food?.nutrition?.carbohydrate?.net;
        const carbsWereEdited = food.tags?.carbsEdited;
        const editedLabel = currentCarbs === 0 ? t('Deleted') : t('Edited');
        const entryTimeDiffExceedsThreshold = food.tags?.entryTimeDiffers;

        // Update the carbs row label
        const carbRowIndex = _.findIndex(rows, r => r.key === 'carb');
        if (carbRowIndex !== -1) {
          rows[carbRowIndex] = (
            <div key={'carb'} className={styles.carb}>
              <div className={styles.label}>{carbsWereEdited ? t('Total Carbs ({{editedLabel}})', { editedLabel }) : t('Total Carbs')}</div>
              <div className={styles.value}>{`${currentCarbs}`}</div>
              <div className={styles.units}>g</div>
            </div>
          );
        }

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

          if (originalDosingDecision && entryTimeDiffExceedsThreshold) {
            rows.push(
              <div key={'timeEntered'} className={styles.row}>
                <div className={styles.label}>{t('Time Entered')}</div>
                <div className={styles.value}>
                  {formatLocalizedFromUTC(originalDosingDecision.time, props.timePrefs, 'h:mm')}
                </div>
                <div className={styles.units}>
                  {formatLocalizedFromUTC(originalDosingDecision.time, props.timePrefs, 'a')}
                </div>
              </div>
            );
          }

          // Only show "Time Edited" when a genuine later edit decision exists. An
          // originalDosingDecision means a multi-decision chain, so `dosingDecision` is a
          // real post-entry edit. For a single-decision edit -- e.g. a twiist deletion,
          // which encodes the whole change in one decision -- `dosingDecision` IS the entry
          // decision, so its time is the entry time, not the edit. The source doesn't carry
          // the edit time on a linkable record there, so suppress rather than mislabel; the
          // payload-based "Last Edited" row below still surfaces a real edit time if present.
          if (originalDosingDecision) {
            rows.push(
              <div key={'timeEdited'} className={styles.row}>
                <div className={styles.label}>{t('Time Edited')}</div>
                <div className={styles.value}>
                  {formatLocalizedFromUTC(dosingDecision.time, props.timePrefs, 'h:mm')}
                </div>
                <div className={styles.units}>
                  {formatLocalizedFromUTC(dosingDecision.time, props.timePrefs, 'a')}
                </div>
              </div>
            );
          }
        } else if (entryTimeDiffExceedsThreshold) {
          // Prefer the original-entry decision's time (a time edit's original entry);
          // fall back to the lone decision's time for a back-logged entry with no lineage.
          const enteredTimeDecision = originalDosingDecision || dosingDecision;
          rows.push(
            <div key={'timeEntered'} className={styles.row}>
              <div className={styles.label}>{t('Time Entered')}</div>
              <div className={styles.value}>
                {formatLocalizedFromUTC(enteredTimeDecision.time, props.timePrefs, 'h:mm')}
              </div>
              <div className={styles.units}>
                {formatLocalizedFromUTC(enteredTimeDecision.time, props.timePrefs, 'a')}
              </div>
            </div>
          );
        }
      }

      // Skip the payload-based timestamp row only when the DD-driven "Time Edited" row
      // above actually rendered (a multi-decision chain), to avoid a duplicate. For a
      // single-decision edit we suppressed "Time Edited" above, so let the payload
      // "Last Edited" row surface here when the source carries one.
      const carbsEditedHandledAbove = !!originalDosingDecision && food.tags?.carbsEdited;
      if (!carbsEditedHandledAbove && (latestUpdatedTime || timeOfEntry)) {
        rows.push(<div key={'divider'} className={styles.divider} />);

        if (latestUpdatedTime) {
          rows.push((
            <div key={'latestUpdatedTime'} className={styles.row}>
              <div className={styles.label}>{t('Last Edited')}</div>
              <div className={styles.value}>
                {formatLocalizedFromUTC(latestUpdatedTime, props.timePrefs, 'h:mm')}
              </div>
              <div className={styles.units}>
                {formatLocalizedFromUTC(latestUpdatedTime, props.timePrefs, 'a')}
              </div>
            </div>
          ));
        } else {
          rows.push((
            <div key={'timeOfEntry'} className={styles.row}>
              <div className={styles.label}>{t('Time of Entry')}</div>
              <div className={styles.value}>
                {formatLocalizedFromUTC(timeOfEntry, props.timePrefs, 'h:mm')}
              </div>
              <div className={styles.units}>
                {formatLocalizedFromUTC(timeOfEntry, props.timePrefs, 'a')}
              </div>
            </div>
          ));
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
