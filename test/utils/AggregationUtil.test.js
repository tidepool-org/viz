import _ from 'lodash';

import DataUtil from '../../src/utils/DataUtil';
import AggregationUtil from '../../src/utils/AggregationUtil';
import { types as Types, generateGUID } from '../../data/types';
import { MGDL_UNITS, MGDL_PER_MMOLL } from '../../src/utils/constants';

/* eslint-disable max-len, no-underscore-dangle */

describe('AggregationUtil', () => {
  let aggregationUtil;

  const patientId = 'abc123';

  const useRawData = {
    raw: true,
  };

  const basal = new Types.Basal({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
  const automatedBasal = { ...basal, deliveryType: 'automated' };
  const tempBasal = { ...basal, deliveryType: 'temp' };
  const suspendedBasal = { ...basal, deviceTime: '2018-02-02T01:00:00', deliveryType: 'suspend', rate: 0 };
  const automatedSuspendBasal = new Types.DeviceEvent({
    deviceTime: '2018-02-01T01:00:00',
    subType: 'status',
    status: 'suspended',
    reason: { suspended: 'automatic' },
    payload: { suspended: { reason: 'Auto suspend by PLGS' } },
    ...useRawData,
  });

  const basalData = _.map([
    automatedBasal,
    tempBasal,
    suspendedBasal,
    automatedSuspendBasal,
  ], d => ({ ..._.toPlainObject(d), id: generateGUID() }));

  const bolus = new Types.Bolus({ deviceTime: '2018-02-01T01:00:00', value: 1, ...useRawData });
  const correctionBolus = { ...bolus, recommended: { correction: 1, carb: 0 } };
  const extendedBolus = { ...bolus, extended: 1, duration: 1, subType: 'square' };
  const interruptedBolus = { ...bolus, normal: 1, expectedNormal: 2 };
  const manualBolus = { ...bolus, wizard: undefined };
  const automatedBolus = { ...manualBolus, subType: 'automated' };
  const overrideBolus = { ...bolus, normal: 2, recommended: { net: 1 } };
  const underrideBolus = { ...bolus, normal: 1, recommended: { net: 2 } };
  const wizardBolus = { ...bolus, deviceTime: '2018-02-02T01:00:00', wizard: '12345' };
  const oneButtonBolus = { ...bolus, deliveryContext: 'oneButton' };

  const bolusData = _.map([
    correctionBolus,
    extendedBolus,
    interruptedBolus,
    manualBolus,
    automatedBolus,
    overrideBolus,
    underrideBolus,
    wizardBolus,
    oneButtonBolus
  ], d => ({ ..._.toPlainObject(d), id: generateGUID() }));

  const calibration = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', subType: 'calibration', ...useRawData });

  const smbg = new Types.SMBG({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
  const manualSMBG = { ...smbg, subType: 'manual' };
  const meterSMBG = { ...smbg, subType: undefined };
  const veryHighSMBG = { ...smbg, value: 251 / MGDL_PER_MMOLL };
  const veryLowSMBG = { ...smbg, deviceTime: '2018-02-02T01:00:00', value: 53 / MGDL_PER_MMOLL };

  const fingerstickData = _.map([
    calibration,
    manualSMBG,
    meterSMBG,
    veryHighSMBG,
    veryLowSMBG,
  ], d => ({ ..._.toPlainObject(d), id: generateGUID() }));

  const insulinDose = new Types.Insulin({ deviceTime: '2018-02-02T01:00:00', ...useRawData });
  const insulinData = _.map([
    insulinDose,
  ], d => ({ ..._.toPlainObject(d), id: generateGUID() }));

  const siteChange = new Types.DeviceEvent({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
  const cannulaPrime = { ...siteChange, subType: 'prime', primeTarget: 'cannula' };
  const reservoirChange = { ...siteChange, subType: 'reservoirChange' };
  const tubingPrime = { ...siteChange, deviceTime: '2018-02-02T01:00:00', subType: 'prime', primeTarget: 'tubing' };
  const cannulaPrimeNextDay = { ...cannulaPrime, deviceTime: '2018-02-02T01:00:00' };

  const siteChangeData = _.map([
    cannulaPrime,
    reservoirChange,
    tubingPrime,
    cannulaPrimeNextDay,
  ], d => ({ ..._.toPlainObject(d), id: generateGUID() }));

  const data = [
    ...basalData,
    ...bolusData,
    ...fingerstickData,
    ...insulinData,
    ...siteChangeData,
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

  const twoDayEndpoints = [
    '2018-02-01T00:00:00.000Z',
    '2018-02-03T00:00:00.000Z',
  ];

  const threeDayEndpoints = [
    '2018-02-01T00:00:00.000Z',
    '2018-02-04T00:00:00.000Z',
  ];

  const defaultOpts = {
    bgPrefs,
    endpoints: twoDayEndpoints,
  };

  const filterEndpoints = newEndpoints => {
    if (newEndpoints) aggregationUtil.dataUtil.query({ endpoints: newEndpoints });
    aggregationUtil.dataUtil.activeEndpoints = aggregationUtil.dataUtil.endpoints.current;
    aggregationUtil.init(aggregationUtil.dataUtil);
    aggregationUtil.dataUtil.clearFilters();
    aggregationUtil.dataUtil.filter.byEndpoints(aggregationUtil.dataUtil.activeEndpoints.range);
  };

  const createAggregationUtil = (dataset, query) => {
    const dataUtil = new DataUtil();
    dataUtil.addData(dataset, patientId);
    dataUtil.query(query);
    dataUtil.activeEndpoints = dataUtil.endpoints.current;

    aggregationUtil = new AggregationUtil(dataUtil);
    filterEndpoints();

    return aggregationUtil;
  };

  beforeEach(() => {
    aggregationUtil = createAggregationUtil(data, defaultOpts);
  });

  describe('constructor', () => {
    it('should set a reference to the data util', () => {
      expect(aggregationUtil.dataUtil).instanceof(DataUtil);
    });

    it('should set `bgBounds` from bgPrefs option', () => {
      expect(aggregationUtil.bgBounds).to.eql({
        extremeHighThreshold: 350,
        veryHighThreshold: 250,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 54,
        clampThreshold: 600,
      });
    });

    it('should set `timezoneName` from timePrefs option', () => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        timePrefs: { timezoneName: 'US/Eastern' },
      });
      expect(aggregationUtil.timezoneName).to.eql('US/Eastern');
    });

    it('should set `timezoneName` to `UTC` when not provided from timePrefs option', () => {
      expect(aggregationUtil.timezoneName).to.eql('UTC');
    });

    it('should set `initialActiveEndpoints` as clone of dataUtil.activeEndpoints', () => {
      expect(aggregationUtil.initialActiveEndpoints).to.eql(aggregationUtil.dataUtil.activeEndpoints);
    });
  });

  describe('aggregateBasals', () => {
    let groupByDate;

    beforeEach(() => {
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();
    });

    afterEach(() => {
      groupByDate.dispose();
    });

    it('should summarize total count for all basal events in the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.total).to.equal(3);
    });

    it('should summarize average daily number of basal events in the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.avgPerDay).to.equal(1.5);
    });

    it('should summarize total `suspend`, `automatedStop`, and `temp` basal events for the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.subtotals.automatedStop.count).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.subtotals.temp.count).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.subtotals.suspend.count).to.equal(1);
    });

    it('should summarize percentage of `suspend`, `automatedStop`, and `temp` basal events for the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.subtotals.automatedStop.percentage).to.equal(1 / 3);
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.subtotals.temp.percentage).to.equal(1 / 3);
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.summary.subtotals.suspend.percentage).to.equal(1 / 3);
    });

    it('should summarize total count for all basal events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.byDate['2018-02-01'].total).to.equal(2);
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.byDate['2018-02-02'].total).to.equal(1);
    });

    it('should count total `suspend`, `automatedStop`, and `temp` basal events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.byDate['2018-02-01'].subtotals.automatedStop).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.byDate['2018-02-01'].subtotals.temp).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).basal.byDate['2018-02-02'].subtotals.suspend).to.equal(1);
    });

    it('should summarize total count for all automatedSuspend events in the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).automatedSuspend.summary.total).to.equal(1);
    });

    it('should summarize average daily number of automatedSuspend events in the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).automatedSuspend.summary.avgPerDay).to.equal(0.5);
    });

    it('should summarize total `automatedSuspend` events for the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).automatedSuspend.summary.subtotals.automatedSuspend.count).to.equal(1);
    });

    it('should summarize percentage of `automatedSuspend` events for the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).automatedSuspend.summary.subtotals.automatedSuspend.percentage).to.equal(1);
    });

    it('should summarize total count for all automatedSuspend events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).automatedSuspend.byDate['2018-02-01'].total).to.equal(1);
    });

    it('should count total `automatedSuspend` events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).automatedSuspend.byDate['2018-02-01'].subtotals.automatedSuspend).to.equal(1);
    });
  });

  describe('aggregateBoluses', () => {
    let groupByDate;

    beforeEach(() => {
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();
    });

    afterEach(() => {
      groupByDate.dispose();
    });

    it('should summarize total count for all non-automated bolus events in the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.total).to.equal(9);
    });

    it('should summarize average daily number of bolus events in the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.avgPerDay).to.equal(4.5);
    });

    it('should summarize total `correction`, `extended`, `interrupted`, `manual`, `automated`, `oneButton`, `override`, `underride`, and `wizard` bolus events for the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.correction.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.extended.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.interrupted.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.manual.count).to.equal(8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.automated.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.oneButton.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.override.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.underride.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.wizard.count).to.equal(1);
    });

    it('should summarize percentage of `correction`, `extended`, `interrupted`, `manual`, `automated`, `oneButton`, `override`, `underride`, and `wizard` bolus events for the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.correction.percentage).to.equal(1 / 8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.extended.percentage).to.equal(1 / 8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.interrupted.percentage).to.equal(1 / 8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.manual.percentage).to.equal(8 / 9);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.automated.percentage).to.equal(1 / 8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.oneButton.percentage).to.equal(1 / 8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.override.percentage).to.equal(1 / 8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.underride.percentage).to.equal(1 / 8);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.wizard.percentage).to.equal(1 / 8);
    });

    it('should summarize total count for all bolus events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].total).to.equal(7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-02'].total).to.equal(2);
    });

    it('should count total `correction`, `extended`, `interrupted`, `manual`, `automated`, `override`, `underride`, and `wizard` bolus events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.correction).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.extended).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.interrupted).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.manual).to.equal(7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.automated).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.oneButton).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.override).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.underride).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-02'].subtotals.wizard).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-02'].subtotals.manual).to.equal(1);
    });
  });

  describe('aggregateFingersticks', () => {
    let groupByDate;

    beforeEach(() => {
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();
    });

    afterEach(() => {
      groupByDate.dispose();
    });

    it('should summarize total count for all fingerstick events in the entire date range', () => {
      expect(aggregationUtil.aggregateFingersticks(groupByDate).calibration.summary.total).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.total).to.equal(4);
    });

    it('should summarize average daily number of fingerstick events in the entire date range', () => {
      expect(aggregationUtil.aggregateFingersticks(groupByDate).calibration.summary.avgPerDay).to.equal(0.5);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.avgPerDay).to.equal(2);
    });

    it('should summarize total `calibration`, `manual`, `meter`, `veryHigh`, and `veryLow` fingerstick events for the entire date range', () => {
      expect(aggregationUtil.aggregateFingersticks(groupByDate).calibration.summary.subtotals.calibration.count).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.manual.count).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.meter.count).to.equal(3);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.veryHigh.count).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.veryLow.count).to.equal(1);
    });

    it('should summarize percentage of `calibration`, `manual`, `meter`, `veryHigh`, and `veryLow` fingerstick events for the entire date range', () => {
      expect(aggregationUtil.aggregateFingersticks(groupByDate).calibration.summary.subtotals.calibration.percentage).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.manual.percentage).to.equal(1 / 4);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.meter.percentage).to.equal(3 / 4);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.veryHigh.percentage).to.equal(1 / 4);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.summary.subtotals.veryLow.percentage).to.equal(1 / 4);
    });

    it('should summarize total count for all fingerstick events for each date in the date range', () => {
      expect(aggregationUtil.aggregateFingersticks(groupByDate).calibration.byDate['2018-02-01'].total).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.byDate['2018-02-01'].total).to.equal(3);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.byDate['2018-02-02'].total).to.equal(1);
    });

    it('should count total `calibration`, `manual`, `meter`, `veryHigh`, and `veryLow` fingerstick events for each date in the date range', () => {
      expect(aggregationUtil.aggregateFingersticks(groupByDate).calibration.byDate['2018-02-01'].subtotals.calibration).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.byDate['2018-02-01'].subtotals.manual).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.byDate['2018-02-01'].subtotals.meter).to.equal(2);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.byDate['2018-02-01'].subtotals.veryHigh).to.equal(1);
      expect(aggregationUtil.aggregateFingersticks(groupByDate).smbg.byDate['2018-02-02'].subtotals.veryLow).to.equal(1);
    });
  });

  describe('aggregateSiteChanges', () => {
    let groupByDate;

    beforeEach(() => {
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();
    });

    afterEach(() => {
      groupByDate.dispose();
    });

    it('should summarize days since previous siteChange for all siteChange events for each date in the date range', () => {
      expect(aggregationUtil.aggregateSiteChanges(groupByDate).byDate['2018-02-02'].summary.daysSince).to.eql({ cannulaPrime: 1, tubingPrime: NaN });
    });

    it('should count total `cannulaPrime`, `reservoirChange`, and `tubingPrime` siteChange events for each date in the date range', () => {
      expect(aggregationUtil.aggregateSiteChanges(groupByDate).byDate['2018-02-01'].subtotals.cannulaPrime).to.equal(1);
      expect(aggregationUtil.aggregateSiteChanges(groupByDate).byDate['2018-02-01'].subtotals.reservoirChange).to.equal(1);
      expect(aggregationUtil.aggregateSiteChanges(groupByDate).byDate['2018-02-02'].subtotals.tubingPrime).to.equal(1);
      expect(aggregationUtil.aggregateSiteChanges(groupByDate).byDate['2018-02-02'].subtotals.cannulaPrime).to.equal(1);
    });
  });

  describe('aggregateDataByDate', () => {
    let groupByDate;

    beforeEach(() => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        types: { smbg: {}, bolus: {} },
      });
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();
    });

    afterEach(() => {
      groupByDate.dispose();
    });

    it('should aggregate the data by date and by the types set in `dataUtil.types`', () => {
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-02'].bolus).to.be.an('array').and.have.lengthOf(1);
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-01'].bolus).to.be.an('array').and.have.lengthOf(8);
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-02'].smbg).to.be.an('array').and.have.lengthOf(1);
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-01'].smbg).to.be.an('array').and.have.lengthOf(3);
    });

    it('should aggregate data by date correctly if endpoints go beyond the available data range', () => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        endpoints: threeDayEndpoints,
        types: { smbg: {}, bolus: {} },
      });
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();

      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-02'].bolus).to.be.an('array').and.have.lengthOf(1);
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-01'].bolus).to.be.an('array').and.have.lengthOf(8);
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-02'].smbg).to.be.an('array').and.have.lengthOf(1);
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-01'].smbg).to.be.an('array').and.have.lengthOf(3);
      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-03']).to.be.undefined;
    });

    it('should add basals overlapping start of each date range', () => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        types: { basal: {} },
      });
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();

      aggregationUtil.dataUtil.addBasalOverlappingStart = sinon.stub().callsFake(basals => {
        basals.unshift('basal overlapping start');
      });

      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-01'].basal).to.be.an('array').and.contain('basal overlapping start');
    });

    it('should add pumpSettingsOverride datums overlapping start of each date range', () => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        types: { deviceEvent: {} },
      });
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();

      aggregationUtil.dataUtil.addPumpSettingsOverrideOverlappingStart = sinon.stub().callsFake(overrides => {
        overrides.unshift('pump settings override overlapping start');
      });

      expect(aggregationUtil.aggregateDataByDate(groupByDate)['2018-02-01'].deviceEvent).to.be.an('array').and.contain('pump settings override overlapping start');
    });

    it('should reset endpoint filters to initial values after processing', () => {
      const byEndpointsSpy = sinon.spy(aggregationUtil.dataUtil.filter, 'byEndpoints');
      aggregationUtil.aggregateDataByDate(groupByDate);
      sinon.assert.callCount(byEndpointsSpy, 11);
      expect(byEndpointsSpy.getCall(10).args[0]).to.eql(aggregationUtil.initialActiveEndpoints.range);
    });

    it('should reset `dataUtil.activeEndpoints` to initial values after processing', () => {
      aggregationUtil.aggregateDataByDate(groupByDate);
      expect(aggregationUtil.dataUtil.activeEndpoints).to.eql(aggregationUtil.initialActiveEndpoints);
    });
  });

  describe('aggregateStatsByDate', () => {
    let groupByDate;

    beforeEach(() => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        stats: 'averageGlucose, timeInRange',
      });
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();
    });

    afterEach(() => {
      groupByDate.dispose();
    });

    it('should aggregate stats by date as set in `dataUtil.stats`', () => {
      expect(aggregationUtil.aggregateStatsByDate(groupByDate)['2018-02-02'].averageGlucose).to.be.an('object').and.have.keys([
        'total',
        'averageGlucose',
      ]);

      expect(aggregationUtil.aggregateStatsByDate(groupByDate)['2018-02-01'].timeInRange.counts).to.be.an('object').and.have.keys([
        'total',
        'veryLow',
        'low',
        'target',
        'high',
        'veryHigh',
      ]);

      expect(aggregationUtil.aggregateStatsByDate(groupByDate)['2018-02-01'].timeInRange.durations).to.be.an('object').and.have.keys([
        'total',
        'veryLow',
        'low',
        'target',
        'high',
        'veryHigh',
      ]);
    });

    it('should aggregate stats by date correctly if endpoints go beyond the available data range', () => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        endpoints: threeDayEndpoints,
        stats: 'averageGlucose, timeInRange',
      });
      groupByDate = aggregationUtil.dataUtil.dimension.byDate.group();

      expect(aggregationUtil.aggregateStatsByDate(groupByDate)['2018-02-02'].averageGlucose).to.be.an('object').and.have.keys([
        'total',
        'averageGlucose',
      ]);

      expect(aggregationUtil.aggregateStatsByDate(groupByDate)['2018-02-01'].timeInRange.counts).to.be.an('object').and.have.keys([
        'total',
        'veryLow',
        'low',
        'target',
        'high',
        'veryHigh',
      ]);

      expect(aggregationUtil.aggregateStatsByDate(groupByDate)['2018-02-01'].timeInRange.durations).to.be.an('object').and.have.keys([
        'total',
        'veryLow',
        'low',
        'target',
        'high',
        'veryHigh',
      ]);

      expect(aggregationUtil.aggregateStatsByDate(groupByDate)['2018-02-03']).to.be.undefined;
    });

    it('should reset endpoint filters to initial values after processing', () => {
      const byEndpointsSpy = sinon.spy(aggregationUtil.dataUtil.filter, 'byEndpoints');
      aggregationUtil.aggregateStatsByDate(groupByDate);
      sinon.assert.callCount(byEndpointsSpy, 3);
      expect(byEndpointsSpy.getCall(2).args[0]).to.eql(aggregationUtil.initialActiveEndpoints.range);
    });

    it('should reset `dataUtil.activeEndpoints` to initial values after processing', () => {
      aggregationUtil.aggregateStatsByDate(groupByDate);
      expect(aggregationUtil.dataUtil.activeEndpoints).to.eql(aggregationUtil.initialActiveEndpoints);
    });
  });

  describe('filterByActiveRange', () => {
    const mockResultsArg = [
      { key: '2025-08-04', value: { dataList: [] } },
      { key: '2025-08-05', value: { dataList: [] } },
      { key: '2025-08-06', value: { dataList: [] } },
      { key: '2025-08-07', value: { dataList: [] } },
      { key: '2025-08-08', value: { dataList: [] } },
      { key: '2025-08-09', value: { dataList: [] } },
    ];

    beforeEach(() => {
      aggregationUtil = createAggregationUtil(data, {
        ...defaultOpts,
        timePrefs: { timezoneName: 'US/Eastern' },
      });
    });

    it('does NOT include data from the last date when endpoint range ends at midnight', () => {
      aggregationUtil.initialActiveEndpoints.range = [
        1754366400000, // 2025-08-05 at 00:00 (midnight) in US/Eastern
        1754625600000, // 2025-08-08 at 00:00 (midnight) in US/Eastern
      ];

      // Here, we should only return data that occurred on the 5th, 6th, and 7th
      expect(aggregationUtil.filterByActiveRange(mockResultsArg)).to.deep.equal([
        { key: '2025-08-05', value: { dataList: [] } },
        { key: '2025-08-06', value: { dataList: [] } },
        { key: '2025-08-07', value: { dataList: [] } },
      ]);
    });

    it('includes data from the last date when endpoint range does NOT end at midnight', () => {
      aggregationUtil.initialActiveEndpoints.range = [
        1754380800000, // 2025-08-05 at 4:00 AM in US/Eastern
        1754640000000, // 2025-08-08 at 4:00 AM in US/Eastern
      ];

      // Here, we should return data that occurred on the 5th, 6th, 7th, and 8th
      expect(aggregationUtil.filterByActiveRange(mockResultsArg)).to.deep.equal([
        { key: '2025-08-05', value: { dataList: [] } },
        { key: '2025-08-06', value: { dataList: [] } },
        { key: '2025-08-07', value: { dataList: [] } },
        { key: '2025-08-08', value: { dataList: [] } },
      ]);
    });
  });
});
