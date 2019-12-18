import _ from 'lodash';
import Validator from '../../../src/utils/validation/schema';
import Types from '../../../data/types';
import { MS_IN_DAY } from '../../../src/utils/constants';

import animasMultirate from '../../../data/pumpSettings/animas/multirate.raw.json';
import medtronicMultirate from '../../../data/pumpSettings/medtronic/multirate.raw.json';
import omnipodMultirate from '../../../data/pumpSettings/omnipod/multirate.raw.json';
import tandemMultirate from '../../../data/pumpSettings/tandem/multirate.raw.json';

/* eslint-disable max-len */

describe('schema validation', () => {
  const validateCommon = (datum, key) => {
    const validator = key ? Validator[datum.type][key] : Validator[datum.type];

    // Validate required fields
    expect(_.find(validator({ ...datum, id: undefined }), { field: 'id' }).message).to.equal('The \'id\' field is required!');
    expect(_.find(validator({ ...datum, type: undefined }), { field: 'type' }).message).to.equal('The \'type\' field is required!');
    expect(_.find(validator({ ...datum, time: undefined }), { field: 'time' }).message).to.equal('The \'time\' field is required!');
    expect(_.find(validator({ ...datum, uploadId: undefined }), { field: 'uploadId' }).message).to.equal('The \'uploadId\' field is required!');

    // validate type field
    const typeResult = validator({ ...datum, type: 'foo' });
    expect(_.find(typeResult, { field: 'type' }).message).to.equal('The \'type\' field does not match any of the allowed values!');
    expect(_.find(typeResult, { field: 'type' }).expected).to.have.members([
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
    ]);

    // deviceId is optional, so it should pass if undefined
    expect(validator({ ...datum, deviceId: undefined })).to.be.true;

    // Should fail when provided deviceId is wrong type
    expect(_.find(validator({ ...datum, deviceId: 3 }), { field: 'deviceId' }).message).to.equal('The \'deviceId\' field must be a string!');

    // deviceTime is optional, so it should pass if undefined
    expect(validator({ ...datum, deviceTime: undefined })).to.be.true;

    // Should pass when provided deviceTime matches pattern
    expect(validator({ ...datum, deviceTime: '2018-01-30T12:24:00' })).to.be.true;

    // Should fail when provided deviceTime doesn't match pattern
    expect(_.find(validator({ ...datum, deviceTime: 'foo' }), { field: 'deviceTime' }).message).to.equal('The \'deviceTime\' field fails to match the required pattern!');

    // Should pass when provided id matches pattern
    expect(validator({ ...datum, id: 'pp0gk17imoaamcoeika04sb99tthbdsj' })).to.be.true;

    // Should fail when provided id doesn't match pattern
    expect(_.find(validator({ ...datum, id: '*&^#ABC123' }), { field: 'id' }).message).to.equal('The \'id\' field fails to match the required pattern!');

    // Should pass when provided uploadId matches pattern
    expect(validator({ ...datum, uploadId: 'pp0gk17imoaamcoeika04sb99tthbdsj' })).to.be.true;

    // Should fail when provided uploadId doesn't match pattern
    expect(_.find(validator({ ...datum, uploadId: '*&^#ABC123' }), { field: 'uploadId' }).message).to.equal('The \'uploadId\' field fails to match the required pattern!');

    // Should pass when provided time is a date after 2008
    expect(validator({ ...datum, time: '2008-01-01T00:00:00.000Z' })).to.be.true;

    // Should fail when provided time isn't a date after 2008
    expect(_.find(validator({ ...datum, time: '2007-12-31T23:59:59.000Z' }), { field: 'time' }).message).to.equal('Must be an ISO datetime after 2008');
  };

  context('basal', () => {
    const basal = new Types.Basal({ raw: true });
    const missingRate = { ...basal, rate: undefined };
    const negativeRate = { ...basal, rate: -1 };
    const negativeDuration = { ...basal, duration: -1 };
    const zeroDuration = { ...basal, duration: 0 };
    const invalidDeliveryType = { ...basal, deliveryType: 'foo' };

    const suppressed = { ...basal, suppressed: { ...basal } };
    const suppressedInvalidDeliveryType = { ...basal, suppressed: { ...basal, deliveryType: 'foo' } };
    const suppressedMissingRate = { ...basal, suppressed: { ...basal, rate: undefined } };
    const suppressedNegativeRate = { ...basal, suppressed: { ...basal, rate: -1 } };
    const suppressedNegativeDuration = { ...basal, suppressed: { ...basal, duration: -1 } };
    const suppressedZeroDuration = { ...basal, suppressed: { ...basal, duration: 0 } };

    it('should validate a valid `basal` datum', () => {
      expect(Validator.basal(basal)).to.be.true;
    });

    it('should validate common fields', () => {
      validateCommon(basal);
    });

    it('should return an error for a non-positive `duration`', () => {
      expect(_.find(Validator.basal(negativeDuration), { field: 'duration' }).message).to.equal('The \'duration\' field must be a positive number!');
      expect(_.find(Validator.basal(zeroDuration), { field: 'duration' }).message).to.equal('The \'duration\' field must be a positive number!');
    });

    it('should return an error for missing `rate`', () => {
      expect(_.find(Validator.basal(missingRate), { field: 'rate' }).message).to.equal('The \'rate\' field is required!');
    });

    it('should return an error for a negative `rate`', () => {
      expect(_.find(Validator.basal(negativeRate), { field: 'rate' }).message).to.equal('The \'rate\' field must be greater than or equal to 0!');
    });

    it('should return an error for an invalid `deliveryType`', () => {
      const result = Validator.basal(invalidDeliveryType);
      expect(_.find(result, { field: 'deliveryType' }).message).to.equal('The \'deliveryType\' field does not match any of the allowed values!');
      expect(_.find(result, { field: 'deliveryType' }).expected).to.have.members(['scheduled', 'suspend', 'temp', 'automated']);
    });

    it('should validate the `suppressed` field if provided', () => {
      expect(Validator.basal(suppressed)).to.be.true;

      expect(_.find(Validator.basal(suppressedNegativeDuration), { field: 'suppressed.duration' }).message).to.equal('The \'suppressed.duration\' field must be a positive number!');
      expect(_.find(Validator.basal(suppressedZeroDuration), { field: 'suppressed.duration' }).message).to.equal('The \'suppressed.duration\' field must be a positive number!');

      expect(_.find(Validator.basal(suppressedMissingRate), { field: 'suppressed.rate' }).message).to.equal('The \'suppressed.rate\' field is required!');

      expect(_.find(Validator.basal(suppressedNegativeRate), { field: 'suppressed.rate' }).message).to.equal('The \'suppressed.rate\' field must be greater than or equal to 0!');

      const invalidDeliveryTypeResult = Validator.basal(suppressedInvalidDeliveryType);
      expect(_.find(invalidDeliveryTypeResult, { field: 'suppressed.deliveryType' }).message).to.equal('The \'suppressed.deliveryType\' field does not match any of the allowed values!');
      expect(_.find(invalidDeliveryTypeResult, { field: 'suppressed.deliveryType' }).expected).to.have.members(['scheduled', 'suspend', 'temp', 'automated']);
    });
  });

  describe('bolus', () => {
    context('normal', () => {
      const bolus = new Types.Bolus({ raw: true });

      const missingNormal = { ...bolus, normal: undefined };
      const zeroNormal = { ...bolus, normal: 0 };
      const negativeNormal = { ...bolus, normal: -1 };

      const expectedNormal = { ...bolus, normal: 1, expectedNormal: 1 };
      const zeroExpectedNormal = { ...bolus, normal: 1, expectedNormal: 0 };
      const negativeExpectedNormal = { ...bolus, normal: 1, expectedNormal: -1 };
      const expectedNormalMissingNormal = { ...bolus, normal: undefined, expectedNormal: 1 };

      const forbiddenDuration = { ...bolus, duration: 1 };
      const forbiddenExtended = { ...bolus, extended: 1 };
      const forbiddenExpectedExtended = { ...bolus, expectedExtended: 1 };

      const invalidSubType = { ...bolus, subType: 'foo' };
      const invalidWizard = { ...bolus, wizard: '*&^#ABC123' };

      it('should validate a valid normal `bolus` datum', () => {
        expect(Validator.bolus.normal(bolus)).to.be.true;
      });

      it('should validate common fields', () => {
        validateCommon(bolus, 'normal');
      });

      it('should pass for zero `normal`', () => {
        expect(Validator.bolus.normal(zeroNormal)).to.be.true;
      });

      it('should return an error for missing `normal`', () => {
        expect(_.find(Validator.bolus.normal(missingNormal), { field: 'normal' }).message).to.equal('The \'normal\' field is required!');
      });

      it('should return an error for a negative `normal`', () => {
        expect(_.find(Validator.bolus.normal(negativeNormal), { field: 'normal' }).message).to.equal('The \'normal\' field must be greater than or equal to 0!');
      });

      it('should pass for zero or positive `expectedNormal`', () => {
        expect(Validator.bolus.normal(expectedNormal)).to.be.true;
        expect(Validator.bolus.normal(zeroExpectedNormal)).to.be.true;
      });

      it('should return an error for a negative `expectedNormal`', () => {
        expect(_.find(Validator.bolus.normal(negativeExpectedNormal), { field: 'expectedNormal' }).message).to.equal('The \'expectedNormal\' field must be greater than or equal to 0!');
      });

      it('should return an error for an `expectedNormal` that\'s missing the `normal` field', () => {
        expect(_.find(Validator.bolus.normal(expectedNormalMissingNormal), { field: 'expectedNormal' }).message).to.contain('Field(s) \'normal\' are expected when field \'expectedNormal\' exists.');
      });

      it('should return an error for a forbidden `duration`', () => {
        expect(_.find(Validator.bolus.normal(forbiddenDuration), { field: 'duration' }).message).to.equal('The \'duration\' field is forbidden!');
      });

      it('should return an error for a forbidden `extended`', () => {
        expect(_.find(Validator.bolus.normal(forbiddenExtended), { field: 'extended' }).message).to.equal('The \'extended\' field is forbidden!');
      });

      it('should return an error for a forbidden `expectedExtended`', () => {
        expect(_.find(Validator.bolus.normal(forbiddenExpectedExtended), { field: 'expectedExtended' }).message).to.equal('The \'expectedExtended\' field is forbidden!');
      });

      it('should return an error for an invalid `subType`', () => {
        const result = Validator.bolus.normal(invalidSubType);
        expect(_.find(result, { field: 'subType' }).message).to.equal('The \'subType\' field does not match any of the allowed values!');
        expect(_.find(result, { field: 'subType' }).expected).to.have.members(['normal']);
      });

      it('should return an error for an invalid `wizard`', () => {
        const result = Validator.bolus.normal(invalidWizard);
        expect(_.find(result, { field: 'wizard' }).message).to.equal('The \'wizard\' field fails to match the required pattern!');
      });
    });

    context('extended', () => {
      const extendedBolus = { ...new Types.Bolus({ raw: true }), extended: 1, duration: 1, subType: 'square' };

      const missingDuration = { ...extendedBolus, duration: undefined };
      const zeroDuration = { ...extendedBolus, duration: 0 };
      const negativeDuration = { ...extendedBolus, duration: -1 };

      const zeroExpectedDuration = { ...extendedBolus, expectedDuration: 0 };
      const negativeExpectedDuration = { ...extendedBolus, expectedDuration: -1 };

      const missingExtended = { ...extendedBolus, extended: undefined };
      const zeroExtended = { ...extendedBolus, extended: 0 };
      const negativeExtended = { ...extendedBolus, extended: -1 };

      const expectedExtended = { ...extendedBolus, extended: 1, duration: 1, expectedDuration: 1, expectedExtended: 1 };
      const zeroExpectedExtended = { ...extendedBolus, extended: 1, duration: 1, expectedDuration: 1, expectedExtended: 0 };
      const negativeExpectedExtended = { ...extendedBolus, extended: 1, duration: 1, expectedDuration: 1, expectedExtended: -1 };
      const expectedExtendedMissingExtended = { ...expectedExtended, extended: undefined };
      const expectedExtendedMissingDuration = { ...expectedExtended, duration: undefined };
      const expectedExtendedMissingExpectedDuration = { ...expectedExtended, expectedDuration: undefined };

      const zeroNormal = { ...extendedBolus, normal: 0 };
      const negativeNormal = { ...extendedBolus, normal: -1 };

      const expectedNormal = { ...extendedBolus, normal: 1, expectedNormal: 1 };
      const zeroExpectedNormal = { ...extendedBolus, normal: 1, expectedNormal: 0 };
      const negativeExpectedNormal = { ...extendedBolus, normal: 1, expectedNormal: -1 };
      const expectedNormalMissingNormal = { ...extendedBolus, normal: undefined, expectedNormal: 1 };

      const invalidSubType = { ...extendedBolus, subType: 'foo' };
      const invalidWizard = { ...extendedBolus, wizard: '*&^#ABC123' };

      it('should validate a valid extended `bolus` datum', () => {
        expect(Validator.bolus.extended(extendedBolus)).to.be.true;
      });

      it('should validate common fields', () => {
        validateCommon(extendedBolus, 'extended');
      });

      it('should pass for zero `duration`', () => {
        expect(Validator.bolus.extended(zeroDuration)).to.be.true;
      });

      it('should return an error for missing `duration`', () => {
        expect(_.find(Validator.bolus.extended(missingDuration), { field: 'duration' }).message).to.equal('The \'duration\' field is required!');
      });

      it('should return an error for a negative `duration`', () => {
        expect(_.find(Validator.bolus.extended(negativeDuration), { field: 'duration' }).message).to.equal('The \'duration\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `expectedDuration`', () => {
        expect(Validator.bolus.extended(zeroExpectedDuration)).to.be.true;
      });

      it('should return an error for a negative `expectedDuration`', () => {
        expect(_.find(Validator.bolus.extended(negativeExpectedDuration), { field: 'expectedDuration' }).message).to.equal('The \'expectedDuration\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `extended`', () => {
        expect(Validator.bolus.extended(zeroExtended)).to.be.true;
      });

      it('should return an error for missing `extended`', () => {
        expect(_.find(Validator.bolus.extended(missingExtended), { field: 'extended' }).message).to.equal('The \'extended\' field is required!');
      });

      it('should return an error for a negative `extended`', () => {
        expect(_.find(Validator.bolus.extended(negativeExtended), { field: 'extended' }).message).to.equal('The \'extended\' field must be greater than or equal to 0!');
      });

      it('should pass for zero or positive `expectedExtended`', () => {
        expect(Validator.bolus.extended(expectedExtended)).to.be.true;
        expect(Validator.bolus.extended(zeroExpectedExtended)).to.be.true;
      });

      it('should return an error for a negative `expectedExtended`', () => {
        expect(_.find(Validator.bolus.extended(negativeExpectedExtended), { field: 'expectedExtended' }).message).to.equal('The \'expectedExtended\' field must be greater than or equal to 0!');
      });

      it('should return an error for an `expectedExtended` that\'s missing the `extended` field', () => {
        expect(_.find(Validator.bolus.extended(expectedExtendedMissingExtended), { field: 'expectedExtended' }).message).to.contain('Field(s) \'extended,duration,expectedDuration\' are expected when field \'expectedExtended\' exists.');
      });

      it('should return an error for an `expectedExtended` that\'s missing the `duration` field', () => {
        expect(_.find(Validator.bolus.extended(expectedExtendedMissingDuration), { field: 'expectedExtended' }).message).to.contain('Field(s) \'extended,duration,expectedDuration\' are expected when field \'expectedExtended\' exists.');
      });

      it('should return an error for an `expectedExtended` that\'s missing the `expectedDuration` field', () => {
        expect(_.find(Validator.bolus.extended(expectedExtendedMissingExpectedDuration), { field: 'expectedExtended' }).message).to.contain('Field(s) \'extended,duration,expectedDuration\' are expected when field \'expectedExtended\' exists.');
      });

      it('should pass for zero `normal`', () => {
        expect(Validator.bolus.extended(zeroNormal)).to.be.true;
      });

      it('should return an error for a negative `normal`', () => {
        expect(_.find(Validator.bolus.extended(negativeNormal), { field: 'normal' }).message).to.equal('The \'normal\' field must be greater than or equal to 0!');
      });

      it('should pass for zero or positive `expectedNormal`', () => {
        expect(Validator.bolus.extended(expectedNormal)).to.be.true;
        expect(Validator.bolus.extended(zeroExpectedNormal)).to.be.true;
      });

      it('should return an error for a negative `expectedNormal`', () => {
        expect(_.find(Validator.bolus.extended(negativeExpectedNormal), { field: 'expectedNormal' }).message).to.equal('The \'expectedNormal\' field must be greater than or equal to 0!');
      });

      it('should return an error for an `expectedNormal` that\'s missing the `normal` field', () => {
        expect(_.find(Validator.bolus.extended(expectedNormalMissingNormal), { field: 'expectedNormal' }).message).to.contain('Field(s) \'normal\' are expected when field \'expectedNormal\' exists.');
      });

      it('should return an error for an invalid `subType`', () => {
        const result = Validator.bolus.extended(invalidSubType);
        expect(_.find(result, { field: 'subType' }).message).to.equal('The \'subType\' field does not match any of the allowed values!');
        expect(_.find(result, { field: 'subType' }).expected).to.have.members(['square', 'dual/square']);
      });

      it('should return an error for an invalid `wizard`', () => {
        const result = Validator.bolus.extended(invalidWizard);
        expect(_.find(result, { field: 'wizard' }).message).to.equal('The \'wizard\' field fails to match the required pattern!');
      });
    });
  });

  describe('cbg', () => {
    const cbg = new Types.CBG({ raw: true });
    const negativeValue = { ...cbg, value: -1 };
    const zeroValue = { ...cbg, value: 0 };
    const invalidUnits = { ...cbg, units: 'foo' };

    it('should validate a valid `cbg` datum', () => {
      expect(Validator.cbg(cbg)).to.be.true;
    });

    it('should validate common fields', () => {
      validateCommon(cbg);
    });

    it('should return an error for a non-positive `value`', () => {
      expect(_.find(Validator.cbg(negativeValue), { field: 'value' }).message).to.equal('The \'value\' field must be a positive number!');
      expect(_.find(Validator.cbg(zeroValue), { field: 'value' }).message).to.equal('The \'value\' field must be a positive number!');
    });

    it('should return an error for an invalid `units`', () => {
      const result = Validator.cbg(invalidUnits);
      expect(_.find(result, { field: 'units' }).message).to.equal('The \'units\' field does not match any of the allowed values!');
      expect(_.find(result, { field: 'units' }).expected).to.have.members(['mg/dL', 'mmol/L']);
    });
  });

  describe('deviceEvent', () => {
    const deviceEvent = new Types.DeviceEvent({ raw: true });

    const withAnnotations = { ...deviceEvent, annotations: [
      { code: 'validcode 1' },
      { code: 'validcode 2' },
    ] };

    const withBadDeviceStatusAnnotation = { ...deviceEvent, annotations: [
      { code: 'validcode 1' },
      { code: 'status\/unknown-previous' },
    ] };

    it('should validate a valid `deviceEvent` datum', () => {
      expect(Validator.deviceEvent(deviceEvent)).to.be.true;
    });

    it('should validate common fields', () => {
      validateCommon(deviceEvent);
    });

    it('should pass for valid `annotations`', () => {
      expect(Validator.deviceEvent(withAnnotations)).to.be.true;
    });

    it('should return an error for an invalid `annotations` code', () => {
      expect(_.find(Validator.deviceEvent(withBadDeviceStatusAnnotation), { field: 'annotations[1].code' }).message).to.equal('The \'annotations[1].code\' field fails to match the required pattern!');
    });
  });

  describe('message', () => {
    const message = new Types.Message({ raw: true });
    const parentMessageNull = { ...message, parentMessage: null };
    const parentMessageId = { ...message, parentMessage: 'pp0gk17imoaamcoeika04sb99tthbdsj' };
    const parentMessageInvalidId = { ...message, parentMessage: '*&^#ABC123' };

    it('should validate a valid `message` datum', () => {
      expect(Validator.message(message)).to.be.true;
    });

    it('should pass when provided id matches pattern', () => {
      expect(Validator.message({ ...message, id: 'pp0gk17imoaamcoeika04sb99tthbdsj' })).to.be.true;
    });

    it('should fail when provided id doesn\'t match pattern', () => {
      expect(_.find(Validator.message({ ...message, id: '*&^#ABC123' }), { field: 'id' }).message).to.equal('The \'id\' field fails to match the required pattern!');
    });

    it('should pass when provided time is a date after 2008', () => {
      expect(Validator.message({ ...message, time: '2008-01-01T00:00:00.000Z' })).to.be.true;
    });

    it('should fail when provided time isn\'t a date after 2008', () => {
      expect(_.find(Validator.message({ ...message, time: '2007-12-31T23:59:59.000Z' }), { field: 'time' }).message).to.equal('Must be an ISO datetime after 2008');
    });

    it('should pass when provided `parentMessage` is `null`', () => {
      expect(Validator.message(parentMessageNull)).to.be.true;
    });

    it('should pass when provided `parentMessage` id matches pattern', () => {
      expect(Validator.message(parentMessageId)).to.be.true;
    });

    it('should return an error when provided `parentMessage` id doesn\'t match pattern', () => {
      expect(_.find(Validator.message(parentMessageInvalidId), { field: 'parentMessage' }).message).to.equal('The \'parentMessage\' field fails to match the required pattern!');
    });
  });

  describe('pumpSettings', () => {
    context('animas', () => {
      const bgTargetZeroStart = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], start: 0 }] };
      const bgTargetNegativeStart = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], start: -1 }] };
      const bgTargetMsInDayStart = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], start: MS_IN_DAY }] };
      const bgTargetAboveMsInDayStart = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], start: MS_IN_DAY + 1 }] };
      const bgTargetZeroTarget = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], target: 0 }] };
      const bgTargetNegativeTarget = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], target: -1 }] };
      const bgTargetZeroRange = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], range: 0 }] };
      const bgTargetNegativeRange = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], range: -1 }] };
      const bgTargetForbiddenLow = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], low: 1 }] };
      const bgTargetForbiddenHigh = { ...animasMultirate, bgTarget: [{ ...animasMultirate.bgTarget[0], high: 1 }] };

      const carbRatioZeroStart = { ...animasMultirate, carbRatio: [{ ...animasMultirate.carbRatio[0], start: 0 }] };
      const carbRatioNegativeStart = { ...animasMultirate, carbRatio: [{ ...animasMultirate.carbRatio[0], start: -1 }] };
      const carbRatioMsInDayStart = { ...animasMultirate, carbRatio: [{ ...animasMultirate.carbRatio[0], start: MS_IN_DAY }] };
      const carbRatioAboveMsInDayStart = { ...animasMultirate, carbRatio: [{ ...animasMultirate.carbRatio[0], start: MS_IN_DAY + 1 }] };
      const carbRatioZeroAmount = { ...animasMultirate, carbRatio: [{ ...animasMultirate.carbRatio[0], amount: 0 }] };
      const carbRatioNegativeAmount = { ...animasMultirate, carbRatio: [{ ...animasMultirate.carbRatio[0], amount: -1 }] };

      const insulinSensitivityZeroStart = { ...animasMultirate, insulinSensitivity: [{ ...animasMultirate.insulinSensitivity[0], start: 0 }] };
      const insulinSensitivityNegativeStart = { ...animasMultirate, insulinSensitivity: [{ ...animasMultirate.insulinSensitivity[0], start: -1 }] };
      const insulinSensitivityMsInDayStart = { ...animasMultirate, insulinSensitivity: [{ ...animasMultirate.insulinSensitivity[0], start: MS_IN_DAY }] };
      const insulinSensitivityAboveMsInDayStart = { ...animasMultirate, insulinSensitivity: [{ ...animasMultirate.insulinSensitivity[0], start: MS_IN_DAY + 1 }] };
      const insulinSensitivityZeroAmount = { ...animasMultirate, insulinSensitivity: [{ ...animasMultirate.insulinSensitivity[0], amount: 0 }] };
      const insulinSensitivityNegativeAmount = { ...animasMultirate, insulinSensitivity: [{ ...animasMultirate.insulinSensitivity[0], amount: -1 }] };

      const basalSchedulesZeroStart = { ...animasMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 0, rate: 1 }] } };
      const basalSchedulesNegativeStart = { ...animasMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: -1, rate: 1 }] } };
      const basalSchedulesMsInDayStart = { ...animasMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY, rate: 1 }] } };
      const basalSchedulesAboveMsInDayStart = { ...animasMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY + 1, rate: 1 }] } };
      const basalSchedulesZeroRate = { ...animasMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: 0 }] } };
      const basalSchedulesNegativeRate = { ...animasMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: -1 }] } };

      it('should validate a valid `pumpSettings` datum', () => {
        expect(Validator.pumpSettings.animas(animasMultirate)).to.be.true;
      });

      it('should validate common fields', () => {
        validateCommon(animasMultirate, 'animas');
      });

      it('should pass for zero `bgTarget[0].start`', () => {
        expect(Validator.pumpSettings.animas(bgTargetZeroStart)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].start`', () => {
        expect(_.find(Validator.pumpSettings.animas(bgTargetNegativeStart), { field: 'bgTarget[0].start' }).message).to.equal('The \'bgTarget[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `bgTarget[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.animas(bgTargetMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.animas(bgTargetAboveMsInDayStart), { field: 'bgTarget[0].start' }).message).to.equal('The \'bgTarget[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `bgTarget[0].target`', () => {
        expect(Validator.pumpSettings.animas(bgTargetZeroTarget)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].target`', () => {
        expect(_.find(Validator.pumpSettings.animas(bgTargetNegativeTarget), { field: 'bgTarget[0].target' }).message).to.equal('The \'bgTarget[0].target\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `bgTarget[0].range`', () => {
        expect(Validator.pumpSettings.animas(bgTargetZeroRange)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].range`', () => {
        expect(_.find(Validator.pumpSettings.animas(bgTargetNegativeRange), { field: 'bgTarget[0].range' }).message).to.equal('The \'bgTarget[0].range\' field must be greater than or equal to 0!');
      });

      it('should return an error for a forbidden `bgTarget[0].low`', () => {
        expect(_.find(Validator.pumpSettings.animas(bgTargetForbiddenLow), { field: 'bgTarget[0].low' }).message).to.equal('The \'bgTarget[0].low\' field is forbidden!');
      });

      it('should return an error for a forbidden `bgTarget[0].high`', () => {
        expect(_.find(Validator.pumpSettings.animas(bgTargetForbiddenHigh), { field: 'bgTarget[0].high' }).message).to.equal('The \'bgTarget[0].high\' field is forbidden!');
      });

      it('should pass for zero `carbRatio[0].start`', () => {
        expect(Validator.pumpSettings.animas(carbRatioZeroStart)).to.be.true;
      });

      it('should return an error for a negative `carbRatio[0].start`', () => {
        expect(_.find(Validator.pumpSettings.animas(carbRatioNegativeStart), { field: 'carbRatio[0].start' }).message).to.equal('The \'carbRatio[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `carbRatio[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.animas(carbRatioMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.animas(carbRatioAboveMsInDayStart), { field: 'carbRatio[0].start' }).message).to.equal('The \'carbRatio[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `carbRatio[0].amount`', () => {
        expect(Validator.pumpSettings.animas(carbRatioZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `carbRatio[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.animas(carbRatioNegativeAmount), { field: 'carbRatio[0].amount' }).message).to.equal('The \'carbRatio[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `insulinSensitivity[0].start`', () => {
        expect(Validator.pumpSettings.animas(insulinSensitivityZeroStart)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivity[0].start`', () => {
        expect(_.find(Validator.pumpSettings.animas(insulinSensitivityNegativeStart), { field: 'insulinSensitivity[0].start' }).message).to.equal('The \'insulinSensitivity[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `insulinSensitivity[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.animas(insulinSensitivityMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.animas(insulinSensitivityAboveMsInDayStart), { field: 'insulinSensitivity[0].start' }).message).to.equal('The \'insulinSensitivity[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `insulinSensitivity[0].amount`', () => {
        expect(Validator.pumpSettings.animas(insulinSensitivityZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivity[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.animas(insulinSensitivityNegativeAmount), { field: 'insulinSensitivity[0].amount' }).message).to.equal('The \'insulinSensitivity[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].start`', () => {
        expect(Validator.pumpSettings.animas(basalSchedulesZeroStart)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].start`', () => {
        expect(_.find(Validator.pumpSettings.animas(basalSchedulesNegativeStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `basalSchedules.NewSchedule[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.animas(basalSchedulesMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.animas(basalSchedulesAboveMsInDayStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].rate`', () => {
        expect(Validator.pumpSettings.animas(basalSchedulesZeroRate)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].rate`', () => {
        expect(_.find(Validator.pumpSettings.animas(basalSchedulesNegativeRate), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].rate\' field must be greater than or equal to 0!');
      });
    });

    context('medtronic', () => {
      const bgTargetZeroStart = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], start: 0 }] };
      const bgTargetNegativeStart = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], start: -1 }] };
      const bgTargetMsInDayStart = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], start: MS_IN_DAY }] };
      const bgTargetAboveMsInDayStart = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], start: MS_IN_DAY + 1 }] };
      const bgTargetZeroLow = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], low: 0 }] };
      const bgTargetNegativeLow = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], low: -1 }] };
      const bgTargetZeroHigh = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], high: 0 }] };
      const bgTargetNegativeHigh = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], high: -1 }] };
      const bgTargetForbiddenTarget = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], target: 1 }] };
      const bgTargetForbiddenRange = { ...medtronicMultirate, bgTarget: [{ ...medtronicMultirate.bgTarget[0], range: 1 }] };

      const carbRatioZeroStart = { ...medtronicMultirate, carbRatio: [{ ...medtronicMultirate.carbRatio[0], start: 0 }] };
      const carbRatioNegativeStart = { ...medtronicMultirate, carbRatio: [{ ...medtronicMultirate.carbRatio[0], start: -1 }] };
      const carbRatioMsInDayStart = { ...medtronicMultirate, carbRatio: [{ ...medtronicMultirate.carbRatio[0], start: MS_IN_DAY }] };
      const carbRatioAboveMsInDayStart = { ...medtronicMultirate, carbRatio: [{ ...medtronicMultirate.carbRatio[0], start: MS_IN_DAY + 1 }] };
      const carbRatioZeroAmount = { ...medtronicMultirate, carbRatio: [{ ...medtronicMultirate.carbRatio[0], amount: 0 }] };
      const carbRatioNegativeAmount = { ...medtronicMultirate, carbRatio: [{ ...medtronicMultirate.carbRatio[0], amount: -1 }] };

      const insulinSensitivityZeroStart = { ...medtronicMultirate, insulinSensitivity: [{ ...medtronicMultirate.insulinSensitivity[0], start: 0 }] };
      const insulinSensitivityNegativeStart = { ...medtronicMultirate, insulinSensitivity: [{ ...medtronicMultirate.insulinSensitivity[0], start: -1 }] };
      const insulinSensitivityMsInDayStart = { ...medtronicMultirate, insulinSensitivity: [{ ...medtronicMultirate.insulinSensitivity[0], start: MS_IN_DAY }] };
      const insulinSensitivityAboveMsInDayStart = { ...medtronicMultirate, insulinSensitivity: [{ ...medtronicMultirate.insulinSensitivity[0], start: MS_IN_DAY + 1 }] };
      const insulinSensitivityZeroAmount = { ...medtronicMultirate, insulinSensitivity: [{ ...medtronicMultirate.insulinSensitivity[0], amount: 0 }] };
      const insulinSensitivityNegativeAmount = { ...medtronicMultirate, insulinSensitivity: [{ ...medtronicMultirate.insulinSensitivity[0], amount: -1 }] };

      const basalSchedulesZeroStart = { ...medtronicMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 0, rate: 1 }] } };
      const basalSchedulesNegativeStart = { ...medtronicMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: -1, rate: 1 }] } };
      const basalSchedulesMsInDayStart = { ...medtronicMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY, rate: 1 }] } };
      const basalSchedulesAboveMsInDayStart = { ...medtronicMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY + 1, rate: 1 }] } };
      const basalSchedulesZeroRate = { ...medtronicMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: 0 }] } };
      const basalSchedulesNegativeRate = { ...medtronicMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: -1 }] } };

      it('should validate a valid `pumpSettings` datum', () => {
        expect(Validator.pumpSettings.medtronic(medtronicMultirate)).to.be.true;
      });

      it('should validate common fields', () => {
        validateCommon(medtronicMultirate, 'medtronic');
      });

      it('should pass for zero `bgTarget[0].start`', () => {
        expect(Validator.pumpSettings.medtronic(bgTargetZeroStart)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].start`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(bgTargetNegativeStart), { field: 'bgTarget[0].start' }).message).to.equal('The \'bgTarget[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `bgTarget[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.medtronic(bgTargetMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.medtronic(bgTargetAboveMsInDayStart), { field: 'bgTarget[0].start' }).message).to.equal('The \'bgTarget[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `bgTarget[0].low`', () => {
        expect(Validator.pumpSettings.medtronic(bgTargetZeroLow)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].low`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(bgTargetNegativeLow), { field: 'bgTarget[0].low' }).message).to.equal('The \'bgTarget[0].low\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `bgTarget[0].high`', () => {
        expect(Validator.pumpSettings.medtronic(bgTargetZeroHigh)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].high`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(bgTargetNegativeHigh), { field: 'bgTarget[0].high' }).message).to.equal('The \'bgTarget[0].high\' field must be greater than or equal to 0!');
      });

      it('should return an error for a forbidden `bgTarget[0].target`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(bgTargetForbiddenTarget), { field: 'bgTarget[0].target' }).message).to.equal('The \'bgTarget[0].target\' field is forbidden!');
      });

      it('should return an error for a forbidden `bgTarget[0].range`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(bgTargetForbiddenRange), { field: 'bgTarget[0].range' }).message).to.equal('The \'bgTarget[0].range\' field is forbidden!');
      });

      it('should pass for zero `carbRatio[0].start`', () => {
        expect(Validator.pumpSettings.medtronic(carbRatioZeroStart)).to.be.true;
      });

      it('should return an error for a negative `carbRatio[0].start`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(carbRatioNegativeStart), { field: 'carbRatio[0].start' }).message).to.equal('The \'carbRatio[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `carbRatio[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.medtronic(carbRatioMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.medtronic(carbRatioAboveMsInDayStart), { field: 'carbRatio[0].start' }).message).to.equal('The \'carbRatio[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `carbRatio[0].amount`', () => {
        expect(Validator.pumpSettings.medtronic(carbRatioZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `carbRatio[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(carbRatioNegativeAmount), { field: 'carbRatio[0].amount' }).message).to.equal('The \'carbRatio[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `insulinSensitivity[0].start`', () => {
        expect(Validator.pumpSettings.medtronic(insulinSensitivityZeroStart)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivity[0].start`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(insulinSensitivityNegativeStart), { field: 'insulinSensitivity[0].start' }).message).to.equal('The \'insulinSensitivity[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `insulinSensitivity[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.medtronic(insulinSensitivityMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.medtronic(insulinSensitivityAboveMsInDayStart), { field: 'insulinSensitivity[0].start' }).message).to.equal('The \'insulinSensitivity[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `insulinSensitivity[0].amount`', () => {
        expect(Validator.pumpSettings.medtronic(insulinSensitivityZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivity[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(insulinSensitivityNegativeAmount), { field: 'insulinSensitivity[0].amount' }).message).to.equal('The \'insulinSensitivity[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].start`', () => {
        expect(Validator.pumpSettings.medtronic(basalSchedulesZeroStart)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].start`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(basalSchedulesNegativeStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `basalSchedules.NewSchedule[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.medtronic(basalSchedulesMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.medtronic(basalSchedulesAboveMsInDayStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].rate`', () => {
        expect(Validator.pumpSettings.medtronic(basalSchedulesZeroRate)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].rate`', () => {
        expect(_.find(Validator.pumpSettings.medtronic(basalSchedulesNegativeRate), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].rate\' field must be greater than or equal to 0!');
      });
    });

    context('omnipod', () => {
      const bgTargetZeroStart = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], start: 0 }] };
      const bgTargetNegativeStart = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], start: -1 }] };
      const bgTargetMsInDayStart = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], start: MS_IN_DAY }] };
      const bgTargetAboveMsInDayStart = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], start: MS_IN_DAY + 1 }] };
      const bgTargetZeroTarget = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], target: 0 }] };
      const bgTargetNegativeTarget = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], target: -1 }] };
      const bgTargetZeroHigh = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], high: 0 }] };
      const bgTargetNegativeHigh = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], high: -1 }] };
      const bgTargetForbiddenLow = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], low: 1 }] };
      const bgTargetForbiddenRange = { ...omnipodMultirate, bgTarget: [{ ...omnipodMultirate.bgTarget[0], range: 1 }] };

      const carbRatioZeroStart = { ...omnipodMultirate, carbRatio: [{ ...omnipodMultirate.carbRatio[0], start: 0 }] };
      const carbRatioNegativeStart = { ...omnipodMultirate, carbRatio: [{ ...omnipodMultirate.carbRatio[0], start: -1 }] };
      const carbRatioMsInDayStart = { ...omnipodMultirate, carbRatio: [{ ...omnipodMultirate.carbRatio[0], start: MS_IN_DAY }] };
      const carbRatioAboveMsInDayStart = { ...omnipodMultirate, carbRatio: [{ ...omnipodMultirate.carbRatio[0], start: MS_IN_DAY + 1 }] };
      const carbRatioZeroAmount = { ...omnipodMultirate, carbRatio: [{ ...omnipodMultirate.carbRatio[0], amount: 0 }] };
      const carbRatioNegativeAmount = { ...omnipodMultirate, carbRatio: [{ ...omnipodMultirate.carbRatio[0], amount: -1 }] };

      const insulinSensitivityZeroStart = { ...omnipodMultirate, insulinSensitivity: [{ ...omnipodMultirate.insulinSensitivity[0], start: 0 }] };
      const insulinSensitivityNegativeStart = { ...omnipodMultirate, insulinSensitivity: [{ ...omnipodMultirate.insulinSensitivity[0], start: -1 }] };
      const insulinSensitivityMsInDayStart = { ...omnipodMultirate, insulinSensitivity: [{ ...omnipodMultirate.insulinSensitivity[0], start: MS_IN_DAY }] };
      const insulinSensitivityAboveMsInDayStart = { ...omnipodMultirate, insulinSensitivity: [{ ...omnipodMultirate.insulinSensitivity[0], start: MS_IN_DAY + 1 }] };
      const insulinSensitivityZeroAmount = { ...omnipodMultirate, insulinSensitivity: [{ ...omnipodMultirate.insulinSensitivity[0], amount: 0 }] };
      const insulinSensitivityNegativeAmount = { ...omnipodMultirate, insulinSensitivity: [{ ...omnipodMultirate.insulinSensitivity[0], amount: -1 }] };

      const basalSchedulesZeroStart = { ...omnipodMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 0, rate: 1 }] } };
      const basalSchedulesNegativeStart = { ...omnipodMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: -1, rate: 1 }] } };
      const basalSchedulesMsInDayStart = { ...omnipodMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY, rate: 1 }] } };
      const basalSchedulesAboveMsInDayStart = { ...omnipodMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY + 1, rate: 1 }] } };
      const basalSchedulesZeroRate = { ...omnipodMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: 0 }] } };
      const basalSchedulesNegativeRate = { ...omnipodMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: -1 }] } };

      it('should validate a valid `pumpSettings` datum', () => {
        expect(Validator.pumpSettings.omnipod(omnipodMultirate)).to.be.true;
      });

      it('should validate common fields', () => {
        validateCommon(omnipodMultirate, 'omnipod');
      });

      it('should pass for zero `bgTarget[0].start`', () => {
        expect(Validator.pumpSettings.omnipod(bgTargetZeroStart)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].start`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(bgTargetNegativeStart), { field: 'bgTarget[0].start' }).message).to.equal('The \'bgTarget[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `bgTarget[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.omnipod(bgTargetMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.omnipod(bgTargetAboveMsInDayStart), { field: 'bgTarget[0].start' }).message).to.equal('The \'bgTarget[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `bgTarget[0].target`', () => {
        expect(Validator.pumpSettings.omnipod(bgTargetZeroTarget)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].target`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(bgTargetNegativeTarget), { field: 'bgTarget[0].target' }).message).to.equal('The \'bgTarget[0].target\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `bgTarget[0].high`', () => {
        expect(Validator.pumpSettings.omnipod(bgTargetZeroHigh)).to.be.true;
      });

      it('should return an error for a negative `bgTarget[0].high`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(bgTargetNegativeHigh), { field: 'bgTarget[0].high' }).message).to.equal('The \'bgTarget[0].high\' field must be greater than or equal to 0!');
      });

      it('should return an error for a forbidden `bgTarget[0].low`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(bgTargetForbiddenLow), { field: 'bgTarget[0].low' }).message).to.equal('The \'bgTarget[0].low\' field is forbidden!');
      });

      it('should return an error for a forbidden `bgTarget[0].range`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(bgTargetForbiddenRange), { field: 'bgTarget[0].range' }).message).to.equal('The \'bgTarget[0].range\' field is forbidden!');
      });

      it('should pass for zero `carbRatio[0].start`', () => {
        expect(Validator.pumpSettings.omnipod(carbRatioZeroStart)).to.be.true;
      });

      it('should return an error for a negative `carbRatio[0].start`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(carbRatioNegativeStart), { field: 'carbRatio[0].start' }).message).to.equal('The \'carbRatio[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `carbRatio[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.omnipod(carbRatioMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.omnipod(carbRatioAboveMsInDayStart), { field: 'carbRatio[0].start' }).message).to.equal('The \'carbRatio[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `carbRatio[0].amount`', () => {
        expect(Validator.pumpSettings.omnipod(carbRatioZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `carbRatio[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(carbRatioNegativeAmount), { field: 'carbRatio[0].amount' }).message).to.equal('The \'carbRatio[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `insulinSensitivity[0].start`', () => {
        expect(Validator.pumpSettings.omnipod(insulinSensitivityZeroStart)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivity[0].start`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(insulinSensitivityNegativeStart), { field: 'insulinSensitivity[0].start' }).message).to.equal('The \'insulinSensitivity[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `insulinSensitivity[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.omnipod(insulinSensitivityMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.omnipod(insulinSensitivityAboveMsInDayStart), { field: 'insulinSensitivity[0].start' }).message).to.equal('The \'insulinSensitivity[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `insulinSensitivity[0].amount`', () => {
        expect(Validator.pumpSettings.omnipod(insulinSensitivityZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivity[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(insulinSensitivityNegativeAmount), { field: 'insulinSensitivity[0].amount' }).message).to.equal('The \'insulinSensitivity[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].start`', () => {
        expect(Validator.pumpSettings.omnipod(basalSchedulesZeroStart)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].start`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(basalSchedulesNegativeStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `basalSchedules.NewSchedule[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.omnipod(basalSchedulesMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.omnipod(basalSchedulesAboveMsInDayStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].rate`', () => {
        expect(Validator.pumpSettings.omnipod(basalSchedulesZeroRate)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].rate`', () => {
        expect(_.find(Validator.pumpSettings.omnipod(basalSchedulesNegativeRate), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].rate\' field must be greater than or equal to 0!');
      });
    });

    context('tandem', () => {
      const bgTargetsZeroStart = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], start: 0 }] } };
      const bgTargetsNegativeStart = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], start: -1 }] } };
      const bgTargetsMsInDayStart = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], start: MS_IN_DAY }] } };
      const bgTargetsAboveMsInDayStart = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], start: MS_IN_DAY + 1 }] } };
      const bgTargetsZeroTarget = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], target: 0 }] } };
      const bgTargetsNegativeTarget = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], target: -1 }] } };
      const bgTargetsForbiddenRange = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], range: 1 }] } };
      const bgTargetsForbiddenLow = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], low: 1 }] } };
      const bgTargetsForbiddenHigh = { ...tandemMultirate, bgTargets: { Normal: [{ ...tandemMultirate.bgTargets.Normal[0], high: 1 }] } };

      const carbRatiosZeroStart = { ...tandemMultirate, carbRatios: { Normal: [{ ...tandemMultirate.carbRatios.Normal[0], start: 0 }] } };
      const carbRatiosNegativeStart = { ...tandemMultirate, carbRatios: { Normal: [{ ...tandemMultirate.carbRatios.Normal[0], start: -1 }] } };
      const carbRatiosMsInDayStart = { ...tandemMultirate, carbRatios: { Normal: [{ ...tandemMultirate.carbRatios.Normal[0], start: MS_IN_DAY }] } };
      const carbRatiosAboveMsInDayStart = { ...tandemMultirate, carbRatios: { Normal: [{ ...tandemMultirate.carbRatios.Normal[0], start: MS_IN_DAY + 1 }] } };
      const carbRatiosZeroAmount = { ...tandemMultirate, carbRatios: { Normal: [{ ...tandemMultirate.carbRatios.Normal[0], amount: 0 }] } };
      const carbRatiosNegativeAmount = { ...tandemMultirate, carbRatios: { Normal: [{ ...tandemMultirate.carbRatios.Normal[0], amount: -1 }] } };

      const insulinSensitivitiesZeroStart = { ...tandemMultirate, insulinSensitivities: { Normal: [{ ...tandemMultirate.insulinSensitivities.Normal[0], start: 0 }] } };
      const insulinSensitivitiesNegativeStart = { ...tandemMultirate, insulinSensitivities: { Normal: [{ ...tandemMultirate.insulinSensitivities.Normal[0], start: -1 }] } };
      const insulinSensitivitiesMsInDayStart = { ...tandemMultirate, insulinSensitivities: { Normal: [{ ...tandemMultirate.insulinSensitivities.Normal[0], start: MS_IN_DAY }] } };
      const insulinSensitivitiesAboveMsInDayStart = { ...tandemMultirate, insulinSensitivities: { Normal: [{ ...tandemMultirate.insulinSensitivities.Normal[0], start: MS_IN_DAY + 1 }] } };
      const insulinSensitivitiesZeroAmount = { ...tandemMultirate, insulinSensitivities: { Normal: [{ ...tandemMultirate.insulinSensitivities.Normal[0], amount: 0 }] } };
      const insulinSensitivitiesNegativeAmount = { ...tandemMultirate, insulinSensitivities: { Normal: [{ ...tandemMultirate.insulinSensitivities.Normal[0], amount: -1 }] } };

      const basalSchedulesZeroStart = { ...tandemMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 0, rate: 1 }] } };
      const basalSchedulesNegativeStart = { ...tandemMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: -1, rate: 1 }] } };
      const basalSchedulesMsInDayStart = { ...tandemMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY, rate: 1 }] } };
      const basalSchedulesAboveMsInDayStart = { ...tandemMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: MS_IN_DAY + 1, rate: 1 }] } };
      const basalSchedulesZeroRate = { ...tandemMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: 0 }] } };
      const basalSchedulesNegativeRate = { ...tandemMultirate, basalSchedules: { ...animasMultirate.basalSchedules, NewSchedule: [{ start: 1, rate: -1 }] } };

      it('should validate a valid `pumpSettings` datum', () => {
        expect(Validator.pumpSettings.tandem(tandemMultirate)).to.be.true;
      });

      it('should validate common fields', () => {
        validateCommon(tandemMultirate, 'tandem');
      });

      it('should pass for zero `bgTarget[0].start`', () => {
        expect(Validator.pumpSettings.tandem(bgTargetsZeroStart)).to.be.true;
      });

      it('should return an error for a negative `bgTargets[0].start`', () => {
        expect(_.find(Validator.pumpSettings.tandem(bgTargetsNegativeStart)[0], { field: 'bgTargets[0].start' }).message).to.equal('The \'bgTargets[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `bgTargets[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.tandem(bgTargetsMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.tandem(bgTargetsAboveMsInDayStart)[0], { field: 'bgTargets[0].start' }).message).to.equal('The \'bgTargets[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `bgTargets[0].target`', () => {
        expect(Validator.pumpSettings.tandem(bgTargetsZeroTarget)).to.be.true;
      });

      it('should return an error for a negative `bgTargets[0].target`', () => {
        expect(_.find(Validator.pumpSettings.tandem(bgTargetsNegativeTarget)[0], { field: 'bgTargets[0].target' }).message).to.equal('The \'bgTargets[0].target\' field must be greater than or equal to 0!');
      });

      it('should return an error for a forbidden `bgTargets[0].low`', () => {
        expect(_.find(Validator.pumpSettings.tandem(bgTargetsForbiddenLow)[0], { field: 'bgTargets[0].low' }).message).to.equal('The \'bgTargets[0].low\' field is forbidden!');
      });

      it('should return an error for a forbidden `bgTargets[0].high`', () => {
        expect(_.find(Validator.pumpSettings.tandem(bgTargetsForbiddenHigh)[0], { field: 'bgTargets[0].high' }).message).to.equal('The \'bgTargets[0].high\' field is forbidden!');
      });

      it('should return an error for a forbidden `bgTargets[0].range`', () => {
        expect(_.find(Validator.pumpSettings.tandem(bgTargetsForbiddenRange)[0], { field: 'bgTargets[0].range' }).message).to.equal('The \'bgTargets[0].range\' field is forbidden!');
      });

      it('should pass for zero `carbRatios[0].start`', () => {
        expect(Validator.pumpSettings.tandem(carbRatiosZeroStart)).to.be.true;
      });

      it('should return an error for a negative `carbRatios[0].start`', () => {
        expect(_.find(Validator.pumpSettings.tandem(carbRatiosNegativeStart)[0], { field: 'carbRatios[0].start' }).message).to.equal('The \'carbRatios[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `carbRatios[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.tandem(carbRatiosMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.tandem(carbRatiosAboveMsInDayStart)[0], { field: 'carbRatios[0].start' }).message).to.equal('The \'carbRatios[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `carbRatios[0].amount`', () => {
        expect(Validator.pumpSettings.tandem(carbRatiosZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `carbRatios[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.tandem(carbRatiosNegativeAmount)[0], { field: 'carbRatios[0].amount' }).message).to.equal('The \'carbRatios[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `insulinSensitivities[0].start`', () => {
        expect(Validator.pumpSettings.tandem(insulinSensitivitiesZeroStart)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivities[0].start`', () => {
        expect(_.find(Validator.pumpSettings.tandem(insulinSensitivitiesNegativeStart)[0], { field: 'insulinSensitivities[0].start' }).message).to.equal('The \'insulinSensitivities[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `insulinSensitivities[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.tandem(insulinSensitivitiesMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.tandem(insulinSensitivitiesAboveMsInDayStart)[0], { field: 'insulinSensitivities[0].start' }).message).to.equal('The \'insulinSensitivities[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `insulinSensitivities[0].amount`', () => {
        expect(Validator.pumpSettings.tandem(insulinSensitivitiesZeroAmount)).to.be.true;
      });

      it('should return an error for a negative `insulinSensitivities[0].amount`', () => {
        expect(_.find(Validator.pumpSettings.tandem(insulinSensitivitiesNegativeAmount)[0], { field: 'insulinSensitivities[0].amount' }).message).to.equal('The \'insulinSensitivities[0].amount\' field must be greater than or equal to 0!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].start`', () => {
        expect(Validator.pumpSettings.tandem(basalSchedulesZeroStart)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].start`', () => {
        expect(_.find(Validator.pumpSettings.tandem(basalSchedulesNegativeStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be greater than or equal to 0!');
      });

      it('should return an error for a `basalSchedules.NewSchedule[0].start` greater than MS_IN_DAY', () => {
        expect(Validator.pumpSettings.tandem(basalSchedulesMsInDayStart)).to.be.true;
        expect(_.find(Validator.pumpSettings.tandem(basalSchedulesAboveMsInDayStart), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].start\' field must be less than or equal to 86400000!');
      });

      it('should pass for zero `basalSchedules.NewSchedule[0].rate`', () => {
        expect(Validator.pumpSettings.tandem(basalSchedulesZeroRate)).to.be.true;
      });

      it('should return an error for a negative `basalSchedules.NewSchedule[0].rate`', () => {
        expect(_.find(Validator.pumpSettings.tandem(basalSchedulesNegativeRate), { field: 'basalSchedules' })[0].message).to.equal('The \'basalSchedules[0].rate\' field must be greater than or equal to 0!');
      });
    });
  });

  describe('smbg', () => {
    const smbg = new Types.SMBG({ raw: true });
    const negativeValue = { ...smbg, value: -1 };
    const zeroValue = { ...smbg, value: 0 };
    const invalidUnits = { ...smbg, units: 'foo' };

    it('should validate a valid `smbg` datum', () => {
      expect(Validator.smbg(smbg)).to.be.true;
    });

    it('should validate common fields', () => {
      validateCommon(smbg);
    });

    it('should return an error for a non-positive `value`', () => {
      expect(_.find(Validator.smbg(negativeValue), { field: 'value' }).message).to.equal('The \'value\' field must be a positive number!');
      expect(_.find(Validator.smbg(zeroValue), { field: 'value' }).message).to.equal('The \'value\' field must be a positive number!');
    });

    it('should return an error for an invalid `units`', () => {
      const result = Validator.smbg(invalidUnits);
      expect(_.find(result, { field: 'units' }).message).to.equal('The \'units\' field does not match any of the allowed values!');
      expect(_.find(result, { field: 'units' }).expected).to.have.members(['mg/dL', 'mmol/L']);
    });
  });

  describe('wizard', () => {
    const wizard = new Types.Wizard({ raw: true });

    const zeroBgInput = { ...wizard, bgInput: 0 };
    const negativeBgInput = { ...wizard, bgInput: -1 };

    const missingBolus = { ...wizard, bolus: undefined };

    const zeroCarbInput = { ...wizard, carbInput: 0 };
    const negativeCarbInput = { ...wizard, carbInput: -1 };

    const zeroInsulinCarbRatio = { ...wizard, insulinCarbRatio: 0 };
    const negativeInsulinCarbRatio = { ...wizard, insulinCarbRatio: -1 };

    const zeroInsulinOnBoard = { ...wizard, insulinOnBoard: 0 };
    const negativeInsulinOnBoard = { ...wizard, insulinOnBoard: -1 };

    const zeroInsulinSensitivity = { ...wizard, insulinSensitivity: 0 };
    const negativeInsulinSensitivity = { ...wizard, insulinSensitivity: -1 };

    const recommendedZeroCarb = { ...wizard, recommended: { carb: 0 } };
    const recommendedNegativeCarb = { ...wizard, recommended: { carb: -1 } };

    const recommendedInvalidCorrection = { ...wizard, recommended: { correction: 'foo' } };
    const recommendedInvalidNet = { ...wizard, recommended: { net: 'foo' } };

    it('should validate a valid `wizard` datum', () => {
      expect(Validator.wizard(wizard)).to.be.true;
    });

    it('should validate common fields', () => {
      validateCommon(wizard);
    });

    it('should pass for zero `bgInput`', () => {
      expect(Validator.wizard(zeroBgInput)).to.be.true;
    });

    it('should return an error for a negative `bgInput`', () => {
      expect(_.find(Validator.wizard(negativeBgInput), { field: 'bgInput' }).message).to.equal('The \'bgInput\' field must be greater than or equal to 0!');
    });

    it('should return an error for missing `bolus`', () => {
      expect(_.find(Validator.wizard(missingBolus), { field: 'bolus' }).message).to.equal('The \'bolus\' field is required!');
    });

    it('should pass for zero `carbInput`', () => {
      expect(Validator.wizard(zeroCarbInput)).to.be.true;
    });

    it('should return an error for a negative `carbInput`', () => {
      expect(_.find(Validator.wizard(negativeCarbInput), { field: 'carbInput' }).message).to.equal('The \'carbInput\' field must be greater than or equal to 0!');
    });

    it('should pass for zero `insulinCarbRatio`', () => {
      expect(Validator.wizard(zeroInsulinCarbRatio)).to.be.true;
    });

    it('should return an error for a negative `insulinCarbRatio`', () => {
      expect(_.find(Validator.wizard(negativeInsulinCarbRatio), { field: 'insulinCarbRatio' }).message).to.equal('The \'insulinCarbRatio\' field must be greater than or equal to 0!');
    });

    it('should pass for zero `insulinOnBoard`', () => {
      expect(Validator.wizard(zeroInsulinOnBoard)).to.be.true;
    });

    it('should return an error for a negative `insulinOnBoard`', () => {
      expect(_.find(Validator.wizard(negativeInsulinOnBoard), { field: 'insulinOnBoard' }).message).to.equal('The \'insulinOnBoard\' field must be greater than or equal to 0!');
    });

    it('should pass for zero `insulinSensitivity`', () => {
      expect(Validator.wizard(zeroInsulinSensitivity)).to.be.true;
    });

    it('should return an error for a negative `insulinSensitivity`', () => {
      expect(_.find(Validator.wizard(negativeInsulinSensitivity), { field: 'insulinSensitivity' }).message).to.equal('The \'insulinSensitivity\' field must be greater than or equal to 0!');
    });

    it('should pass for zero `recommended.carb`', () => {
      expect(Validator.wizard(recommendedZeroCarb)).to.be.true;
    });

    it('should return an error for a negative `recommended.carb`', () => {
      expect(_.find(Validator.wizard(recommendedNegativeCarb), { field: 'recommended.carb' }).message).to.equal('The \'recommended.carb\' field must be greater than or equal to 0!');
    });

    it('should return an error for an non-numeric `recommended.correction` code', () => {
      expect(_.find(Validator.wizard(recommendedInvalidCorrection), { field: 'recommended.correction' }).message).to.equal('The \'recommended.correction\' field must be a number!');
    });

    it('should return an error for an non-numeric `recommended.net` code', () => {
      expect(_.find(Validator.wizard(recommendedInvalidNet), { field: 'recommended.net' }).message).to.equal('The \'recommended.net\' field must be a number!');
    });
  });
});
