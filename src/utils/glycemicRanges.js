import { GLYCEMIC_RANGES_PRESET, GLYCEMIC_RANGES_TYPE } from "./constants";

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
