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

import * as data from '../../../src/utils/settings/data';

const medtronicMultirateData = require('../../../data/pumpSettings/medtronic/multirate.json');
const omnipodMultirateData = require('../../../data/pumpSettings/omnipod/multirate.json');
const tandemFlatrateData = require('../../../data/pumpSettings/tandem/flatrate.json');
const tandemMultirateData = require('../../../data/pumpSettings/tandem/multirate.json');
const loopMultirateData = require('../../../data/pumpSettings/loop/multirate.json');

describe('[settings] data utils', () => {
  describe('noData', () => {
    it('should return true on `null`', () => {
      expect(data.noData(null)).to.be.true;
    });

    it('should return true on `undefined`', () => {
      expect(data.noData(undefined)).to.be.true;
    });

    it('should return true on an empty string', () => {
      expect(data.noData('')).to.be.true;
    });

    it('should NOT return true on 0', () => {
      expect(data.noData(0)).to.be.false;
    });
  });

  describe('deviceName', () => {
    it('should return a formatted device name when provided a known manufacturer key', () => {
      expect(data.deviceName('animas')).to.equal('Animas');
      expect(data.deviceName('insulet')).to.equal('OmniPod');
      expect(data.deviceName('medtronic')).to.equal('Medtronic');
      expect(data.deviceName('tandem')).to.equal('Tandem');
      expect(data.deviceName('microtech')).to.equal('Equil');
      expect(data.deviceName('diy loop')).to.equal('DIY Loop');
      expect(data.deviceName('tidepool loop')).to.equal('Tidepool Loop');
    });

    it('should return the manufacturer key if a device name mapping does not exist', () => {
      expect(data.deviceName('foo')).to.equal('foo');
    });
  });

  describe('processBgTargetData', () => {
    it('should return formatted objects', () => {
      expect(
        data.processBgTargetData(
          medtronicMultirateData.bgTarget,
          medtronicMultirateData.units.bg,
          { columnTwo: 'low', columnThree: 'high' },
        )
      )
      .to.have.length(3)
      .to.deep.include({ start: '12:00 am', columnTwo: '3.9', columnThree: '7.8' })
      .and.deep.include({ start: '11:30 am', columnTwo: '4.4', columnThree: '6.7' })
      .and.deep.include({ start: '6:00 pm', columnTwo: '4.2', columnThree: '8.3' });
    });

    it('should return empty string for BG value if not found', () => {
      expect(
        data.processBgTargetData(
          medtronicMultirateData.bgTarget,
          medtronicMultirateData.units.bg,
          { columnTwo: 'target', columnThree: 'high' },
        )
      )
      .to.have.length(3)
      .to.deep.include({ start: '12:00 am', columnTwo: '', columnThree: '7.8' })
      .and.deep.include({ start: '11:30 am', columnTwo: '', columnThree: '6.7' })
      .and.deep.include({ start: '6:00 pm', columnTwo: '', columnThree: '8.3' });
    });
  });

  describe('processCarbRatioData', () => {
    it('should return formatted objects', () => {
      expect(
        data.processCarbRatioData(
          medtronicMultirateData.carbRatio,
        )
      )
      .to.have.length(4)
      .to.deep.include({ start: '12:00 am', amount: 24 })
      .and.deep.include({ start: '2:30 am', amount: 22 })
      .and.deep.include({ start: '6:00 am', amount: 17 })
      .and.deep.include({ start: '5:30 pm', amount: 6 });
    });
  });

  describe('processSensitivityData', () => {
    it('should return formatted objects', () => {
      expect(
        data.processSensitivityData(
          medtronicMultirateData.insulinSensitivity,
          medtronicMultirateData.units.bg,
        )
      )
      .to.have.length(1)
      .and.deep.include({ start: '12:00 am', amount: '1.8' });
    });
  });

  describe('processBasalRateData', () => {
    it('should return formatted objects', () => {
      expect(
        data.processBasalRateData(
          medtronicMultirateData.basalSchedules[0],
        )
      )
      .to.have.length(5)
      .to.deep.include({ start: '12:00 am', rate: '0.750' })
      .and.deep.include({ start: '2:30 am', rate: '0.850' })
      .and.deep.include({ start: '6:00 am', rate: '0.900' })
      .and.deep.include({ start: '5:30 pm', rate: '0.850' })
      .and.deep.include({ start: '12:00 am', rate: '0.750' })
      .and.deep.include({ start: 'Total', rate: '20.725' });
    });

    it('should cope with empty shedules', () => {
      expect(
        data.processBasalRateData(
          medtronicMultirateData.basalSchedules[1].value,
        )
      )
      .to.have.length(1)
      .to.deep.include({ start: '-', rate: '-' });
      expect(
        data.processBasalRateData({
          name: 'Foo',
          value: [{
            start: 0,
          }],
        })
      )
      .to.have.length(1)
      .to.deep.include({ start: '-', rate: '-' });
    });

    it('should cope with no schedule (empty array)', () => {
      expect(
        data.processBasalRateData(
          [],
        )
      )
      .to.have.length(1)
      .to.deep.include({ start: '-', rate: '-' });
      expect(
        data.processBasalRateData({
          name: 'Foo',
          value: [{
            start: 0,
          }],
        })
      )
      .to.have.length(1)
      .to.deep.include({ start: '-', rate: '-' });
    });
  });

  describe('processTimedSettings', () => {
    it('should return formatted objects', () => {
      expect(
        data.processTimedSettings(
          tandemMultirateData,
          { name: 'Sick', position: 1 },
          tandemMultirateData.units.bg,
        )
      )
      .to.have.length(5)
      .to.deep.include({
        start: '12:00 am',
        rate: '0.350',
        bgTarget: '5.3',
        carbRatio: 7,
        insulinSensitivity: '2.6',
      })
      .and.deep.include({
        start: '3:30 am',
        rate: '0.225',
        bgTarget: '5.0',
        carbRatio: 10,
        insulinSensitivity: '4.5',
      })
      .and.deep.include({
        start: '10:00 am',
        rate: '1.075',
        bgTarget: '5.0',
        carbRatio: 10,
        insulinSensitivity: '4.5',
      })
      .and.deep.include({
        start: '8:00 pm',
        rate: '0.625',
        bgTarget: '5.0',
        carbRatio: 9,
        insulinSensitivity: '4.5',
      })
      .and.deep.include({
        start: 'Total',
        rate: '15.938',
        bgTarget: '',
        carbRatio: '',
        insulinSensitivity: '',
      });
    });
  });

  describe('getScheduleLabel', () => {
    it('should return an object of the basal schedule label parts', () => {
      expect(data.getScheduleLabel('one', 'two')).to.deep.equal({
        main: 'one',
        secondary: '',
        units: 'U/hr',
      });
    });

    it('should provide "Active at upload" in `secondary` if schedule names match', () => {
      expect(data.getScheduleLabel('one', 'one')).to.deep.equal({
        main: 'one',
        secondary: 'Active at upload',
        units: 'U/hr',
      });
    });

    it('should capitalize schedule name if deviceType is `carelink`', () => {
      expect(data.getScheduleLabel('pattern a', 'pattern a', 'carelink')).to.deep.equal({
        main: 'Pattern A',
        secondary: 'Active at upload',
        units: 'U/hr',
      });
    });

    it('should capitalize schedule name if deviceType is `medtronic`', () => {
      expect(data.getScheduleLabel('pattern a', 'pattern a', 'medtronic')).to.deep.equal({
        main: 'Pattern A',
        secondary: 'Active at upload',
        units: 'U/hr',
      });
    });

    it('should return an empty string for `units` if given `noUnits` option', () => {
      expect(data.getScheduleLabel('one', 'one', 'tandem', true)).to.deep.equal({
        main: 'one',
        secondary: 'Active at upload',
        units: '',
      });
    });
  });

  describe('getTimedSchedules', () => {
    it('should return the timed settings schedule names', () => {
      expect(
        data.getTimedSchedules(tandemFlatrateData.basalSchedules)
      )
      .to.have.length(2)
      .to.deep.include({ name: 'Normal', position: 0 })
      .and.deep.include({ name: 'sick', position: 1 });
    });
  });

  describe('getTotalBasalRates', () => {
    it('should return the rate total for multi rate settings', () => {
      expect(
        data.getTotalBasalRates(
          medtronicMultirateData.basalSchedules[0].value,
        )
      ).to.equal('20.725');
    });

    it('should return the rate total for flatrate settings', () => {
      expect(
        data.getTotalBasalRates(
          tandemFlatrateData.basalSchedules[0].value,
        )
      ).to.equal('10.800');
    });
  });

  describe('getDeviceMeta', () => {
    const timePrefs = {
      timezoneAware: false,
      timezoneName: null,
    };
    it('[timezone-naive] should return the serial, schedule and date uploaded device', () => {
      expect(
        data.getDeviceMeta(tandemFlatrateData, timePrefs)
      ).to.have.property('serial').equal('0987654321');
      expect(
        data.getDeviceMeta(tandemFlatrateData, timePrefs)
      ).to.have.property('schedule').equal('sick');
      expect(
        data.getDeviceMeta({ ...tandemFlatrateData, normalTime: tandemFlatrateData.deviceTime }, timePrefs)
      ).to.have.property('uploaded').equal('Jul 12, 2016');
    });

    it('[timezone-aware] should return the serial, schedule and date uploaded device', () => {
      const timezoneAwarePrefs = {
        timezoneAware: true,
        timezoneName: 'US/Mountain',
      };
      expect(
        data.getDeviceMeta(tandemFlatrateData, timezoneAwarePrefs)
      ).to.have.property('serial').equal('0987654321');
      expect(
        data.getDeviceMeta(tandemFlatrateData, timezoneAwarePrefs)
      ).to.have.property('schedule').equal('sick');
      expect(
        data.getDeviceMeta({ ...tandemFlatrateData, normalTime: tandemFlatrateData.time }, timezoneAwarePrefs)
      ).to.have.property('uploaded').equal('Jul 13, 2016');
    });

    it('should return the serial, schedule and date uploaded as unknown', () => {
      expect(
        data.getDeviceMeta({}, timePrefs)
      ).to.have.property('serial').equal('unknown');
      expect(
        data.getDeviceMeta({}, timePrefs)
      ).to.have.property('schedule').equal('unknown');
      expect(
        data.getDeviceMeta({}, timePrefs)
      ).to.have.property('uploaded').equal('unknown');
    });
  });

  describe('startTimeAndValue', () => {
    const valueKey = 'whatever';
    it('should return an array of "Start Time" and "Value" column descriptions', () => {
      expect(data.startTimeAndValue(valueKey)).to.deep.equal([{
        key: 'start', label: 'Start time',
      }, {
        key: valueKey, label: 'Value',
      }]);
    });
  });

  describe('insulinSettings', () => {
    it('should return columns and rows for insulin settings from Tandem pump settings', () => {
      expect(data.insulinSettings(tandemMultirateData, 'tandem', 'Normal')).to.eql({
        columns: [
          { key: 'setting' },
          { key: 'value' },
        ],
        rows: [
          { setting: 'Max Bolus', value: '12 U' },
          { setting: 'Insulin Duration', value: '5 hrs' },
        ],
      });
    });

    it('should return columns and rows for insulin settings from Omnipod pump settings', () => {
      expect(data.insulinSettings(omnipodMultirateData, 'insulet')).to.eql({
        columns: [
          { key: 'setting' },
          { key: 'value' },
        ],
        rows: [
          { setting: 'Max Basal Rate', value: '2 U/hr' },
          { setting: 'Maximum Bolus', value: '9.5 U' },
          { setting: 'Duration of Insulin Action', value: '4:05 hrs' },
        ],
      });
    });

    it('should return columns and rows for insulin settings from Medtronic pump settings', () => {
      expect(data.insulinSettings(medtronicMultirateData, 'medtronic')).to.eql({
        columns: [
          { key: 'setting' },
          { key: 'value' },
        ],
        rows: [
          { setting: 'Max Basal', value: '2 U/hr' },
          { setting: 'Max Bolus', value: '9.5 U' },
          { setting: 'Active Insulin Time', value: '4 hrs' },
        ],
      });
    });

    it('should return columns and rows for insulin settings from DIY Loop pump settings', () => {
      expect(data.insulinSettings(loopMultirateData, 'diy loop')).to.eql({
        columns: [
          { key: 'setting' },
          { key: 'value' },
        ],
        rows: [
          {
            annotations: ['DIY Loop will deliver basal and recommend bolus insulin only if your glucose is predicted to be above this limit for the next three hours.'],
            setting: 'Glucose Safety Limit',
            value: '4.2 mmol/L',
          },
          { setting: 'Maximum Basal Rate', value: '3.5 U/hr' },
          { setting: 'Maximum Bolus', value: '10 U' },
          {
            annotations: [
              'DIY Loop assumes that the insulin it has delivered is actively working to lower your glucose for 6 hours. This setting cannot be changed.',
              'The Rapid-Acting - Adults model assumes peak activity at 75 minutes.',
            ],
            setting: 'Insulin Model',
            value: 'Rapid-Acting - Adults',
          },
        ],
      });
    });

    it('should return columns and rows for insulin settings from Tidepool Loop pump settings', () => {
      expect(data.insulinSettings(loopMultirateData, 'tidepool loop')).to.eql({
        columns: [
          { key: 'setting' },
          { key: 'value' },
        ],
        rows: [
          {
            annotations: ['Tidepool Loop will deliver basal and recommend bolus insulin only if your glucose is predicted to be above this limit for the next three hours.'],
            setting: 'Glucose Safety Limit',
            value: '4.2 mmol/L',
          },
          { setting: 'Maximum Basal Rate', value: '3.5 U/hr' },
          { setting: 'Maximum Bolus', value: '10 U' },
          {
            annotations: [
              'Tidepool Loop assumes that the insulin it has delivered is actively working to lower your glucose for 6 hours. This setting cannot be changed.',
              'The Rapid-Acting - Adults model assumes peak activity at 75 minutes.',
            ],
            setting: 'Insulin Model',
            value: 'Rapid-Acting - Adults',
          },
        ],
      });
    });

    it('should return columns and rows with default labels and empty settings placeholder', () => {
      expect(data.insulinSettings({}, 'fooPump')).to.eql({
        columns: [
          { key: 'setting' },
          { key: 'value' },
        ],
        rows: [
          { setting: 'Max Basal', value: '-' },
          { setting: 'Max Bolus', value: '-' },
          { setting: 'Insulin Duration', value: '-' },
        ],
      });
    });
  });
});
