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

// Glycemic-range constants extracted from utils/constants.js into their own
// dependency-free module so they can be exposed via a Node-friendly bundle
// (dist/glycemicRanges.js) for non-browser consumers (e.g. data-export-service).
// Do not import i18next, lodash, or anything else from here — keeping this
// module side-effect-free is what lets it load in plain Node.

const MGDL_UNITS = 'mg/dL';
const MMOLL_UNITS = 'mmol/L';

export const GLYCEMIC_RANGES_PRESET = {
  ADA_STANDARD: 'adaStandard',
  ADA_OLDER_HIGH_RISK: 'adaHighRisk',
  ADA_PREGNANCY_T1: 'adaPregnancyType1',
  ADA_GESTATIONAL_T2: 'adaPregnancyType2',
};

export const GLYCEMIC_RANGES_TYPE = {
  PRESET: 'preset',
  CUSTOM: 'custom',
};

export const DEFAULT_BG_BOUNDS = {
  [MGDL_UNITS]: {
    veryLowThreshold: 54,
    targetLowerBound: 70,
    targetUpperBound: 180,
    veryHighThreshold: 250,
    extremeHighThreshold: 350,
    clampThreshold: 600,
  },
  [MMOLL_UNITS]: {
    veryLowThreshold: 3.0,
    targetLowerBound: 3.9,
    targetUpperBound: 10.0,
    veryHighThreshold: 13.9,
    extremeHighThreshold: 19.4,
    clampThreshold: 33.3,
  },
};

export const ADA_STANDARD_BG_BOUNDS = DEFAULT_BG_BOUNDS;

export const ADA_OLDER_HIGH_RISK_BG_BOUNDS = {
  [MGDL_UNITS]: {
    veryLowThreshold: null,
    targetLowerBound: 70,
    targetUpperBound: 180,
    veryHighThreshold: 250,
    extremeHighThreshold: null,
    clampThreshold: 600,
  },
  [MMOLL_UNITS]: {
    veryLowThreshold: null,
    targetLowerBound: 3.9,
    targetUpperBound: 10.0,
    veryHighThreshold: 13.9,
    extremeHighThreshold: null,
    clampThreshold: 33.3,
  },
};

export const ADA_PREGNANCY_T1_BG_BOUNDS = {
  [MGDL_UNITS]: {
    veryLowThreshold: 54,
    targetLowerBound: 63,
    targetUpperBound: 140,
    veryHighThreshold: null,
    extremeHighThreshold: null,
    clampThreshold: 600,
  },
  [MMOLL_UNITS]: {
    veryLowThreshold: 3.0,
    targetLowerBound: 3.5,
    targetUpperBound: 7.8,
    veryHighThreshold: null,
    extremeHighThreshold: null,
    clampThreshold: 33.3,
  },
};

export const ADA_GESTATIONAL_T2_BG_BOUNDS = ADA_PREGNANCY_T1_BG_BOUNDS;
