import _ from 'lodash';
import moment from 'moment';
import DataUtil from '../../src/utils/DataUtil';

import { types as Types, generateGUID } from '../../data/types';
import {
  MGDL_UNITS,
  MS_IN_HOUR,
  MS_IN_MIN,
  MMOLL_UNITS,
  DEFAULT_BG_BOUNDS,
  DUPLICATE_SMBG_COUNT_THRESHOLD,
  DUPLICATE_SMBG_TIME_TOLERANCE_MS,
} from '../../src/utils/constants';

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
      origin: { name: 'Dexcom G6', version: '2.3.2' },
      value: 190,
      deviceTime: '2018-02-01T00:45:00',
      ...useRawData,
    }),
    new Types.CBG({
      deviceId: 'Dexcom-XXX-XXXX',
      origin: { name: 'Dexcom G6', version: '3.1.0' },
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
      deviceName: 'Tandem CIQ',
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
      deviceName: 'Insulet Dash',
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
      deviceName: 'Medtronic Pumpname',
      uploadId: 'upload-2',
      ...useRawData,
    }),
    new Types.Upload({
      dataSetType: 'continuous',
      deviceTime: '2018-02-03T00:00:00',
      uploadId: 'upload-3',
      client: { name: 'org.tidepool.Loop' },
      deviceName: 'Tidepool Loop DeviceName',
      ...useRawData,
    }),
    new Types.Upload({
      dataSetType: 'continuous',
      deviceTime: '2018-02-04T00:00:00',
      uploadId: 'upload-4',
      client: { name: 'com.loopkit.Loop' },
      deviceName: 'Tidepool Loop DeviceName',
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

    it('should define the default cgm sample interval', () => {
      expect(dataUtil.defaultCgmSampleInterval).to.equal(MS_IN_MIN * 5);
    });

    it('should define the default cgm sample interval range', () => {
      expect(dataUtil.defaultCgmSampleIntervalRange).to.eql([MS_IN_MIN * 5, Infinity]);
    });

    it('should set the active cgm sample interval range to the default range', () => {
      expect(dataUtil.cgmSampleIntervalRange).to.eql([MS_IN_MIN * 5, Infinity]);
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

    it('should create and/or update the `loopDataSetsByIdMap`', () => {
      delete dataUtil.loopDataSetsByIdMap;
      expect(dataUtil.loopDataSetsByIdMap).to.be.undefined;

      dataUtil.addData(defaultData, defaultPatientId);

      expect(dataUtil.loopDataSetsByIdMap).to.be.an('object').and.have.keys([
        uploadData[3].id,
        uploadData[4].id,
      ]);

      const newUpload = new Types.Upload({ ...useRawData, dataSetType: 'continuous', client: { name: 'com.loopkit.Loop' } });
      dataUtil.addData([newUpload], defaultPatientId);

      expect(dataUtil.loopDataSetsByIdMap).to.be.an('object').and.have.keys([
        uploadData[3].id,
        uploadData[4].id,
        newUpload.id,
      ]);

      expect(dataUtil.loopDataSetsByIdMap[newUpload.id].id).to.equal(newUpload.id);
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
        'latestTimeZone',
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

      it('should add a loop datum to `loopDataSetsByIdMap`', () => {
        const loopUpload = { ...new Types.Upload({ dataSetType: 'continuous', client: { name: 'org.tidepool.Loop' }, ...useRawData }), id: 'foo' };
        expect(dataUtil.loopDataSetsByIdMap[loopUpload.id]).to.be.undefined;
        dataUtil.normalizeDatumIn(loopUpload);
        expect(dataUtil.loopDataSetsByIdMap[loopUpload.id]).to.be.an('object').and.have.property('id', loopUpload.id);
      });

      it('should add a dexcom datum to `dexcomDataSetsByIdMap`', () => {
        const dexcomUpload = { ...new Types.Upload({ dataSetType: 'continuous', client: { name: 'org.tidepool.oauth.dexcom.fetch' }, ...useRawData }), id: 'foo' };
        expect(dataUtil.dexcomDataSetsByIdMap[dexcomUpload.id]).to.be.undefined;
        dataUtil.normalizeDatumIn(dexcomUpload);
        expect(dataUtil.dexcomDataSetsByIdMap[dexcomUpload.id]).to.be.an('object').and.have.property('id', dexcomUpload.id);
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

    context('cbg', () => {
      it('should set the CGM sampleIntval in milliseconds from datums that do not have it', () => {
        const dexcomDatum = {
          type: 'cbg',
          deviceId: 'Dexcom_XXXXXXX',
        };
        dataUtil.normalizeDatumIn(dexcomDatum);
        expect(dexcomDatum.sampleInterval).to.equal(5 * MS_IN_MIN);

        const libreDatum = {
          type: 'cbg',
          deviceId: 'AbbottFreeStyleLibre_XXXXXXX',
        };
        dataUtil.normalizeDatumIn(libreDatum);
        expect(libreDatum.sampleInterval).to.equal(15 * MS_IN_MIN);

        const libreViewAPIDatum = {
          type: 'cbg',
          deviceId: 'AbbottFreeStyleLibre_XXXXXXX',
          origin: { name: 'org.tidepool.abbott.libreview.partner.api' },
        };
        dataUtil.normalizeDatumIn(libreViewAPIDatum);
        expect(libreViewAPIDatum.sampleInterval).to.equal(5 * MS_IN_MIN);
        expect(libreViewAPIDatum.annotations[0]).to.eql({ code: 'cbg/unknown-sample-interval' });

        const libre3Datum = {
          type: 'cbg',
          deviceId: 'AbbottFreeStyleLibre3_XXXXXXX',
        };
        dataUtil.normalizeDatumIn(libre3Datum);
        expect(libre3Datum.sampleInterval).to.equal(5 * MS_IN_MIN);

        const libre2CIQDatum = {
          type: 'cbg',
          sampleInterval: MS_IN_MIN,
        };
        dataUtil.normalizeDatumIn(libre2CIQDatum);
        expect(libre2CIQDatum.sampleInterval).to.equal(MS_IN_MIN); // unchanged, since it was already set

        const g7CIQDatum = {
          type: 'cbg',
          deviceId: 'tandemCIQ_XXXXX',
          payload: { g7: true },
        };
        dataUtil.normalizeDatumIn(g7CIQDatum);
        expect(g7CIQDatum.sampleInterval).to.equal(5 * MS_IN_MIN);

        const g6CIQDatum = {
          type: 'cbg',
          deviceId: 'tandemCIQ_XXXXX',
          payload: { g6: true },
        };
        dataUtil.normalizeDatumIn(g6CIQDatum);
        expect(g6CIQDatum.sampleInterval).to.equal(5 * MS_IN_MIN);
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
      it('should convert requestedBolus.amount to requestedBolus.normal and remove amount', () => {
        const datum = {
          type: 'dosingDecision',
          requestedBolus: { amount: 3.5 },
        };

        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.requestedBolus.normal).to.equal(3.5);
        expect(datum.requestedBolus).to.not.have.property('amount');
      });

      it('should convert recommendedBolus.normal and recommendedBolus.extended to recommendedBolus.amount and remove normal, extended, duration', () => {
        const datum = {
          type: 'dosingDecision',
          recommendedBolus: { normal: 2, extended: 1, duration: 60000 },
        };

        dataUtil.validateDatumIn = sinon.stub().returns(true);
        dataUtil.normalizeDatumIn(datum);
        expect(datum.recommendedBolus.amount).to.equal(3);
        expect(datum.recommendedBolus).to.not.have.property('normal');
        expect(datum.recommendedBolus).to.not.have.property('extended');
        expect(datum.recommendedBolus).to.not.have.property('duration');
      });

      it('should add the datum to the `bolusDosingDecisionDatumsByIdMap`', () => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);

        const acceptableReasons = ['normalBolus', 'simpleBolus', 'watchBolus', 'oneButtonBolus'];
        const dosingDecisionReasons = ['loop', 'normalBolus', 'simpleBolus', 'watchBolus', 'oneButtonBolus'];
        _.each(dosingDecisionReasons, (reason, index) => {
          dataUtil.normalizeDatumIn({ type: 'dosingDecision', id: `ID${index}`, reason });
        });

        // the 'loop' reason datum should not be added
        expect(_.keys(dataUtil.bolusDosingDecisionDatumsByIdMap)).to.have.lengthOf(4);
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap.ID1.reason).to.eql(acceptableReasons[0]);
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap.ID2.reason).to.eql(acceptableReasons[1]);
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap.ID3.reason).to.eql(acceptableReasons[2]);
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap.ID4.reason).to.eql(acceptableReasons[3]);
      });
    });

    context('dosingDecision normalization', () => {
      const dosingDecisionBuilder = (requestedBolus, recommendedBolus) => ({
        type: 'dosingDecision',
        requestedBolus,
        recommendedBolus,
      });

      beforeEach(() => {
        dataUtil.validateDatumIn = sinon.stub().returns(true);
      });

      it('should move `requestedBolus.amount` to `requestedBolus.normal` if `normal` is not present', () => {
        const dosingDecision = dosingDecisionBuilder({ amount: 5 });
        dataUtil.normalizeDatumIn(dosingDecision);
        expect(dosingDecision.requestedBolus.normal).to.equal(5);
        expect(dosingDecision.requestedBolus.amount).to.be.undefined;
      });

      it('should not overwrite an existing `requestedBolus.normal` value', () => {
        const dosingDecision = dosingDecisionBuilder({ amount: 5, normal: 2 });
        dataUtil.normalizeDatumIn(dosingDecision);
        expect(dosingDecision.requestedBolus.normal).to.equal(2);
        expect(dosingDecision.requestedBolus.amount).to.equal(5);
      });

      it('should create `recommendedBolus.amount` from `normal` and `extended` if not present', () => {
        const dosingDecision = dosingDecisionBuilder(undefined, { normal: 2, extended: 3 });
        dataUtil.normalizeDatumIn(dosingDecision);
        expect(dosingDecision.recommendedBolus.amount).to.equal(5);
        expect(dosingDecision.recommendedBolus.normal).to.be.undefined;
        expect(dosingDecision.recommendedBolus.extended).to.be.undefined;
      });

      it('should create `recommendedBolus.amount` from `normal` if `extended` is not present', () => {
        const dosingDecision = dosingDecisionBuilder(undefined, { normal: 2 });
        dataUtil.normalizeDatumIn(dosingDecision);
        expect(dosingDecision.recommendedBolus.amount).to.equal(2);
        expect(dosingDecision.recommendedBolus.normal).to.be.undefined;
        expect(dosingDecision.recommendedBolus.extended).to.be.undefined;
      });

      it('should create `recommendedBolus.amount` from `extended` if `normal` is not present', () => {
        const dosingDecision = dosingDecisionBuilder(undefined, { extended: 3 });
        dataUtil.normalizeDatumIn(dosingDecision);
        expect(dosingDecision.recommendedBolus.amount).to.equal(3);
        expect(dosingDecision.recommendedBolus.normal).to.be.undefined;
        expect(dosingDecision.recommendedBolus.extended).to.be.undefined;
      });

      it('should handle `0` values when creating `recommendedBolus.amount`', () => {
        const dosingDecision = dosingDecisionBuilder(undefined, { normal: 0, extended: 0 });
        dataUtil.normalizeDatumIn(dosingDecision);
        expect(dosingDecision.recommendedBolus.amount).to.equal(0);
        expect(dosingDecision.recommendedBolus.normal).to.be.undefined;
        expect(dosingDecision.recommendedBolus.extended).to.be.undefined;
      });

      it('should not overwrite an existing `recommendedBolus.amount` value', () => {
        const dosingDecision = dosingDecisionBuilder(undefined, { amount: 5, normal: 3, extended: 4 });
        dataUtil.normalizeDatumIn(dosingDecision);
        expect(dosingDecision.recommendedBolus.amount).to.equal(5);
        expect(dosingDecision.recommendedBolus.normal).to.equal(3);
        expect(dosingDecision.recommendedBolus.extended).to.equal(4);
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
    it('should join loop dosing decisions, and associated pump settings, to boluses that are definitively associated by ID', () => {
      const uploadId = 'upload1';
      const upload = { type: 'upload', id: uploadId, dataSetType: 'continuous', uploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), client: { name: 'org.tidepool.Loop' } };
      const bolus = { type: 'bolus', id: 'bolus1', uploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), origin: { name: 'org.tidepool.Loop' } };
      const bolus2 = { type: 'bolus', id: 'bolus2', uploadId, time: Date.parse('2024-02-02T11:05:59.000Z'), origin: { name: 'org.tidepool.Loop' } };
      const pumpSettings = { ...loopMultirate, id: 'pumpSettings1' };

      const dosingDecision = {
        type: 'dosingDecision',
        id: 'dosingDecision1',
        time: Date.parse('2024-02-02T10:05:00.000Z'),
        origin: { name: 'org.tidepool.Loop' },
        associations: [
          { reason: 'bolus', id: 'bolus2' },
          { reason: 'pumpSettings', id: 'pumpSettings1' },
        ],
        requestedBolus: { normal: 12 },
        insulinOnBoard: { amount: 4 },
        food: { nutrition: { carbohydrate: { net: 30 } } },
        bgHistorical: [
          { value: 100 },
          { value: 110 },
        ],
      };

      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dosingDecision };
      dataUtil.pumpSettingsDatumsByIdMap = { pumpSettings1: pumpSettings };
      dataUtil.loopDataSetsByIdMap = { [uploadId]: upload };

      _.each([bolus, bolus2], dataUtil.joinBolusAndDosingDecision);
      // should not attach dosing decision to bolus that is not associated
      expect(bolus.dosingDecision).to.be.undefined;

      // should attach associated pump settings to dosingDecisions
      expect(bolus2.dosingDecision).to.eql(dosingDecision);
      expect(bolus2.dosingDecision.pumpSettings).to.eql(pumpSettings);

      // should translate relevant dosing decision data onto expected bolus fields
      expect(bolus2.expectedNormal).to.equal(12);
      expect(bolus2.carbInput).to.equal(30);
      expect(bolus2.bgInput).to.equal(110);
      expect(bolus2.insulinOnBoard).to.equal(4);
    });

    it('should join loop dosing decisions, and associated pump settings, to boluses that are within a minute of each other if not definitive associations exist', () => {
      const uploadId = 'upload1';
      const upload = { type: 'upload', id: uploadId, dataSetType: 'continuous', uploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), client: { name: 'org.tidepool.Loop' } };
      const bolus = { type: 'bolus', id: 'bolus1', uploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), origin: { name: 'org.tidepool.Loop' } };
      const pumpSettings = { ...loopMultirate, id: 'pumpSettings1' };

      const dosingDecision = {
        type: 'dosingDecision',
        id: 'dosingDecision1',
        time: Date.parse('2024-02-02T10:05:00.000Z'),
        origin: { name: 'org.tidepool.Loop' },
        associations: [{ reason: 'pumpSettings', id: 'pumpSettings1' }],
        requestedBolus: { normal: 12 },
        insulinOnBoard: { amount: 4 },
        food: { nutrition: { carbohydrate: { net: 30 } } },
        smbg: { value: 140 }, // When present, smbg should be used instead of last bgHistorical
        bgHistorical: [
          { value: 100 },
          { value: 110 },
        ],
      };

      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dosingDecision };
      dataUtil.pumpSettingsDatumsByIdMap = { pumpSettings1: pumpSettings };
      dataUtil.loopDataSetsByIdMap = { [uploadId]: upload };

      dataUtil.joinBolusAndDosingDecision(bolus);
      // should attach associated pump settings to dosingDecisions
      expect(bolus.dosingDecision).to.eql(dosingDecision);
      expect(bolus.dosingDecision.pumpSettings).to.eql(pumpSettings);

      // should translate relevant dosing decision data onto expected bolus fields
      expect(bolus.expectedNormal).to.equal(12);
      expect(bolus.carbInput).to.equal(30);
      expect(bolus.bgInput).to.equal(140);
      expect(bolus.insulinOnBoard).to.equal(4);
    });

    it('should not add expectedNormal to joined loop dosing decisions if the requested normal is equal to the bolus normal', () => {
      const uploadId = 'upload1';
      const upload = { type: 'upload', id: uploadId, dataSetType: 'continuous', uploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), client: { name: 'org.tidepool.Loop' } };
      const bolus = { type: 'bolus', id: 'bolus1', uploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), origin: { name: 'org.tidepool.Loop' }, normal: 12 };
      const pumpSettings = { ...loopMultirate, id: 'pumpSettings1' };

      const dosingDecision = {
        type: 'dosingDecision',
        id: 'dosingDecision1',
        time: Date.parse('2024-02-02T10:05:00.000Z'),
        origin: { name: 'org.tidepool.Loop' },
        associations: [{ reason: 'pumpSettings', id: 'pumpSettings1' }],
        requestedBolus: { normal: 12 },
        insulinOnBoard: { amount: 4 },
        food: { nutrition: { carbohydrate: { net: 30 } } },
        bgHistorical: [
          { value: 100 },
          { value: 110 },
        ],
      };

      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dosingDecision };
      dataUtil.pumpSettingsDatumsByIdMap = { pumpSettings1: pumpSettings };
      dataUtil.loopDataSetsByIdMap = { [uploadId]: upload };

      dataUtil.joinBolusAndDosingDecision(bolus);
      expect(bolus.dosingDecision).to.eql(dosingDecision);

      // should not add the bolus.expectedNormal field since the requested normal is equal to the bolus normal
      expect(bolus.expectedNormal).to.be.undefined;
    });

    it('should not join loop dosing decisions to boluses that are outside of a minute of each other', () => {
      const dosingDecision = { type: 'dosingDecision', id: 'dosingDecision1', time: Date.parse('2024-02-02T10:05:00.000Z'), origin: { name: 'org.tidepool.Loop' } };
      const bolus = { type: 'bolus', id: 'bolus1', time: Date.parse('2024-02-02T10:06:01.000Z'), origin: { name: 'org.tidepool.Loop' } };
      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dosingDecision };
      dataUtil.bolusDatumsByIdMap = { bolus1: bolus };

      dataUtil.joinBolusAndDosingDecision(bolus);
      expect(bolus.dosingDecision).to.be.undefined;
    });

    it('should use originalFood.nutrition.carbohydrate.net when present, and fall back to food.nutrition.carbohydrate.net otherwise, preserving the original carbs associated with the bolus', () => {
      const bolus = {
        type: 'bolus',
        id: 'bolus1',
        uploadId: 'upload1',
        time: Date.parse('2024-02-02T10:05:59.000Z'),
        origin: { name: 'org.tidepool.Loop' },
      };

      const base = {
        type: 'dosingDecision',
        id: 'dosingDecision1',
        time: Date.parse('2024-02-02T10:05:00.000Z'),
        origin: { name: 'org.tidepool.Loop' },
        associations: [],
        requestedBolus: { normal: 12 },
        food: { nutrition: { carbohydrate: { net: 30 } } },
      };

      dataUtil.loopDataSetsByIdMap = {
        upload1: { client: { name: 'org.tidepool.Loop' } },
      };

      // originalFood = 42 → overrides food
      const dd1 = { ...base, originalFood: { nutrition: { carbohydrate: { net: 42 } } } };
      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dd1 };
      dataUtil.joinBolusAndDosingDecision(bolus);
      expect(bolus.carbInput).to.equal(42);
      expect(bolus.carbInputGeneratedFromFoodData).to.be.true;

      // originalFood = null → falls back to food
      const dd2 = { ...base, originalFood: null };
      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dd2 };
      dataUtil.joinBolusAndDosingDecision(bolus);
      expect(bolus.carbInput).to.equal(30);
      expect(bolus.carbInputGeneratedFromFoodData).to.be.true;

      // originalFood = 0 → explicit zero honored
      const dd3 = { ...base, originalFood: { nutrition: { carbohydrate: { net: 0 } } } };
      dataUtil.bolusDosingDecisionDatumsByIdMap = { dosingDecision1: dd3 };
      dataUtil.joinBolusAndDosingDecision(bolus);
      expect(bolus.carbInput).to.equal(0);
      expect(bolus.carbInputGeneratedFromFoodData).to.be.true;
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

      it('should tag a loop bolus with `loop`', () => {
        const loopUploadId = 'upload1';
        const loopUpload = { type: 'upload', id: loopUploadId, dataSetType: 'continuous', uploadId: loopUploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), client: { name: 'org.tidepool.Loop' } };
        dataUtil.loopDataSetsByIdMap = { [loopUploadId]: loopUpload };
        const loopBolus = { ...bolus, deviceTime: '2018-02-02T01:00:00', uploadId: loopUploadId };

        expect(loopBolus.tags).to.be.undefined;
        dataUtil.tagDatum(loopBolus);
        expect(loopBolus.tags.loop).to.be.true;
      });
    });

    context('insulin', () => {
      const insulin = new Types.Insulin({ deviceTime: '2018-02-01T01:00:00', ...useRawData });

      it('should tag an insulin datum with `manual`', () => {
        expect(insulin.tags).to.be.undefined;
        dataUtil.tagDatum(insulin);
        expect(insulin.tags.manual).to.be.true;
      });
    });

    context('wizard', () => {
      const wizard = new Types.Wizard({ deviceTime: '2018-02-01T01:00:00', carbInput: 10, ...useRawData });
      const extendedWizard = { ...wizard, bolus: { extended: 1, duration: 1 } };
      const interruptedWizard = { ...wizard, bolus: { normal: 1, expectedNormal: 2 } };
      const overrideWizard = { ...wizard, bolus: { normal: 2, recommended: { net: 1 } } };
      const underrideWizard = { ...wizard, bolus: { normal: 1 }, recommended: { net: 2 } };

      beforeEach(() => {
        dataUtil.loopDataSetsByIdMap = { 'upload-3': { id: 'upload-3' } };
      });

      it('should tag an extended wizard with `extended`', () => {
        expect(extendedWizard.tags).to.be.undefined;
        dataUtil.tagDatum(extendedWizard);
        expect(extendedWizard.tags.extended).to.be.true;
      });

      it('should tag an interrupted wizard with `interrupted`', () => {
        expect(interruptedWizard.tags).to.be.undefined;
        dataUtil.tagDatum(interruptedWizard);
        expect(interruptedWizard.tags.interrupted).to.be.true;
      });

      it('should tag an override wizard with `override`', () => {
        expect(overrideWizard.tags).to.be.undefined;
        dataUtil.tagDatum(overrideWizard);
        expect(overrideWizard.tags.override).to.be.true;
      });

      it('should tag an underride wizard with `underride`', () => {
        expect(underrideWizard.tags).to.be.undefined;
        dataUtil.tagDatum(underrideWizard);
        expect(underrideWizard.tags.underride).to.be.true;
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

      it('should tag a dexcom smbg with `manual`', () => {
        const dexcomUploadId = 'upload1';
        const dexcomUpload = { type: 'upload', id: dexcomUploadId, dataSetType: 'continuous', uploadId: dexcomUploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), client: { name: 'org.tidepool.oauth.dexcom.fetch' } };
        dataUtil.dexcomDataSetsByIdMap = { [dexcomUploadId]: dexcomUpload };
        const dexcomSMBG = new Types.SMBG({ deviceTime: '2018-02-01T01:00:00', uploadId: dexcomUploadId, ...useRawData });

        expect(dexcomSMBG.tags).to.be.undefined;
        dataUtil.tagDatum(dexcomSMBG);
        expect(dexcomSMBG.tags.manual).to.be.true;
        expect(dexcomSMBG.tags.meter).to.be.false;
      });

      it('should tag a meter smbg with `meter`', () => {
        expect(meterSMBG.tags).to.be.undefined;
        dataUtil.tagDatum(meterSMBG);
        expect(meterSMBG.tags.manual).to.be.false;
        expect(meterSMBG.tags.meter).to.be.true;
      });
    });

    context('food', () => {
      it('should tag a loop food datum with `loop`', () => {
        const loopUploadId = 'upload1';
        const loopUpload = { type: 'upload', id: loopUploadId, dataSetType: 'continuous', uploadId: loopUploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), client: { name: 'org.tidepool.Loop' } };
        dataUtil.loopDataSetsByIdMap = { [loopUploadId]: loopUpload };
        const loopFood = new Types.Food({ deviceTime: '2018-02-01T01:00:00', uploadId: loopUploadId, ...useRawData });

        expect(loopFood.tags).to.be.undefined;
        dataUtil.tagDatum(loopFood);
        expect(loopFood.tags.loop).to.be.true;
      });

      it('should tag a dexcom food datum with `dexcom` and `manual`', () => {
        const dexcomUploadId = 'upload1';
        const dexcomUpload = { type: 'upload', id: dexcomUploadId, dataSetType: 'continuous', uploadId: dexcomUploadId, time: Date.parse('2024-02-02T10:05:59.000Z'), client: { name: 'org.tidepool.oauth.dexcom.fetch' } };
        dataUtil.dexcomDataSetsByIdMap = { [dexcomUploadId]: dexcomUpload };
        const dexcomFood = new Types.Food({ deviceTime: '2018-02-01T01:00:00', uploadId: dexcomUploadId, ...useRawData });

        expect(dexcomFood.tags).to.be.undefined;
        dataUtil.tagDatum(dexcomFood);
        expect(dexcomFood.tags.dexcom).to.be.true;
        expect(dexcomFood.tags.manual).to.be.true;
      });
    });

    context('deviceEvent', () => {
      const calibration = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', subType: 'calibration', ...useRawData });

      const siteChange = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
      const cannulaPrime = { ...siteChange, subType: 'prime', primeTarget: 'cannula' };
      const reservoirChange = { ...siteChange, subType: 'reservoirChange' };
      const tubingPrime = { ...siteChange, deviceTime: '2018-02-02T01:00:00', subType: 'prime', primeTarget: 'tubing' };

      const alarm = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', subType: 'alarm', ...useRawData });
      const twiistOrigin = { origin: { name: 'com.dekaresearch.twiist' } };
      const alarmNoInsulin = { ...alarm, alarmType: 'no_insulin', ...twiistOrigin };
      const alarmNo_power = { ...alarm, alarmType: 'no_power', ...twiistOrigin };
      const alarmOcclusion = { ...alarm, alarmType: 'occlusion', ...twiistOrigin };
      const nonTwiistAlarmOcclusion = { ...alarmOcclusion, origin: { name: 'non-twiist' } };
      const alarmTypeUnrecognized = { ...alarm, alarmType: 'foo', ...twiistOrigin };

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

      it('should tag a twiist alarm with alarmType of `no_insulin`', () => {
        expect(alarmNoInsulin.tags).to.be.undefined;
        dataUtil.tagDatum(alarmNoInsulin);
        expect(alarmNoInsulin.tags.alarm).to.equal(true);
        expect(alarmNoInsulin.tags.no_insulin).to.equal(true);
      });

      it('should tag a twiist alarm with alarmType of `no_power`', () => {
        expect(alarmNo_power.tags).to.be.undefined;
        dataUtil.tagDatum(alarmNo_power);
        expect(alarmNo_power.tags.alarm).to.equal(true);
        expect(alarmNo_power.tags.no_power).to.equal(true);
      });

      it('should tag a twiist alarm with alarmType of `occlusion`', () => {
        expect(alarmOcclusion.tags).to.be.undefined;
        dataUtil.tagDatum(alarmOcclusion);
        expect(alarmOcclusion.tags.alarm).to.equal(true);
        expect(alarmOcclusion.tags.occlusion).to.equal(true);
      });

      it('should not tag a non-twiist alarm with alarmType of `occlusion`', () => {
        expect(nonTwiistAlarmOcclusion.tags).to.be.undefined;
        dataUtil.tagDatum(nonTwiistAlarmOcclusion);
        expect(nonTwiistAlarmOcclusion.tags.alarm).to.be.undefined;
        expect(nonTwiistAlarmOcclusion.tags.occlusion).to.be.undefined;
      });

      it('should tag a twiist alarm with an unrecognized alarmType as false', () => {
        expect(alarmTypeUnrecognized.tags).to.be.undefined;
        dataUtil.tagDatum(alarmTypeUnrecognized);
        expect(alarmTypeUnrecognized.tags.alarm).to.equal(false);
      });
    });

    context('events', () => {
      it('should tag a ControlIQ datum with a pump-shutdown event', () => {
        const controlIQDatum = { deviceId: 'tandemCIQ12345', annotations: [{ code: 'pump-shutdown' }] };
        expect(controlIQDatum.tags).to.be.undefined;
        dataUtil.tagDatum(controlIQDatum);
        expect(controlIQDatum.tags.event).to.equal('pump_shutdown');
      });

      it('should not tag a ControlIQ datum with a non-recognized event', () => {
        const controlIQDatum = { deviceId: 'tandemCIQ12345', annotations: [{ code: 'non-recognized' }] };
        expect(controlIQDatum.tags).to.be.undefined;
        dataUtil.tagDatum(controlIQDatum);
        expect(controlIQDatum.tags?.event).to.be.undefined;
      });

      it('should tag a physicalActivity event', () => {
        const event = { type: 'physicalActivity' };
        expect(event.tags).to.be.undefined;
        dataUtil.tagDatum(event);
        expect(event.tags.event).to.equal('physical_activity');
      });

      it('should tag a health event', () => {
        const event = { type: 'reportedState', states: [{ state: 'alcohol' }] };
        expect(event.tags).to.be.undefined;
        dataUtil.tagDatum(event);
        expect(event.tags.event).to.equal('health');
      });

      it('should tag a notes event with a stateOther state property', () => {
        const event = { type: 'reportedState', states: [{ stateOther: 'something' }] };
        expect(event.tags).to.be.undefined;
        dataUtil.tagDatum(event);
        expect(event.tags.event).to.equal('notes');
      });

      it('should tag a notes event with a notes property', () => {
        const event = { type: 'reportedState', notes: ['something'] };
        expect(event.tags).to.be.undefined;
        dataUtil.tagDatum(event);
        expect(event.tags.event).to.equal('notes');
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

    it('should call setDataAnnotations with the datum', () => {
      const datum = { type: 'foo' };
      sinon.stub(dataUtil, 'setDataAnnotations');
      dataUtil.normalizeDatumOut(datum);
      sinon.assert.calledWith(dataUtil.setDataAnnotations, datum);
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
          ['target', 'range', 'low', 'high']
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

      it('should call `normalizeDatumBgUnits` on bgHistorical field objects', () => {
        sinon.spy(dataUtil, 'normalizeDatumBgUnits');
        const datum = { type: 'dosingDecision' };
        dataUtil.normalizeDatumOut(datum);
        sinon.assert.calledWithMatch(dataUtil.normalizeDatumBgUnits, datum, ['bgHistorical'], ['value']);
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

    it('should convert any matching numeric fields in unknown nested object properties within specified path', () => {
      const datum = {
        specified: {
          nested1: { myField1: 10, myField2: 1, myField3: 1 },
        },
        unspecified: {
          nested1: { myField1: 10, myField2: 1, myField3: 1 },
        },
      };

      dataUtil.normalizeDatumBgUnits(datum, ['specified'], ['myField1', 'myField2']);
      expect(datum.specified.nested1.myField1).to.equal(180.1559);
      expect(datum.specified.nested1.myField2).to.equal(18.01559);
      expect(datum.specified.nested1.myField3).to.equal(1); // wasn't a matched field, so unchanged
      expect(datum.unspecified.nested1.myField1).to.equal(10);// wasn't a specified path, so unchanged
    });

    it('should not convert units for nested objects with no matching fields when there are no specified paths', () => {
      const datum = {
        unspecified: { units: 'minutes', value: 10 },
      };

      dataUtil.normalizeDatumBgUnits(datum, [], ['otherField']);
      expect(datum.unspecified.units).to.equal('minutes');
      expect(datum.unspecified.value).to.equal(10);
    });

    it('should not convert units for nested objects with matching fields when there are no specified paths', () => {
      const datum = {
        unspecified: { units: 'minutes', value: 10 },
      };

      dataUtil.normalizeDatumBgUnits(datum, [], ['value']);
      expect(datum.unspecified.units).to.equal('minutes');
      expect(datum.unspecified.value).to.equal(10);
    });

    it('should convert any matching numeric fields in unknown nested object properties containing object arrays within specified path', () => {
      const datum = {
        specified: {
          nested1: [
            { myField1: 10, myField2: 1, myField3: 100 },
            { myField1: 1, myField2: 10, myField3: 200 },
          ],
        },
        unspecified: {
          nested1: [
            { myField1: 10, myField2: 1, myField3: 100 },
            { myField1: 1, myField2: 10, myField3: 200 },
          ],
        },
      };

      dataUtil.normalizeDatumBgUnits(datum, ['specified'], ['myField1', 'myField2']);
      expect(datum.specified.nested1[0].myField1).to.equal(180.1559);
      expect(datum.specified.nested1[0].myField2).to.equal(18.01559);
      expect(datum.specified.nested1[0].myField3).to.equal(100); // wasn't a matched field, so unchanged
      expect(datum.unspecified.nested1[0].myField1).to.equal(10); // wasn't a specified path, so unchanged

      expect(datum.specified.nested1[1].myField1).to.equal(18.01559);
      expect(datum.specified.nested1[1].myField2).to.equal(180.1559);
      expect(datum.specified.nested1[1].myField3).to.equal(200); // wasn't a matched field, so unchanged
      expect(datum.unspecified.nested1[1].myField1).to.equal(1); // wasn't a specified path, so unchanged
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

  describe('getDeduplicatedCBGData', () => {
    it('sorts and deduplicates CBG data according to timestamp', () => {
      const data = _.cloneDeep(cbgData);
      const duplicatedData = _.shuffle(_.cloneDeep([...data, ...data, ...data]));

      _.each(duplicatedData, dataUtil.normalizeDatumIn); // mimic data ingestion
      expect(duplicatedData.length).to.equal(15);

      const result = dataUtil.getDeduplicatedCBGData(duplicatedData);

      expect(result.length).to.equal(5);
      expect(result[0].time).to.equal(1517443200000);
      expect(result[2].time).to.equal(1517445000000);
      expect(result[4].time).to.equal(1517446200000);
    });

    it('DOES deduplicate datums when next datum occurs before 10 second blackout window', () => {
      const datum1 = _.cloneDeep(cbgData[0]);
      const datum2 = _.cloneDeep(cbgData[0]);
      const data = [datum1, datum2]; // two copies of same datum

      _.each(data, dataUtil.normalizeDatumIn); // mimic data ingestion

      expect(data[0].sampleInterval).to.equal(300_000);
      expect(data[1].sampleInterval).to.equal(300_000);

      // Second datum occurs 12 sec before it is expected to (based on 5 min sample interval)
      data[0].time = 1_517_445_000_000;
      data[1].time = 1_517_445_000_000 + 300_000 - 12_000;

      const result = dataUtil.getDeduplicatedCBGData(data);

      expect(result.length).to.equal(1); // should deduplicate
    });

    it('DOES NOT deduplicates datums when next datum is within 10 second blackout window', () => {
      const datum1 = _.cloneDeep(cbgData[0]);
      const datum2 = _.cloneDeep(cbgData[0]);
      const data = [datum1, datum2]; // two copies of same datum

      _.each(data, dataUtil.normalizeDatumIn); // mimic data ingestion

      expect(data[0].sampleInterval).to.equal(300_000);
      expect(data[1].sampleInterval).to.equal(300_000);

      // Second datum occurs 7 sec before it is expected to (based on 5 min sample interval)
      data[0].time = 1_517_445_000_000;
      data[1].time = 1_517_445_000_000 + 300_000 - 7_000;

      const result = dataUtil.getDeduplicatedCBGData(data);

      expect(result.length).to.equal(2); // should not deduplicate
    });
  });

  describe('filterDuplicateSMBGs', () => {
    const useRawDataOpts = { raw: true };

    // Helper to create CBG data with specific time and value
    const createCBG = (deviceTime, value) => _.toPlainObject(new Types.CBG({
      deviceId: 'Dexcom-XXX-XXXX',
      value,
      deviceTime,
      ...useRawDataOpts,
    }));

    // Helper to create SMBG data with specific time and value
    const createSMBG = (deviceTime, value) => _.toPlainObject(new Types.SMBG({
      deviceId: 'OneTouch-XXX-XXXX',
      value,
      deviceTime,
      ...useRawDataOpts,
    }));

    // Helper to generate time string for device time
    const makeDeviceTime = (hour, minute) => `2018-02-01T${_.padStart(hour, 2, '0')}:${_.padStart(minute, 2, '0')}:00`;

    it('should return data unchanged when there is no CBG data', () => {
      const smbgs = [
        createSMBG('2018-02-01T00:00:00', 100),
        createSMBG('2018-02-01T00:15:00', 120),
      ];

      const data = _.cloneDeep(smbgs);
      _.each(data, dataUtil.normalizeDatumIn);

      dataUtil.filterDuplicateSMBGs(data);

      const rejectedSmbgs = _.filter(data, d => d.type === 'smbg' && d.reject);
      expect(rejectedSmbgs.length).to.equal(0);
    });

    it('should return data unchanged when there is no SMBG data', () => {
      const cbgs = [
        createCBG('2018-02-01T00:00:00', 100),
        createCBG('2018-02-01T00:05:00', 110),
      ];

      const data = _.cloneDeep(cbgs);
      _.each(data, dataUtil.normalizeDatumIn);

      dataUtil.filterDuplicateSMBGs(data);

      const rejectedData = _.filter(data, d => d.reject);
      expect(rejectedData.length).to.equal(0);
    });

    it('should NOT filter SMBGs when duplicates count is <= 10 (threshold)', () => {
      // Create 10 matching SMBG/CBG pairs (exactly at threshold)
      const data = [];
      for (let i = 0; i < 10; i++) {
        const time = makeDeviceTime(0, i * 5);
        const value = 100 + i;
        data.push(createCBG(time, value));
        // SMBG with same time and value should be considered duplicate
        data.push(createSMBG(time, value));
      }

      _.each(data, dataUtil.normalizeDatumIn);
      dataUtil.filterDuplicateSMBGs(data);

      const rejectedSmbgs = _.filter(data, d => d.type === 'smbg' && d.reject);
      expect(rejectedSmbgs.length).to.equal(0);
    });

    it('should filter SMBGs when duplicates count is > 10 (threshold)', () => {
      // Create 11 matching SMBG/CBG pairs (exceeds threshold)
      const data = [];
      for (let i = 0; i < 11; i++) {
        const time = makeDeviceTime(0, i * 5);
        const value = 100 + i;
        data.push(createCBG(time, value));
        // SMBG with same time and value should be considered duplicate
        data.push(createSMBG(time, value));
      }

      _.each(data, dataUtil.normalizeDatumIn);
      dataUtil.filterDuplicateSMBGs(data);

      const rejectedSmbgs = _.filter(data, d => d.type === 'smbg' && d.reject);
      expect(rejectedSmbgs.length).to.equal(11);

      _.each(rejectedSmbgs, smbg => {
        expect(smbg.rejectReason).to.deep.equal(['SMBG duplicates CGM value within time tolerance']);
      });
    });

    it('should filter SMBGs that match CGM values within 500ms time tolerance', () => {
      // Create data with SMBGs at the boundary of the 500ms tolerance
      const cbgs = [];
      const smbgs = [];

      // Create 15 CGM readings (more than threshold)
      for (let i = 0; i < 15; i++) {
        cbgs.push(createCBG(makeDeviceTime(0, i * 3), 100 + i));
      }

      // Create matching SMBGs with slight time offsets within 500ms tolerance
      for (let i = 0; i < 15; i++) {
        const smbg = createSMBG(makeDeviceTime(0, i * 3), 100 + i);
        smbgs.push(smbg);
      }

      const data = [...cbgs, ...smbgs];
      _.each(data, dataUtil.normalizeDatumIn);

      // Adjust SMBG times to test boundary conditions (exactly 500ms or 1ms under)
      const filteredSmbgData = _.filter(data, d => d.type === 'smbg');
      _.each(filteredSmbgData, (smbg, i) => {
        // Alternate between -500ms (exactly at tolerance), +500ms, and -499ms (1ms under)
        let offset = 0;
        if (i % 3 === 0) {
          offset = -500; // Exactly at tolerance
        } else if (i % 3 === 1) {
          offset = 500; // Exactly at tolerance
        } else {
          offset = -499; // 1ms under tolerance
        }
        smbg.time = smbg.time + offset; // eslint-disable-line no-param-reassign
      });

      dataUtil.filterDuplicateSMBGs(data);

      const rejectedSmbgs = _.filter(data, d => d.type === 'smbg' && d.reject);
      expect(rejectedSmbgs.length).to.equal(15);
    });

    it('should NOT filter SMBGs that are > 500ms away from CGM readings', () => {
      // Create data with SMBGs just beyond 500ms tolerance (501ms)
      const cbgs = [];
      const smbgs = [];

      for (let i = 0; i < 15; i++) {
        cbgs.push(createCBG(makeDeviceTime(0, i * 3), 100 + i));
      }

      // Create SMBGs with same values
      for (let i = 0; i < 15; i++) {
        smbgs.push(createSMBG(makeDeviceTime(0, i * 3), 100 + i));
      }

      const data = [...cbgs, ...smbgs];
      _.each(data, dataUtil.normalizeDatumIn);

      // Adjust SMBG times to be 501ms away (1ms beyond tolerance)
      const filteredSmbgData = _.filter(data, d => d.type === 'smbg');
      _.each(filteredSmbgData, (smbg, i) => {
        // Alternate between +501ms and -501ms (both just beyond tolerance)
        const offset = i % 2 === 0 ? 501 : -501;
        smbg.time = smbg.time + offset; // eslint-disable-line no-param-reassign
      });

      dataUtil.filterDuplicateSMBGs(data);

      // No SMBGs should be filtered because they're > 500ms away
      const rejectedSmbgs = _.filter(data, d => d.type === 'smbg' && d.reject);
      expect(rejectedSmbgs.length).to.equal(0);
    });

    it('should NOT filter SMBGs with different values even at same time', () => {
      const data = [];

      // Create 15 pairs with same time but different values
      for (let i = 0; i < 15; i++) {
        const time = makeDeviceTime(0, i * 3);
        data.push(createCBG(time, 100 + i));
        data.push(createSMBG(time, 200 + i)); // Different value
      }

      _.each(data, dataUtil.normalizeDatumIn);
      dataUtil.filterDuplicateSMBGs(data);

      const rejectedSmbgs = _.filter(data, d => d.type === 'smbg' && d.reject);
      expect(rejectedSmbgs.length).to.equal(0);
    });

    it('should only filter duplicate SMBGs, leaving non-duplicates intact', () => {
      const data = [];

      // Create 12 duplicate pairs (matching time and value) to exceed threshold of 10
      for (let i = 0; i < 12; i++) {
        const time = makeDeviceTime(0, i * 5);
        data.push(createCBG(time, 100 + i));
        data.push(createSMBG(time, 100 + i)); // Duplicate
      }

      // Add 3 non-duplicate SMBGs (different values from nearby CGMs)
      data.push(createSMBG('2018-02-01T02:00:00', 250));
      data.push(createSMBG('2018-02-01T02:15:00', 260));
      data.push(createSMBG('2018-02-01T02:30:00', 270));

      _.each(data, dataUtil.normalizeDatumIn);
      dataUtil.filterDuplicateSMBGs(data);

      const allSmbgs = _.filter(data, d => d.type === 'smbg');
      const rejectedSmbgs = _.filter(allSmbgs, d => d.reject);
      const keptSmbgs = _.filter(allSmbgs, d => !d.reject);

      expect(allSmbgs.length).to.equal(15);
      expect(rejectedSmbgs.length).to.equal(12); // 12 duplicates
      expect(keptSmbgs.length).to.equal(3); // 3 non-duplicates
    });

    it('should handle already-rejected SMBGs gracefully', () => {
      const data = [];

      // Create 12 duplicate pairs
      for (let i = 0; i < 12; i++) {
        const time = makeDeviceTime(0, i * 5);
        data.push(createCBG(time, 100 + i));
        data.push(createSMBG(time, 100 + i));
      }

      _.each(data, dataUtil.normalizeDatumIn);

      // Pre-reject one SMBG
      const firstSmbg = _.find(data, d => d.type === 'smbg');
      firstSmbg.reject = true;
      firstSmbg.rejectReason = ['Pre-existing rejection'];

      dataUtil.filterDuplicateSMBGs(data);

      // The pre-rejected SMBG should still have its original reject reason
      expect(firstSmbg.rejectReason).to.deep.equal(['Pre-existing rejection']);

      // Other duplicate SMBGs should be rejected (11 remaining)
      const newlyRejectedSmbgs = _.filter(data, d => (
        d.type === 'smbg' &&
        d.reject &&
        d.rejectReason[0] === 'SMBG duplicates CGM value within time tolerance'
      ));
      expect(newlyRejectedSmbgs.length).to.equal(11);
    });

    it('should handle empty data array', () => {
      const data = [];
      dataUtil.filterDuplicateSMBGs(data);
      expect(data.length).to.equal(0);
    });

    it('should be called during addData and filter duplicates', () => {
      // Create data with > 10 duplicate SMBG/CGM pairs
      const testData = [];

      for (let i = 0; i < 12; i++) {
        const time = makeDeviceTime(0, i * 5);
        testData.push(createCBG(time, 100 + i));
        testData.push(createSMBG(time, 100 + i));
      }

      // Add upload data for completeness
      testData.push(_.toPlainObject(new Types.Upload({
        deviceTags: ['cgm'],
        source: 'Dexcom',
        deviceTime: '2018-02-01T00:00:00',
        uploadId: 'test-upload',
        ...useRawDataOpts,
      })));

      initDataUtil(testData);

      // Query SMBG data
      const result = dataUtil.query({
        ...defaultQuery,
        types: { smbg: { select: '*' } },
      });

      // Should have no SMBG data because all were filtered as duplicates
      expect(result.data.current.data.smbg.length).to.equal(0);
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
        dataUtil.bolusDatumsByIdMap = { foo: 'bar' };
        dataUtil.bolusToWizardIdMap = { foo: 'bar' };
        dataUtil.deviceUploadMap = { foo: 'bar' };
        dataUtil.latestDatumByType = { foo: 'bar' };
        dataUtil.pumpSettingsDatumsByIdMap = { foo: 'bar' };
        dataUtil.wizardDatumsByIdMap = { foo: 'bar' };
        dataUtil.wizardToBolusIdMap = { foo: 'bar' };
        dataUtil.loopDataSetsByIdMap = { foo: 'bar' };
        dataUtil.dexcomDataSetsByIdMap = { foo: 'bar' };
        dataUtil.bolusDosingDecisionDatumsByIdMap = { foo: 'bar' };
        dataUtil.removeData();
        expect(dataUtil.bolusDatumsByIdMap).to.eql({});
        expect(dataUtil.bolusToWizardIdMap).to.eql({});
        expect(dataUtil.deviceUploadMap).to.eql({});
        expect(dataUtil.latestDatumByType).to.eql({});
        expect(dataUtil.pumpSettingsDatumsByIdMap).to.eql({});
        expect(dataUtil.wizardDatumsByIdMap).to.eql({});
        expect(dataUtil.wizardToBolusIdMap).to.eql({});
        expect(dataUtil.loopDataSetsByIdMap).to.eql({});
        expect(dataUtil.dexcomDataSetsByIdMap).to.eql({});
        expect(dataUtil.bolusDosingDecisionDatumsByIdMap).to.eql({});
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

      it('should clear the `dataAnnotations` metadata', () => {
        dataUtil.dataAnnotations = { A: { code: 'A', value: 'A value' } };
        dataUtil.removeData();
        expect(dataUtil.dataAnnotations).to.eql({});
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

  describe('buildByDeviceIdDimension', () => {
    it('should build the `byDeviceId` dimension', () => {
      delete dataUtil.dimension.byDeviceId;

      dataUtil.buildByDeviceIdDimension();
      expect(dataUtil.dimension.byDeviceId).to.be.an('object').and.include.keys([
        'filter',
        'filterAll',
        'top',
        'bottom',
      ]);
    });
  });

  describe('buildBySampleIntervalDimension', () => {
    it('should build the `bySampleInterval` dimension', () => {
      delete dataUtil.dimension.bySampleInterval;

      dataUtil.buildBySampleIntervalDimension();
      expect(dataUtil.dimension.bySampleInterval).to.be.an('object').and.include.keys([
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
      expect(dataUtil.dimension.bySampleInterval).to.be.an('object');
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
      expect(dataUtil.filter.bySampleIntervalRange).to.be.a('function');
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
      const clearbySampleIntervalSpy = sinon.spy(dataUtil.dimension.bySampleInterval, 'filterAll');

      sinon.assert.callCount(clearbyTimeSpy, 0);
      sinon.assert.callCount(clearbyTypeSpy, 0);
      sinon.assert.callCount(clearbySubTypeSpy, 0);
      sinon.assert.callCount(clearbyIdSpy, 0);
      sinon.assert.callCount(clearbyDayOfWeekSpy, 0);
      sinon.assert.callCount(clearbyDeviceIdSpy, 0);
      sinon.assert.callCount(clearbySampleIntervalSpy, 0);

      dataUtil.clearFilters();

      sinon.assert.callCount(clearbyTimeSpy, 1);
      sinon.assert.callCount(clearbyTypeSpy, 1);
      sinon.assert.callCount(clearbySubTypeSpy, 1);
      sinon.assert.callCount(clearbyIdSpy, 1);
      sinon.assert.callCount(clearbyDayOfWeekSpy, 1);
      sinon.assert.callCount(clearbyDeviceIdSpy, 1);
      sinon.assert.callCount(clearbySampleIntervalSpy, 1);
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

  describe('setCgmSampleIntervalRange', () => {
    beforeEach(() => {
      initDataUtil(defaultData);
    });

    it('should set the cgmSampleIntervalRange to the default when called with no arguments', () => {
      dataUtil.cgmSampleIntervalRange = [1, 2];
      dataUtil.setCgmSampleIntervalRange();
      expect(dataUtil.cgmSampleIntervalRange).to.eql([dataUtil.defaultCgmSampleInterval, Infinity]);
    });

    it('should set the cgmSampleIntervalRange to the specified range when called with valid arguments', () => {
      dataUtil.cgmSampleIntervalRange = [1, 2];
      dataUtil.setCgmSampleIntervalRange([MS_IN_MIN, MS_IN_MIN * 2]);
      expect(dataUtil.cgmSampleIntervalRange).to.eql([MS_IN_MIN, MS_IN_MIN * 2]);
    });

    it('should set the cgmSampleIntervalRange to the provided array, filtering out falsy values', () => {
      dataUtil.setCgmSampleIntervalRange([MS_IN_MIN, null]);
      expect(dataUtil.cgmSampleIntervalRange).to.eql([MS_IN_MIN]);
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

    it('should not use pumpSettings from a different dataset when latest pump data comes from a continuous dataset', () => {
      const continuousUpload = uploadData[3];
      const discreteUpload = uploadData[4];

      dataUtil.latestDatumByType.basal = {
        type: 'basal',
        time: Date.parse(continuousUpload.deviceTime) + 10,
        uploadId: continuousUpload.uploadId,
      };

      // latest pumpSettings belong to a different (discrete) dataset B
      const discretePumpSettings = {
        type: 'pumpSettings',
        uploadId: discreteUpload.uploadId,
        time: Date.parse(discreteUpload.deviceTime),
      };

      dataUtil.latestDatumByType.pumpSettings = discretePumpSettings;

      // Ensure there is no matching pumpSettings for the continuous upload, so any attached
      // settings here would necessarily be from the wrong dataset
      dataUtil.pumpSettingsDatumsByIdMap = {};

      dataUtil.setLatestPumpUpload();

      // We should select upload A based on latest basal, and NOT attach settings from upload B
      expect(dataUtil.latestPumpUpload).to.include({
        manufacturer: _.toLower(dataUtil.uploadMap[continuousUpload.uploadId].source),
      });

      // Conflicting pumpSettings from dataset B must not be attached
      expect(dataUtil.latestPumpUpload.settings).to.be.undefined;
    });

    it('should return the make, model, latest settings, and automated delivery and settings override capabilities using latest pump data when available, else fallback to latest upload', () => {
      // 1) Use latest pump data and matching pumpSettings for uploadData[2]
      let latestPumpSettings = {
        type: 'pumpSettings',
        uploadId: uploadData[2].uploadId,
        time: Date.parse(uploadData[2].deviceTime),
      };
      dataUtil.latestDatumByType.pumpSettings = latestPumpSettings;
      dataUtil.latestDatumByType.basal = {
        type: 'basal',
        time: Date.parse(uploadData[2].deviceTime),
        uploadId: uploadData[2].uploadId,
      };

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.eql({
        manufacturer: 'medtronic',
        deviceModel: '1780',
        isAutomatedBasalDevice: true,
        isAutomatedBolusDevice: false,
        isSettingsOverrideDevice: false,
        settings: { ...latestPumpSettings, lastManualBasalSchedule: 'standard' },
      });

      // 2) Remove that upload and fall back to latest upload with aligned pumpSettings (uploadData[1])
      dataUtil.removeData({ id: uploadData[2].id });
      latestPumpSettings = {
        type: 'pumpSettings',
        uploadId: uploadData[1].uploadId,
        time: Date.parse(uploadData[1].deviceTime),
      };
      dataUtil.latestDatumByType.pumpSettings = latestPumpSettings;
      dataUtil.latestDatumByType.basal = {
        type: 'basal',
        time: Date.parse(uploadData[1].deviceTime),
        uploadId: uploadData[1].uploadId,
      };

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.eql({
        manufacturer: 'insulet',
        deviceModel: 'dash',
        isAutomatedBasalDevice: false,
        isAutomatedBolusDevice: false,
        isSettingsOverrideDevice: false,
        settings: { ...latestPumpSettings },
      });

      // 3) Remove again and fall back to uploadData[0] with aligned pumpSettings
      dataUtil.removeData({ id: uploadData[1].id });
      latestPumpSettings = {
        type: 'pumpSettings',
        uploadId: uploadData[0].uploadId,
        deviceId: 'tandemCIQ123456',
      };
      dataUtil.latestDatumByType.pumpSettings = latestPumpSettings;
      dataUtil.latestDatumByType.basal = {
        type: 'basal',
        time: Date.parse(uploadData[0].deviceTime),
        uploadId: uploadData[0].uploadId,
      };

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

    it('should not attach pumpSettings from a different uploadId than the selected latestPumpUpload', () => {
      const uploadA = { ...uploadData[0], uploadId: 'upload-A' };
      const uploadB = { ...uploadData[1], uploadId: 'upload-B' };

      const pumpSettingsA = {
        type: 'pumpSettings',
        uploadId: uploadA.uploadId,
        time: Date.parse(uploadA.deviceTime),
        id: 'ps-A',
      };

      const pumpSettingsB = {
        type: 'pumpSettings',
        uploadId: uploadB.uploadId,
        time: Date.parse(uploadB.deviceTime) + 1000, // later, but wrong uploadId
        id: 'ps-B',
      };

      initDataUtil([
        uploadA,
        uploadB,
        pumpSettingsA,
        pumpSettingsB,
      ]);

      dataUtil.pumpSettingsDatumsByIdMap = {
        [pumpSettingsA.id]: pumpSettingsA,
        [pumpSettingsB.id]: pumpSettingsB,
      };

      dataUtil.latestDatumByType = {
        ...dataUtil.latestDatumByType,
        basal: {
          type: 'basal',
          time: Date.parse(uploadA.deviceTime),
          uploadId: uploadA.uploadId,
        },
        pumpSettings: pumpSettingsB,
      };

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.be.an('object');

      // Must attach only matching pumpSettingsA
      expect(dataUtil.latestPumpUpload.settings).to.be.an('object');
      expect(dataUtil.latestPumpUpload.settings.id).to.equal('ps-A');
      expect(dataUtil.latestPumpUpload.settings.uploadId).to.equal('upload-A');
    });

    it('should not select pumpSettings with timestamps more than 15 minutes later than the latest upload', () => {
      const uploadA = { ...uploadData[0], uploadId: 'upload-A' };

      const basal = {
        type: 'basal',
        time: Date.parse(uploadA.deviceTime) + 1000,
        uploadId: 'upload-A',
      };

      const pumpSettingsOld = {
        type: 'pumpSettings',
        uploadId: 'upload-A',
        time: basal.time - 1000,
        id: 'ps-old',
      };

      const pumpSettingsNew = {
        type: 'pumpSettings',
        uploadId: 'upload-A',
        time: basal.time + (16 * MS_IN_MIN), // 16 minutes
        id: 'ps-new',
      };

      initDataUtil([
        uploadA,
        basal,
        pumpSettingsOld,
        pumpSettingsNew,
      ]);

      dataUtil.pumpSettingsDatumsByIdMap = {
        [pumpSettingsOld.id]: pumpSettingsOld,
        [pumpSettingsNew.id]: pumpSettingsNew,
      };

      dataUtil.latestDatumByType = {
        ...dataUtil.latestDatumByType,
        basal,
      };

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.be.an('object');
      expect(dataUtil.latestPumpUpload.settings).to.be.an('object');
      expect(dataUtil.latestPumpUpload.settings.id).to.equal('ps-old');
    });

    it('should select pumpSettings with timestamps up to 15 minutes later than the latest upload', () => {
      const uploadA = { ...uploadData[0], uploadId: 'upload-A' };

      const basal = {
        type: 'basal',
        time: Date.parse(uploadA.deviceTime) + 1000,
        uploadId: 'upload-A',
      };

      const pumpSettingsOld = {
        type: 'pumpSettings',
        uploadId: 'upload-A',
        time: basal.time - 1000,
        id: 'ps-old',
      };

      const pumpSettingsNew = {
        type: 'pumpSettings',
        uploadId: 'upload-A',
        time: basal.time + (12 * MS_IN_MIN), // 12 minutes
        id: 'ps-new',
      };

      initDataUtil([
        uploadA,
        basal,
        pumpSettingsOld,
        pumpSettingsNew,
      ]);

      dataUtil.pumpSettingsDatumsByIdMap = {
        [pumpSettingsOld.id]: pumpSettingsOld,
        [pumpSettingsNew.id]: pumpSettingsNew,
      };

      dataUtil.latestDatumByType = {
        ...dataUtil.latestDatumByType,
        basal,
      };

      dataUtil.setLatestPumpUpload();

      expect(dataUtil.latestPumpUpload).to.be.an('object');
      expect(dataUtil.latestPumpUpload.settings).to.be.an('object');
      expect(dataUtil.latestPumpUpload.settings.id).to.equal('ps-new');
    });

    it('should fall back to traditional pump upload logic when no pumpSettings data is available', () => {
      // Clear any existing pumpSettings data
      delete dataUtil.latestDatumByType.pumpSettings;

      dataUtil.setLatestPumpUpload();

      // Should fall back to the traditional logic and select the latest upload with insulin-pump tags
      expect(dataUtil.latestPumpUpload).to.be.an('object');
      expect(dataUtil.latestPumpUpload.manufacturer).to.equal('medtronic');
      expect(dataUtil.latestPumpUpload.deviceModel).to.equal('1780');
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

    it('should set `deviceSerialNumber` from the `pumpSettings.serialNumber` associated with an upload when not available on the upload', () => {
      const uploadId = 'id1';
      dataUtil.updateDatum({ ...uploadData[2], deviceSerialNumber: undefined, uploadId });
      dataUtil.updateDatum({ ...pumpSettingsData[2], serialNumber: '53R147', uploadId });

      dataUtil.setUploadMap();

      expect(dataUtil.uploadMap[uploadId]).to.eql({
        source: 'Medtronic',
        deviceSerialNumber: '53R147',
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

    it('should set `source` field for Sequel uploads to `twiist`', () => {
      dataUtil.updateDatum({ ...uploadData[2], source: undefined, deviceManufacturers: ['Sequel'] });
      dataUtil.updateDatum({ ...pumpSettingsData[1], uploadId: uploadData[2].uploadId, model: 'twiist' });

      dataUtil.setUploadMap();
      expect(dataUtil.uploadMap[uploadData[2].uploadId]).to.eql({
        source: 'twiist',
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

  describe('setLatestDiabetesDatumEnd', () => {
    it('should be set to the most recent diabetes datum time', () => {
      initDataUtil([
        { ...new Types.Bolus({ ...useRawData }), time: '2024-01-01T10:00:00.000Z' },
        { ...new Types.CBG({ ...useRawData }), time: '2024-01-01T11:00:00.000Z' },
        { ...new Types.Bolus({ ...useRawData }), time: '2024-01-01T12:00:00.000Z' },
      ]);

      delete(dataUtil.latestDiabetesDatumEnd);
      dataUtil.setLatestDiabetesDatumEnd();
      expect(moment(dataUtil.latestDiabetesDatumEnd).toISOString()).to.eql('2024-01-01T12:00:00.000Z');
    });

    it('should be set to the most recent diabetes datum time + duration', () => {
      initDataUtil([
        { ...new Types.Bolus({ ...useRawData }), time: '2024-01-01T10:00:00.000Z' },
        { ...new Types.Basal({ ...useRawData }), time: '2024-01-01T11:00:00.000Z', duration: MS_IN_MIN * 61 },
        { ...new Types.Bolus({ ...useRawData }), time: '2024-01-01T12:00:00.000Z' },
      ]);

      delete(dataUtil.latestDiabetesDatumEnd);
      dataUtil.setLatestDiabetesDatumEnd();
      expect(moment(dataUtil.latestDiabetesDatumEnd).toISOString()).to.eql('2024-01-01T12:01:00.000Z');
    });

    it('should be set to null if there are no diabetes datums', () => {
      initDataUtil([
        { ...new Types.Upload({ ...useRawData }), time: '2024-01-01T10:00:00.000Z' },
      ]);

      delete(dataUtil.latestDiabetesDatumEnd);
      dataUtil.setLatestDiabetesDatumEnd();
      expect(dataUtil.latestDiabetesDatumEnd).to.equal(null);
    });
  });

  describe('setLatestTimeZone', () => {
    context('Timezone offset provided from a recent diabetes datum', () => {
      it('should set a valid timezone from `latestDiabetesDatum.timezoneOffset`', () => {
        initDataUtil([
          // should use this dosing decision even though it's not as recent as the basal, but it has a timezoneOffset
          { ...new Types.DosingDecision({ ...useRawData }), time: '2024-01-01T10:00:00.000Z', timezoneOffset: -420 },
          { ...new Types.Basal({ ...useRawData }), time: '2024-01-01T11:00:00.000Z', timezoneOffset: undefined },
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('Etc/GMT+7');
        expect(dataUtil.latestTimeZone.message).to.contain('Defaulting to display in the timezone of most recent dosingDecision at');


        // should round to the nearest hour
        initDataUtil([
          { ...new Types.DosingDecision({ ...useRawData }), timezoneOffset: -(420 + 29) },
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('Etc/GMT+7');

        initDataUtil([
          { ...new Types.DosingDecision({ ...useRawData }), timezoneOffset: -(420 + 30) },
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('Etc/GMT+8');
      });

      it('should prefer a more recent latestUpload with a timezone', () => {
        initDataUtil([
          { ...new Types.DosingDecision({ ...useRawData }), time: '2024-01-01T10:00:00.000Z', timezoneOffset: -420 },
          { ...new Types.Upload({ ...useRawData }), time: '2024-01-01T11:00:00.000Z', timezone: 'US/Pacific' },
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('US/Pacific');
        expect(dataUtil.latestTimeZone.message).to.contain('Defaulting to display in the timezone of most recent upload at');
      });

      it('should prefer an older latestUpload with a timezone if it matches the timezoneOffset at the time of the latest datum', () => {
        initDataUtil([
          { ...new Types.DosingDecision({ ...useRawData }), time: '2024-01-01T10:00:00.000Z', timezoneOffset: -420 },
          // should use this older upload since it has the same timezoneOffset
          { ...new Types.Upload({ ...useRawData }), time: '2024-01-01T09:00:00.000Z', timezone: 'US/Mountain' },
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('US/Mountain');
        expect(dataUtil.latestTimeZone.message).to.contain('Defaulting to display in the timezone of most recent upload at');

        initDataUtil([
          { ...new Types.DosingDecision({ ...useRawData }), time: '2024-01-01T10:00:00.000Z', timezoneOffset: -420 },
          // should not use this older upload since it has a different timezoneOffset
          { ...new Types.Upload({ ...useRawData }), time: '2024-01-01T09:00:00.000Z', timezone: 'US/Pacific' },
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('Etc/GMT+7');
        expect(dataUtil.latestTimeZone.message).to.contain('Defaulting to display in the timezone of most recent dosingDecision at');
      });

      it('should return undefined when given an invalid timezone offset', () => {
        initDataUtil([
          { ...new Types.CBG({ ...useRawData }), timezoneOffset: -1000 },
        ]);

        sinon.spy(dataUtil, 'log');
        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone).to.be.undefined;
        sinon.assert.calledWith(dataUtil.log, 'Invalid latest time zone:', 'Etc/GMT+17');
      });
    });

    context('Timezone provided from a timechange event', () => {
      it('should set a valid timezone from `latestDiabetesDatum.timezoneOffset`', () => {
        initDataUtil([
          { ...new Types.DeviceEvent({ ...useRawData }), subType: 'timeChange', time: '2024-01-01T10:00:00.000Z', to: { timeZoneName: 'Europe/Budapest' } },
          { ...new Types.Basal({ ...useRawData }), time: '2024-01-01T11:00:00.000Z', timezoneOffset: undefined },
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('Europe/Budapest');
        expect(dataUtil.latestTimeZone.message).to.contain('Defaulting to display in the timezone of most recent time change at');
      });

      it('should returned undefined when given an invalid timezone name', () => {
        initDataUtil([
          { ...new Types.DeviceEvent({ ...useRawData }), subType: 'timeChange', time: '2024-01-01T10:00:00.000Z', to: { timeZoneName: 'foo/bar' } },
        ]);

        sinon.spy(dataUtil, 'log');
        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone).to.be.undefined;
        sinon.assert.calledWith(dataUtil.log, 'Invalid latest time zone:', 'foo/bar');
      });
    });

    context('Timezone provided from a recent upload event', () => {
      it('should set a valid timezone from `latestDiabetesDatum.timezoneOffset`', () => {
        initDataUtil([
          { ...new Types.Upload({ ...useRawData }), time: '2024-01-01T10:00:00.000Z', timezone: 'Europe/Budapest' },
          { ...new Types.Upload({ ...useRawData }), time: '2024-01-01T11:00:00.000Z', timezone: 'US/Pacific' }, // more recent
        ]);

        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone.name).to.eql('US/Pacific');
        expect(dataUtil.latestTimeZone.message).to.contain('Defaulting to display in the timezone of most recent upload at');
      });

      it('should returned undefined when given an invalid timezone name', () => {
        initDataUtil([
          { ...new Types.Upload({ ...useRawData }), time: '2024-01-01T11:00:00.000Z', timezone: 'bar/baz' },
        ]);

        sinon.spy(dataUtil, 'log');
        delete(dataUtil.latestTimeZone);
        dataUtil.setLatestTimeZone();
        expect(dataUtil.latestTimeZone).to.be.undefined;
        sinon.assert.calledWith(dataUtil.log, 'Invalid latest time zone:', 'bar/baz');
      });
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
          oneMinCgmSampleInterval: false,
          id: 'tandemCIQ12345',
          label: 'Tandem 12345 (Control-IQ)',
          deviceName: 'Tandem CIQ',
          pump: true,
          serialNumber: 'sn-0',
        },
      ]);
    });

    it('should exclude a non-Control-IQ device upload if a Control-IQ upload exists', () => {
      const nonCIQUploadDatum = _.cloneDeep(uploadData[0]);
      nonCIQUploadDatum.id = 'nonCIQUploadId';
      nonCIQUploadDatum.deviceId = 'tandem12345';
      nonCIQUploadDatum.deviceName = 'Tandem Non-CIQ';
      nonCIQUploadDatum.uploadId = 'upload-1';

      initDataUtil([nonCIQUploadDatum]);
      delete(dataUtil.devices);
      delete(dataUtil.excludedDevices);

      // add non-CIQ device upload. Should not be excluded
      dataUtil.setDevices();

      expect(dataUtil.devices).to.eql([
        {
          bgm: false,
          cgm: false,
          oneMinCgmSampleInterval: false,
          id: 'tandem12345',
          deviceName: 'Tandem Non-CIQ',
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
          oneMinCgmSampleInterval: false,
          id: 'tandem12345',
          deviceName: 'Tandem Non-CIQ',
          label: 'Tandem 12345',
          pump: true,
          serialNumber: 'sn-0',
        },
        {
          bgm: false,
          cgm: false,
          oneMinCgmSampleInterval: false,
          id: 'tandemCIQ12345',
          deviceName: 'Tandem CIQ',
          label: 'Tandem 12345 (Control-IQ)',
          pump: true,
          serialNumber: 'sn-0',
        },
      ]);

      expect(dataUtil.excludedDevices).to.eql(['tandem12345']);
    });

    it('should add set the proper device label for LibreView data', () => {
      initDataUtil([{
        ...uploadData[3],
        deviceManufacturers: ['Abbott'],
        deviceId: 'MyAbbott123',
        dataSetType: 'continuous',
        deviceTags: [
          'bgm',
          'cgm'
        ],
        deviceName: 'Abbott DeviceName',
      }]);

      delete(dataUtil.devices);
      dataUtil.setDevices();

      expect(dataUtil.devices).to.eql([
        {
          bgm: true,
          cgm: true,
          oneMinCgmSampleInterval: false,
          id: 'MyAbbott123',
          label: 'FreeStyle Libre (from LibreView)',
          deviceName: 'Abbott DeviceName',
          pump: false,
          serialNumber: undefined
        },
      ]);
    });

    it('should add set the proper device label for Sequel data', () => {
      initDataUtil([{
        ...uploadData[3],
        client: {
          name: 'com.sequelmedtech.tidepool-service',
          version: '2.0.0',
        },
        deviceManufacturers: ['Sequel'],
        deviceId: 'MySequel123',
        dataSetType: 'continuous',
        deviceTags: [
          'bgm',
          'cgm',
          'insulin-pump',
        ],
        deviceName: 'Sequel DeviceName',
      }]);

      delete(dataUtil.devices);
      dataUtil.setDevices();

      expect(dataUtil.devices).to.eql([
        {
          bgm: true,
          cgm: true,
          oneMinCgmSampleInterval: true,
          id: 'MySequel123',
          deviceName: 'Sequel DeviceName',
          label: 'twiist',
          pump: true,
          serialNumber: undefined
        },
      ]);
    });

    it('should add set the proper device label for Dexcom API data', () => {
      initDataUtil([{
        ...uploadData[3],
        deviceManufacturers: ['Dexcom'],
        deviceId: 'MyDexcom123',
        dataSetType: 'continuous',
        deviceTags: [
          'cgm'
        ],
        deviceName: 'Dexcom DeviceName',
      }]);

      delete(dataUtil.devices);
      dataUtil.setDevices();

      expect(dataUtil.devices).to.eql([
        {
          bgm: false,
          cgm: true,
          oneMinCgmSampleInterval: false,
          id: 'MyDexcom123',
          label: 'Dexcom API',
          deviceName: 'Dexcom DeviceName',
          pump: false,
          serialNumber: undefined
        },
      ]);
    });
  });

  describe('setDataAnnotations', () => {
    it('should set a list of unique data annotations by code if trackDataAnnotations is `true`', () => {
      const datum1 = { type: 'foo', annotations: [{ code: 'A', value: 'A value' }, { code: 'B', value: 'B value' }] };
      const datum2 = { type: 'bar', annotations: [{ code: 'B', value: 'B value 2' }, { code: 'C', value: 'C value' }] };

      dataUtil.dataAnnotations = {};
      dataUtil.trackDataAnnotations = true;

      dataUtil.normalizeDatumOut(datum1);
      expect(dataUtil.dataAnnotations).to.eql({
        A: { code: 'A', value: 'A value' },
        B: { code: 'B', value: 'B value' },
      });

      dataUtil.normalizeDatumOut(datum2);
      expect(dataUtil.dataAnnotations).to.eql({
        A: { code: 'A', value: 'A value' },
        B: { code: 'B', value: 'B value' },
        C: { code: 'C', value: 'C value' },
      });
    });

    it('should not track unique data annotations by code if trackDataAnnotations is `false`', () => {
      const datum1 = { type: 'foo', annotations: [{ code: 'A', value: 'A value' }, { code: 'B', value: 'B value' }] };
      const datum2 = { type: 'bar', annotations: [{ code: 'B', value: 'B value 2' }, { code: 'C', value: 'C value' }] };

      dataUtil.dataAnnotations = {};
      dataUtil.trackDataAnnotations = false;

      dataUtil.normalizeDatumOut(datum1);
      dataUtil.normalizeDatumOut(datum2);
      expect(dataUtil.dataAnnotations).to.eql({});
    });
  });

  describe('clearDataAnnotations', () => {
    it('should clear all data annotations', () => {
      dataUtil.dataAnnotations = { A: { code: 'A', value: 'A value' }, B: { code: 'B', value: 'B value' } };
      dataUtil.clearDataAnnotations();
      expect(dataUtil.dataAnnotations).to.eql({});
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
      sinon.spy(dataUtil, 'setLatestDiabetesDatumEnd');
      sinon.spy(dataUtil, 'setLatestTimeZone');

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
      sinon.assert.calledOnce(dataUtil.setLatestDiabetesDatumEnd);
      sinon.assert.calledOnce(dataUtil.setLatestTimeZone);

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
      sinon.spy(dataUtil, 'setCgmSampleIntervalRange');
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
      sinon.assert.calledOnce(dataUtil.setCgmSampleIntervalRange);
      sinon.assert.calledOnce(dataUtil.setTypes);
      sinon.assert.calledOnce(dataUtil.setBgPrefs);
      sinon.assert.calledOnce(dataUtil.setTimePrefs);
      sinon.assert.calledOnce(dataUtil.setEndpoints);
      sinon.assert.calledOnce(dataUtil.setActiveDays);
      sinon.assert.calledOnce(dataUtil.setExcludedDevices);
      sinon.assert.calledOnce(dataUtil.clearMatchedDevices);

      sinon.assert.callOrder(
        dataUtil.clearFilters,
        dataUtil.clearMatchedDevices,
        dataUtil.setBgSources,
        dataUtil.setCgmSampleIntervalRange,
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
        'Dexcom-XXX-XXXX': { 'Dexcom G6_2.3.2': true, 'Dexcom G6_3.1.0': true },
        'AbbottFreeStyleLibre-XXX-XXXX': { 'AbbottFreeStyleLibre-XXX-XXXX_0.0': true },
        'Test Page Data - 123': { 'Test Page Data - 123_0.0': true },
      });

      dataUtil.setBgSources('smbg');
      dataUtil.clearFilters();
      dataUtil.clearMatchedDevices();
      dataUtil.getStats(['averageGlucose']);

      expect(dataUtil.matchedDevices).to.eql({
        'OneTouch-XXX-XXXX': { 'OneTouch-XXX-XXXX_0.0': true },
      });

      // Should not update if `matchDevices` is false
      dataUtil.clearMatchedDevices();
      dataUtil.matchDevices = false;
      dataUtil.getStats(['averageGlucose', 'totalInsulin']);
      expect(dataUtil.matchedDevices).to.eql({});
    });

    it('should call filterAll on byType and bySampleInterval dimensions before generating each stat', () => {
      const byTypeFilterAllSpy = sinon.spy(dataUtil.dimension.byType, 'filterAll');
      const bySampleIntervalFilterAllSpy = sinon.spy(dataUtil.dimension.bySampleInterval, 'filterAll');

      dataUtil.getStats(['averageGlucose', 'totalInsulin']);

      expect(byTypeFilterAllSpy.callCount).to.equal(2);
      expect(bySampleIntervalFilterAllSpy.callCount).to.equal(2);

      byTypeFilterAllSpy.restore();
      bySampleIntervalFilterAllSpy.restore();
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
        'Test Page Data - 123': { 'Test Page Data - 123_0.0': true },
      });

      dataUtil.clearMatchedDevices();
      dataUtil.getAggregationsByDate(['fingersticks']);

      expect(dataUtil.matchedDevices).to.eql({
        'OneTouch-XXX-XXXX': { 'OneTouch-XXX-XXXX_0.0': true },
      });

      dataUtil.clearMatchedDevices();
      dataUtil.getAggregationsByDate(['boluses']);

      expect(dataUtil.matchedDevices).to.eql({
        'Test Page Data - 123': { 'Test Page Data - 123_0.0': true },
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
      expect(result.latestPumpUpload.settings).to.eql(dataUtil.latestPumpUpload.settings);
      expect(result.patientId).to.equal(defaultPatientId);
      expect(result.size).to.equal(37);

      expect(result.devices).to.eql([
        { id: 'Test Page Data - 123' },
        { id: 'AbbottFreeStyleLibre-XXX-XXXX' },
        { id: 'Dexcom-XXX-XXXX' },
        { id: 'OneTouch-XXX-XXXX' },
        { bgm: false, cgm: false, oneMinCgmSampleInterval: false, id: 'tandemCIQ12345', label: 'Tandem 12345 (Control-IQ)', deviceName: 'Tandem CIQ', pump: true, serialNumber: 'sn-0' },
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
      expect(result.latestPumpUpload.settings).to.eql(dataUtil.latestPumpUpload.settings);
      expect(result.patientId).to.equal(defaultPatientId);
      expect(result.size).to.equal(37);

      expect(result.devices).to.eql([
        { id: 'Test Page Data - 123' },
        { id: 'AbbottFreeStyleLibre-XXX-XXXX' },
        { id: 'Dexcom-XXX-XXXX' },
        { id: 'OneTouch-XXX-XXXX' },
        { bgm: false, cgm: false, oneMinCgmSampleInterval: false, id: 'tandemCIQ12345', label: 'Tandem 12345 (Control-IQ)', deviceName: 'Tandem CIQ', pump: true, serialNumber: 'sn-0' },
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

    it('should normalize `latestPumpUpload.settings` when present', () => {
      // Controlled scenario guaranteeing latestPumpUpload has settings
      const upload = {
        ...uploadData[2],
        uploadId: 'upload-settings',
        deviceTime: '2018-02-05T00:00:00',
        time: '2018-02-05T00:00:00.000Z',
      };

      const pumpSettings = {
        ...pumpSettingsData[pumpSettingsData.length - 1],
        type: 'pumpSettings',
        uploadId: 'upload-settings',
        id: 'ps-latest',
        deviceTime: '2018-02-04T00:00:00',
        time: '2018-02-04T00:00:00.000Z',
      };

      initDataUtil([
        upload,
        pumpSettings,
      ]);

      sinon.spy(dataUtil, 'normalizeDatumOut');

      const metaData = ['latestPumpUpload'];
      const result = dataUtil.getMetaData(metaData);

      expect(result.latestPumpUpload).to.be.an('object').and.have.keys([
        'deviceModel',
        'isAutomatedBasalDevice',
        'isAutomatedBolusDevice',
        'isSettingsOverrideDevice',
        'manufacturer',
        'settings',
      ]);

      expect(result.latestPumpUpload.settings).to.be.an('object');
      sinon.assert.calledWith(dataUtil.normalizeDatumOut, result.latestPumpUpload.settings);
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
        'Test Page Data - 123': { 'Test Page Data - 123_0.0': true },
      });

      dataUtil.clearMatchedDevices();
      dataUtil.setTypes({ smbg: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(dataUtil.matchedDevices).to.eql({
        'OneTouch-XXX-XXXX': { 'OneTouch-XXX-XXXX_0.0': true },
      });

      dataUtil.clearMatchedDevices();
      dataUtil.setTypes({ basal: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(dataUtil.matchedDevices).to.eql({
        'Test Page Data - 123': { 'Test Page Data - 123_0.0': true },
      });

      dataUtil.clearMatchedDevices();
      dataUtil.setTypes({ cbg: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(dataUtil.matchedDevices).to.eql({
        'Dexcom-XXX-XXXX': { 'Dexcom G6_2.3.2': true, 'Dexcom G6_3.1.0': true },
        'AbbottFreeStyleLibre-XXX-XXXX': { 'AbbottFreeStyleLibre-XXX-XXXX_0.0': true },
      });

      // Should not update if `matchDevices` is false
      dataUtil.clearMatchedDevices();
      dataUtil.matchDevices = false;
      dataUtil.setTypes({ bolus: {} });
      dataUtil.getTypeData(dataUtil.types);
      expect(dataUtil.matchedDevices).to.eql({});
    });

    it('should call `filterAll` on `byType` and `bySampleInterval` dimensions before processing each type', () => {
      const byTypeFilterAllSpy = sinon.spy(dataUtil.dimension.byType, 'filterAll');
      const bySampleIntervalFilterAllSpy = sinon.spy(dataUtil.dimension.bySampleInterval, 'filterAll');

      dataUtil.setTypes({ bolus: {}, cgb: {}, deviceEvent: {} });
      dataUtil.getTypeData(dataUtil.types);

      expect(byTypeFilterAllSpy.callCount).to.equal(3);
      expect(bySampleIntervalFilterAllSpy.callCount).to.equal(3);

      byTypeFilterAllSpy.restore();
      bySampleIntervalFilterAllSpy.restore();
    });

    it('should call `filter.bySampleIntervalRange` with `cgmSampleIntervalRange` before processing cbg data type', () => {
      const bySampleIntervalRangeSpy = sinon.spy(dataUtil.filter, 'bySampleIntervalRange');
      sinon.assert.notCalled(bySampleIntervalRangeSpy);
      dataUtil.cgmSampleIntervalRange = [1, 2];

      dataUtil.setTypes({ bolus: {} });
      dataUtil.getTypeData(dataUtil.types);
      sinon.assert.notCalled(bySampleIntervalRangeSpy);

      dataUtil.setTypes({ cbg: {} });
      dataUtil.getTypeData(dataUtil.types);
      sinon.assert.calledWith(bySampleIntervalRangeSpy, 1, 2);

      bySampleIntervalRangeSpy.restore();
    });

    it('should call `filter.bySampleIntervalRange` with `defaultCgmSampleIntervalRange` before processing cbg data type if range is not set', () => {
      const bySampleIntervalRangeSpy = sinon.spy(dataUtil.filter, 'bySampleIntervalRange');
      sinon.assert.notCalled(bySampleIntervalRangeSpy);

      assert(dataUtil.defaultCgmSampleIntervalRange[0] === MS_IN_MIN * 5);
      assert(dataUtil.defaultCgmSampleIntervalRange[1] === Infinity);
      delete dataUtil.cgmSampleIntervalRange;

      dataUtil.setTypes({ cbg: {} });
      dataUtil.getTypeData(dataUtil.types);
      sinon.assert.calledWith(bySampleIntervalRangeSpy, MS_IN_MIN * 5, Infinity);

      bySampleIntervalRangeSpy.restore();
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
      d.tags = {
        automatedSuspend: false,
        calibration: false,
        siteChange: false,
        reservoirChange: false,
        cannulaPrime: false,
        tubingPrime: false,
      };
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

  describe('addMissingSuppressedBasals', () => {
    const createBasal = (overrides = {}) => new Types.Basal({
      deviceTime: '2018-02-01T10:00:00',
      duration: MS_IN_HOUR,
      deliveryType: 'automated',
      rate: 1.0,
      uploadId: 'upload-3',
      origin: { name: 'com.dekaresearch.twiist' }, // Twiist basal
      timezoneOffset: 0,
      ...overrides,
    });

    const createPumpSettings = (overrides = {}) => new Types.Settings({
      id: 'pumpSettings1',
      type: 'pumpSettings',
      time: '2018-02-01T00:00:00.000Z',
      deviceTime: '2018-02-01T00:00:00',
      activeSchedule: 'standard',
      basalSchedules: {
        standard: [
          { start: 0, rate: 0.5 }, // 12:00 AM
          { start: 6 * MS_IN_HOUR, rate: 0.8 }, // 6:00 AM
          { start: 12 * MS_IN_HOUR, rate: 0.6 }, // 12:00 PM
          { start: 18 * MS_IN_HOUR, rate: 0.7 }, // 6:00 PM
        ],
      },
      uploadId: 'upload-3',
      ...overrides,
    });

    beforeEach(() => {
      initDataUtil([]);
    });

    it('should only process Twiist Loop basal datums with automated or temp delivery types and no existing suppressed', () => {
      const nonTwiistBasal = createBasal({
        origin: { name: 'com.other.device' }, // Non-twiist basal
      });

      const scheduledBasal = createBasal({
        deliveryType: 'scheduled',
      });

      const basalWithSuppressed = createBasal({
        suppressed: { rate: 0.5 },
      });

      const validBasal = createBasal();

      const expectedValidBasalSuppressed = {
        ...validBasal,
        id: `${validBasal.id}_suppressed`,
        deliveryType: 'scheduled',
        rate: 0.8, // Rate from 6AM-12PM segment
      };

      const data = [nonTwiistBasal, scheduledBasal, basalWithSuppressed, validBasal];
      const pumpSettings = createPumpSettings();

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      dataUtil.addMissingSuppressedBasals(data);

      expect(nonTwiistBasal.suppressed).to.be.undefined;
      expect(scheduledBasal.suppressed).to.be.undefined;
      expect(basalWithSuppressed.suppressed).to.eql({ rate: 0.5 });
      expect(validBasal.suppressed).to.eql(expectedValidBasalSuppressed);

      expect(data.length).to.equal(4); // No new datums added
    });

    it('should skip basals when no pump settings schedule is available', () => {
      const basal = createBasal();
      const data = [basal];

      dataUtil.pumpSettingsDatumsByIdMap = {};

      dataUtil.addMissingSuppressedBasals(data);

      expect(basal.suppressed).to.be.undefined;
    });

    it('should generate suppressed basal for simple case within single schedule segment', () => {
      const basal = createBasal({
        deviceTime: '2018-02-01T10:00:00', // 10:00 AM - falls in 6AM-12PM segment
        duration: MS_IN_HOUR,
      });

      const data = [basal];
      const pumpSettings = createPumpSettings();

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      dataUtil.addMissingSuppressedBasals(data);

      expect(basal.suppressed).to.be.an('object');
      expect(basal.suppressed.id).to.equal(`${basal.id}_suppressed`);
      expect(basal.suppressed.deliveryType).to.equal('scheduled');
      expect(basal.suppressed.rate).to.equal(0.8); // Rate from 6AM-12PM segment
      expect(basal.duration).to.equal(MS_IN_HOUR); // Original duration unchanged
    });

    it('should split basal when it crosses multiple schedule segments', () => {
      const basal = createBasal({
        deviceTime: '2018-02-01T11:00:00', // 11:00 AM
        duration: 2 * MS_IN_HOUR, // Crosses 12:00 PM boundary
      });

      const data = [basal];
      const pumpSettings = createPumpSettings();

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      const originalDataLength = data.length;
      dataUtil.addMissingSuppressedBasals(data);

      // Should have added one new basal datum
      expect(data.length).to.equal(originalDataLength + 1);

      // Original basal should be shortened to end at 12:00 PM
      expect(basal.duration).to.equal(MS_IN_HOUR); // 1 hour until boundary
      expect(basal.suppressed.rate).to.equal(0.8); // 6AM-12PM rate

      // New basal should start at 12:00 PM
      const newBasal = data[data.length - 1];
      expect(newBasal.id).to.equal(`${basal.id}_split_1`);
      expect(newBasal.time).to.equal(basal.time + MS_IN_HOUR);
      expect(newBasal.duration).to.equal(MS_IN_HOUR); // Remaining 1 hour
      expect(newBasal.suppressed.rate).to.equal(0.6); // 12PM-6PM rate
    });

    it('should handle day boundary crossing correctly', () => {
      const basal = createBasal({
        deviceTime: '2018-02-01T23:00:00', // 11:00 PM
        duration: 2 * MS_IN_HOUR, // Crosses midnight
      });

      const data = [basal];
      const pumpSettings = createPumpSettings();

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      dataUtil.addMissingSuppressedBasals(data);

      // Should split at midnight boundary
      expect(data.length).to.equal(2);
      expect(basal.suppressed.rate).to.equal(0.7); // 6PM-12AM rate

      const newBasal = data[data.length - 1];
      expect(newBasal.suppressed.rate).to.equal(0.5); // 12AM-6AM rate
    });

    it('should handle negative timezone offsets correctly', () => {
      const basal = createBasal({
        deviceTime: '2018-02-01T02:00:00',
        duration: MS_IN_HOUR,
        timezoneOffset: -300, // UTC-5 (e.g., EST)
      });

      const data = [basal];
      const pumpSettings = createPumpSettings();

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      dataUtil.addMissingSuppressedBasals(data);

      expect(basal.suppressed).to.be.an('object');
      expect(basal.suppressed.rate).to.equal(0.5); // 12AM-6AM rate
    });

    it('should preserve deviceTime in split basals when available', () => {
      const basal = createBasal({
        deviceTime: '2018-02-01T11:00:00',
        duration: 2 * MS_IN_HOUR,
      });

      const data = [basal];
      const pumpSettings = createPumpSettings();

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      dataUtil.addMissingSuppressedBasals(data);

      const newBasal = data[data.length - 1];
      expect(newBasal.deviceTime).to.equal(basal.deviceTime + MS_IN_HOUR);
      expect(newBasal.suppressed.deviceTime).to.equal(newBasal.deviceTime);
    });

    it('should use the most recent pump settings datum for basal time', () => {
      const olderPumpSettings = createPumpSettings({
        id: 'pumpSettings0',
        deviceTime: '2018-01-31T00:00:00',
        basalSchedules: {
          standard: [{ start: 0, rate: 0.3 }],
        },
      });

      const newerPumpSettings = createPumpSettings({
        id: 'pumpSettings1',
        deviceTime: '2018-02-01T00:00:00',
        basalSchedules: {
          standard: [{ start: 0, rate: 0.9 }],
        },
      });

      const basal = createBasal({
        deviceTime: '2018-02-01T10:00:00',
      });

      const data = [basal];

      dataUtil.pumpSettingsDatumsByIdMap = {
        [olderPumpSettings.id]: olderPumpSettings,
        [newerPumpSettings.id]: newerPumpSettings,
      };

      dataUtil.addMissingSuppressedBasals(data);

      expect(basal.suppressed.rate).to.equal(0.9); // Should use newer settings
    });

    it('should use the most recent pump settings datum for basal time with a matching deviceId', () => {
      const olderPumpSettings = createPumpSettings({
        id: 'pumpSettings0',
        deviceTime: '2018-01-31T00:00:00',
        basalSchedules: {
          standard: [{ start: 0, rate: 0.3 }],
        },
      });

      const newerPumpSettings = createPumpSettings({
        id: 'pumpSettings1',
        deviceTime: '2018-02-01T00:00:00',
        deviceId: 'deviceId2',
        basalSchedules: {
          standard: [{ start: 0, rate: 0.6 }],
        },
      });

      const newestPumpSettings = createPumpSettings({
        id: 'pumpSettings2',
        deviceTime: '2018-02-01T01:00:00',
        basalSchedules: {
          standard: [{ start: 0, rate: 0.9 }],
        },
      });

      const basal = createBasal({
        deviceTime: '2018-02-01T10:00:00',
        deviceId: 'deviceId2',
      });

      const data = [basal];

      dataUtil.pumpSettingsDatumsByIdMap = {
        [olderPumpSettings.id]: olderPumpSettings,
        [newerPumpSettings.id]: newerPumpSettings,
        [newestPumpSettings.id]: newestPumpSettings,
      };

      dataUtil.addMissingSuppressedBasals(data);

      expect(basal.suppressed.rate).to.equal(0.6); // Should not use newest settings, since deviceId does not match
    });

    it('should handle basals that span multiple segments correctly', () => {
      const basal = createBasal({
        deviceTime: '2018-02-01T05:00:00', // 5:00 AM
        duration: 8 * MS_IN_HOUR, // Spans 3 segments: 12AM-6AM, 6AM-12PM, 12PM-6PM
      });

      const data = [basal];
      const pumpSettings = createPumpSettings();

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      dataUtil.addMissingSuppressedBasals(data);

      // Should have added 2 additional basals (for segments 2 and 3)
      expect(data.length).to.equal(3);

      // Verify rates for each segment
      expect(basal.suppressed.rate).to.equal(0.5); // 12AM-6AM rate
      expect(data[1].suppressed.rate).to.equal(0.8); // 6AM-12PM rate
      expect(data[2].suppressed.rate).to.equal(0.6); // 12PM-6PM rate
    });

    it('should handle zero rate segments correctly', () => {
      const pumpSettings = createPumpSettings({
        basalSchedules: {
          standard: [
            { start: 0, rate: 0.0 }, // Zero rate segment
            { start: 6 * MS_IN_HOUR, rate: 0.8 },
          ],
        },
      });

      const basal = createBasal({
        deviceTime: '2018-02-01T02:00:00', // Falls in zero rate segment
      });

      const data = [basal];

      dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

      dataUtil.addMissingSuppressedBasals(data);

      expect(basal.suppressed.rate).to.equal(0.0);
    });

    context('integration with addData', () => {
      it('should call addMissingSuppressedBasals during data processing', () => {
        const spy = sinon.spy(dataUtil, 'addMissingSuppressedBasals');

        const basal = createBasal();
        const pumpSettings = createPumpSettings();

        dataUtil.addData([basal, pumpSettings], defaultPatientId);

        expect(spy.calledOnce).to.be.true;
        spy.restore();
      });

      it('should generate suppressed basals for raw data added in', () => {
        const basal = createBasal(useRawData);
        const pumpSettings = createPumpSettings(useRawData);

        dataUtil.addData([basal, pumpSettings], defaultPatientId);

        // Retrieve the processed basal
        dataUtil.filter.byType('basal');
        const processedBasals = dataUtil.dimension.byType.top(Infinity);
        const processedBasal = _.find(processedBasals, { id: basal.id });

        expect(processedBasal.suppressed).to.be.an('object');
        expect(processedBasal.suppressed.deliveryType).to.equal('scheduled');
      });
    });

    context('temp delivery type', () => {
      it('should process temp basals same as automated basals', () => {
        const basal = createBasal({
          deliveryType: 'temp',
        });

        const data = [basal];
        const pumpSettings = createPumpSettings();

        dataUtil.pumpSettingsDatumsByIdMap = { [pumpSettings.id]: pumpSettings };

        dataUtil.addMissingSuppressedBasals(data);

        expect(basal.suppressed).to.be.an('object');
        expect(basal.suppressed.deliveryType).to.equal('scheduled');
      });
    });
  });
});
