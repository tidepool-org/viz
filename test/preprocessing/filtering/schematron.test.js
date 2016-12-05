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

import schema, {
  togetherWith,
} from '../../../src/preprocessing/filtering/schematron';

describe('schematron', () => {
  describe('schema', () => {
    it('should be a function', () => {
      assert.isFunction(schema);
    });

    it('should return a function', () => {
      assert.isFunction(schema());
    });

    describe('array', () => {
      it('should not error on array input', () => {
        const filterFn = (item) => { schema().array()(item); };
        assert.doesNotThrow(_.wrap([], filterFn), Error);
        assert.doesNotThrow(_.wrap([1, 2, 3], filterFn), Error);
        assert.doesNotThrow(_.wrap([{ id: 'a1b2c3', value: 5 }], filterFn), Error);
      });

      it('should error on non-array input', () => {
        const filterFn = (item) => { schema().array()(item); };
        expect(_.wrap(1, filterFn)).to.throw('should be an array, value was [1]');
        expect(_.wrap('foo', filterFn)).to.throw('should be an array, value was [foo]');
        expect(_.wrap({}, filterFn)).to.throw('should be an array, value was [{}]');
      });

      it('should check array contents', () => {
        const filterFn = (item) => { schema().array(schema().number().min(0))(item); };
        expect(_.wrap([-1], filterFn)).to.throw('should be >= [0], got [-1]');
        assert.doesNotThrow(_.wrap([0], filterFn), Error);
      });
    });

    describe('boolean', () => {
      const filterFn = (item) => { schema().boolean()(item); };

      it('should not error on boolean input', () => {
        assert.doesNotThrow(_.wrap(true, filterFn), Error);
        assert.doesNotThrow(_.wrap(false, filterFn), Error);
      });

      it('should error on non-boolean input', () => {
        expect(_.wrap(1, filterFn)).to.throw('should be of type [boolean], value was [1]');
        expect(_.wrap('foo', filterFn)).to.throw('should be of type [boolean], value was [foo]');
        expect(_.wrap({}, filterFn)).to.throw('should be of type [boolean], value was [{}]');
      });
    });

    describe('in', () => {
      const filterFn = (item) => { schema().in([5, 'foo'])(item); };

      it('should not error on input contained in the configured allowed values', () => {
        assert.doesNotThrow(_.wrap(5, filterFn), Error);
        assert.doesNotThrow(_.wrap('foo', filterFn), Error);
      });

      it('should error on input *not* contained in the configured allowed values', () => {
        expect(_.wrap(1, filterFn)).to.throw('should be one of [5,foo], got [1]');
      });
    });

    describe('isADeviceTime', () => {
      const filterFn = (item) => { schema().isADeviceTime()(item); };
      const deviceTime = '2016-01-01T12:00:05';

      it('should not error on an ISO 8601 formatted timestamp w/o timezone offset info', () => {
        assert.doesNotThrow(_.wrap(deviceTime, filterFn), Error);
      });

      it('should error on an ISO 8601 formatted timestamp *with* timezone offset info', () => {
        // eslint-disable-next-line max-len
        expect(_.wrap(`${deviceTime}-08:00`, filterFn)).to.throw('should match the regex [/^(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d)$/], got [2016-01-01T12:00:05-08:00]');
      });

      it('should error on an ISO 8601 formatted Zulu timestamp', () => {
        // eslint-disable-next-line max-len
        expect(_.wrap(`${deviceTime}Z`, filterFn)).to.throw('should match the regex [/^(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d)$/], got [2016-01-01T12:00:05Z]');
      });
    });

    describe('isId', () => {
      const filterFn = (item) => { schema().isId()(item); };

      it('should not error on ID that contains letters, numbers, hypen, and/or underscore', () => {
        assert.doesNotThrow(_.wrap('a1b2c3', filterFn), Error);
        assert.doesNotThrow(_.wrap('upid_d4e-5f6', filterFn), Error);
      });

      it('should error on ID that contains punctuation, spaces, etc.', () => {
        expect(_.wrap('a1b2c3 d4e5f6', filterFn))
          .to.throw('should match the regex [/^[A-Za-z0-9\\-_]+$/], got [a1b2c3 d4e5f6]');
        expect(_.wrap('$a1b.2c3', filterFn))
          .to.throw('should match the regex [/^[A-Za-z0-9\\-_]+$/], got [$a1b.2c3]');
      });
    });

    describe('isISODateTime', () => {
      const filterFn = (item) => { schema().isISODateTime()(item); };
      const zulu1 = '2016-01-01T12:00:05Z';
      const zulu2 = '2016-01-01T12:00:05.023Z';
      const withTzOffset = '2016-01-01T12:00:05-05:00';

      it('should not error on an ISO 8601 formatted timestamp', () => {
        assert.doesNotThrow(_.wrap(zulu1, filterFn), Error);
        assert.doesNotThrow(_.wrap(zulu2, filterFn), Error);
        assert.doesNotThrow(_.wrap(withTzOffset, filterFn), Error);
      });

      it('should error on a timezone-naive deviceTime', () => {
        const deviceTime = '2016-01-01T12:00:05';
        expect(_.wrap(deviceTime, filterFn))
          .to.throw('should be an ISO 8601 datetime string, got [2016-01-01T12:00:05]');
      });
    });

    describe('minLength', () => {
      describe('on an array', () => {
        const filterFn = (item) => { schema().array().minLength(5)(item); };

        it('should not error on an array that meets the minimum length specified', () => {
          assert.doesNotThrow(_.wrap([1, 2, 3, 4, 5], filterFn), Error);
        });

        it('should error on an array that does *not* meet the minimum length specified', () => {
          expect(_.wrap([1, 2, 3], filterFn)).to.throw('should have a length >= [5], got [3]');
        });
      });

      describe('on a string', () => {
        const filterFn = (item) => { schema().string().minLength(5)(item); };

        it('should not error on a string that meets the minimum length specified', () => {
          assert.doesNotThrow(_.wrap('abcde', filterFn), Error);
        });

        it('should error on a string that does *not* meet the minimum length specified', () => {
          expect(_.wrap('abc', filterFn)).to.throw('should have a length >= [5], got [3]');
        });
      });
    });

    describe('max', () => {
      const filterFn = (item) => { schema().number().max(864e5)(item); };

      it('should not error on a number <= the max', () => {
        assert.doesNotThrow(_.wrap(3600000, filterFn), Error);
        assert.doesNotThrow(_.wrap(864e5, filterFn), Error);
      });

      it('should error on a number > the max', () => {
        expect(_.wrap(86400001, filterFn)).to.throw('should be <= [86400000], got [86400001]');
      });
    });

    describe('min', () => {
      const filterFn = (item) => { schema().number().min(0)(item); };

      it('should not error on a number >= the min', () => {
        assert.doesNotThrow(_.wrap(3600000, filterFn), Error);
        assert.doesNotThrow(_.wrap(0, filterFn), Error);
      });

      it('should error on a number < the min', () => {
        expect(_.wrap(-1, filterFn)).to.throw('should be >= [0], got [-1]');
      });
    });

    describe('number', () => {
      const filterFn = (item) => { schema().number()(item); };

      it('should not error on a positive, negative, zero, or float number', () => {
        assert.doesNotThrow(_.wrap(-1, filterFn), Error);
        assert.doesNotThrow(_.wrap(0, filterFn), Error);
        assert.doesNotThrow(_.wrap(864e5, filterFn), Error);
        assert.doesNotThrow(_.wrap(0.666666667, filterFn), Error);
      });

      it('should error on `null`, String, or Object', () => {
        expect(_.wrap(null, filterFn)).to.throw('should be a finite number, got [null]');
        expect(_.wrap('a1b2c3', filterFn))
          .to.throw('should be a finite number, got [a1b2c3]');
        expect(_.wrap({}, filterFn)).to.throw('should be a finite number, got [{}]');
      });

      it('should error on `Infinity`, `-Infinity`, or `NaN`', () => {
        expect(_.wrap(Infinity, filterFn))
          .to.throw('should be a finite number, got [Infinity]');
        expect(_.wrap(-Infinity, filterFn))
          .to.throw('should be a finite number, got [-Infinity]');
        expect(_.wrap(NaN, filterFn)).to.throw('should be a finite number, got [NaN]');
      });
    });

    describe('object', () => {
      it('should not error on object input', () => {
        const filterFn = (item) => { schema().object()(item); };
        assert.doesNotThrow(_.wrap({}, filterFn), Error);
      });

      it('should error on non-object input', () => {
        const filterFn = (item) => { schema().object()(item); };
        expect(_.wrap(5, filterFn)).to.throw('should be of type [object], value was [5]');
      });

      it('should check object fields', () => {
        const filterFn = (item) => {
          schema({
            foo: schema().object({
              bar: schema().boolean(),
              baz: schema().number(),
            }),
          })(item);
        };

        assert.doesNotThrow(_.wrap({ foo: { bar: true, baz: 5 } }, filterFn), Error);
        expect(_.wrap({ foo: { bar: 5, baz: 5 } }, filterFn))
          .to.throw('.foo .bar should be of type [boolean], value was [5]');
        expect(_.wrap({ foo: { bar: true, baz: 'a1b2c3' } }, filterFn))
          .to.throw('.foo .baz should be a finite number, got [a1b2c3]');
      });
    });

    describe('oneOf', () => {
      const filterFn = (item) => {
        schema().oneOf(
          schema().number().min(0),
          schema().isNull(),
        )(item);
      };

      const inclusiveOr = (item) => {
        schema().oneOf(
          schema().number().min(0),
          schema().number().max(100),
        )(item);
      };

      it('should not error if either alternative is satisfied', () => {
        assert.doesNotThrow(_.wrap(5, filterFn), Error);
        assert.doesNotThrow(_.wrap(null, filterFn), Error);
      });

      it('should not error if both alternatives are satisfied', () => {
        assert.doesNotThrow(_.wrap(5, inclusiveOr), Error);
      });

      it('should error if neither alternative is satisfied', () => {
        // eslint-disable-next-line max-len
        expect(_.wrap(-5, filterFn)).to.throw('[-5] failed all possible schemas: should be >= [0], got [-5] should be null, got [-5]');
        // eslint-disable-next-line max-len
        expect(_.wrap(NaN, filterFn)).to.throw('NaN] failed all possible schemas: should be a finite number, got [NaN] should be null, got [NaN]');
        // eslint-disable-next-line max-len
        expect(_.wrap(null, inclusiveOr)).to.throw('[null] failed all possible schemas: should be a finite number, got [null] should be a finite number, got [null]');
      });
    });

    describe('regex', () => {
      const filterFn = (item) => { schema().regex(/[A-Z]+:\d+/)(item); };

      it('should not error on input that matches the regex', () => {
        assert.doesNotThrow(_.wrap('G:2', filterFn), Error);
      });

      it('should error on input that does *not* match the regex', () => {
        expect(_.wrap('foo', filterFn))
          .to.throw('should match the regex [/[A-Z]+:\\d+/], got [foo]');
      });
    });

    describe('string', () => {
      const filterFn = (item) => { schema().string()(item); };

      it('should not error on string input', () => {
        assert.doesNotThrow(_.wrap('', filterFn), Error);
        assert.doesNotThrow(_.wrap('a1b2c3', filterFn), Error);
      });

      it('should error on non-string input', () => {
        expect(_.wrap(1, filterFn)).to.throw('should be of type [string], value was [1]');
        expect(_.wrap({}, filterFn)).to.throw('should be of type [string], value was [{}]');
        expect(_.wrap([1, 2, 3], filterFn))
          .to.throw('should be of type [string], value was [[1,2,3]]');
      });
    });
  });

  describe('object schema add-ons', () => {
    describe('togetherWith', () => {
      it('should be a function', () => {
        assert.isFunction(togetherWith);
      });
    });

    describe('banned', () => {
      const filterFn = (item) => {
        schema({ foo: schema().banned() })(item);
      };

      it('should not error on input that does *not* contain banned field', () => {
        assert.doesNotThrow(_.wrap({ bar: true }, filterFn), Error);
      });

      it('should error on input that contains banned field', () => {
        expect(_.wrap({ foo: false }, filterFn))
          .to.throw('.foo should not exist, but found with value [false]');
      });
    });

    describe('ifExists', () => {
      const filterFn = (item) => {
        schema({ foo: schema().ifExists().boolean() })(item);
      };

      it('should not error on absence of optional field', () => {
        assert.doesNotThrow(_.wrap({}, filterFn), Error);
      });

      it('should check contents of optional field when present', () => {
        expect(_.wrap({ foo: 1 }, filterFn)).to.throw('should be of type [boolean], value was [1]');
        assert.doesNotThrow(_.wrap({ foo: false }, filterFn), Error);
      });
    });

    describe('isNull', () => {
      const filterFn = (item) => {
        schema({ foo: schema().isNull() })(item);
      };

      it('should not error on `null` input', () => {
        assert.doesNotThrow(_.wrap({ foo: null }, filterFn), Error);
      });

      it('should error if field is absent (= undefined)', () => {
        expect(_.wrap({}, filterFn)).to.throw('.foo is required');
      });

      it('should error on non-`null` input', () => {
        expect(_.wrap({ foo: 1 }, filterFn)).to.throw('.foo should be null, got [1]');
      });
    });
  });
});
