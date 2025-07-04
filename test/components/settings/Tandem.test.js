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
import { mount, shallow } from 'enzyme';

import CollapsibleContainer from '../../../src/components/settings/common/CollapsibleContainer';
import Tandem from '../../../src/components/settings/Tandem';
import styles from '../../../src/components/settings/Tandem.css';
import { formatClassesAsSelector } from '../../helpers/cssmodules';
import { MGDL_UNITS, MMOLL_UNITS } from '../../../src/utils/constants';
import { formatDecimalNumber } from '../../../src/utils/format';


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
let wrapper;
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

    wrapper = shallow(
      <Tandem {...props} />
    );
  });

  afterEach(() => {
    copySettingsClicked.resetHistory();
  });

  it('should render without problems when required props provided', () => {
    console.error = sinon.spy();
    expect(console.error.callCount).to.equal(0);
    wrapper = shallow(
      <Tandem {...props} />
    );
    expect(console.error.callCount).to.equal(0);
  });

  it('should have a header', () => {
    expect(wrapper.find('Header')).to.have.length(1);
  });

  it('should have Tandem as the Header deviceDisplayName', () => {
    expect(wrapper.find('Header').props().deviceDisplayName).to.equal('Tandem');
  });

  it('should have six Tables - a profile and an insulin settings table for each profile', () => {
    expect(wrapper.find('Table')).to.have.length(6);
  });

  it('should have three CollapsibleContainers', () => {
    expect(wrapper.find(CollapsibleContainer)).to.have.length(3);
  });

  it('should preserve user capitalization of profile names', () => {
    // must use mount to search far enough down in tree!
    props.pumpSettings = flatrateData;
    props.openedSections = { [flatrateData.activeSchedule]: true };
    const mounted = mount(
      <Tandem {...props} />
    );
    expect(mounted.find('.label').someWhere(n => (n.text().search('Normal') !== -1)))
      .to.be.true;
    expect(mounted.find('.label').someWhere(n => (n.text().search('sick') !== -1)))
      .to.be.true;
  });

  it('should have `Active at Upload` text somewhere', () => {
    const mounted = mount(
      <Tandem {...props} />
    );
    expect(mounted.find('.label').someWhere(n => (n.text().search('Active at upload') !== -1)))
      .to.be.true;
  });

  it('should have a button to copy settings', () => {
    const mounted = mount(<Tandem {...props} />);
    const clipBoardButton = mounted.find('ClipboardButton').at(0);
    expect(copySettingsClicked.callCount).to.equal(0);
    clipBoardButton.prop('onSuccess')();
    expect(copySettingsClicked.callCount).to.equal(1);
  });

  describe('timed settings', () => {
    let mounted;
    let sickProfileTable;

    before(() => {
      props.pumpSettings = flatrateData;
      props.bgUnits = MMOLL_UNITS;
      props.openedSections = { [flatrateData.activeSchedule]: true };
      mounted = mount(
        <Tandem {...props} />
      );

      sickProfileTable = mounted.find('table').filterWhere(
        n => (n.text().search('Basal Rates') !== -1)
      );
    });

    it('should surface the expected basal rate value', () => {
      expect(sickProfileTable.someWhere(
        n => (n.text().search(formatDecimalNumber(flatrateData.basalSchedules[1].value[0].rate, 1)))
      )).to.be.true;
    });

    it('should surface the expected target BG value', () => {
      expect(sickProfileTable.someWhere(
        n => (n.text().search(formatDecimalNumber(flatrateData.bgTargets.sick[0].target, 1)))
      )).to.be.true;
    });

    it('should surface the expected carb ratio value', () => {
      expect(sickProfileTable.someWhere(
        n => (n.text().search(formatDecimalNumber(flatrateData.carbRatios.sick[0].target, 1)))
      )).to.be.true;
    });

    it('should surface the expected correction factor value', () => {
      expect(sickProfileTable.someWhere(
        n => (n.text().search(
          formatDecimalNumber(flatrateData.insulinSensitivities.sick[0].target, 1),
        ))
      )).to.be.true;
    });
  });

  describe('insulin settings', () => {
    let mounted;
    let insulinSettingsTable;

    before(() => {
      props.pumpSettings = flatrateData;
      props.bgUnits = MMOLL_UNITS;
      props.openedSections = { [flatrateData.activeSchedule]: true };
      mounted = mount(
        <Tandem {...props} />
      );

      insulinSettingsTable = mounted.find('table').filterWhere(
        n => (n.text().search('Insulin Settings') !== -1)
      );
    });

    it('should surface the expected value for max bolus', () => {
      expect(insulinSettingsTable.find('tr').at(0).text()).contains('Max Bolus');
      expect(insulinSettingsTable.find('tr').at(0).text()).contains(flatrateData.bolus[flatrateData.activeSchedule].amountMaximum.value);
    });

    it('should surface the expected value for insulin duration', () => {
      expect(insulinSettingsTable.find('tr').at(1).text()).contains('Insulin Duration');
      assert.equal(flatrateData.bolus[flatrateData.activeSchedule].calculator.insulin.duration, 245);
      expect(insulinSettingsTable.find('tr').at(1).text()).contains('4:05 hrs');
    });
  });

  describe('Tandem C-IQ annotation', () => {
    let mounted;

    before(() => {
      props.pumpSettings = { ...flatrateData, deviceId: 'tandemCIQ123' };
      props.bgUnits = MMOLL_UNITS;
      props.openedSections = { [flatrateData.activeSchedule]: true };
      mounted = mount(
        <Tandem {...props} />
      );
    });

    it('should render an annotation', () => {
      const annotation = mounted.find(formatClassesAsSelector(styles.annotations)).hostNodes().at(0);
      expect(annotation.text()).contains('Tandem\'s Control-IQ Technology uses its own preset');
    });
  });
});
