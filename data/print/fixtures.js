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

import types from '../types';
import { THREE_HRS } from '../../src/utils/datetime';
import { DEFAULT_BG_BOUNDS, MGDL_UNITS } from '../../src/utils/constants';

const timePrefs = {
  timezoneAware: true,
  timezoneName: 'US/Eastern',
};

const bgPrefs = {
  bgBounds: DEFAULT_BG_BOUNDS[MGDL_UNITS],
  bgClasses: {
    'very-low': { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].veryLowThreshold },
    low: { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].targetLowerBound },
    target: { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].targetUpperBound },
    high: { boundary: DEFAULT_BG_BOUNDS[MGDL_UNITS].veryHighThreshold },
  },
  bgUnits: MGDL_UNITS,
};

const metaData = {
  bgSources: { cbg: true, smbg: true, current: 'cbg' },
  latestPumpUpload: {
    deviceModel: 'OmniPod',
    isAutomatedBasalDevice: false,
    isSettingsOverrideDevice: false,
    manufacturer: 'insulet',
    settings: new types.Settings(),
  },
};

export const basicsData = {
  timePrefs,
  bgPrefs,
  metaData,
  query: { excludeDaysWithoutBolus: true },
  data: {
    current: {
      endpoints: {
        range: [
          Date.parse('2017-09-18T04:00:00.000Z'),
          Date.parse('2017-10-07T18:55:09.000Z'),
        ],
        days: 18,
      },
      stats: {
        readingsInRange: {
          veryLow: 0,
          low: 0.21052631578947367,
          target: 1.105263157894737,
          high: 1.1578947368421053,
          veryHigh: 1.2105263157894737,
          total: 70,
        },
        averageGlucose: {
          averageGlucose: 12.737278189136658,
          total: 70,
        },
        totalInsulin: {
          basal: 0.6568947368421053,
          bolus: 1.3078947368421052,
        },
        carbs: {
          carbs: 33.63157894736842,
          total: 40,
        },
        coefficientOfVariation: {
          coefficientOfVariation: 38.656,
        },
        averageDailyDose: {
          totalInsulin: 1.9647894736842106,
        },
      },
      aggregationsByDate: {
        basals: {
          summary: {
            avgPerDay: 0.5263157894736842,
            total: 10,
            subtotals: {
              suspend: {
                count: 2,
                percentage: 0.2,
              },
              temp: {
                count: 8,
                percentage: 0.8,
              },
              automatedStop: {
                count: 0,
                percentage: 0,
              },
            },
          },
          byDate: {
            '2019-07-23': {
              total: 4,
              subtotals: {
                suspend: 0,
                temp: 4,
                automatedStop: 0,
              },
            },
            '2019-07-24': {
              total: 1,
              subtotals: {
                suspend: 0,
                temp: 1,
                automatedStop: 0,
              },
            },
            '2019-07-25': {
              total: 2,
              subtotals: {
                suspend: 2,
                temp: 0,
                automatedStop: 0,
              },
            },
            '2019-07-26': {
              total: 3,
              subtotals: {
                suspend: 0,
                temp: 3,
                automatedStop: 0,
              },
            },
          },
        },
        boluses: {
          summary: {
            avgPerDay: 2.1052631578947367,
            total: 40,
            subtotals: {
              correction: {
                count: 9,
                percentage: 0.225,
              },
              extended: {
                count: 0,
                percentage: 0,
              },
              interrupted: {
                count: 0,
                percentage: 0,
              },
              manual: {
                count: 0,
                percentage: 0,
              },
              override: {
                count: 6,
                percentage: 0.15,
              },
              underride: {
                count: 11,
                percentage: 0.275,
              },
              wizard: {
                count: 40,
                percentage: 1,
              },
            },
          },
          byDate: {
            '2019-07-22': {
              total: 8,
              subtotals: {
                correction: 1,
                extended: 0,
                interrupted: 0,
                manual: 0,
                override: 2,
                underride: 1,
                wizard: 8,
              },
            },
            '2019-07-23': {
              total: 8,
              subtotals: {
                correction: 1,
                extended: 0,
                interrupted: 0,
                manual: 0,
                override: 0,
                underride: 3,
                wizard: 8,
              },
            },
            '2019-07-24': {
              total: 10,
              subtotals: {
                correction: 3,
                extended: 0,
                interrupted: 0,
                manual: 0,
                override: 2,
                underride: 4,
                wizard: 10,
              },
            },
            '2019-07-25': {
              total: 10,
              subtotals: {
                correction: 4,
                extended: 0,
                interrupted: 0,
                manual: 0,
                override: 2,
                underride: 1,
                wizard: 10,
              },
            },
            '2019-07-26': {
              total: 4,
              subtotals: {
                correction: 0,
                extended: 0,
                interrupted: 0,
                manual: 0,
                override: 0,
                underride: 2,
                wizard: 4,
              },
            },
          },
        },
        fingersticks: {
          smbg: {
            summary: {
              avgPerDay: 3.6842105263157894,
              total: 70,
              subtotals: {
                manual: {
                  count: 26,
                  percentage: 0.37142857142857144,
                },
                meter: {
                  count: 44,
                  percentage: 0.6285714285714286,
                },
                veryHigh: {
                  count: 23,
                  percentage: 0.32857142857142857,
                },
                veryLow: {
                  count: 0,
                  percentage: 0,
                },
              },
            },
            byDate: {
              '2019-07-08': {
                total: 2,
                subtotals: {
                  manual: 0,
                  meter: 2,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-09': {
                total: 2,
                subtotals: {
                  manual: 0,
                  meter: 2,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-10': {
                total: 1,
                subtotals: {
                  manual: 0,
                  meter: 1,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-11': {
                total: 2,
                subtotals: {
                  manual: 0,
                  meter: 2,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-12': {
                total: 3,
                subtotals: {
                  manual: 0,
                  meter: 3,
                  veryHigh: 3,
                  veryLow: 0,
                },
              },
              '2019-07-13': {
                total: 1,
                subtotals: {
                  manual: 0,
                  meter: 1,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-14': {
                total: 7,
                subtotals: {
                  manual: 0,
                  meter: 7,
                  veryHigh: 2,
                  veryLow: 0,
                },
              },
              '2019-07-15': {
                total: 4,
                subtotals: {
                  manual: 0,
                  meter: 4,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-16': {
                total: 1,
                subtotals: {
                  manual: 0,
                  meter: 1,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-17': {
                total: 1,
                subtotals: {
                  manual: 0,
                  meter: 1,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-18': {
                total: 1,
                subtotals: {
                  manual: 0,
                  meter: 1,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
              '2019-07-19': {
                total: 3,
                subtotals: {
                  manual: 0,
                  meter: 3,
                  veryHigh: 3,
                  veryLow: 0,
                },
              },
              '2019-07-20': {
                total: 2,
                subtotals: {
                  manual: 0,
                  meter: 2,
                  veryHigh: 1,
                  veryLow: 0,
                },
              },
              '2019-07-21': {
                total: 3,
                subtotals: {
                  manual: 0,
                  meter: 3,
                  veryHigh: 1,
                  veryLow: 0,
                },
              },
              '2019-07-22': {
                total: 7,
                subtotals: {
                  manual: 5,
                  meter: 2,
                  veryHigh: 4,
                  veryLow: 0,
                },
              },
              '2019-07-23': {
                total: 8,
                subtotals: {
                  manual: 4,
                  meter: 4,
                  veryHigh: 1,
                  veryLow: 0,
                },
              },
              '2019-07-24': {
                total: 9,
                subtotals: {
                  manual: 7,
                  meter: 2,
                  veryHigh: 1,
                  veryLow: 0,
                },
              },
              '2019-07-25': {
                total: 9,
                subtotals: {
                  manual: 7,
                  meter: 2,
                  veryHigh: 7,
                  veryLow: 0,
                },
              },
              '2019-07-26': {
                total: 4,
                subtotals: {
                  manual: 3,
                  meter: 1,
                  veryHigh: 0,
                  veryLow: 0,
                },
              },
            },
          },
          calibration: {
            summary: {
              avgPerDay: 0,
              total: 0,
              subtotals: {},
            },
            byDate: {},
          },
        },
        siteChanges: {
          byDate: {
            '2019-07-25': {
              data: [
                {
                  subType: 'reservoirChange',
                  type: 'deviceEvent',
                  tags: {
                    calibration: false,
                    reservoirChange: true,
                    cannulaPrime: false,
                    tubingPrime: false,
                  },
                  normalTime: 1564065176000,
                  source: 'Insulet',
                },
                {
                  subType: 'reservoirChange',
                  type: 'deviceEvent',
                  tags: {
                    calibration: false,
                    reservoirChange: true,
                    cannulaPrime: false,
                    tubingPrime: false,
                  },
                  normalTime: 1564092397000,
                  source: 'Insulet',
                },
              ],
              summary: {
                daysSince: {
                  reservoirChange: 20,
                },
              },
              subtotals: {
                cannulaPrime: 0,
                reservoirChange: 2,
                tubingPrime: 0,
              },
            },
          },
        },
      },
    },
  },
};

export const dailyData = {
  timePrefs,
  bgPrefs,
  metaData,
  data: {
    current: {
      endpoints: {
        range: [
          1482883200000,
          1483401600000,
        ],
        days: 6,
        activeDays: 6,
      },
      aggregationsByDate: {
        statsByDate: {},
        dataByDate: {
          '2016-12-28': {
            basal: [],
            bolus: [],
            cbg: [],
            smbg: [],
            basalSequences: [],
          },
          '2016-12-29': {
            basal: [],
            bolus: [],
            cbg: [],
            smbg: [],
            basalSequences: [],
          },
          '2016-12-30': {
            basal: [],
            bolus: [],
            cbg: [],
            smbg: [],
            basalSequences: [],
          },
          '2016-12-31': {
            basal: [],
            bolus: [],
            cbg: [],
            smbg: [],
            basalSequences: [],
          },
          '2017-01-01': {
            basal: [],
            bolus: [
              {
                type: 'bolus',
                utc: 1483313400000,
                threeHrBin: 21,
              },
              {
                type: 'bolus',
                utc: 1483313400000,
                threeHrBin: 21,
              },
            ],
            cbg: [],
            smbg: [],
            basalSequences: [],
          },
          '2017-01-02': {
            basal: [
              {
                type: 'basal',
                utc: 1483313400000,
                duration: 1483314400000,
                rate: 0.625,
                subType: 'scheduled',
              },
              {
                type: 'basal',
                utc: 1483314400000,
                duration: 1483315400000,
                rate: 0.7,
                subType: 'automated',
              },
            ],
            bolus: [
              {
                type: 'bolus',
                subType: 'normal',
                normal: 0.925,
                utc: 1483313400000,
                threeHrBin: 21,
              },
              {
                type: 'bolus',
                normal: 0.925,
                subType: 'normal',
                utc: 1483315200000,
                threeHrBin: 0,
              },
              {
                type: 'wizard',
                carbInput: 80,
                recommended: {
                  carb: 8,
                  correction: 1.25,
                  net: 8.75,
                },
                bolus: {
                  type: 'bolus',
                  normal: 5.75,
                  extended: 2.5,
                  expectedExtended: 5,
                  duration: 3600 * 2,
                  expectedDuration: 3600 * 4,
                  utc: 1483315200000,
                },
              },
            ],
            cbg: [
              {
                type: 'cbg',
                value: 75,
                utc: 1483353000000,
              },
            ],
            smbg: [
              {
                type: 'smbg',
                value: 92,
                utc: 1483353000000,
              },
            ],
            timeInAutoRatio: {
              automated: 1483314400000,
              manual: 1483314400000,
            },
            food: [
              {
                nutrition: {
                  carbohydrate: {
                    net: 64.7551123,
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
};

export const bgLogData = {
  timePrefs,
  bgPrefs,
  metaData,
  data: {
    current: {
      endpoints: {
        range: [
          1561608000000,
          1564200000000,
        ],
        days: 30,
        activeDays: 30,
      },
      stats: {
        readingsInRange: {
          veryLow: 0,
          low: 0.21052631578947367,
          target: 1.105263157894737,
          high: 1.1578947368421053,
          veryHigh: 1.2105263157894737,
          total: 70,
        },
        averageGlucose: {
          averageGlucose: 12.737278189136658,
          total: 70,
        },
        totalInsulin: {
          basal: 0.6568947368421053,
          bolus: 1.3078947368421052,
        },
        carbs: {
          carbs: 33.63157894736842,
          total: 40,
        },
        averageDailyDose: {
          totalInsulin: 1.9647894736842106,
        },
      },
      aggregationsByDate: {
        dataByDate: {
          '2019-07-27': {
            smbg: [
              { value: 50 },
            ],
          },
          '2019-07-26': {
            smbg: [
              { value: 50, msPer24: THREE_HRS * 0.5 },
              { value: 70, msPer24: THREE_HRS * 1.5 },
              { value: 90, msPer24: THREE_HRS * 2.5 },
              { value: 150, msPer24: THREE_HRS * 3.5 },
              { value: 170, msPer24: THREE_HRS * 4.5 },
              { value: 190, msPer24: THREE_HRS * 5.5 },
              { value: 210, msPer24: THREE_HRS * 6.5 },
              { value: 260, msPer24: THREE_HRS * 7.5 },
            ],
          },
          '2019-07-25': {
            smbg: [
              { value: 60 },
            ],
          },
        },
      },
    },
  },
};
