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

import _ from 'lodash';

import types from '../types';
import { THREE_HRS } from '../../src/utils/datetime';
import { DEFAULT_BG_BOUNDS, MGDL_UNITS, CGM_DATA_KEY } from '../../src/utils/constants';

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
          dailyAverages: {
            veryLow: 0,
            low: 0.21052631578947367,
            target: 1.105263157894737,
            high: 1.1578947368421053,
            veryHigh: 1.2105263157894737,
            total: 70,
          },
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
        standardDev: {
          standardDev: 4.3,
        },
        averageDailyDose: {
          totalInsulin: 1.9647894736842106,
        },
      },
      aggregationsByDate: {
        basals: {
          basal: {
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
          automatedSuspend: {
            summary: {
              avgPerDay: 3.5,
              total: 7,
              subtotals: {
                automatedSuspend: {
                  count: 5,
                  percentage: 1,
                },
              },
            },
            byDate: {
              '2019-07-23': {
                total: 5,
                subtotals: {
                  automatedSuspend: 5,
                },
              },
              '2019-07-24': {
                total: 2,
                subtotals: {
                  automatedSuspend: 5,
                },
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
            deviceEvent: [
              {
                type: 'deviceEvent',
                subType: 'pumpSettingsOverride',
                overrideType: 'sleep',
                normalTime: 1483313400000,
                duration: 1000000,
              },
              {
                type: 'deviceEvent',
                subType: 'pumpSettingsOverride',
                overrideType: 'physicalActivity',
                normalTime: 1483314400000,
                duration: 1000000,
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
          dailyAverages: {
            veryLow: 0,
            low: 0.21052631578947367,
            target: 1.105263157894737,
            high: 1.1578947368421053,
            veryHigh: 1.2105263157894737,
            total: 70,
          },
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

const agpDataByDate = {
  '2023-03-16': { cbg: [
    {
      time: 1678939365000,
      msPer24: 165000,
      localDate: '2023-03-16',
    },
    {
      time: 1678976565000,
      msPer24: 37365000,
      localDate: '2023-03-16',
    },
  ] },
  '2023-03-15': { cbg: [
    {
      time: 1678852964000,
      msPer24: 164000,
      localDate: '2023-03-15',
    },
    {
      time: 1678939066000,
      msPer24: 86266000,
      localDate: '2023-03-15',
    },
  ] },
  '2023-03-14': { cbg: [
    {
      time: 1678766561000,
      msPer24: 161000,
      localDate: '2023-03-14',
    },
    {
      time: 1678852664000,
      msPer24: 86264000,
      localDate: '2023-03-14',
    },
  ] },
  '2023-03-13': { cbg: [
    {
      time: 1678680159000,
      msPer24: 159000,
      localDate: '2023-03-13',
    },
    {
      time: 1678766261000,
      msPer24: 86261000,
      localDate: '2023-03-13',
    },
  ] },
  '2023-03-12': { cbg: [
    {
      time: 1678597358000,
      msPer24: 158000,
      localDate: '2023-03-12',
    },
    {
      time: 1678679859000,
      msPer24: 86259000,
      localDate: '2023-03-12',
    },
  ] },
  '2023-03-11': { cbg: [
    {
      time: 1678510958000,
      msPer24: 158000,
      localDate: '2023-03-11',
    },
    {
      time: 1678597059000,
      msPer24: 86259000,
      localDate: '2023-03-11',
    },
  ] },
  '2023-03-10': { cbg: [
    {
      time: 1678424554000,
      msPer24: 154000,
      localDate: '2023-03-10',
    },
    {
      time: 1678510657000,
      msPer24: 86257000,
      localDate: '2023-03-10',
    },
  ] },
  '2023-03-09': { cbg: [
    {
      time: 1678338154000,
      msPer24: 154000,
      localDate: '2023-03-09',
    },
    {
      time: 1678424254000,
      msPer24: 86254000,
      localDate: '2023-03-09',
    },
  ] },
  '2023-03-08': { cbg: [
    {
      time: 1678251751000,
      msPer24: 151000,
      localDate: '2023-03-08',
    },
    {
      time: 1678337854000,
      msPer24: 86254000,
      localDate: '2023-03-08',
    },
  ] },
  '2023-03-07': { cbg: [
    {
      time: 1678171950000,
      msPer24: 6750000,
      localDate: '2023-03-07',
    },
    {
      time: 1678251452000,
      msPer24: 86252000,
      localDate: '2023-03-07',
    },
  ] },
  '2023-03-06': { cbg: [
    {
      time: 1678078948000,
      msPer24: 148000,
      localDate: '2023-03-06',
    },
    {
      time: 1678163250000,
      msPer24: 84450000,
      localDate: '2023-03-06',
    },
  ] },
  '2023-03-05': { cbg: [
    {
      time: 1677992546000,
      msPer24: 146000,
      localDate: '2023-03-05',
    },
    {
      time: 1678078648000,
      msPer24: 86248000,
      localDate: '2023-03-05',
    },
  ] },
  '2023-03-04': { cbg: [
    {
      time: 1677906146000,
      msPer24: 146000,
      localDate: '2023-03-04',
    },
    {
      time: 1677992246000,
      msPer24: 86246000,
      localDate: '2023-03-04',
    },
  ] },
  '2023-03-03': { cbg: [
    {
      time: 1677819745000,
      msPer24: 145000,
      localDate: '2023-03-03',
    },
    {
      time: 1677905846000,
      msPer24: 86246000,
      localDate: '2023-03-03',
    },
  ] },
};

export const agpData = {
  timePrefs,
  bgPrefs,
  data: {
    current: {
      data: {
        cbg: _.reduce(_.keys(agpDataByDate), (res, date) => {
          res.push(...agpDataByDate[date].cbg);
          return res;
        }, []),
      },
      endpoints: {
        range: [
          1677819600000,
          1679025600000,
        ],
        days: 13.958333333333334,
        activeDays: 14,
      },
      aggregationsByDate: {
        statsByDate: {
          '2023-03-16': {
            bgExtents: {
              newestDatum: {
                time: 1678976565000,
                msPer24: 37365000,
                localDate: '2023-03-16',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678939365000,
                msPer24: 165000,
                localDate: '2023-03-16',
              },
            },
            sensorUsage: {
              sensorUsage: 37500000,
              sensorUsageAGP: 100,
              total: 86400000,
              sampleFrequency: 300000,
              count: 125,
            },
          },
          '2023-03-15': {
            bgExtents: {
              newestDatum: {
                time: 1678939066000,
                msPer24: 86266000,
                localDate: '2023-03-15',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678852964000,
                msPer24: 164000,
                localDate: '2023-03-15',
              },
            },
            sensorUsage: {
              sensorUsage: 86400000,
              sensorUsageAGP: 99.93060374739764,
              total: 86400000,
              sampleFrequency: 300000,
              count: 288,
            },
          },
          '2023-03-14': {
            bgExtents: {
              newestDatum: {
                time: 1678852664000,
                msPer24: 86264000,
                localDate: '2023-03-14',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678766561000,
                msPer24: 161000,
                localDate: '2023-03-14',
              },
            },
            sensorUsage: {
              sensorUsage: 86400000,
              sensorUsageAGP: 99.93060374739764,
              total: 86400000,
              sampleFrequency: 300000,
              count: 288,
            },
          },
          '2023-03-13': {
            bgExtents: {
              newestDatum: {
                time: 1678766261000,
                msPer24: 86261000,
                localDate: '2023-03-13',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678680159000,
                msPer24: 159000,
                localDate: '2023-03-13',
              },
            },
            sensorUsage: {
              sensorUsage: 86400000,
              sensorUsageAGP: 99.93060374739764,
              total: 86400000,
              sampleFrequency: 300000,
              count: 288,
            },
          },
          '2023-03-12': {
            bgExtents: {
              newestDatum: {
                time: 1678679859000,
                msPer24: 86259000,
                localDate: '2023-03-12',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678597358000,
                msPer24: 158000,
                localDate: '2023-03-12',
              },
            },
            sensorUsage: {
              sensorUsage: 82800000,
              sensorUsageAGP: 99.9275887038378,
              total: 86400000,
              sampleFrequency: 300000,
              count: 276,
            },
          },
          '2023-03-11': {
            bgExtents: {
              newestDatum: {
                time: 1678597059000,
                msPer24: 86259000,
                localDate: '2023-03-11',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678510958000,
                msPer24: 158000,
                localDate: '2023-03-11',
              },
            },
            sensorUsage: {
              sensorUsage: 78600000,
              sensorUsageAGP: 90.90909090909092,
              total: 86400000,
              sampleFrequency: 300000,
              count: 262,
            },
          },
          '2023-03-10': {
            bgExtents: {
              newestDatum: {
                time: 1678510657000,
                msPer24: 86257000,
                localDate: '2023-03-10',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678424554000,
                msPer24: 154000,
                localDate: '2023-03-10',
              },
            },
            sensorUsage: {
              sensorUsage: 86400000,
              sensorUsageAGP: 99.93060374739764,
              total: 86400000,
              sampleFrequency: 300000,
              count: 288,
            },
          },
          '2023-03-09': {
            bgExtents: {
              newestDatum: {
                time: 1678424254000,
                msPer24: 86254000,
                localDate: '2023-03-09',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678338154000,
                msPer24: 154000,
                localDate: '2023-03-09',
              },
            },
            sensorUsage: {
              sensorUsage: 86100000,
              sensorUsageAGP: 99.65277777777779,
              total: 86400000,
              sampleFrequency: 300000,
              count: 287,
            },
          },
          '2023-03-08': {
            bgExtents: {
              newestDatum: {
                time: 1678337854000,
                msPer24: 86254000,
                localDate: '2023-03-08',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678251751000,
                msPer24: 151000,
                localDate: '2023-03-08',
              },
            },
            sensorUsage: {
              sensorUsage: 86400000,
              sensorUsageAGP: 99.93060374739764,
              total: 86400000,
              sampleFrequency: 300000,
              count: 288,
            },
          },
          '2023-03-07': {
            bgExtents: {
              newestDatum: {
                time: 1678251452000,
                msPer24: 86252000,
                localDate: '2023-03-07',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678171950000,
                msPer24: 6750000,
                localDate: '2023-03-07',
              },
            },
            sensorUsage: {
              sensorUsage: 79800000,
              sensorUsageAGP: 99.92486851990985,
              total: 86400000,
              sampleFrequency: 300000,
              count: 266,
            },
          },
          '2023-03-06': {
            bgExtents: {
              newestDatum: {
                time: 1678163250000,
                msPer24: 84450000,
                localDate: '2023-03-06',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1678078948000,
                msPer24: 148000,
                localDate: '2023-03-06',
              },
            },
            sensorUsage: {
              sensorUsage: 84600000,
              sensorUsageAGP: 99.92912827781716,
              total: 86400000,
              sampleFrequency: 300000,
              count: 282,
            },
          },
          '2023-03-05': {
            bgExtents: {
              newestDatum: {
                time: 1678078648000,
                msPer24: 86248000,
                localDate: '2023-03-05',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1677992546000,
                msPer24: 146000,
                localDate: '2023-03-05',
              },
            },
            sensorUsage: {
              sensorUsage: 86400000,
              sensorUsageAGP: 99.93060374739764,
              total: 86400000,
              sampleFrequency: 300000,
              count: 288,
            },
          },
          '2023-03-04': {
            bgExtents: {
              newestDatum: {
                time: 1677992246000,
                msPer24: 86246000,
                localDate: '2023-03-04',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1677906146000,
                msPer24: 146000,
                localDate: '2023-03-04',
              },
            },
            sensorUsage: {
              sensorUsage: 86700000,
              sensorUsageAGP: 100.34722222222223,
              total: 86400000,
              sampleFrequency: 300000,
              count: 289,
            },
          },
          '2023-03-03': {
            bgExtents: {
              newestDatum: {
                time: 1677905846000,
                msPer24: 86246000,
                localDate: '2023-03-03',
              },
              bgDaysWorn: 1,
              oldestDatum: {
                time: 1677819745000,
                msPer24: 145000,
                localDate: '2023-03-03',
              },
            },
            sensorUsage: {
              sensorUsage: 84600000,
              sensorUsageAGP: 97.84871616932685,
              total: 86400000,
              sampleFrequency: 300000,
              count: 282,
            },
          },
        },
        dataByDate: agpDataByDate,
      },
      stats: {
        timeInRange: {
          durations: {
            veryLow: 546115.3542270213,
            low: 2275480.642612589,
            target: 48900079.00974453,
            high: 23847037.13457993,
            veryHigh: 10831287.858835923,
            total: 1139100000,
          },
          counts: {
            veryLow: 24,
            low: 100,
            target: 2149,
            high: 1048,
            veryHigh: 476,
            total: 3797,
          },
        },
        averageGlucose: {
          averageGlucose: 167.5198838861572,
          total: 3797,
        },
        bgExtents: {
          newestDatum: {
            time: 1678976565000,
            msPer24: 37365000,
            localDate: '2023-03-16',
          },
          bgDaysWorn: 14,
          oldestDatum: {
            time: 1677819745000,
            msPer24: 145000,
            localDate: '2023-03-03',
          },
        },
        sensorUsage: {
          sensorUsage: 1139100000,
          sensorUsageAGP: 98.43928238100177,
          total: 1209600000,
          sampleFrequency: 300000,
          count: 3797,
        },
        glucoseManagementIndicator: {
          glucoseManagementIndicator: 7.31707562255688,
          glucoseManagementIndicatorAGP: 7.31707562255688,
          total: 3797,
        },
        coefficientOfVariation: {
          coefficientOfVariation: 39.794312591046626,
          total: 3797,
        },
      },
    },
  },
  metaData: {
    bgSources: { current: CGM_DATA_KEY },
  },
};
