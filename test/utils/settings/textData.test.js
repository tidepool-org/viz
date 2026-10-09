import _ from 'lodash';
import * as textData from '../../../src/utils/settings/textData';
import { MGDL_UNITS } from '../../../src/utils/constants';

const medtronicMultirateData = require('../../../data/pumpSettings/medtronic/multirate.json');
const omnipodMultirateData = require('../../../data/pumpSettings/omnipod/multirate.json');
const tandemMultirateData = require('../../../data/pumpSettings/tandem/multirate.json');

// The MRN lives at `profile.patient.mrn` rather than `clinicPatientMRN` because that is the
// branch blip's merged `patient` prop populates for this view.
const patient = {
  profile: {
    fullName: 'Mary Smith',
    patient: {
      birthday: '1983-01-31',
      diagnosisDate: '1990-01-31',
      mrn: 'MRN123',
    },
  },
};

// Tags and sites are deliberately unsorted — buildDocumentHeader sorts both with localeCompare.
const copyAsTextMetadata = {
  diagnosisTypeLabel: 'Type 1',
  patientTags: [{ id: 't1', name: 'Zebra' }, { id: 't2', name: 'Alpha' }],
  sites: [{ id: 's1', name: 'Site B' }, { id: 's2', name: 'Site A' }],
};

// Each builder is exercised through the same case list. `lastTableHeading` names a table heading
// the fixture definitely emits and which lands last — confirmed by reading the built strings:
// neither non-Tandem fixture has preset rows, so `Insulin Settings` is the final table for all
// three, and the Tandem fixture emits one per profile so its last occurrence is the anchor.
const builders = [
  {
    label: 'nonTandemText (medtronic)',
    settings: medtronicMultirateData,
    buildText: opts => textData.nonTandemText(
      patient, medtronicMultirateData, MGDL_UNITS, 'medtronic', opts
    ),
    lastTableHeading: 'Insulin Settings',
  },
  {
    label: 'nonTandemText (omnipod)',
    settings: omnipodMultirateData,
    buildText: opts => textData.nonTandemText(
      patient, omnipodMultirateData, MGDL_UNITS, 'insulet', opts
    ),
    lastTableHeading: 'Insulin Settings',
  },
  {
    label: 'tandemText (tandem)',
    settings: tandemMultirateData,
    buildText: opts => textData.tandemText(
      patient, tandemMultirateData, MGDL_UNITS, opts
    ),
    lastTableHeading: 'Insulin Settings',
  },
];

const deviceBlockHeading = '\nDevice\n';

describe('[settings] text data utils', () => {
  _.each(builders, ({ label, settings, buildText, lastTableHeading }) => {
    describe(label, () => {
      const displayedDevice = {
        id: 'dev-pump', deviceName: 'Uploaded Pump', uploadIds: ['older-upload', settings.uploadId],
      };
      const otherDevice = { id: 'dev-other', deviceName: 'Other Pump', uploadIds: ['other-upload'] };
      const metaData = { devices: [otherDevice, displayedDevice] };

      describe('document header', () => {
        it('should include the diagnosis type when copyAsTextMetadata supplies a label', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('Diabetes Type: Type 1');
        });

        it('should include the MRN from the patient profile', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('MRN: MRN123');
        });

        it('should include the patient tag names in the order received', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('Patient Tags: Zebra, Alpha');
        });

        it('should include the clinic site names in the order received', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('Clinic Sites: Site B, Site A');
        });

        it('should omit the tag and site lines when both arrays are empty', () => {
          const text = buildText({
            copyAsTextMetadata: { ...copyAsTextMetadata, patientTags: [], sites: [] },
          });

          expect(text).to.include('Diabetes Type: Type 1');
          expect(text).to.not.include('Patient Tags');
          expect(text).to.not.include('Clinic Sites');
        });

        it('should omit the diagnosis type line when no label is supplied', () => {
          const text = buildText({ copyAsTextMetadata: _.omit(copyAsTextMetadata, 'diagnosisTypeLabel') });

          expect(text).to.not.include('Diabetes Type');
          expect(text).to.include('Patient Tags: Zebra, Alpha');
        });

        it('should keep the name, birthdate and source label when opts is omitted', () => {
          const text = buildText();

          expect(text).to.include('Mary Smith');
          expect(text).to.include('Date of birth: Jan 31, 1983');
          expect(text).to.include('Exported from Tidepool Device Settings:');
          expect(text).to.not.include('Diabetes Type');
          expect(text).to.not.include('Patient Tags');
          expect(text).to.not.include('Clinic Sites');
        });
      });

      describe('device block', () => {
        it('should list only the device whose uploadIds include the settings uploadId', () => {
          const text = buildText({ metaData });

          expect(text).to.include(`${deviceBlockHeading}Uploaded Pump\n`);
          expect(text).to.not.include('Other Pump');
        });

        it('should list the matched device regardless of hasPumpSettings or excludedDevices', () => {
          const text = buildText({
            metaData: {
              devices: [{ ...displayedDevice, pump: false, hasPumpSettings: false }],
              excludedDevices: [displayedDevice.id],
            },
          });

          expect(text).to.include(`${deviceBlockHeading}Uploaded Pump\n`);
        });

        it('should fall back to the device label when the matched device has no deviceName', () => {
          const text = buildText({
            metaData: { devices: [{ ..._.omit(displayedDevice, 'deviceName'), label: 'Pump Label' }] },
          });

          expect(text).to.include(`${deviceBlockHeading}Pump Label\n`);
        });

        it('should place the block after the last settings table', () => {
          const text = buildText({ metaData });

          expect(text.indexOf(deviceBlockHeading)).to.be.above(text.lastIndexOf(lastTableHeading));
        });

        it('should omit the block when no device uploaded the displayed settings', () => {
          const noBlockOpts = [
            undefined,
            {},
            { metaData: {} },
            { metaData: { devices: [] } },
            { metaData: { devices: [otherDevice] } },
            { metaData: { devices: [_.omit(displayedDevice, 'uploadIds')] } },
          ];

          _.each(noBlockOpts, (opts) => {
            expect(buildText(opts)).to.not.include(deviceBlockHeading);
          });
        });
      });
    });
  });
});
