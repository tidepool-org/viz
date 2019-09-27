import _ from 'lodash';
import table from 'text-table';
import i18next from 'i18next';

import { formatBirthdate, formatCurrentDate, formatDiagnosisDate } from '../datetime';
import { getPatientFullName } from '../misc';

const t = i18next.t.bind(i18next);

export class TextUtil {
  static buildDocumentHeader = (patient) => {
    const exported = t('Exported from Tidepool: {{date}}', { date: formatCurrentDate() });
    const bday = t('Date of birth: {{date}}', { date: formatBirthdate(patient) });
    const diagnosis = t('Date of diagnosis: {{date}}', { date: formatDiagnosisDate(this.patient) });
    const fullname = getPatientFullName(patient);
    return `${fullname}\n${bday}\n${diagnosis}\n${exported}\n`;
  };

  static buildTextTable = (name, rows, columns) => `\n${name}\n${this.getTable(rows, columns)}\n`;

  getTable = (rows, columns) => {
    const header = [this.getTableHeader(this.normalizeColumns(columns))];
    const content = this.getTableRows(rows, columns);
    return table(header.concat(content));
  };

  getTableHeader = columns => _.map(
    columns,
    column => (_.isPlainObject(column.label) ? `${column.label.main} ${column.label.secondary}` : column.label)
  );

  getTableRows = (rows, columns) => _.map(
    rows,
    row => this.getTableRow(columns, row)
  );

  getTableRow = (columns, rowData) => _.map(
    columns,
    (column) => rowData[column.key]
  );
}

export default TextUtil;
