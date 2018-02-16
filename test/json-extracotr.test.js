'use strict';
/* global Response, Request */
const assert = require('chai').assert;
const {JsonExtractor} = require('../');
describe('Extracts paths', function() {
  const json = `
  {
    "items": [{
      "id": "id1",
      "name": {
        "first": "Test"
      }
    }, {
      "id": "id2",
      "name": {
        "first": "Brown"
      }
    }],
    "nextPageToken": "testToken",
    "deep": {
      "object": {
        "value": "true"
      }
    }
  }
  `;
  var extractor;
  it('Reads first level value', function() {
    extractor = new JsonExtractor(json, 'nextPageToken');
    const result = extractor.extract();
    assert.equal(result, 'testToken');
  });

  it('Reads deep object value', function() {
    extractor = new JsonExtractor(json, 'deep.object.value');
    const result = extractor.extract();
    assert.equal(result, 'true');
  });

  it('Reads array value', function() {
    extractor = new JsonExtractor(json, 'items.1.id');
    const result = extractor.extract();
    assert.equal(result, 'id2');
  });

  it('Reads array deep value', function() {
    extractor = new JsonExtractor(json, 'items.1.name.first');
    const result = extractor.extract();
    assert.equal(result, 'Brown');
  });

  it('Returns undefined for unknown path', function() {
    extractor = new JsonExtractor(json, 'items.2.name.first');
    const result = extractor.extract();
    assert.isUndefined(result);
  });

  it('Returns undefined for unknown json', function() {
    extractor = new JsonExtractor(undefined, 'items.2.name.first');
    const result = extractor.extract();
    assert.isUndefined(result, 'Brown');
  });
});

describe('Array JSON', function() {
  const json = [{
    id: 'id1',
    name: {
      first: 'Test',
      last: 'Name'
    }
  }, {
    id: 'id2',
    name: {
      first: 'Brown',
      last: 'test2'
    }
  }];
  var extractor;
  it('Reads array value without iterator', function() {
    extractor = new JsonExtractor(json, '0.id');
    const result = extractor.extract();
    assert.equal(result, 'id1');
  });

  it('Reads deep array value without iterator', function() {
    extractor = new JsonExtractor(json, '0.name.first');
    const result = extractor.extract();
    assert.equal(result, 'Test');
  });
});

describe('Iterators', function() {
  describe('Object value', function() {
    const json = `
    {
      "items": [{
        "id": "id1",
        "name": {
          "first": "Test",
          "last": "Last test"
        }
      }, {
        "id": "id2",
        "name": {
          "first": "Adam",
          "last": "Brown"
        }
      }]
    }
    `;
    const iterator = {
      source: 'items.*.name.last',
      operator: 'equal',
      condition: 'Brown'
    };
    var extractor;
    it('Reads iterable value', function() {
      extractor = new JsonExtractor(json, 'id', iterator);
      const result = extractor.extract();
      assert.equal(result, 'id2');
    });

    it('Reads iterable deep value', function() {
      extractor = new JsonExtractor(json, 'name.first', iterator);
      const result = extractor.extract();
      assert.equal(result, 'Adam');
    });
  });

  describe('Array value', function() {
    const json = [{
      id: 'id1',
      name: {
        first: 'Test',
        last: 'Name'
      }
    }, {
      id: 'id2',
      name: {
        first: 'Brown',
        last: 'test2'
      }
    }];
    const iterator = {
      source: '*.name.first',
      operator: 'equal',
      condition: 'Brown'
    };
    var extractor;
    it('Reads simple path value', function() {
      extractor = new JsonExtractor(json, 'id', iterator);
      const result = extractor.extract();
      assert.equal(result, 'id2');
    });

    it('Reads deep path value', function() {
      extractor = new JsonExtractor(json, 'name.last', iterator);
      const result = extractor.extract();
      assert.equal(result, 'test2');
    });
  });

  describe('Iteration over objects', function() {
    const json = {
      id: 'id1',
      properties: {
        first: 'Test',
        last: 'Name',
        id: 'testid'
      },
      deep: {
        value: {
          properties: {
            first: 'Test',
            last: 'Name',
            id: 'testid2'
          }
        }
      }
    };
    const iterator = {
      source: 'properties.*.first',
      operator: 'equal',
      condition: 'Test'
    };
    var extractor;
    it('Reads simple path value', function() {
      extractor = new JsonExtractor(json, 'id', iterator);
      const result = extractor.extract();
      assert.equal(result, 'testid');
    });

    it('Reads simple path value', function() {
      iterator.source = 'deep.value.properties.*.first';
      extractor = new JsonExtractor(json, 'id', iterator);
      const result = extractor.extract();
      assert.equal(result, 'testid2');
    });
  });
});
