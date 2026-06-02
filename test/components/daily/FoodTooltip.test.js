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
import { render } from '@testing-library/react/pure';

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
    time: Date.parse('2024-02-02T19:00:00.000Z'), // Time Edited (7:00 pm UTC)
    food: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 80 } } },
    originalFood: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 40 } } },
  },
};

// No name/absorption so row[0]=Initial Carb Amount, row[1]=Time Entered, row[2]=Time Edited
const loopEdited = {
  type: 'food',
  origin: { name: 'com.loopkit.Loop' },
  nutrition: {
    carbohydrate: { net: 10, units: 'grams' },
  },
  tags: { carbsEdited: true, entryTimeDiffers: true },
  originalDosingDecision: {
    time: Date.parse('2024-02-02T01:00:00.000Z'), // 1:00 am UTC
    food: { time: '2024-02-02T00:00:00.000Z', nutrition: { carbohydrate: { net: 5 } } },
  },
  dosingDecision: {
    time: Date.parse('2024-02-02T03:00:00.000Z'), // 3:00 am UTC
    food: { time: '2024-02-02T00:00:00.000Z', nutrition: { carbohydrate: { net: 10 } } },
    originalFood: { time: '2024-02-02T00:00:00.000Z', nutrition: { carbohydrate: { net: 5 } } },
  },
};

// Has name+absorption so row[0]=Type, row[1]=Absorption Time, row[2]=Time Entered
const loopTimeOfEntry = {
  ...loop,
  tags: { entryTimeDiffers: true },
  dosingDecision: {
    time: Date.parse('2024-02-02T14:00:00.000Z'), // 2:00 pm UTC
    food: { time: '2024-02-02T14:00:00.000Z', nutrition: { carbohydrate: { net: 5 } } },
  },
};

const manual = {
  ...normal,
  tags: { dexcom: true, manual: true },
};

const trio = {
  ...normal,
  tags: { trio: true },
  name: 'triofood',
  nutrition: {
    ...normal.nutrition,
    estimatedAbsorptionDuration: 10800,
  },
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
};

describe('FoodTooltip', () => {
  it('should render without issue when all properties provided', () => {
    const { container } = render(<FoodTooltip {...props} food={normal} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.carb))).to.have.length(1);
  });

  describe('getCarbs', () => {
    // eslint-disable-next-line max-len
    const carbValue = `${formatClassesAsSelector(styles.carb)} ${formatClassesAsSelector(styles.value)}`;
    it('should return 5 for a 5 gram net food value', () => {
      const { container } = render(<FoodTooltip {...props} food={normal} />);
      expect(getCarbs(normal)).to.equal(5);
      expect(container.querySelector(carbValue).textContent).to.equal('5');
    });
    it('should return 200 for a 200 gram net food value', () => {
      const { container } = render(<FoodTooltip {...props} food={large} />);
      expect(getCarbs(large)).to.equal(200);
      expect(container.querySelector(carbValue).textContent).to.equal('200');
    });
    it('should return 15 for a 15.04 gram net food value', () => {
      const { container } = render(<FoodTooltip {...props} food={roundToInt} />);
      expect(getCarbs(roundToInt)).to.equal(15);
      expect(container.querySelector(carbValue).textContent).to.equal('15');
    });
    it('should return 15.1 for a 15.05 gram net food value', () => {
      const { container } = render(<FoodTooltip {...props} food={roundTo1DecimalPlace} />);
      expect(getCarbs(roundTo1DecimalPlace)).to.equal(15.1);
      expect(container.querySelector(carbValue).textContent).to.equal('15.1');
    });
    it('should return 0 for a non-carbohydrate food value', () => {
      const { container } = render(<FoodTooltip {...props} food={nonCarb} />);
      expect(getCarbs(nonCarb)).to.equal(0);
      expect(container.querySelector(carbValue).textContent).to.equal('0');
    });
  });

  describe('getName', () => {
    // eslint-disable-next-line max-len
    const rowValue = `${formatClassesAsSelector(styles.row)} ${formatClassesAsSelector(styles.value)}`;
    it('should include the food name for a Loop food value', () => {
      const { container } = render(<FoodTooltip {...props} food={loop} />);
      expect(getName(loop)).to.equal('myfood');
      expect(container.querySelectorAll(rowValue)[0].textContent).to.contain('myfood');
    });
  });

  describe('getAbsorptionTime', () => {
    // eslint-disable-next-line max-len
    const rowValue = `${formatClassesAsSelector(styles.row)} ${formatClassesAsSelector(styles.value)}`;
    it('should include the absorption time for a Loop food value', () => {
      const { container } = render(<FoodTooltip {...props} food={loop} />);
      expect(getAbsorptionTime(loop)).to.equal(3);
      expect(container.querySelectorAll(rowValue)[1].textContent).to.contain('3');
    });
  });

  describe('dosingDecision-based time/edit display', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    const rowUnits = formatClassesAsSelector(styles.units);
    const carbLabel = `${formatClassesAsSelector(styles.carb)} ${formatClassesAsSelector(styles.label)}`;

    it('should show "Total Carbs" label for Loop food with dosingDecision', () => {
      const { container } = render(<FoodTooltip {...props} food={loopWithDosingDecision} />);
      expect(container.querySelector(carbLabel).textContent).to.contain('Total Carbs');
    });

    it('should include the edited time for an edited Loop food value', () => {
      const { container } = render(<FoodTooltip {...props} food={loopEdited} />);
      expect(container.querySelectorAll(row)[2].querySelector(rowLabel).textContent).to.contain('Time Edited');
      expect(container.querySelectorAll(row)[2].querySelector(rowValue).textContent).to.contain('3:00');
      expect(container.querySelectorAll(row)[2].querySelector(rowUnits).textContent).to.contain('am');
    });

    it('should show "Time Entered" when dosingDecision time differs from normalTime by >5min', () => {
      const { container } = render(<FoodTooltip {...props} food={loopWithDosingDecision} />);
      const rows = Array.from(container.querySelectorAll(row));
      const timeRow = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Time Entered'));
      expect(timeRow).to.have.length(1);
      expect(timeRow[0].querySelector(rowValue).textContent).to.contain('5:00');
      expect(timeRow[0].querySelector(rowUnits).textContent).to.contain('pm');
    });

    it('should show the original-entry decision time for "Time Entered" on a time-only edit with lineage', () => {
      // Backdate: entered 31g at 4:33pm UTC, edited eat-time later; the heuristic attaches
      // the original-entry decision so "Time Entered" shows 4:33, not the 4:45 edit time.
      const timeEditedWithLineage = {
        ...loop,
        tags: { carbsEdited: false, entryTimeDiffers: true },
        nutrition: { ...loop.nutrition, carbohydrate: { net: 31, units: 'grams' } },
        originalDosingDecision: {
          time: Date.parse('2024-02-02T16:33:00.000Z'), // original entry, 4:33 pm UTC
          food: { time: '2024-02-02T16:33:00.000Z', nutrition: { carbohydrate: { net: 31 } } },
        },
        dosingDecision: {
          time: Date.parse('2024-02-02T16:45:00.000Z'), // edit decision, 4:45 pm UTC
          food: { time: '2024-02-02T16:23:00.000Z', nutrition: { carbohydrate: { net: 31 } } },
        },
      };
      const { container } = render(<FoodTooltip {...props} food={timeEditedWithLineage} />);
      const rows = Array.from(container.querySelectorAll(row));
      const timeRow = rows.filter(n => n.querySelector(rowLabel)?.textContent === 'Time Entered');
      expect(timeRow).to.have.length(1);
      expect(timeRow[0].querySelector(rowValue).textContent).to.contain('4:33'); // original entry, not the 4:45 edit
    });

    it('should not show "Time Entered" when dosingDecision time is within 5min of normalTime', () => {
      const { container } = render(<FoodTooltip {...props} food={loopWithDosingDecisionWithinThreshold} />);
      const rows = Array.from(container.querySelectorAll(row));
      const timeRow = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Time Entered'));
      expect(timeRow).to.have.length(0);
    });

    it('should show "Total Carbs (Edited)" label when originalFood differs from current carbs', () => {
      const { container } = render(<FoodTooltip {...props} food={loopWithEditedCarbs} />);
      expect(container.querySelector(carbLabel).textContent).to.contain('Total Carbs (Edited)');
    });

    it('should show "Initial Carb Amount" with the original carb value', () => {
      const { container } = render(<FoodTooltip {...props} food={loopWithEditedCarbs} />);
      const rows = Array.from(container.querySelectorAll(row));
      const initialCarbRow = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Initial Carb Amount'));
      expect(initialCarbRow).to.have.length(1);
      expect(initialCarbRow[0].querySelector(rowValue).textContent).to.equal('5');
    });

    it('should show "Time Edited" for single dosingDecision with originalFood', () => {
      const { container } = render(<FoodTooltip {...props} food={loopWithEditedCarbs} />);
      const rows = Array.from(container.querySelectorAll(row));
      const timeRow = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Time Edited'));
      expect(timeRow).to.have.length(1);
      expect(timeRow[0].querySelector(rowValue).textContent).to.contain('5:00');
      expect(timeRow[0].querySelector(rowUnits).textContent).to.contain('pm');
    });

    it('should show "Time Entered" and "Time Edited" for multiple dosingDecisions', () => {
      const { container } = render(<FoodTooltip {...props} food={loopWithMultipleDosingDecisions} />);
      const rows = Array.from(container.querySelectorAll(row));
      const timeEnteredRow = rows.filter(n => n.querySelector(rowLabel)?.textContent === 'Time Entered');
      const timeEditedRow = rows.filter(n => n.querySelector(rowLabel)?.textContent === 'Time Edited');
      expect(timeEnteredRow).to.have.length(1);
      expect(timeEditedRow).to.have.length(1);
    });

    it('should not show time/edit rows when dosingDecisions are absent', () => {
      const { container } = render(<FoodTooltip {...props} food={loop} />);
      const rows = Array.from(container.querySelectorAll(row));
      const timeEnteredRow = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Time Entered'));
      const timeEditedRow = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Time Edited'));
      expect(timeEnteredRow).to.have.length(0);
      expect(timeEditedRow).to.have.length(0);
    });
  });

  // Edited-carb food hovers.
  describe('edited-carb chains', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    const carbLabel = `${formatClassesAsSelector(styles.carb)} ${formatClassesAsSelector(styles.label)}`;
    const carbValue = `${formatClassesAsSelector(styles.carb)} ${formatClassesAsSelector(styles.value)}`;

    const fourEditChain = {
      type: 'food',
      origin: { name: 'com.loopkit.Loop' },
      normalTime: Date.parse('2024-02-02T17:30:00.000Z'),
      tags: { carbsEdited: true, entryTimeDiffers: false },
      nutrition: { carbohydrate: { net: 80, units: 'grams' } },
      // earliest DD captures the 20g entry
      originalDosingDecision: {
        time: Date.parse('2024-02-02T17:30:00.000Z'),
        food: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 20 } } },
        originalFood: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 20 } } },
      },
      // latest DD captures the final 80g state; its originalFood reflects the
      // immediate predecessor (60g), so the tooltip must NOT read initial from here.
      dosingDecision: {
        time: Date.parse('2024-02-02T20:00:00.000Z'),
        food: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 80 } } },
        originalFood: { time: '2024-02-02T17:30:00.000Z', nutrition: { carbohydrate: { net: 60 } } },
      },
    };

    it('4-edit chain shows initial = earliest DD value (20), final = 80, Time Edited from latest DD', () => {
      const { container } = render(<FoodTooltip {...props} food={fourEditChain} />);
      expect(container.querySelector(carbValue).textContent).to.equal('80');
      const rows = Array.from(container.querySelectorAll(row));
      const initial = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Initial Carb Amount'));
      expect(initial).to.have.length(1);
      expect(initial[0].querySelector(rowValue).textContent).to.equal('20');
      const lastEdited = rows.filter(n => n.querySelector(rowLabel)?.textContent === 'Time Edited');
      expect(lastEdited).to.have.length(1);
      expect(lastEdited[0].querySelector(rowValue).textContent).to.contain('8:00');
    });

    it('single decrease edit (25→35→45) shows initial = 25 and final = 45', () => {
      // Two edits — originalDosingDecision present.
      const decreaseChain = {
        type: 'food',
        origin: { name: 'com.loopkit.Loop' },
        normalTime: Date.parse('2024-02-02T08:53:00.000Z'),
        tags: { carbsEdited: true, entryTimeDiffers: false },
        nutrition: { carbohydrate: { net: 45, units: 'grams' } },
        originalDosingDecision: {
          time: Date.parse('2024-02-02T08:53:00.000Z'),
          food: { time: '2024-02-02T08:53:00.000Z', nutrition: { carbohydrate: { net: 25 } } },
        },
        dosingDecision: {
          time: Date.parse('2024-02-02T09:10:00.000Z'),
          food: { time: '2024-02-02T08:53:00.000Z', nutrition: { carbohydrate: { net: 45 } } },
          originalFood: { time: '2024-02-02T08:53:00.000Z', nutrition: { carbohydrate: { net: 35 } } },
        },
      };
      const { container } = render(<FoodTooltip {...props} food={decreaseChain} />);
      expect(container.querySelector(carbValue).textContent).to.equal('45');
      const rows = Array.from(container.querySelectorAll(row));
      const initial = rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Initial Carb Amount'));
      expect(initial[0].querySelector(rowValue).textContent).to.equal('25');
    });

    it('unedited entry renders only the standard "Total Carbs" row (no Initial / Last-Edited)', () => {
      const unedited = {
        type: 'food',
        origin: { name: 'com.loopkit.Loop' },
        normalTime: Date.parse('2024-02-02T18:00:00.000Z'),
        tags: {},
        nutrition: { carbohydrate: { net: 45, units: 'grams' } },
        dosingDecision: {
          time: Date.parse('2024-02-02T18:00:00.000Z'),
          food: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 45 } } },
        },
      };
      const { container } = render(<FoodTooltip {...props} food={unedited} />);
      expect(container.querySelector(carbLabel).textContent).to.equal('Total Carbs');
      const rows = Array.from(container.querySelectorAll(row));
      expect(rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Initial Carb Amount'))).to.have.length(0);
      expect(rows.filter(n => n.querySelector(rowLabel)?.textContent.includes('Last Edited'))).to.have.length(0);
    });

    it('deleted entry (carbsEdited && carbs === 0) renders "Total Carbs (Deleted)" label', () => {
      const deleted = {
        type: 'food',
        origin: { name: 'com.loopkit.Loop' },
        normalTime: Date.parse('2024-02-02T18:00:00.000Z'),
        tags: { carbsEdited: true },
        nutrition: { carbohydrate: { net: 0, units: 'grams' } },
        dosingDecision: {
          time: Date.parse('2024-02-02T18:30:00.000Z'),
          food: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 0 } } },
          originalFood: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 30 } } },
        },
      };
      const { container } = render(<FoodTooltip {...props} food={deleted} />);
      expect(container.querySelector(carbLabel).textContent).to.contain('Total Carbs (Deleted)');
    });

    it('0.1g entry renders the normal "Total Carbs" row and a 0.1 value (NOT "Deleted")', () => {
      const tinyEntry = {
        type: 'food',
        origin: { name: 'com.loopkit.Loop' },
        normalTime: Date.parse('2024-02-02T18:00:00.000Z'),
        tags: {},
        nutrition: { carbohydrate: { net: 0.1, units: 'grams' } },
        dosingDecision: {
          time: Date.parse('2024-02-02T18:00:00.000Z'),
          food: { time: '2024-02-02T18:00:00.000Z', nutrition: { carbohydrate: { net: 0.1 } } },
        },
      };
      const { container } = render(<FoodTooltip {...props} food={tinyEntry} />);
      expect(container.querySelector(carbLabel).textContent).to.equal('Total Carbs');
      expect(container.querySelector(carbValue).textContent).to.equal('0.1');
    });

    it('does not render the payload-based "Last Edited" row when the DD-based "Time Edited" row already shows', () => {
      const editedWithPayload = {
        ...fourEditChain,
        payload: { userUpdatedDate: '2024-02-02T20:00:00.000Z' },
      };
      const { container } = render(<FoodTooltip {...props} food={editedWithPayload} />);
      const rows = Array.from(container.querySelectorAll(row));
      // The payload-derived "Last Edited" row must be suppressed.
      const payloadLastEditedRows = rows.filter(n => n.querySelector(rowLabel)?.textContent === 'Last Edited');
      expect(payloadLastEditedRows).to.have.length(0);
      // Only the DD-derived "Time Edited" row should remain.
      const timeEditedRows = rows.filter(n => n.querySelector(rowLabel)?.textContent === 'Time Edited');
      expect(timeEditedRows).to.have.length(1);
    });
  });

  describe('different time of entry', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    const rowUnits = formatClassesAsSelector(styles.units);
    // eslint-disable-next-line max-len
    it('should include the time of entry for a Loop food value that was given a different time of entry', () => {
      const { container } = render(<FoodTooltip {...props} food={loopTimeOfEntry} />);
      expect(container.querySelectorAll(row)[2].querySelector(rowLabel).textContent).to.contain('Time Entered');
      expect(container.querySelectorAll(row)[2].querySelector(rowValue).textContent).to.contain('2:00');
      expect(container.querySelectorAll(row)[2].querySelector(rowUnits).textContent).to.contain('pm');
    });
  });

  describe('manual source', () => {
    const row = formatClassesAsSelector(styles.row);
    const rowLabel = formatClassesAsSelector(styles.label);
    const rowValue = formatClassesAsSelector(styles.value);
    it('should include the manual source for a manual food value', () => {
      const { container } = render(<FoodTooltip {...props} food={manual} />);
      expect(container.querySelectorAll(row)[0].querySelector(rowLabel).textContent).to.contain('Source');
      expect(container.querySelectorAll(row)[0].querySelector(rowValue).textContent).to.contain('Manual');
    });
  });

  describe('trio food', () => {
    // eslint-disable-next-line max-len
    const rowValue = `${formatClassesAsSelector(styles.row)} ${formatClassesAsSelector(styles.value)}`;
    it('should include the food name and absorption time for a Trio food value', () => {
      const { container } = render(<FoodTooltip {...props} food={trio} />);
      expect(getName(trio)).to.equal('triofood');
      expect(getAbsorptionTime(trio)).to.equal(3);
      expect(container.querySelectorAll(rowValue)[0].textContent).to.contain('triofood');
      expect(container.querySelectorAll(rowValue)[1].textContent).to.contain('3');
    });
  });
});
