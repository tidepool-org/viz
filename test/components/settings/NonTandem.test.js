/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

/* eslint no-console:0 */

import React from 'react';
// because the component is wrapped, can't use shallow
import { render as rtlRender, cleanup, fireEvent } from '@testing-library/react/pure';
import _ from 'lodash';

import NonTandem from '../../../src/components/settings/NonTandem';
import { MGDL_UNITS, MMOLL_UNITS } from '../../../src/utils/constants';
import { formatDecimalNumber } from '../../../src/utils/format';

import { formatClassesAsSelector } from '../../helpers/cssmodules';
import styles from '../../../src/components/settings/NonTandem.css';

// Mock child components to expose props for testing
jest.mock('../../../src/components/settings/common/Header', () => (props) => (
  <div data-testid="Header" data-device-display-name={props.deviceDisplayName}>{props.children}</div>
));

jest.mock('../../../src/components/settings/common/CollapsibleContainer', () => (props) => (
  <div data-testid="CollapsibleContainer">
    <div className="label">
      <span>{props.label && props.label.main}</span>
      <span>{props.label && props.label.secondary}</span>
      <span>{props.label && props.label.units}</span>
    </div>
    {props.children}
  </div>
));

jest.mock('../../../src/components/common/controls/ClipboardButton', () => (props) => (
  <button data-testid="ClipboardButton" onClick={() => props.onSuccess && props.onSuccess()}>Copy</button>
));

const animasFlatRateData = require('../../../data/pumpSettings/animas/flatrate.json');
const animasMultiRateData = require('../../../data/pumpSettings/animas/multirate.json');
const omnipodFlatRateData = require('../../../data/pumpSettings/omnipod/flatrate.json');
const omnipodMultiRateData = require('../../../data/pumpSettings/omnipod/multirate.json');
const medtronicMultiRateData = require('../../../data/pumpSettings/medtronic/multirate.json');
const medtronicAutomatedData = require('../../../data/pumpSettings/medtronic/automated.json');
const equilMultiRateData = require('../../../data/pumpSettings/equil/multirate.json');
const equilFlatRateData = require('../../../data/pumpSettings/equil/flatrate.json');

const copySettingsClicked = sinon.spy();
const timePrefs = { timezoneAware: false, timezoneName: 'Europe/London' };
const user = {
  profile: {
    fullName: 'Mary Smith',
    patient: {
      diagnosisDate: '1990-01-31',
      birthday: '1983-01-31',
    },
  },
};

afterEach(() => {
  copySettingsClicked.resetHistory();
});

describe('NonTandem', () => {
  const activeAtUploadText = 'Active at upload';

  afterEach(() => {
    cleanup();
  });

  describe('Animas', () => {
    it('should have a header', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'animas'}
          openedSections={{ [animasMultiRateData.activeSchedule]: true }}
          pumpSettings={animasMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="Header"]')).to.have.length(1);
    });

    it('should have Animas as the Header deviceDisplayName', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'animas'}
          openedSections={{ [animasMultiRateData.activeSchedule]: true }}
          pumpSettings={animasMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelector('[data-testid="Header"]').getAttribute('data-device-display-name')).to.equal('Animas');
    });

    // these tables are the bolus settings + basal schedules
    it('should have six Tables', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'animas'}
          openedSections={{ [animasMultiRateData.activeSchedule]: true }}
          pumpSettings={animasMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('table')).to.have.length(6);
    });

    // these containers are the basal schedules
    it('should have three CollapsibleContainers', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'animas'}
          openedSections={{ [animasMultiRateData.activeSchedule]: true }}
          pumpSettings={animasMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="CollapsibleContainer"]')).to.have.length(3);
    });

    it('should preserve user capitalization of schedule name', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'animas'}
          openedSections={{ [animasFlatRateData.activeSchedule]: true }}
          pumpSettings={animasFlatRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search('normal') !== -1)))
        .to.be.true;
      expect(labels.some(n => (n.textContent.search('Weekday') !== -1)))
        .to.be.true;
    });

    it('should have `Active at Upload` text somewhere', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'animas'}
          openedSections={{ [animasMultiRateData.activeSchedule]: true }}
          pumpSettings={animasMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search(activeAtUploadText) !== -1)))
        .to.be.true;
    });

    it('should have a button to copy settings', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'animas'}
          openedSections={{ [animasMultiRateData.activeSchedule]: true }}
          pumpSettings={animasMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const clipBoardButton = container.querySelector('[data-testid="ClipboardButton"]');
      expect(copySettingsClicked.callCount).to.equal(0);
      fireEvent.click(clipBoardButton);
      expect(copySettingsClicked.callCount).to.equal(1);
    });
    describe('bolus settings', () => {
      it('should surface the expected value for ISF', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'animas'}
            openedSections={{ [animasMultiRateData.activeSchedule]: true }}
            pumpSettings={animasMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const isfTable = tables.filter(n => (n.textContent.search('ISF') !== -1));
        expect(isfTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(animasMultiRateData.insulinSensitivity[0].amount, 1)
          ) !== -1)
        )).to.be.true;
      });

      it('should surface the expected target & range values for BG Target', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'animas'}
            openedSections={{ [animasMultiRateData.activeSchedule]: true }}
            pumpSettings={animasMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const bgTargetTable = tables.filter(n => (n.textContent.search('BG Target') !== -1));
        expect(bgTargetTable.some(
          n => (n.textContent
            .search(formatDecimalNumber(animasMultiRateData.bgTarget[0].target, 1)) !== -1)
        )).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent
            .search(formatDecimalNumber(animasMultiRateData.bgTarget[0].range, 1)) !== -1)
        )).to.be.true;
      });

      it('should surface the expected value for I:C Ratio', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'animas'}
            openedSections={{ [animasMultiRateData.activeSchedule]: true }}
            pumpSettings={animasMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const carbRatioTable = tables.filter(n => (n.textContent.search('I:C Ratio') !== -1));
        expect(carbRatioTable.some(
          n => (n.textContent.search(animasMultiRateData.carbRatio[0].amount) !== -1)
        )).to.be.true;
      });
    });
  });

  describe('Insulet', () => {
    it('should have a header', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'insulet'}
          openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
          pumpSettings={omnipodMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="Header"]')).to.have.length(1);
    });

    it('should have OmniPod as the Header deviceDisplayName', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'insulet'}
          openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
          pumpSettings={omnipodMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelector('[data-testid="Header"]').getAttribute('data-device-display-name')).to.equal('OmniPod');
    });

    // these tables are the insulin settings, bolus settings + basal schedules
    it('should have six Tables', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'insulet'}
          openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
          pumpSettings={omnipodMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('table')).to.have.length(6);
    });

    // these containers are the basal schedules
    it('should have two CollapsibleContainers', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'insulet'}
          openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
          pumpSettings={omnipodMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="CollapsibleContainer"]')).to.have.length(2);
    });

    it('should preserve user capitalization of schedule name', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'insulet'}
          openedSections={{ [omnipodFlatRateData.activeSchedule]: true }}
          pumpSettings={omnipodFlatRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search('normal') !== -1)))
        .to.be.true;
    });

    it('should have `Active at Upload` text somewhere', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'insulet'}
          openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
          pumpSettings={omnipodMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search(activeAtUploadText) !== -1)))
        .to.be.true;
    });

    describe('bolus settings', () => {
      it('should surface the expected value for Correction factor', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'insulet'}
            openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
            pumpSettings={omnipodMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const isfTable = tables.filter(n => (n.textContent.search('Correction factor') !== -1));
        expect(isfTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(omnipodMultiRateData.insulinSensitivity[0].amount, 1)
          ) !== -1)
        )).to.be.true;
      });

      it('should surface the expected target & correct above values for Target BG', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'insulet'}
            openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
            pumpSettings={omnipodMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const bgTargetTable = tables.filter(n => (n.textContent.search('Target BG') !== -1));

        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(omnipodMultiRateData.bgTarget[0].target, 1)
          ) !== -1)
        )).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(omnipodMultiRateData.bgTarget[0].high, 1)
          ) !== -1)
        )).to.be.true;
      });

      it('should surface the expected value for IC ratio', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'insulet'}
            openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
            pumpSettings={omnipodMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const carbRatioTable = tables.filter(n => (n.textContent.search('IC ratio') !== -1));
        expect(carbRatioTable.some(
          n => (n.textContent.search(omnipodMultiRateData.carbRatio[0].amount) !== -1)
        )).to.be.true;
      });

      it('should have a button to copy settings', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'insulet'}
            openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
            pumpSettings={omnipodMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const clipBoardButton = container.querySelector('[data-testid="ClipboardButton"]');
        expect(copySettingsClicked.callCount).to.equal(0);
        fireEvent.click(clipBoardButton);
        expect(copySettingsClicked.callCount).to.equal(1);
      });
    });

    describe('insulin settings', () => {
      let insulinSettingsTable;

      beforeEach(() => {
        const rendered = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'insulet'}
            openedSections={{ [omnipodMultiRateData.activeSchedule]: true }}
            pumpSettings={omnipodMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );

        insulinSettingsTable = Array.from(rendered.container.querySelectorAll('table')).find(
          n => (n.textContent.search('Insulin Settings') !== -1)
        );
      });

      afterEach(() => {
        cleanup();
      });

      it('should surface the expected value for max basal', () => {
        const rows = insulinSettingsTable.querySelectorAll('tr');
        expect(rows[0].textContent).contains('Max Basal Rate');
        expect(rows[0].textContent).contains(omnipodMultiRateData.basal.rateMaximum.value);
      });

      it('should surface the expected value for max bolus', () => {
        const rows = insulinSettingsTable.querySelectorAll('tr');
        expect(rows[1].textContent).contains('Maximum Bolus');
        expect(rows[1].textContent).contains(omnipodMultiRateData.bolus.amountMaximum.value);
      });

      it('should surface the expected value for insulin duration', () => {
        const rows = insulinSettingsTable.querySelectorAll('tr');
        expect(rows[2].textContent).contains('Duration of Insulin Action');
        assert.equal(omnipodMultiRateData.bolus.calculator.insulin.duration, 245);
        expect(rows[2].textContent).contains('4:05 hrs');
      });
    });
  });

  describe('CareLink/Medtronic', () => {
    it('should have a header', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'carelink'}
          openedSections={{}}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="Header"]')).to.have.length(1);
    });

    it('should have Medtronic as the Header deviceDisplayName', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'carelink'}
          openedSections={{}}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelector('[data-testid="Header"]').getAttribute('data-device-display-name')).to.equal('Medtronic');
    });

    // these tables are the insulin settings, bolus settings + basal schedules
    it('should have seven Tables', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'carelink'}
          openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('table')).to.have.length(7);
    });

    // these containers are the basal schedules
    it('should have three CollapsibleContainers', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'carelink'}
          openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="CollapsibleContainer"]')).to.have.length(3);
    });

    it('should capitalize all basal schedule names', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'carelink'}
          openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search('Standard') !== -1)))
        .to.be.true;
      expect(labels.some(n => (n.textContent.search('Pattern A') !== -1)))
        .to.be.true;
      expect(labels.some(n => (n.textContent.search('Pattern B') !== -1)))
        .to.be.true;
    });

    it('should have `Active at Upload` text somewhere', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'carelink'}
          openedSections={{}}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search(activeAtUploadText) !== -1)))
        .to.be.true;
    });

    it('should also render w/o error with `medtronic` as the deviceKey', () => {
      const originalConsoleError = console.error;
      console.error = sinon.spy();
      expect(console.error.callCount).to.equal(0);
      rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'medtronic'}
          openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(console.error.callCount).to.equal(0);
      console.error = originalConsoleError;
    });

    it('should have a button to copy settings', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'carelink'}
          openedSections={{}}
          pumpSettings={medtronicMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const clipBoardButton = container.querySelector('[data-testid="ClipboardButton"]');
      expect(copySettingsClicked.callCount).to.equal(0);
      fireEvent.click(clipBoardButton);
      expect(copySettingsClicked.callCount).to.equal(1);
    });

    describe('automated basal', () => {
      it('should display the automated basal heading when active at upload', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MGDL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'medtronic'}
            openedSections={{}}
            pumpSettings={medtronicAutomatedData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );

        const autoBasalHeading = container.querySelectorAll(
          formatClassesAsSelector(styles.automatedBasalHeaderBackground)
        );

        expect(autoBasalHeading.length).to.equal(1);
        expect(autoBasalHeading[0].textContent).contains('Auto Mode');
        expect(autoBasalHeading[0].textContent).contains('active at upload');
      });

      it('should display the automated basal heading when and deviceKey is carelink', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MGDL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'carelink'}
            openedSections={{}}
            pumpSettings={medtronicAutomatedData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );

        const autoBasalHeading = container.querySelectorAll(
          formatClassesAsSelector(styles.automatedBasalHeaderBackground)
        );

        expect(autoBasalHeading.length).to.equal(1);
        expect(autoBasalHeading[0].textContent).contains('Auto Mode');
        expect(autoBasalHeading[0].textContent).contains('active at upload');
      });

      it('should not display the automated basal heading when inactive at upload', () => {
        const nonActiveMedtronicAutomatedData = _.assign({}, medtronicAutomatedData, {
          activeSchedule: 'Standard',
        });

        const { container } = rtlRender(
          <NonTandem
            bgUnits={MGDL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'medtronic'}
            openedSections={{}}
            pumpSettings={nonActiveMedtronicAutomatedData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );

        const autoBasalHeading = container.querySelectorAll(formatClassesAsSelector(
          styles.automatedBasalHeaderBackground)
        );

        expect(autoBasalHeading.length).to.equal(0);
      });
    });

    describe('bolus settings', () => {
      it('should surface the expected value for Sensitivity', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'medtronic'}
            openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
            pumpSettings={medtronicMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const isfTable = tables.filter(n => (n.textContent.search('Sensitivity') !== -1));
        expect(isfTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(medtronicMultiRateData.insulinSensitivity[0].amount, 1)
          ) !== -1)
        )).to.be.true;
      });

      it('should surface the expected low & high values for BG Target', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'medtronic'}
            openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
            pumpSettings={medtronicMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const bgTargetTable = tables.filter(n => (n.textContent.search('BG Target') !== -1));

        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(medtronicMultiRateData.bgTarget[0].low, 1))
          ) !== -1)
        ).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(medtronicMultiRateData.bgTarget[0].high, 1))
          ) !== -1)
        ).to.be.true;

        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(medtronicMultiRateData.bgTarget[1].low, 1))
          ) !== -1)
        ).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(medtronicMultiRateData.bgTarget[1].high, 1))
          ) !== -1)
        ).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(medtronicMultiRateData.bgTarget[2].low, 1))
          ) !== -1)
        ).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(medtronicMultiRateData.bgTarget[2].high, 1))
          ) !== -1)
        ).to.be.true;
      });

      it('should surface the expected values for Carb Ratios', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'medtronic'}
            openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
            pumpSettings={medtronicMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const carbRatioTable = tables.filter(n => (n.textContent.search('Carb Ratios') !== -1));


        expect(carbRatioTable.some(
          n => (n.textContent.search(medtronicMultiRateData.carbRatio[0].amount) !== -1)
        )).to.be.true;
        expect(carbRatioTable.some(
          n => (n.textContent.search(medtronicMultiRateData.carbRatio[1].amount) !== -1)
        )).to.be.true;
        expect(carbRatioTable.some(
          n => (n.textContent.search(medtronicMultiRateData.carbRatio[2].amount) !== -1)
        )).to.be.true;
        expect(carbRatioTable.some(
          n => (n.textContent.search(medtronicMultiRateData.carbRatio[3].amount) !== -1)
        )).to.be.true;
      });
    });

    describe('insulin settings', () => {
      let insulinSettingsTable;

      beforeEach(() => {
        const rendered = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'medtronic'}
            openedSections={{ [medtronicMultiRateData.activeSchedule]: true }}
            pumpSettings={medtronicMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );

        insulinSettingsTable = Array.from(rendered.container.querySelectorAll('table')).find(
          n => (n.textContent.search('Insulin Settings') !== -1)
        );
      });

      afterEach(() => {
        cleanup();
      });

      it('should surface the expected value for max basal', () => {
        const rows = insulinSettingsTable.querySelectorAll('tr');
        expect(rows[0].textContent).contains('Max Basal');
        expect(rows[0].textContent).contains(medtronicMultiRateData.basal.rateMaximum.value);
      });

      it('should surface the expected value for max bolus', () => {
        const rows = insulinSettingsTable.querySelectorAll('tr');
        expect(rows[1].textContent).contains('Max Bolus');
        expect(rows[1].textContent).contains(medtronicMultiRateData.bolus.amountMaximum.value);
      });

      it('should surface the expected value for insulin duration', () => {
        const rows = insulinSettingsTable.querySelectorAll('tr');
        expect(rows[2].textContent).contains('Active Insulin Time');
        expect(rows[2].textContent).contains(medtronicMultiRateData.bolus.calculator.insulin.duration);
      });
    });
  });

  describe('Equil', () => {
    it('should have a header', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'microtech'}
          openedSections={{ [equilMultiRateData.activeSchedule]: true }}
          pumpSettings={equilMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="Header"]')).to.have.length(1);
    });

    it('should have Equil as the Header deviceDisplayName', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'microtech'}
          openedSections={{ [equilMultiRateData.activeSchedule]: true }}
          pumpSettings={equilMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelector('[data-testid="Header"]').getAttribute('data-device-display-name')).to.equal('Equil');
    });

    // these tables are the bolus settings + basal schedules
    it('should have six Tables', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'microtech'}
          openedSections={{ [equilMultiRateData.activeSchedule]: true }}
          pumpSettings={equilMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('table')).to.have.length(6);
    });

    // these containers are the basal schedules
    it('should have three CollapsibleContainers', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'microtech'}
          openedSections={{ [equilMultiRateData.activeSchedule]: true }}
          pumpSettings={equilMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      expect(container.querySelectorAll('[data-testid="CollapsibleContainer"]')).to.have.length(3);
    });

    it('should preserve user capitalization of schedule name', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'microtech'}
          openedSections={{ [equilFlatRateData.activeSchedule]: true }}
          pumpSettings={equilFlatRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search('Program 2') !== -1)))
        .to.be.true;
    });

    it('should have `Active at Upload` text somewhere', () => {
      const { container } = rtlRender(
        <NonTandem
          bgUnits={MGDL_UNITS}
          copySettingsClicked={copySettingsClicked}
          deviceKey={'microtech'}
          openedSections={{ [equilMultiRateData.activeSchedule]: true }}
          pumpSettings={equilMultiRateData}
          timePrefs={timePrefs}
          user={user}
          toggleBasalScheduleExpansion={() => {}}
        />
      );
      const labels = Array.from(container.querySelectorAll('.label'));
      expect(labels.some(n => (n.textContent.search(activeAtUploadText) !== -1)))
        .to.be.true;
    });

    describe('bolus settings', () => {
      it('should surface the expected value for Insulin Sensitivity', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'microtech'}
            openedSections={{ [equilMultiRateData.activeSchedule]: true }}
            pumpSettings={equilMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const isfTable = tables.filter(n => (n.textContent.search('Insulin Sensitivity') !== -1));
        expect(isfTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(equilMultiRateData.insulinSensitivity[0].amount, 1)
          ) !== -1)
        )).to.be.true;
      });

      it('should surface the expected lower & upper values for Target BG', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'microtech'}
            openedSections={{ [equilMultiRateData.activeSchedule]: true }}
            pumpSettings={equilMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const bgTargetTable = tables.filter(n => (n.textContent.search('Target BG') !== -1));

        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(equilMultiRateData.bgTarget[0].low, 1)
          ) !== -1)
        )).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(equilMultiRateData.bgTarget[0].high, 1)
          ) !== -1)
        )).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(equilMultiRateData.bgTarget[1].low, 1)
          ) !== -1)
        )).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(equilMultiRateData.bgTarget[1].high, 1)
          ) !== -1)
        )).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(equilMultiRateData.bgTarget[2].low, 1)
          ) !== -1)
        )).to.be.true;
        expect(bgTargetTable.some(
          n => (n.textContent.search(
            formatDecimalNumber(equilMultiRateData.bgTarget[2].high, 1)
          ) !== -1)
        )).to.be.true;
      });

      it('should surface the expected value for carb ratio', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'microtech'}
            openedSections={{ [equilMultiRateData.activeSchedule]: true }}
            pumpSettings={equilMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const tables = Array.from(container.querySelectorAll('table'));
        const carbRatioTable = tables.filter(n => (n.textContent.search('Carbohydrate Ratio') !== -1));
        expect(carbRatioTable.some(
          n => (n.textContent.search(equilMultiRateData.carbRatio[0].amount) !== -1)
        )).to.be.true;
        expect(carbRatioTable.some(
          n => (n.textContent.search(equilMultiRateData.carbRatio[1].amount) !== -1)
        )).to.be.true;
      });

      it('should have a button to copy settings', () => {
        const { container } = rtlRender(
          <NonTandem
            bgUnits={MMOLL_UNITS}
            copySettingsClicked={copySettingsClicked}
            deviceKey={'microtech'}
            openedSections={{ [equilMultiRateData.activeSchedule]: true }}
            pumpSettings={equilMultiRateData}
            timePrefs={timePrefs}
            user={user}
            toggleBasalScheduleExpansion={() => {}}
          />
        );
        const clipBoardButton = container.querySelector('[data-testid="ClipboardButton"]');
        expect(copySettingsClicked.callCount).to.equal(0);
        fireEvent.click(clipBoardButton);
        expect(copySettingsClicked.callCount).to.equal(1);
      });
    });
  });
});
