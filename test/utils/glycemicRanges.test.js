/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2026, Tidepool Project
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

import {
  getBgBoundsForGlycemicRanges,
  getGlycemicRangesPreset,
} from '../../src/utils/glycemicRanges';

import {
  ADA_GESTATIONAL_T2_BG_BOUNDS,
  ADA_OLDER_HIGH_RISK_BG_BOUNDS,
  ADA_PREGNANCY_T1_BG_BOUNDS,
  ADA_STANDARD_BG_BOUNDS,
} from '../../src/utils/glycemicRangeConstants';

import { MGDL_UNITS, MMOLL_UNITS } from '../../src/utils/constants';

describe('glycemicRanges', () => {
  describe('getGlycemicRangesPreset', () => {
    it('returns ADA standard when glycemicRanges is missing', () => {
      expect(getGlycemicRangesPreset(null)).to.equal('adaStandard');
      expect(getGlycemicRangesPreset(undefined)).to.equal('adaStandard');
    });

    it('returns the preset for type=preset', () => {
      expect(getGlycemicRangesPreset({ type: 'preset', preset: 'adaPregnancyType1' })).to.equal('adaPregnancyType1');
      expect(getGlycemicRangesPreset({ type: 'preset', preset: 'adaHighRisk' })).to.equal('adaHighRisk');
    });

    it('falls back to ADA standard for type=custom (not yet implemented)', () => {
      expect(getGlycemicRangesPreset({ type: 'custom' })).to.equal('adaStandard');
    });

    it('falls back to ADA standard for unknown type', () => {
      expect(getGlycemicRangesPreset({ type: 'somethingElse' })).to.equal('adaStandard');
    });
  });

  describe('getBgBoundsForGlycemicRanges', () => {
    it('returns ADA standard bounds when glycemicRanges is missing', () => {
      expect(getBgBoundsForGlycemicRanges(null, MGDL_UNITS)).to.deep.equal(ADA_STANDARD_BG_BOUNDS[MGDL_UNITS]);
      expect(getBgBoundsForGlycemicRanges(undefined, MMOLL_UNITS)).to.deep.equal(ADA_STANDARD_BG_BOUNDS[MMOLL_UNITS]);
    });

    it('returns ADA pregnancy type 1 bounds in mg/dL', () => {
      expect(
        getBgBoundsForGlycemicRanges({ type: 'preset', preset: 'adaPregnancyType1' }, MGDL_UNITS),
      ).to.deep.equal(ADA_PREGNANCY_T1_BG_BOUNDS[MGDL_UNITS]);
    });

    it('returns ADA pregnancy type 2 (gestational) bounds in mmol/L', () => {
      expect(
        getBgBoundsForGlycemicRanges({ type: 'preset', preset: 'adaPregnancyType2' }, MMOLL_UNITS),
      ).to.deep.equal(ADA_GESTATIONAL_T2_BG_BOUNDS[MMOLL_UNITS]);
    });

    it('returns ADA older/high-risk bounds in mg/dL', () => {
      expect(
        getBgBoundsForGlycemicRanges({ type: 'preset', preset: 'adaHighRisk' }, MGDL_UNITS),
      ).to.deep.equal(ADA_OLDER_HIGH_RISK_BG_BOUNDS[MGDL_UNITS]);
    });

    it('returns ADA standard bounds when preset is unrecognized', () => {
      expect(
        getBgBoundsForGlycemicRanges({ type: 'preset', preset: 'noSuchPreset' }, MGDL_UNITS),
      ).to.deep.equal(ADA_STANDARD_BG_BOUNDS[MGDL_UNITS]);
    });

    it('returns ADA standard bounds for type=custom', () => {
      expect(
        getBgBoundsForGlycemicRanges({ type: 'custom' }, MMOLL_UNITS),
      ).to.deep.equal(ADA_STANDARD_BG_BOUNDS[MMOLL_UNITS]);
    });

    it('throws a TypeError when bgUnits is invalid', () => {
      expect(() => getBgBoundsForGlycemicRanges(null, 'badUnits')).to.throw(TypeError);
      expect(() => getBgBoundsForGlycemicRanges(null, undefined)).to.throw(TypeError);
    });

    it('does not resolve inherited Object.prototype keys as bgUnits', () => {
      expect(() => getBgBoundsForGlycemicRanges(null, 'constructor')).to.throw(TypeError);
      expect(() => getBgBoundsForGlycemicRanges(null, 'toString')).to.throw(TypeError);
      expect(() => getBgBoundsForGlycemicRanges(null, 'hasOwnProperty')).to.throw(TypeError);
    });

    it('falls back to ADA standard when preset is an inherited Object.prototype key', () => {
      expect(
        getBgBoundsForGlycemicRanges({ type: 'preset', preset: 'constructor' }, MGDL_UNITS),
      ).to.deep.equal(ADA_STANDARD_BG_BOUNDS[MGDL_UNITS]);
      expect(
        getBgBoundsForGlycemicRanges({ type: 'preset', preset: 'toString' }, MMOLL_UNITS),
      ).to.deep.equal(ADA_STANDARD_BG_BOUNDS[MMOLL_UNITS]);
    });
  });
});
