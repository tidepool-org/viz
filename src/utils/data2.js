import universe from 'universe'; // eslint-disable-line import/no-unresolved
import bows from 'bows';

export class DataUtil2 {
  /**
   * @param {Array} data Raw Tidepool data
   */
  constructor(data) {
    this.log = bows('DataUtil2');
    this.data = universe(data);
  }

  addData = data => this.data.add(data)

  removeData = predicate => this.data.remove(predicate)

  getData = query => {
    const {
      endpoints,
      stats,
      types,
    } = query;

    console.log('endpoints', endpoints);
    console.log('stats', stats);
    console.log('types', types);
  }
}

export default DataUtil2;
