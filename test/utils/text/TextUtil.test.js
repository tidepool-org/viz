import TextUtil from '../../../src/utils/text/TextUtil';

describe('TextUtil', () => {
  const patient = {
    profile: {
      fullName: 'John Doe',
      patient: {
        birthday: '2000-01-01',
        diagnosisDate: '2014-12-31',
        mrn: 'mrn123',
      },
    },
  };

  const endpoints = [
    Date.parse('2019-02-01T05:00:00.000Z'),
    Date.parse('2019-02-20T05:00:00.000Z'),
  ];

  const timePrefs = { timezoneName: 'US/Eastern', timezoneAware: true };

  let textUtil;

  beforeEach(() => {
    textUtil = new TextUtil(patient, endpoints, timePrefs);
  });

  describe('constructor', () => {
    it('should store the provided patient as an internal property', () => {
      expect(textUtil.patient).to.eql(patient);
    });

    it('should store the provided endpoints as an internal property', () => {
      expect(textUtil.endpoints).to.eql(endpoints);
    });

    it('should store the provided timePrefs as an internal property', () => {
      expect(textUtil.timePrefs).to.eql(timePrefs);
    });
  });

  describe('buildDocumentHeader', () => {
    it('should print the patient\'s full name', () => {
      sinon.spy(textUtil, 'buildTextLine');
      const result = textUtil.buildDocumentHeader();
      sinon.assert.calledWith(textUtil.buildTextLine, 'John Doe');
      expect(result).to.include('John Doe');
    });

    it('should print the patient\'s birth date', () => {
      sinon.spy(textUtil, 'buildTextLine');
      const result = textUtil.buildDocumentHeader();
      sinon.assert.calledWith(textUtil.buildTextLine, { label: 'Date of birth', value: 'Jan 1, 2000' });
      expect(result).to.include('Date of birth: Jan 1, 2000');
    });

    it('should print the patient\'s diagnosis date', () => {
      sinon.spy(textUtil, 'buildTextLine');
      const result = textUtil.buildDocumentHeader();
      sinon.assert.calledWith(textUtil.buildTextLine, { label: 'Date of diagnosis', value: 'Dec 31, 2014' });
      expect(result).to.include('Date of diagnosis: Dec 31, 2014');
    });

    it('should print the patient\'s mrn', () => {
      sinon.spy(textUtil, 'buildTextLine');
      const result = textUtil.buildDocumentHeader();
      sinon.assert.calledWith(textUtil.buildTextLine, { label: 'MRN', value: 'mrn123' });
      expect(result).to.include('MRN: mrn123');
    });

    context('patient profile is missing fields', () => {
      beforeEach(() => {
        const patientWithMissingFields = { ...patient };
        delete patientWithMissingFields.profile.patient.mrn;
        delete patientWithMissingFields.profile.patient.diagnosisDate;
        textUtil = new TextUtil(patientWithMissingFields, endpoints, timePrefs);
      });

      it('should not print the diagnosis date', () => {
        sinon.spy(textUtil, 'buildTextLine');
        const result = textUtil.buildDocumentHeader();
        expect(result).to.not.include('Date of diagnosis');
      });

      it('should not print the mrn', () => {
        sinon.spy(textUtil, 'buildTextLine');
        const result = textUtil.buildDocumentHeader();
        expect(result).to.not.include('MRN');
      });
    });

    it('should print the export source when provided', () => {
      sinon.spy(textUtil, 'buildTextLine');
      const result = textUtil.buildDocumentHeader();
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'Exported from Tidepool' }));
      expect(result).to.include('Exported from Tidepool');

      const result2 = textUtil.buildDocumentHeader('Settings');
      sinon.assert.calledWith(textUtil.buildTextLine, sinon.match({ label: 'Exported from Tidepool Settings' }));
      expect(result2).to.include('Exported from Tidepool Settings');
    });
  });

  describe('buildDocumentDates', () => {
    it('should print the document reporting period', () => {
      const result = textUtil.buildDocumentDates();
      expect(result).to.equal('\nReporting Period: Feb 1 - Feb 19, 2019\n');
    });
  });

  describe('buildTextLine', () => {
    it('should export a line of text provided in string format', () => {
      expect(textUtil.buildTextLine('hello')).to.equal('hello\n');
    });

    it('should export a line of text provided in object format', () => {
      expect(textUtil.buildTextLine({ label: 'Label', value: 'Value' })).to.equal('Label: Value\n');
    });
  });

  describe('buildTextTable', () => {
    const rows = [
      { label: 'row1', value: '1' },
      { label: 'row2', value: '2' },
    ];

    const columns = [
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ];

    const opts = { myOpt: true };

    it('should call `getTable`', () => {
      sinon.spy(textUtil, 'getTable');
      textUtil.buildTextTable(null, rows, columns, opts);
      sinon.assert.calledWith(textUtil.getTable, rows, columns, opts);
    });

    it('should print the table heading if provided', () => {
      sinon.stub(textUtil, 'getTable').returns('Table Text');
      expect(textUtil.buildTextTable(null, rows, columns, opts)).to.equal('\nTable Text\n');
      expect(textUtil.buildTextTable('My Heading', rows, columns, opts)).to.equal('\nMy Heading\nTable Text\n');
    });
  });

  describe('getTable', () => {
    const rows = [
      { label: 'row1', value: '1' },
      { label: 'row2', value: '2' },
    ];

    const columns = [
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
    ];

    const opts = {};

    it('should return a formatted text table with header row by default', () => {
      const result = textUtil.getTable(rows, columns, opts);
      expect(result).to.equal('Label  Value\nrow1   1\nrow2   2');
    });

    it('should return a formatted text table without header row if disabled in opts', () => {
      const result = textUtil.getTable(rows, columns, { showHeader: false });
      expect(result).to.equal('row1  1\nrow2  2');
    });
  });

  describe('getTableHeader', () => {
    it('should create formatted labels from provided label text strings or objects', () => {
      const columns = [
        { key: 'label', label: 'From String!' },
        { key: 'value', label: { main: 'From Object!', secondary: ':)' } },
      ];
      expect(textUtil.getTableHeader(columns)).to.eql(['From String!', 'From Object! :)']);
    });
  });

  describe('getTableRows', () => {
    it('should call `getTableRow` on each provided row', () => {
      const rows = [
        { label: 'row1', value: '1' },
        { label: 'row2', value: '2' },
      ];

      const columns = [
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
      ];

      sinon.spy(textUtil, 'getTableRow');

      textUtil.getTableRows(rows, columns);
      sinon.assert.calledWith(textUtil.getTableRow, columns, rows[0]);
      sinon.assert.calledWith(textUtil.getTableRow, columns, rows[1]);
    });
  });

  describe('getTableRow', () => {
    it('should return the row data for each column', () => {
      const row = { label: 'row1', value: '1' };

      const columns = [
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
      ];

      sinon.spy(textUtil, 'getTableRow');

      expect(textUtil.getTableRow(columns, row)).to.eql(['row1', '1']);
    });
  });
});
