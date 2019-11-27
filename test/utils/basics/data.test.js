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
import Types from '../../../data/types';
import { basicsData as basicsDataFixtures } from '../../../data/print/fixtures';

import {
  MGDL_UNITS,
  MMOLL_UNITS,
  SITE_CHANGE_CANNULA,
  ANIMAS,
  MEDTRONIC,
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

describe.only('basics data utils', () => {
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
  });

  describe('generateCalendarDayLabels', () => {
    it('should generate an array of formatted day labels', () => {
      const result = dataUtils.generateCalendarDayLabels(oneWeekDates);
      expect(result).to.eql(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });
  });

  describe('getSiteChangeSource', () => {

  });

  describe('getSiteChangeSourceLabel', () => {

  });

  describe('processBasicsAggregations', () => {
    const basicsData = {
      data: {
        cbg: { data: [new Types.CBG()] },
        smbg: { data: [] },
        basal: { data: [] },
        bolus: { data: [] },
        fingerstick: {
          smbg: { data: [] },
          calibration: { data: [] },
        },
        cannulaPrime: { dataByDate: {} },
        tubingPrime: { dataByDate: {} },
        upload: { data: [new Types.Upload({ deviceTags: ['insulin-pump'], source: MEDTRONIC })] },
      },
      days: oneWeekDates,
      sections: dataUtils.defineBasicsAggregations(bgPrefs[MGDL_UNITS], MEDTRONIC, '1780'),
    };

    it('should disable sections for which there is no data available', () => {
      expect(basicsData.sections.basals.active).to.be.true;
      expect(basicsData.sections.boluses.active).to.be.true;
      expect(basicsData.sections.siteChanges.active).to.be.true;
      expect(basicsData.sections.fingersticks.active).to.be.true;
      expect(_.find(basicsData.sections.fingersticks.dimensions, { key: 'calibration' })).to.not.be.undefined;
      const result = dataUtils.processBasicsAggregations(basicsData);

      // basals gets disabled when no data
      expect(result.sections.basals.disabled).to.be.true;

      // boluses gets disabled when no data
      expect(result.sections.boluses.disabled).to.be.true;

      // siteChanges gets disabled when no data
      expect(result.sections.siteChanges.disabled).to.be.true;

      // fingersticks gets disabled when no data
      expect(result.sections.fingersticks.disabled).to.be.true;

      // bgDistribution gets disabled when no data
      expect(result.sections.bgDistribution.disabled).to.be.true;

      // totalDailyDose gets disabled when no data
      expect(result.sections.totalDailyDose.disabled).to.be.true;

      // basalBolusRatio gets disabled when no data
      expect(result.sections.basalBolusRatio.disabled).to.be.true;

      // timeInAutoRatio gets disabled when no data
      expect(result.sections.timeInAutoRatio.disabled).to.be.true;

      // averageDailyCarbs gets disabled when no data
      expect(result.sections.averageDailyCarbs.disabled).to.be.true;

      // calibration filter in fingerstick section gets removed when no data
      expect(_.find(result.sections.fingersticks.dimensions, { path: 'calibration' })).to.be.undefined;
    });

    it('should set empty text for sections for which there is no data available', () => {
      // all sections emptyText undefined by default
      expect(basicsData.sections.basals.emptyText).to.be.undefined;
      expect(basicsData.sections.boluses.emptyText).to.be.undefined;
      expect(basicsData.sections.siteChanges.emptyText).to.be.undefined;
      expect(basicsData.sections.fingersticks.emptyText).to.be.undefined;
      expect(basicsData.sections.bgDistribution.emptyText).to.be.undefined;
      expect(basicsData.sections.totalDailyDose.emptyText).to.be.undefined;
      expect(basicsData.sections.basalBolusRatio.emptyText).to.be.undefined;
      expect(basicsData.sections.timeInAutoRatio.emptyText).to.be.undefined;
      expect(basicsData.sections.averageDailyCarbs.emptyText).to.be.undefined;
      expect(basicsData.sections.fingersticks.emptyText).to.be.undefined;

      const processedBasicsData = dataUtils.processInfusionSiteHistory(basicsData, {});
      const result = dataUtils.processBasicsAggregations(processedBasicsData);

      // basals gets emptyText set when no data
      expect(result.sections.basals.emptyText).to.be.a('string');

      // boluses gets emptyText set when no data
      expect(result.sections.boluses.emptyText).to.be.a('string');

      // siteChanges gets emptyText set when no data
      expect(result.sections.siteChanges.emptyText).to.be.a('string');

      // fingersticks gets emptyText set when no data
      expect(result.sections.fingersticks.emptyText).to.be.a('string');

      // bgDistribution gets emptyText set when no data
      expect(result.sections.bgDistribution.emptyText).to.be.a('string');

      // totalDailyDose gets emptyText set when no data
      expect(result.sections.totalDailyDose.emptyText).to.be.a('string');

      // basalBolusRatio gets emptyText set when no data
      expect(result.sections.basalBolusRatio.emptyText).to.be.a('string');

      // basalBolusRatio gets emptyText set when no data
      expect(result.sections.timeInAutoRatio.emptyText).to.be.a('string');

      // averageDailyCarbs gets emptyText set when no data
      expect(result.sections.averageDailyCarbs.emptyText).to.be.a('string');

      // fingersticks gets emptyText set when no data
      expect(result.sections.fingersticks.emptyText).to.be.a('string');
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

    it('should categorize each date as past, mostRecent or future', () => {
      expect(dataUtils.findBasicsDays([
        '2015-09-07T00:00:00.000Z',
        '2015-09-10T12:00:00.000Z',
      ], 'Pacific/Auckland')).to.deep.equal([
        { date: '2015-09-07', type: 'past' },
        { date: '2015-09-08', type: 'past' },
        { date: '2015-09-09', type: 'past' },
        { date: '2015-09-10', type: 'past' },
        { date: '2015-09-11', type: 'mostRecent' },
        { date: '2015-09-12', type: 'future' },
        { date: '2015-09-13', type: 'future' },
      ]);
    });
  });

  describe('findBasicsStart', () => {
    it('should find the timezone-local midnight of the Monday >= 14 days prior to provided datetime', () => {
      // exactly 28 days
      expect(dataUtils.findBasicsStart('2015-09-07T05:00:00.000Z', 'US/Central'))
        .to.equal('2015-08-24T05:00:00.000Z');
      // almost but not quite 35 days
      expect(dataUtils.findBasicsStart('2015-09-13T09:00:00.000Z', 'Pacific/Honolulu'))
        .to.equal('2015-08-24T10:00:00.000Z');
      // just over threshold into new local week
      expect(dataUtils.findBasicsStart('2015-09-14T06:01:00.000Z', 'US/Mountain'))
        .to.equal('2015-08-31T06:00:00.000Z');
    });

    it('should find UTC midnight of the Monday >= 14 days prior to provided UTC datetime (when no timezone provided)', () => {
      // exactly 28 days
      expect(dataUtils.findBasicsStart('2015-09-07T00:00:00.000Z'))
        .to.equal('2015-08-24T00:00:00.000Z');
      // almost but not quite 35 days
      expect(dataUtils.findBasicsStart('2015-09-13T23:55:00.000Z'))
        .to.equal('2015-08-24T00:00:00.000Z');
      // just over threshold into new UTC week
      expect(dataUtils.findBasicsStart('2015-09-14T00:01:00.000Z'))
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

    const data = { ...basicsDataFixtures };

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
    });

    after(() => {
      dataUtils.utils.TextUtil.restore();
      dataUtils.utils.statsText.restore();
    });

    it('should reshape provided tideline-style bgPrefs to the viz format', () => {
      const tidelineBgPrefs = { ...defaultBgPrefs };

      dataUtils.basicsText(patient, stats, endpoints, tidelineBgPrefs, timePrefs, data);
      expect(tidelineBgPrefs.bgBounds).to.be.an('object');
    });

    it('should return formatted text for Basics data', () => {
      const result = dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      expect(result).to.equal('Basics Header, Basics Dates, Stats Text, Basics Table, Basics Table, Basics Table, Basics Table, ');
    });

    it('should build the document header section', () => {
      dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      sinon.assert.callCount(textUtilStub.buildDocumentHeader, 1);
      sinon.assert.calledWith(textUtilStub.buildDocumentHeader, 'Basics');
    });

    it('should build the document dates section', () => {
      dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      sinon.assert.callCount(textUtilStub.buildDocumentDates, 1);
    });

    it('should build the basics stats section', () => {
      dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      sinon.assert.callCount(dataUtils.utils.statsText, 1);
      sinon.assert.calledWith(dataUtils.utils.statsText, stats, textUtilStub, defaultBgPrefs);
    });

    it('should build a summary table for fingerstick data', () => {
      dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        '',
        [{ label: 'Avg BG readings / day', value: '5' }, { label: 'Meter', value: '100' }, { label: 'Manual', value: '0' }, { label: 'Calibrations', value: '40' }, { label: 'Below 54 mg/dL', value: '0' }, { label: 'Above 300 mg/dL', value: '0' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should build a summary table for bolus data', () => {
      dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        '',
        [{ label: 'Avg boluses / day', value: '3' }, { label: 'Calculator', value: '0' }, { label: 'Correction', value: '0' }, { label: 'Extended', value: '0' }, { label: 'Interrupted', value: '0' }, { label: 'Override', value: '0' }, { label: 'Underride', value: '0' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should build a summary table for siteChange data', () => {
      dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        'Infusion site changes from \'Fill Cannula\'',
        [{ label: 'Mean Duration', value: '5 days' }, { label: 'Longest Duration', value: '5 days' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });

    it('should build a summary table for basal data', () => {
      dataUtils.basicsText(patient, stats, endpoints, defaultBgPrefs, timePrefs, data);
      sinon.assert.calledWith(
        textUtilStub.buildTextTable,
        '',
        [{ label: 'Total basal events', value: '1' }, { label: 'Temp Basals', value: '1' }, { label: 'Suspends', value: '0' }],
        [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }], { showHeader: false }
      );
    });
  });
});
/* eslint-enable max-len */
