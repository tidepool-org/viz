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
  pumpVocabulary,
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

  describe('isAutomatedBasalDevice', () => {
    it('should return `true` for an upload record for a pump with automated basal delivery capabilities', () => {
      expect(device.isAutomatedBasalDevice(MEDTRONIC, {}, '1780')).to.be.true;
      expect(device.isAutomatedBasalDevice('tandem', { deviceId: 'tandemCIQ123456' })).to.be.true;
    });

    it('should return `false` for an upload record for a pump without automated basal delivery capabilities', () => {
      expect(device.isAutomatedBasalDevice(MEDTRONIC, {}, '723')).to.be.false;
    });
  });

  describe('isAutomatedBolusDevice', () => {
    it('should return `true` for an upload record for a pump with automated bolus delivery capabilities', () => {
      expect(device.isAutomatedBolusDevice('tandem', { deviceId: 'tandemCIQ123456' })).to.be.true;
    });

    it('should return `false` for an upload record for a pump without automated bolus delivery capabilities', () => {
      expect(device.isAutomatedBolusDevice('tandem', { deviceId: 'tandem123456' })).to.be.false;
    });
  });

  describe('isSettingsOverrideDevice', () => {
    it('should return `true` for an upload record for a pump with settings override capabilities', () => {
      expect(device.isSettingsOverrideDevice('tandem', { deviceId: 'tandemCIQ123456' })).to.be.true;
    });

    it('should return `false` for an upload record for a pump without settings override capabilities', () => {
      expect(device.isSettingsOverrideDevice('tandem', { deviceId: 'tandem123456' })).to.be.false;
    });
  });

  describe('getPumpVocabulary', () => {
    it('should return a pump terminology vocabulary, with default fallbacks for missing keys', () => {
      const manufacturers = [
        ANIMAS,
        INSULET,
        MEDTRONIC,
        TANDEM,
        MICROTECH,
        'default',
      ];

      _.forEach(manufacturers, manufacturer => {
        expect(device.getPumpVocabulary(manufacturer)).to.have.all.keys([
          'reservoirChange',
          'tubingPrime',
          'cannulaPrime',
          'automatedDelivery',
          'automatedSuspend',
          'scheduledDelivery',
          'settingsOverride',
          'sleep',
          'physicalActivity',
          'maxBolus',
          'maxBasal',
          'insulinDuration',
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
});
/* eslint-enable max-len */
