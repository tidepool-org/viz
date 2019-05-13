import Validator from 'fastest-validator';

const v = new Validator();

const patterns = {
  id: /^[A-Za-z0-9\-_]+$/,
  ISODate: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,
  deviceTime: /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)$/,
};

const common = {
  deviceId: { type: 'string' },
  deviceTime: { type: 'string', pattern: patterns.deviceTime, optional: true },
  id: { type: 'string', pattern: patterns.id },
  time: { type: 'string', pattern: patterns.ISODate },
  uploadId: { type: 'string', pattern: patterns.id },
};

export default {
  checkCommon: v.compile(common),
};
