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

import { render as rtlRender, cleanup } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../helpers/cssmodules';

import BolusTooltip, {
  isAnimasExtended,
  animasExtendedAnnotationMessage,
  isMedronicDeconvertedExchange,
  medronicDeconvertedExchangeMessage,
  getTarget,
  getExtended,
} from '../../../src/components/daily/bolustooltip/BolusTooltip';

import styles from '../../../src/components/daily/bolustooltip/BolusTooltip.css';
import { MGDL_UNITS, MS_IN_HOUR } from '../../../src/utils/constants';

const normal = {
  normal: 5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const automated = {
  normal: 5,
  normalTime: '2017-11-11T05:45:52.000Z',
  subType: 'automated',
  tags: { automated: true },
};

const oneButton = {
  normal: 5,
  normalTime: '2017-11-11T05:45:52.000Z',
  deliveryContext: 'oneButton',
  tags: { oneButton: true },
};

const cancelled = {
  normal: 2,
  expectedNormal: 5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const immediatelyCancelled = {
  normal: 0,
  expectedNormal: 5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const override = {
  type: 'wizard',
  bolus: {
    normal: 2,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 0,
    correction: 0,
  },
};

const underride = {
  type: 'wizard',
  bolus: {
    normal: 1,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 1,
    correction: 0.5,
  },
};

const combo = {
  normal: 1,
  extended: 2,
  duration: 36e5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const cancelledInNormalCombo = {
  normal: 0.2,
  expectedNormal: 1,
  extended: 0,
  expectedExtended: 2,
  duration: 0,
  expectedDuration: 36e5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const cancelledInExtendedCombo = {
  normal: 1,
  extended: 0.5,
  expectedExtended: 2,
  duration: 9e5,
  expectedDuration: 36e5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const comboOverride = {
  type: 'wizard',
  bolus: {
    normal: 1.5,
    extended: 2.5,
    duration: 36e5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 3,
  },
};

const comboUnderrideCancelled = {
  type: 'wizard',
  bolus: {
    normal: 1,
    extended: 1,
    expectedExtended: 3,
    duration: 1200000,
    expectedDuration: 3600000,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
  },
};

const comboUnderrideCancelledWithBG = {
  type: 'wizard',
  bgTarget: {
    target: 100,
  },
  bolus: {
    normal: 1,
    extended: 1,
    expectedExtended: 3,
    duration: 1200000,
    expectedDuration: 3600000,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    net: 5,
    carb: 5,
    correction: 2,
  },
  carbInput: 75,
  bgInput: 280,
  insulinSensitivity: 70,
  insulinCarbRatio: 15,
};

const extended = {
  extended: 2,
  duration: 36e5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const cancelledExtended = {
  extended: 0.2,
  expectedExtended: 2,
  duration: 36e4,
  expectedDuration: 36e5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const immediatelyCancelledExtended = {
  extended: 0,
  expectedExtended: 2,
  duration: 0,
  expectedDuration: 36e5,
  normalTime: '2017-11-11T05:45:52.000Z',
};

const extendedAnimas = {
  extended: 1.2,
  duration: 18000000,
  normalTime: '2017-11-11T05:45:52.000Z',
  annotations: [
    { code: 'animas/bolus/extended-equal-split' },
  ],
};

const extendedAnimasUnderride = {
  type: 'wizard',
  bolus: {
    extended: 1.2,
    duration: 18000000,
    normalTime: '2017-11-11T05:45:52.000Z',
    annotations: [
      { code: 'animas/bolus/extended-equal-split' },
    ],
  },
  recommended: {
    correction: 3.5,
  },
};

const carbExchangesMedtronic = {
  type: 'wizard',
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  carbUnits: 'exchanges',
  carbInput: 4,
  insulinCarbRatio: 2.5,
};

const deconvertedCarbExchangeRatioMedtronic = {
  ...carbExchangesMedtronic,
  annotations: [
    { code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted' },
  ],
};

const extendedUnderride = {
  type: 'wizard',
  bolus: {
    extended: 3,
    duration: 36e5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    correction: 3.5,
  },
};

const withCarbInput = {
  type: 'wizard',
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  carbInput: 75,
  insulinCarbRatio: 15,
};

const withBGInputAndIOB = {
  type: 'wizard',
  bgTarget: {
    target: 100,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  bgInput: 280,
  insulinSensitivity: 70,
  insulinOnBoard: 0.5,
};

const withBGInputAndZeroIOB = {
  type: 'wizard',
  bgTarget: {
    target: 100,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  bgInput: 280,
  insulinSensitivity: 70,
  insulinOnBoard: 0,
};

const withAutoTarget = {
  type: 'wizard',
  annotations: [
    { code: 'wizard/target-automated' },
  ],
  bgInput: 180,
  bgTarget: {
    low: 60,
    high: 180,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  carbInput: 75,
  insulinCarbRatio: 15,
};

const withMedtronicTarget = {
  type: 'wizard',
  bgInput: 180,
  bgTarget: {
    low: 60,
    high: 180,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  carbInput: 75,
  insulinCarbRatio: 15,
};

const withMedtronicSameTarget = {
  type: 'wizard',
  bgInput: 180,
  bgTarget: {
    low: 100,
    high: 100,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  carbInput: 75,
  insulinCarbRatio: 15,
};

const withAnimasTarget = {
  type: 'wizard',
  bgInput: 180,
  bgTarget: {
    target: 100,
    range: 40,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  carbInput: 75,
  insulinCarbRatio: 15,
};

const withInsuletTarget = {
  type: 'wizard',
  bgInput: 180,
  bgTarget: {
    target: 100,
    high: 180,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  carbInput: 75,
  insulinCarbRatio: 15,
};

const withTandemTarget = {
  type: 'wizard',
  bgInput: 180,
  bgTarget: {
    target: 100,
  },
  bolus: {
    normal: 5,
    normalTime: '2017-11-11T05:45:52.000Z',
  },
  recommended: {
    carb: 5,
    correction: 0,
    net: 5,
  },
  carbInput: 75,
  insulinCarbRatio: 15,
};

const withLoopDosingDecision = {
  type: 'bolus',
  bgInput: 192,
  origin: { name: 'com.loopkit.Loop' },
  normal: 5,
  normalTime: '2017-11-11T05:45:52.000Z',
  carbInput: 24,
  expectedNormal: 6,
  insulinOnBoard: 2.654,
  dosingDecision: {
    insulinOnBoard: {
      amount: 2.2354,
    },
    bgTargetSchedule: [
      {
          high: 160,
          low: 150,
          start: MS_IN_HOUR * 4,
      },
      {
          high: 165,
          low: 155,
          start: MS_IN_HOUR * 5,
      },
      {
          high: 170,
          low: 160,
          start: MS_IN_HOUR * 6,
      },
    ],
    pumpSettings: {
      activeSchedule: 'Default',
      carbRatios: {
        Default: [
          {
            amount: 15,
            start: MS_IN_HOUR * 4,
          },
          {
            amount: 17,
            start: MS_IN_HOUR * 5,
          },
          {
            amount: 19,
            start: MS_IN_HOUR * 6,
          },
        ],
      },
      insulinSensitivities: {
        Default: [
          {
            amount: 360,
            start: MS_IN_HOUR * 4,
          },
          {
            amount: 396,
            start: MS_IN_HOUR * 5,
          },
          {
            amount: 342,
            start: MS_IN_HOUR * 6,
          },
        ],
      },
    }
  },
};

const withTwiistLoopDosingDecision = {
  ...withLoopDosingDecision,
  origin: { name: 'com.dekaresearch.twiist' },
};

const insulin = {
  type: 'insulin',
  dose: { total: 5 },
  tags: { manual: true },
};

const insulinRapidActing = {
  ...insulin,
  formulation: { simple: { actingType: 'rapid' } },
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
  bgPrefs: { bgUnits: MGDL_UNITS }
};

describe('BolusTooltip', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render without issue when all properties provided', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={normal} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
  });

  it('should render programmed, interrupted and delivered for cancelled bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={cancelled} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.programmed))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
  });

  it('should render programmed, interrupted and delivered for immediately cancelled bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={immediatelyCancelled} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.programmed))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
  });

  it('should render suggested, override and delivered for override bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={override} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.suggested))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.override))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
  });

  it('should render suggested, underride and delivered for underride bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={underride} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.suggested))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.override))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
  });

  it('should render delivered, normal and extended for combo bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={combo} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.normal))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render programmed, interrupted, normal, extended and delivered for cancelled in normal combo bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={cancelledInNormalCombo} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.programmed))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.normal))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render programmed, interrupted, normal, extended and delivered for cancelled in extended combo bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={cancelledInExtendedCombo} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.programmed))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.normal))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render suggested, normal, extended, override and delivered for override combo bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={comboOverride} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.suggested))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.override))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.normal))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render suggested, interrupted, override, delivered, normal and extended for underride interrupted combo bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={comboUnderrideCancelled} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.suggested))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.override))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.normal))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render suggested, bg, interrupted, override, delivered, normal, extended, carbRatio, isf and target for underride interrupted combo with BG bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={comboUnderrideCancelledWithBG} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.suggested))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.bg))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.override))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.normal))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.carbRatio))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.isf))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.target))).to.have.length(1);
  });

  it('should render delivered and extended for extended bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={extended} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render programmed, interrupted, delivered and extendedDuration for interrupted extended bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={cancelledExtended} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.programmed))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render programmed, interrupted and extended for immediately cancelled extended bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={immediatelyCancelledExtended} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.programmed))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render delivered, extended and annotation for extended Animas bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={extendedAnimas} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.annotation))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render suggested, override, delivered, extended and annotation for extended underride Animas bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={extendedAnimasUnderride} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.suggested))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.override))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.annotation))).to.have.length(1);
  });

  // eslint-disable-next-line max-len
  it('should render suggested, override, delivered and extended for extended underide bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={extendedUnderride} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.suggested))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.override))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.extended))).to.have.length(1);
  });

  it('should render carbRatio for bolus with carb input', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={withCarbInput} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.carbRatio))).to.have.length(1);
  });

  it('should render carbRatio for bolus with carb exchange input', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={carbExchangesMedtronic} />);
    const carbRatio = container.querySelector(formatClassesAsSelector(styles.carbRatio));
    expect(carbRatio.querySelector(formatClassesAsSelector(styles.label)).textContent).to.contain('I:C Ratio');
    expect(carbRatio.querySelector(formatClassesAsSelector(styles.label)).textContent).to.contain('(U/exch)');
    expect(carbRatio.querySelector(formatClassesAsSelector(styles.value)).textContent).to.equal('2.5');
  });

  it('should render delivered, bg, iob, isf and target for bg and iob bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={withBGInputAndIOB} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.bg))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.iob))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.isf))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.target))).to.have.length(1);
  });

  it('should render iob when iob is 0', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={withBGInputAndZeroIOB} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.iob))).to.have.length(1);
  });

  it('should render an automated header label for automated bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={automated} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.title)).length).to.be.at.least(1);
    expect(container.querySelector(formatClassesAsSelector(styles.title)).textContent).to.include('Automated');
  });

  it('should render a one-button bolus header label for a one-button bolus', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={oneButton} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.title)).length).to.be.at.least(1);
    expect(container.querySelector(formatClassesAsSelector(styles.title)).textContent).to.include('One-Button Bolus');
  });

  // eslint-disable-next-line max-len
  it('should render appropriate fields for a bolus with a Loop dosing decision', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={withLoopDosingDecision} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.bg))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.iob))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.isf))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.target))).to.have.length(1);
  });

  it('should render appropriate fields for a bolus with a twiist Loop dosing decision', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={withTwiistLoopDosingDecision} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.interrupted))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.bg))).to.have.length(0); // No bg field shown for twiist Loop
    expect(container.querySelectorAll(formatClassesAsSelector(styles.iob))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.isf))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.target))).to.have.length(1);
  });

  it('should render appropriate fields for a manual insulin delivery', () => {
    const { container } = rtlRender(<BolusTooltip {...props} bolus={insulinRapidActing} />);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.delivered))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.actingType))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.actingType)).textContent).to.contain('Short-acting insulin');
    expect(container.querySelectorAll(formatClassesAsSelector(styles.source))).to.have.length(1);
    expect(container.querySelector(formatClassesAsSelector(styles.source)).textContent).to.contain('Manual');
  });

  describe('getTarget', () => {
    // eslint-disable-next-line max-len
    const targetValue = `${formatClassesAsSelector(styles.target)} ${formatClassesAsSelector(styles.value)}`;
    it('should return a single div for Medtronic style target', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={withMedtronicTarget} />);
      const result = getTarget(withMedtronicTarget, props.bgPrefs, props.timePrefs);
      expect(result.type).to.equal('div');
      expect(container.querySelector(targetValue).textContent).to.equal('60-180');
    });
    it('should return a single div and single value for Medtronic style same value target', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={withMedtronicSameTarget} />);
      const result = getTarget(withMedtronicSameTarget, props.bgPrefs, props.timePrefs);
      expect(result.type).to.equal('div');
      expect(container.querySelector(targetValue).textContent).to.equal('100');
    });
    it('should return an array for Animas style target', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={withAnimasTarget} />);
      expect(_.isArray(getTarget(withAnimasTarget, props.bgPrefs, props.timePrefs))).to.be.true;
      expect(getTarget(withAnimasTarget, props.bgPrefs, props.timePrefs).length).to.equal(2);
      const targetValues = container.querySelectorAll(targetValue);
      expect(targetValues[0].textContent).to.equal('100');
      expect(targetValues[targetValues.length - 1].textContent).to.equal('40');
    });
    it('should return an array for Insulet style target', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={withInsuletTarget} />);
      expect(_.isArray(getTarget(withInsuletTarget, props.bgPrefs, props.timePrefs))).to.be.true;
      expect(getTarget(withInsuletTarget, props.bgPrefs, props.timePrefs).length).to.equal(2);
      const targetValues = container.querySelectorAll(targetValue);
      expect(targetValues[0].textContent).to.equal('100');
      expect(targetValues[targetValues.length - 1].textContent).to.equal('180');
    });
    it('should return a single div for Tandem style target', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={withTandemTarget} />);
      const result = getTarget(withTandemTarget, props.bgPrefs, props.timePrefs);
      expect(result.type).to.equal('div');
      expect(container.querySelector(targetValue).textContent).to.equal('100');
    });
    it('should return a single div for Loop style target', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={withLoopDosingDecision} />);
      const result = getTarget(withLoopDosingDecision, props.bgPrefs, props.timePrefs);
      expect(result.type).to.equal('div');
      expect(container.querySelector(targetValue).textContent).to.equal('155-165');
    });
    it('should return "Auto" for a bolus with an automated wizard annotation', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={withAutoTarget} />);
      const result = getTarget(withAutoTarget, props.bgPrefs, props.timePrefs);
      expect(result.type).to.equal('div');
      expect(container.querySelector(targetValue).textContent).to.equal('Auto');
    });
  });

  describe('isAnimasExtended', () => {
    it('should return true if annotations include Animas extended equal split', () => {
      expect(isAnimasExtended(extendedAnimas)).to.be.true;
    });
    it('should return false for non-annotated bolus', () => {
      expect(isAnimasExtended(normal)).to.be.false;
    });
    it('should return false for non-Animas annotated bolus', () => {
      const bolus = _.extend(normal, { annotations: [{ code: 'some/awesome-annotation' }] });
      expect(isAnimasExtended(bolus)).to.be.false;
    });
  });

  describe('isMedronicDeconvertedExchange', () => {
    it('should return true if annotations include Medtronic deconverted carb-to-exchange ratio', () => {
      expect(isMedronicDeconvertedExchange(deconvertedCarbExchangeRatioMedtronic)).to.be.true;
    });
    it('should return false for non-deconverted bolus', () => {
      expect(isMedronicDeconvertedExchange(normal)).to.be.false;
    });
  });

  describe('getExtended', () => {
    const extendedStyle = formatClassesAsSelector(styles.extended);
    const normalStyle = formatClassesAsSelector(styles.normal);
    const label = formatClassesAsSelector(styles.label);
    it('should return a single div for Animas extended', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={extendedAnimas} />);
      const result = getExtended(extendedAnimas);
      expect(result.type).to.equal('div');
      expect(container.querySelector(`${extendedStyle} ${label}`).textContent).to.equal('Extended Over*');
    });
    it('should return an array for normal extended', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={extended} />);
      expect(_.isArray(getExtended(extended))).to.be.true;
      expect(getExtended(extended).length).to.equal(2);
      expect(getExtended(extended)[0]).to.be.false;
      expect(container.querySelector(`${extendedStyle} ${label}`).textContent).to.equal('Over 1 hr ');
    });
    it('should return an array for combo extended', () => {
      const { container } = rtlRender(<BolusTooltip {...props} bolus={combo} />);
      expect(_.isArray(getExtended(combo))).to.be.true;
      expect(getExtended(combo).length).to.equal(2);
      expect(container.querySelector(`${normalStyle} ${label}`).textContent).to.equal('Up Front (33%)');
      expect(container.querySelector(`${extendedStyle} ${label}`).textContent).to.equal('Over 1 hr (67%)');
    });
    it('should return null for normal bolus', () => {
      rtlRender(<BolusTooltip {...props} bolus={normal} />);
      expect(getExtended(normal)).to.be.null;
    });
  });

  describe('animasExtendedAnnotationMessage', () => {
    it('should return a div for Animas extended', () => {
      const result = animasExtendedAnnotationMessage(extendedAnimas);
      expect(result.type).to.equal('div');
    });
    it('should return null for normal bolus', () => {
      expect(animasExtendedAnnotationMessage(normal)).to.be.null;
    });
  });

  describe('medronicDeconvertedExchangeMessage', () => {
    it('should return a div for Medtronic deconverted carb-to-exchange ratio', () => {
      const result = medronicDeconvertedExchangeMessage(deconvertedCarbExchangeRatioMedtronic);
      expect(result.type).to.equal('div');
    });
    it('should return null for normal bolus', () => {
      expect(animasExtendedAnnotationMessage(normal)).to.be.null;
    });
  });
});
