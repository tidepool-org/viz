import _ from 'lodash';

import DataUtil from '../../src/utils/DataUtil';
import AggregationUtil from '../../src/utils/AggregationUtil';
import { types as Types, generateGUID } from '../../data/types';
import { MGDL_UNITS } from '../../src/utils/constants';

/* eslint-disable max-len, no-underscore-dangle */

describe.only('AggregationUtil', () => {
  let aggregationUtil;

  const useRawData = {
    raw: true,
  };

  const basal = new Types.Basal({ deviceTime: '2018-02-01T01:00:00', ...useRawData });
  const automatedBasal = { ...basal, deliveryType: 'automated' };
  const tempBasal = { ...basal, deliveryType: 'temp' };
  const suspendedBasal = { ...basal, deviceTime: '2018-02-02T01:00:00', deliveryType: 'suspend', rate: 0 };

  const basalData = _.map([
    automatedBasal,
    tempBasal,
    suspendedBasal,
  ], d => ({ ..._.toPlainObject(d), id: generateGUID() }));

  const bolus = new Types.Bolus({ deviceTime: '2018-02-01T01:00:00', value: 1, ...useRawData });
  const correctionBolus = { ...bolus, recommended: { correction: 1, carb: 0 } };
  const extendedBolus = { ...bolus, extended: 1, duration: 1, subType: 'square' };
  const interruptedBolus = { ...bolus, normal: 1, expectedNormal: 2 };
  const manualBolus = { ...bolus, wizard: undefined };
  const overrideBolus = { ...bolus, normal: 2, recommended: { net: 1 } };
  const underrideBolus = { ...bolus, normal: 1, recommended: { net: 2 } };
  const wizardBolus = { ...bolus, deviceTime: '2018-02-02T01:00:00', wizard: '12345' };

  const bolusData = _.map([
    correctionBolus,
    extendedBolus,
    interruptedBolus,
    manualBolus,
    overrideBolus,
    underrideBolus,
    wizardBolus,
  ], d => ({ ..._.toPlainObject(d), id: generateGUID() }));

  const calibrationData = [
    new Types.DeviceEvent({
      deviceTime: '2018-02-01T01:00:00',
      subType: 'calibration',
      ...useRawData,
    }),
    new Types.DeviceEvent({
      deviceTime: '2018-02-01T02:00:00',
      subType: 'calibration',
      ...useRawData,
    }),
    new Types.DeviceEvent({
      deviceTime: '2018-02-01T03:00:00',
      subType: 'calibration',
      ...useRawData,
    }),
  ];

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

  const data = [
    ...basalData,
    ...bolusData,
    // ...calibrationData,
    // ...smbgData,
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
    const dataUtil = new DataUtil(dataset);
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
        veryHighThreshold: 250,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 54,
      });
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
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.total).to.equal(3);
    });

    it('should summarize average daily number of basal events in the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.avgPerDay).to.equal(1.5);
    });

    it('should summarize total `suspend`, `automatedStop`, and `temp` basal events for the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.subtotals.automatedStop.count).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.subtotals.temp.count).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.subtotals.suspend.count).to.equal(1);
    });

    it('should summarize percentage of `suspend`, `automatedStop`, and `temp` basal events for the entire date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.subtotals.automatedStop.percentage).to.equal(1 / 3);
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.subtotals.temp.percentage).to.equal(1 / 3);
      expect(aggregationUtil.aggregateBasals(groupByDate).summary.subtotals.suspend.percentage).to.equal(1 / 3);
    });

    it('should summarize total count for all basal events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).byDate['2018-02-01'].total).to.equal(2);
      expect(aggregationUtil.aggregateBasals(groupByDate).byDate['2018-02-02'].total).to.equal(1);
    });

    it('should count total `suspend`, `automatedStop`, and `temp` basal events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBasals(groupByDate).byDate['2018-02-01'].subtotals.automatedStop).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).byDate['2018-02-01'].subtotals.temp).to.equal(1);
      expect(aggregationUtil.aggregateBasals(groupByDate).byDate['2018-02-02'].subtotals.suspend).to.equal(1);
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

    it('should summarize total count for all bolus events in the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.total).to.equal(7);
    });

    it('should summarize average daily number of bolus events in the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.avgPerDay).to.equal(3.5);
    });


    it('should summarize total `correction`, `extended`, `interrupted`, `manual`, `override`, `underride`, and `wizard` bolus events for the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.correction.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.extended.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.interrupted.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.manual.count).to.equal(6);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.override.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.underride.count).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.wizard.count).to.equal(1);
    });

    it('should summarize percentage of `correction`, `extended`, `interrupted`, `manual`, `override`, `underride`, and `wizard` bolus events for the entire date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.correction.percentage).to.equal(1 / 7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.extended.percentage).to.equal(1 / 7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.interrupted.percentage).to.equal(1 / 7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.manual.percentage).to.equal(6 / 7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.override.percentage).to.equal(1 / 7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.underride.percentage).to.equal(1 / 7);
      expect(aggregationUtil.aggregateBoluses(groupByDate).summary.subtotals.wizard.percentage).to.equal(1 / 7);
    });

    it('should summarize total count for all bolus events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].total).to.equal(6);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-02'].total).to.equal(1);
    });

    it('should count total `correction`, `extended`, `interrupted`, `manual`, `override`, `underride`, and `wizard` bolus events for each date in the date range', () => {
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.correction).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.extended).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.interrupted).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.manual).to.equal(6);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.override).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-01'].subtotals.underride).to.equal(1);
      expect(aggregationUtil.aggregateBoluses(groupByDate).byDate['2018-02-02'].subtotals.wizard).to.equal(1);
    });
  });
});
