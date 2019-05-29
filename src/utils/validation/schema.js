import Validator from 'fastest-validator';
import _ from 'lodash';
import { MGDL_UNITS, MMOLL_UNITS } from '../constants.js';

const v = new Validator({
  messages: {
    missingFieldDependancy: "Field(s) '{expected}' are expected when field '{field}' exists. Value(s) were {actual}",
  },
});

v.add('withDependantFields', (value, schema, fieldName, object) => {
  let missingFields = false;

  _.each(schema.fields, field => {
    if (!missingFields) {
      missingFields = _.isNil(object[field]);
    }
  });

  if (missingFields) {
    return v.makeError('missingFieldDependancy', schema.fields, JSON.stringify(_.pick(object, schema.fields)));
  }

  const compiledSchemaRule = v.compileSchemaRule(schema.schema);
  return v.checkSchemaRule(object[fieldName], compiledSchemaRule, fieldName);
});

const optional = {
  optional: true,
};

const forbidden = {
  type: 'forbidden',
};

const patterns = {
  id: /^[A-Za-z0-9\-_]+$/,
  ISODate: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,
  deviceTime: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)$/,
};

const validTypes = [
  'basal',
  'bolus',
  'cbg',
  'deviceEvent',
  'food',
  'insulin',
  'message',
  'physicalActivity',
  'pumpSettings',
  'reportedState',
  'smbg',
  'upload',
  'water',
  'wizard',
];

const common = {
  deviceId: { type: 'string' },
  deviceTime: { type: 'string', pattern: patterns.deviceTime, ...optional },
  id: { type: 'string', pattern: patterns.id },
  time: { type: 'string', pattern: patterns.ISODate },
  type: { type: 'string', enum: validTypes },
  uploadId: { type: 'string', pattern: patterns.id },
};

const basalCommon = {
  deliveryType: { type: 'string', enum: ['scheduled', 'suspend', 'temp', 'automated'] },
  duration: { type: 'number', min: 0, ...optional },
  rate: { type: 'number', min: 0 },
};

const basal = {
  ...common,
  ...basalCommon,
  suppressed: { type: 'object', props: basalCommon, ...optional },
};

const normalBolus = {
  ...common,
  normal: { type: 'number', min: 0 },
  expectedNormal: {
    type: 'withDependantFields',
    schema: {
      type: 'number',
      min: 0,
      ...optional,
    },
    fields: ['normal'],
    ...optional,
  },
  duration: forbidden,
  extended: forbidden,
  expectedExtended: forbidden,
  subType: { type: 'string', enum: ['normal'] },
};

const extendedBolus = {
  ...common,
  duration: { type: 'number', min: 0 },
  expectedDuration: { type: 'number', min: 0, ...optional },
  extended: { type: 'number', min: 0 },
  expectedExtended: {
    type: 'withDependantFields',
    schema: {
      type: 'number',
      min: 0,
      ...optional,
    },
    fields: ['extended', 'duration', 'expectedDuration'],
    ...optional,
  },
  normal: { type: 'number', min: 0, ...optional },
  expectedNormal: {
    type: 'withDependantFields',
    schema: {
      type: 'number',
      min: 0,
      ...optional,
    },
    fields: ['normal'],
    ...optional,
  },
  subType: { type: 'string', enum: ['square', 'dual/square'] },
};

const bg = {
  ...common,
  value: { type: 'number', min: 0 },
  units: { type: 'string', enum: [MGDL_UNITS, MMOLL_UNITS] },
};

const message = {
  id: { type: 'string', pattern: patterns.id },
  time: { type: 'string', pattern: patterns.ISODate },
  parentMessage: [
    { type: 'string', pattern: patterns.id, ...optional },
    { type: 'enum', values: [null], ...optional },
  ],
};

const pumpSettings = {
  ...common,
};

const wizard = {
  ...common,
};

export default {
  basal: v.compile(basal),
  bolus: [
    v.compile(normalBolus),
    v.compile(extendedBolus),
  ],
  cbg: v.compile(bg),
  common: v.compile(common),
  message: v.compile(message),
  pumpSettings: v.compile(pumpSettings),
  smbg: v.compile(bg),
  wizard: v.compile(wizard),
};
