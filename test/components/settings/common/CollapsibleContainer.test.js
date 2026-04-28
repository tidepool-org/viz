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
import { render as rtlRender, cleanup, fireEvent } from '@testing-library/react/pure';

import CollapsibleContainer from '../../../../src/components/settings/common/CollapsibleContainer';

// Mock label components
jest.mock('../../../../src/components/settings/common/SingleLineCollapsibleContainerLabel', () => ({
  __esModule: true,
  default: (props) => require('react').createElement('div', {
    'data-testid': 'SingleLineLabel',
    onClick: props.onClick,
  }),
}));
jest.mock('../../../../src/components/settings/common/TwoLineCollapsibleContainerLabel', () => ({
  __esModule: true,
  default: (props) => require('react').createElement('div', {
    'data-testid': 'TwoLineLabel',
    onClick: props.onClick,
  }),
}));

describe('CollapsibleContainer', () => {
  const label = {
    main: 'Foo',
    secondary: '(inactive)',
    units: 'lbs',
  };

  const labelClass = 'whatever';

  afterEach(() => {
    cleanup();
  });

  it('should render passed-in children', () => {
    const { container } = rtlRender(
      <CollapsibleContainer
        label={label}
        labelClass={labelClass}
        opened
        toggleExpansion={() => {}}
      >
        <div className="unique" />
      </CollapsibleContainer>
    );
    expect(container.querySelector('.unique')).to.not.be.null;
  });

  it('should render TwoLineCollapsibleContainerLabel if given `twoLineLabel`', () => {
    const { container } = rtlRender(
      <CollapsibleContainer
        label={label}
        labelClass={labelClass}
        opened={false}
        toggleExpansion={() => {}}
        twoLineLabel
      >
        <div className="unique" />
      </CollapsibleContainer>
    );
    expect(container.querySelectorAll('[data-testid="SingleLineLabel"]')).to.have.length(0);
    expect(container.querySelectorAll('[data-testid="TwoLineLabel"]')).to.have.length(1);
  });

  it('should render the SingleLineCollapsibleContainerLabel if not given `twoLineLabel`', () => {
    const { container } = rtlRender(
      <CollapsibleContainer
        label={label}
        labelClass={labelClass}
        opened={false}
        twoLineLabel={false}
        toggleExpansion={() => {}}
      >
        <div className="unique" />
      </CollapsibleContainer>
    );
    expect(container.querySelectorAll('[data-testid="SingleLineLabel"]')).to.have.length(1);
    expect(container.querySelectorAll('[data-testid="TwoLineLabel"]')).to.have.length(0);
  });

  it('should render the Single... if given `twoLineLabel` but label.secondary empty', () => {
    const { container } = rtlRender(
      <CollapsibleContainer
        label={{ main: 'Foo', secondary: '', units: 'lbs' }}
        labelClass={labelClass}
        opened={false}
        twoLineLabel
        toggleExpansion={() => {}}
      >
        <div className="unique" />
      </CollapsibleContainer>
    );
    expect(container.querySelectorAll('[data-testid="SingleLineLabel"]')).to.have.length(1);
    expect(container.querySelectorAll('[data-testid="TwoLineLabel"]')).to.have.length(0);
  });

  it('should call toggleExpansion function on click', () => {
    const toggleExpansion = sinon.spy();
    const { container } = rtlRender(
      <CollapsibleContainer
        label={label}
        labelClass={labelClass}
        opened={false}
        toggleExpansion={toggleExpansion}
      >
        <div className="unique" />
      </CollapsibleContainer>
    );
    expect(toggleExpansion.callCount).to.equal(0);
    fireEvent.click(container.querySelector('[data-testid$="Label"]'));
    expect(toggleExpansion.callCount).to.equal(1);
  });
});
