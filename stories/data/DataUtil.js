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

const stories = storiesOf('DataUtil', module);
stories.addDecorator(withKnobs);
stories.addParameters({ options: { panelPosition: 'right' } });

const DATA_INPUTS = 'DATA INPUT';
const DATA_QUERY = 'GENERATED QUERY';
const DATA_FIELDS = 'FIELDS';

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

stories.add('dataUtil test', () => {
  const endMoment = moment.utc(data[0].time).startOf('day').add(1, 'd');

  const getEndDate = () => {
    const endDate = date('End Date', endMoment.toDate(), DATA_INPUTS);
    return moment.utc(endDate).toISOString();
  };

  const daysInRange = 1;
  const daysInRangeOptions = {
    range: true,
    min: 1,
    max: 30,
    step: 1,
  };

  const getDaysInRange = () => number('Days in Range', daysInRange, daysInRangeOptions, DATA_INPUTS);

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
    // uploadId: 'uploadId',
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

  const getFieldsQueryFormat = () => options('Fields Query Format', { ...stringQueryFormat, ...arrayQueryFormat }, 'string', { display: 'radio' }, DATA_FIELDS);
  const getFields = type => {
    const queryFormat = getFieldsQueryFormat();
    const fields = options(type, fieldsByType[type], ['time'], { display: 'check' }, DATA_FIELDS);
    return { select: queryFormat === 'string' ? fields.join(',') : fields };
  };


  const getTypesQueryFormat = () => options('Types Query Format', { ...objectQueryFormat, ...arrayQueryFormat }, 'object', { display: 'radio' }, DATA_INPUTS);
  const getTypes = () => {
    const queryFormat = getTypesQueryFormat();
    const selectedTypes = options('Types', types, ['smbg'], { display: 'check' }, DATA_INPUTS);
    return queryFormat === 'object'
      ? _.zipObject(selectedTypes, _.map(selectedTypes, getFields))
      : _.map(selectedTypes, type => ({ type, ...getFields(type) }));
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
    const days = options('Active Days', activeDays, _.values(activeDays), { display: 'check' }, DATA_INPUTS);
    return (days.length === 7) ? undefined : _.map(days, _.toInteger);
  };

  const defaultQuery = {
    endpoints: [
      moment.utc(getEndDate()).subtract(getDaysInRange(), 'd').toISOString(),
      getEndDate(),
    ],
    types: getTypes(),
    activeDays: getActiveDays(),
  };

  const query = () => object('Query', defaultQuery, DATA_QUERY);

  return <Results results={dataUtil.queryData(query())} />;
}, { notes });
