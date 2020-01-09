import Validator from 'fastest-validator';
import _ from 'lodash';
import { MGDL_UNITS, MMOLL_UNITS } from '../constants.js';
// import { MGDL_UNITS, MMOLL_UNITS, MS_IN_DAY } from '../constants.js';


const v = new Validator({
  messages: {
    missingFieldDependancy: "Field(s) '{expected}' are expected when field '{field}' exists. Value(s) were {actual}",
  },
});

/* eslint-disable no-underscore-dangle */
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

  const processedRule = v._processRule(schema.schema, fieldName, false);
  const checkWrapper = v._checkWrapper(processedRule);
  return checkWrapper(object[fieldName], processedRule, fieldName);
});

v.add('objectWithUnknownKeys', (value, schema, fieldName, object) => {
  const processedRule = v._processRule(schema.schema, fieldName, false);
  const checkWrapper = v._checkWrapper(processedRule, processedRule.length > 1);
  const fieldValues = _.valuesIn(object[fieldName]);
  const errors = [];
  console.log('processedRule', processedRule);
  console.log('object', object);
  console.log('fieldName', fieldName);
  console.log('fieldValues', fieldValues);
  console.log('schema', schema);
  _.each(fieldValues, fieldValue => {
    const result = checkWrapper(fieldValue, processedRule);
    if (result !== true) errors.push(result);
  });

  return errors.length ? errors : true;
});
/* eslint-enable no-underscore-dangle */

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
  'cgmSettings',
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
  deviceId: { type: 'string', ...optional },
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
    schema: { ...minZero, ...optional },
    fields: ['normal'],
    ...optional,
  },
  duration: forbidden,
  extended: forbidden,
  expectedExtended: forbidden,
  subType: { type: 'string', enum: ['normal'] },
  wizard: { type: 'string', pattern: patterns.id, ...optional },
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
    schema: { ...minZero, ...optional },
    fields: ['normal'],
    ...optional,
  },
  subType: { type: 'string', enum: ['square', 'dual/square'] },
  wizard: { type: 'string', pattern: patterns.id, ...optional },
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

// const settingsScheduleStart = {
//   start: { ...minZero, max: MS_IN_DAY },
// };

// const basalSchedules = {
//   type: 'objectWithUnknownKeys',
//   schema: {
//     type: 'array',
//     items: {
//       type: 'object',
//       props: {
//         ...settingsScheduleStart,
//         rate: minZero,
//       },
//     },
//   },
// };

// const carbRatio = {
//   type: 'array',
//   items: {
//     type: 'object',
//     props: {
//       ...settingsScheduleStart,
//       amount: minZero,
//     },
//   },
// };

// const insulinSensitivity = {
//   type: 'array',
//   items: {
//     type: 'object',
//     props: {
//       ...settingsScheduleStart,
//       amount: minZero,
//     },
//   },
// };

// const pumpSettingsAnimas = {
//   ...common,
//   bgTarget: {
//     type: 'array',
//     items: {
//       type: 'object',
//       props: {
//         ...settingsScheduleStart,
//         target: minZero,
//         range: minZero,
//         low: forbidden,
//         high: forbidden,
//       },
//     },
//   },
//   carbRatio,
//   insulinSensitivity,
//   basalSchedules,
// };

// const pumpSettingsMedtronic = {
//   ...common,
//   bgTarget: {
//     type: 'array',
//     items: {
//       type: 'object',
//       props: {
//         ...settingsScheduleStart,
//         target: forbidden,
//         range: forbidden,
//         low: minZero,
//         high: minZero,
//       },
//     },
//   },
//   carbRatio,
//   insulinSensitivity,
//   basalSchedules,
// };

// const pumpSettingsOmnipod = {
//   ...common,
//   bgTarget: {
//     type: 'array',
//     items: {
//       type: 'object',
//       props: {
//         ...settingsScheduleStart,
//         target: minZero,
//         range: forbidden,
//         low: forbidden,
//         high: minZero,
//       },
//     },
//   },
//   carbRatio,
//   insulinSensitivity,
//   basalSchedules,
// };

// const pumpSettingsTandem = {
//   ...common,
//   bgTargets: {
//     type: 'objectWithUnknownKeys',
//     schema: {
//       type: 'array',
//       items: {
//         type: 'object',
//         props: {
//           ...settingsScheduleStart,
//           target: minZero,
//           range: forbidden,
//           low: forbidden,
//           high: forbidden,
//         },
//       },
//     },
//   },
//   carbRatios: {
//     type: 'objectWithUnknownKeys',
//     schema: carbRatio,
//   },
//   insulinSensitivities: {
//     type: 'objectWithUnknownKeys',
//     schema: insulinSensitivity,
//   },
//   basalSchedules,
// };

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
  basal: v.compile(basal).bind(v),
  bolus: {
    normal: v.compile(normalBolus).bind(v),
    extended: v.compile(extendedBolus).bind(v),
  },
  cbg: v.compile(bg).bind(v),
  common: v.compile(common).bind(v),
  deviceEvent: v.compile(deviceEvent).bind(v),
  message: v.compile(message).bind(v),
  // pumpSettings: {
  //   animas: v.compile(pumpSettingsAnimas).bind(v),
  //   medtronic: v.compile(pumpSettingsMedtronic).bind(v),
  //   omnipod: v.compile(pumpSettingsOmnipod).bind(v),
  //   tandem: v.compile(pumpSettingsTandem).bind(v),
  // },
  smbg: v.compile(bg).bind(v),
  wizard: v.compile(wizard).bind(v),
};
