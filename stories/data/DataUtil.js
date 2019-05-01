/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017, Tidepool Project
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
import _ from 'lodash';
import { storiesOf } from '@storybook/react';
import { object, withKnobs, optionsKnob as options, date, number } from '@storybook/addon-knobs';
import moment from 'moment';

import DataUtil from '../../src/utils/DataUtil';
import { MGDL_UNITS, MMOLL_UNITS, DEFAULT_BG_BOUNDS } from '../../src/utils/constants';

const stories = storiesOf('DataUtil', module);
stories.addDecorator(withKnobs);
stories.addParameters({ options: { panelPosition: 'right' } });

const GROUP_DATES = 'DATES';
const GROUP_TYPES = 'TYPES';
const GROUP_FIELDS = 'FIELDS';
const GROUP_SORT = 'SORT';
const GROUP_UNITS = 'UNITS';
const GROUP_QUERY = 'QUERY';

let data;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data = require('../../local/blip-input.json');
} catch (e) {
  data = [];
}

const notes = `Run \`window.downloadInputData()\` from the console on a Tidepool Web data view.
Save the resulting file to the \`local/\` directory of viz as \`blip-input.json\`,
and then use this story to iterate on the Basics Print PDF outside of Tidepool Web!`;

const dataUtil = new DataUtil(data);

const Results = ({ results }) => (
  <pre>{JSON.stringify(results, null, 2)}</pre>
);

stories.add('Query Generator', () => {
  const endMoment = moment.utc(data[0].time).startOf('day').add(1, 'd');

  const getEndDate = () => {
    const endDate = date('End Date', endMoment.toDate(), GROUP_DATES);
    return moment.utc(endDate).toISOString();
  };

  const daysInRange = 1;
  const daysInRangeOptions = {
    range: true,
    min: 1,
    max: 30,
    step: 1,
  };

  const getDaysInRange = () => number('Days in Range', daysInRange, daysInRangeOptions, GROUP_DATES);

  const commonFields = {
    // _active: '_active',
    // _groupId: '_groupId',
    // _schemaVersion: '_schemaVersion',
    // _version: '_version',
    // clockDriftOffset: 'clockDriftOffset',
    // conversionOffset: 'conversionOffset',
    // createdTime: 'createdTime',
    deviceId: 'deviceId',
    // deviceTime: 'deviceTime',
    // guid: 'guid',
    // id: 'id',
    time: 'time',
    // timezoneOffset: 'timezoneOffset',
    uploadId: 'uploadId',
  };

  const fieldsByType = {
    smbg: {
      ...commonFields,
      subType: 'subType',
      units: 'units',
      value: 'value',
    },
    cbg: {
      ...commonFields,
      units: 'units',
      value: 'value',
    },
    basal: {
      ...commonFields,
      deliveryType: 'deliveryType',
      duration: 'duration',
      expectedDuration: 'expectedDuration',
      percent: 'percent',
      previous: 'previous',
      rate: 'rate',
      suppressed: 'suppressed',
    },
    bolus: {
      ...commonFields,
      subType: 'subType',
      normal: 'normal',
      expectedNormal: 'expectedNormal',
      extended: 'extended',
      expectedExtended: 'expectedExtended',
      duration: 'duration',
      expectedDuration: 'expectedDuration',
    },
    wizard: {
      ...commonFields,
      bgInput: 'bgInput',
      bgTarget: 'bgTarget',
      bolus: 'bolus',
      carbInput: 'carbInput',
      insulinCarbRatio: 'insulinCarbRatio',
      insulinOnBoard: 'insulinOnBoard',
      insulinSensitivity: 'insulinSensitivity',
      recommended: 'recommended',
      units: 'units',
    },
    upload: {
      ...commonFields,
      deviceManufacturers: 'deviceManufacturers',
      deviceModel: 'deviceModel',
      deviceSerialNumber: 'deviceSerialNumber',
      deviceTags: 'deviceTags',
    },
    pumpSettings: {
      ...commonFields,
      activeSchedule: 'activeSchedule',
      basalSchedules: 'basalSchedules',
      bgTarget: 'bgTarget',
      bgTargets: 'bgTargets',
      carbRatio: 'carbRatio',
      carbRatios: 'carbRatios',
      insulinSensitivity: 'insulinSensitivity',
      insulinSensitivities: 'insulinSensitivities',
      units: 'units',
    },
    cgmSettings: {
      ...commonFields,
      transmitterId: 'transmitterId',
      units: 'units',
    },
    deviceEvent: {
      ...commonFields,
      subType: 'subType',
    },
  };

  const types = {
    smbg: 'smbg',
    cbg: 'cbg',
    basal: 'basal',
    bolus: 'bolus',
    wizard: 'wizard',
    upload: 'upload',
    pumpSettings: 'pumpSettings',
    cgmSettings: 'cgmSettings',
    deviceEvent: 'deviceEvent',
  };

  const stringQueryFormat = { string: 'string' };
  const arrayQueryFormat = { array: 'array' };
  const objectQueryFormat = { object: 'object' };

  const getFieldsQueryFormat = () => options('Fields Query Format', { ...stringQueryFormat, ...arrayQueryFormat }, 'string', { display: 'radio' }, GROUP_FIELDS);
  const getFields = type => {
    const queryFormat = getFieldsQueryFormat();
    const fields = options(type, fieldsByType[type], ['time'], { display: 'check' }, GROUP_FIELDS);
    return { select: queryFormat === 'string' ? fields.join(',') : fields };
  };

  const sorts = {
    asc: 'asc',
    desc: 'desc',
  };

  const getSortQueryFormat = () => options('Sort Query Format', { ...stringQueryFormat, ...objectQueryFormat }, 'string', { display: 'radio' }, GROUP_SORT);
  const getTypeSort = type => {
    const sortFormat = getSortQueryFormat();

    const getSortField = t => options(`${t} sort field`, fieldsByType[t], 'time', { display: 'select' }, GROUP_SORT);
    const getSortOrder = t => options(`${t} sort order`, sorts, 'asc', { display: 'select' }, GROUP_SORT);

    return {
      sort: sortFormat === 'string'
        ? [getSortField(type), getSortOrder(type)].join(',')
        : {
          field: getSortField(type),
          order: getSortOrder(type),
        },
    };
  };

  const getTypesQueryFormat = () => options('Types Query Format', { ...objectQueryFormat, ...arrayQueryFormat }, 'object', { display: 'radio' }, GROUP_TYPES);
  const getTypes = () => {
    const queryFormat = getTypesQueryFormat();
    const selectedTypes = options('Types', types, ['smbg'], { display: 'check' }, GROUP_TYPES);

    return queryFormat === 'object'
      ? _.zipObject(
        selectedTypes,
        _.map(selectedTypes, type => ({ ...getFields(type), ...getTypeSort(type) })))
      : _.map(selectedTypes, type => ({ type, ...getFields(type), ...getTypeSort(type) }));
  };

  const activeDays = {
    sunday: '0',
    monday: '1',
    tuesday: '2',
    wednesday: '3',
    thursday: '4',
    friday: '5',
    saturday: '6',
  };

  const getActiveDays = () => {
    const days = options('Active Days', activeDays, _.values(activeDays), { display: 'check' }, GROUP_DATES);
    return (days.length === 7) ? undefined : _.map(days, _.toInteger);
  };

  const timezones = {
    'US/Eastern': 'US/Eastern',
    'US/Central': 'US/Central',
    'US/Mountain': 'US/Mountain',
    'US/Pacific': 'US/Pacific',
    UTC: 'UTC',
    None: 'None',
  };

  const getTimePrefs = () => {
    const timeZoneName = options('Time Zone', timezones, 'UTC', { display: 'select' }, GROUP_DATES);
    const selectedTimeZone = timeZoneName !== 'None' ? timeZoneName : undefined;

    return {
      timezoneName: selectedTimeZone,
      timezoneAware: !!selectedTimeZone || undefined,
    };
  };

  const getBGPrefs = () => {
    const bgUnits = options('BG Units', { [MGDL_UNITS]: MGDL_UNITS, [MMOLL_UNITS]: MMOLL_UNITS }, MGDL_UNITS, { display: 'select' }, GROUP_UNITS);

    return {
      bgUnits,
      bgBounds: DEFAULT_BG_BOUNDS[bgUnits],
    };
  };

  const defaultQuery = {
    endpoints: [
      moment.utc(getEndDate()).subtract(getDaysInRange(), 'd').toISOString(),
      getEndDate(),
    ],
    activeDays: getActiveDays(),
    types: getTypes(),
    timePrefs: getTimePrefs(),
    bgPrefs: getBGPrefs(),
  };

  const query = () => object('Query', defaultQuery, GROUP_QUERY);

  return <Results results={dataUtil.queryData(query())} />;
}, { notes });
