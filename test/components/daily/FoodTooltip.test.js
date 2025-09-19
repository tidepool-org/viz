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

import React from 'react';
import moment from 'moment';
import { mount } from 'enzyme';

import { formatClassesAsSelector } from '../../helpers/cssmodules';

import FoodTooltip, { getCarbs, getAbsorptionTime, getName } from '../../../src/components/daily/foodtooltip/FoodTooltip';
import styles from '../../../src/components/daily/foodtooltip/FoodTooltip.css';

const normal = {
  type: 'food',
  nutrition: {
    carbohydrate: {
      net: 5,
      units: 'grams',
    },
  },
};

const large = {
  type: 'food',
  nutrition: {
    carbohydrate: {
      net: 200,
      units: 'grams',
    },
  },
};

const roundToInt = {
  type: 'food',
  nutrition: {
    carbohydrate: {
      net: 15.04,
      units: 'grams',
    },
  },
};

const roundTo1DecimalPlace = {
  type: 'food',
  nutrition: {
    carbohydrate: {
      net: 15.05,
      units: 'grams',
    },
  },
};

const nonCarb = {
  type: 'food',
  nutrition: {
    fat: {
      total: 10,
      units: 'grams',
    },
  },
};

const loop = {
  ...normal,
  origin: { name: 'com.loopkit.Loop' },
  name: 'myfood',
  nutrition: {
    ...normal.nutrition,
    estimatedAbsorptionDuration: 10800,
  },
};

const loopTimeOfEntry = {
  ...loop,
  payload: {
    userCreatedDate: '2024-02-02T14:00:00.000Z',
  },
  normalTime: '2024-02-02T01:00:00.000Z',
};

const loopEdited = {
  ...loop,
  payload: {
    userUpdatedDate: '2024-02-02T03:00:00.000Z',
  },
  normalTime: '2024-02-02T02:00:00.000Z',
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
};

describe('FoodTooltip', () => {
  it('should render without issue when all properties provided', () => {
    const wrapper = mount(<FoodTooltip {...props} food={normal} />);
    expect(wrapper.find(formatClassesAsSelector(styles.carb))).to.have.length(1);
  });

  describe('getCarbs', () => {
    // eslint-disable-next-line max-len
    const carbValue = `${formatClassesAsSelector(styles.carb)} ${formatClassesAsSelector(styles.value)}`;
    it('should return 5 for a 5 gram net food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={normal} />);
      expect(getCarbs(normal)).to.equal(5);
      expect(wrapper.find(carbValue).text()).to.equal('5');
    });
    it('should return 200 for a 200 gram net food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={large} />);
      expect(getCarbs(large)).to.equal(200);
      expect(wrapper.find(carbValue).text()).to.equal('200');
    });
    it('should return 15 for a 15.04 gram net food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={roundToInt} />);
      expect(getCarbs(roundToInt)).to.equal(15);
      expect(wrapper.find(carbValue).text()).to.equal('15');
    });
    it('should return 15.1 for a 15.05 gram net food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={roundTo1DecimalPlace} />);
      expect(getCarbs(roundTo1DecimalPlace)).to.equal(15.1);
      expect(wrapper.find(carbValue).text()).to.equal('15.1');
    });
    it('should return 0 for a non-carbohydrate food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={nonCarb} />);
      expect(getCarbs(nonCarb)).to.equal(0);
      expect(wrapper.find(carbValue).text()).to.equal('0');
    });
  });

  describe('getName', () => {
    // eslint-disable-next-line max-len
    const rowValue = `${formatClassesAsSelector(styles.row)} ${formatClassesAsSelector(styles.value)}`;
    it('should include the food name for a Loop food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loop} />);
      expect(getName(loop)).to.equal('myfood');
      expect(wrapper.find(rowValue).at(0).text()).to.contain('myfood');
    });
  });

  describe('getAbsorptionTime', () => {
    // eslint-disable-next-line max-len
    const rowValue = `${formatClassesAsSelector(styles.row)} ${formatClassesAsSelector(styles.value)}`;
    it('should include the absorption time for a Loop food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loop} />);
      expect(getAbsorptionTime(loop)).to.equal(3);
      expect(wrapper.find(rowValue).at(1).text()).to.contain('3');
    });
  });

  describe('edited', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    const rowUnits = formatClassesAsSelector(styles.units);
    it('should include the edited time for an edited Loop food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopEdited} />);
      expect(wrapper.find(row).at(3).find(rowLabel).text()).to.contain('Last Edited');
      expect(wrapper.find(row).at(3).find(rowValue).text()).to.contain('3:00');
      expect(wrapper.find(row).at(3).find(rowUnits).text()).to.contain('am');
    });
  });

  describe('different time of entry', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    const rowUnits = formatClassesAsSelector(styles.units);
    // eslint-disable-next-line max-len
    it('should include the time of entry for a Loop food value that was given a different time of entry', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopTimeOfEntry} />);
      expect(wrapper.find(row).at(3).find(rowLabel).text()).to.contain('Time of Entry');
      expect(wrapper.find(row).at(3).find(rowValue).text()).to.contain('2:00');
      expect(wrapper.find(row).at(3).find(rowUnits).text()).to.contain('pm');
    });
  });
});
