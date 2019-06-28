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

/* eslint-disable no-bitwise, no-mixed-operators, max-len */
import _ from 'lodash';

import { addDuration } from '../src/utils/datetime';
import { MGDL_UNITS, MS_IN_DAY, MMOLL_UNITS, MGDL_PER_MMOLL } from '../src/utils/constants';

const APPEND = '.000Z';

export const generateGUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

class Common {
  constructor(opts = {}) {
    this.deviceId = 'Test Page Data - 123';
    this.source = opts.source || 'testpage';
    this.conversionOffset = 0;
    this.uploadId = opts.uploadId || 'uploadId123';

    this.assignGUID();
  }

  assignGUID() {
    const guid = generateGUID();

    this.id = guid;
  }

  asObject() {
    const clone = {};

    _.forIn(this, (value, key) => {
      if (typeof key !== 'function') {
        clone[key] = value;
      }
    });

    return clone;
  }

  makeDeviceTime() {
    return new Date().toISOString().slice(0, -5);
  }

  makeNormalTime() {
    return this.deviceTime + APPEND;
  }

  makeTime() {
    const d = new Date(this.deviceTime + APPEND);
    const offsetMinutes = d.getTimezoneOffset();
    d.setUTCMinutes(d.getUTCMinutes() + offsetMinutes);
    return d.toISOString();
  }

  makeTimezoneOffset() {
    const d = new Date(this.deviceTime + APPEND);
    const offsetMinutes = d.getTimezoneOffset();
    return -offsetMinutes;
  }
}

export class Basal extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      deliveryType: 'scheduled',
      deviceTime: this.makeDeviceTime(),
      duration: MS_IN_DAY / 12,
      rate: 0.5,
    });

    this.type = 'basal';

    this.deliveryType = opts.deliveryType;
    this.deviceTime = opts.deviceTime;
    this.duration = opts.duration;
    this.rate = opts.rate;

    this.time = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
    if (!opts.raw) this.normalTime = this.makeNormalTime();
    if (!opts.raw) this.normalEnd = addDuration(this.normalTime, this.duration);
  }
}

export class Bolus extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      deviceTime: this.makeDeviceTime(),
      subType: 'normal',
      value: 5.0,
    });

    this.type = 'bolus';
    this.deviceTime = opts.deviceTime;
    this.subType = opts.subType;

    if (this.subType === 'normal') {
      this.normal = opts.value;
    }

    this.time = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
    if (!opts.raw) this.normalTime = this.makeNormalTime();
  }
}

export class CBG extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      deviceId: 'DexG4Rec_XXXXXXXXX',
      deviceTime: this.makeDeviceTime(),
      units: MGDL_UNITS,
      value: 100,
    });

    this.type = 'cbg';

    this.deviceTime = opts.deviceTime;
    this.deviceId = opts.deviceId;
    this.units = opts.units;
    this.value = opts.value;

    this.time = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
    if (opts.raw) {
      if (this.units === MGDL_UNITS) {
        this.units = MMOLL_UNITS;
        this.value = this.value / MGDL_PER_MMOLL;
      }
    } else {
      this.normalTime = this.makeNormalTime();
    }
  }
}

export class Message extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      messagetext: 'This is a note.',
      parentmessage: null,
      time: new Date().toISOString(),
    });

    this.type = 'message';

    this.time = opts.time;

    if (!opts.raw) {
      const dt = new Date(this.time);
      const offsetMinutes = dt.getTimezoneOffset();
      dt.setUTCMinutes(dt.getUTCMinutes() - offsetMinutes);

      this.normalTime = dt.toISOString();
      this.messageText = opts.messagetext;
      this.parentMessage = opts.parentmessage;
    } else {
      this.messagetext = opts.messagetext;
      this.parentmessage = opts.parentmessage;
    }
  }
}

export class Settings extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      activeSchedule: 'standard',
      basalSchedules: [{
        name: 'standard',
        value: [{
          start: 0,
          rate: 1.0,
        }],
      }],
      bgTarget: [{
        high: 100,
        low: 80,
        start: 0,
      }],
      carbRatio: [{
        amount: 15,
        start: 0,
      }],
      deviceTime: this.makeDeviceTime(),
      insulinSensitivity: [{
        amount: 50,
        start: 0,
      }],
      units: {
        carb: 'grams',
        bg: MGDL_UNITS,
      },
    });

    this.type = 'settings';

    this.activeSchedule = opts.activeSchedule;
    this.basalSchedules = opts.basalSchedules;
    this.bgTarget = opts.bgTarget;
    this.carbRatio = opts.carbRatio;
    this.deviceTime = opts.deviceTime;
    this.insulinSensitivity = opts.insulinSensitivity;
    this.units = opts.units;

    this.time = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
    if (opts.raw) {
      this.units.bg = MMOLL_UNITS;
      if (this.insulinSensitivity) this.insulinSensitivity.amount = this.insulinSensitivity.amount / MGDL_PER_MMOLL;
      if (this.bgTarget.target) this.bgTarget.target = this.bgTarget.target / MGDL_PER_MMOLL;
      if (this.bgTarget.low) this.bgTarget.low = this.bgTarget.low / MGDL_PER_MMOLL;
      if (this.bgTarget.high) this.bgTarget.high = this.bgTarget.high / MGDL_PER_MMOLL;
    } else {
      this.normalTime = this.makeNormalTime();
    }
  }
}

export class SMBG extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      deviceTime: this.makeDeviceTime(),
      displayOffset: 0,
      units: MGDL_UNITS,
      value: 100,
    });

    this.type = 'smbg';

    this.deviceTime = opts.deviceTime;
    this.units = opts.units;
    this.value = opts.value;

    this.time = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
    this.displayOffset = opts.displayOffset;

    if (opts.raw) {
      this.units = MMOLL_UNITS;
      this.value = this.value / MGDL_PER_MMOLL;
    } else {
      this.normalTime = this.makeNormalTime();
    }
  }
}

export class DeviceEvent extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      deviceTime: this.makeDeviceTime(),
      units: 'mg/dL',
      value: 100,
      primeTarget: 'cannula',
    });

    this.type = 'deviceEvent';
    this.subType = opts.subType;

    if (opts.subType === 'prime') {
      this.primeTarget = opts.primeTarget;
    }

    this.deviceTime = opts.deviceTime;

    this.time = this.makeTime();
    this.createdTime = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
    if (!opts.raw) this.normalTime = this.makeNormalTime();
  }
}

export class Upload extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      deviceTime: this.makeDeviceTime(),
      timezone: 'US/Eastern',
    });

    this.type = 'upload';
    this.deviceTags = opts.deviceTags;
    this.source = opts.source;
    this.deviceTime = opts.deviceTime;
    this.deviceModel = opts.deviceModel;

    this.time = this.makeTime();
    this.timezone = opts.timezone;
    if (!opts.raw) this.normalTime = this.makeNormalTime();
    this.createdTime = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
  }
}

export class Wizard extends Common {
  constructor(opts = {}) {
    super(opts);

    if (opts.bolus) {
      // eslint-disable-next-line no-param-reassign
      opts.deviceTime = opts.bolus.deviceTime;
    }
    _.defaults(opts, {
      bgTarget: {
        high: 120,
        target: 100,
      },
      deviceTime: this.makeDeviceTime(),
      insulinCarbRatio: 15,
      insulinSensitivity: 50,
      recommended: {},
      value: 5.0,
      units: MGDL_UNITS,
    });

    this.type = 'wizard';

    this.bgTarget = opts.bgTarget;
    this.bolus = opts.bolus ? opts.bolus : new Bolus({
      value: opts.value,
      deviceTime: this.deviceTime,
    });

    this.carbInput = opts.carbInput;
    this.deviceTime = opts.deviceTime;
    this.insulinCarbRatio = opts.insulinCarbRatio;
    this.insulinSensitivity = opts.insulinSensitivity;
    this.recommended = opts.recommended;

    this.time = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
    if (opts.raw) {
      this.bolus = this.bolus.id;

      this.units = MMOLL_UNITS;
      if (this.insulinSensitivity) this.insulinSensitivity = this.insulinSensitivity / MGDL_PER_MMOLL;
      if (this.bgInput) this.bgInput = this.bgInput / MGDL_PER_MMOLL;
      if (this.bgTarget.target) this.bgTarget.target = this.bgTarget.target / MGDL_PER_MMOLL;
      if (this.bgTarget.range) this.bgTarget.range = this.bgTarget.range / MGDL_PER_MMOLL;
      if (this.bgTarget.low) this.bgTarget.low = this.bgTarget.low / MGDL_PER_MMOLL;
      if (this.bgTarget.high) this.bgTarget.high = this.bgTarget.high / MGDL_PER_MMOLL;
    } else {
      this.normalTime = this.makeNormalTime();
    }
  }
}

export class Food extends Common {
  constructor(opts = {}) {
    super(opts);

    _.defaults(opts, {
      deviceTime: this.makeDeviceTime(),
    });

    this.type = 'food';
    this.deviceTime = opts.deviceTime;
    this.nutrition = opts.nutrition;

    this.time = this.makeTime();
    if (!opts.raw) this.normalTime = this.makeNormalTime();
    this.createdTime = this.makeTime();
    this.timezoneOffset = this.makeTimezoneOffset();
  }
}

export const types = {
  Basal,
  Bolus,
  CBG,
  DeviceEvent,
  Food,
  Message,
  Settings,
  SMBG,
  Upload,
  Wizard,
};

export default types;
