import Validator from 'fastest-validator';
import _ from 'lodash';
import { MGDL_UNITS, MMOLL_UNITS, MS_IN_DAY } from '../constants.js';

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

v.add('objectWithUnknownKeys', (value, schema, fieldName, object) => {
  const compiledSchemaRule = v.compileSchemaRule(schema.schema);
  const fieldValues = _.valuesIn(object[fieldName]);
  const errors = [];

  _.each(fieldValues, fieldValue => {
    const result = v.checkSchemaRule(fieldValue, compiledSchemaRule, fieldName);
    if (result !== true) errors.push(result);
  });

  return errors.length ? errors : true;
});

const patterns = {
  id: /^[A-Za-z0-9\-_]+$/,
  ISODate: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,
  ISODateSince2008: /^((200[89]|20[1-9]\d)-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|((200[89]|20[1-9]\d)-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|((200[89]|20[1-9]\d)-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,
  deviceTime: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)$/,
  rejectBadDeviceStatus: /^(?!status\/unknown-previous).*$/,
};

const optional = { optional: true };
const forbidden = { type: 'forbidden' };
const minZero = { type: 'number', min: 0 };
const postiveNumber = { type: 'number', positive: true };
const ISODateSince2008 = {
  type: 'string',
  pattern: patterns.ISODateSince2008,
  messages: {
    stringPattern: 'Must be an ISO datetime after 2008',
  },
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
  time: ISODateSince2008,
  type: { type: 'string', enum: validTypes },
  uploadId: { type: 'string', pattern: patterns.id },
};

const basalCommon = {
  deliveryType: { type: 'string', enum: ['scheduled', 'suspend', 'temp', 'automated'] },
  duration: { ...postiveNumber, ...optional },
  rate: minZero,
};

const basal = {
  ...common,
  ...basalCommon,
  suppressed: { type: 'object', props: basalCommon, ...optional },
};

const normalBolus = {
  ...common,
  normal: minZero,
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
  duration: minZero,
  expectedDuration: { ...minZero, ...optional },
  extended: minZero,
  expectedExtended: {
    type: 'withDependantFields',
    schema: { ...minZero, ...optional },
    fields: ['extended', 'duration', 'expectedDuration'],
    ...optional,
  },
  normal: { ...minZero, ...optional },
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
  value: postiveNumber,
  units: { type: 'string', enum: [MGDL_UNITS, MMOLL_UNITS] },
};

const deviceEvent = {
  ...common,
  annotations: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        code: { type: 'string', pattern: patterns.rejectBadDeviceStatus },
      },
    },
    ...optional,
  },
};

const message = {
  id: { type: 'string', pattern: patterns.id },
  time: ISODateSince2008,
  parentMessage: [
    { type: 'string', pattern: patterns.id, ...optional },
    { type: 'enum', values: [null], ...optional },
  ],
};

const settingsScheduleStart = {
  start: { ...minZero, max: MS_IN_DAY },
};

const carbRatio = {
  type: 'array',
  items: {
    type: 'object',
    props: {
      amount: minZero,
      ...settingsScheduleStart,
    },
  },
};

const insulinSensitivity = {
  type: 'array',
  items: {
    type: 'object',
    props: {
      amount: minZero,
      ...settingsScheduleStart,
    },
  },
};

const pumpSettingsAnimus = {
  ...common,
  bgTarget: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        ...settingsScheduleStart,
        target: minZero,
        range: minZero,
        low: forbidden,
        high: forbidden,
      },
    },
  },
  carbRatio,
  insulinSensitivity,
};

const pumpSettingsMedtronic = {
  ...common,
  bgTarget: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        ...settingsScheduleStart,
        target: forbidden,
        range: forbidden,
        low: minZero,
        high: minZero,
      },
    },
  },
  carbRatio,
  insulinSensitivity,
};

const pumpSettingsOmnipod = {
  ...common,
  bgTarget: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        ...settingsScheduleStart,
        target: minZero,
        range: forbidden,
        low: forbidden,
        high: minZero,
      },
    },
  },
  carbRatio,
  insulinSensitivity,
};

const pumpSettingsTandem = {
  ...common,
  bgTargets: {
    type: 'objectWithUnknownKeys',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        props: {
          ...settingsScheduleStart,
          target: minZero,
          range: forbidden,
          low: forbidden,
          high: forbidden,
        },
      },
    },
  },
  carbRatios: {
    type: 'objectWithUnknownKeys',
    schema: carbRatio,
  },
  insulinSensitivities: {
    type: 'objectWithUnknownKeys',
    schema: insulinSensitivity,
  },
};

const wizard = {
  ...common,
  bgInput: { ...minZero, ...optional },
  bolus: { type: 'string', pattern: patterns.id },
  carbInput: { ...minZero, ...optional },
  insulinCarbRatio: { ...minZero, ...optional },
  insulinOnBoard: { ...minZero, ...optional },
  insulinSensitivity: { ...minZero, ...optional },
  recommended: {
    type: 'object',
    props: {
      carb: { ...minZero, ...optional },
      correction: { type: 'number', ...optional },
      net: { type: 'number', ...optional },
    },
    ...optional,
  },
};

export default {
  basal: v.compile(basal),
  bolus: [
    v.compile(normalBolus),
    v.compile(extendedBolus),
  ],
  cbg: v.compile(bg),
  common: v.compile(common),
  deviceEvent: v.compile(deviceEvent),
  message: v.compile(message),
  pumpSettings: [
    v.compile(pumpSettingsAnimus),
    v.compile(pumpSettingsMedtronic),
    v.compile(pumpSettingsOmnipod),
    v.compile(pumpSettingsTandem),
  ],
  smbg: v.compile(bg),
  wizard: v.compile(wizard),
};
