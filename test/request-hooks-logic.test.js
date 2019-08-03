import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../request-hooks-logic.js';

describe('<request-hooks-logic>', function() {
  async function basicFixture() {
    return await fixture(`<request-hooks-logic jexlpath="ArcVariables.JexlDev"></request-hooks-logic>`);
  }

  describe('processActions()', () => {
    let element;
    let actions;
    let request;
    let response;
    beforeEach(async () => {
      element = await basicFixture();
      actions = [{
        source: 'request.url',
        action: 'assign-variable',
        destination: 'req-url'
      }, {
        source: 'response.url',
        action: 'assign-variable',
        destination: 'res-url'
      }];
      request = {
        method: 'GET',
        url: 'http://request'
      };
      response = {
        url: 'http://response'
      };
    });

    it('Rejects when no actions argument', () => {
      return element.processActions(undefined, request, response)
      .then(() => {
        throw new Error('Should not resolve');
      })
      .catch((cause) => {
        assert.equal(cause.message, 'Expecting 3 arguments.');
      });
    });

    it('Rejects when no request argument', () => {
      return element.processActions(actions, undefined, response)
      .then(() => {
        throw new Error('Should not resolve');
      })
      .catch((cause) => {
        assert.equal(cause.message, 'Expecting 3 arguments.');
      });
    });

    it('Rejects when no response argument', () => {
      return element.processActions(actions, request, undefined)
      .then(() => {
        throw new Error('Should not resolve');
      })
      .catch((cause) => {
        assert.equal(cause.message, 'Expecting 3 arguments.');
      });
    });

    it('Resolves the promise', () => {
      return element.processActions(actions, request, response);
    });

    it('Calls _evaluateAction() for each action', () => {
      const spy = sinon.spy(element, '_evaluateAction');
      return element.processActions(actions, request, response)
      .then(() => {
        assert.equal(spy.callCount, 2);
      });
    });

    it('Ignores disabled actions', () => {
      actions[0].enabled = false;
      const spy = sinon.spy(element, '_evaluateAction');
      return element.processActions(actions, request, response)
      .then(() => {
        assert.equal(spy.callCount, 1);
      });
    });

    it('Calls _runRecursive() for each action + 1 (when stopping)', () => {
      const spy = sinon.spy(element, '_runRecursive');
      return element.processActions(actions, request, response)
      .then(() => {
        assert.equal(spy.callCount, 3);
      });
    });
  });

  describe('_evaluateAction()', () => {
    let element;
    let actions;
    beforeEach(async () => {
      element = await basicFixture();
      actions = [{
        source: 'request.${sourceVar}',
        action: '${actionVar}',
        destination: 'req-url-${destVar}'
      }, {
        source: 'response.url',
        action: 'assign-variable',
        destination: 'res-url',
        iterator: {
          source: 'items.${sourceVar}',
          operator: '${opVar}',
          condition: 'cond-${condVar}'
        }
      }];
    });

    it('Calls _copyAction()', () => {
      const spy = sinon.spy(element, '_copyAction');
      return element._evaluateAction(actions[0])
      .then(() => {
        assert.equal(spy.callCount, 1);
      });
    });

    it('Evaluates action\'s source property', () => {
      return element._evaluateAction(actions[0])
      .then((action) => {
        assert.equal(action.source, 'request.undefined');
      });
    });

    it('Evaluates action\'s destination property', () => {
      return element._evaluateAction(actions[0])
      .then((action) => {
        assert.equal(action.destination, 'req-url-undefined');
      });
    });

    it('Skips action\'s action property', () => {
      return element._evaluateAction(actions[0])
      .then((action) => {
        assert.equal(action.action, '${actionVar}');
      });
    });

    it('Evaluates iterator\'s source property', () => {
      return element._evaluateAction(actions[1])
      .then((action) => {
        assert.equal(action.iterator.source, 'items.undefined');
      });
    });

    it('Evaluates iterator\'s condition property', () => {
      return element._evaluateAction(actions[1])
      .then((action) => {
        assert.equal(action.iterator.condition, 'cond-undefined');
      });
    });

    it('Skips iterator\'s operator property', () => {
      return element._evaluateAction(actions[1])
      .then((action) => {
        assert.equal(action.iterator.operator, '${opVar}');
      });
    });
  });

  describe('_copyAction()', () => {
    let element;
    let action;
    beforeEach(async () => {
      element = await basicFixture();
      action = {
        source: 'response.url',
        action: 'assign-variable',
        destination: 'res-url',
        iterator: {
          source: 'items.${sourceVar}',
          operator: '${opVar}',
          condition: 'cond-${condVar}'
        },
        conditions: [{
          enabled: true,
          source: 'response.status',
          operator: 'equal',
          condition: '200'
        }]
      };
    });

    it('Creates a copy of the main object', () => {
      const result = element._copyAction(action);
      const origValue = action.source;
      action.source = 'test';
      assert.equal(result.source, origValue);
    });

    it('Creates a copy of the iterator', () => {
      const result = element._copyAction(action);
      const origValue = action.iterator.source;
      action.iterator.source = 'test';
      assert.equal(result.iterator.source, origValue);
    });

    it('Creates a copy of the condition', () => {
      const result = element._copyAction(action);
      const origValue = action.conditions[0].source;
      action.conditions[0].source = 'test';
      assert.equal(result.conditions[0].source, origValue);
    });
  });

  describe('_createLogicElement()', () => {
    let element;
    let action;
    beforeEach(async () => {
      element = await basicFixture();
      action = {
        source: 'response.url',
        action: 'assign-variable',
        destination: 'res-url',
        hasIterator: true,
        iterator: {
          source: 'items.${sourceVar}',
          operator: '${opVar}',
          condition: 'cond-${condVar}'
        },
        conditions: [{
          enabled: true,
          source: 'response.status',
          operator: 'equal',
          condition: '200'
        }]
      };
    });

    it('Returns instance of the element', () => {
      const result = element._createLogicElement(action);
      assert.equal(result.nodeName, 'REQUEST-LOGIC-ACTION');
    });

    it('Inserts element into the shadow DOM', () => {
      element._createLogicElement(action);
      const node = element.shadowRoot.querySelector('request-logic-action');
      assert.equal(node.nodeName, 'REQUEST-LOGIC-ACTION');
    });

    it('Sets source property', () => {
      const result = element._createLogicElement(action);
      assert.equal(result.source, action.source);
    });

    it('Sets action property', () => {
      const result = element._createLogicElement(action);
      assert.equal(result.action, action.action);
    });

    it('Sets destination property', () => {
      const result = element._createLogicElement(action);
      assert.equal(result.destination, action.destination);
    });

    it('Sets conditions property', () => {
      const result = element._createLogicElement(action);
      assert.deepEqual(result.conditions, action.conditions);
    });

    it('Sets iterator property', () => {
      const result = element._createLogicElement(action);
      assert.deepEqual(result.iterator, action.iterator);
    });

    it('Sets iteratorEnabled property', () => {
      const result = element._createLogicElement(action);
      assert.equal(result.iteratorEnabled, action.hasIterator);
    });
  });

  describe('run-response-actions event', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    function fire(actions, request, response) {
      const e = new CustomEvent('run-response-actions', {
        bubbles: true,
        cancelable: true,
        detail: {
          actions,
          request,
          response
        }
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Event is not handled when cancelled', () => {
      document.body.addEventListener('run-response-actions', function f(e) {
        document.body.removeEventListener('run-response-actions', f);
        e.preventDefault();
      });
      const e = fire([], {}, {});
      assert.isUndefined(e.detail.result);
    });

    it('Event is handled', () => {
      const e = fire([], {}, {});
      assert.typeOf(e.detail.result.then, 'function');
    });

    it('Calls processActions()', () => {
      const spy = sinon.spy(element, 'processActions');
      fire([], {}, {});
      assert.isTrue(spy.called);
    });

    it('Result is rejected when no arguments', () => {
      const e = fire([], {});
      return e.detail.result
      .then(() => {
        throw new Error('Should not resolve');
      })
      .catch((cause) => {
        assert.equal(cause.message, 'Expecting 3 arguments.');
      });
    });
  });
});
