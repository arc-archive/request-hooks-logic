'use strict';
/* global Request, Response */
const assert = require('chai').assert;
const {RequestLogicAction} = require('..');
global.self = global;
require('whatwg-fetch');

describe('_performAction()', function() {
  const action = {
    source: 'request.url',
    action: 'assign-variable',
    destination: 'myVar'
  };
  const value = 'test-value';
  var logic;
  beforeEach(function() {
    logic = new RequestLogicAction(action);
  });

  it('Emits variable-update-action event', function(done) {
    logic.once('variable-update-action', function(detail) {
      assert.typeOf(detail, 'object');
      done();
    });
    logic._performAction(value);
  });

  it('Emits variable property', function(done) {
    logic.once('variable-update-action', function(detail) {
      assert.equal(detail.variable, action.destination);
      done();
    });
    logic._performAction(value);
  });

  it('Emits value property', function(done) {
    logic.once('variable-update-action', function(detail) {
      assert.equal(detail.value, value);
      done();
    });
    logic._performAction(value);
  });
});

describe('run()', function() {
  const action = {
    source: 'request.url.hash.hparam',
    action: 'assign-variable',
    destination: 'myVar'
  };
  const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
  var logic;
  var request;
  beforeEach(function() {
    logic = new RequestLogicAction(action);
    request = new Request(url, {
      headers: {
        'content-type': 'application/xml',
        'x-www-token': 'test-token',
        'content-encoding': 'gzip'
      }
    });
  });

  it('Run return the promise', function() {
    const result = logic.run(request);
    assert.typeOf(result.then, 'function');
  });

  it('Fires variable-update-action event', function(done) {
    logic.once('variable-update-action', function(detail) {
      assert.typeOf(detail, 'object');
      done();
    });
    logic.run(request);
  });

  it('Fires variable-store-action event', function(done) {
    logic.once('variable-store-action', function(detail) {
      assert.typeOf(detail, 'object');
      done();
    });
    logic._action = 'store-variable';
    logic.run(request);
  });
});

describe('Enabled state', function() {
  const action = {
    source: 'request.url.hash.hparam',
    action: 'assign-variable',
    destination: 'myVar',
    enabled: false
  };
  const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
  var logic;
  var request;
  beforeEach(function() {
    logic = new RequestLogicAction(action);
    request = new Request(url, {
      headers: {
        'content-type': 'application/xml',
        'x-www-token': 'test-token',
        'content-encoding': 'gzip'
      }
    });
  });

  it('Sets enables property to false', function() {
    assert.isFalse(logic.enabled);
  });

  it('Do not execute action', function() {
    let called = false;
    logic._prepareBodyValues = function() {
      called = true;
    };
    return logic.run(request, undefined)
    .then((result) => assert.isFalse(result))
    .then(() => assert.isFalse(called));
  });
});

describe('run() with conditions', function() {
  describe('Runs command', function() {
    const action = {
      source: 'request.url.hash.hparam',
      action: 'assign-variable',
      destination: 'myVar',
      conditions: [{
        source: 'response.status',
        operator: 'equal',
        condition: '200'
      }]
    };
    const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
    let logic;
    let request;
    let response;
    before(function() {
      request = new Request(url, {
        headers: {
          'content-type': 'application/xml',
          'x-www-token': 'test-token',
          'content-encoding': 'gzip'
        }
      });
      response = new Response('{}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-length': 2
        }
      });
    });
    beforeEach(function() {
      logic = new RequestLogicAction(action);
    });

    it('Runs command for single condition', function() {
      return logic.run(request, response)
      .then((result) => assert.isTrue(result));
    });

    it('Runs command for multiple conditions', function() {
      action.conditions.push({
        source: 'request.headers',
        operator: 'contains',
        condition: 'content-type'
      });
      return logic.run(request, response)
      .then((result) => assert.isTrue(result));
    });
  });

  describe('Do not run command', function() {
    const action = {
      source: 'request.url.hash.hparam',
      action: 'assign-variable',
      destination: 'myVar',
      conditions: [{
        source: 'response.status',
        operator: 'equal',
        condition: '200'
      }, {
        source: 'request.headers',
        operator: 'contains',
        condition: 'x-requested-with'
      }]
    };
    const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
    let logic;
    let request;
    let response;
    before(function() {
      request = new Request(url, {
        headers: {
          'content-type': 'application/xml',
          'x-www-token': 'test-token',
          'content-encoding': 'gzip'
        }
      });
      response = new Response('{}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-length': 2
        }
      });
    });

    beforeEach(function() {
      logic = new RequestLogicAction(action);
    });

    it('Do not run command for multiple conditions', function() {
      action.conditions.push();
      return logic.run(request, response)
      .then((result) => assert.isFalse(result));
    });
  });
});
