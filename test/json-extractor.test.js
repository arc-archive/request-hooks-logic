import { assert } from '@open-wc/testing';
import { ActionIterableObject, JsonExtractor } from '../request-data-extractor.js';

describe('JSON extracting', function() {
  describe('ActionIterableObject', () => {
    describe('constructor()', () => {
      let opts;
      beforeEach(() => {
        opts = {
          operator: 'equal',
          condition: 'test',
          source: 'properties.*.first'
        };
      });

      it('Sets "source" as an array', () => {
        const instance = new ActionIterableObject(opts);
        assert.typeOf(instance.source, 'array');
        assert.lengthOf(instance.source, 3);
      });

      it('Sets operator', () => {
        const instance = new ActionIterableObject(opts);
        assert.equal(instance.operator, opts.operator);
      });

      it('Sets condition', () => {
        const instance = new ActionIterableObject(opts);
        assert.equal(instance.condition, opts.condition);
      });

      it('do not set properties if not valid', () => {
        opts.operator = 'unknown';
        const instance = new ActionIterableObject(opts);
        assert.isUndefined(instance.source);
        assert.isUndefined(instance.operator);
        assert.isUndefined(instance.condition);
      });
    });

    describe('_validate()', () => {
      let opts;
      let instance;
      beforeEach(() => {
        opts = {
          operator: 'equal',
          condition: 'test',
          source: 'properties.*.first'
        };
        instance = new ActionIterableObject(opts);
      });

      it('Returns true for valid options', () => {
        const result = instance._validate(opts);
        assert.isTrue(result);
      });

      it('Returns false when no source', () => {
        delete opts.source;
        const result = instance._validate(opts);
        assert.isFalse(result);
      });

      it('Returns false when no operator', () => {
        delete opts.operator;
        const result = instance._validate(opts);
        assert.isFalse(result);
      });

      it('Returns false when no condition', () => {
        delete opts.condition;
        const result = instance._validate(opts);
        assert.isFalse(result);
      });

      it('Returns false when operator is not known', () => {
        opts.operator = 'test';
        const result = instance._validate(opts);
        assert.isFalse(result);
      });

      [
        'equal',
        'not-equal',
        'greater-than',
        'greater-than-equal',
        'less-than',
        'less-than-equal',
        'contains',
        'regex'
      ].forEach((op) => {
        it('Returns true when operator is ' + op, () => {
          opts.operator = op;
          const result = instance._validate(opts);
          assert.isTrue(result);
        });
      });
    });
  });

  describe('JsonExtractor', () => {
    const json = '{"test": true}';
    const path = 'a.b.b';
    const iterator = {
      operator: 'equal',
      condition: 'test',
      source: 'properties.*.first'
    };
    describe('Constructor', () => {
      it('Sets _data property', () => {
        const instance = new JsonExtractor(json, path, iterator);
        assert.typeOf(instance._data, 'object');
      });

      it('Sets _path property when set', () => {
        const instance = new JsonExtractor(json, path, iterator);
        assert.typeOf(instance._path, 'array');
        assert.lengthOf(instance._path, 3);
      });

      it('_path is undefined when missing', () => {
        const instance = new JsonExtractor(json, undefined, iterator);
        assert.isUndefined(instance._path);
      });

      it('Sets _iterator property', () => {
        const instance = new JsonExtractor(json, path, iterator);
        assert.isTrue(instance._iterator instanceof ActionIterableObject);
      });
    });

    describe('_processJson()', () => {
      it('Returns undefined when no argument', () => {
        const instance = new JsonExtractor(json, path, iterator);
        const result = instance._processJson();
        assert.isUndefined(result);
      });

      it('Returns undefined when argument is a number', () => {
        const instance = new JsonExtractor(json, path, iterator);
        const result = instance._processJson(5);
        assert.isUndefined(result);
      });

      it('Returns undefined when argument is a boolean', () => {
        const instance = new JsonExtractor(json, path, iterator);
        const result = instance._processJson(true);
        assert.isUndefined(result);
      });

      it('Returns undefined when argument cannot be parsed', () => {
        const instance = new JsonExtractor(json, path, iterator);
        const result = instance._processJson('{"test');
        assert.isUndefined(result);
      });

      it('Returns passed argument if not string', () => {
        const instance = new JsonExtractor(json, path, iterator);
        const result = instance._processJson({ test: 'value' });
        assert.deepEqual(result, { test: 'value' });
      });

      it('Returns object', () => {
        const instance = new JsonExtractor(json, path, iterator);
        const result = instance._processJson(json);
        assert.deepEqual(result, {
          test: true
        });
      });

      it('Returns array', () => {
        const instance = new JsonExtractor(json, path, iterator);
        const result = instance._processJson('["a"]');
        assert.deepEqual(result, ['a']);
      });
    });

    describe('extract()', () => {
      describe('Object json', function() {
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
        let extractor;
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
        const json = [
          {
            id: 'id1',
            name: {
              first: 'Test',
              last: 'Name'
            }
          },
          {
            id: 'id2',
            name: {
              first: 'Brown',
              last: 'test2'
            }
          }
        ];
        let extractor;
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

        it('Returns undefined when path not found', function() {
          extractor = new JsonExtractor(json, '0.name.something');
          const result = extractor.extract();
          assert.isUndefined(result);
        });
      });
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
      let extractor;
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
      const json = [
        {
          id: 'id1',
          name: {
            first: 'Test',
            last: 'Name'
          }
        },
        {
          id: 'id2',
          name: {
            first: 'Brown',
            last: 'test2'
          }
        }
      ];
      const iterator = {
        source: '*.name.first',
        operator: 'equal',
        condition: 'Brown'
      };
      let extractor;
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
      let extractor;
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
});
