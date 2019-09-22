import _ from 'lodash';

import DataUtil from '../../src/utils/DataUtil';
import { types as Types } from '../../data/types';
import { MGDL_UNITS, MS_IN_HOUR } from '../../src/utils/constants';
/* eslint-disable max-len, no-underscore-dangle */

describe.only('DataUtil', () => {
  let dataUtil;

  const useRawData = {
    raw: true,
  };

  const basalDatumOverlappingStart = new Types.Basal({
    duration: MS_IN_HOUR * 2,
    deviceTime: '2018-01-31T23:00:00',
    source: 'Medtronic',
    deviceModel: '1780',
    deliveryType: 'automated',
    rate: 0.5,
    ...useRawData,
  });

  const basalDatumOverlappingEnd = new Types.Basal({
    duration: MS_IN_HOUR * 3,
    deviceTime: '2018-02-01T22:00:00',
    source: 'Medtronic',
    deviceModel: '1780',
    deliveryType: 'automated',
    rate: 0.5,
    ...useRawData,
  });

  const basalData = _.map([
    new Types.Basal({
      duration: MS_IN_HOUR,
      deviceTime: '2018-02-01T01:00:00',
      source: 'Medtronic',
      deviceModel: '1780',
      deliveryType: 'automated',
      rate: 0.25,
      ...useRawData,
    }),
    new Types.Basal({
      duration: MS_IN_HOUR,
      deviceTime: '2018-02-01T02:00:00',
      source: 'Medtronic',
      deviceModel: '1780',
      deliveryType: 'scheduled',
      rate: 0.75,
      ...useRawData,
    }),
    new Types.Basal({
      duration: MS_IN_HOUR,
      deviceTime: '2018-02-01T03:00:00',
      source: 'Medtronic',
      deviceModel: '1780',
      deliveryType: 'scheduled',
      rate: 0.5,
      ...useRawData,
    }),
  ], _.toPlainObject);

  const bolusData = _.map([
    new Types.Bolus({
      deviceTime: '2018-02-01T01:00:00',
      value: 4,
      ...useRawData,
    }),
    new Types.Bolus({
      deviceTime: '2018-02-01T02:00:00',
      value: 5,
      ...useRawData,
    }),
    new Types.Bolus({
      deviceTime: '2018-02-01T03:00:00',
      value: 6,
      ...useRawData,
    }),
  ], _.toPlainObject);

  const cbgData = _.map([
    new Types.CBG({
      deviceId: 'AbbottFreeStyleLibre-XXX-XXXX',
      value: 50,
      deviceTime: '2018-02-01T00:00:00',
      ...useRawData,
    }),
    new Types.CBG({
      deviceId: 'AbbottFreeStyleLibre-XXX-XXXX',
      value: 60,
      deviceTime: '2018-02-01T00:15:00',
      ...useRawData,
    }),
    new Types.CBG({
      deviceId: 'AbbottFreeStyleLibre-XXX-XXXX',
      value: 100,
      deviceTime: '2018-02-01T00:30:00',
      ...useRawData,
    }),
    new Types.CBG({
      deviceId: 'Dexcom-XXX-XXXX',
      value: 190,
      deviceTime: '2018-02-01T00:45:00',
      ...useRawData,
    }),
    new Types.CBG({
      deviceId: 'Dexcom-XXX-XXXX',
      value: 260,
      deviceTime: '2018-02-01T00:50:00',
      ...useRawData,
    }),
  ], _.toPlainObject);

  const foodData = _.map([
    new Types.Food({
      deviceTime: '2018-02-01T02:00:00',
      nutrition: {
        carbohydrate: {
          net: 7,
        },
      },
      ...useRawData,
    }),
    new Types.Food({
      deviceTime: '2018-02-01T04:00:00',
      nutrition: {
        carbohydrate: {
          net: 9,
        },
      },
      ...useRawData,
    }),
    new Types.Food({
      deviceTime: '2018-02-02T04:00:00',
      nutrition: {
        carbohydrate: {
          net: 13,
        },
      },
      ...useRawData,
    }),
  ], _.toPlainObject);

  const smbgData = _.map([
    new Types.SMBG({
      value: 60,
      deviceTime: '2018-02-01T00:00:00',
      ...useRawData,
    }),
    new Types.SMBG({
      value: 70,
      deviceTime: '2018-02-01T00:15:00',
      ...useRawData,
    }),
    new Types.SMBG({
      value: 80,
      deviceTime: '2018-02-01T00:30:00',
      ...useRawData,
    }),
    new Types.SMBG({
      value: 200,
      deviceTime: '2018-02-01T00:45:00',
      ...useRawData,
    }),
    new Types.SMBG({
      value: 270,
      deviceTime: '2018-02-01T00:50:00',
      ...useRawData,
    }),
  ], _.toPlainObject);

  const uploadData = _.map([
    new Types.Upload({
      deviceTags: ['insulin-pump'],
      source: 'Insulet',
      deviceModel: 'dash',
      deviceTime: '2018-01-02T00:00:00',
      ...useRawData,
    }),
    new Types.Upload({
      deviceTags: ['insulin-pump'],
      source: 'Medtronic',
      deviceModel: '1780',
      deviceTime: '2018-02-02T00:00:00',
      ...useRawData,
    }),
  ], _.toPlainObject);

  const wizardData = _.map([
    new Types.Wizard({
      deviceTime: '2018-02-01T01:00:00',
      carbInput: 4,
      bolus: bolusData[0],
      ...useRawData,
    }),
    new Types.Wizard({
      deviceTime: '2018-02-01T02:00:00',
      bolus: bolusData[1],
      ...useRawData,
    }),
    new Types.Wizard({
      deviceTime: '2018-02-01T03:00:00',
      carbInput: 2,
      bolus: bolusData[2],
      ...useRawData,
    }),
  ], _.toPlainObject);

  const defaultData = [
    ...basalData,
    ...bolusData,
    ...cbgData,
    ...foodData,
    ...smbgData,
    ...uploadData,
    ...wizardData,
  ];

  const bgPrefs = {
    bgClasses: {
      'very-low': { boundary: 54 },
      low: { boundary: 70 },
      target: { boundary: 180 },
      high: { boundary: 250 },
    },
    bgUnits: MGDL_UNITS,
  };

  const dayEndpoints = [
    '2018-02-01T00:00:00.000Z',
    '2018-02-02T00:00:00.000Z',
  ];

  const twoDayEndpoints = [
    '2018-02-01T00:00:00.000Z',
    '2018-02-03T00:00:00.000Z',
  ];

  const twoWeekEndpoints = [
    '2018-02-01T00:00:00.000Z',
    '2018-02-15T00:00:00.000Z',
  ];

  const defaultQuery = {
    bgPrefs,
    endpoints: dayEndpoints,
  };

  const initDataUtil = (dataset) => {
    dataUtil = new DataUtil(dataset);
  };

  const initDataUtilWithQuery = (dataset, query) => {
    dataUtil = new DataUtil(dataset);
    dataUtil.query(query);
  };

  const createQuery = overrides => _.assign({}, defaultQuery, overrides);

  beforeEach(() => {
    initDataUtil([]);
  });

  describe('constructor init', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
    });

    it('should initialize the data crossfilter', () => {
      expect(dataUtil.data).to.be.an('object');
      expect(dataUtil.data.size()).to.equal(defaultData.length);
    });

    it('should set up crossfilter dimensions', () => {
      expect(dataUtil.dimension).to.be.an('object');
    });

    it('should set up crossfilter filters', () => {
      expect(dataUtil.filter).to.be.an('object');
    });

    it('should set up crossfilter sorts', () => {
      expect(dataUtil.sort).to.be.an('object');
    });
  });

  describe('addData', () => {
    it('should create and/or update the `bolusToWizardIdMap`', () => {
      delete dataUtil.bolusToWizardIdMap;
      expect(dataUtil.bolusToWizardIdMap).to.be.undefined;

      dataUtil.addData(defaultData);
      expect(dataUtil.bolusToWizardIdMap).to.be.an('object').and.have.keys([
        bolusData[0].id,
        bolusData[1].id,
        bolusData[2].id,
      ]);

      const newBolus = new Types.Bolus({ ...useRawData });
      const newWizard = new Types.Wizard({ bolus: newBolus, ...useRawData });
      dataUtil.addData([newBolus, newWizard]);

      expect(dataUtil.bolusToWizardIdMap).to.be.an('object').and.have.keys([
        bolusData[0].id,
        bolusData[1].id,
        bolusData[2].id,
        newBolus.id,
      ]);

      expect(dataUtil.bolusToWizardIdMap[newBolus.id]).to.equal(newWizard.id);
    });

    it('should create and/or update the `bolusDatumsByIdMap`', () => {
      delete dataUtil.bolusDatumsByIdMap;
      expect(dataUtil.bolusDatumsByIdMap).to.be.undefined;

      dataUtil.addData(defaultData);
      expect(dataUtil.bolusDatumsByIdMap).to.be.an('object').and.have.keys([
        bolusData[0].id,
        bolusData[1].id,
        bolusData[2].id,
      ]);

      const newBolus = new Types.Bolus({ ...useRawData });
      dataUtil.addData([newBolus]);

      expect(dataUtil.bolusDatumsByIdMap).to.be.an('object').and.have.keys([
        bolusData[0].id,
        bolusData[1].id,
        bolusData[2].id,
        newBolus.id,
      ]);

      expect(dataUtil.bolusDatumsByIdMap[newBolus.id].id).to.eql(newBolus.id);
    });

    it('should create and/or update the `wizardDatumsByIdMap`', () => {
      delete dataUtil.wizardDatumsByIdMap;
      expect(dataUtil.wizardDatumsByIdMap).to.be.undefined;

      dataUtil.addData(defaultData);
      expect(dataUtil.wizardDatumsByIdMap).to.be.an('object').and.have.keys([
        wizardData[0].id,
        wizardData[1].id,
        wizardData[2].id,
      ]);

      const newWizard = new Types.Wizard({ ...useRawData });
      dataUtil.addData([newWizard]);

      expect(dataUtil.wizardDatumsByIdMap).to.be.an('object').and.have.keys([
        wizardData[0].id,
        wizardData[1].id,
        wizardData[2].id,
        newWizard.id,
      ]);

      expect(dataUtil.wizardDatumsByIdMap[newWizard.id].id).to.eql(newWizard.id);
    });

    it('should create and/or update the `latestDatumByType`', () => {
      delete dataUtil.latestDatumByType;
      expect(dataUtil.latestDatumByType).to.be.undefined;

      dataUtil.addData(defaultData);
      expect(dataUtil.latestDatumByType).to.be.an('object').and.have.keys([
        'basal',
        'bolus',
        'cbg',
        'food',
        'smbg',
        'upload',
        'wizard',
      ]);

      expect(dataUtil.latestDatumByType.wizard.id).to.eql(wizardData[2].id);

      const newWizard = new Types.Wizard({ deviceTime: '2018-02-01T04:00:00', ...useRawData });
      dataUtil.addData([newWizard]);

      expect(dataUtil.latestDatumByType.wizard.id).to.eql(newWizard.id);
    });

    it('should call `normalizeDatumIn` on each incoming datum', () => {
      sinon.spy(dataUtil, 'normalizeDatumIn');
      sinon.assert.notCalled(dataUtil.normalizeDatumIn);
      dataUtil.addData(defaultData);

      sinon.assert.called(dataUtil.normalizeDatumIn);
      sinon.assert.callCount(dataUtil.normalizeDatumIn, defaultData.length);
    });

    it('should call `joinWizardAndBolus` on each incoming datum', () => {
      sinon.spy(dataUtil, 'joinWizardAndBolus');
      sinon.assert.notCalled(dataUtil.joinWizardAndBolus);
      dataUtil.addData(defaultData);

      sinon.assert.called(dataUtil.joinWizardAndBolus);
      sinon.assert.callCount(dataUtil.joinWizardAndBolus, defaultData.length);
    });

    it('should call `tagDatum` on each incoming datum', () => {
      sinon.spy(dataUtil, 'tagDatum');
      sinon.assert.notCalled(dataUtil.tagDatum);
      dataUtil.addData(defaultData);

      sinon.assert.called(dataUtil.tagDatum);
      sinon.assert.callCount(dataUtil.tagDatum, defaultData.length);
    });

    it('should call `setMetaData`', () => {
      sinon.spy(dataUtil, 'setMetaData');
      sinon.assert.notCalled(dataUtil.setMetaData);

      dataUtil.addData(defaultData);

      sinon.assert.callCount(dataUtil.setMetaData, 1);
    });
  });

  describe('normalizeDatumIn', () => {
    context('all types', () => {
      it('should call `validateDatumIn` on the datum', () => {
        const datum = { type: 'any' };
        dataUtil.validateDatumIn = sinon.stub().returns(datum);

        dataUtil.normalizeDatumIn(datum);
        sinon.assert.calledWith(dataUtil.validateDatumIn, datum);
      });

      it('should return without post-processing if `validateDatumIn` fails', () => {
        const datum1 = { type: 'any', time: '2018-02-01T01:00:00' };
        dataUtil.validateDatumIn = sinon.stub().returns(datum1);
        dataUtil.normalizeDatumIn(datum1);
        expect(datum1.time).to.be.a('number');

        const datum2 = { type: 'any', time: '2018-02-01T01:00:00' };
        dataUtil.validateDatumIn = sinon.stub().callsFake(d => {
          d.reject = true; // eslint-disable-line no-param-reassign
          return d;
        });

        dataUtil.normalizeDatumIn(datum2);
        expect(datum2.time).to.equal('2018-02-01T01:00:00');
      });

      it('should convert `time` string to UTC hammertime timestamp', () => {
        const datum = { type: 'any', time: '2018-02-01T01:00:00' };
        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.time).to.equal(1517446800000);
      });

      it('should convert `deviceTime` string to UTC hammertime timestamp', () => {
        const datum = { type: 'any', time: '2018-02-01T01:00:00', deviceTime: '2018-02-01T02:00:00' };
        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.time).to.equal(1517446800000);
        expect(datum.deviceTime).to.equal(datum.time + MS_IN_HOUR);
      });

      it('should set missing `deviceTime` to processed `time`', () => {
        const datum = { type: 'any', time: '2018-02-01T01:00:00' };
        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.time).to.equal(1517446800000);
        expect(datum.deviceTime).to.equal(datum.time);
      });

      it('should update `latestDatumByType` if time is more recent that the datum curretnly set', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const datum = { type: 'any', id: 1, time: '2018-02-01T01:00:00' };
        dataUtil.normalizeDatumIn(datum);
        dataUtil.latestDatumByType = { any: datum };
        expect(dataUtil.latestDatumByType.any.id).to.equal(1);

        const olderDatum = { type: 'any', id: 2, time: '2018-02-01T00:00:00' };
        dataUtil.normalizeDatumIn(olderDatum);
        expect(dataUtil.latestDatumByType.any.id).to.equal(1);

        const newerDatum = { type: 'any', id: 3, time: '2018-02-01T02:00:00' };
        dataUtil.normalizeDatumIn(newerDatum);
        expect(dataUtil.latestDatumByType.any.id).to.equal(3);
      });
    });

    context('basal', () => {
      it('should add a missing rate of `0.0` to suspends', () => {
        const suspendWithoutRate = { ...new Types.Basal({ deliveryType: 'suspend', ...useRawData }), rate: undefined };
        expect(suspendWithoutRate.rate).to.be.undefined;
        dataUtil.normalizeDatumIn(suspendWithoutRate);
        expect(suspendWithoutRate.rate).to.equal(0.0);
      });

      it('should call `normalizeSuppressedBasal` on suppressed basals', () => {
        sinon.spy(dataUtil, 'normalizeSuppressedBasal');

        const withoutSuppressed = new Types.Basal({ deliveryType: 'suspend', ...useRawData });
        const withSuppressed = { ...withoutSuppressed, suppressed: { id: 'suppressed' } };

        dataUtil.normalizeDatumIn(withoutSuppressed);
        sinon.assert.notCalled(dataUtil.normalizeSuppressedBasal);

        dataUtil.normalizeDatumIn(withSuppressed);
        sinon.assert.calledWith(dataUtil.normalizeSuppressedBasal, withSuppressed);
      });
    });

    context('message', () => {
      it('should add a type of `message`', () => {
        const message = { messagetext: 'hi' };
        dataUtil.normalizeDatumIn(message);
        expect(message.type).to.equal('message');
      });

      it('should copy `messagetext` to `messageText`', () => {
        const message = { messagetext: 'hi' };
        dataUtil.normalizeDatumIn(message);
        expect(message.messageText).to.equal('hi');
      });

      it('should copy `parentmessage` to `parentMessage`', () => {
        const message = { messagetext: 'hi', parentmessage: 'hello' };
        dataUtil.normalizeDatumIn(message);
        expect(message.parentMessage).to.equal('hello');
      });

      it('should copy `timestamp` to `time`', () => {
        const message = { messagetext: 'hi', timestamp: '12345' };
        dataUtil.normalizeDatumIn(message);
        expect(message.time).to.equal('12345');
      });
    });

    context('wizard', () => {
      it('should add the datum to the `wizardDatumsByIdMap` if bolus field is a string', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const wizardWithBolusObject = { type: 'wizard', id: '1', bolus: {} };
        dataUtil.normalizeDatumIn(wizardWithBolusObject);
        expect(dataUtil.wizardDatumsByIdMap[wizardWithBolusObject.id]).to.be.undefined;

        const wizardWithBolusString = { type: 'wizard', id: '2', bolus: '12345' };
        dataUtil.normalizeDatumIn(wizardWithBolusString);
        expect(dataUtil.wizardDatumsByIdMap[wizardWithBolusString.id]).to.eql(wizardWithBolusString);
      });

      it('should add the datum id to the `bolusToWizardIdMap` with the bolus id as a key if bolus field is a string', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const wizardWithBolusObject = { type: 'wizard', id: '1', bolus: { id: '12345' } };
        dataUtil.normalizeDatumIn(wizardWithBolusObject);
        expect(dataUtil.bolusToWizardIdMap['12345']).to.be.undefined;

        const wizardWithBolusString = { type: 'wizard', id: '2', bolus: '12345' };
        dataUtil.normalizeDatumIn(wizardWithBolusString);
        expect(dataUtil.bolusToWizardIdMap['12345']).to.equal('2');
      });
    });

    context('bolus', () => {
      it('should add the datum to the `bolusDatumsByIdMap`', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const bolus = { type: 'bolus', id: '1', bolus: {} };
        dataUtil.normalizeDatumIn(bolus);
        expect(dataUtil.bolusDatumsByIdMap[bolus.id]).to.eql(bolus);
      });
    });
  });

  describe('joinWizardAndBolus', () => {
    context('wizard datum', () => {
      it('should replace bolus id with a bolus datum with a stripped `wizard` field', () => {
        const wizard = { type: 'wizard', id: 'wizard1', bolus: 'bolus1' };
        const bolus = { type: 'bolus', id: 'bolus1', wizard };
        dataUtil.bolusToWizardIdMap = { bolus1: 'wizard1' };
        dataUtil.bolusDatumsByIdMap = { bolus1: bolus };

        dataUtil.joinWizardAndBolus(wizard);
        expect(wizard.bolus).to.eql({ type: 'bolus', id: 'bolus1' });
      });
    });

    context('bolus datum', () => {
      it('should replace wizard id with a wizard datum with a stripped `bolus` field', () => {
        const bolus = { type: 'bolus', id: 'bolus1', wizard: 'wizard1' };
        const wizard = { type: 'wizard', id: 'wizard1', bolus };
        dataUtil.bolusToWizardIdMap = { bolus1: 'wizard1' };
        dataUtil.wizardDatumsByIdMap = { wizard1: wizard };

        dataUtil.joinWizardAndBolus(bolus);
        expect(bolus.wizard).to.eql({ type: 'wizard', id: 'wizard1' });
      });
    });
  });

  describe('tagDatum', () => {
    context('basal', () => {
      const basal = new Types.Basal({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
      const tempBasal = { ...basal, deliveryType: 'temp' };
      const suspendBasal = { ...basal, deviceTime: '2018-02-02T01:00:00', deliveryType: 'suspend', rate: 0 };

      it('should tag a suspend basal with `suspend`', () => {
        expect(tempBasal.tags).to.be.undefined;
        dataUtil.tagDatum(tempBasal);
        expect(tempBasal.tags.temp).to.be.true;
      });

      it('should tag a temp basal with `temp`', () => {
        expect(suspendBasal.tags).to.be.undefined;
        dataUtil.tagDatum(suspendBasal);
        expect(suspendBasal.tags.suspend).to.be.true;
      });
    });

    context('bolus', () => {
      const bolus = new Types.Bolus({ deviceTime: '2018-02-01T01:00:00', value: 1, ...useRawData });
      const correctionBolus = { ...bolus, recommended: { correction: 1, carb: 0 } };
      const extendedBolus = { ...bolus, extended: 1, duration: 1, subType: 'square' };
      const interruptedBolus = { ...bolus, normal: 1, expectedNormal: 2 };
      const manualBolus = { ...bolus, wizard: undefined };
      const overrideBolus = { ...bolus, normal: 2, recommended: { net: 1 } };
      const underrideBolus = { ...bolus, normal: 1, recommended: { net: 2 } };
      const wizardBolus = { ...bolus, deviceTime: '2018-02-02T01:00:00', wizard: '12345' };

      it('should tag a manual correction bolus with `correction` and `manual`', () => {
        expect(correctionBolus.tags).to.be.undefined;
        dataUtil.tagDatum(correctionBolus);
        expect(correctionBolus.tags.correction).to.be.true;
        expect(correctionBolus.tags.extended).to.be.false;
        expect(correctionBolus.tags.interrupted).to.be.false;
        expect(correctionBolus.tags.manual).to.be.true;
        expect(correctionBolus.tags.override).to.be.false;
        expect(correctionBolus.tags.underride).to.be.false;
        expect(correctionBolus.tags.wizard).to.be.false;
      });

      it('should tag an manual extended bolus with `extended` and `manual`', () => {
        expect(extendedBolus.tags).to.be.undefined;
        dataUtil.tagDatum(extendedBolus);
        expect(extendedBolus.tags.correction).to.be.false;
        expect(extendedBolus.tags.extended).to.be.true;
        expect(extendedBolus.tags.interrupted).to.be.false;
        expect(extendedBolus.tags.manual).to.be.true;
        expect(extendedBolus.tags.override).to.be.false;
        expect(extendedBolus.tags.underride).to.be.false;
        expect(extendedBolus.tags.wizard).to.be.false;
      });

      it('should tag a manual interrupted bolus with `interrupted` and `manual`', () => {
        expect(interruptedBolus.tags).to.be.undefined;
        dataUtil.tagDatum(interruptedBolus);
        expect(interruptedBolus.tags.correction).to.be.false;
        expect(interruptedBolus.tags.extended).to.be.false;
        expect(interruptedBolus.tags.interrupted).to.be.true;
        expect(interruptedBolus.tags.manual).to.be.true;
        expect(interruptedBolus.tags.override).to.be.false;
        expect(interruptedBolus.tags.underride).to.be.false;
        expect(interruptedBolus.tags.wizard).to.be.false;
      });

      it('should tag a manual bolus with `manual`', () => {
        expect(manualBolus.tags).to.be.undefined;
        dataUtil.tagDatum(manualBolus);
        expect(manualBolus.tags.correction).to.be.false;
        expect(manualBolus.tags.extended).to.be.false;
        expect(manualBolus.tags.interrupted).to.be.false;
        expect(manualBolus.tags.manual).to.be.true;
        expect(manualBolus.tags.override).to.be.false;
        expect(manualBolus.tags.underride).to.be.false;
        expect(manualBolus.tags.wizard).to.be.false;
      });

      it('should tag a manual override bolus with `override` and `manual`', () => {
        expect(overrideBolus.tags).to.be.undefined;
        dataUtil.tagDatum(overrideBolus);
        expect(overrideBolus.tags.correction).to.be.false;
        expect(overrideBolus.tags.extended).to.be.false;
        expect(overrideBolus.tags.interrupted).to.be.false;
        expect(overrideBolus.tags.manual).to.be.true;
        expect(overrideBolus.tags.override).to.be.true;
        expect(overrideBolus.tags.underride).to.be.false;
        expect(overrideBolus.tags.wizard).to.be.false;
      });

      it('should tag a manual underride bolus with `underride` and `manual`', () => {
        expect(underrideBolus.tags).to.be.undefined;
        dataUtil.tagDatum(underrideBolus);
        expect(underrideBolus.tags.correction).to.be.false;
        expect(underrideBolus.tags.extended).to.be.false;
        expect(underrideBolus.tags.interrupted).to.be.false;
        expect(underrideBolus.tags.manual).to.be.true;
        expect(underrideBolus.tags.override).to.be.false;
        expect(underrideBolus.tags.underride).to.be.true;
        expect(underrideBolus.tags.wizard).to.be.false;
      });

      it('should tag a wizard bolus with `wizard`', () => {
        expect(wizardBolus.tags).to.be.undefined;
        dataUtil.tagDatum(wizardBolus);
        expect(wizardBolus.tags.correction).to.be.false;
        expect(wizardBolus.tags.extended).to.be.false;
        expect(wizardBolus.tags.interrupted).to.be.false;
        expect(wizardBolus.tags.manual).to.be.false;
        expect(wizardBolus.tags.override).to.be.false;
        expect(wizardBolus.tags.underride).to.be.false;
        expect(wizardBolus.tags.wizard).to.be.true;
      });
    });

    context('smbg', () => {
      const smbg = new Types.SMBG({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
      const manualSMBG = { ...smbg, subType: 'manual' };
      const meterSMBG = { ...smbg, subType: undefined };

      it('should tag a manual smbg with `manual`', () => {
        expect(manualSMBG.tags).to.be.undefined;
        dataUtil.tagDatum(manualSMBG);
        expect(manualSMBG.tags.manual).to.be.true;
        expect(manualSMBG.tags.meter).to.be.false;
      });

      it('should tag a meter smbg with `meter`', () => {
        expect(meterSMBG.tags).to.be.undefined;
        dataUtil.tagDatum(meterSMBG);
        expect(meterSMBG.tags.manual).to.be.false;
        expect(meterSMBG.tags.meter).to.be.true;
      });
    });

    context('deviceEvent', () => {
      const calibration = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', subType: 'calibration', ...useRawData });
      const siteChange = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
      const cannulaPrime = { ...siteChange, subType: 'prime', primeTarget: 'cannula' };
      const reservoirChange = { ...siteChange, subType: 'reservoirChange' };
      const tubingPrime = { ...siteChange, deviceTime: '2018-02-02T01:00:00', subType: 'prime', primeTarget: 'tubing' };

      it('should tag a calibration deviceEvent with `calibration`', () => {
        expect(calibration.tags).to.be.undefined;
        dataUtil.tagDatum(calibration);
        expect(calibration.tags.calibration).to.be.true;
        expect(calibration.tags.reservoirChange).to.be.false;
        expect(calibration.tags.cannulaPrime).to.be.false;
        expect(calibration.tags.tubingPrime).to.be.false;
      });

      it('should tag a reservoirChange deviceEvent with `reservoirChange`', () => {
        expect(reservoirChange.tags).to.be.undefined;
        dataUtil.tagDatum(reservoirChange);
        expect(reservoirChange.tags.calibration).to.be.false;
        expect(reservoirChange.tags.reservoirChange).to.be.true;
        expect(reservoirChange.tags.cannulaPrime).to.be.false;
        expect(reservoirChange.tags.tubingPrime).to.be.false;
      });

      it('should tag a cannulaPrime deviceEvent with `cannulaPrime`', () => {
        expect(cannulaPrime.tags).to.be.undefined;
        dataUtil.tagDatum(cannulaPrime);
        expect(cannulaPrime.tags.calibration).to.be.false;
        expect(cannulaPrime.tags.reservoirChange).to.be.false;
        expect(cannulaPrime.tags.cannulaPrime).to.be.true;
        expect(cannulaPrime.tags.tubingPrime).to.be.false;
      });

      it('should tag a tubingPrime deviceEvent with `tubingPrime`', () => {
        expect(tubingPrime.tags).to.be.undefined;
        dataUtil.tagDatum(tubingPrime);
        expect(tubingPrime.tags.calibration).to.be.false;
        expect(tubingPrime.tags.reservoirChange).to.be.false;
        expect(tubingPrime.tags.cannulaPrime).to.be.false;
        expect(tubingPrime.tags.tubingPrime).to.be.true;
      });
    });
  });

  describe.only('validateDatumIn', () => {
    before(() => {
      DataUtil.__Rewire__('Validator', {
        type1: sinon.stub().returns(true),
        type2: {
          subType1: sinon.stub().returns(true),
          subType2: sinon.stub().returns(true),
        },
      });
    });

    after(() => {
      DataUtil.__ResetDependency__('Validator');
    });

    it('should call all matching validators for a datum type', () => {

    });

    it('should call the common validator if no validators exist for the datum type', () => {

    });

    it('should flag a datum that fails all run validators as rejected and add the reject reasons to the datum', () => {

    });
  });
});
