[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/request-hooks-logic.svg)](https://www.npmjs.com/package/@advanced-rest-client/request-hooks-logic)

[![Build Status](https://travis-ci.org/advanced-rest-client/request-hooks-logic.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/request-hooks-logic)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/request-hooks-logic)

# request-hooks-logic

Package containing a logic for creating HTTP request / response hooks.

The documentation for request actions (including data model) can be found in [ARC electron wiki page](https://github.com/advanced-rest-client/arc-electron/wiki/Request-actions).

## Example:

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

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/request-hooks-logic
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import './node_modules/@advanced-rest-client/request-hooks-logic/request-hooks-logic.js';
    </script>
  </head>
  <body>
    <request-hooks-logic></request-hooks-logic>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from './node_modules/@polymer/polymer/polymer-element.js';
import './node_modules/@advanced-rest-client/request-hooks-logic/request-hooks-logic.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <request-hooks-logic></request-hooks-logic>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/request-hooks-logic
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```

## Jexl dependency

Previous versions of this component included Jexl library. This version do not have
Jexl as a dependency but it is required to run the component.

You must install [Jexl](https://github.com/TomFrost/Jexl) on your project, and build it for browser.
See `dev-lib/` folder for an example of such build.

Finally you have to either pass the pointer to Jexl library to `jexl` property
or point to a pointer relative to the `window` object.

Setting Jexl pointer:

```javascript
const eval = document.querySelector('request-hooks-logic');
eval.jexl = myJexlVariable;
```

Setting path to Jexl:

```html
<request-hooks-logic jexl-path="ArcVariables.JexlDev"></request-hooks-logic>
```

This expects the Jexl library to be under `window.ArcVariables.JexlDev` variable.
