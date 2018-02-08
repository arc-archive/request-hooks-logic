'use strict';
/* global Response, Request */
const assert = require('chai').assert;
const {DataExtractor} = require('../data-extractor.js');
global.self = global;
require('whatwg-fetch');

const xmlStr = `<?xml version="1.0"?>
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
const jsonStr = `{
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

describe('Response::extract()', function() {
  describe('Body', function() {
    describe('XML', function() {
      var logic;
      beforeEach(function() {
        const response = new Response(xmlStr, {
          headers: {
            'content-type': 'application/xml'
          }
        });
        logic = new DataExtractor({
          response: response,
          request: new Request('/'),
          responseBody: xmlStr
        });
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result.indexOf('<name') !== -1);
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person', '1', 'phoneNumber'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, '020 7925 0918');
      });

      it('Gets attribute value', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person', '0', 'attr(db-id)'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test1');
      });

      it('Gets attribute value 2', function() {
        logic._sourcePath = ['response', 'body', 'people', 'person', '1', 'name', 'attr(first)'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'tony');
      });

      it('Gets attribute value 3', function() {
        logic._sourcePath = ['response', 'body', 'people', 'attr(xmlns:xul)'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'some.xul');
      });

      it('Gets boolean attribute value', function() {
        logic._sourcePath = ['response', 'body', 'people', 'attr(boolean-attribute)'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result);
      });
    });

    describe('JSON', function() {
      var logic;
      beforeEach(function() {
        const response = new Response(jsonStr, {
          headers: {
            'content-type': 'application/json'
          }
        });
        logic = new DataExtractor({
          response: response,
          request: new Request('/'),
          responseBody: jsonStr
        });
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['response', 'body', 'nextPageToken'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test-token');
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['response', 'body', 'data', '1', 'name'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test2');
      });

      it('Returns boolean value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'booleanValue'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result);
      });

      it('Returns null value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'nullValue'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result === null);
      });

      it('Returns numeric value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'numberValue'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 2);
      });

      it('Returns array value', function() {
        logic._sourcePath = ['response', 'body', 'data', '2', 'deep', 'arrayValue', '1'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test2');
      });
    });
  });

  describe('Headers', function() {
    var logic;
    beforeEach(function() {
      const response = new Response('{}', {
        headers: {
          'content-type': 'application/xml',
          'x-www-token': 'test-token',
          'content-encoding': 'gzip'
        }
      });
      logic = new DataExtractor({
        response: response,
        request: new Request('/')
      });
    });

    it('Should get a value for default header', function() {
      logic._sourcePath = ['response', 'headers', 'content-type'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'application/xml');
    });

    it('Should get a value for custom header', function() {
      logic._sourcePath = ['response', 'headers', 'x-www-token'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'test-token');
    });

    it('Should return undefined for whole headers object', function() {
      logic._sourcePath = ['response', 'headers'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, undefined);
    });

    it('Should return undefined for not existing header', function() {
      logic._sourcePath = ['response', 'headers', 'not-there'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, undefined);
    });
  });

  describe('URL', function() {
    var logic;
    const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
    beforeEach(function() {
      const response = new Response('{}', {
        url: url
      });
      logic = new DataExtractor({
        response: response,
        request: new Request('/')
      });
    });

    it('Should get whole URL', function() {
      logic._sourcePath = ['response', 'url'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, url);
    });

    it('Should read the host value', function() {
      logic._sourcePath = ['response', 'url', 'host'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'auth.domain.com');
    });

    it('Should read the protocol value', function() {
      logic._sourcePath = ['response', 'url', 'protocol'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'https:');
    });

    it('Should read the path value', function() {
      logic._sourcePath = ['response', 'url', 'path'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, '/path/auth');
    });

    it('Should read the whole query value', function() {
      logic._sourcePath = ['response', 'url', 'query'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'query=value&a=b');
    });

    it('Should read the query parameter value', function() {
      logic._sourcePath = ['response', 'url', 'query', 'query'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'value');
    });

    it('Should read the query parameter 2', function() {
      logic._sourcePath = ['response', 'url', 'query', 'a'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'b');
    });

    it('Should return undefined for unknown query parameter', function() {
      logic._sourcePath = ['response', 'url', 'query', 'c'];
      const result = logic.extract(logic._sourcePath);
      assert.isUndefined(result);
    });

    it('Should read the whole hash value', function() {
      logic._sourcePath = ['response', 'url', 'hash'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'hparam=hvalue&c=d');
    });

    it('Should read the hash parameter value', function() {
      logic._sourcePath = ['response', 'url', 'hash', 'hparam'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'hvalue');
    });

    it('Should read the hash parameter 2', function() {
      logic._sourcePath = ['response', 'url', 'hash', 'c'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'd');
    });

    it('Should return undefined for unknown hash parameter', function() {
      logic._sourcePath = ['response', 'url', 'hash', 'e'];
      const result = logic.extract(logic._sourcePath);
      assert.isUndefined(result);
    });
  });
});

describe('Request::extract()', function() {
  describe('Body', function() {
    describe('XML', function() {
      var logic;
      beforeEach(function() {
        const request = new Request('http://domain.com', {
          headers: {
            'content-type': 'application/xml'
          },
          body: xmlStr,
          method: 'POST'
        });
        logic = new DataExtractor({
          response: new Response('<atom></atom>'),
          request: request,
          requestBody: xmlStr
        });
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result.indexOf('<name') !== -1);
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person', '1', 'phoneNumber'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, '020 7925 0918');
      });

      it('Gets attribute value', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person', '0', 'attr(db-id)'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test1');
      });

      it('Gets attribute value 2', function() {
        logic._sourcePath = ['request', 'body', 'people', 'person', '1', 'name', 'attr(first)'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'tony');
      });

      it('Gets attribute value 3', function() {
        logic._sourcePath = ['request', 'body', 'people', 'attr(xmlns:xul)'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'some.xul');
      });

      it('Gets boolean attribute value', function() {
        logic._sourcePath = ['request', 'body', 'people', 'attr(boolean-attribute)'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result);
      });
    });

    describe('JSON', function() {
      var logic;
      beforeEach(function() {
        const request = new Request('http://domain.com', {
          headers: {
            'content-type': 'application/json'
          },
          body: jsonStr,
          method: 'POST'
        });
        logic = new DataExtractor({
          response: new Response('<atom></atom>'),
          request: request,
          requestBody: jsonStr
        });
      });

      it('Parses simple path', function() {
        logic._sourcePath = ['request', 'body', 'nextPageToken'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test-token');
      });

      it('Parses complex path', function() {
        logic._sourcePath = ['request', 'body', 'data', '1', 'name'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test2');
      });

      it('Returns boolean value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'booleanValue'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result);
      });

      it('Returns null value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'nullValue'];
        const result = logic.extract(logic._sourcePath);
        assert.isTrue(result === null);
      });

      it('Returns numeric value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'numberValue'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 2);
      });

      it('Returns array value', function() {
        logic._sourcePath = ['request', 'body', 'data', '2', 'deep', 'arrayValue', '1'];
        const result = logic.extract(logic._sourcePath);
        assert.equal(result, 'test2');
      });
    });
  });

  describe('Headers', function() {
    var logic;
    beforeEach(function() {
      const request = new Request('http://domain.com', {
        headers: {
          'content-type': 'application/xml',
          'x-www-token': 'test-token',
          'content-encoding': 'gzip'
        }
      });
      logic = new DataExtractor({
        response: new Response('<atom></atom>'),
        request: request,
        requestBody: xmlStr
      });
    });

    it('Should get a value for default header', function() {
      logic._sourcePath = ['request', 'headers', 'content-type'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'application/xml');
    });

    it('Should get a value for custom header', function() {
      logic._sourcePath = ['request', 'headers', 'x-www-token'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'test-token');
    });

    it('Should return undefined for whole headers object', function() {
      logic._sourcePath = ['request', 'headers'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, undefined);
    });

    it('Should return undefined for not existing header', function() {
      logic._sourcePath = ['request', 'headers', 'not-there'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, undefined);
    });
  });

  describe('URL', function() {
    var logic;
    const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
    beforeEach(function() {
      const request = new Request(url);
      logic = new DataExtractor({
        response: new Response('<atom></atom>'),
        request: request,
        requestBody: jsonStr
      });
    });

    it('Should get whole URL', function() {
      logic._sourcePath = ['request', 'url'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, url);
    });

    it('Should read the host value', function() {
      logic._sourcePath = ['request', 'url', 'host'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'auth.domain.com');
    });

    it('Should read the protocol value', function() {
      logic._sourcePath = ['request', 'url', 'protocol'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'https:');
    });

    it('Should read the path value', function() {
      logic._sourcePath = ['request', 'url', 'path'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, '/path/auth');
    });

    it('Should read the whole query value', function() {
      logic._sourcePath = ['request', 'url', 'query'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'query=value&a=b');
    });

    it('Should read the query parameter value', function() {
      logic._sourcePath = ['request', 'url', 'query', 'query'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'value');
    });

    it('Should read the query parameter 2', function() {
      logic._sourcePath = ['request', 'url', 'query', 'a'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'b');
    });

    it('Should return undefined for unknown query parameter', function() {
      logic._sourcePath = ['request', 'url', 'query', 'c'];
      const result = logic.extract(logic._sourcePath);
      assert.isUndefined(result);
    });

    it('Should read the whole hash value', function() {
      logic._sourcePath = ['request', 'url', 'hash'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'hparam=hvalue&c=d');
    });

    it('Should read the hash parameter value', function() {
      logic._sourcePath = ['request', 'url', 'hash', 'hparam'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'hvalue');
    });

    it('Should read the hash parameter 2', function() {
      logic._sourcePath = ['request', 'url', 'hash', 'c'];
      const result = logic.extract(logic._sourcePath);
      assert.equal(result, 'd');
    });

    it('Should return undefined for unknown hash parameter', function() {
      logic._sourcePath = ['request', 'url', 'hash', 'e'];
      const result = logic.extract(logic._sourcePath);
      assert.isUndefined(result);
    });
  });
});

describe('_getDataUrl()', function() {
  const url = 'https://auth.domain.com/path/auth?query=value&a=b#hparam=hvalue&c=d';
  var logic;
  beforeEach(function() {
    const request = new Request(url);
    logic = new DataExtractor({
      response: new Response('<atom></atom>'),
      request: request
    });
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
