/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017 Tidepool Project
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

/* eslint-disable max-len */

import _ from 'lodash';
import * as dataUtils from '../../../src/utils/basics/data';

import {
  MGDL_UNITS,
  MMOLL_UNITS,
  SITE_CHANGE_CANNULA,
} from '../../../src/utils/constants';

const bgBounds = {
  [MGDL_UNITS]: {
    veryHighThreshold: 300,
    targetUpperBound: 180,
    targetLowerBound: 70,
    veryLowThreshold: 55,
  },
  [MMOLL_UNITS]: {
    veryHighThreshold: 16.7,
    targetUpperBound: 10.0,
    targetLowerBound: 3.9,
    veryLowThreshold: 3.1,
  },
};

const bgPrefs = {
  [MGDL_UNITS]: {
    bgBounds: bgBounds[MGDL_UNITS],
    bgUnits: MGDL_UNITS,
  },
  [MMOLL_UNITS]: {
    bgBounds: bgBounds[MMOLL_UNITS],
    bgUnits: MMOLL_UNITS,
  },
};

const oneWeekDates = [
  {
    date: '2015-09-07',
    type: 'past',
  },
  {
    date: '2015-09-08',
    type: 'past',
  },
  {
    date: '2015-09-09',
    type: 'past',
  },
  {
    date: '2015-09-10',
    type: 'past',
  },
  {
    date: '2015-09-11',
    type: 'past',
  },
  {
    date: '2015-09-12',
    type: 'dayOfUpload',
  },
  {
    date: '2015-09-13',
    type: 'future',
  },
];

describe('basics data utils', () => {
  describe('defineBasicsAggregations', () => {
    const sectionNames = [
      'basals',
      'boluses',
      'fingersticks',
      'siteChanges',
    ];

    it('should return an object with all required basics section keys with the default properties set', () => {
      const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS]);
      expect(result).to.have.all.keys(sectionNames);
    });

    it('should set titles for each section', () => {
      const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS]);
      _.forEach(sectionNames, (section) => {
        expect(result[section].title).to.be.a('string');
      });
    });

    context('pump is not automated bolus device', () => {
      it('should set appropriate `perRow` property for each section', () => {
        const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS], 'tandem', { isAutomatedBolusDevice: false });
        _.forEach(sectionNames, (section) => {
          const expectedPerRow = section === 'basals' ? 4 : 3;
          expect(result[section].perRow).to.equal(expectedPerRow);
        });
      });

      it('should not add dimensions for manual and automated boluses', () => {
        const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS], 'tandem', { isAutomatedBolusDevice: false });
        expect(_.map(result.boluses.dimensions, 'key')).to.eql([
          'total',
          'wizard',
          'correction',
          'extended',
          'interrupted',
          'override',
          'underride',
        ]);
      });
    });

    context('pump is automated bolus device', () => {
      it('should set `perRow` property to 4 for the boluses section', () => {
        const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS], 'tandem', { isAutomatedBolusDevice: true });
        _.forEach(sectionNames, (section) => {
          const expectedPerRow = _.includes(['basals', 'boluses'], section) ? 4 : 3;
          expect(result[section].perRow).to.equal(expectedPerRow);
        });
      });

      it('should add dimensions for manual and automated boluses', () => {
        const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS], 'tandem', { isAutomatedBolusDevice: true });
        expect(_.map(result.boluses.dimensions, 'key')).to.eql([
          'total',
          'wizard',
          'correction',
          'extended',
          'interrupted',
          'override',
          'underride',
          'manual',
          'automated',
        ]);
      });

      it('should set percentage to `false` for automated bolus dimension', () => {
        const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS], 'tandem', { isAutomatedBolusDevice: true });
        expect(result.boluses.dimensions[8].key).to.equal('automated');
        expect(result.boluses.dimensions[8].percentage).to.be.false;
      });
    });

    it('should set the veryLow and veryHigh fingerstick filter labels correctly for mg/dL data', () => {
      const result = dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS]);
      const veryHighFilter = _.find(result.fingersticks.dimensions, { key: 'veryHigh' });
      const veryLowFilter = _.find(result.fingersticks.dimensions, { key: 'veryLow' });
      expect(veryHighFilter.label).to.equal('Above 300 mg/dL');
      expect(veryLowFilter.label).to.equal('Below 55 mg/dL');
    });

    it('should set the veryLow and veryHigh fingerstick filter labels correctly for mmol/L data', () => {
      const result = dataUtils.defineBasicsAggregations(bgPrefs[MMOLL_UNITS]);
      const veryHighFilter = _.find(result.fingersticks.dimensions, { key: 'veryHigh' });
      const veryLowFilter = _.find(result.fingersticks.dimensions, { key: 'veryLow' });
      expect(veryHighFilter.label).to.equal('Above 16.7 mmol/L');
      expect(veryLowFilter.label).to.equal('Below 3.1 mmol/L');
    });

    it('should set the label for the `automatedStop` filter based on the manufacturer', () => {
      const result = dataUtils.defineBasicsAggregations(bgPrefs[MMOLL_UNITS], 'medtronic');
      const automatedStopFilter = _.find(result.basals.dimensions, { key: 'automatedStop' });
      expect(automatedStopFilter.label).to.equal('Auto Mode Exited');
    });

    it('should set default label for the `automatedStop` filter when missing manufacturer', () => {
      const result = dataUtils.defineBasicsAggregations(bgPrefs[MMOLL_UNITS]);
      const automatedStopFilter = _.find(result.basals.dimensions, { key: 'automatedStop' });
      expect(automatedStopFilter.label).to.equal('Automated Exited');
    });

    context('is Loop device', () => {
      it('should hide the `temp` basals when empty for DIY Loop devices', () => {
        const result = dataUtils.defineBasicsAggregations(bgPrefs[MMOLL_UNITS], 'diy loop', { settings: { origin: { name: 'com.loopkit.Loop' } } });
        const tempFilter = _.find(result.basals.dimensions, { key: 'temp' });
        expect(tempFilter.hideEmpty).to.be.true;
      });

      it('should hide the `temp` basals when empty for Tidepool Loop devices', () => {
        const result = dataUtils.defineBasicsAggregations(bgPrefs[MMOLL_UNITS], 'tidepool loop', { settings: { origin: { name: 'org.tidepool.Loop' } } });
        const tempFilter = _.find(result.basals.dimensions, { key: 'temp' });
        expect(tempFilter.hideEmpty).to.be.true;
      });
    });
  });

  describe('generateCalendarDayLabels', () => {
    it('should generate an array of formatted day labels', () => {
      const result = dataUtils.generateCalendarDayLabels(oneWeekDates);
      expect(result).to.eql(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });
  });

  describe('getSiteChangeSource', () => {
    const patient = {
      settings: {
        siteChangeSource: null,
      },
    };

    it('should return the siteChange source to `undeclared` if patient and manufacturer are missing', () => {
      expect(dataUtils.getSiteChangeSource()).to.equal('undeclared');
    });

    context('manufacturer: insulet', () => {
      it('should return `reservoirChange` as the site change source', () => {
        expect(dataUtils.getSiteChangeSource(patient, 'insulet')).to.equal('reservoirChange');
      });
    });

    context('manufacturer: DIY Loop', () => {
      it('should return `tubingPrime` as the site change source', () => {
        expect(dataUtils.getSiteChangeSource(patient, 'diy loop')).to.equal('tubingPrime');
      });
    });

    context('manufacturer: Tidepool Loop', () => {
      it('should return `tubingPrime` as the site change source', () => {
        expect(dataUtils.getSiteChangeSource(patient, 'tidepool loop')).to.equal('tubingPrime');
      });
    });

    context('manufacturers: tandem, medtronic, animas', () => {
      it('should return `cannulaPrime` as the site change source if not stored in patient settings', () => {
        expect(dataUtils.getSiteChangeSource(patient, 'tandem')).to.equal('cannulaPrime');
        expect(dataUtils.getSiteChangeSource(patient, 'medtronic')).to.equal('cannulaPrime');
        expect(dataUtils.getSiteChangeSource(patient, 'animas')).to.equal('cannulaPrime');
      });

      it('should return `cannulaPrime` as the site change source value stored in patient settings is not in allowed list', () => {
        const patientWithBadSiteChangeSource = { ...patient, settings: { siteChangeSource: 'foo' } };
        expect(dataUtils.getSiteChangeSource(patientWithBadSiteChangeSource, 'tandem')).to.equal('cannulaPrime');
        expect(dataUtils.getSiteChangeSource(patientWithBadSiteChangeSource, 'medtronic')).to.equal('cannulaPrime');
        expect(dataUtils.getSiteChangeSource(patientWithBadSiteChangeSource, 'animas')).to.equal('cannulaPrime');
      });

      it('should return the site change source value stored in patient settings if it is in allowed list', () => {
        const patientWithCannulaPrime = { ...patient, settings: { siteChangeSource: 'cannulaPrime' } };
        const patientWithTubingPrime = { ...patient, settings: { siteChangeSource: 'tubingPrime' } };

        expect(dataUtils.getSiteChangeSource(patientWithCannulaPrime, 'tandem')).to.equal('cannulaPrime');
        expect(dataUtils.getSiteChangeSource(patientWithCannulaPrime, 'medtronic')).to.equal('cannulaPrime');
        expect(dataUtils.getSiteChangeSource(patientWithCannulaPrime, 'animas')).to.equal('cannulaPrime');

        expect(dataUtils.getSiteChangeSource(patientWithTubingPrime, 'tandem')).to.equal('tubingPrime');
        expect(dataUtils.getSiteChangeSource(patientWithTubingPrime, 'medtronic')).to.equal('tubingPrime');
        expect(dataUtils.getSiteChangeSource(patientWithTubingPrime, 'animas')).to.equal('tubingPrime');
      });
    });

    context('manufacturers: twiist', () => {
      it('should return `reservoirChange` as the site change source if not stored in patient settings', () => {
        expect(dataUtils.getSiteChangeSource(patient, 'twiist')).to.equal('reservoirChange');
      });

      it('should return `reservoirChange` as the site change source value stored in patient settings is not in allowed list', () => {
        const patientWithBadSiteChangeSource = { ...patient, settings: { siteChangeSource: 'foo' } };
        expect(dataUtils.getSiteChangeSource(patientWithBadSiteChangeSource, 'twiist')).to.equal('reservoirChange');
      });

      it('should return the site change source value stored in patient settings if it is in allowed list', () => {
        const patientWithReservoirChange = { ...patient, settings: { siteChangeSource: 'reservoirChange' } };
        const patientWithCannulaPrime = { ...patient, settings: { siteChangeSource: 'cannulaPrime' } };

        expect(dataUtils.getSiteChangeSource(patientWithReservoirChange, 'twiist')).to.equal('reservoirChange');
        expect(dataUtils.getSiteChangeSource(patientWithCannulaPrime, 'twiist')).to.equal('cannulaPrime');
      });
    });
  });

  describe('getSiteChangeSourceLabel', () => {
    it('should return the appropriate labels for animas pumps', () => {
      expect(dataUtils.getSiteChangeSourceLabel('cannulaPrime', 'animas')).to.equal('Cannula Fill');
      expect(dataUtils.getSiteChangeSourceLabel('tubingPrime', 'animas')).to.equal('Go Prime');
    });

    it('should return the appropriate labels for medtronic pumps', () => {
      expect(dataUtils.getSiteChangeSourceLabel('cannulaPrime', 'medtronic')).to.equal('Cannula Prime');
      expect(dataUtils.getSiteChangeSourceLabel('tubingPrime', 'medtronic')).to.equal('Prime');
    });

    it('should return the appropriate labels for tandem pumps', () => {
      expect(dataUtils.getSiteChangeSourceLabel('cannulaPrime', 'tandem')).to.equal('Cannula Fill');
      expect(dataUtils.getSiteChangeSourceLabel('tubingPrime', 'tandem')).to.equal('Tubing Fill');
    });

    it('should return the appropriate labels for insulet pumps', () => {
      expect(dataUtils.getSiteChangeSourceLabel('reservoirChange', 'insulet')).to.equal('Pod Change');
    });

    it('should return the appropriate labels for DIY Loop pumps', () => {
      expect(dataUtils.getSiteChangeSourceLabel('tubingPrime', 'diy loop')).to.equal('Tubing Fill');
    });

    it('should return the appropriate labels for Tidepool Loop pumps', () => {
      expect(dataUtils.getSiteChangeSourceLabel('tubingPrime', 'tidepool loop')).to.equal('Tubing Fill');
    });

    it('should fall back to a default label when a manufacturer-specific label cannot be found', () => {
      expect(dataUtils.getSiteChangeSourceLabel('myEvent', 'pumpCo')).to.equal('Cartridge Change');
    });

    it('should return `null` when siteChangeSource is `undeclared`', () => {
      expect(dataUtils.getSiteChangeSourceLabel('undeclared', 'pumpCo')).to.equal(null);
    });
  });

  describe('processBasicsAggregations', () => {
    const aggregations = {
      basals: { type: 'basals' },
      boluses: { type: 'boluses' },
      fingersticks: { type: 'fingersticks' },
      siteChanges: { type: 'siteChanges' },
    };

    const data = {
      basals: {
        basal: { byDate: {} },
        automatedSuspend: { byDate: {} },
      },
      boluses: { byDate: {} },
      fingersticks: {
        calibration: { byDate: {} },
        smbg: { byDate: {} },
      },
      siteChanges: { byDate: {} },
    };

    const patient = {
      settings: {
        siteChangeSource: 'undeclared',
      },
    };

    const manufacturer = 'medtronic';

    it('should disable sections for which there is no data available', () => {
      const result = dataUtils.processBasicsAggregations({ ...aggregations }, data, patient, manufacturer);

      // basals gets disabled when no data
      expect(result.basals.disabled).to.be.true;

      // boluses gets disabled when no data
      expect(result.boluses.disabled).to.be.true;

      // siteChanges gets disabled when no data
      expect(result.siteChanges.disabled).to.be.true;

      // fingersticks gets disabled when no data
      expect(result.fingersticks.disabled).to.be.true;
    });

    it('should prioritize checking summary.total over existence of byDate keys to check data availability', () => {
      const aggregationsData = {
        ...data,
        basals: {
          basal: { byDate: { dateKey1: {}, dateKey2: {} }, summary: { total: 0 } },
          automatedSuspend: { byDate: {} },
        },
        boluses: { byDate: { dateKey1: {}, dateKey2: {} } },
      };
      const result = dataUtils.processBasicsAggregations(aggregations, aggregationsData, patient, manufacturer);

      expect(result.basals.disabled).to.be.true;
      expect(result.boluses.disabled).to.be.false;
    });

    it('should set empty text for sections for which there is no data available', () => {
      const resultWithMissingData = dataUtils.processBasicsAggregations({ ...aggregations }, data, patient, manufacturer);

      const resultWithBasalsAndBolusesDisabled = dataUtils.processBasicsAggregations({ ...{
        ...aggregations,
        basals: { ...aggregations.basals, disabled: true },
        boluses: { ...aggregations.boluses, disabled: true },
      } }, data, patient, manufacturer);

      // basals gets emptyText set when no data
      expect(resultWithMissingData.basals.emptyText).to.equal('There are no basal events to display for this date range.');
      expect(resultWithBasalsAndBolusesDisabled.basals.emptyText).to.equal("This section requires data from an insulin pump, so there's nothing to display.");

      // boluses gets emptyText set when no data
      expect(resultWithMissingData.boluses.emptyText).to.equal('There are no bolus events to display for this date range.');
      expect(resultWithBasalsAndBolusesDisabled.boluses.emptyText).to.equal("This section requires data from an insulin pump, so there's nothing to display.");

      // fingersticks gets emptyText set when no data
      expect(resultWithMissingData.fingersticks.emptyText).to.equal("This section requires data from a blood-glucose meter, so there's nothing to display.");

      // siteChanges gets emptyText set when no data
      expect(resultWithMissingData.siteChanges.emptyText).to.equal("This section requires data from an insulin pump, so there's nothing to display.");
    });
  });

  describe('findBasicsDays', () => {
    it('should always return at least 7 days, Monday thru Friday', () => {
      expect(_.map(dataUtils.findBasicsDays([
        '2015-09-07T07:00:00.000Z',
        '2015-09-07T12:00:00.000Z',
      ], 'US/Pacific'), 'date')).to.deep.equal([
        '2015-09-07',
        '2015-09-08',
        '2015-09-09',
        '2015-09-10',
        '2015-09-11',
        '2015-09-12',
        '2015-09-13',
      ]);
    });

    it('should return a multiple of 7 days, Monday thru Friday', () => {
      expect(_.map(dataUtils.findBasicsDays([
        '2015-09-07T05:00:00.000Z',
        '2015-09-24T12:00:00.000Z',
      ], 'US/Central'), 'date')).to.deep.equal([
        '2015-09-07',
        '2015-09-08',
        '2015-09-09',
        '2015-09-10',
        '2015-09-11',
        '2015-09-12',
        '2015-09-13',
        '2015-09-14',
        '2015-09-15',
        '2015-09-16',
        '2015-09-17',
        '2015-09-18',
        '2015-09-19',
        '2015-09-20',
        '2015-09-21',
        '2015-09-22',
        '2015-09-23',
        '2015-09-24',
        '2015-09-25',
        '2015-09-26',
        '2015-09-27',
      ]);
    });

    it('should use UTC for the timezone when none provided', () => {
      expect(_.map(dataUtils.findBasicsDays([
        '2015-09-07T00:00:00.000Z',
        '2015-09-07T12:00:00.000Z',
      ]), 'date')).to.deep.equal([
        '2015-09-07',
        '2015-09-08',
        '2015-09-09',
        '2015-09-10',
        '2015-09-11',
        '2015-09-12',
        '2015-09-13',
      ]);
    });

    it('should categorize each date as `inRange` or `outOfRange`', () => {
      expect(dataUtils.findBasicsDays([
        '2015-09-09T00:00:00.000Z',
        '2015-09-10T12:00:00.000Z',
      ], 'Pacific/Auckland')).to.deep.equal([
        { date: '2015-09-07', type: 'outOfRange' },
        { date: '2015-09-08', type: 'outOfRange' },
        { date: '2015-09-09', type: 'inRange' },
        { date: '2015-09-10', type: 'inRange' },
        { date: '2015-09-11', type: 'outOfRange' },
        { date: '2015-09-12', type: 'outOfRange' },
        { date: '2015-09-13', type: 'outOfRange' },
      ]);
    });
  });

  describe('findBasicsStart', () => {
    it('should find the timezone-local midnight of the Monday >= 14 days prior to provided datetime', () => {
      // exactly 28 days
      expect(dataUtils.findBasicsStart('2015-09-07T05:00:00.000Z', 'US/Central').toISOString())
        .to.equal('2015-08-24T05:00:00.000Z');
      // almost but not quite 35 days
      expect(dataUtils.findBasicsStart('2015-09-13T09:00:00.000Z', 'Pacific/Honolulu').toISOString())
        .to.equal('2015-08-24T10:00:00.000Z');
      // just over threshold into new local week
      expect(dataUtils.findBasicsStart('2015-09-14T06:01:00.000Z', 'US/Mountain').toISOString())
        .to.equal('2015-08-31T06:00:00.000Z');
    });

    it('should find UTC midnight of the Monday >= 14 days prior to provided UTC datetime (when no timezone provided)', () => {
      // exactly 28 days
      expect(dataUtils.findBasicsStart('2015-09-07T00:00:00.000Z').toISOString())
        .to.equal('2015-08-24T00:00:00.000Z');
      // almost but not quite 35 days
      expect(dataUtils.findBasicsStart('2015-09-13T23:55:00.000Z').toISOString())
        .to.equal('2015-08-24T00:00:00.000Z');
      // just over threshold into new UTC week
      expect(dataUtils.findBasicsStart('2015-09-14T00:01:00.000Z').toISOString())
        .to.equal('2015-08-31T00:00:00.000Z');
    });
  });

  describe('basicsText', () => {
    /* eslint-disable lines-between-class-members */
    class TextUtilStub {
      buildDocumentHeader = sinon.stub().returns('Basics Header, ');
      buildDocumentDates = sinon.stub().returns('Basics Dates, ');
      buildTextLine = sinon.stub().returns('Basics Line, ');
      buildTextTable = sinon.stub().returns('Basics Table, ');
    }
    /* eslint-enable lines-between-class-members */

    const patient = {
      profile: { patient: {
        fullName: 'John Doe',
        birthDate: '2000-01-01',
        diagnosisDate: '2014-12-31',
      } },
      settings: {
        siteChangeSource: SITE_CHANGE_CANNULA,
      },
    };

    const stats = [{ id: 'myStat' }];
    const endpoints = ['2019-02-01T00:00:00.000Z', '2019-02-20T00:00:00.000Z'];
    const timePrefs = { timezoneName: 'US/Eastern', timezoneAware: true };

    const data = {
      data: {
        aggregationsByDate: {
          fingersticks: {
            calibration: {
              summary: {
                subtotals: {
                  calibration: { count: 5 },
                },
              },
            },
            smbg: {
              summary: {
                avgPerDay: 5,
                subtotals: {
                  meter: { count: 1 },
                  manual: { count: 2 },
                  veryLow: { count: 3 },
                  veryHigh: { count: 4 },
                },
              },
            },
          },
          boluses: {
            summary: {
              avgPerDay: 3,
              subtotals: {
                wizard: { count: 1 },
                correction: { count: 2 },
                extended: { count: 3 },
                interrupted: { count: 4 },
                override: { count: 5 },
                underride: { count: 6 },
              },
            },
          },
          siteChanges: {
            byDate: {
              '2018-03-08': { summary: { daysSince: { cannulaPrime: 1 } } },
              '2018-03-10': { summary: { daysSince: { cannulaPrime: 2 } } },
              '2018-03-13': { summary: { daysSince: { cannulaPrime: 3 } } },
            },
          },
          basals: {
            basal: {
              summary: {
                total: 6,
                subtotals: {
                  temp: { count: 1 },
                  suspend: { count: 2 },
                  automatedStop: { count: 3 },
                },
              },
            },
            automatedSuspend: {
              summary: {
                total: 4,
                subtotals: {
                  automatedSuspend: { count: 4 },
                },
              },
            },
          },
        },
        current: {
          endpoints,
        },
      },
      bgPrefs: bgPrefs[MGDL_UNITS],
      timePrefs,
      metaData: {
        devices: [
          { id: 'deviceWithLabelId', label: 'Device With Label' },
          { id: 'deviceWithoutLabelId' },
          { id: 'deviceNotUsedInCurrentDataId' },
        ],
        matchedDevices: {
          deviceWithLabelId: true,
          deviceWithoutLabelId: true,
        },
      },
    };

    const aggregations = {
      basals: {
        type: 'basals',
        title: 'Basals',
        summaryTitle: 'Total basal events',
        dimensions: [
          { path: 'basal.summary', key: 'total', label: 'Basal Events', primary: true },
          { path: 'basal.summary.subtotals', key: 'temp', label: 'Temp Basals' },
          { path: 'basal.summary.subtotals', key: 'suspend', label: 'Suspends' },
          { path: 'basal.summary.subtotals', key: 'automatedStop', label: 'Auto Mode Exited', hideEmpty: true },
          { path: 'automatedSuspend.summary.subtotals', key: 'automatedSuspend', label: 'Automated Suspend', hideEmpty: true },
        ],
      },
      boluses: {
        type: 'boluses',
        title: 'Bolusing',
        summaryTitle: 'Avg boluses / day',
        dimensions: [
          { path: 'summary', key: 'total', label: 'Avg per day', average: true, primary: true },
          { path: 'summary.subtotals', key: 'wizard', label: 'Calculator', percentage: true, selectorIndex: 0 },
          { path: 'summary.subtotals', key: 'correction', label: 'Correction', percentage: true, selectorIndex: 1 },
          { path: 'summary.subtotals', key: 'extended', label: 'Extended', percentage: true, selectorIndex: 3 },
          { path: 'summary.subtotals', key: 'interrupted', label: 'Interrupted', percentage: true, selectorIndex: 4 },
          { path: 'summary.subtotals', key: 'override', label: 'Override', percentage: true, selectorIndex: 2 },
          { path: 'summary.subtotals', key: 'underride', label: 'Underride', percentage: true, selectorIndex: 5 },
        ],
      },
      fingersticks: {
        type: 'fingersticks',
        title: 'BG Readings',
        summaryTitle: 'Avg BG readings / day',
        dimensions: [
          { path: 'smbg.summary', key: 'total', label: 'Avg per day', average: true, primary: true },
          { path: 'smbg.summary.subtotals', key: 'meter', label: 'Meter', percentage: true },
          { path: 'smbg.summary.subtotals', key: 'manual', label: 'Manual', percentage: true },
          { path: 'calibration.summary.subtotals', key: 'calibration', label: 'Calibrations', hideEmpty: true },
          { path: 'smbg.summary.subtotals', key: 'veryLow', label: 'Below 54 mg/dL', percentage: true },
          { path: 'smbg.summary.subtotals', key: 'veryHigh', label: 'Above 300 mg/dL', percentage: true },
        ],
      },
      siteChanges: {
        type: 'siteChanges',
        title: 'Site Changes',
        subTitle: 'Cannula Fill',
        source: 'cannulaPrime',
      },
    };

    let textUtilStub;

    before(() => {
      textUtilStub = new TextUtilStub();
      sinon.stub(dataUtils.utils, 'TextUtil').returns(textUtilStub);
      sinon.stub(dataUtils.utils, 'statsText').returns('Stats Text, ');
    });

    afterEach(() => {
      dataUtils.utils.TextUtil.resetHistory();
      dataUtils.utils.statsText.resetHistory();
      textUtilStub.buildDocumentHeader.resetHistory();
      textUtilStub.buildDocumentDates.resetHistory();
      textUtilStub.buildTextLine.resetHistory();
      textUtilStub.buildTextTable.resetHistory();
    });

    after(() => {
      dataUtils.utils.TextUtil.restore();
      dataUtils.utils.statsText.restore();
    });

    it('should return formatted text for Basics data', () => {
      const result = dataUtils.basicsText(patient, data, stats, aggregations);
      expect(result).to.equal('Basics Header, Basics Dates, Basics Line, Stats Text, Basics Table, Basics Table, Basics Table, Basics Table, Basics Line, Basics Line, Basics Line, ');
    });

    it('should build the document header section', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.callCount(textUtilStub.buildDocumentHeader, 1);
      sinon.assert.calledWith(textUtilStub.buildDocumentHeader, 'Basics');
    });

    it('should build the document dates section', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.callCount(textUtilStub.buildDocumentDates, 1);
    });

    it('should add a note regarding excluded basics bolus days', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.calledWith(textUtilStub.buildTextLine, 'Days with no insulin data have been excluded from calculations');
    });

    it('should build the basics stats section', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.callCount(dataUtils.utils.statsText, 1);
      sinon.assert.calledWith(dataUtils.utils.statsText, stats, textUtilStub, bgPrefs[MGDL_UNITS]);
    });

    it('should build a summary table for fingerstick data', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        '',
        [{ label: 'Avg BG readings / day', value: '5' }, { label: 'Meter', value: '1' }, { label: 'Manual', value: '2' }, { label: 'Calibrations', value: '5' }, { label: 'Below 54 mg/dL', value: '3' }, { label: 'Above 300 mg/dL', value: '4' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should build a summary table for bolus data', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        '',
        [{ label: 'Avg boluses / day', value: '3' }, { label: 'Calculator', value: '1' }, { label: 'Correction', value: '2' }, { label: 'Extended', value: '3' }, { label: 'Interrupted', value: '4' }, { label: 'Override', value: '5' }, { label: 'Underride', value: '6' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should build a summary table for siteChange data', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        'Site Changes from \'Cannula Fill\'',
        [{ label: 'Mean Duration', value: '2 days' }, { label: 'Longest Duration', value: '3 days' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should round `Mean Duration` for site changes to 1 decimal place', () => {
      const updatedData = _.cloneDeep(data);
      updatedData.data.aggregationsByDate.siteChanges = {
        byDate: {
          '2018-03-08': { summary: { daysSince: { cannulaPrime: 3 } } },
          '2018-03-10': { summary: { daysSince: { cannulaPrime: 5 } } },
          '2018-03-13': { summary: { daysSince: { cannulaPrime: 5 } } },
        },
      };

      expect(_.mean([3, 5, 5])).to.equal(4.333333333333333);

      dataUtils.basicsText(patient, updatedData, stats, aggregations);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        'Site Changes from \'Cannula Fill\'',
        [{ label: 'Mean Duration', value: '4.3 days' }, { label: 'Longest Duration', value: '5 days' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should build a summary table for basal data', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        '',
        [{ label: 'Total basal events', value: '6' }, { label: 'Temp Basals', value: '1' }, { label: 'Suspends', value: '2' }, { label: 'Auto Mode Exited', value: '3' }, { label: 'Automated Suspend', value: '4' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should output devices found in the current data set used for the report', () => {
      dataUtils.basicsText(patient, data, stats, aggregations);
      sinon.assert.calledWith(textUtilStub.buildTextLine, '\nDevices Uploaded');
      sinon.assert.calledWith(textUtilStub.buildTextLine, 'Device With Label');
      sinon.assert.calledWith(textUtilStub.buildTextLine, 'deviceWithoutLabelId');
      sinon.assert.neverCalledWith(textUtilStub.buildTextLine, 'deviceNotUsedInCurrentDataId');
    });
  });
});
/* eslint-enable max-len */
