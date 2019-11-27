import _ from 'lodash';
import moment from 'moment';
import table from 'text-table';
import i18next from 'i18next';

import {
  formatBirthdate,
  formatCurrentDate,
  formatDateRange,
  formatDiagnosisDate,
  getTimezoneFromTimePrefs,
} from '../datetime';

import { getPatientFullName } from '../misc';

const t = i18next.t.bind(i18next);

export class TextUtil {
  constructor(patient, endpoints, timePrefs) {
    this.patient = patient;
    this.endpoints = endpoints;
    this.timePrefs = timePrefs;
  }

  buildDocumentHeader = (source) => {
    const fullname = this.buildTextLine(getPatientFullName(this.patient));
    const bday = this.buildTextLine({ label: t('Date of birth'), value: formatBirthdate(this.patient) });
    const diagnosis = this.buildTextLine({ label: t('Date of diagnosis'), value: formatDiagnosisDate(this.patient) });
    const exported = this.buildTextLine({ label: `${t('Exported from Tidepool')}${source ? ` ${source}` : ''}`, value: formatCurrentDate() });
    return `${fullname}${bday}${diagnosis}${exported}`;
  };

  buildDocumentDates = () => {
    const timezone = getTimezoneFromTimePrefs(this.timePrefs);

    // endpoint is exclusive, so need to subtract a day from formatted range end date
    const start = moment.utc(this.endpoints[0]).tz(timezone);
    const end = moment.utc(this.endpoints[1]).tz(timezone).subtract(1, 'day');
    return `\nReporting Period: ${formatDateRange(start, end)}\n`;
  }

  buildTextLine = (text = '') => (_.isPlainObject(text) ? `${text.label}: ${text.value}\n` : `${text}\n`);

  buildTextTable = (name, rows, columns, opts) => {
    const tableText = this.getTable(rows, columns, opts);
    return name ? `\n${name}\n${tableText}\n` : `\n${tableText}\n`;
  }

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
