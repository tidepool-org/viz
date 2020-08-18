import _ from 'lodash';

import DataUtil from '../../src/utils/DataUtil';
import StatUtil from '../../src/utils/StatUtil';
import { types as Types, generateGUID } from '../../data/types';
import { MGDL_UNITS, MS_IN_DAY, MS_IN_HOUR, MS_IN_MIN } from '../../src/utils/constants';
/* eslint-disable max-len, no-underscore-dangle */

describe('StatUtil', () => {
  let statUtil;

  const patientId = 'abc123';

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
      deviceTime: '2018-02-01T02:00:00',
      carbInput: 4,
      ...useRawData,
    }),
    new Types.Wizard({
      deviceTime: '2018-02-01T03:00:00',
      ...useRawData,
    }),
    new Types.Wizard({
      deviceTime: '2018-02-01T04:00:00',
      carbInput: 2,
      ...useRawData,
    }),
    new Types.Wizard({
      deviceTime: '2018-02-02T04:00:00',
      carbInput: 10,
      ...useRawData,
    }),
  ], _.toPlainObject);

  const data = [
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

  const defaultOpts = {
    bgPrefs,
    endpoints: dayEndpoints,
  };

  const opts = overrides => _.assign({}, defaultOpts, overrides);

  const filterEndpoints = newEndpoints => {
    if (newEndpoints) statUtil.dataUtil.query({ endpoints: newEndpoints });
    statUtil.dataUtil.activeEndpoints = statUtil.dataUtil.endpoints.current;
    statUtil.init(statUtil.dataUtil);
    statUtil.dataUtil.clearFilters();
    statUtil.dataUtil.filter.byEndpoints(statUtil.endpoints);
  };

  const createStatUtil = (dataset, query) => {
    const dataUtil = new DataUtil();
    dataUtil.addData(dataset, patientId);
    dataUtil.query(query);
    dataUtil.activeEndpoints = dataUtil.endpoints.current;

    statUtil = new StatUtil(dataUtil);
    filterEndpoints();

    return statUtil;
  };

  beforeEach(() => {
    statUtil = createStatUtil(data, defaultOpts);
  });

  describe('constructor', () => {
    it('should set a reference to the data util', () => {
      expect(statUtil.dataUtil).instanceof(DataUtil);
    });

    it('should set `bgBounds` from bgPrefs option', () => {
      expect(statUtil.bgBounds).to.eql({
        veryHighThreshold: 250,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 54,
        clampThreshold: 600,
      });
    });

    it('should set `bgUnits` from bgPrefs option', () => {
      expect(statUtil.bgUnits).to.eql(MGDL_UNITS);
    });

    it('should set `bgSource` from the current bg source of the provided dataUtil', () => {
      expect(statUtil.bgSource).to.equal('cbg');
    });

    it('should set `activeDays` from active endpoints', () => {
      expect(statUtil.activeDays).to.be.a('number');
    });

    it('should set `endpoints` from active endpoints of the provided dataUtil', () => {
      expect(statUtil.endpoints).to.be.an('array');
      expect(statUtil.endpoints).to.eql(_.map(dayEndpoints, Date.parse));
    });
  });

  describe('getAverageGlucoseData', () => {
    it('should return the median glucose for cbg data', () => {
      statUtil.bgSource = 'cbg';
      expect(statUtil.getAverageGlucoseData()).to.eql({
        averageGlucose: 132,
        total: 5,
      });
    });

    it('should return the median glucose for smbg data', () => {
      statUtil.bgSource = 'smbg';
      expect(statUtil.getAverageGlucoseData()).to.eql({
        averageGlucose: 136,
        total: 5,
      });
    });

    it('should return the filtered bg data when `returnBgData` is true', () => {
      statUtil.bgSource = 'smbg';
      expect(statUtil.getAverageGlucoseData(true).bgData).to.be.an('array').and.have.length(5);
    });
  });

  describe('getBasalBolusData', () => {
    it('should return the total basal and bolus insulin delivery when viewing 1 day', () => {
      filterEndpoints(dayEndpoints);
      expect(statUtil.getBasalBolusData()).to.eql({
        basal: 1.5,
        bolus: 15,
      });
    });

    it('should return the avg daily total basal and bolus insulin delivery when viewing more than 1 day', () => {
      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getBasalBolusData()).to.eql({
        basal: 0.75,
        bolus: 7.5,
      });
    });

    context('basal delivery overlaps endpoints', () => {
      it('should include the portion of delivery of a basal datum that overlaps the start endpoint', () => {
        filterEndpoints(dayEndpoints);
        statUtil.dataUtil.addData([basalDatumOverlappingStart], patientId);
        expect(statUtil.getBasalBolusData()).to.eql({
          basal: 2,
          bolus: 15,
        });
      });

      it('should include the portion of delivery of a basal datum that overlaps the start endpoint', () => {
        filterEndpoints(dayEndpoints);
        statUtil.dataUtil.addData([basalDatumOverlappingEnd], patientId);
        expect(statUtil.getBasalBolusData()).to.eql({
          basal: 2.5,
          bolus: 15,
        });
      });
    });
  });

  describe('getBgExtentsData', () => {
    it('should return the min and max glucose for cbg data', () => {
      statUtil.bgSource = 'cbg';
      expect(statUtil.getBgExtentsData()).to.eql({
        bgMin: 49.99999999999999,
        bgMax: 260,
      });
    });

    it('should return the min and max glucose for smbg data', () => {
      statUtil.bgSource = 'smbg';
      expect(statUtil.getBgExtentsData()).to.eql({
        bgMin: 60,
        bgMax: 270,
      });
    });
  });

  describe('getCarbsData', () => {
    it('should return the total carbs from wizard and food data when viewing 1 day', () => {
      filterEndpoints(dayEndpoints);
      expect(statUtil.getCarbsData()).to.eql({
        carbs: 22,
        total: 5,
      });
    });

    it('should return the avg daily carbs from wizard and food data when viewing more than 1 day', () => {
      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getCarbsData()).to.eql({
        carbs: 22.5,
        total: 7,
      });
    });
  });

  describe('getCoefficientOfVariationData', () => {
    it('should return the coefficient of variation for cbg data', () => {
      statUtil.bgSource = 'cbg';
      expect(statUtil.getCoefficientOfVariationData()).to.eql({
        coefficientOfVariation: 68.47579720288888,
        total: 5,
      });
    });

    it('should return the coefficient of variation for cbg data', () => {
      statUtil.bgSource = 'smbg';
      expect(statUtil.getCoefficientOfVariationData()).to.eql({
        coefficientOfVariation: 69.0941762401971,
        total: 5,
      });
    });

    it('should return `NaN` when less than 3 datums available', () => {
      statUtil = createStatUtil(smbgData.slice(0, 2), opts({ bgSource: 'smbg' }));
      expect(statUtil.getCoefficientOfVariationData()).to.eql({
        coefficientOfVariation: NaN,
        insufficientData: true,
        total: 2,
      });
    });
  });

  describe('getDailyAverageSums', () => {
    it('should divide each value in the supplied data object by the number of days in the view', () => {
      const sampleData = {
        basal: 56,
        bolus: 28,
      };

      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getDailyAverageSums(sampleData)).to.eql({
        basal: 28,
        bolus: 14,
      });

      filterEndpoints(twoWeekEndpoints);
      expect(statUtil.getDailyAverageSums(sampleData)).to.eql({
        basal: 4,
        bolus: 2,
      });
    });

    it('should not modify the `total` value', () => {
      const sampleData = {
        basal: 56,
        bolus: 28,
        total: 10,
      };

      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getDailyAverageSums(sampleData)).to.eql({
        basal: 28,
        bolus: 14,
        total: 10,
      });

      filterEndpoints(twoWeekEndpoints);
      expect(statUtil.getDailyAverageSums(sampleData)).to.eql({
        basal: 4,
        bolus: 2,
        total: 10,
      });
    });
  });

  describe('getDailyAverageDurations', () => {
    it('should divide each value in the supplied data object by the provided total, and multiply by `MS_IN_DAY`', () => {
      const sampleData = {
        automated: MS_IN_DAY * 1.5,
        manual: MS_IN_DAY * 0.5,
        total: MS_IN_DAY * 2,
      };

      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getDailyAverageDurations(sampleData)).to.eql({
        automated: MS_IN_DAY * 0.75,
        manual: MS_IN_DAY * 0.25,
        total: MS_IN_DAY * 2,
      });
    });

    it('should divide each value in the supplied data object by the sum of values when total is not provided', () => {
      const sampleData = {
        automated: MS_IN_DAY * 1.0,
        manual: MS_IN_DAY * 0.5,
      };

      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getDailyAverageDurations(sampleData)).to.eql({
        automated: MS_IN_DAY * (2 / 3),
        manual: MS_IN_DAY * (1 / 3),
      });
    });
  });

  describe('getGlucoseManagementIndicatorData', () => {
    it('should return the GMI data when viewing at least 14 days of data and 70% coverage', () => {
      const requiredDexcomDatums = 2823; // 288(total daily possible readings) * .7(%required) * 14(days)
      const sufficientData = _.map(
        _.fill(Array(requiredDexcomDatums), cbgData[4], 0, requiredDexcomDatums),
        d => ({ ...d, id: generateGUID() })
      );

      statUtil = createStatUtil(sufficientData, defaultOpts);
      filterEndpoints(twoWeekEndpoints);

      expect(statUtil.getGlucoseManagementIndicatorData()).to.eql({
        glucoseManagementIndicator: 9.5292,
        total: 2823,
      });
    });

    it('should return `NaN` when viewing less than 14 days of data', () => {
      const requiredDexcomDatums = 2823; // 288(total daily possible readings) * .7(%required) * 14(days)
      const sufficientData = _.map(
        _.fill(Array(requiredDexcomDatums), cbgData[4], 0, requiredDexcomDatums),
        d => ({ ...d, id: generateGUID() })
      );

      statUtil = createStatUtil(sufficientData, opts({ endpoints: [
        '2018-02-01T00:00:00.000Z',
        '2018-02-14T00:00:00.000Z',
      ] }));

      expect(statUtil.getGlucoseManagementIndicatorData()).to.eql({
        glucoseManagementIndicator: NaN,
        insufficientData: true,
      });
    });

    it('should return `NaN` when viewing 14 days of data and less than 70% coverage', () => {
      const requiredDexcomDatums = 2823; // 288(total daily possible readings) * .7(%required) * 14(days)
      const count = requiredDexcomDatums - 1;
      const insufficientData = _.map(
        _.fill(Array(count), cbgData[4], 0, count),
        d => ({ ...d, id: generateGUID() })
      );

      statUtil = createStatUtil(insufficientData, defaultOpts);
      filterEndpoints(twoWeekEndpoints);

      expect(statUtil.getGlucoseManagementIndicatorData()).to.eql({
        glucoseManagementIndicator: NaN,
        insufficientData: true,
      });
    });

    it('should return `NaN` when bgSource is `smbg`', () => {
      const requiredDexcomDatums = 2823; // 288(total daily possible readings) * .7(%required) * 14(days)
      const sufficientData = _.map(
        _.fill(Array(requiredDexcomDatums), cbgData[4], 0, requiredDexcomDatums),
        d => ({ ...d, id: generateGUID() })
      );

      statUtil = createStatUtil(sufficientData, opts({ bgSource: 'smbg' }));
      filterEndpoints(twoWeekEndpoints);

      expect(statUtil.getGlucoseManagementIndicatorData()).to.eql({
        glucoseManagementIndicator: NaN,
        insufficientData: true,
      });
    });
  });

  describe('getReadingsInRangeData', () => {
    it('should return the readings in range data when viewing 1 day', () => {
      filterEndpoints(dayEndpoints);
      expect(statUtil.getReadingsInRangeData()).to.eql({
        veryLow: 0,
        low: 1,
        target: 2,
        high: 1,
        veryHigh: 1,
        total: 5,
      });
    });

    it('should return the avg daily readings in range data when viewing more than 1 day', () => {
      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getReadingsInRangeData()).to.eql({
        veryLow: 0,
        low: 0.5,
        target: 1,
        high: 0.5,
        veryHigh: 0.5,
        total: 5,
      });
    });
  });

  describe('getSensorUsage', () => {
    it('should return the duration of sensor usage and total duration of the endpoint range', () => {
      filterEndpoints(dayEndpoints);
      expect(statUtil.getSensorUsage()).to.eql({
        sensorUsage: MS_IN_MIN * 55, // 3 * 15m for libre readings, 2 * 5m for dex readings
        total: MS_IN_DAY,
      });

      filterEndpoints(twoWeekEndpoints);
      expect(statUtil.getSensorUsage()).to.eql({
        sensorUsage: MS_IN_MIN * 55,
        total: MS_IN_DAY * 14,
      });
    });
  });

  describe('getStandardDevData', () => {
    it('should return the average glucose and standard deviation for cbg data', () => {
      statUtil.bgSource = 'cbg';
      expect(statUtil.getStandardDevData()).to.eql({
        averageGlucose: 132,
        standardDeviation: 90.38805230781334,
        total: 5,
      });
    });

    it('should return the average glucose and standard deviation for smbg data', () => {
      statUtil.bgSource = 'smbg';
      expect(statUtil.getStandardDevData()).to.eql({
        averageGlucose: 136,
        standardDeviation: 93.96807968666806,
        total: 5,
      });
    });

    it('should return `NaN` when less than 3 datums available', () => {
      statUtil = createStatUtil(smbgData.slice(0, 2), opts({ bgSource: 'smbg' }));
      expect(statUtil.getStandardDevData()).to.eql({
        averageGlucose: 65,
        standardDeviation: NaN,
        insufficientData: true,
        total: 2,
      });
    });
  });

  describe('getTimeInAutoData', () => {
    it('should return the time spent in automated and manual basal delivery when viewing 1 day', () => {
      filterEndpoints(dayEndpoints);
      expect(statUtil.getTimeInAutoData()).to.eql({
        automated: MS_IN_HOUR,
        manual: MS_IN_HOUR * 2,
      });
    });

    it('should return the avg daily time spent in automated and manual basal delivery when viewing more than 1 day', () => {
      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getTimeInAutoData()).to.eql({
        automated: MS_IN_DAY * (1 / 3),
        manual: MS_IN_DAY * (2 / 3),
      });
    });

    context('basal delivery overlaps endpoints', () => {
      it('should include the portion of delivery of a basal datum that overlaps the start endpoint', () => {
        filterEndpoints(dayEndpoints);
        statUtil.dataUtil.addData([basalDatumOverlappingStart], patientId);
        expect(statUtil.getTimeInAutoData()).to.eql({
          automated: MS_IN_HOUR * 2,
          manual: MS_IN_HOUR * 2,
        });
      });

      it('should include the portion of delivery of a basal datum that overlaps the end endpoint', () => {
        filterEndpoints(dayEndpoints);
        statUtil.dataUtil.addData([basalDatumOverlappingEnd], patientId);
        expect(statUtil.getTimeInAutoData()).to.eql({
          automated: MS_IN_HOUR * 3,
          manual: MS_IN_HOUR * 2,
        });
      });
    });
  });

  describe('getTimeInRangeData', () => {
    it('should return the time in range data when viewing 1 day', () => {
      filterEndpoints(dayEndpoints);
      expect(statUtil.getTimeInRangeData()).to.eql({
        veryLow: MS_IN_MIN * 15,
        low: MS_IN_MIN * 15,
        target: MS_IN_MIN * 15,
        high: MS_IN_MIN * 5,
        veryHigh: MS_IN_MIN * 5,
        total: MS_IN_MIN * 55,
      });
    });

    it('should return the avg daily time in range data when viewing more than 1 day', () => {
      filterEndpoints(twoDayEndpoints);

      const result = statUtil.getTimeInRangeData();
      const totalDuration = result.total;
      expect(result).to.eql({
        veryLow: (MS_IN_MIN * 15) / totalDuration * MS_IN_DAY,
        low: (MS_IN_MIN * 15) / totalDuration * MS_IN_DAY,
        target: (MS_IN_MIN * 15) / totalDuration * MS_IN_DAY,
        high: (MS_IN_MIN * 5) / totalDuration * MS_IN_DAY,
        veryHigh: (MS_IN_MIN * 5) / totalDuration * MS_IN_DAY,
        total: MS_IN_MIN * 55,
      });
    });
  });

  describe('getTotalInsulinData', () => {
    it('should return the total basal and bolus insulin delivery when viewing 1 day', () => {
      filterEndpoints(dayEndpoints);
      expect(statUtil.getTotalInsulinData()).to.eql({
        totalInsulin: 16.5,
      });
    });

    it('should return the avg daily total basal and bolus insulin delivery when viewing more than 1 day', () => {
      filterEndpoints(twoDayEndpoints);
      expect(statUtil.getTotalInsulinData()).to.eql({
        totalInsulin: 8.25,
      });
    });

    context('basal delivery overlaps endpoints', () => {
      it('should include the portion of delivery of a basal datum that overlaps the start endpoint', () => {
        filterEndpoints(dayEndpoints);
        statUtil.dataUtil.addData([basalDatumOverlappingStart], patientId);
        expect(statUtil.getTotalInsulinData()).to.eql({
          totalInsulin: 17,
        });
      });

      it('should include the portion of delivery of a basal datum that overlaps the end endpoint', () => {
        filterEndpoints(dayEndpoints);
        statUtil.dataUtil.addData([basalDatumOverlappingEnd], patientId);
        expect(statUtil.getTotalInsulinData()).to.eql({
          totalInsulin: 17.5,
        });
      });
    });
  });
});
