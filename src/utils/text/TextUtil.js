import _ from 'lodash';
import table from 'text-table';
import i18next from 'i18next';

import {
  formatBirthdate,
  formatCurrentDate,
  formatDateRange,
  formatDiagnosisDate,
  getOffset,
  getTimezoneFromTimePrefs,
} from '../datetime';

import { MS_IN_MIN } from '../constants';

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
    const diagnosis = formatDiagnosisDate(this.patient);
    const diagnosisText = diagnosis ? this.buildTextLine({ label: t('Date of diagnosis'), value: diagnosis }) : '';
    const mrn = this.patient?.clinicPatientMRN || this.patient?.profile?.patient?.mrn;
    const mrnText = mrn ? this.buildTextLine({ label: t('MRN'), value: mrn }) : '';
    const exported = this.buildTextLine({ label: `${t('Exported from Tidepool')}${source ? ` ${source}` : ''}`, value: formatCurrentDate() });
    return `${fullname}${bday}${diagnosisText}${mrnText}${exported}`;
  };

  buildDocumentDates = () => {
    const timezone = getTimezoneFromTimePrefs(this.timePrefs);

    // endpoint is exclusive, so need to subtract a millisecond from formatted range end date
    let start = this.endpoints[0];
    let end = this.endpoints[1] - 1;

    start = start - getOffset(start, timezone) * MS_IN_MIN;
    end = end - getOffset(end, timezone) * MS_IN_MIN;

    return `\nReporting Period: ${formatDateRange(start, end)}\n`;
  }

  buildTextLine = (text = '') => (_.isPlainObject(text) ? `${text.label}: ${text.value}\n` : `${text}\n`);

  buildTextTable = (name, rows, columns, opts) => {
    const tableText = this.getTable(rows, columns, opts);
    if (name && tableText) return `\n${name}\n${tableText}\n`;
    return name ? `\n${name}\n` : `\n${tableText}\n`;
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
