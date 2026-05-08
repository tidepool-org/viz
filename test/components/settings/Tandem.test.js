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
import { render as rtlRender, cleanup, fireEvent } from '@testing-library/react/pure';

import Tandem from '../../../src/components/settings/Tandem';
import styles from '../../../src/components/settings/Tandem.css';
import { formatClassesAsSelector } from '../../helpers/cssmodules';
import { MGDL_UNITS, MMOLL_UNITS } from '../../../src/utils/constants';
import { formatDecimalNumber } from '../../../src/utils/format';

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


const flatrateData = require('../../../data/pumpSettings/tandem/flatrate.json');
const multirateData = require('../../../data/pumpSettings/tandem/multirate.json');

const timePrefs = { timezoneAware: false, timezoneName: null };
const copySettingsClicked = sinon.spy();
const user = {
  profile: {
    fullName: 'Mary Smith',
    patient: {
      diagnosisDate: '1990-01-31',
      birthday: '1983-01-31',
    },
  },
};
let container;
let props;

describe('Tandem', () => {
  beforeEach(() => {
    props = {
      bgUnits: MGDL_UNITS,
      copySettingsClicked,
      openedSections: { [multirateData.activeSchedule]: true },
      pumpSettings: multirateData,
      timePrefs,
      user,
      toggleProfileExpansion: () => {},
    };

    const rendered = rtlRender(
      <Tandem {...props} />
    );
    container = rendered.container;
  });

  afterEach(() => {
    copySettingsClicked.resetHistory();
    cleanup();
  });

  it('should render without problems when required props provided', () => {
    const originalConsoleError = console.error;
    console.error = sinon.spy();
    expect(console.error.callCount).to.equal(0);
    cleanup();
    rtlRender(
      <Tandem {...props} />
    );
    expect(console.error.callCount).to.equal(0);
    console.error = originalConsoleError;
  });

  it('should have a header', () => {
    expect(container.querySelectorAll('[data-testid="Header"]')).to.have.length(1);
  });

  it('should have Tandem as the Header deviceDisplayName', () => {
    expect(container.querySelector('[data-testid="Header"]').getAttribute('data-device-display-name')).to.equal('Tandem');
  });

  it('should have six Tables - a profile and an insulin settings table for each profile', () => {
    expect(container.querySelectorAll('table')).to.have.length(6);
  });

  it('should have three CollapsibleContainers', () => {
    expect(container.querySelectorAll('[data-testid="CollapsibleContainer"]')).to.have.length(3);
  });

  it('should preserve user capitalization of profile names', () => {
    // must use full render to search far enough down in tree!
    cleanup();
    props.pumpSettings = flatrateData;
    props.openedSections = { [flatrateData.activeSchedule]: true };
    const { container: c } = rtlRender(
      <Tandem {...props} />
    );
    const labels = Array.from(c.querySelectorAll('.label'));
    expect(labels.some(n => (n.textContent.search('Normal') !== -1)))
      .to.be.true;
    expect(labels.some(n => (n.textContent.search('sick') !== -1)))
      .to.be.true;
  });

  it('should have `Active at Upload` text somewhere', () => {
    const labels = Array.from(container.querySelectorAll('.label'));
    expect(labels.some(n => (n.textContent.search('Active at upload') !== -1)))
      .to.be.true;
  });

  it('should have a button to copy settings', () => {
    const clipBoardButton = container.querySelector('[data-testid="ClipboardButton"]');
    expect(copySettingsClicked.callCount).to.equal(0);
    fireEvent.click(clipBoardButton);
    expect(copySettingsClicked.callCount).to.equal(1);
  });

  describe('timed settings', () => {
    let timedContainer;
    let sickProfileTable;

    beforeAll(() => {
      props.pumpSettings = flatrateData;
      props.bgUnits = MMOLL_UNITS;
      props.openedSections = { [flatrateData.activeSchedule]: true };
      const rendered = rtlRender(
        <Tandem {...props} />
      );
      timedContainer = rendered.container;

      sickProfileTable = Array.from(timedContainer.querySelectorAll('table')).filter(
        n => (n.textContent.search('Basal Rates') !== -1)
      );
    });

    afterAll(() => {
      cleanup();
    });

    it('should surface the expected basal rate value', () => {
      expect(sickProfileTable.some(
        n => (n.textContent.search(formatDecimalNumber(flatrateData.basalSchedules[1].value[0].rate, 1)))
      )).to.be.true;
    });

    it('should surface the expected target BG value', () => {
      expect(sickProfileTable.some(
        n => (n.textContent.search(formatDecimalNumber(flatrateData.bgTargets.sick[0].target, 1)))
      )).to.be.true;
    });

    it('should surface the expected carb ratio value', () => {
      expect(sickProfileTable.some(
        n => (n.textContent.search(formatDecimalNumber(flatrateData.carbRatios.sick[0].target, 1)))
      )).to.be.true;
    });

    it('should surface the expected correction factor value', () => {
      expect(sickProfileTable.some(
        n => (n.textContent.search(
          formatDecimalNumber(flatrateData.insulinSensitivities.sick[0].target, 1),
        ))
      )).to.be.true;
    });
  });

  describe('insulin settings', () => {
    let insulinSettingsTable;

    beforeAll(() => {
      props.pumpSettings = flatrateData;
      props.bgUnits = MMOLL_UNITS;
      props.openedSections = { [flatrateData.activeSchedule]: true };
      const rendered = rtlRender(
        <Tandem {...props} />
      );

      insulinSettingsTable = Array.from(rendered.container.querySelectorAll('table')).find(
        n => (n.textContent.search('Insulin Settings') !== -1)
      );
    });

    afterAll(() => {
      cleanup();
    });

    it('should surface the expected value for max bolus', () => {
      const rows = insulinSettingsTable.querySelectorAll('tr');
      expect(rows[0].textContent).contains('Max Bolus');
      expect(rows[0].textContent).contains(flatrateData.bolus[flatrateData.activeSchedule].amountMaximum.value);
    });

    it('should surface the expected value for insulin duration', () => {
      const rows = insulinSettingsTable.querySelectorAll('tr');
      expect(rows[1].textContent).contains('Insulin Duration');
      assert.equal(flatrateData.bolus[flatrateData.activeSchedule].calculator.insulin.duration, 245);
      expect(rows[1].textContent).contains('4:05 hrs');
    });
  });

  describe('Tandem C-IQ annotation', () => {
    let ciqContainer;

    beforeAll(() => {
      props.pumpSettings = { ...flatrateData, deviceId: 'tandemCIQ123' };
      props.bgUnits = MMOLL_UNITS;
      props.openedSections = { [flatrateData.activeSchedule]: true };
      const rendered = rtlRender(
        <Tandem {...props} />
      );
      ciqContainer = rendered.container;
    });

    afterAll(() => {
      cleanup();
    });

    it('should render an annotation', () => {
      const annotation = ciqContainer.querySelector(formatClassesAsSelector(styles.annotations));
      expect(annotation.textContent).contains('Tandem\'s Control-IQ Technology uses its own preset');
    });
  });
});
