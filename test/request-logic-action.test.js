import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../request-logic-action.js';

describe('<request-logic-action>', function() {
  async function basicFixture() {
    return await fixture(`<request-logic-action jexlpath="ArcVariables.JexlDev"></request-logic-action>`);
  }

  describe('Basics', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Computes _sourcePath', () => {
      const path = 'a.b.c';
      const compare = ['a', 'b', 'c'];
      element.source = path;
      assert.deepEqual(element._sourcePath, compare);
    });

    it('Computes _conditions', () => {
      element.conditions = [{
        source: 'response.status',
        operator: 'equal',
        condition: 200,
        enabled: true
      }];
      assert.typeOf(element._conditions, 'array');
      assert.lengthOf(element._conditions, 1);
    });
  });

  describe('get extractor()', () => {
    let element;
    beforeEach(async function() {
      element = await basicFixture();
    });

    it('Returns request-data-extractor', () => {
      const result = element.extractor;
      assert.equal(result.nodeName, 'REQUEST-DATA-EXTRACTOR');
    });

    it('Creates reference handler', () => {
      const old = element.$;
      element.$ = undefined;
      const result = element.extractor;
      assert.ok(result);
      element.$ = old;
    });

    it('Reeturns existing element', () => {
      const result1 = element.extractor;
      const result2 = element.extractor;
      assert.isTrue(result1 === result2);
    });
  });

  describe('_prepareConditions()', () => {
    let element;
    let conditions;
    beforeEach(async function() {
      element = await basicFixture();
      conditions = [{
        source: 'response.status',
        operator: 'equal',
        condition: 200,
        enabled: true
      }, {
        source: 'request.url',
        operator: 'equal',
        condition: 'http://4',
        enabled: true
      }];
    });

    it('Returns undefined when no argument', () => {
      const result = element._prepareConditions();
      assert.isUndefined(result);
    });

    it('Returns an array of conditions', () => {
      const result = element._prepareConditions(conditions);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
      const item = result[0];
      assert.equal(item.nodeName, 'REQUEST-LOGIC-CONDITION');
    });

    it('Condition is enabled', () => {
      const result = element._prepareConditions(conditions);
      assert.isTrue(result[0].enabled);
    });

    it('Condition has source', () => {
      const result = element._prepareConditions(conditions);
      assert.equal(result[0].source, conditions[0].source);
    });

    it('Condition has operator', () => {
      const result = element._prepareConditions(conditions);
      assert.equal(result[0].operator, conditions[0].operator);
    });

    it('Condition has condition', () => {
      const result = element._prepareConditions(conditions);
      assert.equal(result[0].condition, conditions[0].condition);
    });

    it('Ignores not enabled items', () => {
      conditions[0].enabled = false;
      const result = element._prepareConditions(conditions);
      assert.lengthOf(result, 1);
      assert.equal(result[0].source, conditions[1].source);
    });
  });

  describe('_performAction()', function() {
    const action = {
      source: 'request.url',
      action: 'assign-variable',
      destination: 'myVar'
    };
    const value = 'test-value';
    let logic;
    beforeEach(async function() {
      logic = await basicFixture();
      logic.source = action.source;
      logic.action = action.action;
      logic.destination = action.destination;
    });

    it('Emits variable-update-action event', function(done) {
      logic.addEventListener('variable-update-action', function clb(e) {
        logic.removeEventListener('variable-update-action', clb);
        assert.typeOf(e.detail, 'object');
        done();
      });
      logic._performAction(value);
    });

    it('Emits variable property', function(done) {
      logic.addEventListener('variable-update-action', function clb(e) {
        logic.removeEventListener('variable-update-action', clb);
        assert.equal(e.detail.variable, action.destination);
        done();
      });
      logic._performAction(value);
    });

    it('Emits value property (on window)', function(done) {
      window.addEventListener('variable-update-action', function clb(e) {
        window.removeEventListener('variable-update-action', clb);
        assert.equal(e.detail.value, value);
        done();
      });
      logic._performAction(value);
    });

    it('Throws when action is unknown', function() {
      logic.action = 'test';
      assert.throws(() => {
        logic._performAction(value);
      }, 'Unknown action: test');
    });
  });

  describe('_areConditionsMeet()', () => {
    let element;
    beforeEach(async function() {
      element = await basicFixture();
      element.conditions = [{
        source: 'request.url',
        operator: 'equal',
        condition: 'http://test',
        enabled: true
      }];
    });

    it('Returns true if no conditions', () => {
      element.conditions = undefined;
      const result = element._areConditionsMeet({}, {});
      assert.isTrue(result);
    });

    it('Returns true if conditions are empty', () => {
      element.conditions = [{
        enabled: false
      }];
      const result = element._areConditionsMeet({}, {});
      assert.isTrue(result);
    });

    it('Returns true when conditions are satisfied', () => {
      const result = element._areConditionsMeet({
        url: 'http://test'
      }, {});
      assert.isTrue(result);
    });

    it('Returns false when conditions are not satisfied', () => {
      const result = element._areConditionsMeet({
        url: 'https://test'
      }, {});
      assert.isFalse(result);
    });
  });

  describe('run()', function() {
    const action = {
      source: 'request.url.hash.hparam',
      action: 'assign-variable',
      destination: 'myVar'
    };
    const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
    let logic;
    let request;
    beforeEach(async function() {
      logic = await basicFixture();
      logic.source = action.source;
      logic.action = action.action;
      logic.destination = action.destination;
      request = {
        url,
        headers: 'content-type: application/xml\nx-www-token: ' +
          'test-token\ncontent-encoding: gzip'
      };
    });

    it('Returns a promise', function() {
      const result = logic.run(request);
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Calls _areConditionsMeet()', () => {
      const spy = sinon.spy(logic, '_areConditionsMeet');
      return logic.run(request)
      .then(() => {
        assert.isTrue(spy.called);
      });
    });

    it('Calls _execute()', () => {
      const spy = sinon.spy(logic, '_execute');
      return logic.run(request, {})
      .then(() => {
        assert.isTrue(spy.called, 'Function is called');
        assert.isTrue(spy.args[0][0] === request);
        assert.deepEqual(spy.args[0][1], {});
      });
    });

    it('Promise returns false when conditions are not met', () => {
      logic.conditions = [{
        source: 'request.url',
        operator: 'equal',
        condition: 'http://test',
        enabled: true
      }];
      return logic.run(request)
      .then((result) => {
        assert.isFalse(result);
      });
    });

    it('Fires variable-update-action event', function(done) {
      logic.addEventListener('variable-update-action', function clb(e) {
        logic.removeEventListener('variable-update-action', clb);
        assert.typeOf(e.detail, 'object');
        done();
      });
      logic.run(request);
    });

    it('Fires variable-store-action event (on window)', function(done) {
      window.addEventListener('variable-store-action', function clb(e) {
        window.removeEventListener('variable-store-action', clb);
        assert.typeOf(e.detail, 'object');
        done();
      });
      logic.action = 'store-variable';
      logic.run(request);
    });
  });
});
