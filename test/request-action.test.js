'use strict';
/* global Response, Request */
const assert = require('chai').assert;
const {RequestLogicAction} = require('../request-action.js');
global.self = global;
require('whatwg-fetch');

describe('Response::_getData()', function() {
  describe('Body', function() {
    const action = {
      source: 'response.body',
      action: 'assign-variable',
      destination: 'myVar'
    };
    describe('XML', function() {
      const xml = `<?xml version="1.0"?>
      <people xmlns:xul="some.xul" boolean-attribute>
        <person db-id="test1">
        	<name first="george" last="bush" />
        	<address street="1600 pennsylvania avenue" city="washington" country="usa"/>
        	<phoneNumber>202-456-1111</phoneNumber>
        </person>
        <person db-id="test2">
        	<name first="tony" last="blair" />
        	<address street="10 downing street" city="london" country="uk"/>
        	<phoneNumber>020 7925 0918</phoneNumber>
        </person>
      </people>`;

      var logic;
      var response;
      beforeEach(function() {
        logic = new RequestLogicAction(action);
        response = new Response(xml, {
          headers: {
            'content-type': 'application/xml'
          }
        });
        logic._response = response;
        return logic._prepareBodyValues(undefined, logic._response);
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result.indexOf('<name') !== -1);
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person', '1', 'phoneNumber'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, '020 7925 0918');
      });

      it('Gets attribute value', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person', '0', 'attr(db-id)'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test1');
      });

      it('Gets attribute value 2', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person', '1', 'name', 'attr(first)'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'tony');
      });

      it('Gets attribute value 3', function() {
        logic._sourcePath = ['response', 'body', 'people', 'attr(xmlns:xul)'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'some.xul');
      });

      it('Gets boolean attribute value', function() {
        logic._sourcePath = ['response', 'body', 'people', 'attr(boolean-attribute)'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result);
      });
    });

    describe('JSON', function() {
      const json = `{
        "nextPageToken": "test-token",
        "data": [{
          "name": "test1"
        }, {
          "name": "test2"
        }, {
          "name": "test3",
          "value": "array",
          "deep": {
            "booleanValue": true,
            "nullValue": null,
            "numberValue": 2,
            "arrayValue": ["test1", "test2"]
          }
        }]
      }`;
      var logic;
      var response;
      beforeEach(function() {
        logic = new RequestLogicAction(action);
        response = new Response(json, {
          headers: {
            'content-type': 'application/json'
          }
        });
        logic._response = response;
        return logic._prepareBodyValues(undefined, logic._response);
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['response', 'body', 'nextPageToken'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test-token');
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['response', 'body', 'data', '1', 'name'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test2');
      });

      it('Returns boolean value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'booleanValue'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result);
      });

      it('Returns null value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'nullValue'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result === null);
      });

      it('Returns numeric value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'numberValue'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 2);
      });

      it('Returns array value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'arrayValue', '1'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test2');
      });
    });
  });

  describe('Headers', function() {
    const action = {
      source: 'response.headers',
      action: 'assign-variable',
      destination: 'myVar'
    };
    var logic;
    var response;
    beforeEach(function() {
      logic = new RequestLogicAction(action);
      response = new Response('{}', {
        headers: {
          'content-type': 'application/xml',
          'x-www-token': 'test-token',
          'content-encoding': 'gzip'
        }
      });
      logic._response = response;
    });

    it('Should get a value for default header', function() {
      logic._sourcePath = ['response', 'headers', 'content-type'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'application/xml');
    });

    it('Should get a value for custom header', function() {
      logic._sourcePath = ['response', 'headers', 'x-www-token'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'test-token');
    });

    it('Should return undefined for whole headers object', function() {
      logic._sourcePath = ['response', 'headers'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, undefined);
    });

    it('Should return undefined for not existing header', function() {
      logic._sourcePath = ['response', 'headers', 'not-there'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, undefined);
    });
  });

  describe('URL', function() {
    const action = {
      source: 'response.url',
      action: 'assign-variable',
      destination: 'myVar'
    };
    var logic;
    var response;
    const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
    beforeEach(function() {
      logic = new RequestLogicAction(action);
      response = new Response('{}', {
        url: url
      });
      logic._response = response;
    });

    it('Should get whole URL', function() {
      logic._sourcePath = ['response', 'url'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, url);
    });

    it('Should read the host value', function() {
      logic._sourcePath = ['response', 'url', 'host'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'auth.domain.com');
    });

    it('Should read the protocol value', function() {
      logic._sourcePath = ['response', 'url', 'protocol'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'https:');
    });

    it('Should read the path value', function() {
      logic._sourcePath = ['response', 'url', 'path'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, '/path/auth');
    });

    it('Should read the whole query value', function() {
      logic._sourcePath = ['response', 'url', 'query'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'query=value&a=b');
    });

    it('Should read the query parameter value', function() {
      logic._sourcePath = ['response', 'url', 'query', 'query'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'value');
    });

    it('Should read the query parameter 2', function() {
      logic._sourcePath = ['response', 'url', 'query', 'a'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'b');
    });

    it('Should return undefined for unknown query parameter', function() {
      logic._sourcePath = ['response', 'url', 'query', 'c'];
      const result = logic._getData(logic._sourcePath);
      assert.isUndefined(result);
    });

    it('Should read the whole hash value', function() {
      logic._sourcePath = ['response', 'url', 'hash'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'hparam=hvalue&c=d');
    });

    it('Should read the hash parameter value', function() {
      logic._sourcePath = ['response', 'url', 'hash', 'hparam'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'hvalue');
    });

    it('Should read the hash parameter 2', function() {
      logic._sourcePath = ['response', 'url', 'hash', 'c'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'd');
    });

    it('Should return undefined for unknown hash parameter', function() {
      logic._sourcePath = ['response', 'url', 'hash', 'e'];
      const result = logic._getData(logic._sourcePath);
      assert.isUndefined(result);
    });
  });
});

describe('Request::_getData()', function() {
  describe('Body', function() {
    const action = {
      source: 'request.body',
      action: 'assign-variable',
      destination: 'myVar'
    };
    describe('XML', function() {
      const xml = `<?xml version="1.0"?>
      <people xmlns:xul="some.xul" boolean-attribute>
        <person db-id="test1">
          <name first="george" last="bush" />
          <address street="1600 pennsylvania avenue" city="washington" country="usa"/>
          <phoneNumber>202-456-1111</phoneNumber>
        </person>
        <person db-id="test2">
          <name first="tony" last="blair" />
          <address street="10 downing street" city="london" country="uk"/>
          <phoneNumber>020 7925 0918</phoneNumber>
        </person>
      </people>`;

      var logic;
      var request;
      beforeEach(function() {
        logic = new RequestLogicAction(action);
        request = new Request('https://domain.com', {
          body: xml,
          headers: {
            'content-type': 'application/xml'
          },
          method: 'POST'
        });
        logic._request = request;
        return logic._prepareBodyValues(request, undefined);
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result.indexOf('<name') !== -1);
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person', '1', 'phoneNumber'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, '020 7925 0918');
      });

      it('Gets attribute value', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person', '0', 'attr(db-id)'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test1');
      });

      it('Gets attribute value 2', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person', '1', 'name', 'attr(first)'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'tony');
      });

      it('Gets attribute value 3', function() {
        logic._sourcePath = ['request', 'body', 'people', 'attr(xmlns:xul)'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'some.xul');
      });

      it('Gets boolean attribute value', function() {
        logic._sourcePath = ['request', 'body', 'people', 'attr(boolean-attribute)'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result);
      });
    });

    describe('JSON', function() {
      const json = `{
        "nextPageToken": "test-token",
        "data": [{
          "name": "test1"
        }, {
          "name": "test2"
        }, {
          "name": "test3",
          "value": "array",
          "deep": {
            "booleanValue": true,
            "nullValue": null,
            "numberValue": 2,
            "arrayValue": ["test1", "test2"]
          }
        }]
      }`;
      var logic;
      var request;
      beforeEach(function() {
        logic = new RequestLogicAction(action);
        request = new Request('http://domain.com', {
          body: json,
          headers: {
            'content-type': 'application/json'
          },
          method: 'POST'
        });
        logic._request = request;
        return logic._prepareBodyValues(request, undefined);
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['request', 'body', 'nextPageToken'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test-token');
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['request', 'body', 'data', '1', 'name'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test2');
      });

      it('Returns boolean value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'booleanValue'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result);
      });

      it('Returns null value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'nullValue'];
        const result = logic._getData(logic._sourcePath);
        assert.isTrue(result === null);
      });

      it('Returns numeric value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'numberValue'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 2);
      });

      it('Returns array value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'arrayValue', '1'];
        const result = logic._getData(logic._sourcePath);
        assert.equal(result, 'test2');
      });
    });
  });

  describe('Headers', function() {
    const action = {
      source: 'request.headers',
      action: 'assign-variable',
      destination: 'myVar'
    };
    var logic;
    var request;
    beforeEach(function() {
      logic = new RequestLogicAction(action);
      request = new Request('http://domain.com', {
        headers: {
          'content-type': 'application/xml',
          'x-www-token': 'test-token',
          'content-encoding': 'gzip'
        }
      });
      logic._request = request;
    });

    it('Should get a value for default header', function() {
      logic._sourcePath = ['request', 'headers', 'content-type'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'application/xml');
    });

    it('Should get a value for custom header', function() {
      logic._sourcePath = ['request', 'headers', 'x-www-token'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'test-token');
    });

    it('Should return undefined for whole headers object', function() {
      logic._sourcePath = ['request', 'headers'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, undefined);
    });

    it('Should return undefined for not existing header', function() {
      logic._sourcePath = ['request', 'headers', 'not-there'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, undefined);
    });
  });

  describe('URL', function() {
    const action = {
      source: 'response.url',
      action: 'assign-variable',
      destination: 'myVar'
    };
    var logic;
    var request;
    const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
    beforeEach(function() {
      logic = new RequestLogicAction(action);
      request = new Request(url);
      logic._request = request;
    });

    it('Should get whole URL', function() {
      logic._sourcePath = ['request', 'url'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, url);
    });

    it('Should read the host value', function() {
      logic._sourcePath = ['request', 'url', 'host'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'auth.domain.com');
    });

    it('Should read the protocol value', function() {
      logic._sourcePath = ['request', 'url', 'protocol'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'https:');
    });

    it('Should read the path value', function() {
      logic._sourcePath = ['request', 'url', 'path'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, '/path/auth');
    });

    it('Should read the whole query value', function() {
      logic._sourcePath = ['request', 'url', 'query'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'query=value&a=b');
    });

    it('Should read the query parameter value', function() {
      logic._sourcePath = ['request', 'url', 'query', 'query'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'value');
    });

    it('Should read the query parameter 2', function() {
      logic._sourcePath = ['request', 'url', 'query', 'a'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'b');
    });

    it('Should return undefined for unknown query parameter', function() {
      logic._sourcePath = ['request', 'url', 'query', 'c'];
      const result = logic._getData(logic._sourcePath);
      assert.isUndefined(result);
    });

    it('Should read the whole hash value', function() {
      logic._sourcePath = ['request', 'url', 'hash'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'hparam=hvalue&c=d');
    });

    it('Should read the hash parameter value', function() {
      logic._sourcePath = ['request', 'url', 'hash', 'hparam'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'hvalue');
    });

    it('Should read the hash parameter 2', function() {
      logic._sourcePath = ['request', 'url', 'hash', 'c'];
      const result = logic._getData(logic._sourcePath);
      assert.equal(result, 'd');
    });

    it('Should return undefined for unknown hash parameter', function() {
      logic._sourcePath = ['request', 'url', 'hash', 'e'];
      const result = logic._getData(logic._sourcePath);
      assert.isUndefined(result);
    });
  });
});

describe('_getDataUrl()', function() {
  const action = {
    source: 'request.url',
    action: 'assign-variable',
    destination: 'myVar'
  };
  const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
  var logic;
  beforeEach(function() {
    logic = new RequestLogicAction(action);
  });

  it('Should return the url value', function() {
    const result = logic._getDataUrl(url, []);
    assert.equal(result, url);
  });

  it('Should read the host value', function() {
    const result = logic._getDataUrl(url, ['host']);
    assert.equal(result, 'auth.domain.com');
  });

  it('Should read the protocol value', function() {
    const result = logic._getDataUrl(url, ['protocol']);
    assert.equal(result, 'https:');
  });

  it('Should read the path value', function() {
    const result = logic._getDataUrl(url, ['path']);
    assert.equal(result, '/path/auth');
  });

  it('Should read the whole query value', function() {
    const result = logic._getDataUrl(url, ['query']);
    assert.equal(result, 'query=value&a=b');
  });

  it('Should read the query parameter value', function() {
    const result = logic._getDataUrl(url, ['query', 'query']);
    assert.equal(result, 'value');
  });

  it('Should read the query parameter 2', function() {
    const result = logic._getDataUrl(url, ['query', 'a']);
    assert.equal(result, 'b');
  });

  it('Should return undefined for unknown query parameter', function() {
    const result = logic._getDataUrl(url, ['query', 'c']);
    assert.isUndefined(result);
  });

  it('Should read the whole hash value', function() {
    const result = logic._getDataUrl(url, ['hash']);
    assert.equal(result, 'hparam=hvalue&c=d');
  });

  it('Should read the hash parameter value', function() {
    const result = logic._getDataUrl(url, ['hash', 'hparam']);
    assert.equal(result, 'hvalue');
  });

  it('Should read the hash parameter 2', function() {
    const result = logic._getDataUrl(url, ['hash', 'c']);
    assert.equal(result, 'd');
  });

  it('Should return undefined for unknown hash parameter', function() {
    const result = logic._getDataUrl(url, ['hash', 'e']);
    assert.isUndefined(result);
  });
});

describe('_performAction()', function() {
  const action = {
    source: 'request.url',
    action: 'assign-variable',
    destination: 'myVar',
    permament: true
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

  it('Emits permament property', function(done) {
    logic.once('variable-update-action', function(detail) {
      assert.isTrue(detail.permament);
      done();
    });
    logic._performAction(value);
  });
});

describe('run()', function() {
  const action = {
    source: 'request.url.hash.hparam',
    action: 'assign-variable',
    destination: 'myVar',
    permament: true
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
});
