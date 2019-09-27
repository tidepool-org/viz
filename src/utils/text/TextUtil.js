import bows from 'bows';

export class TextUtil {
  /**
   * @param {Object} bgBounds - object describing boundaries for blood glucose categories
   * @param {Array} data Unfiltered tideline data
   * @param {Array} endpoints Array ISO strings [start, end]
   */
  constructor(patient, dataUtil) {
    this.log = bows('DataUtil');
    this.patient = patient;
    this.dataUtil = dataUtil;
  }
}

export default TextUtil;
