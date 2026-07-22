import {
  ADA_GESTATIONAL_T2_BG_BOUNDS,
  ADA_OLDER_HIGH_RISK_BG_BOUNDS,
  ADA_PREGNANCY_T1_BG_BOUNDS,
  ADA_STANDARD_BG_BOUNDS,
  GLYCEMIC_RANGES_PRESET,
  GLYCEMIC_RANGES_TYPE,
} from './glycemicRangeConstants';

const PRESET_BOUNDS = {
  [GLYCEMIC_RANGES_PRESET.ADA_STANDARD]: ADA_STANDARD_BG_BOUNDS,
  [GLYCEMIC_RANGES_PRESET.ADA_OLDER_HIGH_RISK]: ADA_OLDER_HIGH_RISK_BG_BOUNDS,
  [GLYCEMIC_RANGES_PRESET.ADA_PREGNANCY_T1]: ADA_PREGNANCY_T1_BG_BOUNDS,
  [GLYCEMIC_RANGES_PRESET.ADA_GESTATIONAL_T2]: ADA_GESTATIONAL_T2_BG_BOUNDS,
};

export {
  ADA_GESTATIONAL_T2_BG_BOUNDS,
  ADA_OLDER_HIGH_RISK_BG_BOUNDS,
  ADA_PREGNANCY_T1_BG_BOUNDS,
  ADA_STANDARD_BG_BOUNDS,
  DEFAULT_BG_BOUNDS,
  GLYCEMIC_RANGES_PRESET,
  GLYCEMIC_RANGES_TYPE,
  MGDL_UNITS,
  MMOLL_UNITS,
} from './glycemicRangeConstants';

/**
 * Extracts the glycemic ranges preset value from the glycemicRanges object of the
 * clinicPatient record
 *
 * @param {Object} glycemicRanges the glycemicRanges object of the clinicPatient record
 *
 * @return {String} target range preset, e.g. 'adaStandard', 'adaPregnancyType1', etc
 */
export const getGlycemicRangesPreset = glycemicRanges => {
  // glycemicRanges field will not exist on older clinicPatient records
  if (!glycemicRanges) return GLYCEMIC_RANGES_PRESET.ADA_STANDARD;

  switch (glycemicRanges.type) {
    case GLYCEMIC_RANGES_TYPE.PRESET:
      return glycemicRanges.preset;
    case GLYCEMIC_RANGES_TYPE.CUSTOM:
      // feature to be implemented in future revisions
    default: // eslint-disable-line no-fallthrough
      return GLYCEMIC_RANGES_PRESET.ADA_STANDARD;
  }
};

/**
 * Resolve the BG bounds table for a patient's assigned glycemic range.
 * Single source of truth used by both blip (browser PDFs) and the
 * data-export-service (EHR PDFs) so the two stay in lockstep.
 *
 * @param {Object|null} glycemicRanges the glycemicRanges object of the clinicPatient record
 * @param {string} bgUnits 'mg/dL' or 'mmol/L'
 *
 * @return {Object} bgBounds, e.g. { veryLowThreshold, targetLowerBound, targetUpperBound, veryHighThreshold, extremeHighThreshold, clampThreshold }
 */
export const getBgBoundsForGlycemicRanges = (glycemicRanges, bgUnits) => {
  const preset = getGlycemicRangesPreset(glycemicRanges);
  // Own-property checks: `preset` comes straight from patient data and `bgUnits`
  // from the caller, so a value like "constructor"/"toString" would otherwise
  // resolve an inherited prototype member — skipping the ADA_STANDARD fallback
  // and defeating the TypeError guard below.
  const bounds = Object.prototype.hasOwnProperty.call(PRESET_BOUNDS, preset)
    ? PRESET_BOUNDS[preset]
    : ADA_STANDARD_BG_BOUNDS;
  if (!Object.prototype.hasOwnProperty.call(bounds, bgUnits)) {
    throw new TypeError(
      `getBgBoundsForGlycemicRanges: invalid bgUnits "${bgUnits}". Expected "mg/dL" or "mmol/L".`
    );
  }
  return bounds[bgUnits];
};
