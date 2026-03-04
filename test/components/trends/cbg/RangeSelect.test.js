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

import { render, fireEvent } from '@testing-library/react/pure';
import RangeSelect from '../../../../src/components/trends/cbg/RangeSelect';

describe('RangeSelect', () => {
  const props = {
    currentPatientInViewId: 'a1b2c3',
    displayFlags: {
      cbg100Enabled: false,
      cbg80Enabled: true,
      cbg50Enabled: true,
      cbgMedianEnabled: true,
    },
    updateCbgRange: sinon.spy(),
  };

  const { container } = render(
    <RangeSelect {...props} />
  );

  it('should render four LabeledCheckboxes', () => {
    expect(container.querySelectorAll('input[type="checkbox"]')).to.have.length(4);
  });

  it('clicking on the first checkbox should turn on 100%', () => {
    fireEvent.click(container.querySelectorAll('input[type="checkbox"]')[0]);
    expect(props.updateCbgRange.callCount).to.equal(1);
    expect(props.updateCbgRange.calledWith('cbg100Enabled', true)).to.be.true;
  });

  it('clicking on the second checkbox should turn off 80%', () => {
    fireEvent.click(container.querySelectorAll('input[type="checkbox"]')[1]);
    expect(props.updateCbgRange.callCount).to.equal(2);
    expect(props.updateCbgRange.calledWith('cbg80Enabled', false)).to.be.true;
  });
});
