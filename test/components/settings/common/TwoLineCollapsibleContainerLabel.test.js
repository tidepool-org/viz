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

import TwoLineCollapsibleContainerLabel
  from '../../../../src/components/settings/common/TwoLineCollapsibleContainerLabel';

describe('TwoLineCollapsibleContainerLabel', () => {
  it('should render a label with a click handler', () => {
    const clicker = sinon.stub();
    expect(clicker.callCount).to.equal(0);
    const { container } = render(
      <TwoLineCollapsibleContainerLabel
        isOpened
        label={{ main: 'Foo', secondary: 'Bar', units: 'g' }}
        onClick={clicker}
      />
    );
    fireEvent.click(container.firstChild);
    expect(clicker.callCount).to.equal(1);
  });
});
