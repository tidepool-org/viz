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

import * as scales from '../../../helpers/scales';
const {
  trendsHeight,
  trendsWidth,
  trendsYScale: yScale,
} = scales.trends;
import bgBounds from '../../../helpers/bgBounds';
import SVGContainer from '../../../helpers/SVGContainer';

import { MGDL_UNITS } from '../../../../src/utils/constants';
import YAxisLabelsAndTicks from '../../../../src/components/trends/common/YAxisLabelsAndTicks';

describe('YAxisLabelsAndTicks', () => {
  let container;
  const props = {
    bgPrefs: {
      bgBounds,
      bgUnits: MGDL_UNITS,
    },
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    yScale,
  };

  before(() => {
    ({ container } = render(
      <SVGContainer dimensions={{ width: trendsWidth, height: trendsHeight }}>
        <YAxisLabelsAndTicks {...props} />
      </SVGContainer>
    ));
  });

  it('should render four tick lines and four text labels', () => {
    const lines = container.querySelectorAll('line');
    expect(lines).to.have.length(4);
    expect(Number(lines[0].getAttribute('y1'))).to.equal(yScale(props.bgPrefs.bgBounds.targetLowerBound));
    expect(Number(lines[0].getAttribute('y2'))).to.equal(yScale(props.bgPrefs.bgBounds.targetLowerBound));
    expect(Number(lines[1].getAttribute('y1'))).to.equal(yScale(props.bgPrefs.bgBounds.targetUpperBound));
    expect(Number(lines[1].getAttribute('y2'))).to.equal(yScale(props.bgPrefs.bgBounds.targetUpperBound));
    expect(Number(lines[2].getAttribute('y1'))).to.equal(yScale(props.bgPrefs.bgBounds.veryHighThreshold));
    expect(Number(lines[2].getAttribute('y2'))).to.equal(yScale(props.bgPrefs.bgBounds.veryHighThreshold));
    expect(Number(lines[3].getAttribute('y1'))).to.equal(yScale(props.bgPrefs.bgBounds.veryLowThreshold));
    expect(Number(lines[3].getAttribute('y2'))).to.equal(yScale(props.bgPrefs.bgBounds.veryLowThreshold));
    const labels = container.querySelectorAll('text');
    expect(labels).to.have.length(4);
    expect(Number(labels[0].getAttribute('y'))).to.equal(yScale(props.bgPrefs.bgBounds.targetLowerBound));
    expect(Number(labels[1].getAttribute('y'))).to.equal(yScale(props.bgPrefs.bgBounds.targetUpperBound));
    expect(Number(labels[2].getAttribute('y'))).to.equal(yScale(props.bgPrefs.bgBounds.veryHighThreshold));
    expect(Number(labels[3].getAttribute('y'))).to.equal(yScale(props.bgPrefs.bgBounds.veryLowThreshold));
  });
});
