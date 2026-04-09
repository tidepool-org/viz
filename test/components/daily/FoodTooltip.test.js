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
import _ from 'lodash';
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

// tags.entryTimeDiffers set by DataUtil.tagDatum; set directly here since tests bypass DataUtil
const loopWithDosingDecision = {
  ...loop,
  tags: { ...loop.tags, entryTimeDiffers: true },
  dosingDecision: {
    time: Date.parse('2024-02-02T17:00:00.000Z'), // 5:00 pm UTC
    food: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 5 } } },
  },
};

const loopWithDosingDecisionWithinThreshold = {
  ...loop,
  tags: { ...loop.tags, entryTimeDiffers: false },
  dosingDecision: {
    time: Date.parse('2024-02-02T18:02:00.000Z'), // 6:02 pm UTC
    food: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 5 } } },
  },
};

// tags.carbsEdited set by DataUtil.tagDatum; set directly here since tests bypass DataUtil
const loopWithEditedCarbs = {
  ...loop,
  tags: { ...loop.tags, carbsEdited: true, entryTimeDiffers: false },
  nutrition: {
    ...loop.nutrition,
    carbohydrate: { net: 10, units: 'grams' },
  },
  dosingDecision: {
    time: Date.parse('2024-02-02T17:00:00.000Z'),
    food: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 10 } } },
    originalFood: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 5 } } },
  },
};

const loopWithMultipleDosingDecisions = {
  ...loop,
  tags: { ...loop.tags, carbsEdited: true, entryTimeDiffers: true },
  nutrition: {
    ...loop.nutrition,
    carbohydrate: { net: 80, units: 'grams' },
  },
  originalDosingDecision: {
    time: Date.parse('2024-02-02T18:00:00.000Z'), // Time Entered (6:00 pm UTC)
    food: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 40 } } },
  },
  dosingDecision: {
    time: Date.parse('2024-02-02T19:00:00.000Z'), // Time Last Edited (7:00 pm UTC)
    food: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 80 } } },
    originalFood: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 40 } } },
  },
};

const manual = {
  ...normal,
  tags: { dexcom: true, manual: true },
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

  describe('dosingDecision-based time/edit display', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    const rowUnits = formatClassesAsSelector(styles.units);
    const carbLabel = `${formatClassesAsSelector(styles.carb)} ${formatClassesAsSelector(styles.label)}`;

    it('should show "Total Carbs" label for Loop food with dosingDecision', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopWithDosingDecision} />);
      expect(wrapper.find(carbLabel).text()).to.contain('Total Carbs');
    });

    it('should show "Time Entered" when dosingDecision time differs from normalTime by >5min', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopWithDosingDecision} />);
      const timeRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Time Entered'));
      expect(timeRow).to.have.length(1);
      expect(timeRow.find(rowValue).text()).to.contain('5:00');
      expect(timeRow.find(rowUnits).text()).to.contain('pm');
    });

    it('should not show "Time Entered" when dosingDecision time is within 5min of normalTime', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopWithDosingDecisionWithinThreshold} />);
      const timeRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Time Entered'));
      expect(timeRow).to.have.length(0);
    });

    it('should show "Total Carbs (Edited)" label when originalFood differs from current carbs', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopWithEditedCarbs} />);
      expect(wrapper.find(carbLabel).text()).to.contain('Total Carbs (Edited)');
    });

    it('should show "Initial Carb Amount" with the original carb value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopWithEditedCarbs} />);
      const initialCarbRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Initial Carb Amount'));
      expect(initialCarbRow).to.have.length(1);
      expect(initialCarbRow.find(rowValue).text()).to.equal('5');
    });

    it('should show "Time Edited" for single dosingDecision with originalFood', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopWithEditedCarbs} />);
      const timeRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Time Edited'));
      expect(timeRow).to.have.length(1);
      expect(timeRow.find(rowValue).text()).to.contain('5:00');
      expect(timeRow.find(rowUnits).text()).to.contain('pm');
    });

    it('should show "Time Entered" and "Time Last Edited" for multiple dosingDecisions', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loopWithMultipleDosingDecisions} />);
      const timeEnteredRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Time Entered'));
      const timeLastEditedRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Time Last Edited'));
      expect(timeEnteredRow).to.have.length(1);
      expect(timeLastEditedRow).to.have.length(1);
    });

    it('should not show time/edit rows when dosingDecisions are absent', () => {
      const wrapper = mount(<FoodTooltip {...props} food={loop} />);
      const timeEnteredRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Time Entered'));
      const timeEditedRow = wrapper.find(row).filterWhere(n => _.includes(n.find(rowLabel).text(), 'Time Edited'));
      expect(timeEnteredRow).to.have.length(0);
      expect(timeEditedRow).to.have.length(0);
    });
  });

  describe('manual source', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    it('should include the manual source for a manual food value', () => {
      const wrapper = mount(<FoodTooltip {...props} food={manual} />);
      expect(wrapper.find(row).at(1).find(rowLabel).text()).to.contain('Source');
      expect(wrapper.find(row).at(1).find(rowValue).text()).to.contain('Manual');
    });
  });
});
