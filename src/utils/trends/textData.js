import _ from 'lodash';

import TextUtil from '../text/TextUtil';

/**
 * statsText
 * @param  {Object} patient     the patient object that contains the profile
 * @param  {Object} stats       all stats data
 *
 * @return {String}             stats as a string table
 */
export function trendsText(patient, stats, endpoints) {
  const textUtil = new TextUtil(patient, endpoints);
  let tablesString = textUtil.buildDocumentHeader();

  tablesString += textUtil.buildDocumentDates();

  tablesString += textUtil.buildTextLine('\nTrends Statistics');

  const groupedStats = _.groupBy(stats, stat => {
    let type;

    switch (stat.id) {
      case 'averageGlucose':
      case 'coefficientOfVariation':
      case 'standardDev':
      case 'sensorUsage':
      case 'glucoseManagementIndicator':
      default:
        type = 'line';
        break;

      case 'timeInRange':
      case 'readingsInRange':
        type = 'table';
    }

    return type;
  });

  console.log('groupedStats.table', groupedStats.table);
  _.map(groupedStats.table, (stat) => {
    tablesString += textUtil.buildTextTable(
      `${stat.title} ${stat.units || ''}`,
      _.map(stat.data.data, datum => ({
        label: datum.legendTitle || datum.title,
        value: datum.value,
      })),
      [
        {
          key: 'label',
          label: 'Label',
        },
        {
          key: 'value',
          label: 'Value',
        },
      ],
      { showHeader: false }
    );
  });

  console.log('groupedStats.line', groupedStats.line);
  _.map(groupedStats.line, (stat) => {
    tablesString += '\n'
    tablesString += textUtil.buildTextLine({
      label: stat.title,
      value: `${_.get(stat.data, stat.data.dataPaths.summary, {}).value} ${stat.units || ''}`,
    });
  });

  return tablesString;
}
