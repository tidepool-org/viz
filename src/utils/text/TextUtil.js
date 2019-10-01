import _ from 'lodash';
import table from 'text-table';
import i18next from 'i18next';

import { formatBirthdate, formatCurrentDate, formatDateRange, formatDiagnosisDate } from '../datetime';
import { getPatientFullName } from '../misc';

const t = i18next.t.bind(i18next);

export class TextUtil {
  constructor(patient, endpoints) {
    this.patient = patient;
    this.endpoints = endpoints;
  }

  buildDocumentHeader = () => {
    const fullname = this.buildTextLine(getPatientFullName(this.patient));
    const bday = this.buildTextLine({ label: t('Date of birth'), value: formatBirthdate(this.patient) });
    const diagnosis = this.buildTextLine({ label: t('Date of diagnosis'), value: formatDiagnosisDate(this.patient) });
    const exported = this.buildTextLine({ label: t('Exported from Tidepool'), value: formatCurrentDate() });
    return `${fullname}${bday}${diagnosis}${exported}`;
  };

  buildDocumentDates = () => `\nReporting Period: ${formatDateRange(this.endpoints[0], this.endpoints[1])}\n`;

  buildTextLine = (text = '') => (_.isPlainObject(text) ? `${text.label}: ${text.value}\n` : `${text}\n`);

  buildTextTable = (name = '', rows, columns, opts) => `\n${name}\n${this.getTable(rows, columns, opts)}\n`;

  getTable = (rows, columns, opts = {}) => {
    _.defaults(opts, {
      showHeader: true,
    });

    const header = [this.getTableHeader(columns)];
    const content = this.getTableRows(rows, columns);
    return opts.showHeader ? table(header.concat(content)) : table(content);
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
    column => rowData[column.key]
  );
}

export default TextUtil;
