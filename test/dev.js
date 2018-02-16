const {JsonExtractor} = require('../');
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
const extractor = new JsonExtractor(json, 'id', iterator);
const result = extractor.extract();
console.log(result);
