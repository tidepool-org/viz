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

 /* eslint-disable max-len */

import _ from 'lodash';

import {
  ANIMAS,
  TANDEM,
  INSULET,
  MEDTRONIC,
  MICROTECH,
  TIDEPOOL_LOOP,
  DIY_LOOP,
  pumpVocabulary,
  SLEEP,
  PHYSICAL_ACTIVITY,
  PREPRANDIAL,
  TWIIST_LOOP
} from '../../src/utils/constants';

import { types as Types } from '../../data/types';
import * as device from '../../src/utils/device';

describe('device utility functions', () => {
  describe('getLatestPumpUpload', () => {
    it('should return a pump with proper data', () => {
      const data = [
        {
          deviceTags: ['bgm'],
          source: 'BGM',
        },
        {
          deviceTags: ['insulin-pump'],
          source: TANDEM,
        },
        {
          deviceTags: ['insulin-pump', 'bgm'],
          source: INSULET,
        },
        {
          deviceTags: ['cgm'],
          source: 'CGM',
        },
      ];

      expect(device.getLatestPumpUpload(data)).to.eql(data[2]);
    });

    it('should return `undefined` without proper data', () => {
      const patientData = {
        grouped: {
          pumpSettings: [],
        },
      };

      expect(device.getLatestPumpUpload(patientData)).to.equal(undefined);
      expect(device.getLatestPumpUpload([])).to.equal(undefined);
    });
  });

  describe('getLastManualBasalSchedule', () => {
    it('should return the `scheduleName` prop of the latest scheduled basal when available', () => {
      const data = [
        new Types.Basal({ deliveryType: 'automated', scheduleName: 'Auto 1' }),
        new Types.Basal({ deliveryType: 'scheduled', scheduleName: 'Manual 1' }),
        new Types.Basal({ deliveryType: 'automated', scheduleName: 'Auto 1' }),
      ];
      expect(device.getLastManualBasalSchedule(data)).to.equal('Manual 1');
    });

    it('should return `undefined` when no scheduled basal available', () => {
      const data = [
        new Types.Basal({ deliveryType: 'automated', scheduleName: 'Auto 1' }),
        new Types.Basal({ deliveryType: 'automated', scheduleName: 'Auto 1' }),
      ];
      expect(device.getLastManualBasalSchedule(data)).to.be.undefined;
    });
  });

  describe('isDIYLoop', () => {
    it('should return `true` for a matching pattern within `origin.name`', () => {
      const datum = { origin: { name: 'com.12345.loopkit.Loop.xyz' } };
      const datum2 = { origin: { name: 'com.loopkit.Loop' } };
      expect(device.isDIYLoop(datum)).to.be.true;
      expect(device.isDIYLoop(datum2)).to.be.true;
    });

    it('should return `false` for a non-matching pattern within `origin.name`', () => {
      const datum = { origin: { name: 'org.loopkit.Loop' } };
      expect(device.isDIYLoop(datum)).to.be.false;
    });

    it('should return `true` for a matching pattern within `client.name`', () => {
      const datum = { client: { name: 'com.12345.loopkit.Loop.xyz' } };
      const datum2 = { client: { name: 'com.loopkit.Loop' } };
      expect(device.isDIYLoop(datum)).to.be.true;
      expect(device.isDIYLoop(datum2)).to.be.true;
    });

    it('should return `false` for a non-matching pattern within `client.name`', () => {
      const datum = { client: { name: 'org.loopkit.Loop' } };
      expect(device.isDIYLoop(datum)).to.be.false;
    });
  });

  describe('isTidepoolLoop', () => {
    it('should return `true` for a matching pattern within `origin.name`', () => {
      const datum = { origin: { name: 'org.tidepool.palmtree.Loop' } };
      const datum2 = { origin: { name: 'org.tidepool.Loop' } };
      expect(device.isTidepoolLoop(datum)).to.be.true;
      expect(device.isTidepoolLoop(datum2)).to.be.true;
    });

    it('should return `false` for a non-matching pattern within `origin.name`', () => {
      const datum = { origin: { name: 'com.tidepool.Loop' } };
      expect(device.isTidepoolLoop(datum)).to.be.false;
    });

    it('should return `true` for a matching pattern within `client.name`', () => {
      const datum = { client: { name: 'org.tidepool.palmtree.Loop' } };
      const datum2 = { client: { name: 'org.tidepool.Loop' } };
      expect(device.isTidepoolLoop(datum)).to.be.true;
      expect(device.isTidepoolLoop(datum2)).to.be.true;
    });

    it('should return `false` for a non-matching pattern within `client.name`', () => {
      const datum = { client: { name: 'com.tidepool.Loop' } };
      expect(device.isTidepoolLoop(datum)).to.be.false;
    });
  });

  describe('isTwiistLoop', () => {
    it('should return `true` for an upload matching pattern within `client.name` and a major version above 2', () => {
      const datum = { type: 'upload', client: { name: 'com.sequelmedtech.tidepool-service', version: '2.0.0' } };
      const datum2 = { type: 'upload', client: { name: 'com.sequelmedtech.tidepool-service', version: '4.10.30' } };
      expect(device.isTwiistLoop(datum)).to.be.true;
      expect(device.isTwiistLoop(datum2)).to.be.true;
    });

    it('should return `false` for an upload with non-matching pattern within `client.name`', () => {
      const datum = { type: 'upload', client: { name: 'com.tidepool.Loop', version: '2.0.0' } };
      expect(device.isTwiistLoop(datum)).to.be.false;
    });

    it('should return `false` for an upload with client major version below 2', () => {
      const datum = { type: 'upload', client: { name: 'com.sequelmedtech.tidepool-service', version: '1.9.9' } };
      expect(device.isTwiistLoop(datum)).to.be.false;
    });

    it('should return `true` for a non-upload data types with matching `origin.name` for Twiist Loop', () => {
      const foodDatum = { type: 'food', origin: { name: 'com.dekaresearch.twiist' } };
      const bolusDatum = { type: 'bolus', origin: { name: 'com.dekaresearch.twiist' } };
      const arbitraryDatum = { origin: { name: 'com.dekaresearch.twiist' } };
      expect(device.isTwiistLoop(foodDatum)).to.be.true;
      expect(device.isTwiistLoop(bolusDatum)).to.be.true;
      expect(device.isTwiistLoop(arbitraryDatum)).to.be.true;
    });

    it('should return `false` for a non-upload data types without matching `origin.name` for Twiist Loop', () => {
      const wrongFoodDatum = { type: 'food', origin: { name: 'com.dekaresearch.twiis' } };
      const wrongBolusDatum = { type: 'bolus', origin: { name: 'com.dekaesearch.twist' } };
      const wrongArbitraryDatum = { origin: { name: 'co.dekaresearch.twiist' }, client: { name: 'com.sequelmedtech.tidepool-service', version: '1.9.9' } };
      expect(device.isTwiistLoop(wrongFoodDatum)).to.be.false;
      expect(device.isTwiistLoop(wrongBolusDatum)).to.be.false;
      expect(device.isTwiistLoop(wrongArbitraryDatum)).to.be.false;
    });
  });

  describe('isControlIQ', () => {
    it('should return `true` for a deviceId starting with tandemCIQ', () => {
      const datum = { deviceId: 'tandemCIQ123456' };
      expect(device.isControlIQ(datum)).to.be.true;
    });

    it('should return `false` for a deviceId not starting with tandemCIQ', () => {
      const datum = { deviceId: 'tandem123456' };
      expect(device.isControlIQ(datum)).to.be.false;
    });

    it('should return `false` for a datum without a deviceId', () => {
      const datum = {};
      expect(device.isControlIQ(datum)).to.be.false;
    });
  });

  describe('isLoop', () => {
    it('should return `true` for a matching pattern within `origin.name` for DIY Loop or Tidepool Loop', () => {
      const diyLoop = { origin: { name: 'com.loopkit.Loop' } };
      const tidepoolLoop = { origin: { name: 'org.tidepool.Loop' } };
      expect(device.isLoop(diyLoop)).to.be.true;
      expect(device.isLoop(tidepoolLoop)).to.be.true;
    });

    it('should return `false` for a non-matching pattern within `origin.name`', () => {
      const diyLoopBad = { origin: { name: 'org.loopkit.Loop' } };
      const tidepoolLoopBad = { origin: { name: 'com.tidepool.Loop' } };
      expect(device.isLoop(diyLoopBad)).to.be.false;
      expect(device.isLoop(tidepoolLoopBad)).to.be.false;
    });

    it('should return `true` for a matching pattern within `client.name` for DIY Loop or Tidepool Loop', () => {
      const diyLoop = { client: { name: 'com.loopkit.Loop' } };
      const tidepoolLoop = { client: { name: 'org.tidepool.Loop' } };
      expect(device.isLoop(diyLoop)).to.be.true;
      expect(device.isLoop(tidepoolLoop)).to.be.true;
    });

    it('should return `true` for a datum tagged as "loop"', () => {
      const loopTaggedDatum = { tags: { loop: true } };
      expect(device.isLoop(loopTaggedDatum)).to.be.true;
    });

    it('should return `false` for a non-matching pattern within `client.name`', () => {
      const diyLoopBad = { client: { name: 'org.loopkit.Loop' } };
      const tidepoolLoopBad = { client: { name: 'com.tidepool.Loop' } };
      expect(device.isLoop(diyLoopBad)).to.be.false;
      expect(device.isLoop(tidepoolLoopBad)).to.be.false;
    });

    it('should return `true` for an upload datum matching pattern within `client.name` for Twiist Loop and version above 2', () => {
      const twiistLoop = { client: { name: 'com.sequelmedtech.tidepool-service', version: '2.0.0' }, type: 'upload' };
      expect(device.isLoop(twiistLoop)).to.be.true;
    });

    it('should return `false` for a upload datum matching pattern within `client.name` for Twiist Loop and version below 2', () => {
      const twiistLoop = { client: { name: 'com.sequelmedtech.tidepool-service', version: '1.0.0' }, type: 'upload' };
      expect(device.isLoop(twiistLoop)).to.be.false;
    });

    it('should return `true` for non-upload datum matching pattern within `origin.name` for Twiist Loop', () => {
      const twiistLoop = { origin: { name: 'com.dekaresearch.twiist' } };
      expect(device.isLoop(twiistLoop)).to.be.true;
    });

    it('should return `false` for non-upload datum not matching pattern within `origin.name` for Twiist Loop', () => {
      const twiistLoop = { origin: { name: 'com.dekaresearch.twist' } };
      expect(device.isLoop(twiistLoop)).to.be.false;
    });
  });


  describe('isAutomatedBasalDevice', () => {
    it('should return `true` for an upload record for a pump with automated basal delivery capabilities', () => {
      expect(device.isAutomatedBasalDevice(MEDTRONIC, {}, '1780')).to.be.true;
      expect(device.isAutomatedBasalDevice('tandem', { deviceId: 'tandemCIQ123456' })).to.be.true;
      expect(device.isAutomatedBasalDevice('tidepool loop', { origin: { name: 'org.tidepool.Loop' } })).to.be.true;
      expect(device.isAutomatedBasalDevice('diy loop', { origin: { name: 'com.loopkit.Loop' } })).to.be.true;
      expect(device.isAutomatedBasalDevice('twiist', { origin: { name: 'com.dekaresearch.twiist' } })).to.be.true;
    });

    it('should return `false` for an upload record for a pump without automated basal delivery capabilities', () => {
      expect(device.isAutomatedBasalDevice(MEDTRONIC, {}, '723')).to.be.false;
    });
  });

  describe('isAutomatedBolusDevice', () => {
    it('should return `true` for an upload record for a pump with automated bolus delivery capabilities', () => {
      expect(device.isAutomatedBolusDevice('tandem', { deviceId: 'tandemCIQ123456' })).to.be.true;
      expect(device.isAutomatedBolusDevice('diy loop', { origin: { name: 'com.loopkit.Loop' } })).to.be.true;
    });

    it('should return `false` for an upload record for a pump without automated bolus delivery capabilities', () => {
      expect(device.isAutomatedBolusDevice('tandem', { deviceId: 'tandem123456' })).to.be.false;
      expect(device.isAutomatedBolusDevice('tidepool loop', { origin: { name: 'org.tidepool.Loop' } })).to.be.false;
      expect(device.isAutomatedBolusDevice('twiist', { origin: { name: 'com.dekaresearch.twist' } })).to.be.false;
    });
  });

  describe('isSettingsOverrideDevice', () => {
    it('should return `true` for an upload record for a pump with settings override capabilities', () => {
      expect(device.isSettingsOverrideDevice('tandem', { deviceId: 'tandemCIQ123456' })).to.be.true;
      expect(device.isSettingsOverrideDevice('tidepool loop', { origin: { name: 'org.tidepool.Loop' } })).to.be.true;
      expect(device.isSettingsOverrideDevice('diy loop', { origin: { name: 'com.loopkit.Loop' } })).to.be.true;
      expect(device.isSettingsOverrideDevice('twiist', { origin: { name: 'com.dekaresearch.twiist' } })).to.be.true;
    });

    it('should return `false` for an upload record for a pump without settings override capabilities', () => {
      expect(device.isSettingsOverrideDevice('tandem', { deviceId: 'tandem123456' })).to.be.false;
    });
  });

  describe('getSettingsOverrides', () => {
    it('should return a pump settings overrides list by manufacturer, with default fallback for manufacturer', () => {
      expect(device.getSettingsOverrides(TANDEM)).to.have.members([SLEEP, PHYSICAL_ACTIVITY]);
      expect(device.getSettingsOverrides(TIDEPOOL_LOOP)).to.have.members([PREPRANDIAL, PHYSICAL_ACTIVITY]);
      expect(device.getSettingsOverrides(TWIIST_LOOP)).to.have.members([PREPRANDIAL, PHYSICAL_ACTIVITY]);
      expect(device.getSettingsOverrides(DIY_LOOP)).to.have.members([PREPRANDIAL]);
      expect(device.getSettingsOverrides(undefined)).to.have.members([SLEEP, PREPRANDIAL, PHYSICAL_ACTIVITY]);
    });
  });

  describe('getPumpVocabulary', () => {
    it('should return a pump terminology vocabulary, with default fallbacks for missing keys', () => {
      const manufacturers = [
        ANIMAS,
        INSULET,
        MEDTRONIC,
        TANDEM,
        TIDEPOOL_LOOP,
        DIY_LOOP,
        MICROTECH,
        'default',
      ];

      _.forEach(manufacturers, manufacturer => {
        expect(device.getPumpVocabulary(manufacturer)).to.have.all.keys([
          'reservoirChange',
          'tubingPrime',
          'cannulaPrime',
          'automatedBolus',
          'automatedDelivery',
          'automatedSuspend',
          'automatedModeExited',
          'scheduledDelivery',
          'settingsOverride',
          'sleep',
          'physicalActivity',
          'preprandial',
          'maxBolus',
          'maxBasal',
          'insulinDuration',
          'oneButtonBolus',
        ]);
      });

      // Medtronic and Tandem should have their own unique key for automated basal delivery
      expect(device.getPumpVocabulary(MEDTRONIC).automatedDelivery).to.equal(pumpVocabulary[MEDTRONIC].automatedDelivery);
      expect(device.getPumpVocabulary(TANDEM).automatedDelivery).to.equal(pumpVocabulary[TANDEM].automatedDelivery);

      // Animas, Tandem, and Insulet should fall back to a default value
      expect(pumpVocabulary[ANIMAS].automatedDelivery).to.be.undefined;
      expect(device.getPumpVocabulary(ANIMAS).automatedDelivery).to.equal(pumpVocabulary.default.automatedDelivery);

      expect(pumpVocabulary[INSULET].automatedDelivery).to.be.undefined;
      expect(device.getPumpVocabulary(INSULET).automatedDelivery).to.equal(pumpVocabulary.default.automatedDelivery);
    });
  });

  describe('getUppercasedManufacturer', () => {
    it('should an uppercased manufacturer name, with special handling for "diy"', () => {
      expect(device.getUppercasedManufacturer('tandem')).to.equal('Tandem');
      expect(device.getUppercasedManufacturer('tidepool loop')).to.equal('Tidepool Loop');
      expect(device.getUppercasedManufacturer('diy loop')).to.equal('DIY Loop');
    });
  });
});
