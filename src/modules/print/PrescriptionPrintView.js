import _ from 'lodash';
import i18next from 'i18next';

import PrintView from './PrintView';

const t = i18next.t.bind(i18next);

class PrescriptionPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);

    console.log('this', this);

    this.doc.addPage();
    this.initLayout();
  }

  newPage() {
    // super.newPage(t('Uploaded on: {{uploadDate}}', { uploadDate: this.deviceMeta.uploaded }));
    super.newPage();
  }

  initLayout() {
    this.setLayoutColumns({
      width: this.chartArea.width,
      gutter: 0,
      type: 'percentage',
      widths: [50, 50],
    });
  }

  render() {
    this.renderPatientProfile();
  }

  renderPatientProfile() {
    this.doc
      .font(this.boldFont)
      .fontSize(this.largeFontSize)
      .text(t('Patient Profile'))
      .moveDown();

    this.resetText();
    this.doc.moveDown();
  }
}

export default PrescriptionPrintView;
