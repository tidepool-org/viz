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
import { render } from '@testing-library/react/pure';

import { detail } from '../../../helpers/scales';
const { detailXScale, detailBolusScale } = detail;

import Bolus from '../../../../src/components/common/data/Bolus';
import getBolusPaths from '../../../../src/modules/render/bolus';

import { normal, underrideNormal, zeroUnderride } from '../../../../data/bolus/fixtures';

const BOLUS_OPTS = {
  bolusWidth: 12,
  extendedLineThickness: 2,
  interruptedLineThickness: 2,
  triangleHeight: 5,
};

describe('Bolus', () => {
  it('should return `null` if no paths calculated from insulinEvent', () => {
    const { container } = render(
      <Bolus insulinEvent={zeroUnderride} xScale={detailXScale} yScale={detailBolusScale} />
    );
    expect(container.firstChild).to.be.null;
  });

  it('should return a `<g>` with as many `<path>s` as are calculated for the insulinEvent', () => {
    const paths = getBolusPaths(normal, detailXScale, detailBolusScale, BOLUS_OPTS);
    const { container } = render(
      <Bolus insulinEvent={normal} xScale={detailXScale} yScale={detailBolusScale} />
    );
    expect(container.querySelectorAll(`#bolus-${normal.id}`).length).to.equal(1);
    expect(container.querySelectorAll('path').length).to.equal(paths.length);
    expect(container.querySelectorAll('circle').length).to.equal(0);
    expect(container.querySelectorAll('text').length).to.equal(0);
  });

  it('should include a <circle> and <text> for carbs if insulinEvent has `carbInput`', () => {
    const { container } = render(
      <Bolus insulinEvent={underrideNormal} xScale={detailXScale} yScale={detailBolusScale} />
    );
    expect(container.querySelectorAll('circle').length).to.equal(1);
    expect(container.querySelectorAll('text').length).to.equal(1);
  });
});
