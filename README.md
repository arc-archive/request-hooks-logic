# ARC Request hooks logic

Node package containing the logic for creating HTTP request / response hooks.

HTTP hooks can trigger an action that has been configured for specific endpoint.
Action has access to both request and response objects.

Currently the only action supported by the module is `assign-variable` which
creates/updates a environment variable (for current environment) to a value
read from the request / response object.

In the future other actions may be supported like `redirect` or `cancel`.

The library can work in both node and web environment as a web component
or by directly linking scripts.

## Install

### Node

```
npm install --save @advanced-rest-client/request-hooks-logic
```

### Bower

```
bower install --save advanced-rest-client/request-hooks-logic
```

## Example

### Node

```javascript
const {RequestLogicAction} = require('request-hooks-logic');
const request = arcRequest; // Request object, Fetch spec
const response = arcRequest; // Response object, Fetch spec
const actionConfig = {
  source: 'response.body.path.to.1.param',
  action: 'assign-variable',
  destination: 'myVar'
};
const runner = new RequestLogicAction(actionConfig);
runner.run(request, response)
.then(() => console.log('Variable updated'));
```

### Browser

```html
<link rel="import" href="bower_components/request-hooks-logic/request-hooks-logic.html">
<script>
// This example is missing components load event
const request = arcRequest; // Request object, Fetch spec
const response = arcRequest; // Response object, Fetch spec
const actionConfig = {
  source: 'response.body.path.to.1.param',
  action: 'assign-variable',
  destination: 'myVar'
};
const runner = new RequestLogicAction(actionConfig);
runner.run(request, response)
.then(() => console.log('Variable updated'));
</script>
```

## Updating the variable value

The element **doesn't contain logic to update variable** value in the datastore.
It's just a runner for getting variable value and test if conditions for the actions
are met. In both environments the library dispatches the `variable-update-action` and `variable-store-action`
events (via event emitter or browser's CustomEvent on the window object).

The application should handle the event and provide own implementation of storing or updating in memory variables values.

### Examples

#### Node

```javascript
const runner = new RequestLogicAction(actionConfig);
runner.on('variable-update-action', (detail) => {
  require('variables-manager').updateVariable(detail.variable, detail.value);
});
runner.run(request, response)
.then(() => console.log('Variable updated'));
```

#### Browser

```javascript
window.addEventListener('variable-update-action', (e) => {
  let detail = e.detail;
  // detail.variable, detail.value
});
const runner = new RequestLogicAction(actionConfig);
runner.run(request, response)
.then(() => console.log('Variable updated'));
```

## Running batch actions

Instead of creating and executing actions in a loop the module contains
`RequestLogicRunner` class that accepts list of actions and runs them in order
of definition. This class emits the same events as main action class.

```javascript
const config = [{
  source: 'request.body.items.0.name',
  action: 'assign-variable',
  destination: 'requestUrl'
}, {
  source: 'response.url.query.namedParameter',
  action: 'store-variable',
  destination: 'someVariable'
}];
const runner = new RequestLogicRunner(config);
runner.on('variable-update-action', (detail) => {
  require('variables-manager').updateVariable(detail.variable, detail.value);
});
runner.run(request, response)
.then(() => console.log('Variables updated'));
```

## Action data model

Action can be configured using following properties:

| Property | Type | Description |
| ----- | ----- | ----- |
| source | `String` | Source of the data to extract from the request or response object. See below this table for detailed description. |
| action | `String` | Action to perform. Currently supported are: `assign-variable` -updates variable value in memory, without storing them to the datastore; `store-variable` - updates and stores variable value in the datastore.
| destination | `String` | For variables manipulation it is the variable name. |

### Source option and data path

With source string you can instruct the runner from where to take the value for
action. General structure is:
```
source object . data type [. path]
```
Source object can be either `request` or `response`.

Data type describes type of the request / response data. Can be one of:
- url - URL associated with the request / response
- status - Only for response data source object. Response's status code.
- header - Request / response headers
- body - Request / response body

Path allows to instruct the runner from where specifically in the data type get the value.

For `url` you can define the following properties:
- host - Returns the host value, e.g. `api.domain.com`
- protocol - Returns URL protocol, e.g. `https:`
- path - URL's path, e.g. `/path/to/resource.json`
- query - Returns full query string, e.g. `version=1&page=test`
- query.[any string] - Returns the value of a query parameter. For `query.version` it would return `1`
- hash - Returns everything that is after the `#` character, e.g. `access_token=token&state=A6RT7W`
- hast.[any string] - It treats hash as a query parameters and returns the value of the parameter. For `hash.access_token` it would return `token`

For `body` you can define path to the value for XML and JSON data only.
Any other content type will result with `undefined` value.

Path to the data is a JSON path to the value (also for XML).
```javascript
const json = {
  property: {
    otherProperty: {
      value: 123456
    }
  }
};
const path = 'property.otherProperty.value';
// This will return 123456
```

To access array values put the index in the path:

```javascript
const json = {
  items: [{
    otherProperty: {
      value: 123456
    }
  }]
};
const path = 'items.0.otherProperty.value';
// This will return 123456
```

Similar for XML:

```javascript
const xmlStr = `<?xml version="1.0"?>
<people xmlns:xul="some.xul">
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
path = 'people.person.0.phoneNumber';
// returns 202-456-1111
```

XML path supports `attr(ATTRIBUTE NAME)` function that returns the value of the
attribute:

```javascript
path = 'people.person.0.name.attr(first)';
// returns george
```

## Conditions

You can add a condition to the action so the action will be executed if all conditions are meet.

Condition data model is:
```javascript
{
  source: 'String', // the same as for action
  operator: 'String', // see below for list of all operators
  condition: 'any' // value to use to compare the value get from the action `source` property  
}
```

Operator can be one of:
- equal
- not-equal
- greater-than
- greater-than-equal
- less-than
- less-than-equal
- contains

Contains can operate on strings, simple arrays (e.g. `['test', 123]`) or objects (e.g. {'key':'value'}).

### Example

```javascript
const config = {
  source: 'request.body.items.0.name',
  action: 'assign-variable',
  destination: 'someValue',
  conditions: [{
    source: 'response.status',
    operator: 'equal',
    condition: 200
  }]
}
```

## Web polyfils

You may want to use advanced-rest-client/arc-headers polyfill for Fetch api, even
if targeted browser supports it. It only matters if you about to create the
Response object manually (it ignores `url` property which is used for `response.url` source path).

This module uses classes, URL object and URLSearchParams object. If your browser doesn't
support it then find a polyfill and use babel.
