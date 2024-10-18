import _ from 'lodash';
import moment from 'moment';
import DataUtil from '../../src/utils/DataUtil';

import { types as Types, generateGUID } from '../../data/types';
import { MGDL_UNITS, MS_IN_HOUR, MS_IN_MIN, MMOLL_UNITS, DEFAULT_BG_BOUNDS } from '../../src/utils/constants';

import medtronicMultirate from '../../data/pumpSettings/medtronic/multirate.raw.json';
import omnipodMultirate from '../../data/pumpSettings/omnipod/multirate.raw.json';
import loopMultirate from '../../data/pumpSettings/loop/multirate.raw.json';
/* eslint-disable max-len, no-underscore-dangle */

describe('DataUtil', () => {
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


  const settingsOverrideDatumOverlappingStart = new Types.DeviceEvent({
    duration: MS_IN_HOUR * 2,
    deviceTime: '2018-01-31T23:00:00',
    source: 'Tandem',
    deviceModel: '12345',
    subType: 'pumpSettingsOverride',
    ...useRawData,
  });

  const deviceEventData = _.map([
    new Types.DeviceEvent({
      duration: MS_IN_HOUR,
      deviceTime: '2018-02-01T01:00:00',
      source: 'Tandem',
      deviceModel: '12345',
      subType: 'pumpSettingsOverride',
      ...useRawData,
    }),
    new Types.DeviceEvent({
      duration: MS_IN_HOUR,
      deviceTime: '2018-02-01T02:00:00',
      source: 'Tandem',
      deviceModel: '12345',
      subType: 'pumpSettingsOverride',
      ...useRawData,
    }),
    new Types.DeviceEvent({
      duration: MS_IN_HOUR,
      deviceTime: '2018-02-01T03:00:00',
      source: 'Tandem',
      deviceModel: '12345',
      subType: 'pumpSettingsOverride',
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

  const dosingDecisionData = _.map([
    new Types.DosingDecision({
      deviceTime: '2018-02-01T01:00:00',
      ...useRawData,
    }),
    new Types.DosingDecision({
      deviceTime: '2018-02-01T02:00:00',
      ...useRawData,
    }),
    new Types.DosingDecision({
      deviceTime: '2018-02-01T03:00:00',
      ...useRawData,
    }),
  ], _.toPlainObject);

  const smbgData = _.map([
    new Types.SMBG({
      deviceId: 'OneTouch-XXX-XXXX',
      value: 60,
      deviceTime: '2018-01-31T00:00:00',
      ...useRawData,
    }),
    new Types.SMBG({
      deviceId: 'OneTouch-XXX-XXXX',
      value: 70,
      deviceTime: '2018-02-01T00:15:00',
      ...useRawData,
    }),
    new Types.SMBG({
      deviceId: 'OneTouch-XXX-XXXX',
      value: 80,
      deviceTime: '2018-02-01T00:30:00',
      ...useRawData,
    }),
    new Types.SMBG({
      deviceId: 'OneTouch-XXX-XXXX',
      value: 200,
      deviceTime: '2018-02-01T00:45:00',
      ...useRawData,
    }),
    new Types.SMBG({
      deviceId: 'OneTouch-XXX-XXXX',
      value: 270,
      deviceTime: '2018-02-02T00:50:00',
      ...useRawData,
    }),
  ], _.toPlainObject);

  const uploadData = _.map([
    new Types.Upload({
      deviceTags: ['insulin-pump'],
      source: 'Tandem',
      deviceManufacturers: ['Tandem'],
      deviceModel: '12345',
      deviceSerialNumber: 'sn-0',
      deviceTime: '2018-01-01T00:00:00',
      deviceId: 'tandemCIQ12345',
      uploadId: 'upload-0',
      ...useRawData,
    }),
    new Types.Upload({
      deviceTags: ['insulin-pump'],
      source: 'Insulet',
      deviceManufacturers: ['Insulet', 'Abbot'],
      deviceModel: 'dash',
      deviceSerialNumber: 'sn-1',
      deviceTime: '2018-01-02T00:00:00',
      uploadId: 'upload-1',
      ...useRawData,
    }),
    new Types.Upload({
      deviceTags: ['insulin-pump'],
      source: 'Medtronic',
      deviceManufacturers: ['Medtronic'],
      deviceModel: '1780',
      deviceSerialNumber: 'sn-2',
      deviceTime: '2018-02-02T00:00:00',
      uploadId: 'upload-2',
      ...useRawData,
    }),
    new Types.Upload({
      dataSetType: 'continuous',
      deviceTime: '2018-02-03T00:00:00',
      uploadId: 'upload-3',
      ...useRawData,
    }),
    new Types.Upload({
      dataSetType: 'continuous',
      deviceTime: '2018-02-04T00:00:00',
      uploadId: 'upload-4',
      ...useRawData,
    }),
  ], _.toPlainObject);

  const pumpSettingsData = [
    { ...omnipodMultirate, deviceTime: '2018-01-02T00:00:00', time: '2018-01-02T00:00:00.000Z' },
    { ...medtronicMultirate, deviceTime: '2018-02-02T00:00:00', time: '2018-02-02T00:00:00.000Z' },
    { ...loopMultirate, id: 'loop1', deviceTime: '2018-02-03T00:00:00', time: '2018-02-03T00:00:00.000Z', uploadId: 'upload-3', origin: { name: 'org.tidepool.Loop' } },
    { ...loopMultirate, id: 'loop2', deviceTime: '2018-02-04T00:00:00', time: '2018-02-04T00:00:00.000Z', uploadId: 'upload-4', origin: { name: 'com.loopkit.Loop' } },
  ];

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
    ...deviceEventData,
    ...dosingDecisionData,
    ...foodData,
    ...smbgData,
    ...uploadData,
    ...pumpSettingsData,
    ...wizardData,
  ];

  const defaultBgPrefs = {
    bgClasses: {
      'very-low': { boundary: 54 },
      low: { boundary: 70 },
      target: { boundary: 180 },
      high: { boundary: 250 },
    },
    bgUnits: MGDL_UNITS,
  };

  const defaultTimePrefs = {
    timezoneAware: true,
    timezoneName: 'UTC',
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
    bgPrefs: defaultBgPrefs,
    endpoints: dayEndpoints,
    nextDays: 1,
    prevDays: 1,
    timePrefs: defaultTimePrefs,
  };

  const defaultPatientId = 'abc123';

  const initDataUtil = (dataset, validator) => {
    dataUtil = new DataUtil(validator);
    if (dataset) dataUtil.addData(dataset, defaultPatientId);
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

      dataUtil.addData(defaultData, defaultPatientId);
      expect(dataUtil.bolusToWizardIdMap).to.be.an('object').and.have.keys([
        bolusData[0].id,
        bolusData[1].id,
        bolusData[2].id,
      ]);

      const newBolus = new Types.Bolus({ ...useRawData });
      const newWizard = new Types.Wizard({ bolus: newBolus, ...useRawData });
      dataUtil.addData([newBolus, newWizard], defaultPatientId);

      expect(dataUtil.bolusToWizardIdMap).to.be.an('object').and.have.keys([
        bolusData[0].id,
        bolusData[1].id,
        bolusData[2].id,
        newBolus.id,
      ]);

      expect(dataUtil.bolusToWizardIdMap[newBolus.id]).to.equal(newWizard.id);
    });

    it('should create and/or update the `wizardToBolusIdMap`', () => {
      delete dataUtil.wizardToBolusIdMap;
      expect(dataUtil.wizardToBolusIdMap).to.be.undefined;

      dataUtil.addData(defaultData, defaultPatientId);
      expect(dataUtil.wizardToBolusIdMap).to.be.an('object').and.have.keys([
        wizardData[0].id,
        wizardData[1].id,
        wizardData[2].id,
      ]);

      const newBolus = new Types.Bolus({ ...useRawData });
      const newWizard = new Types.Wizard({ bolus: newBolus, ...useRawData });
      dataUtil.addData([newBolus, newWizard], defaultPatientId);

      expect(dataUtil.wizardToBolusIdMap).to.be.an('object').and.have.keys([
        wizardData[0].id,
        wizardData[1].id,
        wizardData[2].id,
        newWizard.id,
      ]);

      expect(dataUtil.wizardToBolusIdMap[newWizard.id]).to.equal(newBolus.id);
    });

    it('should create and/or update the `bolusDatumsByIdMap`', () => {
      delete dataUtil.bolusDatumsByIdMap;
      expect(dataUtil.bolusDatumsByIdMap).to.be.undefined;

      dataUtil.addData(defaultData, defaultPatientId);
      expect(dataUtil.bolusDatumsByIdMap).to.be.an('object').and.have.keys([
        bolusData[0].id,
        bolusData[1].id,
        bolusData[2].id,
      ]);

      const newBolus = new Types.Bolus({ ...useRawData });
      dataUtil.addData([newBolus], defaultPatientId);

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

      dataUtil.addData(defaultData, defaultPatientId);
      expect(dataUtil.wizardDatumsByIdMap).to.be.an('object').and.have.keys([
        wizardData[0].id,
        wizardData[1].id,
        wizardData[2].id,
      ]);

      const newWizard = new Types.Wizard({ ...useRawData });
      dataUtil.addData([newWizard], defaultPatientId);

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

      dataUtil.addData(defaultData, defaultPatientId);
      expect(dataUtil.latestDatumByType).to.be.an('object').and.have.keys([
        'basal',
        'bolus',
        'cbg',
        'deviceEvent',
        'dosingDecision',
        'food',
        'pumpSettings',
        'smbg',
        'upload',
        'wizard',
      ]);

      expect(dataUtil.latestDatumByType.wizard.id).to.eql(wizardData[2].id);

      const newWizard = new Types.Wizard({ deviceTime: '2018-02-01T04:00:00', ...useRawData });
      dataUtil.addData([newWizard], defaultPatientId);

      expect(dataUtil.latestDatumByType.wizard.id).to.eql(newWizard.id);
    });

    it('should create and/or update the `pumpSettingsDatumsByIdMap`', () => {
      delete dataUtil.pumpSettingsDatumsByIdMap;
      expect(dataUtil.pumpSettingsDatumsByIdMap).to.be.undefined;

      dataUtil.addData(defaultData, defaultPatientId);
      expect(dataUtil.pumpSettingsDatumsByIdMap).to.be.an('object').and.have.keys([
        pumpSettingsData[0].id,
        pumpSettingsData[1].id,
        pumpSettingsData[2].id,
        pumpSettingsData[3].id,
      ]);

      const newPumpSettings = { ...omnipodMultirate, deviceTime: '2018-01-02T00:00:00', time: '2018-01-02T00:00:00.000Z', id: 'newPumpID' };
      dataUtil.addData([newPumpSettings], defaultPatientId);

      expect(dataUtil.pumpSettingsDatumsByIdMap).to.be.an('object').and.have.keys([
        pumpSettingsData[0].id,
        pumpSettingsData[1].id,
        pumpSettingsData[2].id,
        pumpSettingsData[3].id,
        newPumpSettings.id,
      ]);

      expect(dataUtil.pumpSettingsDatumsByIdMap[newPumpSettings.id].id).to.equal(newPumpSettings.id);
    });

    it('should create and/or update the `bolusDosingDecisionDatumsByIdMap`', () => {
      delete dataUtil.bolusDosingDecisionDatumsByIdMap;
      expect(dataUtil.bolusDosingDecisionDatumsByIdMap).to.be.undefined;

      dataUtil.addData(defaultData, defaultPatientId);

      expect(dataUtil.bolusDosingDecisionDatumsByIdMap).to.be.an('object').and.have.keys([
        dosingDecisionData[0].id,
        dosingDecisionData[1].id,
        dosingDecisionData[2].id,
      ]);

      const newDosingDecision = new Types.DosingDecision({ deviceTime: '2018-02-01T04:00:00', ...useRawData });
      dataUtil.addData([newDosingDecision], defaultPatientId);

      expect(dataUtil.bolusDosingDecisionDatumsByIdMap).to.be.an('object').and.have.keys([
        dosingDecisionData[0].id,
        dosingDecisionData[1].id,
        dosingDecisionData[2].id,
        newDosingDecision.id,
      ]);

      expect(dataUtil.bolusDosingDecisionDatumsByIdMap[newDosingDecision.id].id).to.equal(newDosingDecision.id);
    });

    it('should initialize the `matchedDevices` property if not already set', () => {
      // Initialize if undefined
      delete dataUtil.matchedDevices;
      expect(dataUtil.matchedDevices).to.be.undefined;

      dataUtil.addData(defaultData, defaultPatientId);

      expect(dataUtil.matchedDevices).to.eql({});

      // Persist if defined
      dataUtil.matchedDevices = { foo: 'bar' };

      const newWizard = new Types.Wizard({ deviceTime: '2018-02-01T04:00:00', ...useRawData, deviceId: 'newDeviceID' });
      dataUtil.addData([newWizard], defaultPatientId);

      expect(dataUtil.matchedDevices).to.eql({ foo: 'bar' });
    });

    it('should call `normalizeDatumIn` on each incoming datum', () => {
      sinon.spy(dataUtil, 'normalizeDatumIn');
      sinon.assert.notCalled(dataUtil.normalizeDatumIn);
      dataUtil.addData(defaultData, defaultPatientId);

      sinon.assert.called(dataUtil.normalizeDatumIn);
      sinon.assert.callCount(dataUtil.normalizeDatumIn, defaultData.length);
    });

    it('should call `joinWizardAndBolus` on each incoming datum', () => {
      sinon.spy(dataUtil, 'joinWizardAndBolus');
      sinon.assert.notCalled(dataUtil.joinWizardAndBolus);
      dataUtil.addData(defaultData, defaultPatientId);

      sinon.assert.called(dataUtil.joinWizardAndBolus);
      sinon.assert.callCount(dataUtil.joinWizardAndBolus, defaultData.length);
    });

    it('should call `joinBolusAndDosingDecision` on each incoming datum', () => {
      sinon.spy(dataUtil, 'joinBolusAndDosingDecision');
      sinon.assert.notCalled(dataUtil.joinBolusAndDosingDecision);
      dataUtil.addData(defaultData, defaultPatientId);

      sinon.assert.called(dataUtil.joinBolusAndDosingDecision);
      sinon.assert.callCount(dataUtil.joinBolusAndDosingDecision, defaultData.length);
    });

    it('should call `tagDatum` on each incoming datum', () => {
      sinon.spy(dataUtil, 'tagDatum');
      sinon.assert.notCalled(dataUtil.tagDatum);
      dataUtil.addData(defaultData, defaultPatientId);

      sinon.assert.called(dataUtil.tagDatum);
      sinon.assert.callCount(dataUtil.tagDatum, defaultData.length);
    });

    it('should call `setMetaData`', () => {
      sinon.spy(dataUtil, 'setMetaData');
      sinon.assert.notCalled(dataUtil.setMetaData);

      dataUtil.addData(defaultData, defaultPatientId);

      sinon.assert.callCount(dataUtil.setMetaData, 1);
    });

    it('should return the resulting metaData', () => {
      expect(dataUtil.addData(defaultData, defaultPatientId).metaData).to.be.an('object').and.have.keys([
        'bgSources',
        'latestDatumByType',
        'latestPumpUpload',
        'patientId',
        'size',
        'queryDataCount',
      ]);
    });

    it('should return the added data when requested', () => {
      expect(dataUtil.addData(defaultData, defaultPatientId, true).data).to.be.an('array').and.have.lengthOf(defaultData.length);
    });

    it('should remove data prior to adding if the patientId has changed', () => {
      const removeSpy = sinon.spy(dataUtil, 'removeData');
      const addSpy = sinon.spy(dataUtil.data, 'add');

      dataUtil.addData(defaultData, defaultPatientId);
      sinon.assert.notCalled(removeSpy);
      sinon.assert.calledOnce(addSpy);

      const result = dataUtil.addData([new Types.CBG({ ...useRawData })], 'newPatientId', true);
      sinon.assert.calledOnce(removeSpy);
      expect(result.data).to.have.lengthOf(1);
    });

    it('should abort early and return an empty object when patientId is not provided', () => {
      sinon.spy(dataUtil, 'normalizeDatumIn');
      sinon.spy(dataUtil, 'joinWizardAndBolus');
      sinon.spy(dataUtil, 'tagDatum');
      sinon.spy(dataUtil, 'setMetaData');
      sinon.spy(dataUtil, 'getMetaData');
      expect(dataUtil.addData(defaultData)).to.eql({});
      sinon.assert.notCalled(dataUtil.normalizeDatumIn);
      sinon.assert.notCalled(dataUtil.joinWizardAndBolus);
      sinon.assert.notCalled(dataUtil.tagDatum);
      sinon.assert.notCalled(dataUtil.setMetaData);
      sinon.assert.notCalled(dataUtil.getMetaData);
    });

    it('should abort early and return an empty object when provided data is empty', () => {
      sinon.spy(dataUtil, 'normalizeDatumIn');
      sinon.spy(dataUtil, 'joinWizardAndBolus');
      sinon.spy(dataUtil, 'tagDatum');
      sinon.spy(dataUtil, 'setMetaData');
      sinon.spy(dataUtil, 'getMetaData');
      expect(dataUtil.addData([])).to.eql({});
      sinon.assert.notCalled(dataUtil.normalizeDatumIn);
      sinon.assert.notCalled(dataUtil.joinWizardAndBolus);
      sinon.assert.notCalled(dataUtil.tagDatum);
      sinon.assert.notCalled(dataUtil.setMetaData);
      sinon.assert.notCalled(dataUtil.getMetaData);
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

      it('should convert `time` string to UTC hammertime timestamp, and save ref to original as `_time`', () => {
        const datum = { type: 'any', time: '2018-02-01T01:00:00' };
        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.time).to.equal(1517446800000);
        expect(datum._time).to.equal('2018-02-01T01:00:00');
      });

      it('should convert `deviceTime` string to UTC hammertime timestamp, and save ref to original as `_deviceTime`', () => {
        const datum = { type: 'any', time: '2018-02-01T01:00:00', deviceTime: '2018-02-01T02:00:00' };
        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.time).to.equal(1517446800000);
        expect(datum.deviceTime).to.equal(datum.time + MS_IN_HOUR);
        expect(datum._deviceTime).to.equal('2018-02-01T02:00:00');
      });

      it('should set missing `deviceTime` to processed `time`', () => {
        const datum = { type: 'any', time: '2018-02-01T01:00:00' };
        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.time).to.equal(1517446800000);
        expect(datum.deviceTime).to.equal(datum.time);
      });

      it('should update `latestDatumByType` if time is more recent that the datum currently set', () => {
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

      it('should Prevent ongoing basals with unknown durations from extending into the future', () => {
        sinon.spy(dataUtil, 'normalizeSuppressedBasal');
        const now = () => moment().valueOf();
        const datumStart = moment.utc(now() - MS_IN_MIN * 15).toISOString();
        const duration = MS_IN_MIN * 30;

        const unknownDurationIntoFuture = new Types.Basal({
          annotations: [{ code: 'basal/unknown-duration' }],
          time: datumStart,
          duration,
          type: 'automated',
          suppressed: { type: 'scheduled', duration, time: datumStart },
          ...useRawData
        });

        // Assert that the datum extends into the future
        expect(Date.parse(unknownDurationIntoFuture.time) + unknownDurationIntoFuture.duration > now()).to.be.true;
        expect(unknownDurationIntoFuture.duration === MS_IN_MIN * 30).to.be.true;
        expect(unknownDurationIntoFuture.suppressed.duration === MS_IN_MIN * 30).to.be.true;

        // Assert that the basal durations were truncated so that they no longer extend into the future
        dataUtil.normalizeDatumIn(unknownDurationIntoFuture);
        expect(Date.parse(unknownDurationIntoFuture.time) + unknownDurationIntoFuture.duration <= now()).to.be.true;
        expect(unknownDurationIntoFuture.duration < MS_IN_MIN * 16).to.be.true;
        expect(unknownDurationIntoFuture.suppressed.duration < MS_IN_MIN * 16).to.be.true;
      });
    });

    context('upload', () => {
      it('should add a missing time of continuous uploads', () => {
        const uploadWithoutTime = { ...new Types.Upload({ dataSetType: 'continuous', ...useRawData }), time: undefined };
        expect(uploadWithoutTime.time).to.be.undefined;
        dataUtil.normalizeDatumIn(uploadWithoutTime);
        expect(uploadWithoutTime.time).to.be.a('number');
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

      it('should add the datum id to the `wizardToBolusIdMap` with the wizard id as a key if bolus field is a string', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const wizardWithBolusObject = { type: 'wizard', id: '1', bolus: { id: '12345' } };
        dataUtil.normalizeDatumIn(wizardWithBolusObject);
        expect(dataUtil.wizardToBolusIdMap['1']).to.be.undefined;

        const wizardWithBolusString = { type: 'wizard', id: '2', bolus: '12345' };
        dataUtil.normalizeDatumIn(wizardWithBolusString);
        expect(dataUtil.wizardToBolusIdMap['2']).to.equal('12345');
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

    context('dosingDecision', () => {
      it('should add the datum to the `bolusDosingDecisionDatumsByIdMap`', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const acceptableReasons = ['normalBolus', 'simpleBolus', 'watchBolus'];
        const dosingDecisionReasons = ['loop', 'normalBolus', 'simpleBolus', 'watchBolus'];
        _.each(dosingDecisionReasons, (reason, index) => {
          dataUtil.normalizeDatumIn({ type: 'dosingDecision', id: `ID${index}`, reason });
        });

        // the 'loop' reason datum should not be added
        expect(_.keys(dataUtil.bolusDosingDecisionDatumsByIdMap)).to.have.lengthOf(3);
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap.ID1.reason).to.eql(acceptableReasons[0]);
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap.ID2.reason).to.eql(acceptableReasons[1]);
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap.ID3.reason).to.eql(acceptableReasons[2]);
      });
    });

    context('pumpSettings', () => {
      it('should add the datum to the `pumpSettingsDatumsByIdMap`', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const pumpSettings = { type: 'pumpSettings', id: '1' };
        dataUtil.normalizeDatumIn(pumpSettings);
        expect(dataUtil.pumpSettingsDatumsByIdMap[pumpSettings.id]).to.eql(pumpSettings);
      });
    });
  });

  describe('joinWizardAndBolus', () => {
    context('wizard datum', () => {
      it('should replace bolus id with a bolus datum with a stripped `wizard` field', () => {
        const wizard = { type: 'wizard', id: 'wizard1', bolus: 'bolus1', uploadId: '12345' };
        const bolus = { type: 'bolus', id: 'bolus1', wizard, uploadId: '12345' };
        dataUtil.bolusToWizardIdMap = { bolus1: 'wizard1' };
        dataUtil.wizardToBolusIdMap = { wizard1: 'bolus1' };
        dataUtil.bolusDatumsByIdMap = { bolus1: bolus };

        dataUtil.joinWizardAndBolus(wizard);
        expect(wizard.bolus).to.eql({ type: 'bolus', id: 'bolus1', uploadId: '12345' });
      });

      it('should reject a wizard datum that references a bolus with a non-matching `uploadId`', () => {
        const wizard = { type: 'wizard', id: 'wizard1', bolus: 'bolus1', uploadId: '12345' };
        const bolus = { type: 'bolus', id: 'bolus1', wizard, uploadId: '98765' };
        dataUtil.bolusToWizardIdMap = { bolus1: 'wizard1' };
        dataUtil.wizardToBolusIdMap = { wizard1: 'bolus1' };
        dataUtil.bolusDatumsByIdMap = { bolus1: bolus };

        dataUtil.joinWizardAndBolus(wizard);
        expect(wizard.bolus).to.eql('bolus1');
        expect(wizard.reject).to.be.true;
        expect(wizard.rejectReason).to.eql(['Upload ID does not match referenced bolus']);
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

  describe('joinBolusAndDosingDecision', () => {
    it('should join loop dosing decisions, and associated pump settings, to boluses that are within a minute of each other', () => {
      const bolus = { type: 'bolus', id: 'bolus1', time: Date.parse('2024-02-02T10:05:59.000Z'), origin: { name: 'org.tidepool.Loop' } };
      const pumpSettings = { ...loopMultirate, id: 'pumpSettings1' };

      const dosingDecision = {
        type: 'dosingDecision',
        id: 'dosingDecision1',
        time: Date.parse('2024-02-02T10:05:00.000Z'),
        origin: { name: 'org.tidepool.Loop' },
        associations: [{ reason: 'pumpSettings', id: 'pumpSettings1' }],
        requestedBolus: { amount: 12 },
        insulinOnBoard: { amount: 4 },
        food: { nutrition: { carbohydrate: { net: 30 } } },
        bgHistorical: [
          { value: 100 },
          { value: 110 },
        ],
      };

      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dosingDecision };
      dataUtil.pumpSettingsDatumsByIdMap = { pumpSettings1: pumpSettings };

      dataUtil.joinBolusAndDosingDecision(bolus);
      // should attach associated pump settings to dosingDecisions
      expect(bolus.dosingDecision).to.eql(dosingDecision);
      expect(bolus.dosingDecision.pumpSettings).to.eql(pumpSettings);

      // should translate relevant dosing decision data onto expected bolus fields
      expect(bolus.expectedNormal).to.equal(12);
      expect(bolus.carbInput).to.equal(30);
      expect(bolus.bgInput).to.equal(110);
      expect(bolus.insulinOnBoard).to.equal(4);
    });

    it('should not join loop dosing decisions to boluses that are outside of a minute of each other', () => {
      const dosingDecision = { type: 'dosingDecision', id: 'dosingDecision1', time: Date.parse('2024-02-02T10:05:00.000Z'), origin: { name: 'org.tidepool.Loop' } };
      const bolus = { type: 'bolus', id: 'bolus1', time: Date.parse('2024-02-02T10:06:01.000Z'), origin: { name: 'org.tidepool.Loop' } };
      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dosingDecision };
      dataUtil.bolusDatumsByIdMap = { bolus1: bolus };

      dataUtil.joinBolusAndDosingDecision(bolus);
      expect(bolus.dosingDecision).to.be.undefined;
    });
  });

  describe('needsCarbToExchangeConversion', () => {
    const bolus = {
      deviceId: 'MedT-123456',
      carbUnits: 'exchanges',
      carbInput: 2,
    };

    it('should return true if deviceId begins with "MedT-" and carbUnits are exchanges', () => {
      expect(dataUtil.needsCarbToExchangeConversion(bolus)).to.be.true;
    });

    it('should return false if datum is already annotated as being de-converted', () => {
      expect(dataUtil.needsCarbToExchangeConversion({
        ...bolus,
        annotations: [
          { code: 'foo' },
          { code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted' },
          { code: 'bar' },
        ],
      })).to.be.false;
    });

    it('should return false if deviceId does not begin with "MedT-" and carbUnits are exchanges', () => {
      expect(dataUtil.needsCarbToExchangeConversion({
        ...bolus,
        deviceId: 'MMT-123456',
      })).to.be.false;
    });

    it('should return false if deviceId begins with "MedT-" and carbUnits are grams', () => {
      expect(dataUtil.needsCarbToExchangeConversion({
        ...bolus,
        carbUnits: 'grams',
      })).to.be.false;
    });

    it('should return false if deviceId begins with "MedT-" and carbUnits are exchanges and carbInput is non-finite', () => {
      expect(dataUtil.needsCarbToExchangeConversion({
        ...bolus,
        carbInput: '4',
      })).to.be.false;
    });
  });

  describe('getDeconvertedCarbExchange', () => {
    it('should divide carbInput values by 15 and round to the nearest 0.5', () => {
      expect(dataUtil.getDeconvertedCarbExchange({
        carbInput: 60,
      })).to.equal(4);

      expect(dataUtil.getDeconvertedCarbExchange({
        carbInput: 55, // 55/15 = 3.6666
      })).to.equal(3.5);

      expect(dataUtil.getDeconvertedCarbExchange({
        carbInput: 50, // 50/15 = 3.3333
      })).to.equal(3.5);

      expect(dataUtil.getDeconvertedCarbExchange({
        carbInput: 48, // 48/15 = 3.2
      })).to.equal(3);
    });
  });

  describe('tagDatum', () => {
    context('basal', () => {
      const basal = new Types.Basal({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
      const tempBasal = { ...basal, deliveryType: 'temp' };
      const suspendBasal = { ...basal, deviceTime: '2018-02-02T01:00:00', deliveryType: 'suspend', rate: 0 };

      it('should tag a temp basal with `temp`', () => {
        expect(tempBasal.tags).to.be.undefined;
        dataUtil.tagDatum(tempBasal);
        expect(tempBasal.tags.temp).to.be.true;
      });

      it('should tag a suspend basal with `suspend`', () => {
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
      const automatedBolus = { ...manualBolus, subType: 'automated' };
      const overrideBolus = { ...bolus, normal: 2, recommended: { net: 1 } };
      const underrideBolus = { ...bolus, normal: 1, recommended: { net: 2 } };
      const wizardBolus = { ...bolus, deviceTime: '2018-02-02T01:00:00', wizard: '12345' };
      const dosingDecisionBolus = { ...bolus, deviceTime: '2018-02-02T01:00:00', dosingDecision: { food: { nutrition: { carbohydrate: { net: 20 } } } } };

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
        expect(extendedBolus.tags.automated).to.be.false;
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
        expect(interruptedBolus.tags.automated).to.be.false;
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
        expect(manualBolus.tags.automated).to.be.false;
        expect(manualBolus.tags.override).to.be.false;
        expect(manualBolus.tags.underride).to.be.false;
        expect(manualBolus.tags.wizard).to.be.false;
      });

      it('should tag an automated bolus with `automated`', () => {
        expect(automatedBolus.tags).to.be.undefined;
        dataUtil.tagDatum(automatedBolus);
        expect(automatedBolus.tags.correction).to.be.false;
        expect(automatedBolus.tags.extended).to.be.false;
        expect(automatedBolus.tags.interrupted).to.be.false;
        expect(automatedBolus.tags.manual).to.be.false;
        expect(automatedBolus.tags.automated).to.be.true;
        expect(automatedBolus.tags.override).to.be.false;
        expect(automatedBolus.tags.underride).to.be.false;
        expect(automatedBolus.tags.wizard).to.be.false;
      });

      it('should tag a manual override bolus with `override` and `manual`', () => {
        expect(overrideBolus.tags).to.be.undefined;
        dataUtil.tagDatum(overrideBolus);
        expect(overrideBolus.tags.correction).to.be.false;
        expect(overrideBolus.tags.extended).to.be.false;
        expect(overrideBolus.tags.interrupted).to.be.false;
        expect(overrideBolus.tags.manual).to.be.true;
        expect(overrideBolus.tags.automated).to.be.false;
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
        expect(underrideBolus.tags.automated).to.be.false;
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
        expect(wizardBolus.tags.automated).to.be.false;
        expect(wizardBolus.tags.override).to.be.false;
        expect(wizardBolus.tags.underride).to.be.false;
        expect(wizardBolus.tags.wizard).to.be.true;
      });

      it('should tag a dosingDecision bolus with `wizard`', () => {
        expect(dosingDecisionBolus.tags).to.be.undefined;
        dataUtil.tagDatum(dosingDecisionBolus);
        expect(dosingDecisionBolus.tags.correction).to.be.false;
        expect(dosingDecisionBolus.tags.extended).to.be.false;
        expect(dosingDecisionBolus.tags.interrupted).to.be.false;
        expect(dosingDecisionBolus.tags.manual).to.be.false;
        expect(dosingDecisionBolus.tags.automated).to.be.false;
        expect(dosingDecisionBolus.tags.override).to.be.false;
        expect(dosingDecisionBolus.tags.underride).to.be.false;
        expect(dosingDecisionBolus.tags.wizard).to.be.true;
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

      const automatedSuspendBasal = new Types.DeviceEvent({
        deviceTime: '2018-02-01T01:00:00',
        subType: 'status',
        status: 'suspended',
        reason: { suspended: 'automatic' },
        payload: { suspended: { reason: 'Auto suspend by PLGS' } },
        ...useRawData,
      });

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

      it('should tag a LBGS suspend deviceEvent with `automatedSuspend`', () => {
        expect(automatedSuspendBasal.tags).to.be.undefined;
        dataUtil.tagDatum(automatedSuspendBasal);
        expect(automatedSuspendBasal.tags.automatedSuspend).to.be.true;
      });
    });
  });

  describe('validateDatumIn', () => {
    const validatorStub = {
      typeWithSingleValidator: sinon.stub().returns(true),
      typeWithMultipleValidators: {
        schema1: sinon.stub().returns('unworthy'),
        schema2: sinon.stub().returns(true),
        schema3: sinon.stub().returns(true),
      },
      typeThatWillFail: {
        worthiness: sinon.stub().returns('unworthy'),
        health: sinon.stub().returns('unhealthy'),
      },
      common: sinon.stub().returns(true),
    };

    beforeEach(() => {
      initDataUtil([], validatorStub);
    });

    it('should call all matching validators for a datum type until one returns true', () => {
      sinon.assert.notCalled(dataUtil.validator.typeWithSingleValidator);
      sinon.assert.notCalled(dataUtil.validator.typeWithMultipleValidators.schema1);
      sinon.assert.notCalled(dataUtil.validator.typeWithMultipleValidators.schema2);
      sinon.assert.notCalled(dataUtil.validator.typeWithMultipleValidators.schema3);

      dataUtil.validateDatumIn({ type: 'typeWithSingleValidator' });

      sinon.assert.calledOnce(dataUtil.validator.typeWithSingleValidator);
      sinon.assert.notCalled(dataUtil.validator.typeWithMultipleValidators.schema1);
      sinon.assert.notCalled(dataUtil.validator.typeWithMultipleValidators.schema2);
      sinon.assert.notCalled(dataUtil.validator.typeWithMultipleValidators.schema3);


      dataUtil.validateDatumIn({ type: 'typeWithMultipleValidators' });

      sinon.assert.calledOnce(dataUtil.validator.typeWithMultipleValidators.schema1);
      sinon.assert.calledOnce(dataUtil.validator.typeWithMultipleValidators.schema2);
      sinon.assert.notCalled(dataUtil.validator.typeWithMultipleValidators.schema3);
    });

    it('should call the common validator if no validators exist for the datum type', () => {
      sinon.assert.notCalled(dataUtil.validator.common);
      dataUtil.validateDatumIn({ type: 'typeWithNoValidator' });
      sinon.assert.calledOnce(dataUtil.validator.common);
    });

    it('should flag a datum that fails all run validators as rejected and add the reject reasons to the datum', () => {
      const datum = { type: 'typeThatWillFail' };
      dataUtil.validateDatumIn(datum);

      expect(datum.reject).to.be.true;
      expect(datum.rejectReason).to.eql(['unworthy', 'unhealthy']);
    });
  });

  describe('normalizeDatumOut', () => {
    it('should call `normalizeDatumOutTime` with the provided datum and fields array', () => {
      sinon.stub(dataUtil, 'normalizeDatumOutTime');

      const datum = { type: 'foo' };
      const fields = ['bar'];

      dataUtil.normalizeDatumOut(datum, fields);

      sinon.assert.calledWith(dataUtil.normalizeDatumOutTime, datum, fields);
    });

    it('should add the `deviceSerialNumber` from the `uploadMap` when `uploadId` is present and the field is requested', () => {
      const datum = { type: 'foo' };
      const uploadIdDatum = { ...datum, uploadId: '12345' };
      const uploadIdDatum2 = { ...uploadIdDatum };
      const fields = ['deviceSerialNumber'];
      const allFields = ['*'];

      dataUtil.uploadMap = {
        12345: { deviceSerialNumber: 'abc-de' },
      };

      dataUtil.normalizeDatumOut(datum, fields);
      expect(datum.deviceSerialNumber).to.be.undefined;

      dataUtil.normalizeDatumOut(uploadIdDatum, fields);
      expect(uploadIdDatum.deviceSerialNumber).to.equal('abc-de');

      dataUtil.normalizeDatumOut(uploadIdDatum2, allFields);
      expect(uploadIdDatum2.deviceSerialNumber).to.equal('abc-de');
    });

    it('should add the `source` from the `uploadMap` when available, else set to `Unspecified Data Source`', () => {
      const datum = { type: 'foo' };
      const uploadWithSourceDatum = { ...datum, uploadId: '12345' };
      const uploadWithoutSourceDatum = { ...datum, uploadId: '678910' };

      dataUtil.uploadMap = {
        12345: { source: 'pumpCo' },
        678910: { source: undefined },
      };

      dataUtil.normalizeDatumOut(uploadWithSourceDatum);
      expect(uploadWithSourceDatum.source).to.equal('pumpCo');

      dataUtil.normalizeDatumOut(uploadWithoutSourceDatum);
      expect(uploadWithoutSourceDatum.source).to.equal('Unspecified Data Source');
    });

    context('returnRawData is `true`', () => {
      beforeEach(() => {
        dataUtil.returnRawData = true;
      });

      it('should restore `time` and `deviceTime` to their original ISO date string values', () => {
        const datum = {
          time: 12345,
          _time: 'original time string',
          deviceTime: 678910,
          _deviceTime: 'original deviceTime string',
        };

        dataUtil.normalizeDatumOut(datum);

        expect(datum.time).to.equal('original time string');
        expect(datum.deviceTime).to.equal('original deviceTime string');
      });

      it('should restore populated `bolus` object on a `wizard` datum to it\'s original string `id` ref', () => {
        const datum = {
          type: 'wizard',
          bolus: { id: 'myBolusID' },
        };

        dataUtil.normalizeDatumOut(datum);

        expect(datum.bolus).to.equal('myBolusID');
      });

      it('should restore populated `wizard` object on a `bolus` datum to it\'s original string `id` ref', () => {
        const datum = {
          type: 'bolus',
          wizard: { id: 'myWizardID' },
        };

        dataUtil.normalizeDatumOut(datum);

        expect(datum.wizard).to.equal('myWizardID');
      });

      it('should delete added `_time`, `_deviceTime`, and `tags` fields', () => {
        const datum = {
          time: 12345,
          _time: 'original time string',
          deviceTime: 678910,
          _deviceTime: 'original deviceTime string',
          tags: ['foo', 'bar'],
        };


        dataUtil.normalizeDatumOut(datum);

        expect(datum).to.have.all.keys('time', 'deviceTime');
        expect(datum).to.not.have.keys('_time', '_deviceTime', 'tags');
      });

      it('should restore a processed message datum back to it\'s original shape', () => {
        const datum = {
          type: 'message',
          messagetext: 'myMessageText',
          messageText: 'myMessageText',
          parentmessage: 'myParentMessage',
          parentMessage: 'myParentMessage',
          time: 12345,
          timestamp: 12345,
        };


        dataUtil.normalizeDatumOut(datum);

        expect(datum).to.have.all.keys('messagetext', 'parentmessage', 'timestamp');
        expect(datum).to.not.have.keys('type', 'messageText', 'parentMessage', 'time');
      });
    });

    context('basal', () => {
      it('should set `normalEnd` by adding the `normalTime` and `duration` fields', () => {
        sinon.stub(dataUtil, 'normalizeDatumOutTime');
        const datum = { type: 'basal', normalTime: 1000, duration: 500 };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.normalEnd).to.equal(1500);
      });

      it('should copy `deliveryType` to `subType`', () => {
        const datum = { type: 'basal', deliveryType: 'temp' };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.subType).to.equal('temp');
      });

      it('should add an annotation for basal intersecting an incomplete suspend when `annotations` field is requested', () => {
        sinon.stub(dataUtil, 'normalizeDatumOutTime');
        const datum = { type: 'basal', normalTime: 1000, duration: 500, annotations: [{ code: 'foo' }] };
        const datum2 = { ...datum };
        const fields = ['annotations'];
        const allFields = ['*'];

        dataUtil.activeTimeField = 'time';
        dataUtil.incompleteSuspends = [
          { time: 2000 }, // With a normalEnd of 1500, datum does not intersect this incomplete suspend
        ];

        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.annotations[0]).to.eql({ code: 'foo' });
        expect(datum.annotations[1]).to.be.undefined;

        dataUtil.incompleteSuspends = [
          { time: 2000 }, // With a normalEnd of 1500, datum does not intersect this incomplete suspend
          { time: 1250 }, // But it does intersect this one.
        ];

        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.annotations[0]).to.eql({ code: 'foo' });
        expect(datum.annotations[1]).to.eql({ code: 'basal/intersects-incomplete-suspend' });

        dataUtil.normalizeDatumOut(datum2, allFields);
        expect(datum2.annotations[0]).to.eql({ code: 'foo' });
        expect(datum2.annotations[1]).to.eql({ code: 'basal/intersects-incomplete-suspend' });
      });

      context('suppressed basal(s) present', () => {
        it('should call itself recursively as needed', () => {
          const datum = { time: Date.parse('2018-02-01T00:00:00'), type: 'basal', suppressed: { type: 'basal', suppressed: { type: 'scheduled' } } };
          const fields = ['suppressed'];

          sinon.spy(dataUtil, 'normalizeDatumOut');

          dataUtil.normalizeDatumOut(datum, fields);

          sinon.assert.calledWithMatch(dataUtil.normalizeDatumOut, datum.suppressed, fields);
          sinon.assert.calledWithMatch(dataUtil.normalizeDatumOut, datum.suppressed.suppressed, fields);
        });
      });
    });

    context('deviceEvent', () => {
      it('should set `normalEnd` by adding the `normalTime` and `duration` fields', () => {
        sinon.stub(dataUtil, 'normalizeDatumOutTime');
        const datum = { type: 'deviceEvent', normalTime: 1000, duration: 500 };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.normalEnd).to.equal(1500);
      });

      it('should call `normalizeDatumBgUnits` on bgTarget field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumBgUnits');
        const datum = { type: 'deviceEvent' };
        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumBgUnits, datum, ['bgTarget'], ['low', 'high']);
      });

      it('should set normalEnd and duration based on latestDiabetesDatumEnd when duration is provided, but extends into future', () => {
        const currentTime = Date.parse(moment.utc().toISOString());
        dataUtil.latestDiabetesDatumEnd = currentTime - MS_IN_MIN * 10;

        const datum = { type: 'deviceEvent', time: currentTime - MS_IN_MIN * 30, duration: MS_IN_HOUR };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.normalEnd).to.equal(dataUtil.latestDiabetesDatumEnd);
        expect(datum.duration).to.equal(MS_IN_MIN * 20);
      });

      it('should add normalEnd and duration based on latestDiabetesDatumEnd when duration for a pumpSettingsOverride is omitted', () => {
        const currentTime = Date.parse(moment.utc().toISOString());
        dataUtil.latestDiabetesDatumEnd = currentTime - MS_IN_MIN * 10;

        const datum = { type: 'deviceEvent', subType: 'pumpSettingsOverride', time: currentTime - MS_IN_MIN * 30, duration: undefined };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.normalEnd).to.equal(dataUtil.latestDiabetesDatumEnd);
        expect(datum.duration).to.equal(MS_IN_MIN * 20);
      });
    });

    context('cbg', () => {
      it('should call `normalizeDatumBgUnits` with the provided datum', () => {
        sinon.stub(dataUtil, 'normalizeDatumBgUnits');

        const datum = { type: 'cbg' };

        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithExactly(dataUtil.normalizeDatumBgUnits, datum);
      });

      it('should set the `msPer24` field according to the dataUtil timezone when requested', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'cbg', time: Date.parse('2018-02-01T00:00:00') };
        const datum2 = { ...datum };
        const fields = ['msPer24'];
        const allFields = ['*'];

        dataUtil.normalizeDatumOut(datum2, allFields);
        expect(datum2.msPer24).to.equal(0); // GMT-0 for UTC

        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal(0); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal(0); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal((24 - 5) * MS_IN_HOUR); // GMT-5 for US/Eastern

        dataUtil.timePrefs = { timezoneName: 'US/Pacific' };
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal((24 - 8) * MS_IN_HOUR); // GMT-8 for US/Pacific
      });

      it('should set the `localDate` field according to the dataUtil timezone when requested', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'cbg', time: Date.parse('2018-02-01T04:00:00') };
        const datum2 = { ...datum };
        const fields = ['localDate'];
        const allFields = ['*'];

        dataUtil.normalizeDatumOut(datum2, allFields);
        expect(datum2.localDate).to.equal('2018-02-01'); // GMT-0 for UTC

        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.localDate).to.equal('2018-02-01'); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.localDate).to.equal('2018-02-01'); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.localDate).to.equal('2018-01-31'); // GMT-5 for US/Eastern
      });
    });

    context('smbg', () => {
      it('should call `normalizeDatumBgUnits` with the provided datum', () => {
        sinon.stub(dataUtil, 'normalizeDatumBgUnits');

        const datum = { type: 'smbg' };

        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithExactly(dataUtil.normalizeDatumBgUnits, datum);
      });

      it('should set the `msPer24` field according to the dataUtil timezone when requested', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'smbg', time: Date.parse('2018-02-01T00:00:00') };
        const datum2 = { ...datum };
        const fields = ['msPer24'];
        const allFields = ['*'];

        dataUtil.normalizeDatumOut(datum2, allFields);
        expect(datum2.msPer24).to.equal(0); // GMT-0 for UTC

        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal(0); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal(0); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal((24 - 5) * MS_IN_HOUR); // GMT-5 for US/Eastern

        dataUtil.timePrefs = { timezoneName: 'US/Pacific' };
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.msPer24).to.equal((24 - 8) * MS_IN_HOUR); // GMT-8 for US/Pacific
      });

      it('should set the `localDate` field according to the dataUtil timezone when requested', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'smbg', time: Date.parse('2018-02-01T04:00:00') };
        const datum2 = { ...datum };
        const fields = ['localDate'];
        const allFields = ['*'];

        dataUtil.normalizeDatumOut(datum2, allFields);
        expect(datum2.localDate).to.equal('2018-02-01'); // GMT-0 for UTC

        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.localDate).to.equal('2018-02-01'); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.localDate).to.equal('2018-02-01'); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.localDate).to.equal('2018-01-31'); // GMT-5 for US/Eastern
      });
    });

    context('pumpSettings', () => {
      it('should call `normalizeDatumBgUnits` with keypaths and keys for bg target settings', () => {
        sinon.stub(dataUtil, 'normalizeDatumBgUnits');

        const datum = { type: 'pumpSettings' };

        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithExactly(
          dataUtil.normalizeDatumBgUnits,
          datum,
          ['bgTarget', 'bgTargets'],
          ['target', 'low', 'high']
        );
      });

      it('should call `normalizeDatumBgUnits` with keypaths and keys for insulin settings', () => {
        sinon.stub(dataUtil, 'normalizeDatumBgUnits');

        const datum = { type: 'pumpSettings' };

        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithExactly(
          dataUtil.normalizeDatumBgUnits,
          datum,
          ['insulinSensitivity', 'insulinSensitivities'],
          ['amount']
        );
      });

      it('should set basalSchedules object to an array sorted by name: `standard` first, then alphabetical', () => {
        const datum = {
          type: 'pumpSettings',
          basalSchedules: {
            Weekday: [{ start: 0, rate: 0.15 }],
            standard: [{ start: 0, rate: 0.25 }],
            Exercise: [{ start: 0, rate: 0.125 }],
          },
        };

        const fields = ['basalSchedules'];

        dataUtil.normalizeDatumOut(datum, fields);
        expect(datum.basalSchedules).to.eql([
          { name: 'standard', value: [{ start: 0, rate: 0.25 }] },
          { name: 'Exercise', value: [{ start: 0, rate: 0.125 }] },
          { name: 'Weekday', value: [{ start: 0, rate: 0.15 }] },
        ]);
      });
    });

    context('wizard', () => {
      it('should call `normalizeDatumBgUnits` with keypaths and keys for bg input settings', () => {
        sinon.stub(dataUtil, 'normalizeDatumBgUnits');

        const datum = { type: 'wizard' };

        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithExactly(
          dataUtil.normalizeDatumBgUnits,
          datum,
          [],
          ['bgInput']
        );
      });

      it('should call `normalizeDatumBgUnits` with keypaths and keys for bg target settings', () => {
        sinon.stub(dataUtil, 'normalizeDatumBgUnits');

        const datum = { type: 'wizard' };

        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithExactly(
          dataUtil.normalizeDatumBgUnits,
          datum,
          ['bgTarget'],
          ['target', 'range', 'low', 'high']
        );
      });

      it('should call `normalizeDatumBgUnits` with keypaths and keys for insulin sensitivity settings', () => {
        sinon.stub(dataUtil, 'normalizeDatumBgUnits');

        const datum = { type: 'wizard' };

        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithExactly(
          dataUtil.normalizeDatumBgUnits,
          datum,
          [],
          ['insulinSensitivity']
        );
      });

      it('should call `normalizeDatumOut` on bolus field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumOut');

        const datumWithBolusString = { type: 'wizard', bolus: 'some-string-id' };
        const datumWithBolusObject = { type: 'wizard', bolus: { id: 'some-string-id' } };
        const fields = '*';

        dataUtil.normalizeDatumOut(datumWithBolusString, fields);
        sinon.assert.neverCalledWithMatch(dataUtil.normalizeDatumOut, datumWithBolusString.bolus, fields);

        dataUtil.normalizeDatumOut(datumWithBolusObject, fields);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumOut, datumWithBolusObject.bolus, fields);
      });

      context('needsCarbToExchangeConversion is `true`', () => {
        it('should convert the carbInput and insulinCarbRatio to exchanges', () => {
          sinon.stub(dataUtil, 'needsCarbToExchangeConversion').returns(true);

          const datum = {
            type: 'wizard',
            carbInput: 60,
            insulinCarbRatio: 10,
          };

          dataUtil.normalizeDatumOut(datum);

          expect(datum.carbInput).to.equal(4);
          expect(datum.insulinCarbRatio).to.equal(1.5);
        });

        it('should add an annotation to the bolus object if it exists', () => {
          sinon.stub(dataUtil, 'needsCarbToExchangeConversion').returns(true);

          const datumWithoutBolus = {
            type: 'wizard',
            carbInput: 60,
            insulinCarbRatio: 10,
          };

          dataUtil.normalizeDatumOut(datumWithoutBolus);
          expect(datumWithoutBolus.bolus).to.be.undefined;

          const datumWithoutBolusAnnotations = {
            type: 'wizard',
            carbInput: 60,
            insulinCarbRatio: 10,
          };

          dataUtil.normalizeDatumOut(datumWithoutBolusAnnotations);
          expect(datumWithoutBolusAnnotations.annotations).to.have.lengthOf(1);
          expect(datumWithoutBolusAnnotations.annotations[0]).to.eql({
            code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted',
          });

          const datumWithBolusAnnotations = {
            type: 'wizard',
            carbInput: 60,
            insulinCarbRatio: 10,
            annotations: [{ code: 'foo' }],
          };

          dataUtil.normalizeDatumOut(datumWithBolusAnnotations);
          expect(datumWithBolusAnnotations.annotations).to.have.lengthOf(2);
          expect(datumWithBolusAnnotations.annotations[1]).to.eql({
            code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted',
          });
        });
      });

      context('needsCarbToExchangeConversion is `false`', () => {
        it('should not convert the carbInput and insulinCarbRatio to exchanges', () => {
          sinon.stub(dataUtil, 'needsCarbToExchangeConversion').returns(false);

          const datum = {
            type: 'wizard',
            carbInput: 60,
            insulinCarbRatio: 10,
          };

          dataUtil.normalizeDatumOut(datum);

          expect(datum.carbInput).to.equal(60);
          expect(datum.insulinCarbRatio).to.equal(10);
        });
      });
    });

    context('dosingDecision', () => {
      it('should call `normalizeDatumOut` on pumpSettings field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumOut');

        const datumWithPumpSettingsString = { type: 'dosingDecision', pumpSettings: 'some-string-id' };
        const datumWithPumpSettingsObject = { type: 'dosingDecision', pumpSettings: { id: 'some-string-id' } };
        const fields = '*';

        dataUtil.normalizeDatumOut(datumWithPumpSettingsString, fields);
        sinon.assert.neverCalledWithMatch(dataUtil.normalizeDatumOut, datumWithPumpSettingsString.pumpSettings, fields);

        dataUtil.normalizeDatumOut(datumWithPumpSettingsObject, fields);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumOut, datumWithPumpSettingsObject.pumpSettings, fields);
      });

      it('should call `normalizeDatumBgUnits` on bgTargetSchedule field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumBgUnits');
        const datum = { type: 'dosingDecision' };
        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumBgUnits, datum, ['bgTargetSchedule'], ['low', 'high']);
      });

      it('should call `normalizeDatumBgUnits` on bgForecast field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumBgUnits');
        const datum = { type: 'dosingDecision' };
        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumBgUnits, datum, ['bgForecast'], ['value']);
      });

      it('should call `normalizeDatumBgUnits` on smbg field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumBgUnits');
        const datum = { type: 'dosingDecision' };
        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumBgUnits, datum, ['smbg'], ['value']);
      });
    });

    context('bolus', () => {
      it('should call `normalizeDatumOut` on wizard field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumOut');

        const datumWithWizardString = { type: 'bolus', wizard: 'some-string-id' };
        const datumWithWizardObject = { type: 'bolus', wizard: { id: 'some-string-id' } };
        const fields = '*';

        dataUtil.normalizeDatumOut(datumWithWizardString, fields);
        sinon.assert.neverCalledWithMatch(dataUtil.normalizeDatumOut, datumWithWizardString.wizard, fields);

        dataUtil.normalizeDatumOut(datumWithWizardObject, fields);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumOut, datumWithWizardObject.wizard, fields);
      });

      it('should call `normalizeDatumOut` on dosingDecision field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumOut');

        const datumWithDosingDecisionString = { type: 'bolus', dosingDecision: 'some-string-id' };
        const datumWithDosingDecisionObject = { type: 'bolus', dosingDecision: { id: 'some-string-id' } };
        const fields = '*';

        dataUtil.normalizeDatumOut(datumWithDosingDecisionString, fields);
        sinon.assert.neverCalledWithMatch(dataUtil.normalizeDatumOut, datumWithDosingDecisionString.dosingDecision, fields);

        dataUtil.normalizeDatumOut(datumWithDosingDecisionObject, fields);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumOut, datumWithDosingDecisionObject.dosingDecision, fields);
      });

      it('should call `normalizeDatumBgUnits` on bgInput field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumBgUnits');
        const datum = { type: 'bolus' };
        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumBgUnits, datum, [], ['bgInput']);
      });
    });

    context('fill', () => {
      it('should set `normalEnd` by adding the `normalTime` and `duration` fields', () => {
        sinon.stub(dataUtil, 'normalizeDatumOutTime');
        const datum = { type: 'fill', normalTime: 1000, displayOffset: 0, duration: 500 };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.normalEnd).to.equal(1500);
      });

      it('should set the `msPer24` field according to the dataUtil timezone', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'fill', time: Date.parse('2018-02-01T00:00:00') };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.msPer24).to.equal(0); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum);
        expect(datum.msPer24).to.equal(0); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.msPer24).to.equal((24 - 5) * MS_IN_HOUR); // GMT-5 for US/Eastern

        dataUtil.timePrefs = { timezoneName: 'US/Pacific' };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.msPer24).to.equal((24 - 8) * MS_IN_HOUR); // GMT-8 for US/Pacific
      });

      it('should set the `hourOfDay` field according to the dataUtil timezone', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'fill', time: Date.parse('2018-02-01T00:00:00') };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.hourOfDay).to.equal(0); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum);
        expect(datum.hourOfDay).to.equal(0); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.hourOfDay).to.equal((24 - 5)); // GMT-5 for US/Eastern

        dataUtil.timePrefs = { timezoneName: 'US/Pacific' };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.hourOfDay).to.equal((24 - 8)); // GMT-8 for US/Pacific
      });

      it('should set the `fillDate` field according to the dataUtil timezone', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'fill', time: Date.parse('2018-02-01T04:00:00') };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.fillDate).to.equal('2018-02-01'); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum);
        expect(datum.fillDate).to.equal('2018-02-01'); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.fillDate).to.equal('2018-01-31'); // GMT-5 for US/Eastern
      });

      it('should set the `id` field according to the dataUtil timezone', () => {
        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.activeTimeField = 'time';

        const datum = { type: 'fill', time: Date.parse('2018-02-01T04:00:00') };

        dataUtil.normalizeDatumOut(datum);
        expect(datum.id).to.equal('fill_20180201T040000000Z'); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOut(datum);
        expect(datum.id).to.equal('fill_20180201T040000000Z'); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOut(datum);
        expect(datum.id).to.equal('fill_20180201T040000000Z'); // GMT-5 for US/Eastern
      });
    });
  });

  describe('normalizeDatumOutTime', () => {
    context('timezone name set', () => {
      it('should copy `time` to `normalTime`', () => {
        const datum = { time: Date.parse('2018-02-01T00:00:00') };
        dataUtil.normalizeDatumOutTime(datum);

        expect(datum.normalTime).to.equal(datum.time);
      });

      it('should set the `displayOffest` field according to the dataUtil timezone', () => {
        const datum = { time: Date.parse('2018-02-01T00:00:00') };

        dataUtil.timePrefs = { timezoneName: 'UTC' };
        dataUtil.normalizeDatumOutTime(datum);
        expect(datum.displayOffset).to.equal(0); // GMT-0 for UTC

        delete(dataUtil.timePrefs);
        dataUtil.normalizeDatumOutTime(datum);
        expect(datum.displayOffset).to.equal(0); // fallback to GMT-0 for UTC when not timezone-aware

        dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
        dataUtil.normalizeDatumOutTime(datum);
        expect(datum.displayOffset).to.equal(-5 * MS_IN_HOUR / MS_IN_MIN); // GMT-5 for US/Eastern

        dataUtil.timePrefs = { timezoneName: 'US/Pacific' };
        dataUtil.normalizeDatumOutTime(datum);
        expect(datum.displayOffset).to.equal(-8 * MS_IN_HOUR / MS_IN_MIN); // GMT-8 for US/Pacific
      });
    });
  });

  describe('normalizeDatumBgUnits', () => {
    beforeEach(() => {
      dataUtil.bgPrefs = { bgUnits: MGDL_UNITS };
    });

    it('should convert the `value` field by default if bg prefs are for mg/dL units', () => {
      const datum = { value: 10 };

      dataUtil.normalizeDatumBgUnits(datum);
      expect(datum.value).to.equal(180.1559);
    });

    it('should not convert the `value` field if bg prefs are for mmol/L units', () => {
      dataUtil.bgPrefs = { bgUnits: MMOLL_UNITS };
      const datum = { value: 10 };

      dataUtil.normalizeDatumBgUnits(datum);
      expect(datum.value).to.equal(10);
    });

    it('should update the `units` field if bg prefs are for mg/dL units', () => {
      const datumWithUnitsString = { value: 10, units: MMOLL_UNITS };
      const datumWithUnitsObject = { value: 10, units: { bg: MMOLL_UNITS } };

      dataUtil.normalizeDatumBgUnits(datumWithUnitsString);
      expect(datumWithUnitsString.units).to.equal(MGDL_UNITS);

      dataUtil.normalizeDatumBgUnits(datumWithUnitsObject);
      expect(datumWithUnitsObject.units.bg).to.equal(MGDL_UNITS);
    });

    it('should convert any specified fields at the root of an object', () => {
      const datum = { myField1: 10, myField2: 1 };

      dataUtil.normalizeDatumBgUnits(datum, [], ['myField1', 'myField2']);
      expect(datum.myField1).to.equal(180.1559);
      expect(datum.myField2).to.equal(18.01559);
    });

    it('should convert any specified fields in nested object properties', () => {
      const datum = {
        deeply: {
          nested: { myField1: 10, myField2: 1 },
        },
      };

      dataUtil.normalizeDatumBgUnits(datum, ['deeply', 'nested'], ['myField1', 'myField2']);
      expect(datum.deeply.nested.myField1).to.equal(180.1559);
      expect(datum.deeply.nested.myField2).to.equal(18.01559);
    });

    it('should convert any specified fields in nested arrays', () => {
      const datum = {
        deeply: {
          nested: [
            { myField1: 10, myField2: 1 },
            { myField1: 1, myField2: 10 },
          ],
        },
      };

      dataUtil.normalizeDatumBgUnits(datum, ['deeply', 'nested'], ['myField1', 'myField2']);
      expect(datum.deeply.nested[0].myField1).to.equal(180.1559);
      expect(datum.deeply.nested[0].myField2).to.equal(18.01559);
      expect(datum.deeply.nested[1].myField1).to.equal(18.01559);
      expect(datum.deeply.nested[1].myField2).to.equal(180.1559);
    });
  });

  describe('normalizeSuppressedBasal', () => {
    it('should add missing rate to a suppressed temp basal', () => {
      const datum = {
        suppressed: {
          deliveryType: 'temp',
          percent: 0.5,
          suppressed: {
            deliveryType: 'scheduled',
            rate: 0.2,
          },
        },
      };

      dataUtil.normalizeSuppressedBasal(datum);
      expect(datum.suppressed.rate).to.equal(0.1);
    });

    it('should set the suppressed `duration`, `time`, and `deviceTIme` to the parent values', () => {
      const datum = {
        duration: 1000,
        time: '2018-02-01T00:00:00',
        deviceTime: '2018-02-01T00:00:00',
        suppressed: {
          deliveryType: 'temp',
        },
      };

      dataUtil.normalizeSuppressedBasal(datum);
      expect(datum.suppressed.duration).to.equal(1000);
      expect(datum.suppressed.time).to.equal(Date.parse('2018-02-01T00:00:00'));
      expect(datum.suppressed.deviceTime).to.equal(Date.parse('2018-02-01T00:00:00'));
    });

    it('should call itself recursively as needed', () => {
      const datum = {
        duration: 1000,
        time: '2018-02-01T00:00:00',
        suppressed: {
          deliveryType: 'suspend',
          suppressed: {
            deliveryType: 'temp',
            suppressed: {
              deliveryType: 'scheduled',
            },
          },
        },
      };

      sinon.spy(dataUtil, 'normalizeSuppressedBasal');

      dataUtil.normalizeSuppressedBasal(datum);

      sinon.assert.calledWith(dataUtil.normalizeSuppressedBasal, sinon.match(datum.suppressed));
      sinon.assert.calledWith(dataUtil.normalizeSuppressedBasal, sinon.match(datum.suppressed.suppressed));
    });
  });

  describe('removeData', () => {
    context('predicate is provided', () => {
      it('should call the `clearFilters` method', () => {
        const clearFiltersSpy = sinon.spy(dataUtil, 'clearFilters');
        sinon.assert.callCount(clearFiltersSpy, 0);
        dataUtil.removeData({ foo: 'bar' });
        sinon.assert.callCount(clearFiltersSpy, 1);
      });

      it('should remove selective data from the crossfilter when predicate arg is supplied as a function', () => {
        initDataUtil(defaultData);
        expect(dataUtil.data.size()).to.equal(37);
        dataUtil.removeData(d => (d.type === 'basal'));
        expect(dataUtil.data.size()).to.equal(34);
      });

      it('should remove selective data from the crossfilter when predicate arg is supplied as an object', () => {
        initDataUtil(defaultData);
        expect(dataUtil.data.size()).to.equal(37);
        dataUtil.removeData({ type: 'basal' });
        expect(dataUtil.data.size()).to.equal(34);
      });
    });

    context('predicate not provided', () => {
      it('should remove all data from the crossfilter', () => {
        initDataUtil(defaultData);
        expect(dataUtil.data.size()).to.equal(37);
        dataUtil.removeData();
        expect(dataUtil.data.size()).to.equal(0);
      });

      it('should reset the id maps and latestDatumByType', () => {
        dataUtil.bolusToWizardIdMap = { foo: 'bar' };
        dataUtil.bolusDatumsByIdMap = { foo: 'bar' };
        dataUtil.wizardDatumsByIdMap = { foo: 'bar' };
        dataUtil.latestDatumByType = { foo: 'bar' };
        dataUtil.removeData();
        expect(dataUtil.bolusToWizardIdMap).to.eql({});
        expect(dataUtil.bolusDatumsByIdMap).to.eql({});
        expect(dataUtil.wizardDatumsByIdMap).to.eql({});
        expect(dataUtil.latestDatumByType).to.eql({});
      });

      it('should delete the `bgSources` metadata', () => {
        dataUtil.bgSources = { foo: 'bar' };
        dataUtil.removeData();
        expect(dataUtil.bgSources).to.be.undefined;
      });

      it('should delete the `bgPrefs` metadata', () => {
        dataUtil.bgPrefs = { foo: 'bar' };
        dataUtil.removeData();
        expect(dataUtil.bgPrefs).to.be.undefined;
      });

      it('should delete the `timePrefs` metadata', () => {
        dataUtil.timePrefs = { foo: 'bar' };
        dataUtil.removeData();
        expect(dataUtil.timePrefs).to.be.undefined;
      });

      it('should delete the `latestPumpUpload` metadata', () => {
        dataUtil.latestPumpUpload = { foo: 'bar' };
        dataUtil.removeData();
        expect(dataUtil.latestPumpUpload).to.be.undefined;
      });

      it('should delete the `devices` metadata', () => {
        dataUtil.devices = [{ foo: 'bar' }];
        dataUtil.removeData();
        expect(dataUtil.devices).to.be.undefined;
      });

      it('should delete the `excludedDevices` metadata', () => {
        dataUtil.excludedDevices = ['foo', 'bar'];
        dataUtil.removeData();
        expect(dataUtil.excludedDevices).to.be.undefined;
      });

      it('should clear the `matchedDevices` metadata', () => {
        dataUtil.matchedDevices = { foo: true, bar: true };
        dataUtil.removeData();
        expect(dataUtil.matchedDevices).to.eql({});
      });
    });
  });

  describe('updateDatum', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
    });

    it('should fetch the exisiting datum by matching `id`', () => {
      sinon.spy(dataUtil.filter, 'byId');
      dataUtil.updateDatum({ id: defaultData[0].id, updated: true });
      sinon.assert.calledWith(dataUtil.filter.byId, defaultData[0].id);
    });

    it('should call `normalizeDatumIn` with a clone of the existing datum being updated', () => {
      sinon.spy(dataUtil, 'normalizeDatumIn');
      sinon.spy(_, 'cloneDeep');

      const updatedDatum = { id: defaultData[0].id, updated: true };
      dataUtil.updateDatum(updatedDatum);

      sinon.assert.calledWith(_.cloneDeep, updatedDatum);
      sinon.assert.calledWith(dataUtil.normalizeDatumIn, sinon.match(updatedDatum));

      _.cloneDeep.restore();
    });

    it('should update the existing datum, but only if it passes validation', () => {
      sinon.spy(_, 'assign');
      const normalisedExistingDatum = {
        ...defaultData[0],
        time: Date.parse(defaultData[0].time),
        deviceTime: Date.parse(defaultData[0].time),
      };

      const badUpdatedDatum = { ...defaultData[0], deliveryType: 'foo' };
      const goodUpdatedDatum = { ...defaultData[0], deliveryType: 'scheduled' };

      dataUtil.updateDatum(badUpdatedDatum);
      sinon.assert.notCalled(_.assign);

      expect(dataUtil.filter.byId(goodUpdatedDatum.id).top(1)[0].deliveryType).to.equal('automated');

      dataUtil.updateDatum(goodUpdatedDatum);
      sinon.assert.calledWith(_.assign, sinon.match({
        ...normalisedExistingDatum,
        deliveryType: 'scheduled',
      }));

      expect(dataUtil.filter.byId(goodUpdatedDatum.id).top(1)[0].deliveryType).to.equal('scheduled');

      _.assign.restore();
    });

    it('should clear all filters and reset the byId filter after filtering by id', () => {
      sinon.stub(dataUtil, 'clearFilters');
      sinon.stub(dataUtil, 'normalizeDatumOut');
      sinon.spy(dataUtil.filter, 'byId');
      sinon.spy(dataUtil.dimension.byId, 'filterAll');

      const updatedDatum = { id: defaultData[0].id, updated: true };
      dataUtil.updateDatum(updatedDatum);

      sinon.assert.calledOnce(dataUtil.clearFilters);
      sinon.assert.calledOnce(dataUtil.filter.byId);
      sinon.assert.calledOnce(dataUtil.dimension.byId.filterAll);
      sinon.assert.callOrder(dataUtil.clearFilters, dataUtil.filter.byId, dataUtil.dimension.byId.filterAll);
    });

    it('should update the byTime dimension', () => {
      sinon.spy(dataUtil, 'buildByTimeDimension');

      const updatedDatum = { id: defaultData[0].id, updated: true };
      dataUtil.updateDatum(updatedDatum);

      sinon.assert.calledOnce(dataUtil.buildByTimeDimension);
    });

    it('should return the normalized datum', () => {
      sinon.stub(dataUtil, 'normalizeDatumIn');

      sinon.stub(dataUtil, 'normalizeDatumOut').callsFake(d => {
        d.normalized = true; // eslint-disable-line no-param-reassign
        return d;
      });

      const updatedDatum = { id: defaultData[0].id, updated: true };
      expect(dataUtil.updateDatum(updatedDatum).datum.normalized).to.be.true;
    });
  });

  describe('buildByDayOfWeekDimension', () => {
    it('should build the `byDayOfWeek` dimension', () => {
      delete dataUtil.dimension.byDayOfWeek;

      dataUtil.buildByDayOfWeekDimension();
      expect(dataUtil.dimension.byDayOfWeek).to.be.an('object').and.include.keys([
        'filter',
        'filterAll',
        'top',
        'bottom',
      ]);
    });
  });

  describe('buildByDateDimension', () => {
    it('should build the `byDate` dimension', () => {
      delete dataUtil.dimension.byDate;

      dataUtil.buildByDateDimension();
      expect(dataUtil.dimension.byDate).to.be.an('object').and.include.keys([
        'filter',
        'filterAll',
        'top',
        'bottom',
      ]);
    });
  });

  describe('buildByIdDimension', () => {
    it('should build the `byId` dimension', () => {
      delete dataUtil.dimension.byId;

      dataUtil.buildByIdDimension();
      expect(dataUtil.dimension.byId).to.be.an('object').and.include.keys([
        'filter',
        'filterAll',
        'top',
        'bottom',
      ]);
    });
  });

  describe('buildBySubTypeDimension', () => {
    it('should build the `bySubType` dimension', () => {
      delete dataUtil.dimension.bySubType;

      dataUtil.buildBySubTypeDimension();
      expect(dataUtil.dimension.bySubType).to.be.an('object').and.include.keys([
        'filter',
        'filterAll',
        'top',
        'bottom',
      ]);
    });
  });

  describe('buildByTimeDimension', () => {
    it('should build the `byTime` dimension', () => {
      delete dataUtil.dimension.byTime;

      dataUtil.buildByTimeDimension();
      expect(dataUtil.dimension.byTime).to.be.an('object').and.include.keys([
        'filter',
        'filterAll',
        'top',
        'bottom',
      ]);
    });
  });

  describe('buildByTypeDimension', () => {
    it('should build the `byType` dimension', () => {
      delete dataUtil.dimension.byType;

      dataUtil.buildByTypeDimension();
      expect(dataUtil.dimension.byType).to.be.an('object').and.include.keys([
        'filter',
        'filterAll',
        'top',
        'bottom',
      ]);
    });
  });

  describe('buildDimensions', () => {
    it('should build the data dimensions', () => {
      dataUtil.dimension = {};
      dataUtil.buildDimensions();
      expect(dataUtil.dimension.byDayOfWeek).to.be.an('object');
      expect(dataUtil.dimension.byDate).to.be.an('object');
      expect(dataUtil.dimension.byId).to.be.an('object');
      expect(dataUtil.dimension.bySubType).to.be.an('object');
      expect(dataUtil.dimension.byTime).to.be.an('object');
      expect(dataUtil.dimension.byType).to.be.an('object');
      expect(dataUtil.dimension.byDeviceId).to.be.an('object');
    });
  });

  describe('buildFilters', () => {
    it('should build the data filters', () => {
      dataUtil.filter = {};
      dataUtil.buildFilters();
      expect(dataUtil.filter.byActiveDays).to.be.a('function');
      expect(dataUtil.filter.byEndpoints).to.be.a('function');
      expect(dataUtil.filter.byType).to.be.a('function');
      expect(dataUtil.filter.byTypes).to.be.a('function');
      expect(dataUtil.filter.bySubType).to.be.a('function');
      expect(dataUtil.filter.byId).to.be.a('function');
      expect(dataUtil.filter.byDeviceIds).to.be.a('function');
    });
  });

  describe('buildSorts', () => {
    it('should build the data sorters', () => {
      dataUtil.sort = {};
      dataUtil.buildSorts();
      expect(dataUtil.sort.byTime).to.be.a('function');
    });
  });

  describe('clearFilters', () => {
    it('should clear all of the dimension filters', () => {
      const clearbyTimeSpy = sinon.spy(dataUtil.dimension.byTime, 'filterAll');
      const clearbyTypeSpy = sinon.spy(dataUtil.dimension.byType, 'filterAll');
      const clearbySubTypeSpy = sinon.spy(dataUtil.dimension.bySubType, 'filterAll');
      const clearbyIdSpy = sinon.spy(dataUtil.dimension.byId, 'filterAll');
      const clearbyDayOfWeekSpy = sinon.spy(dataUtil.dimension.byDayOfWeek, 'filterAll');
      const clearbyDeviceIdSpy = sinon.spy(dataUtil.dimension.byDeviceId, 'filterAll');

      sinon.assert.callCount(clearbyTimeSpy, 0);
      sinon.assert.callCount(clearbyTypeSpy, 0);
      sinon.assert.callCount(clearbySubTypeSpy, 0);
      sinon.assert.callCount(clearbyIdSpy, 0);
      sinon.assert.callCount(clearbyDayOfWeekSpy, 0);
      sinon.assert.callCount(clearbyDeviceIdSpy, 0);

      dataUtil.clearFilters();

      sinon.assert.callCount(clearbyTimeSpy, 1);
      sinon.assert.callCount(clearbyTypeSpy, 1);
      sinon.assert.callCount(clearbySubTypeSpy, 1);
      sinon.assert.callCount(clearbyIdSpy, 1);
      sinon.assert.callCount(clearbyDayOfWeekSpy, 1);
      sinon.assert.callCount(clearbyDeviceIdSpy, 1);
    });
  });

  describe('setBgSources', () => {
    it('should clear all filters before filtering by type', () => {
      sinon.spy(dataUtil, 'clearFilters');
      sinon.spy(dataUtil.filter, 'byType');

      dataUtil.setBgSources();
      sinon.assert.callOrder(dataUtil.clearFilters, dataUtil.filter.byType);
    });

    it('should set the bgSources property with flags for cbg and smbg availability', () => {
      dataUtil.setBgSources();
      expect(dataUtil.bgSources.cbg).to.be.false;
      expect(dataUtil.bgSources.smbg).to.be.false;

      initDataUtil([...cbgData]);
      dataUtil.setBgSources();
      expect(dataUtil.bgSources.cbg).to.be.true;
      expect(dataUtil.bgSources.smbg).to.be.false;

      initDataUtil([...smbgData]);
      dataUtil.setBgSources();
      expect(dataUtil.bgSources.cbg).to.be.false;
      expect(dataUtil.bgSources.smbg).to.be.true;

      initDataUtil([...cbgData, ...smbgData]);
      dataUtil.setBgSources();
      expect(dataUtil.bgSources.cbg).to.be.true;
      expect(dataUtil.bgSources.smbg).to.be.true;
    });

    it('should set the current source if provided via arg', () => {
      initDataUtil([...cbgData, ...smbgData]);
      delete(dataUtil.bgSources.current);

      dataUtil.setBgSources('cbg');
      expect(dataUtil.bgSources.current).to.equal('cbg');

      dataUtil.setBgSources('smbg');
      expect(dataUtil.bgSources.current).to.equal('smbg');
    });

    context('current source is not provided by arg', () => {
      context('`bgSources.current` property is not already set', () => {
        it('should set the current source to cbg if cbg data is available', () => {
          initDataUtil([...cbgData, ...smbgData]);
          delete(dataUtil.bgSources.current);

          dataUtil.setBgSources();
          expect(dataUtil.bgSources.current).to.equal('cbg');
        });

        it('should set the current source to smbg if cbg data is unavailable but smbg data is', () => {
          initDataUtil([...smbgData]);
          delete(dataUtil.bgSources.current);

          dataUtil.setBgSources();
          expect(dataUtil.bgSources.current).to.equal('smbg');
        });
      });

      context('`bgSources.current` property is already set', () => {
        it('should not update the current bg source', () => {
          initDataUtil([...cbgData, ...smbgData]);
          dataUtil.bgSources.current = 'smbg';

          dataUtil.setBgSources();
          expect(dataUtil.bgSources.current).to.equal('smbg');
        });
      });
    });
  });

  describe('setLatestPumpUpload', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
    });

    it('should clear all filters before filtering by `upload` type', () => {
      sinon.spy(dataUtil, 'clearFilters');
      sinon.spy(dataUtil.filter, 'byType');

      dataUtil.setLatestPumpUpload();
      sinon.assert.callOrder(dataUtil.clearFilters, dataUtil.filter.byType);
      sinon.assert.calledWith(dataUtil.filter.byType, 'upload');
    });

    it('should sort upload results by time after filtering by `upload` type', () => {
      sinon.spy(dataUtil.filter, 'byType');
      sinon.spy(dataUtil.sort, 'byTime');

      dataUtil.setLatestPumpUpload();
      sinon.assert.calledWith(dataUtil.filter.byType, 'upload');
      sinon.assert.callOrder(dataUtil.filter.byType, dataUtil.sort.byTime);
    });

    it('should return the make, model, latest settings, and automated delivery and settings override capabilities of the latest pump uploaded', () => {
      let latestPumpSettings = { type: 'pumpSettings' };
      dataUtil.latestDatumByType.pumpSettings = latestPumpSettings;

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.eql({
        manufacturer: 'medtronic',
        deviceModel: '1780',
        isAutomatedBasalDevice: true,
        isAutomatedBolusDevice: false,
        isSettingsOverrideDevice: false,
        settings: { ...latestPumpSettings, lastManualBasalSchedule: 'standard' },
      });

      dataUtil.removeData({ id: uploadData[2].id });

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.eql({
        manufacturer: 'insulet',
        deviceModel: 'dash',
        isAutomatedBasalDevice: false,
        isAutomatedBolusDevice: false,
        isSettingsOverrideDevice: false,
        settings: { ...latestPumpSettings },
      });

      dataUtil.removeData({ id: uploadData[1].id });
      latestPumpSettings = { type: 'pumpSettings', deviceId: 'tandemCIQ123456' };
      dataUtil.latestDatumByType.pumpSettings = latestPumpSettings;

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.eql({
        manufacturer: 'tandem',
        deviceModel: '12345',
        isAutomatedBasalDevice: true,
        isAutomatedBolusDevice: true,
        isSettingsOverrideDevice: true,
        settings: { ...latestPumpSettings, lastManualBasalSchedule: 'standard' },
      });
    });
  });

  describe('setUploadMap', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
    });

    it('should clear all filters before filtering by `upload` and `pumpSettings` types', () => {
      sinon.spy(dataUtil, 'clearFilters');
      sinon.spy(dataUtil.filter, 'byType');

      dataUtil.setUploadMap();
      sinon.assert.callOrder(dataUtil.clearFilters, dataUtil.filter.byType);
      sinon.assert.calledTwice(dataUtil.filter.byType);
      sinon.assert.calledWith(dataUtil.filter.byType, 'upload');
      sinon.assert.calledWith(dataUtil.filter.byType, 'pumpSettings');
    });

    it('should set the source and device serial number for each upload', () => {
      dataUtil.setUploadMap();
      expect(dataUtil.uploadMap).to.be.an('object').and.have.keys([
        uploadData[0].uploadId,
        uploadData[1].uploadId,
        uploadData[2].uploadId,
        uploadData[3].uploadId,
        uploadData[4].uploadId,
      ]);

      expect(dataUtil.uploadMap[uploadData[0].uploadId]).to.eql({
        source: 'Tandem',
        deviceSerialNumber: 'sn-0',
      });

      expect(dataUtil.uploadMap[uploadData[1].uploadId]).to.eql({
        source: 'Insulet',
        deviceSerialNumber: 'sn-1',
      });

      expect(dataUtil.uploadMap[uploadData[2].uploadId]).to.eql({
        source: 'Medtronic',
        deviceSerialNumber: 'sn-2',
      });

      expect(dataUtil.uploadMap[uploadData[3].uploadId]).to.eql({
        source: 'tidepool loop',
        deviceSerialNumber: 'Unknown',
      });

      expect(dataUtil.uploadMap[uploadData[4].uploadId]).to.eql({
        source: 'diy loop',
        deviceSerialNumber: 'Unknown',
      });
    });

    it('should set `deviceSerialNumber` to unknown when not available', () => {
      dataUtil.updateDatum({ ...uploadData[2], deviceSerialNumber: undefined });

      dataUtil.setUploadMap();
      expect(dataUtil.uploadMap[uploadData[2].uploadId]).to.eql({
        source: 'Medtronic',
        deviceSerialNumber: 'Unknown',
      });
    });

    it('should set a missing `source` field to first deviceManufacturers array item', () => {
      dataUtil.updateDatum({ ...uploadData[2], source: undefined, deviceManufacturers: ['pumpCo'] });

      dataUtil.setUploadMap();
      expect(dataUtil.uploadMap[uploadData[2].uploadId]).to.eql({
        source: 'pumpCo',
        deviceSerialNumber: 'sn-2',
      });
    });

    it('should fix `source` field for carelink uploads erroneously set to `Medtronic`', () => {
      dataUtil.updateDatum({ ...uploadData[2], source: undefined, deviceManufacturers: ['Medtronic'] });
      dataUtil.updateDatum({ ...pumpSettingsData[1], uploadId: uploadData[2].uploadId, source: 'carelink' });

      dataUtil.setUploadMap();
      expect(dataUtil.uploadMap[uploadData[2].uploadId]).to.eql({
        source: 'carelink',
        deviceSerialNumber: 'sn-2',
      });
    });
  });

  describe('setIncompleteSuspends', () => {
    it('should clear all filters before filtering by `deviceEvent` types, and sorting by time', () => {
      sinon.spy(dataUtil, 'clearFilters');
      sinon.spy(dataUtil.filter, 'byType');
      sinon.spy(dataUtil.sort, 'byTime');

      dataUtil.setIncompleteSuspends();
      sinon.assert.callOrder(dataUtil.clearFilters, dataUtil.filter.byType, dataUtil.sort.byTime);
      sinon.assert.calledWith(dataUtil.filter.byType, 'deviceEvent');
      sinon.assert.calledOnce(dataUtil.sort.byTime);
    });

    it('should set a list of deviceEvents datums that represent incomplete suspends', () => {
      const deviceEvents = [
        { ...new Types.DeviceEvent({ ...useRawData }), annotations: [] },
        { ...new Types.DeviceEvent({ ...useRawData }), annotations: [{ code: 'status/incomplete-tuple' }] },
      ];

      initDataUtil(deviceEvents);
      delete(dataUtil.incompleteSuspends);

      dataUtil.setIncompleteSuspends();
      expect(dataUtil.incompleteSuspends).to.be.an('array');
      expect(dataUtil.incompleteSuspends[0].id).to.equal(deviceEvents[1].id);
    });
  });

  describe('setSize', () => {
    it('should set the size property to the current data count', () => {
      const deviceEvents = [
        { ...new Types.DeviceEvent({ ...useRawData }), annotations: [] },
        { ...new Types.DeviceEvent({ ...useRawData }), annotations: [{ code: 'status/incomplete-tuple' }] },
      ];

      initDataUtil(deviceEvents);
      delete(dataUtil.size);

      dataUtil.setSize();
      expect(dataUtil.size).to.equal(2);
    });
  });

  describe('setDevices', () => {
    it('should set the devices of the current data set', () => {
      const deviceEvents = [
        { ...new Types.DeviceEvent({ ...useRawData }), annotations: [], deviceId: 'device1' },
        { ...new Types.DeviceEvent({ ...useRawData }), annotations: [{ code: 'status/incomplete-tuple' }], deviceId: 'device2' },
      ];

      initDataUtil(deviceEvents);
      delete(dataUtil.devices);

      dataUtil.setDevices();
      expect(dataUtil.devices).to.eql([{ id: 'device1' }, { id: 'device2' }]);
    });

    it('should add (Control-IQ) to a control-iq device label', () => {
      initDataUtil([uploadData[0]]);
      delete(dataUtil.devices);

      dataUtil.setDevices();
      expect(dataUtil.devices).to.eql([
        {
          bgm: false,
          cgm: false,
          id: 'tandemCIQ12345',
          label: 'Tandem 12345 (Control-IQ)',
          pump: true,
          serialNumber: 'sn-0',
        },
      ]);
    });

    it('should exclude a non-Control-IQ device upload if a Control-IQ upload exists', () => {
      initDataUtil([{ ...uploadData[0], deviceId: 'tandem12345' }]);
      delete(dataUtil.devices);
      delete(dataUtil.excludedDevices);

      // add non-CIQ device upload. Should not be excluded
      dataUtil.setDevices();

      expect(dataUtil.devices).to.eql([
        {
          bgm: false,
          cgm: false,
          id: 'tandem12345',
          label: 'Tandem 12345',
          pump: true,
          serialNumber: 'sn-0',
        },
      ]);

      expect(dataUtil.excludedDevices).to.eql([]);

      // add CIQ device upload and re-run. Should exclude the non-CIQ device
      dataUtil.addData([uploadData[0]], defaultPatientId);
      dataUtil.setDevices();

      expect(dataUtil.devices).to.eql([
        {
          bgm: false,
          cgm: false,
          id: 'tandem12345',
          label: 'Tandem 12345',
          pump: true,
          serialNumber: 'sn-0',
        },
        {
          bgm: false,
          cgm: false,
          id: 'tandemCIQ12345',
          label: 'Tandem 12345 (Control-IQ)',
          pump: true,
          serialNumber: 'sn-0',
        },
      ]);

      expect(dataUtil.excludedDevices).to.eql(['tandem12345']);
    });
  });

  describe('setMetaData', () => {
    it('should call all the metadata setters and in the correct order where required', () => {
      sinon.spy(dataUtil, 'setSize');
      sinon.spy(dataUtil, 'setBgPrefs');
      sinon.spy(dataUtil, 'setBgSources');
      sinon.spy(dataUtil, 'setTimePrefs');
      sinon.spy(dataUtil, 'setEndpoints');
      sinon.spy(dataUtil, 'setActiveDays');
      sinon.spy(dataUtil, 'setTypes');
      sinon.spy(dataUtil, 'setUploadMap');
      sinon.spy(dataUtil, 'setDevices');
      sinon.spy(dataUtil, 'setLatestPumpUpload');
      sinon.spy(dataUtil, 'setIncompleteSuspends');

      dataUtil.setMetaData();

      sinon.assert.calledOnce(dataUtil.setSize);
      sinon.assert.calledOnce(dataUtil.setBgPrefs);
      sinon.assert.calledOnce(dataUtil.setBgSources);
      sinon.assert.calledOnce(dataUtil.setTimePrefs);
      sinon.assert.calledOnce(dataUtil.setEndpoints);
      sinon.assert.calledOnce(dataUtil.setActiveDays);
      sinon.assert.calledOnce(dataUtil.setTypes);
      sinon.assert.calledOnce(dataUtil.setUploadMap);
      sinon.assert.calledOnce(dataUtil.setDevices);
      sinon.assert.calledOnce(dataUtil.setLatestPumpUpload);
      sinon.assert.calledOnce(dataUtil.setIncompleteSuspends);

      sinon.assert.callOrder(dataUtil.setEndpoints, dataUtil.setActiveDays);
    });
  });

  describe('setEndpoints', () => {
    beforeEach(() => {
      dataUtil.setTimePrefs(defaultTimePrefs);
    });

    context('endpoints arg missing', () => {
      it('should set a default `endpoints.current.range` property', () => {
        delete dataUtil.endpoints;

        dataUtil.setEndpoints();
        expect(dataUtil.endpoints).to.eql({
          current: { range: [0, Infinity] },
        });
      });
    });

    context('endpoints arg provided', () => {
      it('should set `endpoints.current` range, days, and activeDays property using the provided endpoints', () => {
        delete dataUtil.endpoints;

        dataUtil.setEndpoints(twoDayEndpoints);
        expect(dataUtil.endpoints.current).to.eql({
          range: [
            moment.utc(twoDayEndpoints[0]).valueOf(),
            moment.utc(twoDayEndpoints[1]).valueOf(),
          ],
          days: 2,
          activeDays: 2,
        });
      });
    });

    context('nextDays arg provided', () => {
      it('should set `endpoints.next` range, days, and activeDays property using the provided endpoints', () => {
        delete dataUtil.endpoints;

        dataUtil.setEndpoints(twoDayEndpoints, 2);
        expect(dataUtil.endpoints.next).to.eql({
          range: [
            moment.utc(twoDayEndpoints[1]).valueOf(),
            moment.utc(twoDayEndpoints[1]).add(2, 'days').valueOf(),
          ],
          days: 2,
          activeDays: 2,
        });
      });

      it('should adjust next days end endpoint if the next range overlaps a DST changeover if timezoneAware', () => {
        dataUtil.setTimePrefs({
          timeZoneAware: true,
          timezoneName: 'US/Eastern',
        });

        delete dataUtil.endpoints;

        const nextStartIsDSTEndpoints = [
          '2019-11-02T04:00:00.000Z',
          '2019-11-03T04:00:00.000Z',
        ];

        dataUtil.setEndpoints(nextStartIsDSTEndpoints, 2);
        expect(dataUtil.endpoints.next).to.eql({
          range: [
            moment.utc(nextStartIsDSTEndpoints[1]).valueOf(),
            moment.utc(nextStartIsDSTEndpoints[1]).add(2, 'days').valueOf() + MS_IN_HOUR,
          ],
          days: 2,
          activeDays: 2,
        });

        delete dataUtil.endpoints;

        const nextEndIsDSTEndpoints = [
          '2019-03-09T04:00:00.000Z',
          '2019-03-10T04:00:00.000Z',
        ];

        dataUtil.setEndpoints(nextEndIsDSTEndpoints, 2);
        expect(dataUtil.endpoints.next).to.eql({
          range: [
            moment.utc(nextEndIsDSTEndpoints[1]).valueOf(),
            moment.utc(nextEndIsDSTEndpoints[1]).add(2, 'days').valueOf() - MS_IN_HOUR,
          ],
          days: 2,
          activeDays: 2,
        });
      });
    });

    context('prevDays arg provided', () => {
      it('should set `endpoints.prev` range, days, and activeDays property using the provided endpoints', () => {
        delete dataUtil.endpoints;

        dataUtil.setEndpoints(twoDayEndpoints, undefined, 2);
        expect(dataUtil.endpoints.prev).to.eql({
          range: [
            moment.utc(twoDayEndpoints[0]).subtract(2, 'days').valueOf(),
            moment.utc(twoDayEndpoints[0]).valueOf(),
          ],
          days: 2,
          activeDays: 2,
        });
      });

      it('should adjust prev days end endpoint if the prev range overlaps a DST changeover if timezoneAware', () => {
        dataUtil.setTimePrefs({
          timeZoneAware: true,
          timezoneName: 'US/Eastern',
        });

        delete dataUtil.endpoints;

        const prevStartIsDSTEndpoints = [
          '2019-11-04T05:00:00.000Z',
          '2019-11-05T05:00:00.000Z',
        ];

        dataUtil.setEndpoints(prevStartIsDSTEndpoints, undefined, 2);
        expect(dataUtil.endpoints.prev).to.eql({
          range: [
            moment.utc(prevStartIsDSTEndpoints[0]).subtract(2, 'days').valueOf() - MS_IN_HOUR,
            moment.utc(prevStartIsDSTEndpoints[0]).valueOf(),
          ],
          days: 2,
          activeDays: 2,
        });


        delete dataUtil.endpoints;

        const prevEndIsDSTEndpoints = [
          '2019-03-12T05:00:00.000Z',
          '2019-03-13T05:00:00.000Z',
        ];

        dataUtil.setEndpoints(prevEndIsDSTEndpoints, undefined, 2);
        expect(dataUtil.endpoints.prev).to.eql({
          range: [
            moment.utc(prevEndIsDSTEndpoints[0]).subtract(2, 'days').valueOf() + MS_IN_HOUR,
            moment.utc(prevEndIsDSTEndpoints[0]).valueOf(),
          ],
          days: 2,
          activeDays: 2,
        });
      });
    });
  });

  describe('setActiveDays', () => {
    it('should set the activeDays prop if provided, and update the active days of the week for each endpoints range', () => {
      dataUtil.setTimePrefs(defaultTimePrefs);

      dataUtil.setEndpoints(twoWeekEndpoints, 14, 14);
      expect(dataUtil.endpoints.current.activeDays).to.equal(14);
      expect(dataUtil.endpoints.next.activeDays).to.equal(14);
      expect(dataUtil.endpoints.prev.activeDays).to.equal(14);

      dataUtil.setActiveDays([0, 1, 2, 4, 5, 6]); // Remove Wednesdays

      expect(dataUtil.endpoints.current.activeDays).to.equal(12);
      expect(dataUtil.endpoints.next.activeDays).to.equal(12);
      expect(dataUtil.endpoints.prev.activeDays).to.equal(12);

      dataUtil.setEndpoints(twoDayEndpoints, 2, 2);
      dataUtil.setActiveDays([3]); // Show only Wednesdays

      expect(dataUtil.endpoints.current.activeDays).to.equal(0);
      expect(dataUtil.endpoints.next.activeDays).to.equal(0);
      expect(dataUtil.endpoints.prev.activeDays).to.equal(1);
    });
  });

  describe('setStats', () => {
    it('should set stats prop when provided as an string', () => {
      dataUtil.setStats('averageGlucose, timeInRange');
      expect(dataUtil.stats).to.eql(['averageGlucose', 'timeInRange']);
    });

    it('should set stats prop when provided as an array', () => {
      dataUtil.setStats(['averageGlucose', 'timeInRange']);
      expect(dataUtil.stats).to.eql(['averageGlucose', 'timeInRange']);
    });
  });

  describe('setTypes', () => {
    it('should set the types property as an array of data types query objects', () => {
      const typesAsArray = [
        {
          type: 'cbg',
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
        {
          type: 'smbg',
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
      ];

      const typesAsObject = {
        cbg: {
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
        smbg: {
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
      };

      initDataUtil([new Types.CBG({ ...useRawData })]);

      expect(dataUtil.types).to.eql([]);

      dataUtil.setTypes(typesAsArray);
      expect(dataUtil.types).to.eql(typesAsArray);

      dataUtil.setTypes(); // Should set back to empty array when types not provided
      expect(dataUtil.types).to.eql([]);

      dataUtil.setTypes(typesAsObject); // Should transform object types to array format
      expect(dataUtil.types).to.eql(typesAsArray);
    });

    it('should increment the `queryDataCount` metadata if types are provided', () => {
      const typesAsArray = [
        {
          type: 'cbg',
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
        {
          type: 'smbg',
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
      ];

      const typesAsObject = {
        cbg: {
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
        smbg: {
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
      };

      initDataUtil([new Types.CBG({ ...useRawData })]);

      expect(dataUtil.queryDataCount).to.eql(0);

      dataUtil.setTypes(typesAsArray); // Should increment, as types arg is not empty
      expect(dataUtil.queryDataCount).to.eql(1);

      dataUtil.setTypes(); // Should not increment, as types arg is empty
      expect(dataUtil.queryDataCount).to.eql(1);

      dataUtil.setTypes(typesAsObject); // Should increment, as types arg is not empty
      expect(dataUtil.queryDataCount).to.eql(2);
    });
  });

  describe('setTimePrefs', () => {
    it('should default to setting timezoneAware to `false` when no `timePrefs` arg provided', () => {
      delete(dataUtil.timePrefs);
      dataUtil.setTimePrefs();
      expect(dataUtil.timePrefs).to.eql({ timezoneAware: false, timezoneName: undefined });
    });

    it('should set the timezone name to UTC when timezoneAware is `true`, but timezoneName not provided', () => {
      delete(dataUtil.timePrefs);
      dataUtil.setTimePrefs({ timezoneAware: true });
      expect(dataUtil.timePrefs).to.eql({ timezoneAware: true, timezoneName: 'UTC' });
    });

    it('should set the timezone name to the provided `timezoneName`', () => {
      delete(dataUtil.timePrefs);
      dataUtil.setTimePrefs({ timezoneAware: true, timezoneName: 'US/Pacific' });
      expect(dataUtil.timePrefs).to.eql({ timezoneAware: true, timezoneName: 'US/Pacific' });
    });

    it('should set the activeTimeField to `time` if `timezoneAware` is true, otherwise to `deviceTime`', () => {
      delete(dataUtil.activeTimeField);
      dataUtil.setTimePrefs({ timezoneAware: true });
      expect(dataUtil.activeTimeField).to.equal('time');

      dataUtil.setTimePrefs({ timezoneAware: false });
      expect(dataUtil.activeTimeField).to.equal('deviceTime');
    });

    it('should rebuild dimensions as necessary if `timezoneName` changes', () => {
      sinon.spy(dataUtil, 'buildByDateDimension');
      sinon.spy(dataUtil, 'buildByDayOfWeekDimension');
      sinon.spy(dataUtil, 'buildByTimeDimension');

      dataUtil.activeTimeField = 'time';
      dataUtil.timePrefs = { timezoneAware: true, timezoneName: undefined };

      sinon.assert.notCalled(dataUtil.buildByDateDimension);
      sinon.assert.notCalled(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.notCalled(dataUtil.buildByTimeDimension);

      dataUtil.setTimePrefs({ timezoneAware: true, timezoneName: 'UTC' });

      sinon.assert.calledOnce(dataUtil.buildByDateDimension);
      sinon.assert.calledOnce(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.notCalled(dataUtil.buildByTimeDimension);

      dataUtil.setTimePrefs({ timezoneAware: true, timezoneName: 'US/Pacific' });

      sinon.assert.calledTwice(dataUtil.buildByDateDimension);
      sinon.assert.calledTwice(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.notCalled(dataUtil.buildByTimeDimension);
    });

    it('should rebuild dimensions as necessary if `timezoneAware` changes', () => {
      sinon.spy(dataUtil, 'buildByDateDimension');
      sinon.spy(dataUtil, 'buildByDayOfWeekDimension');
      sinon.spy(dataUtil, 'buildByTimeDimension');

      dataUtil.activeTimeField = 'deviceTime';
      dataUtil.timePrefs = { timeZoneAware: undefined };

      sinon.assert.notCalled(dataUtil.buildByDateDimension);
      sinon.assert.notCalled(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.notCalled(dataUtil.buildByTimeDimension);

      dataUtil.setTimePrefs({ timezoneAware: false });

      sinon.assert.calledOnce(dataUtil.buildByDateDimension);
      sinon.assert.calledOnce(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.calledOnce(dataUtil.buildByTimeDimension);

      dataUtil.setTimePrefs({ timezoneAware: true });

      sinon.assert.calledTwice(dataUtil.buildByDateDimension);
      sinon.assert.calledTwice(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.calledTwice(dataUtil.buildByTimeDimension);
    });

    it('should rebuild dimensions as necessary if `activeTimeField` changes', () => {
      sinon.spy(dataUtil, 'buildByDateDimension');
      sinon.spy(dataUtil, 'buildByDayOfWeekDimension');
      sinon.spy(dataUtil, 'buildByTimeDimension');

      dataUtil.timePrefs = { timeZoneAware: undefined };
      delete(dataUtil.activeTimeField);

      sinon.assert.notCalled(dataUtil.buildByDateDimension);
      sinon.assert.notCalled(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.notCalled(dataUtil.buildByTimeDimension);

      dataUtil.activeTimeField = 'deviceTime';
      dataUtil.setTimePrefs();

      sinon.assert.calledOnce(dataUtil.buildByDateDimension);
      sinon.assert.calledOnce(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.calledOnce(dataUtil.buildByTimeDimension);

      dataUtil.activeTimeField = 'time';
      dataUtil.setTimePrefs();

      sinon.assert.calledTwice(dataUtil.buildByDateDimension);
      sinon.assert.calledTwice(dataUtil.buildByDayOfWeekDimension);
      sinon.assert.calledTwice(dataUtil.buildByTimeDimension);
    });
  });

  describe('setBgPrefs', () => {
    it('should default to mg/dL units and bounds when `bgPrefs` arg not provided', () => {
      delete(dataUtil.bgPrefs);
      dataUtil.setBgPrefs();
      expect(dataUtil.bgPrefs).to.eql({
        bgBounds: DEFAULT_BG_BOUNDS[MGDL_UNITS],
        bgClasses: {
          'very-low': { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].veryLowThreshold },
          low: { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].targetLowerBound },
          target: { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].targetUpperBound },
          high: { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].veryHighThreshold },
        },
        bgUnits: 'mg/dL',
      });
    });

    it('should set units and bounds when `bgPrefs` arg is provided', () => {
      delete(dataUtil.bgPrefs);
      dataUtil.setBgPrefs({
        bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
        bgClasses: {
          low: { boundary: 3.1 },
          target: { boundary: 10.2 },
        },
        bgUnits: MMOLL_UNITS,
      });
      expect(dataUtil.bgPrefs).to.eql({
        bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
        bgClasses: {
          'very-low': { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryLowThreshold },
          low: { boundary: 3.1 },
          target: { boundary: 10.2 },
          high: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryHighThreshold },
        },
        bgUnits: 'mmol/L',
      });
    });

    it('should persist any additional parameters set on the provided `bgPrefs` arg', () => {
      delete(dataUtil.bgPrefs);
      dataUtil.setBgPrefs({
        bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
        bgClasses: {
          low: { boundary: 3.1 },
          target: { boundary: 10.2 },
        },
        bgUnits: MMOLL_UNITS,
        foo: 'McBar',
      });
      expect(dataUtil.bgPrefs).to.eql({
        bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
        bgClasses: {
          'very-low': { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryLowThreshold },
          low: { boundary: 3.1 },
          target: { boundary: 10.2 },
          high: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryHighThreshold },
        },
        bgUnits: 'mmol/L',
        foo: 'McBar',
      });
    });
  });

  describe('setReturnRawData', () => {
    it('should set `returnRawData` to provided arg', () => {
      expect(dataUtil.returnRawData).to.be.undefined;
      dataUtil.setReturnRawData(true);
      expect(dataUtil.returnRawData).to.equal(true);
      dataUtil.setReturnRawData(false);
      expect(dataUtil.returnRawData).to.equal(false);
    });

    it('should set `returnRawData` to `false` if no arg provided', () => {
      expect(dataUtil.returnRawData).to.be.undefined;
      dataUtil.setReturnRawData();
      expect(dataUtil.returnRawData).to.equal(false);
    });
  });

  describe('setExcludedDevices', () => {
    it('should set `excludedDevices` to provided arg', () => {
      expect(dataUtil.excludedDevices).to.be.undefined;
      dataUtil.setExcludedDevices(['1']);
      expect(dataUtil.excludedDevices).to.eql(['1']);
      dataUtil.setExcludedDevices(['2']);
      expect(dataUtil.excludedDevices).to.eql(['2']);
    });

    it('should set `excludedDevices` to `self.excludedDevices` if no arg provided', () => {
      expect(dataUtil.excludedDevices).to.be.undefined;
      dataUtil.setExcludedDevices('foo');
      expect(dataUtil.excludedDevices).to.equal('foo');
      dataUtil.setExcludedDevices();
      expect(dataUtil.excludedDevices).to.eql('foo');
    });
  });

  describe('clearMatchedDevices', () => {
    it('should set `matchedDevices` to an empty object', () => {
      dataUtil.matchedDevices = { foo: true, bar: true };
      dataUtil.clearMatchedDevices();
      expect(dataUtil.matchedDevices).to.eql({});
    });
  });

  describe('query', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
    });

    it('should clear all filters before calling other setters', () => {
      sinon.spy(dataUtil, 'clearFilters');
      sinon.spy(dataUtil, 'setBgSources');
      sinon.spy(dataUtil, 'setTypes');
      sinon.spy(dataUtil, 'setBgPrefs');
      sinon.spy(dataUtil, 'setTimePrefs');
      sinon.spy(dataUtil, 'setEndpoints');
      sinon.spy(dataUtil, 'setActiveDays');
      sinon.spy(dataUtil, 'setExcludedDevices');
      sinon.spy(dataUtil, 'clearMatchedDevices');

      dataUtil.query(createQuery({
        bgSource: 'cbg',
        types: {
          cbg: {
            select: 'id,normalTime',
            sort: 'normalTime,asc',
          },
        },
        activeDays: [0, 1, 2],
      }));

      sinon.assert.calledTwice(dataUtil.clearFilters);
      sinon.assert.calledOnce(dataUtil.setBgSources);
      sinon.assert.calledOnce(dataUtil.setTypes);
      sinon.assert.calledOnce(dataUtil.setBgPrefs);
      sinon.assert.calledOnce(dataUtil.setTimePrefs);
      sinon.assert.calledOnce(dataUtil.setEndpoints);
      sinon.assert.calledOnce(dataUtil.setActiveDays);
      sinon.assert.calledOnce(dataUtil.setExcludedDevices);
      sinon.assert.calledOnce(dataUtil.clearMatchedDevices);

      sinon.assert.callOrder(
        dataUtil.clearFilters,
        dataUtil.setBgSources,
        dataUtil.clearFilters,
        dataUtil.clearMatchedDevices,
        dataUtil.setTypes,
        dataUtil.setBgPrefs,
        dataUtil.setTimePrefs,
        dataUtil.setEndpoints,
        dataUtil.setActiveDays,
        dataUtil.setExcludedDevices,
      );
    });

    it('should call `setReturnRawData` with `raw` as specified in the query', () => {
      sinon.spy(dataUtil, 'setReturnRawData');

      dataUtil.query({});
      sinon.assert.calledWith(dataUtil.setReturnRawData, undefined);

      dataUtil.query({ raw: true });
      sinon.assert.calledWith(dataUtil.setReturnRawData, true);
    });

    it('should always call `setReturnRawData` with `false` after calling with provided arg after query', () => {
      sinon.spy(dataUtil, 'setReturnRawData');

      dataUtil.query({ raw: true });
      sinon.assert.calledTwice(dataUtil.setReturnRawData);
      expect(dataUtil.setReturnRawData.getCall(0).args).to.eql([true]);
      expect(dataUtil.setReturnRawData.getCall(1).args).to.eql([false]);
    });

    it('should call `setBgSources` with `bgSource` as specified in the query', () => {
      sinon.spy(dataUtil, 'setBgSources');

      dataUtil.query({});
      sinon.assert.calledWith(dataUtil.setBgSources, undefined);

      dataUtil.query({ bgSource: 'cbg' });
      sinon.assert.calledTwice(dataUtil.setBgSources);
      sinon.assert.calledWith(dataUtil.setBgSources, 'cbg');
    });

    it('should call `setTypes` with `types` as specified in the query', () => {
      sinon.spy(dataUtil, 'setTypes');

      dataUtil.query({});
      sinon.assert.calledWith(dataUtil.setTypes, undefined);

      dataUtil.query({
        types: {
          cbg: {
            select: 'id,normalTime',
            sort: 'normalTime,asc',
          },
        },
      });
      sinon.assert.calledTwice(dataUtil.setTypes);
      sinon.assert.calledWith(dataUtil.setTypes, {
        cbg: {
          select: 'id,normalTime',
          sort: 'normalTime,asc',
        },
      });
    });

    it('should only call `setBgPrefs` if `bgPrefs` is specified in the query', () => {
      sinon.spy(dataUtil, 'setBgPrefs');

      dataUtil.query({});
      sinon.assert.notCalled(dataUtil.setBgPrefs);

      dataUtil.query({ bgPrefs: defaultBgPrefs });
      sinon.assert.calledOnce(dataUtil.setBgPrefs);
    });

    it('should only call `setTimePrefs` if `timePrefs` is specified in the query', () => {
      sinon.spy(dataUtil, 'setTimePrefs');

      dataUtil.query({});

      dataUtil.query({ timePrefs: defaultTimePrefs });
      sinon.assert.calledOnce(dataUtil.setTimePrefs);
    });

    it('should call `setEndpoints` with `endpoints` as specified in the query', () => {
      sinon.spy(dataUtil, 'setEndpoints');

      dataUtil.query({});
      sinon.assert.calledWith(dataUtil.setEndpoints, undefined);

      dataUtil.query({ endpoints: dayEndpoints });
      sinon.assert.calledTwice(dataUtil.setEndpoints);
      sinon.assert.calledWith(dataUtil.setEndpoints, dayEndpoints);
    });

    it('should call `setActiveDays` with `activeDays` as specified in the query', () => {
      sinon.spy(dataUtil, 'setActiveDays');

      dataUtil.query({});
      sinon.assert.calledWith(dataUtil.setActiveDays, undefined);

      dataUtil.query({ activeDays: [0, 1] });
      sinon.assert.calledTwice(dataUtil.setActiveDays);
      sinon.assert.calledWith(dataUtil.setActiveDays, [0, 1]);
    });

    it('should call `setExcludedDevices` with `devices` as specified in the query', () => {
      sinon.spy(dataUtil, 'setExcludedDevices');

      dataUtil.query({});
      sinon.assert.calledWith(dataUtil.setExcludedDevices, undefined);

      dataUtil.query({ excludedDevices: ['device1'] });
      sinon.assert.calledTwice(dataUtil.setExcludedDevices);
      sinon.assert.calledWith(dataUtil.setExcludedDevices, ['device1']);
    });

    context('generating data', () => {
      it('should filter by endpoints for each range', () => {
        sinon.spy(dataUtil.filter, 'byEndpoints');

        dataUtil.query(createQuery({
          endpoints: dayEndpoints,
          nextDays: 1,
          prevDays: 1,
        }));

        sinon.assert.calledThrice(dataUtil.filter.byEndpoints);
        sinon.assert.calledWith(dataUtil.filter.byEndpoints, [
          moment.utc(dayEndpoints[0]).valueOf(),
          moment.utc(dayEndpoints[1]).valueOf(),
        ]);

        sinon.assert.calledWith(dataUtil.filter.byEndpoints, [
          moment.utc(dayEndpoints[1]).valueOf(),
          moment.utc(dayEndpoints[1]).add(1, 'day').valueOf(),
        ]);

        sinon.assert.calledWith(dataUtil.filter.byEndpoints, [
          moment.utc(dayEndpoints[0]).subtract(1, 'day').valueOf(),
          moment.utc(dayEndpoints[0]).valueOf(),
        ]);
      });

      it('should filter by active days after filtering by endpoints for each range', () => {
        sinon.spy(dataUtil.filter, 'byEndpoints');
        sinon.spy(dataUtil.filter, 'byActiveDays');

        dataUtil.query(createQuery({
          endpoints: dayEndpoints,
          nextDays: 1,
          prevDays: 1,
        }));

        sinon.assert.calledThrice(dataUtil.filter.byActiveDays);
        sinon.assert.callOrder(
          dataUtil.filter.byEndpoints,
          dataUtil.filter.byActiveDays,
          dataUtil.filter.byEndpoints,
          dataUtil.filter.byActiveDays,
          dataUtil.filter.byEndpoints,
          dataUtil.filter.byActiveDays,
        );
      });

      it('should filter by device Ids after filtering by endpoints for each range', () => {
        sinon.spy(dataUtil.filter, 'byEndpoints');
        sinon.spy(dataUtil.filter, 'byDeviceIds');

        dataUtil.query(createQuery({
          endpoints: dayEndpoints,
          nextDays: 1,
          prevDays: 1,
        }));

        sinon.assert.calledThrice(dataUtil.filter.byDeviceIds);
        sinon.assert.callOrder(
          dataUtil.filter.byEndpoints,
          dataUtil.filter.byDeviceIds,
          dataUtil.filter.byEndpoints,
          dataUtil.filter.byDeviceIds,
          dataUtil.filter.byEndpoints,
          dataUtil.filter.byDeviceIds,
        );
      });

      it('should generate stats, but only for the current range and if requested in query', () => {
        sinon.spy(dataUtil, 'getStats');

        dataUtil.query(defaultQuery);

        sinon.assert.notCalled(dataUtil.getStats);

        const result = dataUtil.query(createQuery({ stats: 'averageGlucose' }));

        sinon.assert.calledOnce(dataUtil.getStats);

        expect(result.data.current.stats.averageGlucose).to.be.an('object');
        expect(result.data.next.stats).to.be.undefined;
        expect(result.data.prev.stats).to.be.undefined;
      });

      it('should generate aggregations by date, but only for the current range and if requested in query', () => {
        sinon.spy(dataUtil, 'getAggregationsByDate');

        dataUtil.query(defaultQuery);

        sinon.assert.notCalled(dataUtil.getAggregationsByDate);

        const result = dataUtil.query(createQuery({ aggregationsByDate: 'basals' }));

        sinon.assert.calledOnce(dataUtil.getAggregationsByDate);

        expect(result.data.current.aggregationsByDate.basals).to.be.an('object');
        expect(result.data.next.aggregationsByDate).to.be.undefined;
        expect(result.data.prev.aggregationsByDate).to.be.undefined;
      });

      it('should return the endpoints used for each range in the data', () => {
        const result = dataUtil.query(createQuery({
          endpoints: dayEndpoints,
        }));

        expect(result.data.current.endpoints).to.eql({
          range: [
            moment.utc(dayEndpoints[0]).valueOf(),
            moment.utc(dayEndpoints[1]).valueOf(),
          ],
          days: 1,
          activeDays: 1,
        });

        expect(result.data.next.endpoints).to.eql({
          range: [
            moment.utc(dayEndpoints[1]).valueOf(),
            moment.utc(dayEndpoints[1]).add(1, 'day').valueOf(),
          ],
          days: 1,
          activeDays: 1,
        });

        expect(result.data.prev.endpoints).to.eql({
          range: [
            moment.utc(dayEndpoints[0]).subtract(1, 'day').valueOf(),
            moment.utc(dayEndpoints[0]).valueOf(),
          ],
          days: 1,
          activeDays: 1,
        });
      });

      it('should return the data by requested type for each endpoint range', () => {
        const result = dataUtil.query(createQuery({
          types: {
            cbg: {
              select: 'id,normalTime',
              sort: 'normalTime,asc',
            },
            smbg: {
              select: 'id,normalTime',
              sort: 'normalTime,asc',
            },
          },
        }));

        expect(result.data.current.data.cbg).to.be.an('array').and.have.lengthOf(5);
        expect(result.data.next.data.cbg).to.be.an('array').and.have.lengthOf(0);
        expect(result.data.prev.data.cbg).to.be.an('array').and.have.lengthOf(0);

        expect(result.data.current.data.smbg).to.be.an('array').and.have.lengthOf(3);
        expect(result.data.next.data.smbg).to.be.an('array').and.have.lengthOf(1);
        expect(result.data.prev.data.smbg).to.be.an('array').and.have.lengthOf(1);
      });

      it('should generate fill data for each endpoint range if requested in the query', () => {
        sinon.spy(dataUtil, 'getFillData');

        const fillDataOpts = { adjustForDSTChanges: true };

        const result = dataUtil.query(createQuery({
          fillData: fillDataOpts,
          endpoints: dayEndpoints,
          nextDays: 2,
          prevDays: 2,
        }));

        sinon.assert.calledThrice(dataUtil.getFillData);
        sinon.assert.calledWith(
          dataUtil.getFillData,
          [
            moment.utc(dayEndpoints[0]).valueOf(),
            moment.utc(dayEndpoints[1]).valueOf(),
          ],
          fillDataOpts
        );

        sinon.assert.calledWith(
          dataUtil.getFillData,
          [
            moment.utc(dayEndpoints[1]).valueOf(),
            moment.utc(dayEndpoints[1]).add(2, 'days').valueOf(),
          ],
          fillDataOpts
        );

        sinon.assert.calledWith(
          dataUtil.getFillData,
          [
            moment.utc(dayEndpoints[0]).subtract(2, 'days').valueOf(),
            moment.utc(dayEndpoints[0]).valueOf(),
          ],
          fillDataOpts
        );

        // Expecting 8 3hr fill bins for each day
        expect(result.data.current.data.fill).to.be.an('array').and.have.lengthOf(8);
        expect(result.data.next.data.fill).to.be.an('array').and.have.lengthOf(16);
        expect(result.data.prev.data.fill).to.be.an('array').and.have.lengthOf(16);
      });
    });

    it('should return the time prefs used while generating the data', () => {
      const result = dataUtil.query(createQuery({
        timePrefs: {
          timezoneAware: true,
          timezoneName: 'US/Central',
        },
      }));

      expect(result.timePrefs).to.eql({
        timezoneAware: true,
        timezoneName: 'US/Central',
      });
    });

    it('should return the bg prefs used while generating the data', () => {
      const result = dataUtil.query(createQuery({
        bgPrefs: {
          bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
          bgUnits: MMOLL_UNITS,
        },
      }));

      expect(result.bgPrefs).to.eql({
        bgBounds: DEFAULT_BG_BOUNDS[MMOLL_UNITS],
        bgClasses: {
          'very-low': { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryLowThreshold },
          low: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].targetLowerBound },
          target: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].targetUpperBound },
          high: { boundary: DEFAULT_BG_BOUNDS[MMOLL_UNITS].veryHighThreshold },
        },
        bgUnits: 'mmol/L',
      });
    });

    it('should return metaData if requested in the query', () => {
      sinon.spy(dataUtil, 'getMetaData');

      const metaData = [
        'latestPumpUpload',
        'latestDatumByType',
        'bgSources',
        'devices',
      ];

      const resultWithoutMetaData = dataUtil.query(defaultQuery);

      sinon.assert.notCalled(dataUtil.getMetaData);
      expect(resultWithoutMetaData.metaData).to.be.undefined;

      const resultWithMetaData = dataUtil.query(createQuery({ metaData }));
      sinon.assert.calledWith(dataUtil.getMetaData, metaData);

      expect(resultWithMetaData.metaData).to.be.an('object').and.have.keys(metaData);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
      dataUtil.query(defaultQuery);
      dataUtil.clearFilters();
      dataUtil.clearMatchedDevices();
    });

    it('should generate and return requested stats', () => {
      const result = dataUtil.getStats(['averageGlucose', 'totalInsulin']);

      expect(result.averageGlucose).to.be.an('object').and.include.keys(['averageGlucose']);
      expect(result.totalInsulin).to.be.an('object').and.include.keys(['basal', 'bolus']);
    });

    it('should update matchedDevices metadata if `matchDevices` is true', () => {
      expect(dataUtil.matchedDevices).to.eql({});
      dataUtil.matchDevices = true;
      dataUtil.getStats(['averageGlucose', 'totalInsulin']);

      expect(dataUtil.matchedDevices).to.eql({
        'Dexcom-XXX-XXXX': true,
        'AbbottFreeStyleLibre-XXX-XXXX': true,
        'Test Page Data - 123': true,
      });

      dataUtil.setBgSources('smbg');
      dataUtil.clearFilters();
      dataUtil.clearMatchedDevices();
      dataUtil.getStats(['averageGlucose']);

      expect(dataUtil.matchedDevices).to.eql({
        'OneTouch-XXX-XXXX': true,
      });

      // Should not update if `matchDevices` is false
      dataUtil.clearMatchedDevices();
      dataUtil.matchDevices = false;
      dataUtil.getStats(['averageGlucose', 'totalInsulin']);
      expect(dataUtil.matchedDevices).to.eql({});
    });
  });

  describe('getAggregationsByDate', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
      dataUtil.query({ ...defaultQuery, types: { smbg: {} }, stats: 'averageGlucose, timeInRange' });
      dataUtil.clearFilters();
      dataUtil.clearMatchedDevices();
    });

    it('should generate and return requested aggregations passed in as string', () => {
      const result = dataUtil.getAggregationsByDate('basals, boluses, fingersticks, siteChanges, dataByDate, statsByDate');

      expect(result.basals).to.be.an('object').and.include.keys(['basal', 'automatedSuspend']);
      expect(result.boluses).to.be.an('object').and.include.keys(['summary', 'byDate']);
      expect(result.fingersticks).to.be.an('object').and.include.keys(['smbg', 'calibration']);
      expect(result.siteChanges).to.be.an('object').and.include.keys(['byDate']);
      expect(result.dataByDate['2018-01-31']).to.be.an('object').and.include.keys(['smbg']);
      expect(result.statsByDate['2018-01-31']).to.be.an('object').and.include.keys(['averageGlucose', 'timeInRange']);
    });

    it('should generate and return requested aggregations passed in as array', () => {
      const result = dataUtil.getAggregationsByDate(['basals', 'boluses', 'fingersticks', 'siteChanges', 'dataByDate', 'statsByDate']);

      expect(result.basals).to.be.an('object').and.include.keys(['basal', 'automatedSuspend']);
      expect(result.boluses).to.be.an('object').and.include.keys(['summary', 'byDate']);
      expect(result.fingersticks).to.be.an('object').and.include.keys(['smbg', 'calibration']);
      expect(result.siteChanges).to.be.an('object').and.include.keys(['byDate']);
      expect(result.dataByDate['2018-01-31']).to.be.an('object').and.include.keys(['smbg']);
      expect(result.statsByDate['2018-01-31']).to.be.an('object').and.include.keys(['averageGlucose', 'timeInRange']);
    });

    it('should update matchedDevices metadata if `matchDevices` is true', () => {
      expect(dataUtil.matchedDevices).to.eql({});
      dataUtil.matchDevices = true;
      dataUtil.getAggregationsByDate(['basals']);

      expect(dataUtil.matchedDevices).to.eql({
        'Test Page Data - 123': true,
      });

      dataUtil.clearMatchedDevices();
      dataUtil.getAggregationsByDate(['fingersticks']);

      expect(dataUtil.matchedDevices).to.eql({
        'OneTouch-XXX-XXXX': true,
      });

      dataUtil.clearMatchedDevices();
      dataUtil.getAggregationsByDate(['boluses']);

      expect(dataUtil.matchedDevices).to.eql({
        'Test Page Data - 123': true,
      });

      // Should not update if `matchDevices` is false
      dataUtil.clearMatchedDevices();
      dataUtil.matchDevices = false;
      dataUtil.getAggregationsByDate(['basals']);
      expect(dataUtil.matchedDevices).to.eql({});
    });
  });

  describe('getFillData', () => {
    it('should generate fill data in 3hr bins for the start of the day of provided endpoints in data util timezone, falling back to UTC', () => {
      initDataUtil(defaultData);
      dataUtil.query(defaultQuery);

      const endpoints = _.map(dayEndpoints, Date.parse);
      let result = dataUtil.getFillData(endpoints);

      // Expecting 8 3hr fill bins for each day
      expect(result).to.be.an('array').and.have.lengthOf(8);

      expect(result[0].normalTime).to.equal(endpoints[0]); // GMT-0 for UTC
      expect(result[0].normalEnd).to.equal(moment.utc(endpoints[0]).add(3, 'hours').valueOf()); // GMT-0 for UTC

      delete(dataUtil.timePrefs);
      result = dataUtil.getFillData(endpoints);
      expect(result).to.be.an('array').and.have.lengthOf(8);

      expect(result[0].normalTime).to.equal(endpoints[0]); // fallback to GMT-0 for UTC when not timezone-aware
      expect(result[0].normalEnd).to.equal(moment.utc(endpoints[0]).add(3, 'hours').valueOf()); // GMT-0 for UTC

      dataUtil.timePrefs = { timezoneName: 'US/Eastern' };
      result = dataUtil.getFillData(endpoints);
      expect(result).to.be.an('array').and.have.lengthOf(8);

      expect(result[0].normalTime).to.equal(moment.utc(endpoints[0]).subtract(19, 'hours').valueOf()); // Start of previous day for US/Eastern, plus 5 hrs
      expect(result[0].normalEnd).to.equal(moment.utc(endpoints[0]).subtract(16, 'hours').valueOf()); // Start of previous day for US/Eastern, plus 8 hrs

      dataUtil.timePrefs = { timezoneName: 'Canada/Newfoundland' };
      result = dataUtil.getFillData(endpoints);
      expect(result).to.be.an('array').and.have.lengthOf(8);

      expect(result[0].normalTime).to.equal(moment.utc(endpoints[0]).subtract(20.5, 'hours').valueOf()); // Start of previous day for Canada/Newfoundland, plus 3.5 hrs
      expect(result[0].normalEnd).to.equal(moment.utc(endpoints[0]).subtract(17.5, 'hours').valueOf()); // Start of previous day for Canada/Newfoundland, plus 6.5 hrs

      dataUtil.timePrefs = { timezoneName: 'Asia/Kolkata' };
      result = dataUtil.getFillData(endpoints);
      expect(result).to.be.an('array').and.have.lengthOf(8);

      expect(result[0].normalTime).to.equal(moment.utc(endpoints[0]).subtract(5.5, 'hours').valueOf()); // Start of current day for Asia/Kolkata, plus 5 hrs 30 mins
      expect(result[0].normalEnd).to.equal(moment.utc(endpoints[0]).subtract(2.5, 'hours').valueOf()); // Start of current day for Asia/Kolkata, plus 8 hrs 30 mins
    });

    it('should optionally adjust for spring DST changes', () => {
      const endpoints = [
        '2019-03-10T05:00:00.000Z',
        '2019-03-11T04:00:00.000Z',
      ];

      initDataUtil(defaultData);
      dataUtil.query(createQuery({
        endpoints,
        timePrefs: { timezoneAware: true, timezoneName: 'US/Eastern' },
      }));

      const resultWithoutDSTAdjust = dataUtil.getFillData(dataUtil.endpoints.current.range);

      // Expecting 8 3hr fill bins for each day
      expect(resultWithoutDSTAdjust).to.be.an('array').and.have.lengthOf(8);

      expect(resultWithoutDSTAdjust[0].normalTime).to.equal(moment.utc(endpoints[0]).valueOf());
      expect(resultWithoutDSTAdjust[0].normalEnd).to.equal(moment.utc(endpoints[0]).add(3, 'hours').valueOf()); // End is 1 hour later than start of next fill
      expect(resultWithoutDSTAdjust[1].normalTime).to.equal(moment.utc(endpoints[0]).add(2, 'hours').valueOf());
      expect(resultWithoutDSTAdjust[1].normalEnd).to.equal(moment.utc(endpoints[0]).add(5, 'hours').valueOf());

      const resultWithDSTAdjust = dataUtil.getFillData(endpoints, { adjustForDSTChanges: true });
      expect(resultWithDSTAdjust).to.be.an('array').and.have.lengthOf(8);

      expect(resultWithDSTAdjust[0].normalTime).to.equal(moment.utc(endpoints[0]).valueOf());
      expect(resultWithDSTAdjust[0].normalEnd).to.equal(moment.utc(endpoints[0]).add(2, 'hours').valueOf()); // End is adjusted to align to start of next fill
      expect(resultWithDSTAdjust[1].normalTime).to.equal(moment.utc(endpoints[0]).add(2, 'hours').valueOf());
      expect(resultWithDSTAdjust[1].normalEnd).to.equal(moment.utc(endpoints[0]).add(5, 'hours').valueOf());
    });

    it('should optionally adjust for fall DST changes', () => {
      const endpoints = [
        '2018-11-04T04:00:00.000Z',
        '2018-11-05T05:00:00.000Z',
      ];

      initDataUtil(defaultData);
      dataUtil.query(createQuery({
        endpoints,
        timePrefs: { timezoneAware: true, timezoneName: 'US/Eastern' },
      }));

      const resultWithoutDSTAdjust = dataUtil.getFillData(dataUtil.endpoints.current.range);

      // Expecting 8 3hr fill bins for each day
      expect(resultWithoutDSTAdjust).to.be.an('array').and.have.lengthOf(8);

      expect(resultWithoutDSTAdjust[0].normalTime).to.equal(moment.utc(endpoints[0]).valueOf());
      expect(resultWithoutDSTAdjust[0].normalEnd).to.equal(moment.utc(endpoints[0]).add(3, 'hours').valueOf()); // End is 1 hour earlier than start of next fill
      expect(resultWithoutDSTAdjust[1].normalTime).to.equal(moment.utc(endpoints[0]).add(4, 'hours').valueOf());
      expect(resultWithoutDSTAdjust[1].normalEnd).to.equal(moment.utc(endpoints[0]).add(7, 'hours').valueOf());

      const resultWithDSTAdjust = dataUtil.getFillData(endpoints, { adjustForDSTChanges: true });
      expect(resultWithDSTAdjust).to.be.an('array').and.have.lengthOf(8);

      expect(resultWithDSTAdjust[0].normalTime).to.equal(moment.utc(endpoints[0]).valueOf());
      expect(resultWithDSTAdjust[0].normalEnd).to.equal(moment.utc(endpoints[0]).add(4, 'hours').valueOf()); // End is adjusted to align to start of next fill
      expect(resultWithDSTAdjust[1].normalTime).to.equal(moment.utc(endpoints[0]).add(4, 'hours').valueOf());
      expect(resultWithDSTAdjust[1].normalEnd).to.equal(moment.utc(endpoints[0]).add(7, 'hours').valueOf());
    });
  });

  describe('getMetaData', () => {
    it('should return metaData requested via an array', () => {
      initDataUtil(defaultData);

      const metaData = [
        'bgSources',
        'latestDatumByType',
        'latestPumpUpload',
        'patientId',
        'size',
        'devices',
        'excludedDevices',
        'matchedDevices',
      ];

      const result = dataUtil.getMetaData(metaData);

      expect(result).to.be.an('object').and.have.keys(metaData);
      expect(result.bgSources).to.eql(dataUtil.bgSources);
      expect(result.latestDatumByType.smbg.id).to.equal(dataUtil.latestDatumByType.smbg.id);
      expect(result.latestPumpUpload.settings.id).to.equal(dataUtil.latestPumpUpload.settings.id);
      expect(result.patientId).to.equal(defaultPatientId);
      expect(result.size).to.equal(37);

      expect(result.devices).to.eql([
        { id: 'Test Page Data - 123' },
        { id: 'AbbottFreeStyleLibre-XXX-XXXX' },
        { id: 'Dexcom-XXX-XXXX' },
        { id: 'OneTouch-XXX-XXXX' },
        { bgm: false, cgm: false, id: 'tandemCIQ12345', label: 'Tandem 12345 (Control-IQ)', pump: true, serialNumber: 'sn-0' },
        { id: 'DevId0987654321' },
      ]);

      expect(result.excludedDevices).to.eql([]);
      expect(result.matchedDevices).to.eql({});
    });

    it('should return metaData requested via a string', () => {
      initDataUtil(defaultData);

      const metaData = [
        'bgSources',
        'latestDatumByType',
        'latestPumpUpload',
        'patientId',
        'size',
        'devices',
        'excludedDevices',
      ];

      const result = dataUtil.getMetaData(_.join(metaData, ','));

      expect(result).to.be.an('object').and.have.keys(metaData);
      expect(result.bgSources).to.eql(dataUtil.bgSources);
      expect(result.latestDatumByType.smbg.id).to.equal(dataUtil.latestDatumByType.smbg.id);
      expect(result.latestPumpUpload.settings.id).to.equal(dataUtil.latestPumpUpload.settings.id);
      expect(result.patientId).to.equal(defaultPatientId);
      expect(result.size).to.equal(37);

      expect(result.devices).to.eql([
        { id: 'Test Page Data - 123' },
        { id: 'AbbottFreeStyleLibre-XXX-XXXX' },
        { id: 'Dexcom-XXX-XXXX' },
        { id: 'OneTouch-XXX-XXXX' },
        { bgm: false, cgm: false, id: 'tandemCIQ12345', label: 'Tandem 12345 (Control-IQ)', pump: true, serialNumber: 'sn-0' },
        { id: 'DevId0987654321' },
      ]);

      expect(result.excludedDevices).to.eql([]);
    });

    it('should normalize each datum returned in `latestDatumByType`', () => {
      initDataUtil(defaultData);

      sinon.spy(dataUtil, 'normalizeDatumOut');
      const metaData = [
        'latestDatumByType',
      ];

      const result = dataUtil.getMetaData(metaData);

      expect(result.latestDatumByType).to.be.an('object').and.have.keys([
        'basal',
        'bolus',
        'cbg',
        'deviceEvent',
        'dosingDecision',
        'food',
        'pumpSettings',
        'smbg',
        'upload',
        'wizard',
      ]);

      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: basalData[basalData.length - 1].id }));
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: bolusData[bolusData.length - 1].id }));
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: cbgData[cbgData.length - 1].id }));
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: foodData[foodData.length - 1].id }));
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: pumpSettingsData[pumpSettingsData.length - 1].id }));
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: smbgData[smbgData.length - 1].id }));
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: uploadData[uploadData.length - 1].id }));
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: wizardData[wizardData.length - 1].id }));
    });

    it('should normalize `latestPumpSettings.settings`', () => {
      initDataUtil(defaultData);

      sinon.spy(dataUtil, 'normalizeDatumOut');
      const metaData = [
        'latestPumpUpload',
      ];

      const result = dataUtil.getMetaData(metaData);

      expect(result.latestPumpUpload).to.be.an('object').and.have.keys([
        'deviceModel',
        'isAutomatedBasalDevice',
        'isAutomatedBolusDevice',
        'isSettingsOverrideDevice',
        'manufacturer',
        'settings',
      ]);

      sinon.assert.calledWith(dataUtil.normalizeDatumOut, sinon.match({ id: pumpSettingsData[pumpSettingsData.length - 1].id }));
    });

    it('should return the bgSources data as set in the dataUtil', () => {
      initDataUtil(defaultData);

      const metaData = [
        'bgSources',
      ];

      const result = dataUtil.getMetaData(metaData);

      expect(result.bgSources).to.have.keys([
        'cbg',
        'smbg',
        'current',
      ]);

      expect(result.bgSources).to.eql(dataUtil.bgSources);
    });
  });

  describe('getPreviousSiteChangeDatums', () => {
    const siteChange = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
    const cannulaPrime = { ...siteChange, subType: 'prime', primeTarget: 'cannula', id: generateGUID() };
    const reservoirChange = { ...siteChange, subType: 'reservoirChange', id: generateGUID() };
    const tubingPrime = { ...siteChange, deviceTime: '2018-02-02T01:00:00', time: '2018-02-02T01:00:00.000Z', subType: 'prime', primeTarget: 'tubing', id: generateGUID() };

    beforeEach(() => {
      initDataUtil(_.map([
        cannulaPrime,
        reservoirChange,
        tubingPrime,
      ], _.toPlainObject));

      dataUtil.query(createQuery({
        endpoints: [
          '2018-02-02T00:00:00.000Z',
          '2018-02-03T00:00:00.000Z',
        ],
      }));
    });

    it('should filter for all deviceEvent datums prior to the provided datum, and reset those filters afterwards', () => {
      sinon.spy(dataUtil.filter, 'byActiveDays');
      sinon.spy(dataUtil.filter, 'byEndpoints');
      sinon.spy(dataUtil.filter, 'byType');
      sinon.spy(dataUtil.filter, 'bySubType');

      dataUtil.activeType = 'foo';
      dataUtil.activeSubType = 'bar';
      dataUtil.activeEndpoints = { range: [0, Infinity] };
      dataUtil.activeDays = [0, 1, 2];

      const parsedDatumTime = Date.parse(tubingPrime.time);
      dataUtil.getPreviousSiteChangeDatums({
        ...tubingPrime,
        time: parsedDatumTime,
        deviceTime: parsedDatumTime,
      });

      sinon.assert.calledTwice(dataUtil.filter.byActiveDays);
      sinon.assert.calledTwice(dataUtil.filter.byEndpoints);
      sinon.assert.calledTwice(dataUtil.filter.byType);
      sinon.assert.calledThrice(dataUtil.filter.bySubType);

      expect(dataUtil.filter.byActiveDays.args[0][0]).to.eql([0, 1, 2, 3, 4, 5, 6]);
      expect(dataUtil.filter.byActiveDays.args[1][0]).to.eql([0, 1, 2]);

      expect(dataUtil.filter.byEndpoints.args[0][0]).to.eql([0, parsedDatumTime]);
      expect(dataUtil.filter.byEndpoints.args[1][0]).to.eql([0, Infinity]);

      expect(dataUtil.filter.byType.args[0][0]).to.eql('deviceEvent');
      expect(dataUtil.filter.byType.args[1][0]).to.eql('foo');

      expect(dataUtil.filter.bySubType.args[0][0]).to.eql('prime');
      expect(dataUtil.filter.bySubType.args[1][0]).to.eql('reservoirChange');
      expect(dataUtil.filter.bySubType.args[2][0]).to.eql('bar');
    });

    it('should return a map of previous site datums keyed by type', () => {
      const parsedDatumTime = Date.parse(tubingPrime.time);

      dataUtil.clearFilters();
      const result = dataUtil.getPreviousSiteChangeDatums({
        ...tubingPrime,
        time: parsedDatumTime,
        deviceTime: parsedDatumTime,
      });

      expect(result).to.be.an('object').and.have.keys([
        'cannulaPrime',
        'tubingPrime',
        'reservoirChange',
      ]);

      expect(result.reservoirChange.id).to.equal(reservoirChange.id);
      expect(result.cannulaPrime.id).to.equal(cannulaPrime.id);
      expect(result.tubingPrime).to.be.undefined;
    });
  });

  describe('getTypeData', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
      dataUtil.clearFilters();
      dataUtil.clearMatchedDevices();
    });

    it('should return data for types with field selection and sorts specified by strings', () => {
      const types = [
        {
          type: 'smbg',
          select: 'id,normalTime,value',
          sort: 'normalTime,asc',
        },
        {
          type: 'basal',
          select: 'id,normalTime,rate',
          sort: 'normalTime,asc',
        },
        {
          type: 'bolus',
          select: 'id,normalTime,normal',
          sort: 'normalTime,asc',
        },
      ];

      const result = dataUtil.getTypeData(types);

      expect(result).to.be.an('object').and.have.keys([
        'smbg',
        'basal',
        'bolus',
      ]);
    });

    it('should return data for types with field selection and sorts specified by arrays', () => {
      const types = [
        {
          type: 'smbg',
          select: ['id', 'normalTime', 'value'],
          sort: ['normalTime', 'asc'],
        },
        {
          type: 'basal',
          select: ['id', 'normalTime', 'rate'],
          sort: ['normalTime', 'asc'],
        },
        {
          type: 'bolus',
          select: ['id', 'normalTime', 'normal'],
          sort: ['normalTime', 'asc'],
        },
      ];

      const result = dataUtil.getTypeData(types);

      expect(result).to.be.an('object').and.have.keys([
        'smbg',
        'basal',
        'bolus',
      ]);
    });

    it('should normalize each datum returned', () => {
      sinon.spy(dataUtil, 'normalizeDatumOut');

      const types = [
        {
          type: 'smbg',
          select: 'id,normalTime,value',
          sort: 'normalTime,asc',
        },
      ];

      const result = dataUtil.getTypeData(types);

      assert(smbgData.length === 5);
      expect(result.smbg).to.be.an('array').and.have.lengthOf(5);
      sinon.assert.callCount(dataUtil.normalizeDatumOut, 5);
    });

    it('should return only the requested fields', () => {
      const types = [
        {
          type: 'smbg',
          select: 'id,normalTime,value',
          sort: 'normalTime,asc',
        },
        {
          type: 'basal',
          select: 'id,normalTime,rate',
          sort: 'normalTime,desc',
        },
      ];

      const result = dataUtil.getTypeData(types);

      expect(result.smbg[0]).to.have.keys([
        'id',
        'normalTime',
        'value',
      ]);

      expect(result.basal[0]).to.have.keys([
        'id',
        'normalTime',
        'rate',
      ]);
    });

    it('should sort the results by requested field and sort order', () => {
      const types = [
        {
          type: 'smbg',
          select: 'id,normalTime,value',
          sort: 'normalTime,asc',
        },
        {
          type: 'basal',
          select: 'id,normalTime,rate',
          sort: 'normalTime,desc',
        },
      ];

      const result = dataUtil.getTypeData(types);

      expect(_.first(result.smbg).normalTime < _.last(result.smbg).normalTime).to.be.true;
      expect(_.first(result.basal).normalTime > _.last(result.basal).normalTime).to.be.true;
    });

    it('should update matchedDevices metadata if `matchDevices` is true', () => {
      expect(dataUtil.matchedDevices).to.eql({});
      dataUtil.matchDevices = true;
      dataUtil.setTypes({ bolus: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(dataUtil.matchedDevices).to.eql({
        'Test Page Data - 123': true,
      });

      dataUtil.clearMatchedDevices();
      dataUtil.setTypes({ smbg: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(dataUtil.matchedDevices).to.eql({
        'OneTouch-XXX-XXXX': true,
      });

      dataUtil.clearMatchedDevices();
      dataUtil.setTypes({ basal: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(dataUtil.matchedDevices).to.eql({
        'Test Page Data - 123': true,
      });

      dataUtil.clearMatchedDevices();
      dataUtil.setTypes({ cbg: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(dataUtil.matchedDevices).to.eql({
        'Dexcom-XXX-XXXX': true,
        'AbbottFreeStyleLibre-XXX-XXXX': true,
      });

      // Should not update if `matchDevices` is false
      dataUtil.clearMatchedDevices();
      dataUtil.matchDevices = false;
      dataUtil.setTypes({ bolus: {} });
      dataUtil.getTypeData(dataUtil.types);
      expect(dataUtil.matchedDevices).to.eql({});
    });
  });

  describe('addBasalOverlappingStart', () => {
    /* eslint-disable no-param-reassign */
    const normalizeExpectedDatum = d => {
      d._time = d.time;
      d._deviceTime = d.deviceTime;
      d.time = Date.parse(d.time);
      d.deviceTime = Date.parse(d.deviceTime);
      d.normalTime = d.deviceTime;
      d.normalEnd = d.normalTime + d.duration;
      d.displayOffset = 0;
      d.subType = d.deliveryType;
      d.tags = { suspend: false, temp: false };
      return d;
    };
    /* eslint-enable no-param-reassign */

    beforeEach(() => {
      initDataUtil(defaultData);
      dataUtil.setTimePrefs(defaultTimePrefs);
    });

    context('basal delivery does not overlap start endpoint', () => {
      it('should return the normalized basal data with no datums added', () => {
        const basalDataClone = _.cloneDeep(basalData);

        const expectedNormalizedBasalData = _.map(basalDataClone, normalizeExpectedDatum);

        dataUtil.query(createQuery({
          timePrefs: { timeZoneAware: false },
          endpoints: dayEndpoints,
        }));

        const result = dataUtil.addBasalOverlappingStart(basalDataClone);

        expect(result).to.be.an('array').and.have.lengthOf(3);
        expect(result).to.eql(expectedNormalizedBasalData);
      });
    });

    context('basal delivery overlaps start endpoint', () => {
      it('should add the overlapping basal datum to the beginning of basalData array', () => {
        const basalDataClone = _.cloneDeep(basalData);
        const basalDatumOverlappingStartClone = _.cloneDeep(basalDatumOverlappingStart);

        const expectedNormalizedBasalData = _.map([
          basalDatumOverlappingStart.asObject(),
          ...basalDataClone,
        ], normalizeExpectedDatum);

        dataUtil.addData([basalDatumOverlappingStartClone.asObject()], defaultPatientId);

        dataUtil.query(createQuery({
          timePrefs: { timeZoneAware: false },
          endpoints: dayEndpoints,
        }));

        dataUtil.activeEndpoints = dataUtil.endpoints.current;

        const result = dataUtil.addBasalOverlappingStart(basalDataClone);

        expect(result).to.be.an('array').and.have.lengthOf(4);
        expect(result).to.eql(expectedNormalizedBasalData);
      });
    });
  });

  describe('addPumpSettingsOverrideOverlappingStart', () => {
    /* eslint-disable no-param-reassign */
    const normalizeExpectedDatum = d => {
      d._time = d.time;
      d._deviceTime = d.deviceTime;
      d.time = Date.parse(d.time);
      d.deviceTime = Date.parse(d.deviceTime);
      d.normalTime = d.deviceTime;
      d.normalEnd = d.normalTime + d.duration;
      d.displayOffset = 0;
      d.tags = { automatedSuspend: false, calibration: false, reservoirChange: false, cannulaPrime: false, tubingPrime: false };
      return d;
    };
    /* eslint-enable no-param-reassign */

    beforeEach(() => {
      initDataUtil(defaultData);
      dataUtil.setTimePrefs(defaultTimePrefs);
    });

    context('settings override does not overlap start endpoint', () => {
      it('should return the normalized device event data with no datums added', () => {
        const deviceEventDataClone = _.cloneDeep(deviceEventData);

        const expectedNormalizedDeviceEventData = _.map(deviceEventDataClone, normalizeExpectedDatum);

        dataUtil.query(createQuery({
          timePrefs: { timeZoneAware: false },
          endpoints: dayEndpoints,
        }));

        const result = dataUtil.addPumpSettingsOverrideOverlappingStart(deviceEventDataClone);

        expect(result).to.be.an('array').and.have.lengthOf(3);
        expect(result).to.eql(expectedNormalizedDeviceEventData);
      });
    });

    context('settings override overlaps start endpoint', () => {
      it('should add the overlapping pump settings override datum to the beginning of deviceEventData array', () => {
        const deviceEventDataClone = _.cloneDeep(deviceEventData);
        const settingsOverrideDatumOverlappingStartClone = _.cloneDeep(settingsOverrideDatumOverlappingStart);

        const expectedNormalizedDeviceEventData = _.map([
          settingsOverrideDatumOverlappingStart.asObject(),
          ...deviceEventDataClone,
        ], normalizeExpectedDatum);

        dataUtil.addData([settingsOverrideDatumOverlappingStartClone.asObject()], defaultPatientId);

        dataUtil.query(createQuery({
          timePrefs: { timeZoneAware: false },
          endpoints: dayEndpoints,
        }));

        dataUtil.activeEndpoints = dataUtil.endpoints.current;

        const result = dataUtil.addPumpSettingsOverrideOverlappingStart(deviceEventDataClone);

        expect(result).to.be.an('array').and.have.lengthOf(4);
        expect(result).to.eql(expectedNormalizedDeviceEventData);
      });
    });
  });
});
