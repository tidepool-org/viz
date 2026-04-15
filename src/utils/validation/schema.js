import Validator from 'fastest-validator';
import _ from 'lodash';
import { MGDL_UNITS, MMOLL_UNITS, MS_IN_DAY } from '../constants.js';


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

  const processedRule = v._processRule(schema.schema, null, false);
  const checkWrapper = v._checkWrapper(processedRule);

  return checkWrapper(object[fieldName], processedRule, fieldName);
});

v.add('objectWithUnknownKeys', (value, schema, fieldName, object) => {
  const errors = [];
  const processedRule = v._processRule(schema.schema, null, false);

  _.each(object[fieldName], fieldValue => {
    const checkWrapper = v._checkWrapper(processedRule);
    const result = checkWrapper(fieldValue, processedRule);
    if (result !== true) {
      _.each(result, (item, i) => {
        // Add the field name to the field path for proper error descriptions
        const fieldPath = `${fieldName}${item.field}`;
        result[i].message = item.message.replace(item.field, fieldPath);
        result[i].field = fieldPath;
      });

      errors.push(result);
    }
  });

  return errors.length ? errors : true;
});
/* eslint-enable no-underscore-dangle */

const patterns = {
  id: /^[A-Za-z0-9\-_]+$/,
  ISODate: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,
  ISODateSince2008: /^((200[89]|20[1-9]\d)-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|((200[89]|20[1-9]\d)-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|((200[89]|20[1-9]\d)-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,
  deviceTime: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)Z?$/,
  rejectBadDeviceStatus: /^(?!status\/unknown-previous).*$/,
};

const optional = { optional: true };
const forbidden = { type: 'forbidden' };
const minZero = { type: 'number', min: 0 };
const postiveNumber = { type: 'number', positive: true };
const ISODateSince2008 = {
  type: 'string',
  pattern: patterns.ISODateSince2008,
};

const validTypes = [
  'alert',
  'basal',
  'bolus',
  'cbg',
  'cgmSettings',
  'controllerSettings',
  'controllerStatus',
  'deviceEvent',
  'dosingDecision',
  'food',
  'insulin',
  'message',
  'physicalActivity',
  'pumpSettings',
  'pumpStatus',
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

const suppressed = { type: 'object', props: basalCommon, ...optional };

const basal = {
  ...common,
  ...basalCommon,
  suppressed,
};

// allow pump-shutdown-annotated basals, even if duration is zero, so we can display them.
const basalPostShutdown = {
  ...basal,
  annotations: { type: 'array', items: { type: 'object', props: { code: { type: 'string', value: 'pump-shutdown' } } } },
  duration: { ...minZero, ...optional },
  suppressed: { ...suppressed, props: { ...suppressed.props, duration: { ...minZero, ...optional } } },
};

const insulin = {
  ...common,
  dose: { type: 'object',
    props: {
      total: minZero,
    } },
  formulation: { type: 'object',
    props: {
      simple: { type: 'object',
        props: {
          actingType: { type: 'string', enum: ['rapid', 'short', 'intermediate', 'long'] },
        } } },
    ...optional },
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
  subType: { type: 'string', enum: ['normal', 'automated'] },
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
  subType: { type: 'string', enum: ['square'] },
  wizard: { type: 'string', pattern: patterns.id, ...optional },
};

const combinationBolus = {
  ...extendedBolus,
  subType: { type: 'string', enum: ['dual/square'] },
  expectedNormal: {
    type: 'withDependantFields',
    schema: { ...minZero, ...optional },
    fields: ['normal', 'duration', 'expectedDuration', 'extended', 'expectedExtended'],
    ...optional,
  },
};

const bg = {
  ...common,
  value: postiveNumber,
  units: { type: 'string', enum: [MGDL_UNITS, MMOLL_UNITS] },
};

const cbg = {
  ...bg,
  sampleInterval: postiveNumber,
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

const basalSchedules = {
  type: 'objectWithUnknownKeys',
  schema: {
    type: 'array',
    items: {
      type: 'object',
      props: {
        ...settingsScheduleStart,
        rate: minZero,
      },
    },
  },
};

const carbRatio = {
  type: 'array',
  items: {
    type: 'object',
    props: {
      ...settingsScheduleStart,
      amount: minZero,
    },
  },
};

const insulinSensitivity = {
  type: 'array',
  items: {
    type: 'object',
    props: {
      ...settingsScheduleStart,
      amount: minZero,
    },
  },
};

const pumpSettingsAnimas = {
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
  basalSchedules,
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
  basalSchedules,
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
  basalSchedules,
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
  basalSchedules,
};

const pumpSettingsEquil = {
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
  basalSchedules,
};

const pumpSettingsLoop = {
  ...common,
  bgTargets: {
    type: 'objectWithUnknownKeys',
    schema: {
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
  },
  carbRatios: {
    type: 'objectWithUnknownKeys',
    schema: carbRatio,
  },
  insulinSensitivities: {
    type: 'objectWithUnknownKeys',
    schema: insulinSensitivity,
  },
  basalSchedules,
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
  basal: {
    basal: v.compile(basal),
    postShutdown: v.compile(basalPostShutdown),
  },
  bolus: {
    normal: v.compile(normalBolus),
    extended: v.compile(extendedBolus),
    combination: v.compile(combinationBolus),
  },
  cbg: v.compile(cbg),
  common: v.compile(common),
  deviceEvent: v.compile(deviceEvent),
  insulin: v.compile(insulin),
  message: v.compile(message),
  pumpSettings: {
    animas: v.compile(pumpSettingsAnimas),
    medtronic: v.compile(pumpSettingsMedtronic),
    omnipod: v.compile(pumpSettingsOmnipod),
    tandem: v.compile(pumpSettingsTandem),
    equil: v.compile(pumpSettingsEquil),
    'diy loop': v.compile(pumpSettingsLoop),
    'tidepool loop': v.compile(pumpSettingsLoop),
    twiist: v.compile(pumpSettingsLoop),
  },
  smbg: v.compile(bg),
  wizard: v.compile(wizard),
};
