/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement } from 'lit-element';
import { HeadersParserMixin } from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';
import './request-logic-condition.js';
/**
 * Class responsible for extracting data from JSON values.
 */
export class ActionIterableObject {
  /**
   * @constructor
   * @param {Object} opts Iterator options
   */
  constructor(opts) {
    opts = opts || {};
    this.valid =this._validate(opts);
    if (!this.valid) {
      return;
    }
    /**
     * Source of the data split by `.` character
     * @type {Array<String>}
     */
    this.source = opts.source.split('.');
    /**
     * Comparision operator
     * @type {String}
     */
    this.operator = opts.operator;
    /**
     * Comparision value
     * @type {String|Number}
     */
    this.condition = opts.condition;
  }
  /**
   * Validates passed options and sets `valid` flag.
   *
   * @param {Object} opts Iterator options
   * @return {Boolean} True when options are valid
   */
  _validate(opts) {
    let valid = true;
    if (!opts.source) {
      valid = false;
    }
    if (valid && !opts.operator) {
      valid = false;
    }
    if (valid && !opts.condition) {
      valid = false;
    }
    if (valid) {
      const ops = [
        'equal', 'not-equal', 'greater-than', 'greater-than-equal',
        'less-than', 'less-than-equal', 'contains', 'regex'
      ];
      if (ops.indexOf(opts.operator) === -1) {
        valid = false;
      }
    }
    return valid;
  }
}
/**
 * Class responsible for extracting data from JSON values.
 */
export class JsonExtractor {
  /**
   * @constructor
   * @param {String|Object|Array} json JSON string or object. Strings are
   * parsed to objects.
   * @param {Array<String>} path Path to the data.
   * @param {?Object} iterator Data iterator
   */
  constructor(json, path, iterator) {
    /**
     * JS object or array.
     */
    this._data = this._processJson(json);
    if (typeof path === 'string') {
      path = path.split('.');
    }
    this._path = path;
    this._iterator = new ActionIterableObject(iterator);
  }
  /**
   * Processes input JSON data and returns Array or Object. It returns
   * `undefined` if the data are empty, falsy or a primitive (except for JSON
   * strings).
   *
   * @param {Array|Object|String} data Data to process
   * @return {Array|Object|undefined} JS object or undefined if conversion
   * wasn't possible.
   */
  _processJson(data) {
    if (!data) {
      return;
    }
    switch (typeof data) {
      case 'number':
      case 'boolean':
        return;
      case 'string':
        try {
          return JSON.parse(data);
        } catch (e) {
          return;
        }
    }
    return data;
  }
  /**
   * Extracts the data for given conditions.
   *
   * @return {String|undefined} Data found for given conditions.
   */
  extract() {
    if (this._iterator.valid) {
      const obj = this._getValue(this._data, this._iterator.source);
      if (!obj) {
        return;
      }
      return this._getValue(obj, this._path);
    }
    return this._getValue(this._data, this._path);
  }

  /**
   * Reads a value of an JSON object for given path.
   *
   * @param {Object|Array} json JSON value to read
   * @param {Array<String>} path Path to search for the value.
   * @param {Object} iterableOptions
   * @return {String|undefined} Value for given path.
   */
  _getValue(json, path, iterableOptions) {
    if (!json || typeof json !== 'object') {
      return json;
    }
    if (iterableOptions) {
      return this._getIterableValue(json, path, iterableOptions);
    }
    let part = path.shift();
    if (!part) {
      return json;
    }
    if (part === '*') {
      iterableOptions = this._iterator;
      return this._getValue(json, path, iterableOptions);
    }
    let isNumber = false;
    if (!isNaN(part)) {
      part = Number(part);
      isNumber = true;
    }
    if (json instanceof Array && !isNumber && !iterableOptions) {
      return;
    }
    return this._getValue(json[part], path, iterableOptions);
  }
  /**
   * Searches for a value in iterable object.
   *
   * @param {Object|Array} json Iterable object
   * @param {Array<String>} path Path for the value
   * @param {ActionIterableObject} opts Iterable object configuration
   * @return {Object|undefined} Object that matches iterable condition
   * or undefined if none matches the condition.
   */
  _getIterableValue(json, path, opts) {
    path = Array.from(path);
    if (json instanceof Array) {
      return this._getIterableValueArray(json, path, opts);
    }
    return this._getIterableValueObject(json, path, opts);
  }
  /**
   * Searches for a value in Array.
   *
   * @param {Object|Array} json Iterable object
   * @param {Array<String>} path Path for the value
   * @param {ActionIterableObject} opts Iterable object configuration
   * @return {Object|undefined} Object that matches iterable condition
   * or undefined if none matches the condition.
   */
  _getIterableValueArray(json, path, opts) {
    const cond = document.createElement('request-logic-condition');
    cond.enabled = true;
    cond.source = 'noop';
    cond.operator = opts.operator;
    cond.condition = opts.condition;

    for (let i = 0, len = json.length; i < len; i++) {
      const item = json[i];
      const copy = Array.from(path);
      const value = this._getValue(item, copy);
      if (!value) {
        continue;
      }
      if (cond.checkCondition(value, opts.operator, opts.condition)) {
        return json[i];
      }
    }
  }
  /**
   * Searches for a value in JS Object.
   *
   * @param {Object|Array} json Iterable object
   * @param {Array<String>} path Path for the value
   * @param {ActionIterableObject} opts Iterable object configuration
   * @return {Object|undefined} Object that matches iterable condition
   * or undefined if none matches the condition.
   */
  _getIterableValueObject(json, path, opts) {
    const type = typeof json;
    if (!json || type === 'string' || type === 'number') {
      return;
    }
    const cond = document.createElement('request-logic-condition');
    cond.enabled = true;
    cond.source = 'noop';
    cond.operator = opts.operator;
    cond.condition = opts.condition;

    const keys = Object.keys(json);
    for (let i = 0, len = keys.length; i < len; i++) {
      const copy = Array.from(path);
      const item = {};
      item[keys[i]] = json[keys[i]];
      const value = this._getValue(item, copy);
      if (!value) {
        continue;
      }
      if (cond.checkCondition(value, opts.operator, opts.condition)) {
        return json;
      }
    }
  }
}
/**
 * A helper class to extract data from an XML response.
 */
export class XmlExtractor {
  /**
   * @constructor
   * @param {String} xml XML string.
   * @param {Array<String>} path Path to the data.
   * @param {?Object} iterator Data iterator
   */
  constructor(xml, path, iterator) {
    /**
     * JS object or array.
     */
    this._data = xml;
    if (typeof path === 'string') {
      path = path.split('.');
    }
    this._path = path;
    this._iterator = new ActionIterableObject(iterator);
  }
  /**
   * Gets a value of the XML type string for given path.
   *
   * @return {String|undefined} Value for given path.
   */
  extract() {
    const parser = new DOMParser();
    const dom = parser.parseFromString(this._data, 'text/xml');
    if (dom.querySelector('parsererror')) {
      return;
    }
    return this._getValue(dom, this._path);
  }
  /**
   * Gets a value for the XML document for given path.
   *
   * @param {Document} dom DOM document.
   * @param {Array<String>} path Path to search for the value.
   * @return {String|undefined} Value for given path.
   */
  _getValue(dom, path) {
    const part = path.shift();
    if (!dom) {
      return;
    }
    if (!part) {
      return dom.innerHTML.trim();
    }
    if (part.trim().indexOf('attr(') === 0) {
      return this._valueForAttr(dom, part);
    }
    let nextPart = path[0];
    let selector = part;
    if (!isNaN(nextPart)) {
      nextPart = Number(nextPart);
      nextPart++;
      selector += ':nth-child(' + nextPart + ')';
      path.shift();
    }
    return this._getValue(dom.querySelector(selector), path);
  }
  /**
   * Reads attribute value for current path.
   *
   * @param {Element} dom DOM element object
   * @param {Number} part Current part of the path.
   * @return {String|undefined} Returned value for path or undefined
   * if not found.
   */
  _valueForAttr(dom, part) {
    const match = part.match(/attr\((.+)\)/);
    if (!match) {
      return;
    }
    const attrName = match[1];
    if (!dom.hasAttribute(attrName)) {
      return;
    }
    let attrValue = dom.getAttribute(attrName);
    if (!attrValue) {
      attrValue = true;
    }
    return attrValue;
  }
}
/**
 * An element to extract data from JSON or XML responses.
 *
 * The `request` is ARC request object as described in
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/
 * api-request-and-response.md#api-request document.
 * It should contain at lease `url`, `method`, `headers`, and `payload`
 *
 * The `response` is a "response" property of the `api-response` custom event
 * as described in
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/
 * api-request-and-response.md#api-response.
 * It should contain `status`, `payload`, `headers` and `url` properties.
 * The `url` property should be the final request URL after all redirects.
 *
 * Note: This element uses `URLSearchParams` class which is relatively new
 * interface in current browsers. You may need to provide a polyfill if you
 * are planning to use this component in older browsers.
 *
 * @polymer
 * @customElement
 * @memberof LogicElements
 * @appliesMixin HeadersParserMixin
 */
export class RequestDataExtractor extends HeadersParserMixin(LitElement) {
  static get properties() {
    return {
      /**
       * ARC request object
       */
      request: { type: Object },
      /**
       * ARC response object
       */
      response: { type: Object },
      /**
       * Source path delimiter
       */
      pathDelimiter: { type: String },
      /**
       * Source data path. Either array of path segments
       * or full path as string.
       *
       * @type {Array<String>|String}
       */
      path: { type: String }
    };
  }

  constructor() {
    super();
    this.pathDelimiter = '.';
  }

  /**
   * Gets the data from selected path.
   *
   * @param {Object} iterator Iterator model. Used only with response body.
   * @return {String|Number|undefined} Data to be processed
   */
  extract(iterator) {
    let path = this.path;
    if (typeof path === 'string') {
      path = path.split(this.pathDelimiter);
    }
    let source;
    if (path[0] === 'request') {
      source = this.request;
      iterator = undefined;
    } else {
      source = this.response;
    }
    switch (path[1]) {
      case 'url': return this._getDataUrl(source.url, path.slice(2));
      case 'headers': return this._getDataHeaders(source, path.slice(2));
      case 'status': return source.status;
      case 'body': return this._getDataPayload(source, path, iterator);
      default: throw new Error('Unknown path for source ' + path[0]);
    }
  }
  /**
   * Returns the value for path for given source object
   *
   * @param {String} url An url to parse.
   * @param {?Array<String>} path Path to the object
   * @return {String|URLSearchParams} Value for the path.
   */
  _getDataUrl(url, path) {
    if (!path || path.length === 0 || !url) {
      return url;
    }
    const value = new URL(url);
    switch (path[0]) {
      case 'host': return value.host;
      case 'protocol': return value.protocol;
      case 'path': return value.pathname;
      case 'query': return this._readUrlQueryValue(value, path[1]);
      case 'hash': return this._readUrlHashValue(value, path[1]);
      default: throw new Error('Unknown path in the URL: ' + path);
    }
  }
  /**
   * Reads value of the URL query parameters.
   *
   * The `?` at the beginning of the query string is removed.
   *
   * @param {URL} url The URL object instance
   * @param {?String} param Param name to return. If not set then it returns
   * whole query string value.
   * @return {String} Full query string value if `param` is not set or paramter
   * value. This function does not returns `null` values.
   */
  _readUrlQueryValue(url, param) {
    if (!param) {
      let v = url.search || '';
      if (v[0] === '?') {
        v = v.substr(1);
      }
      return v;
    }
    let value = url.searchParams.get(param);
    if (!value && value !== '') {
      value = undefined;
    }
    return value;
  }
  /**
   * Reads value of the URL hash.
   *
   * The `#` at the beginning of the hash string is removed.
   *
   * If the `param` argument is set then it treats hahs value as a query
   * parameters string and parses it to get the value.
   *
   * @param {URL} url The URL object instance
   * @param {?String} param Param name to return. If not set then it returns
   * whole hash string value.
   * @return {String} Hash parameter or whole hash value.
   */
  _readUrlHashValue(url, param) {
    let value = (url.hash || '').substr(1);
    if (!param) {
      return value;
    }
    /* global URLSearchParams */
    const obj = new URLSearchParams(value);
    value = obj.get(param);
    if (!value && value !== '') {
      value = undefined;
    }
    return value;
  }
  /**
   * Returns a value for the headers.
   *
   * @param {Request|Response} source An object to read the url value from.
   * @param {?Array<String>} path Path to the object
   * @return {Headers|String} Value for the path.
   */
  _getDataHeaders(source, path) {
    const headers = this.headersToJSON(source.headers);
    if (!path || !path.length || !path[0] || !headers || !headers.length) {
      return;
    }
    const lowerName = path[0].toLowerCase();
    for (let i = 0, len = headers.length; i < len; i++) {
      if (headers[i].name.toLowerCase() === lowerName) {
        return headers[i].value;
      }
    }
  }
  /**
   * Returns a value for the payload field.
   *
   * @param {Request|Response} source An object to read the url value from.
   * @param {?Array<String>} path Path to the object
   * @param {Object} iterator Iterator model. Used only with response body.
   * @return {String} Value for the path.
   */
  _getDataPayload(source, path, iterator) {
    const ct = this.getContentType(source.headers);
    if (!ct) {
      return;
    }
    if (path[0] === 'request') {
      source = this.request.payload;
    } else {
      source = this.response.payload;
    }
    return this._getPayloadValue(source, ct, path.slice(2), iterator);
  }
  /**
   * Gets a value from a text for current path. Path is part of the
   * configuration object passed to the constructor.
   *
   * @param {String} data Payload value.
   * @param {String} contentType Body content type.
   * @param {Array<String>} path Remaining path to follow
   * @param {Object} iterator Iterator model
   * @return {String|undefined} Value for given path.
   */
  _getPayloadValue(data, contentType, path, iterator) {
    if (!path || !path.length || !data) {
      return data;
    }
    data = String(data);
    if (contentType.indexOf('application/json') !== -1) {
      const extractor = new JsonExtractor(data, path, iterator);
      return extractor.extract();
    }
    if (contentType.indexOf('/xml') !== -1 ||
        contentType.indexOf('+xml') !== -1 ||
        contentType.indexOf('text/html' === 0)) {
      const extractor = new XmlExtractor(data, path, iterator);
      return extractor.extract();
    }
  }
}
window.customElements.define('request-data-extractor', RequestDataExtractor);
