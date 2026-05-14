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

import LabeledCheckbox from '../../../../src/components/common/controls/LabeledCheckbox';

describe('LabeledCheckbox', () => {
  let checkedContainer;
  let uncheckedContainer;
  const onFn = sinon.spy();
  const offFn = sinon.spy();
  afterEach(() => {
    onFn.resetHistory();
    offFn.resetHistory();
  });
  before(() => {
    const checkedProps = {
      checked: true,
      onFn,
      offFn,
      label: 'Checked Label',
      name: 'checked',
    };
    const uncheckedProps = {
      checked: false,
      onFn,
      offFn,
      label: 'Unchecked Label',
      name: 'unchecked',
    };
    checkedContainer = render(<LabeledCheckbox {...checkedProps} />).container;
    uncheckedContainer = render(<LabeledCheckbox {...uncheckedProps} />).container;
  });

  describe('Checked', () => {
    it('should render a checked checkbox', () => {
      expect(checkedContainer.querySelectorAll('input[type="checkbox"]').length).to.equal(1);
      expect(checkedContainer.querySelector('input[type="checkbox"]').checked).to.be.true;
    });
    it('should render the label', () => {
      expect(checkedContainer.querySelector('label').textContent).to.have.string('Checked Label');
    });
    it('should trigger offFn when changed', () => {
      expect(offFn.callCount).to.equal(0);
      fireEvent.click(checkedContainer.querySelector('input[type="checkbox"]'));
      expect(offFn.callCount).to.equal(1);
    });
  });

  describe('Unchecked', () => {
    it('should render an unchecked checkbox', () => {
      expect(uncheckedContainer.querySelectorAll('input[type="checkbox"]').length).to.equal(1);
      expect(uncheckedContainer.querySelector('input[type="checkbox"]').checked).to.be.false;
    });
    it('should render the label', () => {
      expect(uncheckedContainer.querySelector('label').textContent).to.have.string('Unchecked Label');
    });
    it('should trigger onFn when changed', () => {
      expect(onFn.callCount).to.equal(0);
      fireEvent.click(uncheckedContainer.querySelector('input[type="checkbox"]'));
      expect(onFn.callCount).to.equal(1);
    });
  });
});
