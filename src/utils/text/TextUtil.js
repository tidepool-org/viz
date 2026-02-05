import _ from 'lodash';
import table from 'text-table';
import i18next from 'i18next';

import {
  formatBirthdate,
  formatCurrentDate,
  formatDateRangeWithTime,
  formatDiagnosisDate,
  getOffset,
  getTimezoneFromTimePrefs,
} from '../datetime';

import { MS_IN_MIN } from '../constants';

import { getPatientFullName } from '../misc';

const t = i18next.t.bind(i18next);

export class TextUtil {
  constructor(patient, endpoints, timePrefs, copyAsTextMetadata) {
    this.patient = patient;
    this.endpoints = endpoints;
    this.timePrefs = timePrefs;
    this.copyAsTextMetadata = copyAsTextMetadata || {};
  }

  buildDocumentHeader = (source) => {
    const {
      diagnosisTypeLabel = null,
      patientTags = [],
      sites = []
    } = this.copyAsTextMetadata;

    const fullname = this.buildTextLine(getPatientFullName(this.patient));
    const bday = this.buildTextLine({ label: t('Date of birth'), value: formatBirthdate(this.patient) });
    const diagnosisTypeText = diagnosisTypeLabel ? this.buildTextLine({ label: t('Diabetes Type'), value: diagnosisTypeLabel }) : '';
    const diagnosisDate = formatDiagnosisDate(this.patient);
    const diagnosisDateText = diagnosisDate ? this.buildTextLine({ label: t('Date of diagnosis'), value: diagnosisDate }) : '';
    const mrn = this.patient?.clinicPatientMRN || this.patient?.profile?.patient?.mrn;
    const mrnText = mrn ? this.buildTextLine({ label: t('MRN'), value: mrn }) : '';

    const tagNames = _.map(patientTags, tag => tag.name).toSorted((a, b) => a.localeCompare(b)).join(', ');
    const siteNames = _.map(sites, site => site.name).toSorted((a, b) => a.localeCompare(b)).join(', ');

    const tagsText = patientTags.length ? this.buildTextLine({ label: t('Patient Tags'), value: tagNames }) : '';
    const sitesText = sites.length ? this.buildTextLine({ label: t('Clinic Sites'), value: siteNames }) : '';

    const exported = this.buildTextLine({ label: `${t('Exported from Tidepool')}${source ? ` ${source}` : ''}`, value: formatCurrentDate() });

    return (
      fullname +
      bday +
      diagnosisTypeText +
      diagnosisDateText +
      mrnText +
      tagsText +
      sitesText +
      exported
    );
  };

  buildDocumentDates = () => {
    const timezone = getTimezoneFromTimePrefs(this.timePrefs);

    let [start, end] = this.endpoints;
    start = start - getOffset(start, timezone) * MS_IN_MIN;
    end = end - getOffset(end, timezone) * MS_IN_MIN;

    const formattedDateAndTime = formatDateRangeWithTime(start, end);

    return `\nReporting Period: ${formattedDateAndTime}\n`;
  };

  buildTextLine = (text = '') => (_.isPlainObject(text) ? `${text.label}: ${text.value}\n` : `${text}\n`);

  buildTextTable = (name, rows, columns, opts) => {
    const tableText = this.getTable(rows, columns, opts);
    if (name && tableText) return `\n${name}\n${tableText}\n`;
    return name ? `\n${name}\n` : `\n${tableText}\n`;
  };

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
