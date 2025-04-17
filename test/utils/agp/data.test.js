/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
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

import * as utils from '../../../src/utils/agp/data';
import { formatCurrentDate } from '../../../src/utils/datetime';

const { agpCGMText } = utils;

const patient = {
  birthDate: '2001-01-01',
  email: 'tcrawford@test.test',
  fullName: 'Terence Crawford',
  id: '1234-abcd',
};

const data = {
  data: {
    current: {
      aggregationsByDate: {},
      stats: {
        averageGlucose: {
          averageGlucose: 121.4013071783735,
          total: 8442,
        },
        bgExtents: {
          bgMax: 401.00001001500004,
          bgMin: 38.9999690761,
          bgDaysWorn: 30,
          newestDatum: { time: 1736783190269 },
          oldestDatum: { time: 1734249705225 },
        },
        coefficientOfVariation: {
          coefficientOfVariation: 49.82047988955789,
          total: 8442,
        },
        glucoseManagementIndicator: {
          glucoseManagementIndicator: 6.236871267706695,
          glucoseManagementIndicatorAGP: 6.236871267706695,
          total: 8442,
        },
        sensorUsage: {
          sensorUsage: 2532600000,
          sensorUsageAGP: 99.95264030310206,
          total: 2592000000,
          sampleFrequency: 300000,
          count: 8442,
        },
        timeInRange: {
          durations: {
            veryLow: 337739.8720682303,
            low: 2507462.686567164,
            target: 66023027.7185501,
            high: 14031556.503198294,
            veryHigh: 3500213.219616205,
            total: 2532600000,
          },
          counts: {
            veryLow: 33,
            low: 245,
            target: 6451,
            high: 1371,
            veryHigh: 342,
            total: 8442,
          },
        },
      },
      endpoints: {
        range: [1734249600000, 1736841600000],
        days: 30,
        activeDays: 30,
      },
      data: {},
    },
  },
  timePrefs: { timezoneAware: true, timezoneName: 'Etc/GMT+8' },
  bgPrefs: {
    bgBounds: {
      veryHighThreshold: 250,
      targetUpperBound: 180,
      targetLowerBound: 70,
      veryLowThreshold: 54,
      extremeHighThreshold: 350,
      clampThreshold: 600,
    },
    bgClasses: {
      low: { boundary: 70 },
      target: { boundary: 180 },
      'very-low': { boundary: 54 },
      high: { boundary: 250 },
    },
    bgUnits: 'mg/dL',
  },
  query: {
    endpoints: [
      1734249600000,
      1736841600000,
    ],
    aggregationsByDate: 'dataByDate, statsByDate',
    bgSource: 'cbg',
    stats: [
      'averageGlucose',
      'bgExtents',
      'coefficientOfVariation',
      'glucoseManagementIndicator',
      'sensorUsage',
      'timeInRange',
    ],
    types: { cbg: {} },
    bgPrefs: {
      bgUnits: 'mg/dL',
      bgClasses: {
        low: { boundary: 70 },
        target: { boundary: 180 },
        'very-low': { boundary: 54 },
        high: { boundary: 250 },
      },
      bgBounds: {
        veryHighThreshold: 250,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 54,
        extremeHighThreshold: 350,
        clampThreshold: 600,
      },
    },
    metaData: 'latestPumpUpload, bgSources',
    timePrefs: {
      timezoneAware: true,
      timezoneName: 'Etc/GMT+8',
    },
    excludedDevices: [],
  },
  metaData: {},
};

const expectedOutput = (
`Terence Crawford
Date of birth: 2001-01-01
Exported from Tidepool TIDE: ${formatCurrentDate()}

Reporting Period: December 15, 2024 - January 13, 2025

Avg. Daily Time In Range (mg/dL)
70-180   76%   (18h 20m)
54-70   3%   (42m)
<54   0%   (6m)

Avg. Glucose (CGM): 121 mg/dL
`);

describe('[agp] data utils', () => {
  describe('agpCGMText', () => {
    it('should return the expected output', () => {
      expect(agpCGMText(patient, data)).to.eql(expectedOutput);
    });
  });
});
