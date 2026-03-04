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

import NoData from '../../../../src/components/trends/common/NoData';

describe('NoData', () => {
  const position = { x: 10, y: 50 };

  it('should render without issue when all properties provided', () => {
    const { container } = render(
      <NoData
        position={position}
      />
    );
    expect(container.querySelectorAll('text')).to.have.length(1);
  });

  it('should render given with x and y position', () => {
    const { container } = render(
      <NoData
        position={position}
      />
    );
    expect(container.querySelectorAll('text[x="10"]')).to.have.length(1);
    expect(container.querySelectorAll('text[y="50"]')).to.have.length(1);
  });

  it('should not render when position not provided', () => {
    const { container } = render(
      <NoData />
    );
    expect(container.querySelectorAll('text')).to.have.length(0);
  });

  it('should render with the provided data type in the message', () => {
    const { container } = render(
      <NoData
        dataType="smbg"
        position={position}
      />
    );
    expect(container.querySelector('text').textContent)
      .to.equal('There is no fingerstick data for this time period :(');
  });

  it('should not specify a default data type', () => {
    const { container } = render(
      <NoData
        position={position}
      />
    );
    expect(container.querySelector('text').textContent)
      .to.equal('There is no  data for this time period :(');
  });

  it('should render the unselected all data msg if unselectedAllData prop is true', () => {
    const { container } = render(
      <NoData
        position={position}
        unselectedAllData
      />
    );
    expect(container.querySelector('text').textContent)
      .to.equal('Hang on there, skippy! You unselected all of the data!');
  });

  it('should be able to override the unselected all data message string', () => {
    const customized = 'Dude, you unselected everything!';
    const { container } = render(
      <NoData
        position={position}
        unselectedAllData
        unselectedAllDataString={customized}
      />
    );
    expect(container.querySelector('text').textContent)
      .to.equal(customized);
  });
});
