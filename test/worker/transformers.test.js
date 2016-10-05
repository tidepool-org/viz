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

import _ from 'lodash';
import mutationTracker from 'object-invariant-test-helper';

import * as mungers from '../../src/worker/mungers';
import * as transformers from '../../src/worker/transformers';
const cloneAndTransform = transformers.cloneAndTransform;

describe('cloneAndTransform', () => {
  beforeEach(() => {
    sinon.spy(mungers, 'toHammertime');
    sinon.spy(mungers, 'calcTzSensitiveFields');
  });

  afterEach(() => {
    mungers.toHammertime.restore();
    mungers.calcTzSensitiveFields.restore();
  });

  it('should be a function', () => {
    assert.isFunction(cloneAndTransform);
  });

  it('should return a new - *not* mutated - object', () => {
    const input = {};
    const tracked = mutationTracker.trackObj(input);
    const result = cloneAndTransform(input, 'US/Mountain');
    assert.isObject(result);
    expect(mutationTracker.hasMutated(tracked)).to.be.false;
  });

  it('should call toHammertime and calcTzSensitiveFields', () => {
    expect(mungers.toHammertime.callCount).to.equal(0);
    expect(mungers.calcTzSensitiveFields.callCount).to.equal(0);
    const input = {};
    cloneAndTransform(input, 'US/Mountain');
    expect(mungers.toHammertime.callCount).to.equal(1);
    expect(mungers.toHammertime.args[0][0]).to.deep.equal(input);
    expect(mungers.calcTzSensitiveFields.callCount).to.equal(1);
    expect(_.pick(mungers.calcTzSensitiveFields.args[0][0], ['hammertime', 'rawDisplayTimeMs']))
      .to.deep.equal(mungers.toHammertime(input));
  });
});
