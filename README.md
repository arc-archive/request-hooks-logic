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
npm install --save github:advanced-rest-client/request-hooks-logic
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

The element doesn't contain the logic to update variable value in the datastore.
It's just a runner for getting variable value and test if conditions for the actions
are met. In both environments the library dispatches the `variable-update-action`
event (via event emitter or browser's CustomEvent on the window object).

The application should handle the event and provide own implementation of variables
updating.

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

## Web polyfils

You may want to use advanced-rest-client/arc-headers polyfill for Fetch api, even
if targeted browser supports it. It only matters if you about to create the
Response object manually (it ignores `url` property which is used for `response.url` source path).

This module uses classes, URL object and URLSearchParams object. If your browser doesn't
support it then find a polyfill and use babel.
