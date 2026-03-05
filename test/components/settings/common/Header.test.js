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

import Header from '../../../../src/components/settings/common/Header';

describe('Header', () => {
  it('should render the device upload date', () => {
    const { container } = render(
      <Header
        deviceDisplayName="Testing"
        deviceMeta={{ name: 'SN123', uploaded: 'Jul 12th 2016' }}
        printView={false}
      />
    );
    expect(container.querySelector('span').textContent).to.equal('Active at Upload on Jul 12th 2016');
  });
});
