[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/request-hooks-logic)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/request-hooks-logic)

# request-hooks-logic

Package containing a logic for creating HTTP request / response hooks.

The documentation for request actions (including data model) can be found in [ARC electron wiki page](https://github.com/advanced-rest-client/arc-electron/wiki/Request-actions).

## Example use

```html
<request-hooks-logic></request-hooks-logic>
```

```javascript
const action = {
  source: 'response.value',
  action: 'assign-variable',
  destination: 'itemId',
  hasIterator: true,
  iterator: {
    source: 'json.*.id',
    operator: 'equal',
    condition: 'id2'
  },
  conditions: [{
    enabled: true,
    source: 'response.status',
    operator: 'equal',
    condition: '200'
  }]
};
const request = {};
const response = {
  url: '...',
  headers: 'content-type: application/json',
  payload: '{"json": [{"id": "id1", "value": "v1"}, {"id": "id2", "value": "v2"}]}'
};

const logic = document.querySelector('request-hooks-logic');
logic.processActions([action], request, response)
.then(() => {
  // done.
});
```

When this action is executed it informs `variables-manager` to set in-memory variable called `itemId` and it's value to be set to `v2`. The logic runner iterates over the response in a path defined as `json.*.id`. When the right object is found by the iterator then the value is set from `source` property.

## Required dependency

This library uses `advanced-rest-client/variables-evaluator` which depend on `advanced-rest-client/Jexl` (version 2.x) and this library is not included by default in the element.
You need to add this dependency manually.

For a browser environment this would adding the element:

```html
<link rel="import" href="bower_components/jexl/jexl.html">
<link rel="import" href="bower_components/request-hooks-logic/request-hooks-logic.html">
...
<request-hooks-logic></request-hooks-logic>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
