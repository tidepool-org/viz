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

import * as constants from '../../src/utils/constants';

describe('constants', () => {
  describe('BG_HIGH', () => {
    it('should be `High`', () => {
      expect(constants.BG_HIGH).to.equal('High');
    });
  });

  describe('BG_LOW', () => {
    it('should be `Low`', () => {
      expect(constants.BG_LOW).to.equal('Low');
    });
  });

  describe('MGDL_CLAMP_TOP', () => {
    it('should be `400`', () => {
      expect(constants.MGDL_CLAMP_TOP).to.equal(400);
    });
  });

  describe('MMOLL_CLAMP_TOP', () => {
    it('should be `22.5`', () => {
      expect(constants.MMOLL_CLAMP_TOP).to.equal(22.5);
    });
  });

  describe('MMOLL_UNITS', () => {
    it('should be `mmol/L`', () => {
      expect(constants.MMOLL_UNITS).to.equal('mmol/L');
    });
  });

  describe('MGDL_UNITS', () => {
    it('should be `mg/dL`', () => {
      expect(constants.MGDL_UNITS).to.equal('mg/dL');
    });
  });

  describe('MGDL_PER_MMOLL', () => {
    it('should be `18.01559`', () => {
      expect(constants.MGDL_PER_MMOLL).to.equal(18.01559);
    });
  });

  describe('DEFAULT_BG_BOUNDS', () => {
    it('should define the MGDL_UNITS veryLowThreshold as 54', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MGDL_UNITS].veryLowThreshold).to.equal(54);
    });

    it('should define the MGDL_UNITS targetLowerBound as 70', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MGDL_UNITS].targetLowerBound).to.equal(70);
    });

    it('should define the MGDL_UNITS targetUpperBound as 180', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MGDL_UNITS].targetUpperBound).to.equal(180);
    });

    it('should define the MGDL_UNITS veryHighThreshold as 250', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MGDL_UNITS].veryHighThreshold).to.equal(250);
    });

    it('should define the MGDL_UNITS extremeHighThreshold as 350', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MGDL_UNITS].extremeHighThreshold).to.equal(350);
    });

    it('should define the MGDL_UNITS clampThreshold as 600', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MGDL_UNITS].clampThreshold).to.equal(600);
    });

    it('should define the MMOLL_UNITS veryLowThreshold as 3.0', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MMOLL_UNITS].veryLowThreshold).to.equal(3.0);
    });

    it('should define the MMOLL_UNITS targetLowerBound as 3.9', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MMOLL_UNITS].targetLowerBound).to.equal(3.9);
    });

    it('should define the MMOLL_UNITS targetUpperBound as 10.0', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MMOLL_UNITS].targetUpperBound).to.equal(10.0);
    });

    it('should define the MMOLL_UNITS veryHighThreshold as 13.9', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MMOLL_UNITS].veryHighThreshold).to.equal(13.9);
    });

    it('should define the MMOLL_UNITS extremeHighThreshold as 19.4', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MMOLL_UNITS].extremeHighThreshold).to.equal(19.4);
    });

    it('should define the MMOLL_UNITS clampThreshold as 33.3', () => {
      expect(constants.DEFAULT_BG_BOUNDS[constants.MMOLL_UNITS].clampThreshold).to.equal(33.3);
    });
  });

  describe('LBS_PER_KG', () => {
    it('should be `2.2046226218`', () => {
      expect(constants.LBS_PER_KG).to.equal(2.2046226218);
    });
  });

  describe('CGM_READINGS_ONE_DAY', () => {
    it('should be `288`', () => {
      expect(constants.CGM_READINGS_ONE_DAY).to.equal(288);
    });
  });

  describe('MS_IN_DAY', () => {
    it('should be `864e5`', () => {
      expect(constants.MS_IN_DAY).to.equal(864e5);
    });
  });

  describe('MS_IN_HOUR', () => {
    it('should be `864e5 / 24`', () => {
      expect(constants.MS_IN_HOUR).to.equal(864e5 / 24);
    });
  });

  describe('MS_IN_MIN', () => {
    it('should be `MS_IN_HOUR / 60`', () => {
      expect(constants.MS_IN_MIN).to.equal(constants.MS_IN_HOUR / 60);
    });
  });

  describe('CGM_DATA_KEY', () => {
    it('should be `cbg`', () => {
      expect(constants.CGM_DATA_KEY).to.equal('cbg');
    });
  });

  describe('BGM_DATA_KEY', () => {
    it('should be `smbg`', () => {
      expect(constants.BGM_DATA_KEY).to.equal('smbg');
    });
  });

  describe('SITE_CHANGE_RESERVOIR', () => {
    it('should be `reservoirChange`', () => {
      expect(constants.SITE_CHANGE_RESERVOIR).to.equal('reservoirChange');
    });
  });

  describe('NO_SITE_CHANGE', () => {
    it('should be `noSiteChange`', () => {
      expect(constants.NO_SITE_CHANGE).to.equal('noSiteChange');
    });
  });

  describe('SITE_CHANGE', () => {
    it('should be `siteChange`', () => {
      expect(constants.SITE_CHANGE).to.equal('siteChange');
    });
  });

  describe('SITE_CHANGE_TUBING', () => {
    it('should be `tubingPrime`', () => {
      expect(constants.SITE_CHANGE_TUBING).to.equal('tubingPrime');
    });
  });

  describe('SITE_CHANGE_CANNULA', () => {
    it('should be `cannulaPrime`', () => {
      expect(constants.SITE_CHANGE_CANNULA).to.equal('cannulaPrime');
    });
  });

  describe('alarms', () => {
    it('should export keys for `alarm` and all alarm types', () => {
      expect(constants.ALARM).to.equal('alarm');
      expect(constants.ALARM_NO_DELIVERY).to.equal('no_delivery');
      expect(constants.ALARM_AUTO_OFF).to.equal('auto_off');
      expect(constants.ALARM_NO_INSULIN).to.equal('no_insulin');
      expect(constants.ALARM_NO_POWER).to.equal('no_power');
      expect(constants.ALARM_OCCLUSION).to.equal('occlusion');
      expect(constants.ALARM_OVER_LIMIT).to.equal('over_limit');
    });
  });

  describe('AUTOMATED_BOLUS', () => {
    it('should be `automatedBolus`', () => {
      expect(constants.AUTOMATED_BOLUS).to.equal('automatedBolus');
    });
  });

  describe('AUTOMATED_DELIVERY', () => {
    it('should be `automatedDelivery`', () => {
      expect(constants.AUTOMATED_DELIVERY).to.equal('automatedDelivery');
    });
  });

  describe('AUTOMATED_SUSPEND', () => {
    it('should be `automatedSuspend`', () => {
      expect(constants.AUTOMATED_SUSPEND).to.equal('automatedSuspend');
    });
  });

  describe('AUTOMATED_MODE_EXITED', () => {
    it('should be `automatedModeExited`', () => {
      expect(constants.AUTOMATED_MODE_EXITED).to.equal('automatedModeExited');
    });
  });

  describe('SCHEDULED_DELIVERY', () => {
    it('should be `scheduledDelivery`', () => {
      expect(constants.SCHEDULED_DELIVERY).to.equal('scheduledDelivery');
    });
  });

  describe('SLEEP', () => {
    it('should be `sleep`', () => {
      expect(constants.SLEEP).to.equal('sleep');
    });
  });

  describe('PHYSICAL_ACTIVITY', () => {
    it('should be `physicalActivity`', () => {
      expect(constants.PHYSICAL_ACTIVITY).to.equal('physicalActivity');
    });
  });

  describe('PREPRANDIAL', () => {
    it('should be `preprandial`', () => {
      expect(constants.PREPRANDIAL).to.equal('preprandial');
    });
  });

  describe('MAX_BOLUS', () => {
    it('should be `maxBolus`', () => {
      expect(constants.MAX_BOLUS).to.equal('maxBolus');
    });
  });

  describe('MAX_BASAL', () => {
    it('should be `maxBasal`', () => {
      expect(constants.MAX_BASAL).to.equal('maxBasal');
    });
  });

  describe('INSULIN_DURATION', () => {
    it('should be `insulinDuration`', () => {
      expect(constants.INSULIN_DURATION).to.equal('insulinDuration');
    });
  });

  describe('SITE_CHANGE_TYPE_UNDECLARED', () => {
    it('should be `undeclared`', () => {
      expect(constants.SITE_CHANGE_TYPE_UNDECLARED).to.equal('undeclared');
    });
  });

  describe('INSULET', () => {
    it('should be `Insulet`', () => {
      expect(constants.INSULET).to.equal('Insulet');
    });
  });

  describe('TANDEM', () => {
    it('should be `Tandem`', () => {
      expect(constants.TANDEM).to.equal('Tandem');
    });
  });

  describe('ANIMAS', () => {
    it('should be `Animas`', () => {
      expect(constants.ANIMAS).to.equal('Animas');
    });
  });

  describe('TIDEPOOL_LOOP', () => {
    it('should be `Tidepool Loop`', () => {
      expect(constants.TIDEPOOL_LOOP).to.equal('Tidepool Loop');
    });
  });

  describe('DIY_LOOP', () => {
    it('should be `DIY Loop`', () => {
      expect(constants.DIY_LOOP).to.equal('DIY Loop');
    });
  });

  describe('MEDTRONIC', () => {
    it('should be `Medtronic`', () => {
      expect(constants.MEDTRONIC).to.equal('Medtronic');
    });
  });

  describe('MICROTECH', () => {
    it('should be `Microtech`', () => {
      expect(constants.MICROTECH).to.equal('Microtech');
    });
  });

  describe('pumpVocabulary', () => {
    it('should define common terms per device manufacturer', () => {
      expect(constants.pumpVocabulary).to.eql({
        [constants.ANIMAS]: {
          [constants.SITE_CHANGE_RESERVOIR]: 'Go Rewind',
          [constants.SITE_CHANGE_TUBING]: 'Go Prime',
          [constants.SITE_CHANGE_CANNULA]: 'Cannula Fill',
        },
        [constants.INSULET]: {
          [constants.SITE_CHANGE_RESERVOIR]: 'Pod Change',
          [constants.SITE_CHANGE_TUBING]: 'Pod Activate',
          [constants.SITE_CHANGE_CANNULA]: 'Prime',
          [constants.MAX_BOLUS]: 'Maximum Bolus',
          [constants.MAX_BASAL]: 'Max Basal Rate',
          [constants.INSULIN_DURATION]: 'Duration of Insulin Action',
        },
        [constants.MEDTRONIC]: {
          [constants.SITE_CHANGE_RESERVOIR]: 'Rewind',
          [constants.SITE_CHANGE_TUBING]: 'Prime',
          [constants.SITE_CHANGE_CANNULA]: 'Cannula Prime',
          [constants.AUTOMATED_DELIVERY]: 'Auto Mode',
          [constants.SCHEDULED_DELIVERY]: 'Manual',
          [constants.MAX_BOLUS]: 'Max Bolus',
          [constants.MAX_BASAL]: 'Max Basal',
          [constants.INSULIN_DURATION]: 'Active Insulin Time',
        },
        [constants.TANDEM]: {
          [constants.SITE_CHANGE_RESERVOIR]: 'Cartridge Change',
          [constants.SITE_CHANGE_TUBING]: 'Tubing Fill',
          [constants.SITE_CHANGE_CANNULA]: 'Cannula Fill',
          [constants.AUTOMATED_DELIVERY]: 'Automation',
          [constants.SCHEDULED_DELIVERY]: 'Manual',
          [constants.SETTINGS_OVERRIDE]: 'Activity',
          [constants.SLEEP]: { label: 'Sleep', marker: 'Z' },
          [constants.PHYSICAL_ACTIVITY]: { label: 'Exercise', marker: 'E' },
          [constants.MAX_BOLUS]: 'Max Bolus',
          [constants.INSULIN_DURATION]: 'Insulin Duration',
        },
        [constants.TIDEPOOL_LOOP]: {
          [constants.AUTOMATED_DELIVERY]: 'Automation',
          [constants.AUTOMATED_MODE_EXITED]: 'Off',
          [constants.SCHEDULED_DELIVERY]: 'Manual',
          [constants.SETTINGS_OVERRIDE]: 'Preset',
          [constants.PHYSICAL_ACTIVITY]: { label: 'Workout', marker: 'W' },
          [constants.MAX_BOLUS]: 'Maximum Bolus',
          [constants.MAX_BASAL]: 'Maximum Basal Rate',
        },
        [constants.TWIIST_LOOP]: {
          [constants.SITE_CHANGE_RESERVOIR]: 'Cassette Change',
          [constants.AUTOMATED_DELIVERY]: 'Automation',
          [constants.AUTOMATED_MODE_EXITED]: 'Off',
          [constants.SCHEDULED_DELIVERY]: 'Manual',
          [constants.SETTINGS_OVERRIDE]: 'Preset',
          [constants.PHYSICAL_ACTIVITY]: { label: 'Workout', marker: 'W' },
          [constants.MAX_BOLUS]: 'Maximum Bolus',
          [constants.MAX_BASAL]: 'Maximum Basal Rate',
          [constants.ALARM_NO_INSULIN]: 'Cassette Empty',
          [constants.ALARM_OCCLUSION]: 'Line Blocked',
        },
        [constants.DIY_LOOP]: {
          [constants.AUTOMATED_DELIVERY]: 'Automation',
          [constants.AUTOMATED_MODE_EXITED]: 'Off',
          [constants.SCHEDULED_DELIVERY]: 'Manual',
          [constants.SETTINGS_OVERRIDE]: 'Preset',
          [constants.PHYSICAL_ACTIVITY]: { label: 'Workout', marker: 'W' },
          [constants.MAX_BOLUS]: 'Maximum Bolus',
          [constants.MAX_BASAL]: 'Maximum Basal Rate',
        },
        [constants.MICROTECH]: {
          [constants.SITE_CHANGE_RESERVOIR]: 'Rewind',
          [constants.SITE_CHANGE_TUBING]: 'Reservoir Prime',
          [constants.SITE_CHANGE_CANNULA]: 'Cannula Prime',
        },
        default: {
          [constants.SITE_CHANGE_RESERVOIR]: 'Cartridge Change',
          [constants.SITE_CHANGE_TUBING]: 'Tubing Fill',
          [constants.SITE_CHANGE_CANNULA]: 'Cannula Fill',
          [constants.AUTOMATED_BOLUS]: 'Automated',
          [constants.AUTOMATED_DELIVERY]: 'Automated',
          [constants.AUTOMATED_SUSPEND]: 'Automated Suspend',
          [constants.AUTOMATED_MODE_EXITED]: 'Exited',
          [constants.SCHEDULED_DELIVERY]: 'Manual',
          [constants.SETTINGS_OVERRIDE]: 'Settings Override',
          [constants.SLEEP]: { label: 'Sleep', marker: 'Z' },
          [constants.PHYSICAL_ACTIVITY]: { label: 'Exercise', marker: 'E' },
          [constants.PREPRANDIAL]: { label: 'Premeal', marker: 'P' },
          [constants.MAX_BOLUS]: 'Max Bolus',
          [constants.MAX_BASAL]: 'Max Basal',
          [constants.INSULIN_DURATION]: 'Insulin Duration',
          [constants.ONE_BUTTON_BOLUS]: 'One-Button Bolus',
          [constants.ALARM_NO_DELIVERY]: 'Insulin Delivery Stopped',
          [constants.ALARM_AUTO_OFF]: 'Pump Auto-Off',
          [constants.ALARM_NO_INSULIN]: 'Reservoir Empty',
          [constants.ALARM_NO_POWER]: 'Battery Empty',
          [constants.ALARM_OCCLUSION]: 'Occlusion Detected',
          [constants.ALARM_OVER_LIMIT]: 'Insulin Delivery Limit Exceeded',
        },
      });
    });
  });

  describe('settingsOverrides', () => {
    it('should define settings overrides per device manufacturer', () => {
      expect(constants.settingsOverrides).to.eql({
        [constants.TANDEM]: [
          constants.SLEEP,
          constants.PHYSICAL_ACTIVITY,
        ],
        [constants.TIDEPOOL_LOOP]: [
          constants.PHYSICAL_ACTIVITY,
          constants.PREPRANDIAL,
        ],
        [constants.TWIIST_LOOP]: [
          constants.PHYSICAL_ACTIVITY,
          constants.PREPRANDIAL,
        ],
        [constants.DIY_LOOP]: [
          constants.PREPRANDIAL,
        ],
        default: [
          constants.SLEEP,
          constants.PHYSICAL_ACTIVITY,
          constants.PREPRANDIAL,
        ],
      });
    });
  });

  describe('AUTOMATED_BASAL_DEVICE_MODELS', () => {
    it('should define automated basal models per device manufacturer', () => {
      expect(constants.AUTOMATED_BASAL_DEVICE_MODELS).to.eql({
        [constants.MEDTRONIC]: ['1580', '1581', '1582', '1780', '1781', '1782'],
      });
    });
  });

  describe('BG_COLORS', () => {
    it('should define bg range colors', () => {
      expect(constants.BG_COLORS).to.eql({
        veryLow: '#FB5951',
        low: '#FF8B7C',
        target: '#76D3A6',
        high: '#BB9AE7',
        veryHigh: '#8C65D6',
      });
    });
  });
});
