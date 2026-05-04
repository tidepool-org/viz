import _ from 'lodash';

import * as utils from '../../../src/utils/bgLog/data';
import { types as Types } from '../../../data/types';

describe('[bgLog] data utils', () => {
  describe('bgLogText', () => {
    /* eslint-disable lines-between-class-members */
    class TextUtilStub {
      buildDocumentHeader = sinon.stub().returns('BG Log Header, ');
      buildDocumentDates = sinon.stub().returns('BG Log Dates, ');
      buildTextLine = sinon.stub().returns('');
    }
    /* eslint-enable lines-between-class-members */

    const patient = { profile: {
      fullName: 'John Doe',
      patient: {
        birthday: '2000-01-01',
        diagnosisDate: '2014-12-31',
      },
    } };

    const stats = [{ id: 'myStat' }];
    const endpoints = ['2018-02-01T01:00:00.000Z', '2018-02-15T01:00:00.000Z'];
    const timePrefs = { timezoneName: 'US/Eastern', timezoneAware: true };
    const chartPrefs = { activeDays: { monday: false, wednesday: false } };
    const bgPrefs = {};
    const useRawData = { raw: false };

    const data = {
      data: {
        current: {
          endpoints: {
            range: _.map(endpoints, Date.parse),
          },
        },
        combined: [
          new Types.SMBG({ deviceTime: '2018-02-01T00:59:59', value: 100, subType: 'manual', ...useRawData }), // Outside of range
          new Types.SMBG({ deviceTime: '2018-02-01T01:00:00', value: 120, subType: 'meter', ...useRawData }),
          new Types.CBG({ deviceTime: '2018-02-01T01:00:00', value: 90, ...useRawData }), // Not an SMBG
          new Types.SMBG({ deviceTime: '2018-02-02T02:00:00', value: 70, subType: 'manual', ...useRawData }),
          new Types.SMBG({ deviceTime: '2018-02-03T03:00:00', value: 50, subType: 'linked', ...useRawData }),
          new Types.SMBG({ deviceTime: '2018-02-15T01:00:01', value: 130, subType: 'manual', ...useRawData }), // Outside of range
        ],
      },
      bgPrefs,
      timePrefs,
      metaData: {
        devices: [
          { id: 'deviceWithFriendlyName', deviceName: 'Friendly Name', label: 'Hidden Label' },
          { id: 'deviceWithLabelId', label: 'Device With Label' },
          { id: 'deviceWithoutLabelId' },
          { id: 'deviceNotUsedInCurrentDataId' },
        ],
        matchedDevices: {
          deviceWithLabelId: true,
          deviceWithoutLabelId: true,
          deviceWithFriendlyName: true,
        },
      },
    };

    let textUtilStub;

    before(() => {
      textUtilStub = new TextUtilStub();
      sinon.stub(utils.utils, 'TextUtil').returns(textUtilStub);
      sinon.stub(utils.utils, 'statsText').returns('Stats Text');
      sinon.stub(utils.utils, 'reshapeBgClassesToBgBounds').returns('BG Bounds');
    });

    afterEach(() => {
      utils.utils.TextUtil.resetHistory();
      utils.utils.statsText.resetHistory();
      utils.utils.reshapeBgClassesToBgBounds.resetHistory();
      textUtilStub.buildDocumentHeader.resetHistory();
      textUtilStub.buildDocumentDates.resetHistory();
      textUtilStub.buildTextLine.resetHistory();
    });

    after(() => {
      utils.utils.TextUtil.restore();
      utils.utils.statsText.restore();
      utils.utils.reshapeBgClassesToBgBounds.restore();
    });

    it('should reshape provided tideline-style bgPrefs to the viz format', () => {
      utils.bgLogText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(utils.utils.reshapeBgClassesToBgBounds, 1);
      sinon.assert.calledWith(utils.utils.reshapeBgClassesToBgBounds, bgPrefs);
    });

    it('should return formatted text for BG Log header and stats data', () => {
      const result = utils.bgLogText(patient, data, stats, chartPrefs);
      expect(result).contains('BG Log Header, BG Log Dates, Stats Text');
    });

    it('should build the document header section', () => {
      utils.bgLogText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(textUtilStub.buildDocumentHeader, 1);
      sinon.assert.calledWith(textUtilStub.buildDocumentHeader, 'BG Log');
    });

    it('should build the document dates section', () => {
      utils.bgLogText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(textUtilStub.buildDocumentDates, 1);
    });

    it('should build the bgLog stats section', () => {
      utils.bgLogText(patient, data, stats, chartPrefs);
      sinon.assert.callCount(utils.utils.statsText, 1);
      sinon.assert.calledWith(utils.utils.statsText, stats, textUtilStub, bgPrefs);
    });

    it('should write out the tab-separated BG reading details within the data endpoints in reverse order', () => {
      const result = utils.bgLogText(patient, data, stats);

      expect(result).contains([
        [
          'Fri, Feb 2, 2018 10:00 PM',
          '50',
          '(Linked)',
        ].join('\t'),
        [
          'Thu, Feb 1, 2018 9:00 PM',
          '70',
          '(Manual)',
        ].join('\t'),
        [
          'Wed, Jan 31, 2018 8:00 PM',
          '120',
          '(Meter)',
        ].join('\t'),
      ].join('\n'));
    });

    it('should output devices found in the current data set used for the report', () => {
      utils.bgLogText(patient, data, stats);
      sinon.assert.calledWith(textUtilStub.buildTextLine, '\n\nDevices Uploaded');
      sinon.assert.calledWith(textUtilStub.buildTextLine, 'Friendly Name');
      sinon.assert.calledWith(textUtilStub.buildTextLine, 'Device With Label');
      sinon.assert.calledWith(textUtilStub.buildTextLine, 'deviceWithoutLabelId');
      sinon.assert.neverCalledWith(textUtilStub.buildTextLine, 'deviceNotUsedInCurrentDataId');
    });
  });
});
