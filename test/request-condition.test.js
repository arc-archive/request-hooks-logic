'use strict';
const assert = require('chai').assert;
const {RequestLogicCondition} = require('../request-condition.js');

describe('RequestLogicCondition', function() {
  const args = {
    source: 'test',
    operator: 'op',
    condition: 'test'
  };
  var c;
  describe('isEqual()', function() {
    beforeEach(function() {
      c = new RequestLogicCondition(args);
    });

    it('"a" equals "a"', function() {
      var result = c.isEqual('a', 'a');
      assert.isTrue(result);
    });

    it('"12" equals "12"', function() {
      var result = c.isEqual('12', '12');
      assert.isTrue(result);
    });

    it('"12" equals 12', function() {
      var result = c.isEqual('12', 12);
      assert.isTrue(result);
    });

    it('true equals true', function() {
      var result = c.isEqual(true, true);
      assert.isTrue(result);
    });

    it('"true" equals true', function() {
      var result = c.isEqual('true', true);
      assert.isTrue(result);
    });

    it('true equals "true"', function() {
      var result = c.isEqual(true, 'true');
      assert.isTrue(result);
    });

    it('false equals false', function() {
      var result = c.isEqual(false, false);
      assert.isTrue(result);
    });

    it('"false" equals false', function() {
      var result = c.isEqual('false', false);
      assert.isTrue(result);
    });

    it('false equals "false"', function() {
      var result = c.isEqual(false, 'false');
      assert.isTrue(result);
    });

    it('"a" not equals "b"', function() {
      var result = c.isEqual('a', 'b');
      assert.isFalse(result);
    });

    it('12 equals "12"', function() {
      var result = c.isEqual(12, '12');
      assert.isTrue(result);
    });
  });
  describe('isNotEqual()', function() {
    beforeEach(function() {
      c = new RequestLogicCondition(args);
    });

    it('"a" equals "a"', function() {
      var result = c.isNotEqual('a', 'a');
      assert.isFalse(result);
    });

    it('"12" equals "12"', function() {
      var result = c.isNotEqual('12', '12');
      assert.isFalse(result);
    });

    it('"12" equals 12', function() {
      var result = c.isNotEqual('12', 12);
      assert.isFalse(result);
    });

    it('true equals true', function() {
      var result = c.isNotEqual(true, true);
      assert.isFalse(result);
    });

    it('"true" equals true', function() {
      var result = c.isNotEqual('true', true);
      assert.isFalse(result);
    });

    it('true equals "true"', function() {
      var result = c.isNotEqual(true, 'true');
      assert.isFalse(result);
    });

    it('false equals false', function() {
      var result = c.isNotEqual(false, false);
      assert.isFalse(result);
    });

    it('"false" equals false', function() {
      var result = c.isNotEqual('false', false);
      assert.isFalse(result);
    });

    it('false equals "false"', function() {
      var result = c.isNotEqual(false, 'false');
      assert.isFalse(result);
    });

    it('"a" not equals "b"', function() {
      var result = c.isNotEqual('a', 'b');
      assert.isTrue(result);
    });

    it('12 equals "12"', function() {
      var result = c.isNotEqual(12, '12');
      assert.isFalse(result);
    });
  });
});
