import React from 'react';
import _ from 'lodash';
import { shallow } from 'enzyme';
import * as stat from '../../src/utils/stat';
import {
  BG_COLORS,
  MS_IN_DAY,
  MS_IN_HOUR,
  MS_IN_MIN,
  MGDL_UNITS,
  MMOLL_UNITS,
} from '../../src/utils/constants';

/* eslint-disable max-len */

describe('stat', () => {
  const {
    commonStats,
    dailyDoseUnitOptions,
    statFormats,
    statTypes,
  } = stat;

  describe('dailyDoseUnitOptions', () => {
    it('should export the `dailyDoseUnitOptions`', () => {
      expect(stat.dailyDoseUnitOptions).to.be.an('array').and.have.length(2);

      expect(stat.dailyDoseUnitOptions[0]).to.eql({
        label: 'kg',
        value: 'kg',
      });

      expect(stat.dailyDoseUnitOptions[1]).to.eql({
        label: 'lb',
        value: 'lb',
      });
    });
  });

  describe('statTypes', () => {
    it('should export the `statTypes`', () => {
      expect(stat.statTypes).to.eql({
        barHorizontal: 'barHorizontal',
        barBg: 'barBg',
        input: 'input',
        simple: 'simple',
      });
    });
  });

  describe('statBgSourceLabels', () => {
    it('should export the `statBgSourceLabels`', () => {
      expect(stat.statBgSourceLabels).to.eql({
        cbg: 'CGM',
        smbg: 'BGM',
      });
    });
  });

  describe('statFormats', () => {
    it('should export the `statFormats`', () => {
      expect(stat.statFormats).to.eql({
        bgCount: 'bgCount',
        bgRange: 'bgRange',
        bgValue: 'bgValue',
        cv: 'cv',
        carbs: 'carbs',
        duration: 'duration',
        gmi: 'gmi',
        percentage: 'percentage',
        standardDevRange: 'standardDevRange',
        standardDevValue: 'standardDevValue',
        units: 'units',
        unitsPerKg: 'unitsPerKg',
      });
    });
  });

  describe('commonStats', () => {
    it('should export the `commonStats`', () => {
      expect(stat.commonStats).to.eql({
        averageGlucose: 'averageGlucose',
        averageDailyDose: 'averageDailyDose',
        bgExtents: 'bgExtents',
        carbs: 'carbs',
        coefficientOfVariation: 'coefficientOfVariation',
        glucoseManagementIndicator: 'glucoseManagementIndicator',
        readingsInRange: 'readingsInRange',
        sensorUsage: 'sensorUsage',
        standardDev: 'standardDev',
        timeInAuto: 'timeInAuto',
        timeInRange: 'timeInRange',
        totalInsulin: 'totalInsulin',
      });
    });
  });

  describe('statFetchMethods', () => {
    it('should export the common `statFetchMethods`', () => {
      expect(stat.statFetchMethods).to.eql({
        averageGlucose: 'getAverageGlucoseData',
        averageDailyDose: 'getTotalInsulinData',
        bgExtents: 'getBgExtentsData',
        carbs: 'getCarbsData',
        coefficientOfVariation: 'getCoefficientOfVariationData',
        glucoseManagementIndicator: 'getGlucoseManagementIndicatorData',
        readingsInRange: 'getReadingsInRangeData',
        sensorUsage: 'getSensorUsage',
        standardDev: 'getStandardDevData',
        timeInAuto: 'getTimeInAutoData',
        timeInRange: 'getTimeInRangeData',
        totalInsulin: 'getBasalBolusData',
      });
    });
  });

  describe('getSum', () => {
    it('should sum up datum values by their `value` key', () => {
      const data = [
        {
          value: 1,
        },
        {
          value: 2,
        },
        {
          value: 3.5,
        },
      ];
      expect(stat.getSum(data)).to.equal(6.5);
    });
  });

  describe('ensureNumeric', () => {
    it('should parse incoming values as floats', () => {
      expect(stat.ensureNumeric('6.5')).to.equal(6.5);
      expect(stat.ensureNumeric(6.0)).to.equal(6);
    });

    it('should convert `NaN`, `null`, or `undefined` to `-1`', () => {
      expect(stat.ensureNumeric(NaN)).to.equal(-1);
      expect(stat.ensureNumeric(null)).to.equal(-1);
      expect(stat.ensureNumeric(undefined)).to.equal(-1);
    });
  });

  describe('formatDatum', () => {
    const defaultData = {
      data: [
        {
          value: 60,
          id: 'low',
        },
        {
          value: 120,
        },
      ],
      total: {
        value: 2,
      },
    };

    const defaultOpts = {
      data: defaultData,
    };

    const opts = overrides => _.assign({}, defaultOpts, overrides);

    context('bgCount format', () => {
      it('should return correctly formatted data when `value >= 0.05`', () => {
        expect(stat.formatDatum({
          value: 2.67777777,
        }, statFormats.bgCount)).to.include({
          value: 2.7,
        });

        expect(stat.formatDatum({
          value: 0.05,
        }, statFormats.bgCount)).to.include({
          value: 0.1,
        });

        // Want 0 decimal places if would end in `.0`
        expect(stat.formatDatum({
          value: 3.0000001,
        }, statFormats.bgCount)).to.include({
          value: 3,
        });
      });

      it('should return correctly formatted data when `value < 0.05`', () => {
        expect(stat.formatDatum({
          value: 0.035,
        }, statFormats.bgCount)).to.include({
          value: 0.04,
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.bgCount)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('bgRange format', () => {
      const customOpts = opts({
          bgPrefs: {
            bgUnits: MGDL_UNITS,
            bgBounds: {
              veryLowThreshold: 39,
              targetLowerBound: 70,
              targetUpperBound: 180,
              veryHighThreshold: 250,
            },
          },
        });

      it('should return correctly formatted bg range for a given `datum.id`', () => {
        expect(stat.formatDatum({
          id: 'veryLow',
        }, statFormats.bgRange, customOpts)).to.include({
          value: '<39',
        });

        expect(stat.formatDatum({
          id: 'low',
        }, statFormats.bgRange, customOpts)).to.include({
          value: '39-70',
        });

        expect(stat.formatDatum({
          id: 'target',
        }, statFormats.bgRange, customOpts)).to.include({
          value: '70-180',
        });

        expect(stat.formatDatum({
          id: 'high',
        }, statFormats.bgRange, customOpts)).to.include({
          value: '180-250',
        });

        expect(stat.formatDatum({
          id: 'veryHigh',
        }, statFormats.bgRange, customOpts)).to.include({
          value: '>250',
        });
      });
    });

    context('bgValue format', () => {
      it('should classify and format a datum when `value >= 0` for mg/dL units', () => {
        const customOpts = opts({
          bgPrefs: {
            bgUnits: MGDL_UNITS,
            bgBounds: {
              veryLowThreshold: 39,
              targetLowerBound: 70,
              targetUpperBound: 180,
              veryHighThreshold: 250,
            },
          },
        });

        // Using 3-way classification, so both `low` and `veryLow` are classified as `low`
        expect(stat.formatDatum({
          value: 35.8,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'low',
          value: '36',
        });

        expect(stat.formatDatum({
          value: 68.2,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'low',
          value: '68',
        });

        expect(stat.formatDatum({
          value: 100,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'target',
          value: '100',
        });

        // Using 3-way classification, so both `high` and `veryHigh` are classified as `high`
        expect(stat.formatDatum({
          value: 200,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'high',
          value: '200',
        });

        expect(stat.formatDatum({
          value: 252,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'high',
          value: '252',
        });
      });

      it('should classify and format a datum when `value >= 0` for mmol/L units', () => {
        const customOpts = opts({
          bgPrefs: {
            bgUnits: MMOLL_UNITS,
            bgBounds: {
              veryLowThreshold: 3.0,
              targetLowerBound: 3.9,
              targetUpperBound: 10.0,
              veryHighThreshold: 13.9,
            },
          },
        });

        // Using 3-way classification, so both `low` and `veryLow` are classified as `low`
        expect(stat.formatDatum({
          value: 2.86,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'low',
          value: '2.9',
        });

        expect(stat.formatDatum({
          value: 3.62,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'low',
          value: '3.6',
        });

        expect(stat.formatDatum({
          value: 7,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'target',
          value: '7.0',
        });

        // Using 3-way classification, so both `high` and `veryHigh` are classified as `high`
        expect(stat.formatDatum({
          value: 12.3,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'high',
          value: '12.3',
        });

        expect(stat.formatDatum({
          value: 14.1,
        }, statFormats.bgValue, customOpts)).to.include({
          id: 'high',
          value: '14.1',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.bgValue)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('carbs format', () => {
      it('should return correctly formatted data when `value >= 0`', () => {
        expect(stat.formatDatum({
          value: 84.645,
        }, statFormats.carbs)).to.include({
          suffix: 'g',
          value: '85',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.carbs)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('cv format', () => {
      it('should return correctly classified and formatted data when `value >= 0`', () => {
        expect(stat.formatDatum({
          value: 35.8,
        }, statFormats.cv)).to.include({
          id: 'target',
          suffix: '%',
          value: '36',
        });

        expect(stat.formatDatum({
          value: 36.2,
        }, statFormats.cv)).to.include({
          id: 'high',
          suffix: '%',
          value: '36',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.cv)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('duration format', () => {
      it('should return correctly formatted data when `value >= 0`', () => {
        expect(stat.formatDatum({
          value: MS_IN_DAY + MS_IN_HOUR + MS_IN_MIN,
        }, statFormats.duration)).to.include({
          value: '1d 1h 1m',
        });

        expect(stat.formatDatum({
          value: MS_IN_HOUR * 3 + MS_IN_MIN,
        }, statFormats.duration)).to.include({
          value: '3h 1m',
        });

        expect(stat.formatDatum({
          value: MS_IN_MIN * 48,
        }, statFormats.duration)).to.include({
          value: '48m',
        });

        // show seconds only when less than a minute
        expect(stat.formatDatum({
          value: 6000,
        }, statFormats.duration)).to.include({
          value: '6s',
        });

        // show 0m for 0
        expect(stat.formatDatum({
          value: 0,
        }, statFormats.duration)).to.include({
          value: '0m',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.duration)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('gmi format', () => {
      it('should return correctly formatted data when `value >= 0`', () => {
        expect(stat.formatDatum({
          value: 35.85,
        }, statFormats.gmi)).to.include({
          suffix: '%',
          value: '35.9',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.gmi)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('percentage format', () => {
      it('should return correctly formatted data when `total` prop is `>= 0`', () => {
        const customOpts = opts({
          data: {
            total: {
              value: 10,
            },
          },
        });

        // No decimal places when `% >= 0.5`
        expect(stat.formatDatum({
          value: 3.95,
        }, statFormats.percentage, customOpts)).to.include({
          value: '40',
          suffix: '%',
        });

        // 1 decimal place when `% < 0.5` and `% >= 0.05`
        expect(stat.formatDatum({
          value: 0.049,
        }, statFormats.percentage, customOpts)).to.include({
          value: '0.5',
          suffix: '%',
        });

        // 1 decimal places when `% < 0.05`
        expect(stat.formatDatum({
          value: 0.0049,
        }, statFormats.percentage, customOpts)).to.include({
          value: '0.05',
          suffix: '%',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        const customOpts = opts({
          data: {
            total: {
              value: -1,
            },
          },
        });

        expect(stat.formatDatum({
          value: 10,
        }, statFormats.percentage, customOpts)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('standardDevRange format', () => {
      const renderResult = result => {
        const Component = () => result.value;
        const render = shallow(<Component />);

        return {
          lower: {
            color: render.childAt(0).props().style.color,
            value: render.childAt(0).props().children,
          },
          upper: {
            color: render.childAt(2).props().style.color,
            value: render.childAt(2).props().children,
          },
        };
      };

      it('should return correctly formatted html when `value >= 0` && `deviation.value >= 0` for mg/dL units', () => {
        const customOpts = opts({
          bgPrefs: {
            bgUnits: MGDL_UNITS,
            bgBounds: {
              veryLowThreshold: 39,
              targetLowerBound: 70,
              targetUpperBound: 180,
              veryHighThreshold: 250,
            },
          },
        });

        expect(renderResult(stat.formatDatum({
          value: 56,
          deviation: { value: 20 },
        }, statFormats.standardDevRange, customOpts))).to.eql({
          lower: {
            color: BG_COLORS.low,
            value: '36',
          },
          upper: {
            color: BG_COLORS.target,
            value: '76',
          },
        });

        expect(renderResult(stat.formatDatum({
          value: 160,
          deviation: { value: 30 },
        }, statFormats.standardDevRange, customOpts))).to.eql({
          lower: {
            color: BG_COLORS.target,
            value: '130',
          },
          upper: {
            color: BG_COLORS.high,
            value: '190',
          },
        });
      });

      it('should return correctly formatted html when `value >= 0` && `deviation.value >= 0` for mg/dL units', () => {
        const customOpts = opts({
          bgPrefs: {
            bgUnits: MMOLL_UNITS,
            bgBounds: {
              veryLowThreshold: 3.0,
              targetLowerBound: 3.9,
              targetUpperBound: 10.0,
              veryHighThreshold: 13.9,
            },
          },
        });

        expect(renderResult(stat.formatDatum({
          value: 3.8,
          deviation: { value: 1 },
        }, statFormats.standardDevRange, customOpts))).to.eql({
          lower: {
            color: BG_COLORS.low,
            value: '2.8',
          },
          upper: {
            color: BG_COLORS.target,
            value: '4.8',
          },
        });

        expect(renderResult(stat.formatDatum({
          value: 10.2,
          deviation: { value: 1.5 },
        }, statFormats.standardDevRange, customOpts))).to.eql({
          lower: {
            color: BG_COLORS.target,
            value: '8.7',
          },
          upper: {
            color: BG_COLORS.high,
            value: '11.7',
          },
        });
      });

      it('should return the empty placeholder text and id when `value < 0` || `deviation.value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
          deviation: { value: 10 },
        }, statFormats.standardDevRange)).to.include({
          id: 'statDisabled',
          value: '--',
        });

        expect(stat.formatDatum({
          value: 10,
          deviation: { value: -1 },
        }, statFormats.standardDevRange)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('standardDevValue format', () => {
      it('should return correctly formatted data when `value >= 0` for mg/dL units', () => {
        const customOpts = opts({
          bgPrefs: {
            bgUnits: MGDL_UNITS,
          },
        });

        expect(stat.formatDatum({
          value: 42.85,
        }, statFormats.standardDevValue, customOpts)).to.include({
          value: '43',
        });
      });

      it('should return correctly formatted data when `value >= 0` for mmol/L units', () => {
        const customOpts = opts({
          bgPrefs: {
            bgUnits: MMOLL_UNITS,
          },
        });

        expect(stat.formatDatum({
          value: 15.86,
        }, statFormats.standardDevValue, customOpts)).to.include({
          value: '15.9',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.standardDevValue)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('units format', () => {
      it('should return correctly formatted data when `value >= 0`', () => {
        expect(stat.formatDatum({
          value: 47.234,
        }, statFormats.units)).to.include({
          value: '47.2',
          suffix: 'U',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.units)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });

    context('unitsPerKg format', () => {
      it('should return correctly formatted data when `value >= 0`', () => {
        expect(stat.formatDatum({
          value: 10.678,
          suffix: 'kg',
        }, statFormats.unitsPerKg)).to.include({
          value: '10.68',
          suffix: 'U/kg',
        });

        expect(stat.formatDatum({
          value: 11,
          suffix: 'kg',
        }, statFormats.unitsPerKg)).to.include({
          value: '11.00',
          suffix: 'U/kg',
        });
      });

      it('should convert `lb` values to `kg` by multiplying 2.2046226218, and format to 2 decimal places', () => {
        expect(stat.formatDatum({
          value: 1,
          suffix: 'lb',
        }, statFormats.unitsPerKg)).to.include({
          value: '2.20',
          suffix: 'U/kg',
        });
      });

      it('should return the empty placeholder text and id when `value < 0`', () => {
        expect(stat.formatDatum({
          value: -1,
        }, statFormats.unitsPerKg)).to.include({
          id: 'statDisabled',
          value: '--',
        });
      });
    });
  });

  describe('getStatAnnotations', () => {
    const defaultOpts = {
      manufacturer: 'medtronic',
    };

    const opts = overrides => _.assign({}, defaultOpts, overrides);

    const cbgOpts = opts({ bgSource: 'cbg' });
    const smbgOpts = opts({ bgSource: 'smbg' });
    const singleDayOpts = opts({ days: 1 });
    const multiDayOpts = opts({ days: 14 });

    const data = { total: 10 };

    describe('averageGlucose', () => {
      it('should return annotations for `averageGlucose` stat when bgSource is `smgb`', () => {
        expect(stat.getStatAnnotations(data, commonStats.averageGlucose, smbgOpts)).to.have.ordered.members([
          '**Avg. Glucose (BGM):** All BGM glucose values added together, divided by the number of readings.',
          'Derived from _**10**_ BGM readings.',
        ]);
      });

      it('should return annotations for `averageGlucose` stat when bgSource is `cbg`', () => {
        expect(stat.getStatAnnotations(data, commonStats.averageGlucose, cbgOpts)).to.have.ordered.members([
          '**Avg. Glucose (CGM):** All CGM glucose values added together, divided by the number of readings.',
        ]);
      });
    });

    describe('averageDailyDose', () => {
      it('should return annotations for `averageDailyDose` stat when viewing a single day of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.averageDailyDose, singleDayOpts)).to.have.ordered.members([
          '**Daily Insulin:** All basal and bolus insulin delivery (in Units) added together.',
        ]);
      });

      it('should return annotations for `averageDailyDose` stat when viewing multiple days of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.averageDailyDose, multiDayOpts)).to.have.ordered.members([
          '**Avg. Daily Insulin:** All basal and bolus insulin delivery (in Units) added together, divided by the number of days in this view.',
        ]);
      });
    });

    describe('carbs', () => {
      it('should return annotations for `carbs` stat when viewing a single day of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.carbs, singleDayOpts)).to.have.ordered.members([
          '**Total Carbs**: All carb entries from bolus wizard events or Apple Health records added together.',
          'Derived from _**10**_ carb entries.',
        ]);
      });

      it('should return annotations for `carbs` stat when viewing multiple days of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.carbs, multiDayOpts)).to.have.ordered.members([
          '**Avg. Daily Carbs**: All carb entries added together, then divided by the number of days in this view. Note, these entries come from either bolus wizard events, or Apple Health records.',
          'Derived from _**10**_ carb entries.',
        ]);
      });
    });

    describe('coefficientOfVariation', () => {
      it('should return annotations for `coefficientOfVariation` stat when bgSource is `smgb`', () => {
        expect(stat.getStatAnnotations(data, commonStats.coefficientOfVariation, smbgOpts)).to.have.ordered.members([
          '**CV (Coefficient of Variation):** How far apart (wide) glucose values are; research suggests a target of 36% or lower.',
          'Derived from _**10**_ BGM readings.',
        ]);
      });

      it('should return annotations for `coefficientOfVariation` stat when bgSource is `cbg`', () => {
        expect(stat.getStatAnnotations(data, commonStats.coefficientOfVariation, cbgOpts)).to.have.ordered.members([
          '**CV (Coefficient of Variation):** How far apart (wide) glucose values are; research suggests a target of 36% or lower.',
        ]);
      });

      it('should return insufficient dataannotation for `standardDev` stat when not enough data was present for a calculation', () => {
        const insufficientData = {
          ...data,
          insufficientData: true,
        };

        expect(stat.getStatAnnotations(insufficientData, commonStats.coefficientOfVariation, cbgOpts)).to.have.include.members([
          '**Why is this stat empty?**\n\nThere is not enough data present in this view to calculate it.',
        ]);
      });
    });

    describe('glucoseManagementIndicator', () => {
      it('should return annotations for `glucoseManagementIndicator` stat when bgSource is `cbg`', () => {
        expect(stat.getStatAnnotations(data, commonStats.glucoseManagementIndicator, cbgOpts)).to.have.ordered.members([
          '**GMI (Glucose Management Indicator):** Tells you what your approximate A1C level is likely to be, based on the average glucose level from your CGM readings.',
        ]);
      });

      it('should return insufficient dataannotation for `standardDev` stat when not enough data was present for a calculation', () => {
        const insufficientData = {
          ...data,
          insufficientData: true,
        };

        expect(stat.getStatAnnotations(insufficientData, commonStats.glucoseManagementIndicator, cbgOpts)).to.have.include.members([
          '**Why is this stat empty?**\n\nThere is not enough data present in this view to calculate it.',
        ]);
      });
    });

    describe('readingsInRange', () => {
      it('should return annotations for `readingsInRange` stat', () => {
        expect(stat.getStatAnnotations(data, commonStats.readingsInRange, smbgOpts)).to.have.ordered.members([
          '**Readings In Range:** Daily average of the number of BGM readings.',
          'Derived from _**10**_ BGM readings.',
        ]);
      });
    });

    describe('sensorUsage', () => {
      it('should return annotations for `sensorUsage` stat', () => {
        expect(stat.getStatAnnotations(data, commonStats.sensorUsage)).to.have.ordered.members([
          '**Sensor Usage:** Time the CGM collected data, divided by the total time represented in this view.',
        ]);
      });
    });

    describe('standardDev', () => {
      it('should return annotations for `standardDev` stat when bgSource is `smgb`', () => {
        expect(stat.getStatAnnotations(data, commonStats.standardDev, smbgOpts)).to.have.ordered.members([
          '**SD (Standard Deviation):** How far values are from the average.',
          'Derived from _**10**_ BGM readings.',
        ]);
      });

      it('should return annotations for `standardDev` stat when bgSource is `cbg`', () => {
        expect(stat.getStatAnnotations(data, commonStats.standardDev, cbgOpts)).to.have.ordered.members([
          '**SD (Standard Deviation):** How far values are from the average.',
        ]);
      });

      it('should return insufficient dataannotation for `standardDev` stat when not enough data was present for a calculation', () => {
        const insufficientData = {
          ...data,
          insufficientData: true,
        };

        expect(stat.getStatAnnotations(insufficientData, commonStats.standardDev, cbgOpts)).to.have.include.members([
          '**Why is this stat empty?**\n\nThere is not enough data present in this view to calculate it.',
        ]);
      });
    });

    describe('timeInAuto', () => {
      it('should return annotations for `timeInAuto` stat when viewing a single day of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.timeInAuto, singleDayOpts)).to.have.ordered.members([
          '**Time In Auto Mode:** Time spent in automated basal delivery.',
          '**How we calculate this:**\n\n**(%)** is the duration in Auto Mode divided the total duration of basals for this time period.\n\n**(time)** is total duration of time in Auto Mode.',
        ]);
      });

      it('should return annotations for `timeInAuto` stat when viewing multiple days of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.timeInAuto, multiDayOpts)).to.have.ordered.members([
          '**Time In Auto Mode:** Daily average of the time spent in automated basal delivery.',
          '**How we calculate this:**\n\n**(%)** is the duration in Auto Mode divided the total duration of basals for this time period.\n\n**(time)** is 24 hours multiplied by % in Auto Mode.',
        ]);
      });
    });

    describe('timeInRange', () => {
      it('should return annotations for `timeInRange` stat when viewing a single day of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.timeInRange, singleDayOpts)).to.have.ordered.members([
          '**Time In Range:** Time spent in range, based on CGM readings.',
          '**How we calculate this:**\n\n**(%)** is the number of readings in range divided by all readings for this time period.\n\n**(time)** is number of readings in range multiplied by the CGM sample frequency.',
        ]);
      });

      it('should return annotations for `timeInRange` stat when viewing multiple days of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.timeInRange, multiDayOpts)).to.have.ordered.members([
          '**Time In Range:** Daily average of the time spent in range, based on CGM readings.',
          '**How we calculate this:**\n\n**(%)** is the number of readings in range divided by all readings for this time period.\n\n**(time)** is 24 hours multiplied by % in range.',
        ]);
      });
    });

    describe('totalInsulin', () => {
      it('should return annotations for `totalInsulin` stat when viewing a single day of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.totalInsulin, singleDayOpts)).to.have.ordered.members([
          '**Total Insulin:** All basal and bolus insulin delivery (in Units) added together',
          '**How we calculate this:**\n\n**(%)** is the respective total of basal or bolus delivery divided by total insulin delivered for this time period.',
        ]);
      });

      it('should return annotations for `totalInsulin` stat when viewing multiple days of data', () => {
        expect(stat.getStatAnnotations(data, commonStats.totalInsulin, multiDayOpts)).to.have.ordered.members([
          '**Total Insulin:** All basal and bolus insulin delivery (in Units) added together, divided by the number of days in this view',
          '**How we calculate this:**\n\n**(%)** is the respective total of basal or bolus delivery divided by total insulin delivered for this time period.',
        ]);
      });
    });

    describe('insufficientData', () => {
      it('should return annotation for `insufficientData` stat when insufficient data was present', () => {
        expect(stat.getStatAnnotations({ insufficientData: true }, null, singleDayOpts)).to.have.ordered.members([
          '**Why is this stat empty?**\n\nThere is not enough data present in this view to calculate it.',
        ]);
      });
    });
  });

  describe('getStatData', () => {
    const opts = {
      manufacturer: 'medtronic',
      bgPrefs: {
        bgBounds: {
          veryHighThreshold: 250,
          targetUpperBound: 180,
          targetLowerBound: 70,
          veryLowThreshold: 54,
        },
        bgUnits: MGDL_UNITS,
      },
    };

    it('should return the raw stat data as provided', () => {
      const data = {
        averageGlucose: 100,
      };

      const statData = stat.getStatData(data, commonStats.averageGlucose, opts);

      expect(statData.raw.averageGlucose).to.eql(100);
    });

    it('should return the raw days option as provided', () => {
      const data = {
        averageGlucose: 100,
      };

      const statData = stat.getStatData(data, commonStats.averageGlucose, { ...opts, days: 123 });

      expect(statData.raw.days).to.eql(123);
    });

    it('should format and return `averageGlucose` data', () => {
      const data = {
        averageGlucose: 100,
      };

      const statData = stat.getStatData(data, commonStats.averageGlucose, opts);

      expect(statData.data).to.eql([
        {
          value: 100,
        },
      ]);

      expect(statData.dataPaths).to.eql({
        summary: 'data.0',
      });
    });

    it('should format and return default `averageDailyDose` data', () => {
      const data = {
        totalInsulin: 80,
      };

      const statData = stat.getStatData(data, commonStats.averageDailyDose, opts);

      expect(statData.data).to.eql([
        {
          id: 'insulin',
          input: {
            id: 'weight',
            label: 'Weight',
            suffix: {
              id: 'units',
              options: dailyDoseUnitOptions,
              value: dailyDoseUnitOptions[0],
            },
            type: 'number',
            value: undefined,
          },
          output: {
            label: 'Daily Dose ÷ Weight',
            type: 'divisor',
            dataPaths: {
              dividend: 'data.0',
            },
          },
          value: 80,
        },
      ]);
    });

    it('should format and return `averageDailyDose` data with provided input value', () => {
      const data = {
        totalInsulin: 80,
      };

      const valueOpts = _.assign({}, opts, {
        inputValue: '300',
      });

      const statData = stat.getStatData(data, commonStats.averageDailyDose, valueOpts);

      expect(statData.data).to.eql([
        {
          id: 'insulin',
          input: {
            id: 'weight',
            label: 'Weight',
            suffix: {
              id: 'units',
              options: dailyDoseUnitOptions,
              value: dailyDoseUnitOptions[0],
            },
            type: 'number',
            value: 300,
          },
          output: {
            label: 'Daily Dose ÷ Weight',
            type: 'divisor',
            dataPaths: {
              dividend: 'data.0',
            },
          },
          value: 80,
        },
      ]);
    });

    it('should format and return `averageDailyDose` data with provided suffix value', () => {
      const data = {
        totalInsulin: 80,
      };

      const valueOpts = _.assign({}, opts, {
        suffixValue: dailyDoseUnitOptions[1],
      });

      const statData = stat.getStatData(data, commonStats.averageDailyDose, valueOpts);

      expect(statData.data).to.eql([
        {
          id: 'insulin',
          input: {
            id: 'weight',
            label: 'Weight',
            suffix: {
              id: 'units',
              options: dailyDoseUnitOptions,
              value: dailyDoseUnitOptions[1],
            },
            type: 'number',
            value: undefined,
          },
          output: {
            label: 'Daily Dose ÷ Weight',
            type: 'divisor',
            dataPaths: {
              dividend: 'data.0',
            },
          },
          value: 80,
        },
      ]);
    });

    it('should format and return `bgExtents` data', () => {
      const data = {
        bgMax: 350,
        bgMin: 50,
      };

      const statData = stat.getStatData(data, commonStats.bgExtents, opts);

      expect(statData.data).to.eql([
        {
          id: 'bgMax',
          value: 350,
          title: 'Max BG',
        },
        {
          id: 'bgMin',
          value: 50,
          title: 'Min BG',
        },
      ]);
    });

    it('should format and return `carbs` data', () => {
      const data = {
        carbs: 30,
      };

      const statData = stat.getStatData(data, commonStats.carbs, opts);

      expect(statData.data).to.eql([
        {
          value: 30,
        },
      ]);

      expect(statData.dataPaths).to.eql({
        summary: 'data.0',
      });
    });

    it('should format and return `coefficientOfVariation` data', () => {
      const data = {
        coefficientOfVariation: 40,
      };

      const statData = stat.getStatData(data, commonStats.coefficientOfVariation, opts);

      expect(statData.data).to.eql([
        {
          id: 'cv',
          value: 40,
        },
      ]);

      expect(statData.dataPaths).to.eql({
        summary: 'data.0',
      });
    });

    it('should format and return `glucoseManagementIndicator` data', () => {
      const data = {
        glucoseManagementIndicator: 36,
      };

      const statData = stat.getStatData(data, commonStats.glucoseManagementIndicator, opts);

      expect(statData.data).to.eql([
        {
          id: 'gmi',
          value: 36,
        },
      ]);

      expect(statData.dataPaths).to.eql({
        summary: 'data.0',
      });
    });

    it('should format and return `readingsInRange` data', () => {
      const data = {
        veryLow: 10,
        low: 20,
        target: 30,
        high: 40,
        veryHigh: 50,
      };

      const statData = stat.getStatData(data, commonStats.readingsInRange, opts);

      expect(statData.data).to.eql([
        {
          id: 'veryLow',
          value: 10,
          title: 'Readings Below Range',
          legendTitle: '<54',
        },
        {
          id: 'low',
          value: 20,
          title: 'Readings Below Range',
          legendTitle: '54-70',
        },
        {
          id: 'target',
          value: 30,
          title: 'Readings In Range',
          legendTitle: '70-180',
        },
        {
          id: 'high',
          value: 40,
          title: 'Readings Above Range',
          legendTitle: '180-250',
        },
        {
          id: 'veryHigh',
          value: 50,
          title: 'Readings Above Range',
          legendTitle: '>250',
        },
      ]);

      expect(statData.total).to.eql({ value: 150 });

      expect(statData.dataPaths).to.eql({
        summary: ['data', 2],
      });
    });

    it('should format and return `sensorUsage` data', () => {
      const data = {
        sensorUsage: 80,
        total: 200,
      };

      const statData = stat.getStatData(data, commonStats.sensorUsage, opts);

      expect(statData.data).to.eql([
        {
          value: 80,
        },
      ]);

      expect(statData.total).to.eql({ value: 200 });

      expect(statData.dataPaths).to.eql({
        summary: 'data.0',
      });
    });

    it('should format and return `standardDev` data', () => {
      const data = {
        averageGlucose: 120,
        standardDeviation: 32,
      };

      const statData = stat.getStatData(data, commonStats.standardDev, opts);

      expect(statData.data).to.eql([
        {
          value: 120,
          deviation: {
            value: 32,
          },
        },
      ]);

      expect(statData.dataPaths).to.eql({
        summary: 'data.0.deviation',
        title: 'data.0',
      });
    });

    it('should format and return `timeInAuto` data', () => {
      const data = {
        automated: 100000,
        manual: 20000,
      };

      const statData = stat.getStatData(data, commonStats.timeInAuto, opts);

      expect(statData.data).to.eql([
        {
          id: 'basalAutomated',
          value: 100000,
          title: 'Time In Auto Mode',
          legendTitle: 'Auto Mode',
        },
        {
          id: 'basal',
          value: 20000,
          title: 'Time In Manual',
          legendTitle: 'Manual',
        },
      ]);

      expect(statData.total).to.eql({ value: 120000 });

      expect(statData.dataPaths).to.eql({
        summary: ['data', 0],
      });
    });

    it('should format and return `timeInRange` data', () => {
      const data = {
        veryLow: 10000,
        low: 20000,
        target: 30000,
        high: 40000,
        veryHigh: 50000,
      };

      const statData = stat.getStatData(data, commonStats.timeInRange, opts);

      expect(statData.data).to.eql([
        {
          id: 'veryLow',
          value: 10000,
          title: 'Time Below Range',
          legendTitle: '<54',
        },
        {
          id: 'low',
          value: 20000,
          title: 'Time Below Range',
          legendTitle: '54-70',
        },
        {
          id: 'target',
          value: 30000,
          title: 'Time In Range',
          legendTitle: '70-180',
        },
        {
          id: 'high',
          value: 40000,
          title: 'Time Above Range',
          legendTitle: '180-250',
        },
        {
          id: 'veryHigh',
          value: 50000,
          title: 'Time Above Range',
          legendTitle: '>250',
        },
      ]);

      expect(statData.total).to.eql({ value: 150000 });

      expect(statData.dataPaths).to.eql({
        summary: ['data', 2],
      });
    });

    it('should format and return `totalInsulin` data', () => {
      const data = {
        bolus: 9,
        basal: 6,
      };

      const statData = stat.getStatData(data, commonStats.totalInsulin, opts);

      expect(statData.data).to.eql([
        {
          id: 'bolus',
          value: 9,
          title: 'Bolus Insulin',
          legendTitle: 'Bolus',
        },
        {
          id: 'basal',
          value: 6,
          title: 'Basal Insulin',
          legendTitle: 'Basal',
        },
      ]);

      expect(statData.total).to.eql({ id: 'insulin', value: 15 });

      expect(statData.dataPaths).to.eql({
        summary: 'total',
        title: 'total',
      });
    });
  });

  describe('getStatTitle', () => {
    const defaultOpts = {
      manufacturer: 'medtronic',
    };

    const opts = overrides => _.assign({}, defaultOpts, overrides);

    const cbgOpts = opts({ bgSource: 'cbg' });
    const smbgOpts = opts({ bgSource: 'smbg' });
    const singleDayOpts = opts({ days: 1 });
    const multiDayOpts = opts({ days: 14 });

    describe('averageGlucose', () => {
      it('should return title for `averageGlucose` stat when bgSource is `smgb`', () => {
        expect(stat.getStatTitle(commonStats.averageGlucose, smbgOpts)).to.equal('Avg. Glucose (BGM)');
      });

      it('should return title for `averageGlucose` stat when bgSource is `cbg`', () => {
        expect(stat.getStatTitle(commonStats.averageGlucose, cbgOpts)).to.equal('Avg. Glucose (CGM)');
      });
    });

    describe('averageDailyDose', () => {
      it('should return title for `averageDailyDose` stat when viewing a single day of data', () => {
        expect(stat.getStatTitle(commonStats.averageDailyDose, singleDayOpts)).to.equal('Total Insulin');
      });

      it('should return title for `averageDailyDose` stat when viewing multiple days of data', () => {
        expect(stat.getStatTitle(commonStats.averageDailyDose, multiDayOpts)).to.equal('Avg. Daily Insulin');
      });
    });

    describe('bgExtents', () => {
      it('should return title for `bgExtents` stat when bgSource is `smgb`', () => {
        expect(stat.getStatTitle(commonStats.bgExtents, smbgOpts)).to.equal('BG Extents (BGM)');
      });

      it('should return title for `bgExtents` stat when bgSource is `cbg`', () => {
        expect(stat.getStatTitle(commonStats.bgExtents, cbgOpts)).to.equal('BG Extents (CGM)');
      });
    });

    describe('carbs', () => {
      it('should return title for `carbs` stat when viewing a single day of data', () => {
        expect(stat.getStatTitle(commonStats.carbs, singleDayOpts)).to.equal('Total Carbs');
      });

      it('should return title for `carbs` stat when viewing multiple days of data', () => {
        expect(stat.getStatTitle(commonStats.carbs, multiDayOpts)).to.equal('Avg. Daily Carbs');
      });
    });

    describe('coefficientOfVariation', () => {
      it('should return title for `coefficientOfVariation` stat when bgSource is `smgb`', () => {
        expect(stat.getStatTitle(commonStats.coefficientOfVariation, smbgOpts)).to.equal('CV (BGM)');
      });

      it('should return title for `coefficientOfVariation` stat when bgSource is `cbg`', () => {
        expect(stat.getStatTitle(commonStats.coefficientOfVariation, cbgOpts)).to.equal('CV (CGM)');
      });
    });

    describe('glucoseManagementIndicator', () => {
      it('should return title for `glucoseManagementIndicator` stat when bgSource is `smgb`', () => {
        expect(stat.getStatTitle(commonStats.glucoseManagementIndicator, smbgOpts)).to.equal('GMI (BGM)');
      });

      it('should return title for `glucoseManagementIndicator` stat when bgSource is `cbg`', () => {
        expect(stat.getStatTitle(commonStats.glucoseManagementIndicator, cbgOpts)).to.equal('GMI (CGM)');
      });
    });

    describe('readingsInRange', () => {
      it('should return title for `readingsInRange` stat when viewing a single day of data', () => {
        expect(stat.getStatTitle(commonStats.readingsInRange, singleDayOpts)).to.equal('Readings In Range');
      });

      it('should return title for `readingsInRange` stat when viewing multiple days of data', () => {
        expect(stat.getStatTitle(commonStats.readingsInRange, multiDayOpts)).to.equal('Avg. Daily Readings In Range');
      });
    });

    describe('sensorUsage', () => {
      it('should return title for `sensorUsage` stat', () => {
        expect(stat.getStatTitle(commonStats.sensorUsage)).to.equal('Sensor Usage');
      });
    });

    describe('standardDev', () => {
      it('should return title for `standardDev` stat when bgSource is `smgb`', () => {
        expect(stat.getStatTitle(commonStats.standardDev, smbgOpts)).to.equal('Std. Deviation (BGM)');
      });

      it('should return title for `standardDev` stat when bgSource is `cbg`', () => {
        expect(stat.getStatTitle(commonStats.standardDev, cbgOpts)).to.equal('Std. Deviation (CGM)');
      });
    });

    describe('timeInAuto', () => {
      it('should return title for `timeInAuto` stat when viewing a single day of data', () => {
        expect(stat.getStatTitle(commonStats.timeInAuto, singleDayOpts)).to.equal('Time In Auto Mode');
      });

      it('should return title for `timeInAuto` stat when viewing multiple days of data', () => {
        expect(stat.getStatTitle(commonStats.timeInAuto, multiDayOpts)).to.equal('Avg. Daily Time In Auto Mode');
      });
    });

    describe('timeInRange', () => {
      it('should return title for `timeInRange` stat when viewing a single day of data', () => {
        expect(stat.getStatTitle(commonStats.timeInRange, singleDayOpts)).to.equal('Time In Range');
      });

      it('should return title for `timeInRange` stat when viewing multiple days of data', () => {
        expect(stat.getStatTitle(commonStats.timeInRange, multiDayOpts)).to.equal('Avg. Daily Time In Range');
      });
    });

    describe('totalInsulin', () => {
      it('should return title for `totalInsulin` stat when viewing a single day of data', () => {
        expect(stat.getStatTitle(commonStats.totalInsulin, singleDayOpts)).to.equal('Total Insulin');
      });

      it('should return title for `totalInsulin` stat when viewing multiple days of data', () => {
        expect(stat.getStatTitle(commonStats.totalInsulin, multiDayOpts)).to.equal('Avg. Daily Total Insulin');
      });
    });
  });

  describe('getStatDefinition', () => {
    const data = { total: 10 };

    const opts = {
      manufacturer: 'medtronic',
      bgPrefs: {
        bgBounds: {
          veryHighThreshold: 250,
          targetUpperBound: 180,
          targetLowerBound: 70,
          veryLowThreshold: 54,
        },
        bgUnits: MGDL_UNITS,
      },
    };

    const commonStatProperties = [
      'annotations',
      'collapsible',
      'data',
      'dataFormat',
      'id',
      'title',
      'type',
    ];

    it('should define the `averageGlucose` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.averageGlucose, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.averageGlucose);
      expect(def.type).to.equal(statTypes.barBg);
      expect(def.dataFormat).to.eql({
        label: statFormats.bgValue,
        summary: statFormats.bgValue,
      });
    });

    it('should define the `bgExtents` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.bgExtents, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.bgExtents);
      expect(def.dataFormat).to.eql({
        label: statFormats.bgValue,
        summary: statFormats.bgValue,
      });
    });

    it('should define the `carbs` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.carbs, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.carbs);
      expect(def.type).to.equal(statTypes.simple);
      expect(def.dataFormat).to.eql({
        summary: statFormats.carbs,
      });
    });

    it('should define the `averageDailyDose` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.averageDailyDose, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.averageDailyDose);
      expect(def.alwaysShowSummary).to.be.true;
      expect(def.type).to.equal(statTypes.input);
      expect(def.dataFormat).to.eql({
        output: statFormats.unitsPerKg,
        summary: statFormats.units,
      });
    });

    it('should define the `coefficientOfVariation` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.coefficientOfVariation, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.coefficientOfVariation);
      expect(def.type).to.equal(statTypes.simple);
      expect(def.dataFormat).to.eql({
        summary: statFormats.cv,
      });
    });

    it('should define the `glucoseManagementIndicator` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.glucoseManagementIndicator, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.glucoseManagementIndicator);
      expect(def.type).to.equal(statTypes.simple);
      expect(def.dataFormat).to.eql({
        summary: statFormats.gmi,
      });
    });

    it('should define the `readingsInRange` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.readingsInRange, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.readingsInRange);
      expect(def.type).to.equal(statTypes.barHorizontal);
      expect(def.dataFormat).to.eql({
        label: statFormats.bgCount,
        summary: statFormats.bgCount,
        tooltip: statFormats.percentage,
        tooltipTitle: statFormats.bgRange,
      });
      expect(def.alwaysShowTooltips).to.be.true;
    });

    it('should define the `sensorUsage` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.sensorUsage, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.sensorUsage);
      expect(def.type).to.equal(statTypes.simple);
      expect(def.dataFormat).to.eql({
        summary: statFormats.percentage,
      });
    });

    it('should define the `standardDev` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.standardDev, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.standardDev);
      expect(def.type).to.equal(statTypes.barBg);
      expect(def.dataFormat).to.eql({
        label: statFormats.standardDevValue,
        summary: statFormats.standardDevValue,
        title: statFormats.standardDevRange,
      });
    });

    it('should define the `timeInAuto` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.timeInAuto, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.timeInAuto);
      expect(def.type).to.equal(statTypes.barHorizontal);
      expect(def.dataFormat).to.eql({
        label: statFormats.percentage,
        summary: statFormats.percentage,
        tooltip: statFormats.duration,
      });
      expect(def.alwaysShowTooltips).to.be.true;
    });

    it('should define the `timeInRange` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.timeInRange, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.timeInRange);
      expect(def.type).to.equal(statTypes.barHorizontal);
      expect(def.dataFormat).to.eql({
        label: statFormats.percentage,
        summary: statFormats.percentage,
        tooltip: statFormats.duration,
        tooltipTitle: statFormats.bgRange,
      });
      expect(def.alwaysShowTooltips).to.be.true;
    });

    it('should define the `totalInsulin` stat', () => {
      const def = stat.getStatDefinition(data, commonStats.totalInsulin, opts);
      expect(def).to.include.all.keys(commonStatProperties);
      expect(def.id).to.equal(commonStats.totalInsulin);
      expect(def.type).to.equal(statTypes.barHorizontal);
      expect(def.dataFormat).to.eql({
        label: statFormats.percentage,
        summary: statFormats.units,
        title: statFormats.units,
        tooltip: statFormats.units,
      });
      expect(def.alwaysShowTooltips).to.be.true;
    });
  });

  describe('statsText', () => {
    const textUtil = {
      buildTextTable: sinon.stub().returns('text table'),
      buildTextLine: sinon.stub().returns('text line'),
    };

    const defaultBgPrefs = {
      bgClasses: {
        'very-high': { boundary: 600 },
        high: { boundary: 300 },
        target: { boundary: 180 },
        low: { boundary: 70 },
        'very-low': { boundary: 54 },
      },
      bgUnits: MGDL_UNITS,
    };

    const defaultStat = {
      title: 'My Stat',
      data: {
        data: [{ value: 5, id: 'myStat' }],
        dataPaths: { summary: 'data.0' },
      },
      dataFormat: { summary: 'myFormat' },
    };

    // Stats formatted as tables
    const timeInRange = { ...defaultStat, id: 'timeInRange', title: 'timeInRange' };
    const readingsInRange = { ...defaultStat, id: 'readingsInRange', title: 'readingsInRange' };
    const totalInsulin = { ...defaultStat, id: 'totalInsulin', title: 'totalInsulin' };
    const timeInAuto = { ...defaultStat, id: 'timeInAuto', title: 'timeInAuto' };

    // Stats formatted as lines
    const averageGlucose = { ...defaultStat, id: 'averageGlucose', title: 'averageGlucose' };
    const averageDailyDose = { ...defaultStat, id: 'averageDailyDose', title: 'averageDailyDose' };
    const carbs = { ...defaultStat, id: 'carbs', title: 'carbs' };
    const coefficientOfVariation = { ...defaultStat, id: 'coefficientOfVariation', title: 'coefficientOfVariation' };
    const glucoseManagementIndicator = { ...defaultStat, id: 'glucoseManagementIndicator', title: 'glucoseManagementIndicator' };
    const sensorUsage = { ...defaultStat, id: 'sensorUsage', title: 'sensorUsage' };
    const standardDev = { ...defaultStat, id: 'standardDev', title: 'standardDev' };

    const stats = [
      timeInRange,
      readingsInRange,
      totalInsulin,
      timeInAuto,
      averageGlucose,
      averageDailyDose,
      carbs,
      coefficientOfVariation,
      glucoseManagementIndicator,
      sensorUsage,
      standardDev,
    ];

    const defaultOpts = { bgPrefs: defaultBgPrefs, data: defaultStat.data, forcePlainTextValues: true };

    afterEach(() => {
      textUtil.buildTextTable.resetHistory();
      textUtil.buildTextLine.resetHistory();
    });

    it('should reshape provided tideline-style bgPrefs to the viz format', () => {
      const bgPrefs = { ...defaultBgPrefs };
      expect(bgPrefs.bgBounds).to.be.undefined;

      stat.statsText(stats, textUtil, bgPrefs);
      expect(bgPrefs.bgBounds).to.eql({
        veryLowThreshold: bgPrefs.bgClasses['very-low'].boundary,
        targetLowerBound: bgPrefs.bgClasses.low.boundary,
        targetUpperBound: bgPrefs.bgClasses.target.boundary,
        veryHighThreshold: bgPrefs.bgClasses.high.boundary,
        clampThreshold: 600,
      });
    });

    it('should render all horizontal bar stats as tables', () => {
      const result = stat.statsText([
        timeInRange,
        readingsInRange,
        totalInsulin,
        timeInAuto,
      ], textUtil, defaultBgPrefs);

      sinon.assert.callCount(textUtil.buildTextTable, 4);
      sinon.assert.callCount(textUtil.buildTextLine, 0);
      sinon.assert.calledWith(textUtil.buildTextTable, 'timeInRange');
      sinon.assert.calledWith(textUtil.buildTextTable, 'readingsInRange');
      sinon.assert.calledWith(textUtil.buildTextTable, 'totalInsulin');
      sinon.assert.calledWith(textUtil.buildTextTable, 'timeInAuto');

      expect(result).to.be.a('string').and.include('text table');
    });

    it('should render all other stats as simple lines', () => {
      const result = stat.statsText([
        averageGlucose,
        averageDailyDose,
        carbs,
        coefficientOfVariation,
        glucoseManagementIndicator,
        sensorUsage,
        standardDev,
      ], textUtil, defaultBgPrefs);

      sinon.assert.callCount(textUtil.buildTextTable, 0);
      sinon.assert.callCount(textUtil.buildTextLine, 7);
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'averageGlucose' }));
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'averageDailyDose' }));
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'carbs' }));
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'coefficientOfVariation' }));
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'glucoseManagementIndicator' }));
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'sensorUsage' }));
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'standardDev' }));

      expect(result).to.be.a('string').and.include('text line');
    });

    it('should call formatDatum on each stat with appropriate args', () => {
      const formatDatumSpy = sinon.spy(stat, 'formatDatum');

      stat.statsText(stats, textUtil, defaultBgPrefs, formatDatumSpy);

      sinon.assert.callCount(formatDatumSpy, 11);
      sinon.assert.calledWith(formatDatumSpy, defaultStat.data.data[0], 'myFormat', sinon.match(defaultOpts));

      formatDatumSpy.restore();
    });
  });
});
