import _ from 'lodash';
import Validator from '../../../src/utils/validation/schema';
import Types from '../../../data/types';

/* eslint-disable max-len */

describe.only('schema validation', () => {
  const validateCommon = (datum, key) => {
    const validator = key ? Validator[datum.type][key] : Validator[datum.type];

    // Validate required fields
    expect(_.find(validator({ ...datum, deviceId: undefined }), { field: 'deviceId' }).message).to.equal('The \'deviceId\' field is required!');
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

    // Should fail when provided id doesn't match pattern
    expect(_.find(validator({ ...datum, uploadId: '*&^#ABC123' }), { field: 'uploadId' }).message).to.equal('The \'uploadId\' field fails to match the required pattern!');

    // Should pass when provided time is a date after 2008
    expect(validator({ ...datum, time: '2008-01-01T00:00:00.000Z' })).to.be.true;

    // Should fail when provided time isn't a date after 2008
    expect(_.find(validator({ ...datum, time: '2007-12-31T23:59:59.000Z' }), { field: 'time' }).message).to.equal('Must be an ISO datetime after 2008');
  };

  context('basal', () => {
    const basal = new Types.Basal();
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
      const bolus = new Types.Bolus();

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
    });

    context('extended', () => {
      const extendedBolus = { ...new Types.Bolus(), extended: 1, duration: 1, subType: 'square' };

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
    });
  });

  describe('cbg', () => {
    const cbg = new Types.CBG();
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
    const deviceEvent = new Types.DeviceEvent();

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

  describe('smbg', () => {
    const smbg = new Types.SMBG();
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

  describe('message', () => {
    const message = new Types.Message();
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
      expect(Validator.message({ ...message, id: 'pp0gk17imoaamcoeika04sb99tthbdsj' })).to.be.true;
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
});
