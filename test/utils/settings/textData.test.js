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

// `matchedDevices` stays empty — the all-time settings query never populates it.
const metaData = {
  devices: [
    { id: 'dev-pump', deviceName: 'Uploaded Pump', pump: true, hasPumpSettings: true },
    // Known only from its settings, so the capability flags are false but the settings exist.
    { id: 'dev-flagless', deviceName: 'Settings Only Pump', pump: false, hasPumpSettings: true },
  ],
  matchedDevices: {},
};

const excludedDevice = {
  id: 'dev-excluded', deviceName: 'Excluded Pump', pump: true, hasPumpSettings: true,
};

const cgmDevice = { id: 'dev-cgm', deviceName: 'Uploaded CGM', cgm: true, hasPumpSettings: false };
const bgmDevice = { id: 'dev-bgm', deviceName: 'Uploaded Meter', bgm: true, hasPumpSettings: false };
const pumpNoSettings = {
  id: 'dev-pump-nosettings', deviceName: 'Pump Without Settings', pump: true,
  hasPumpSettings: false,
};

// Each builder is exercised through the same case list. `lastTableHeading` names a table heading
// the fixture definitely emits and which lands last — confirmed by reading the built strings:
// neither non-Tandem fixture has preset rows, so `Insulin Settings` is the final table for all
// three, and the Tandem fixture emits one per profile so its last occurrence is the anchor.
const builders = [
  {
    label: 'nonTandemText (medtronic)',
    buildText: opts => textData.nonTandemText(
      patient, medtronicMultirateData, MGDL_UNITS, 'medtronic', opts
    ),
    lastTableHeading: 'Insulin Settings',
  },
  {
    label: 'nonTandemText (omnipod)',
    buildText: opts => textData.nonTandemText(
      patient, omnipodMultirateData, MGDL_UNITS, 'insulet', opts
    ),
    lastTableHeading: 'Insulin Settings',
  },
  {
    label: 'tandemText (tandem)',
    buildText: opts => textData.tandemText(
      patient, tandemMultirateData, MGDL_UNITS, opts
    ),
    lastTableHeading: 'Insulin Settings',
  },
];

describe('[settings] text data utils', () => {
  _.each(builders, ({ label, buildText, lastTableHeading }) => {
    describe(label, () => {
      describe('document header', () => {
        it('should include the diagnosis type when copyAsTextMetadata supplies a label', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('Diabetes Type: Type 1');
        });

        it('should include the MRN from the patient profile', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('MRN: MRN123');
        });

        it('should include the patient tag names in localeCompare order', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('Patient Tags: Alpha, Zebra');
        });

        it('should include the clinic site names in localeCompare order', () => {
          expect(buildText({ copyAsTextMetadata })).to.include('Clinic Sites: Site A, Site B');
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
          expect(text).to.include('Patient Tags: Alpha, Zebra');
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

      describe('devices uploaded', () => {
        it('should list every pump device in metaData.devices even when matchedDevices is empty', () => {
          const text = buildText({ metaData });

          expect(text).to.include('Devices Uploaded');
          expect(text).to.include('Uploaded Pump');
        });

        it('should keep a settings-bearing device whose capability flags are all false', () => {
          const text = buildText({ metaData });

          expect(text).to.include('Settings Only Pump');
        });

        it('should drop cgm and bgm devices, which the view renders no settings for', () => {
          const text = buildText({
            metaData: { ...metaData, devices: [...metaData.devices, cgmDevice, bgmDevice] },
          });

          expect(text).to.include('Uploaded Pump');
          expect(text).to.not.include('Uploaded CGM');
          expect(text).to.not.include('Uploaded Meter');
        });

        it('should drop a pump-tagged device that contributed no settings', () => {
          const text = buildText({
            metaData: { ...metaData, devices: [...metaData.devices, pumpNoSettings] },
          });

          expect(text).to.include('Uploaded Pump');
          expect(text).to.not.include('Pump Without Settings');
        });

        it('should omit the heading when no device contributed settings', () => {
          const text = buildText({ metaData: { devices: [cgmDevice, bgmDevice, pumpNoSettings] } });

          expect(text).to.not.include('Devices Uploaded');
        });

        it('should drop the devices listed in metaData.excludedDevices', () => {
          const text = buildText({
            metaData: {
              ...metaData,
              devices: [...metaData.devices, excludedDevice],
              excludedDevices: [excludedDevice.id],
            },
          });

          expect(text).to.include('Devices Uploaded');
          expect(text).to.include('Uploaded Pump');
          expect(text).to.include('Settings Only Pump');
          expect(text).to.not.include('Excluded Pump');
        });

        it('should place the heading after the last settings table', () => {
          const text = buildText({ metaData });

          expect(text.indexOf('Devices Uploaded')).to.be.above(text.lastIndexOf(lastTableHeading));
        });

        it('should omit the heading when no device survives the exclusions', () => {
          const noBlockOpts = [
            undefined,
            {},
            { metaData: {} },
            { metaData: { devices: [] } },
            { metaData: { devices: [], excludedDevices: [] } },
            { metaData: { matchedDevices: { 'dev-pump': true } } },
            {
              metaData: {
                devices: metaData.devices,
                excludedDevices: _.map(metaData.devices, 'id'),
              },
            },
          ];

          _.each(noBlockOpts, (opts) => {
            expect(buildText(opts)).to.not.include('Devices Uploaded');
          });
        });
      });
    });
  });
});
