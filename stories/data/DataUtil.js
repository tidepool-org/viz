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

import {
  object,
  withKnobs,
  optionsKnob as options,
  date,
  number,
  boolean,
  button,
} from '@storybook/addon-knobs';

import moment from 'moment';

import Stat from '../../src/components/common/stat/Stat';
import { commonStats, getStatDefinition } from '../../src/utils/stat';
import { MGDL_UNITS, MMOLL_UNITS, DEFAULT_BG_BOUNDS } from '../../src/utils/constants';
import { getOffset } from '../../src/utils/datetime';

const stories = storiesOf('DataUtil', module);
stories.addDecorator(withKnobs);
stories.addParameters({ options: { panelPosition: 'right' } });

const GROUP_DATES = 'DATES';
const GROUP_DATA = 'DATA';
const GROUP_FIELDS = 'FIELDS';
const GROUP_SORTS = 'SORTS';
const GROUP_UNITS = 'UNITS';
const GROUP_STATS = 'STATS';
const GROUP_RESULTS = 'RESULTS';

const notes = `Run the \`accountTool.py export\` from the \`tidepool-org/tools-private\` repo.
Save the resulting file to the \`local/\` directory of viz as \`rawData.json\`,
and then use this story to generate DataUtil queries outside of Tidepool Web!`;

const Results = ({ results, showData, showStats }) => {
  const statData = _.get(results, 'data.current.stats');
  const days = _.get(results, 'data.current.endpoints.daysInRange', 1);
  const allStats = [];

  const wrapperStyles = {
    padding: '20px 0 0',
  };

  const statStyles = {
    margin: '0 0 10px',
  };

  const renderStats = (stats, bgPrefs) => (_.map(stats, stat => (
    <div style={statStyles} id={`Stat--${stat.id}`} key={stat.id}>
      <Stat bgPrefs={bgPrefs} {...stat} />
    </div>
  )));

  _.each(_.keys(statData), stat => {
    allStats.push(getStatDefinition(statData[stat], stat, {
      days,
      bgPrefs: results.bgPrefs,
      bgSource: _.get(results, 'metaData.bgSources.current'),
    }));
  });

  return (
    <div>
      {showStats && <div style={wrapperStyles}>{renderStats(allStats, results.bgPrefs)}</div>}
      {showData && <pre>{JSON.stringify(results, null, 2)}</pre>}
    </div>
  );
};

stories.add('Query Generator', (props) => {
  const { dataUtil } = props;

  const datumTypes = ['cbg', 'smbg', 'basal', 'bolus', 'wizard', 'food', 'pumpSettings', 'upload'];

  const latestDatumsByType = dataUtil.getMetaData('latestDatumByType').latestDatumByType;

  const latestDatumTime = _.max(_.map(
    _.pickBy(latestDatumsByType, d => _.includes(datumTypes, d.type)),
    d => (d.normalTime)
  ));

  const endMoment = moment.utc(latestDatumTime).startOf('day').add(1, 'd');

  const getEndMoment = () => {
    const endDate = date('End Date', endMoment.toDate(), GROUP_DATES);
    return moment.utc(endDate);
  };

  const daysInRange = 1;

  const daysInRangeOptions = {
    range: true,
    min: 1,
    max: 30,
    step: 1,
  };

  const daysInSurroundingRangeOptions = {
    range: true,
    min: 0,
    max: 28,
    step: 1,
  };

  const noneOption = {
    None: 'None',
  };

  const getDaysInRange = () => number('Days in Current Range', daysInRange, daysInRangeOptions, GROUP_DATES);
  const getNextDays = () => number('Days in Next Range', 0, daysInSurroundingRangeOptions, GROUP_DATES);
  const getPrevDays = () => number('Days in Prev Range', 0, daysInSurroundingRangeOptions, GROUP_DATES);

  const commonFields = {
    annotations: 'annotations',
    deviceId: 'deviceId',
    deviceTime: 'deviceTime',
    _deviceTime: '_deviceTime',
    id: 'id',
    time: 'time',
    _time: '_time',
    uploadId: 'uploadId',
  };

  const computedFields = {
    normalTime: 'normalTime',
    displayOffset: 'displayOffset',
    warning: 'warning',
    deviceSerialNumber: 'deviceSerialNumber',
    source: 'source',
    localDate: 'localDate',
  };

  const fieldsByType = {
    smbg: {
      ...commonFields,
      ...computedFields,
      msPer24: 'msPer24',
      subType: 'subType',
      units: 'units',
      value: 'value',
    },
    cbg: {
      ...commonFields,
      ...computedFields,
      msPer24: 'msPer24',
      units: 'units',
      value: 'value',
    },
    basal: {
      ...commonFields,
      ...computedFields,
      deliveryType: 'deliveryType',
      duration: 'duration',
      expectedDuration: 'expectedDuration',
      normalEnd: 'normalEnd',
      percent: 'percent',
      previous: 'previous',
      rate: 'rate',
      suppressed: 'suppressed',
    },
    bolus: {
      ...commonFields,
      ...computedFields,
      subType: 'subType',
      normal: 'normal',
      expectedNormal: 'expectedNormal',
      extended: 'extended',
      expectedExtended: 'expectedExtended',
      duration: 'duration',
      wizard: 'wizard',
      expectedDuration: 'expectedDuration',
    },
    wizard: {
      ...commonFields,
      ...computedFields,
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
      ...computedFields,
      deviceManufacturers: 'deviceManufacturers',
      deviceModel: 'deviceModel',
      deviceSerialNumber: 'deviceSerialNumber',
      deviceTags: 'deviceTags',
    },
    pumpSettings: {
      ...commonFields,
      ...computedFields,
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
      ...computedFields,
      transmitterId: 'transmitterId',
      units: 'units',
    },
    deviceEvent: {
      ...commonFields,
      ...computedFields,
      subType: 'subType',
    },
    message: {
      time: 'time',
      ...computedFields,
      messageText: 'messageText',
      parentMessage: 'parentMessage',
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
    message: 'message',
  };

  const stringQueryFormat = { string: 'string' };
  const arrayQueryFormat = { array: 'array' };
  const objectQueryFormat = { object: 'object' };

  const getFieldsQueryFormat = () => options('Fields Query Format', { ...stringQueryFormat, ...arrayQueryFormat }, 'string', { display: 'radio' }, GROUP_FIELDS);
  const getFields = type => {
    const queryFormat = getFieldsQueryFormat();
    const fields = options(
      type,
      fieldsByType[type],
      ['id', 'normalTime'],
      { display: 'check' },
      GROUP_FIELDS
    );
    return { select: queryFormat === 'string' ? fields.join(',') : fields };
  };

  const sorts = {
    asc: 'asc',
    desc: 'desc',
  };

  const getSortQueryFormat = () => options('Sort Query Format', { ...stringQueryFormat, ...objectQueryFormat }, 'string', { display: 'radio' }, GROUP_SORTS);
  const getTypeSort = type => {
    const sortFormat = getSortQueryFormat();

    const getSortField = t => options(`${t} sort field`, { ...fieldsByType[t], ...noneOption }, 'normalTime', { display: 'select' }, GROUP_SORTS);
    const getSortOrder = t => options(`${t} sort order`, sorts, 'asc', { display: 'select' }, GROUP_SORTS);

    const selectedSortField = getSortField(type);
    const selectedSortOrder = getSortOrder(type);

    return selectedSortField !== 'None' ? {
      sort: sortFormat === 'string'
        ? [selectedSortField, selectedSortOrder].join(',')
        : {
          field: selectedSortField,
          order: selectedSortOrder,
        },
    } : undefined;
  };

  const getTypesQueryFormat = () => options('Types Query Format', { ...objectQueryFormat, ...arrayQueryFormat }, 'object', { display: 'radio' }, GROUP_DATA);
  const getTypes = () => {
    const queryFormat = getTypesQueryFormat();
    const selectedTypes = options(
      'Types',
      types,
      [],
      { display: 'check' },
      GROUP_DATA,
    );

    if (!selectedTypes.length) return undefined;

    return queryFormat === 'object'
      ? _.zipObject(
        selectedTypes,
        _.map(selectedTypes, type => ({ ...getFields(type), ...getTypeSort(type) })))
      : _.map(selectedTypes, type => ({ type, ...getFields(type), ...getTypeSort(type) }));
  };

  const metadata = {
    bgSources: 'bgSources',
    latestDatumByType: 'latestDatumByType',
    latestPumpUpload: 'latestPumpUpload',
    devices: 'devices',
    size: 'size',
  };

  const getMetaDataQueryFormat = () => options('Metadata Query Format', { ...stringQueryFormat, ...arrayQueryFormat }, 'string', { display: 'radio' }, GROUP_DATA);
  const getMetaData = () => {
    const queryFormat = getMetaDataQueryFormat();
    const selectedMetaData = options(
      'Metadata',
      metadata,
      [],
      { display: 'check' },
      GROUP_DATA,
    );

    if (!selectedMetaData.length) return undefined;

    return queryFormat === 'string' ? selectedMetaData.join(',') : selectedMetaData;
  };

  const getFillData = () => boolean('Generate Fill Data', false, GROUP_DATA);
  const adjustForDSTChanges = () => boolean('Adjust Fill Data for DST Changes', true, GROUP_DATA);

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
    const days = options(
      'Active Days',
      activeDays,
      _.values(activeDays),
      { display: 'check' },
      GROUP_DATES,
    );
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
    const timeZoneName = options(
      'Time Zone',
      timezones,
      'US/Eastern',
      { display: 'select' },
      GROUP_DATES,
    );
    const selectedTimeZone = timeZoneName !== 'None' ? timeZoneName : undefined;

    return selectedTimeZone ? {
      timezoneName: selectedTimeZone,
      timezoneAware: true,
    } : undefined;
  };

  const getBGPrefs = () => {
    const bgUnits = options('BG Units', { [MGDL_UNITS]: MGDL_UNITS, [MMOLL_UNITS]: MMOLL_UNITS, ...noneOption }, MGDL_UNITS, { display: 'select' }, GROUP_UNITS);

    return bgUnits !== 'None' ? {
      bgUnits,
      bgBounds: DEFAULT_BG_BOUNDS[bgUnits],
    } : undefined;
  };

  const getBGSource = () => {
    const bgSource = options('Stats BG Source', { ..._.pick(types, ['cbg', 'smbg']), ...noneOption }, 'None', { display: 'select' }, GROUP_STATS);

    return bgSource !== 'None' ? bgSource : undefined;
  };

  const getStatsQueryFormat = () => options('Stats Query Format', { ...stringQueryFormat, ...arrayQueryFormat }, 'string', { display: 'radio' }, GROUP_STATS);
  const getStats = () => {
    const queryFormat = getStatsQueryFormat();
    const selectedStats = options(
      'Stats',
      commonStats,
      [],
      { display: 'check' },
      GROUP_STATS,
    );

    if (!selectedStats.length) return undefined;
    return queryFormat === 'string' ? selectedStats.join(',') : selectedStats;
  };

  const aggregationsByDate = {
    basals: 'basals',
    boluses: 'boluses',
    fingersticks: 'fingersticks',
    siteChanges: 'siteChanges',
    dataByDate: 'dataByDate',
    statsByDate: 'statsByDate',
  };

  const getAggregationsByDateQueryFormat = () => options('Aggregations By Date Query Format', { ...stringQueryFormat, ...arrayQueryFormat }, 'string', { display: 'radio' }, GROUP_STATS);
  const getAggregationsByDate = () => {
    const queryFormat = getAggregationsByDateQueryFormat();
    const selectedAggregationsByDate = options(
      'Aggregations By Date',
      aggregationsByDate,
      [],
      { display: 'check' },
      GROUP_STATS,
    );

    if (!selectedAggregationsByDate.length) return undefined;
    return queryFormat === 'string' ? selectedAggregationsByDate.join(',') : selectedAggregationsByDate;
  };

  const timePrefs = getTimePrefs();
  const endDate = getEndMoment();
  const endpoints = [
    endDate.clone().subtract(getDaysInRange(), 'd').add().toISOString(),
    endDate.toISOString(),
  ];

  _.each(endpoints, (endpoint, i) => {
    const offset = _.get(timePrefs, 'timezoneAware') ? getOffset(endpoint, timePrefs.timezoneName) : 0;
    endpoints[i] = moment.utc(endpoints[i]).add(offset, 'minutes').toISOString();
  });

  const defaultQuery = {
    endpoints,
    activeDays: getActiveDays(),
    types: getTypes(),
    timePrefs,
    bgPrefs: getBGPrefs(),
    bgSource: getBGSource(),
    nextDays: getNextDays(),
    prevDays: getPrevDays(),
    stats: getStats(),
    aggregationsByDate: getAggregationsByDate(),
    metaData: getMetaData(),
  };

  if (getFillData()) {
    defaultQuery.fillData = { adjustForDSTChanges: adjustForDSTChanges() };
  }

  const showData = () => boolean('Render Data', true, GROUP_RESULTS);
  const showStats = () => boolean('Render Stats', true, GROUP_RESULTS);
  const query = () => object('Query', defaultQuery, GROUP_RESULTS);

  return <Results
    showStats={showStats()}
    showData={showData()}
    results={dataUtil.query(query())}
  />;
}, { notes });

stories.add('Update Message', (props) => {
  const { dataUtil, patientId } = props;

  const message = {
    id: '5cee9af2cb5d8e0011101c33',
    guid: '8966e5c6-5b60-4f47-a937-c461eff4f624',
    parentmessage: null,
    userid: '991e1a7ef0',
    groupid: 'a481e64684',
    timestamp: '2018-03-27T19:34:38-04:00',
    createdtime: '2019-05-26T14:45:06+00:00',
    messagetext: 'Parent Note for testing',
    user: {
      fullName: 'Jill Jellyfish',
    },
  };

  dataUtil.addData([message], patientId);

  const defaultQuery = {
    endpoints: [
      '2018-03-27T05:00:00.000Z',
      '2018-03-28T05:00:00.000Z',
    ],
    types: {
      message: {
        select: 'messageText, id, normalTime',
      },
    },
  };

  const query = () => object('Query', defaultQuery, GROUP_RESULTS);
  const datum = () => object('Message', _.cloneDeep(message), GROUP_RESULTS);
  const updateButton = () => button('Update Message', () => dataUtil.updateDatum(datum()), GROUP_RESULTS);
  return <Results
    showData
    results={dataUtil.query(query())}
    datum={datum()}
    button={updateButton()}
  />;
});
