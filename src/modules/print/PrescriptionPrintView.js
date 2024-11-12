import _ from 'lodash';
import i18next from 'i18next';

import PrintView from './PrintView';

const t = i18next.t.bind(i18next);

class PrescriptionPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);
    this.emptyValueText = t('Not specified');
    this.doc.addPage();
    this.initLayout();

    this.renderPatientProfileRow = this.renderPatientProfileRow.bind(this);
    this.renderTherapySettingRow = this.renderTherapySettingRow.bind(this);
  }

  newPage() {
    super.newPage(null, { showProfile: false, helpText: null });
  }

  initLayout() {
    this.setLayoutColumns({
      width: this.chartArea.width,
      gutter: 0,
      type: 'percentage',
      widths: [50, 50],
    });
  }

  updateYPos() {
    this.yPos = this.doc.y;
  }

  nextPage() {
    this.doc.addPage();
    this.yPos = this.chartArea.topEdge;
  }

  render() {
    this.renderPatientProfile();
    this.renderTherapySettings();
  }

  renderSectionHeading(text) {
    this.doc.x = this.leftEdge;

    this.doc
      .moveDown(2.5)
      .font(this.boldFont)
      .fontSize(this.largeFontSize)
      .text(text);

    this.resetText();
    this.renderSectionDivider();
    this.updateYPos();
  }

  renderSectionDivider() {
    this.doc.x = this.leftEdge;
    this.doc
      .moveDown(0.7)
      .moveTo(this.margins.left, this.doc.y)
      .lineTo(this.margins.left + this.width, this.doc.y)
      .stroke(this.colors.faintGrey)
      .moveDown(1);

    this.setStroke();
    this.updateYPos();
  }

  renderPatientProfileRow({ label, value }) {
    this.setFill(this.colors.primaryText);
    this.doc
      .fontSize(this.defaultFontSize)
      .text(`${label}: ${value}`)
      .moveDown(0.5);

    this.resetText();
  }

  renderPatientProfile() {
    const { patientRows } = this.data;

    this.renderSectionHeading(t('Patient Profile'));

    const rowsMidpointIndex = Math.ceil(patientRows.length / 2);
    const column1Rows = patientRows.slice(0, rowsMidpointIndex);
    const column2Rows = patientRows.slice(rowsMidpointIndex, patientRows.length);

    this.goToLayoutColumnPosition(0);
    this.doc.y = this.yPos;

    _.each(column1Rows, this.renderPatientProfileRow);
    const bottomYpos = this.doc.y;

    this.goToLayoutColumnPosition(1);
    this.doc.y = this.yPos;

    _.each(column2Rows, this.renderPatientProfileRow);

    this.doc.y = bottomYpos;
    this.renderSectionDivider();
    this.updateYPos();
  }

  renderTherapySettingRow({ label, value }, i) {
    const { therapySettingsRows } = this.data;
    const minRowHeight = this.doc.heightOfString(' ') * 2;

    if (this.yPos + minRowHeight > this.chartArea.bottomEdge) this.nextPage();

    this.goToLayoutColumnPosition(0);
    this.doc.y = this.yPos;

    this.setFill(this.colors.primaryText);

    this.doc
      .fontSize(this.defaultFontSize)
      .text(label);

    this.goToLayoutColumnPosition(1);
    this.doc.y = this.yPos;

    let rowValues = _.isArray(value) ? value : [value];
    if (_.isEmpty(rowValues)) rowValues = [this.emptyValueText];

    _.each(rowValues, (valueText, j) => {
      if (this.doc.y + minRowHeight > this.chartArea.bottomEdge) this.nextPage();

      this.doc
        .text(valueText)
        .moveDown(j === rowValues.length - 1 ? 0 : 0.25);
    });

    this.resetText();
    if (i !== therapySettingsRows.length - 1) this.renderSectionDivider();
  }

  renderTherapySettings() {
    const { therapySettingsRows } = this.data;

    this.renderSectionHeading(t('Therapy Settings'));

    this.updateYPos();

    _.each(therapySettingsRows, this.renderTherapySettingRow);
  }
}

export default PrescriptionPrintView;
