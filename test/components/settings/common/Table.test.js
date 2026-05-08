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

import Table from '../../../../src/components/settings/common/Table';

describe('Table', () => {
  const testColumns = [
    { key: 'one',
      label: 'Label one',
    },
    { key: 'two',
      label: 'Label two',
    },
    { key: 'three',
      label: 'Label three',
    },
  ];
  const testData = [
    {
      one: 1,
      two: 'Two',
      three: 3.333,
    },
    {
      one: 'One',
      two: 2,
      three: 'Three',
    },
    {
      one: 1.1,
      two: 'Two',
      three: 3,
    },
  ];
  const testTitle = {
    label: {
      main: 'Hello',
      secondary: 'km/hr',
    },
    className: 'stuff',
  };

  it('should use given rows, columns, and title', () => {
    const { container } = render(
      <Table
        title={testTitle}
        rows={testData}
        columns={testColumns}
        tableStyle="whatever"
      />
    );
    expect(container.querySelectorAll('caption')).to.have.length(1);
    expect(container.querySelectorAll('table')).to.have.length(1);
    expect(container.querySelectorAll('thead')).to.have.length(1);
    expect(container.querySelectorAll('th')).to.have.length(3);
    expect(container.querySelectorAll('tr')).to.have.length(4);
    expect(container.querySelectorAll('td')).to.have.length(9);
  });

  it('should not require a title', () => {
    const { container } = render(
      <Table
        rows={testData}
        columns={testColumns}
        tableStyle="whatever"
      />
    );
    expect(container.querySelectorAll('caption')).to.have.length(0);
    expect(container.querySelectorAll('table')).to.have.length(1);
    expect(container.querySelectorAll('thead')).to.have.length(1);
    expect(container.querySelectorAll('th')).to.have.length(3);
    expect(container.querySelectorAll('tr')).to.have.length(4);
    expect(container.querySelectorAll('td')).to.have.length(9);
  });

  it('should handle no data', () => {
    const { container } = render(
      <Table
        rows={[]}
        columns={testColumns}
        tableStyle="whatever"
      />
    );
    expect(container.querySelectorAll('caption')).to.have.length(0);
    expect(container.querySelectorAll('table')).to.have.length(1);
    expect(container.querySelectorAll('thead')).to.have.length(1);
    expect(container.querySelectorAll('th')).to.have.length(3);
    expect(container.querySelectorAll('tr')).to.have.length(1);
    expect(container.querySelectorAll('td')).to.have.length(0);
  });
});
