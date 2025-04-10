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

import { BG_HIGH, BG_LOW, MGDL_UNITS, MMOLL_UNITS } from '../../src/utils/constants';

import * as format from '../../src/utils/format';

describe('format', () => {
  describe('bankersRound', () => {
    it('should round-half-to-even to the nearest integer when no precision is specified', () => {
      expect(format.bankersRound(9.5)).to.equal(10);
      expect(format.bankersRound(10.5)).to.equal(10);
      expect(format.bankersRound(-9.5)).to.equal(-10);
      expect(format.bankersRound(-10.5)).to.equal(-10);
    });

    it('should round-half-to-even to the precision specified', () => {
      expect(format.bankersRound(9.35, 1)).to.equal(9.4);
      expect(format.bankersRound(9.45, 1)).to.equal(9.4);
      expect(format.bankersRound(1.535, 2)).to.equal(1.54);
      expect(format.bankersRound(1.525, 2)).to.equal(1.52);
      expect(format.bankersRound(-9.435, 2)).to.equal(-9.44);
      expect(format.bankersRound(-9.445, 2)).to.equal(-9.44);
    });
  });

  describe('formatBgValue', () => {
    it('should be a function', () => {
      assert.isFunction(format.formatBgValue);
    });

    describe('no recogizable units provided', () => {
      it('should return a String integer by default (no recogizable `units` provided)', () => {
        expect(format.formatBgValue(120.5)).to.equal('121');
        expect(format.formatBgValue(120.5, 'foo')).to.equal('121');
      });
    });

    describe('when units are `mg/dL`', () => {
      it('should return a String integer', () => {
        expect(format.formatBgValue(120.5, { bgUnits: MGDL_UNITS })).to.equal('121');
      });

      it('should give no decimals', () => {
        expect(format.formatBgValue(352, { bgUnits: MGDL_UNITS })).to.equal('352');
      });

      it('should round', () => {
        expect(format.formatBgValue(352.77, { bgUnits: MGDL_UNITS })).to.equal('353');
      });

      describe('when `outOfRangeThresholds` provided', () => {
        it('should return the String High if value over the high threshold', () => {
          expect(format.formatBgValue(401, { bgUnits: MGDL_UNITS }, { high: 400 }))
            .to.equal(BG_HIGH);
        });

        it('should return normal String integer if value NOT over the high threshold', () => {
          expect(format.formatBgValue(399, { bgUnits: MGDL_UNITS }, { high: 400 })).to.equal('399');
        });

        it('should return the String Low if value under the low threshold', () => {
          expect(format.formatBgValue(39, { bgUnits: MGDL_UNITS }, { low: 40 })).to.equal(BG_LOW);
        });

        it('should return normal String integer if value NOT under the low threshold', () => {
          expect(format.formatBgValue(41, { bgUnits: MGDL_UNITS }, { low: 40 })).to.equal('41');
        });
      });
    });

    describe('when units are `mmol/L`', () => {
      it('should return a String number', () => {
        expect(format.formatBgValue(6.6886513292098675, { bgUnits: MMOLL_UNITS })).to.equal('6.7');
      });

      it('should give one decimal place', () => {
        expect(format.formatBgValue(12.52, { bgUnits: MMOLL_UNITS })).to.equal('12.5');
      });

      it('should round', () => {
        expect(format.formatBgValue(12.77, { bgUnits: MMOLL_UNITS })).to.equal('12.8');
      });

      describe('when `outOfRangeThresholds` provided', () => {
        it('should return the String High if value over the high threshold', () => {
          expect(format.formatBgValue(23.1, { bgUnits: MMOLL_UNITS }, { high: 400 }))
            .to.equal(BG_HIGH);
        });

        it('should return normal String number if value NOT over the high threshold', () => {
          expect(format.formatBgValue(22.0, { bgUnits: MMOLL_UNITS }, { high: 400 }))
            .to.equal('22.0');
        });

        it('should return the String Low if value under the low threshold', () => {
          expect(format.formatBgValue(2.1, { bgUnits: MMOLL_UNITS }, { low: 40 })).to.equal(BG_LOW);
        });

        it('should return normal String number if value NOT under the low threshold', () => {
          expect(format.formatBgValue(3.36, { bgUnits: MMOLL_UNITS }, { low: 40 })).to.equal('3.4');
        });
      });
    });

    describe('agp formatting', () => {
      it('should apply bankers rounding on the formatted value', () => {
        expect(format.formatBgValue(12.35, { bgUnits: MMOLL_UNITS }, null, true)).to.equal('12.4');
        expect(format.formatBgValue(12.45, { bgUnits: MMOLL_UNITS }, null, true)).to.equal('12.4');
        expect(format.formatBgValue(351.5, { bgUnits: MGDL_UNITS }, null, true)).to.equal('352');
        expect(format.formatBgValue(352.5, { bgUnits: MGDL_UNITS }, null, true)).to.equal('352');
      });
    });
  });

  describe('formatDecimalNumber', () => {
    it('should give no places when none specified', () => {
      expect(format.formatDecimalNumber(9.3328)).to.equal('9');
    });

    it('should give no places when zero specified', () => {
      expect(format.formatDecimalNumber(9.3328, 0)).to.equal('9');
    });

    it('should give the number of places when they are specified', () => {
      expect(format.formatDecimalNumber(9.3328, 1)).to.equal('9.3');
    });
  });

  describe('formatInsulin', () => {
    it('should be a function', () => {
      assert.isFunction(format.formatInsulin);
    });

    it('should return a single digit fixed point float for integers', () => {
      expect(format.formatInsulin(5)).to.equal('5.0');
    });

    it('should include hundredths for insulin with hundredths precision', () => {
      expect(format.formatInsulin(5.05)).to.equal('5.05');
    });

    it('should include thousandths for insulin with thousandths precision', () => {
      expect(format.formatInsulin(0.375)).to.equal('0.375');
      expect(format.formatInsulin(3.825)).to.equal('3.825');
    });
  });

  describe('formatPercentage', () => {
    it('should be a function', () => {
      assert.isFunction(format.formatPercentage);
    });

    it('should return `--%` on `NaN` input', () => {
      expect(format.formatPercentage(NaN)).to.equal('--%');
    });

    it('should return a String percentage including `%` suffix', () => {
      expect(format.formatPercentage(0.5)).to.equal('50%');
    });

    it('should round to zero decimal places by default', () => {
      expect(format.formatPercentage(0.732)).to.equal('73%');
      expect(format.formatPercentage(0.736)).to.equal('74%');
    });

    it('should round to a provided number of decimal places', () => {
      expect(format.formatPercentage(0.732, 2)).to.equal('73.20%');
      expect(format.formatPercentage(0.736548, 3)).to.equal('73.655%');
    });

    describe('agp formatting', () => {
      it('should apply bankers rounding on the formatted value', () => {
        expect(format.formatPercentage(0.735, 0, true)).to.equal('74%');
        expect(format.formatPercentage(0.745, 0, true)).to.equal('74%');
        expect(format.formatPercentage(0.7135, 1, true)).to.equal('71.4%');
        expect(format.formatPercentage(0.7145, 1, true)).to.equal('71.4%');
      });
    });
  });

  describe('formatStatsPercentage', () => {
    it('should be a function', () => {
      assert.isFunction(format.formatPercentage);
    });

    it('should return `--` on `NaN` input', () => {
      expect(format.formatStatsPercentage(NaN)).to.equal('--');
    });

    it('should format to 1 decimal place using bankers round when value < 1%', () => {
      expect(format.formatStatsPercentage(0.003)).to.equal('0.3');
      expect(format.formatStatsPercentage(0.0035)).to.equal('0.4');
      expect(format.formatStatsPercentage(0.008)).to.equal('0.8');
      expect(format.formatStatsPercentage(0.0085)).to.equal('0.8');
      expect(format.formatStatsPercentage(0.0092)).to.equal('0.9');
    })

    it('should format to whole number if bankers round would round to 1', () =>{
      expect(format.formatStatsPercentage(0.0095)).to.equal('1');
      expect(format.formatStatsPercentage(0.00956)).to.equal('1');
      expect(format.formatStatsPercentage(0.0099)).to.equal('1');
    })

    it('should format to whole number using bankers round when value >= 1%', () => {
      expect(format.formatStatsPercentage(0.01)).to.equal('1');
      expect(format.formatStatsPercentage(0.01001)).to.equal('1');
      expect(format.formatStatsPercentage(0.015)).to.equal('2');
      expect(format.formatStatsPercentage(0.062)).to.equal('6');
      expect(format.formatStatsPercentage(0.085)).to.equal('8');
      expect(format.formatStatsPercentage(0.085001)).to.equal('9');
      expect(format.formatStatsPercentage(0.095)).to.equal('10');
      expect(format.formatStatsPercentage(0.295)).to.equal('30');
    })
  });

  describe('removeTrailingZeroes', () => {
    it('should be a function', () => {
      assert.isFunction(format.removeTrailingZeroes);
    });

    it('should return a String integer if only zeroes follow the decimal point', () => {
      expect(format.removeTrailingZeroes('2.000')).to.equal('2');
    });

    it('should preserve everything non-zero right of the decimal point', () => {
      expect(format.removeTrailingZeroes('2.100')).to.equal('2.100');
    });
  });
});
