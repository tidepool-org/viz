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

import _ from 'lodash';
import bows from 'bows';
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { utcDay } from 'd3-time';
import moment from 'moment-timezone';
import React, { PropTypes, PureComponent } from 'react';

import TrendsSVGContainer from './TrendsSVGContainer';

import {
  CGM_READINGS_ONE_DAY,
  MGDL_CLAMP_TOP,
  MMOLL_CLAMP_TOP,
  MGDL_UNITS,
  MMOLL_UNITS,
  trends,
  CGM_DATA_KEY,
  BGM_DATA_KEY,
} from '../../../utils/constants';

import * as datetime from '../../../utils/datetime';
import { weightedCGMCount } from '../../../utils/bloodglucose';

const { extentSizes: { ONE_WEEK, TWO_WEEKS, FOUR_WEEKS } } = trends;

/**
 * getAllDatesInRange
 * @param {String} start - Zulu timestamp (Integer hammertime also OK)
 * @param {String} end - Zulu timestamp (Integer hammertime also OK)
 * @param {Object} timePrefs - object containing timezoneAware Boolean and timezoneName String
 *
 * @return {Array} dates - array of YYYY-MM-DD String dates
 */
export function getAllDatesInRange(start, end, timePrefs) {
  const timezoneName = datetime.getTimezoneFromTimePrefs(timePrefs);
  const dates = [];
  const current = moment.utc(start)
    .tz(timezoneName);
  const excludedBoundary = moment.utc(end);
  while (current.isBefore(excludedBoundary)) {
    dates.push(current.format('YYYY-MM-DD'));
    current.add(1, 'day');
  }
  return dates;
}

/**
 * getLocalizedNoonBeforeUTC
 * @param {String} utc - Zulu timestamp (Integer hammertime also OK)
 * @param {Object} timePrefs - object containing timezoneAware Boolean and timezoneName String
 *
 * @return {JavaScript Date} the closet noon before the input datetime in the given timezone
 */
export function getLocalizedNoonBeforeUTC(utc, timePrefs) {
  if (utc instanceof Date) {
    throw new Error('`utc` must be a ISO-formatted String timestamp or integer hammertime!');
  }
  const timezone = datetime.getTimezoneFromTimePrefs(timePrefs);
  const ceil = datetime.getLocalizedCeiling(utc, timePrefs);
  return moment.utc(ceil.valueOf())
    .tz(timezone)
    .subtract(1, 'day')
    .hours(12)
    .toDate();
}

/**
 * getLocalizedOffset
 * @param {String} utc - Zulu timestamp (Integer hammertime also OK)
 * @param {Object} offset - { amount: integer (+/-), units: 'hour', 'day', &c }
 * @param {Object} timePrefs - object containing timezoneAware Boolean and timezoneName String
 *
 * @return {JavaScript Date} datetime at the specified +/- offset from the input datetime
 *                           inspired by d3-time's offset function: https://github.com/d3/d3-time#interval_offset
 *                           but able to work with an arbitrary timezone
 */
export function getLocalizedOffset(utc, offset, timePrefs) {
  if (utc instanceof Date) {
    throw new Error('`utc` must be a ISO-formatted String timestamp or integer hammertime!');
  }
  const timezone = datetime.getTimezoneFromTimePrefs(timePrefs);
  return moment.utc(utc)
    .tz(timezone)
    .add(offset.amount, offset.units)
    .toDate();
}

export class TrendsContainer extends PureComponent {
  static propTypes = {
    activeDays: PropTypes.shape({
      monday: PropTypes.bool.isRequired,
      tuesday: PropTypes.bool.isRequired,
      wednesday: PropTypes.bool.isRequired,
      thursday: PropTypes.bool.isRequired,
      friday: PropTypes.bool.isRequired,
      saturday: PropTypes.bool.isRequired,
      sunday: PropTypes.bool.isRequired,
    }).isRequired,
    bgPrefs: PropTypes.shape({
      bgBounds: PropTypes.shape({
        veryHighThreshold: PropTypes.number.isRequired,
        targetUpperBound: PropTypes.number.isRequired,
        targetLowerBound: PropTypes.number.isRequired,
        veryLowThreshold: PropTypes.number.isRequired,
      }).isRequired,
      bgUnits: PropTypes.oneOf([MGDL_UNITS, MMOLL_UNITS]).isRequired,
    }).isRequired,
    currentPatientInViewId: PropTypes.string.isRequired,
    extentSize: PropTypes.oneOf([ONE_WEEK, TWO_WEEKS, FOUR_WEEKS]).isRequired,
    initialDatetimeLocation: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    mostRecentDatetimeLocation: PropTypes.string,
    queryDataCount: PropTypes.number.isRequired,
    showingSmbg: PropTypes.bool.isRequired,
    showingCbg: PropTypes.bool.isRequired,
    smbgRangeOverlay: PropTypes.bool.isRequired,
    smbgGrouped: PropTypes.bool.isRequired,
    smbgLines: PropTypes.bool.isRequired,
    timePrefs: PropTypes.shape({
      timezoneAware: PropTypes.bool.isRequired,
      timezoneName: React.PropTypes.string,
    }).isRequired,
    yScaleClampTop: PropTypes.shape({
      [MGDL_UNITS]: PropTypes.number.isRequired,
      [MMOLL_UNITS]: PropTypes.number.isRequired,
    }).isRequired,
    // data
    data: PropTypes.object.isRequired,
    // handlers
    markTrendsViewed: PropTypes.func.isRequired,
    onDatetimeLocationChange: PropTypes.func.isRequired,
    onSelectDate: PropTypes.func.isRequired,
    onSwitchBgDataSource: PropTypes.func.isRequired,
    // viz state
    cbgFlags: PropTypes.shape({
      cbg100Enabled: PropTypes.bool.isRequired,
      cbg80Enabled: PropTypes.bool.isRequired,
      cbg50Enabled: PropTypes.bool.isRequired,
      cbgMedianEnabled: PropTypes.bool.isRequired,
    }).isRequired,
    focusedCbgSlice: PropTypes.shape({
      data: PropTypes.shape({
        firstQuartile: PropTypes.number.isRequired,
        id: PropTypes.string.isRequired,
        max: PropTypes.number.isRequired,
        median: PropTypes.number.isRequired,
        min: PropTypes.number.isRequired,
        msFrom: PropTypes.number.isRequired,
        msTo: PropTypes.number.isRequired,
        msX: PropTypes.number.isRequired,
        ninetiethQuantile: PropTypes.number.isRequired,
        tenthQuantile: PropTypes.number.isRequired,
        thirdQuartile: PropTypes.number.isRequired,
      }),
      position: PropTypes.shape({
        left: PropTypes.number.isRequired,
        tooltipLeft: PropTypes.bool.isRequired,
        topOptions: PropTypes.shape({
          firstQuartile: PropTypes.number.isRequired,
          max: PropTypes.number.isRequired,
          median: PropTypes.number.isRequired,
          min: PropTypes.number.isRequired,
          ninetiethQuantile: PropTypes.number.isRequired,
          tenthQuantile: PropTypes.number.isRequired,
          thirdQuartile: PropTypes.number.isRequired,
        }),
      }),
    }),
    focusedCbgSliceKeys: PropTypes.arrayOf(PropTypes.oneOf([
      'firstQuartile',
      'max',
      'median',
      'min',
      'ninetiethQuantile',
      'tenthQuantile',
      'thirdQuartile',
    ])),
    focusedSmbg: PropTypes.shape({
      allPositions: PropTypes.arrayOf(PropTypes.shape({
        top: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired,
      })),
      allSmbgsOnDate: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.number.isRequired,
      })),
      date: PropTypes.string.isRequired,
      datum: PropTypes.shape({
        value: PropTypes.number.isRequired,
      }),
      position: PropTypes.shape({
        top: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired,
      }),
    }),
    focusedSmbgRangeAvg: PropTypes.shape({
      data: PropTypes.shape({
        id: PropTypes.string.isRequired,
        max: PropTypes.number.isRequired,
        mean: PropTypes.number.isRequired,
        min: PropTypes.number.isRequired,
        msX: PropTypes.number.isRequired,
        msFrom: PropTypes.number.isRequired,
        msTo: PropTypes.number.isRequired,
      }).isRequired,
      position: PropTypes.shape({
        left: PropTypes.number.isRequired,
        tooltipLeft: PropTypes.bool.isRequired,
        yPositions: PropTypes.shape({
          max: PropTypes.number.isRequired,
          mean: PropTypes.number.isRequired,
          min: PropTypes.number.isRequired,
        }).isRequired,
      }).isRequired,
    }),
    touched: PropTypes.bool.isRequired,
    unfocusCbgSlice: PropTypes.func.isRequired,
    unfocusSmbg: PropTypes.func.isRequired,
    unfocusSmbgRangeAvg: PropTypes.func.isRequired,
  };

  static defaultProps = {
    yScaleClampTop: {
      [MGDL_UNITS]: MGDL_CLAMP_TOP,
      [MMOLL_UNITS]: MMOLL_CLAMP_TOP,
    },
  };

  constructor(props) {
    super(props);
    this.log = bows('TrendsContainer');
    this.state = {
      currentCbgData: [],
      currentSmbgData: [],
      dateDomain: null,
      mostRecent: null,
      previousDateDomain: null,
      xScale: null,
      yScale: null,
    };

    this.selectDate = this.selectDate.bind(this);
  }

  componentWillMount() {
    this.mountData();
  }

  /*
   * NB: we don't do as much here as one might expect
   * because we're using the "expose component functions"
   * strategy of communicating between components
   * (https://facebook.github.io/react/tips/expose-component-functions.html)
   * this is the legacy of blip's interface with the d3.chart-architected
   * smbg version of trends view and thus only remains
   * as a temporary compatibility interface
   */
  componentWillReceiveProps(nextProps) {
    const loadingJustCompleted = this.props.loading && !nextProps.loading;
    const newDataRecieved = this.props.queryDataCount !== nextProps.queryDataCount;

    if (loadingJustCompleted || newDataRecieved) {
      this.mountData(nextProps);
    }
  }

  componentWillUnmount() {
    const {
      currentPatientInViewId,
      focusedCbgSlice,
      focusedSmbg,
      focusedSmbgRangeAvg,
      unfocusCbgSlice,
      unfocusSmbg,
      unfocusSmbgRangeAvg,
    } = this.props;
    if (focusedCbgSlice !== null) {
      unfocusCbgSlice(currentPatientInViewId);
    }
    if (focusedSmbg !== null) {
      unfocusSmbg(currentPatientInViewId);
    }
    if (focusedSmbgRangeAvg !== null) {
      unfocusSmbgRangeAvg(currentPatientInViewId);
    }
  }

  mountData(props = this.props) {
    const allBg = _.sortBy(_.cloneDeep(_.get(props, 'data.data.combined', [])), 'normalTime');
    const bgDomain = extent(allBg, d => d.value);
    const currentCbgData = _.filter(allBg, { type: 'cbg' });
    const currentSmbgData = _.filter(allBg, { type: 'smbg' });

    const { bgPrefs: { bgBounds, bgUnits }, yScaleClampTop, mostRecentDatetimeLocation } = props;
    const upperBound = yScaleClampTop[bgUnits];
    const yScaleDomain = [bgDomain[0], upperBound];
    if (!bgDomain[0] || bgDomain[0] > bgBounds.veryLowThreshold) {
      yScaleDomain[0] = bgBounds.veryLowThreshold;
    }
    const yScale = scaleLinear().domain(yScaleDomain).clamp(true);

    // find initial date domain (based on initialDatetimeLocation or current time)
    const { extentSize, initialDatetimeLocation, timePrefs } = props;
    const timezone = datetime.getTimezoneFromTimePrefs(timePrefs);
    const end = initialDatetimeLocation
      ? datetime.getLocalizedCeiling(initialDatetimeLocation, timePrefs).toISOString()
      : mostRecentDatetimeLocation;

    const start = moment(end).tz(timezone).subtract(extentSize, 'days').toISOString();
    const dateDomain = [start, end];

    const state = {
      bgDomain: { lo: bgDomain[0], hi: bgDomain[1] },
      currentCbgData,
      currentSmbgData,
      dateDomain: { start: dateDomain[0], end: dateDomain[1] },
      mostRecent: mostRecentDatetimeLocation,
      xScale: scaleLinear().domain([0, 864e5]),
      yScale,
    };

    this.setState(state, this.determineDataToShow);
    props.onDatetimeLocationChange(dateDomain);
  }

  getCurrentDay() {
    const { dateDomain: { end } } = this.state;
    return getLocalizedNoonBeforeUTC(end, this.props.timePrefs).toISOString();
  }

  setExtent(newDomain) {
    this.props.onDatetimeLocationChange(newDomain);
  }

  selectDate() {
    const { timePrefs } = this.props;
    return (date) => {
      const noonOnDate = moment.tz(date, datetime.getTimezoneFromTimePrefs(timePrefs))
        .startOf('day')
        .add(12, 'hours')
        .toISOString();
      this.props.onSelectDate(noonOnDate);
    };
  }

  goBack() {
    const { dateDomain: { start: newEnd } } = this.state;
    const start = getLocalizedOffset(newEnd, {
      // negative because we are moving backward in time
      amount: -this.props.extentSize,
      units: 'days',
    }, this.props.timePrefs).toISOString();
    const newDomain = [start, newEnd];
    this.setExtent(newDomain);
  }

  goForward() {
    const { dateDomain: { end: newStart } } = this.state;
    const end = utcDay.offset(new Date(newStart), this.props.extentSize).toISOString();
    const newDomain = [newStart, end];
    this.setExtent(newDomain);
  }

  goToMostRecent() {
    const { mostRecent: end } = this.state;
    const start = utcDay.offset(new Date(end), -this.props.extentSize).toISOString();
    const newDomain = [start, end];
    this.setExtent(newDomain);
  }

  determineDataToShow() {
    const { currentPatientInViewId, touched } = this.props;
    if (touched) {
      return;
    }
    const { currentCbgData, currentSmbgData } = this.state;
    const { extentSize, showingCbg } = this.props;
    const minimumCbgs = (extentSize * CGM_READINGS_ONE_DAY) / 2;

    // If we're set to show CBG data, but have less than 50% coverage AND we have SMBG data,
    // switch to SBMG view
    if (showingCbg && weightedCGMCount(currentCbgData) < minimumCbgs && currentSmbgData.length) {
      this.props.onSwitchBgDataSource(null, showingCbg ? BGM_DATA_KEY : CGM_DATA_KEY);
    }
    this.props.markTrendsViewed(currentPatientInViewId);
  }

  render() {
    const { start: currentStart, end: currentEnd } = this.state.dateDomain;
    const prevStart = _.get(this.state, ['previousDateDomain', 'start']);
    const prevEnd = _.get(this.state, ['previousDateDomain', 'end']);
    let start = currentStart;
    let end = currentEnd;
    if (prevStart && prevEnd) {
      if (currentStart < prevStart) {
        end = prevEnd;
      } else if (prevStart < currentStart) {
        start = prevStart;
      }
    }
    return (
      <TrendsSVGContainer
        activeDays={this.props.activeDays}
        bgPrefs={this.props.bgPrefs}
        smbgData={this.state.currentSmbgData}
        cbgData={this.state.currentCbgData}
        dates={getAllDatesInRange(start, end, this.props.timePrefs)}
        focusedSlice={this.props.focusedCbgSlice}
        focusedSliceKeys={this.props.focusedCbgSliceKeys}
        focusedSmbgRangeAvgKey={this.props.focusedSmbgRangeAvg}
        focusedSmbg={this.props.focusedSmbg}
        displayFlags={this.props.cbgFlags}
        showingCbg={this.props.showingCbg}
        showingCbgDateTraces={this.props.showingCbgDateTraces}
        showingSmbg={this.props.showingSmbg}
        smbgGrouped={this.props.smbgGrouped}
        smbgLines={this.props.smbgLines}
        smbgRangeOverlay={this.props.smbgRangeOverlay}
        onSelectDate={this.selectDate()}
        xScale={this.state.xScale}
        yScale={this.state.yScale}
      />
    );
  }
}

export default TrendsContainer;
