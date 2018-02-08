'use strict';
/* global self, URLSearchParams */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
}
var EventEmitter;
if (isNode) {
  var {RequestLogicCondition} = require('./request-condition.js');
  var {NodeXml} = require('./node-lib/xml.js');
  EventEmitter = require('events');
} else {
  EventEmitter = function() {};
  EventEmitter.prototype.emit = function(type, detail) {
    let ev = new CustomEvent(type, {
      bubbles: true,
      detail: detail,
      cancelable: true
    });
    document.body.dispatchEvent(ev);
    return ev;
  };
}

class RequestLogicAction extends EventEmitter {
  /**
   * @constructor
   * @param {Object} action Action model:
   * source {String} data source
   * action {String} action to be performed
   */
  constructor(action) {
    super();
    RequestLogicAction.validate(action);
    if (action.conditions) {
      this.conditions = this._prepareConditions(action.conditions);
    }
    this._source = action.source;
    this._sourcePath = action.source.split('.');
    this._action = action.action;
    this._destination = action.destination;
    this._opts = action;
  }
  /**
   * Validates action definition object.
   *
   * @param {Object} action Action definition model. See constructor for details.
   */
  static validate(action) {
    if (!action) {
      throw new Error('The action definition is missing.');
    }
    var errors = [];
    if (!action.source) {
      errors.push('Action source is missing');
    }
    if (!action.action) {
      errors.push('Action\'s action is missing');
    }
    if (!action.destination) {
      errors.push('Action destination is missing');
    }
    if (errors.length) {
      throw new Error('Action did not pass validation: \n' + errors.join('\n'));
    }
  }
  /**
   * Prepares list of condition objects.
   * It throws an error if condition is not validated.
   *
   * @param {Array<Object>} conditions List of condition model.
   * @return {Array<RequestLogicCondition>} Condition class instances.
   */
  _prepareConditions(conditions) {
    let result = [];
    for (let i = 0, len = conditions.length; i < len; i++) {
      result.push(new RequestLogicCondition(conditions[i]));
    }
    return result;
  }
  /**
   * Runs the request hook action.
   *
   * @param {Request} request Request object as defined in Fetch API
   * @param {Response} response Response object as defined in Fetch API
   */
  run(request, response) {
    this._request = request;
    this._response = response;
    return this._prepareBodyValues(request, response)
    .then(() => this._areConditionsMeet())
    .then((canExecute) => {
      if (!canExecute) {
        return;
      }
      let value = this._getData(this._sourcePath);
      return this._performAction(value);
    });
  }
  /**
   * If needed it reads request and response body string value and sets class
   * fields with the value so other methods do not need to clone objects
   * all over again.
   *
   * @param {Request} request Request object as defined in Fetch API
   * @param {Response} response Response object as defined in Fetch API
   * @return {Promise} Resolved promise when done.
   */
  _prepareBodyValues(request, response) {
    var bodyNeeded = this._requiresBody();
    var promises = [];
    if (bodyNeeded.request) {
      let p = this._getBody(request)
      .then((value) => this._requestBody = value);
      promises.push(p);
    }

    if (bodyNeeded.response) {
      let p = this._getBody(response)
      .then((value) => this._responseBody = value);
      promises.push(p);
    }
    return Promise.all(promises);
  }
  /**
   * Checks is conditions for the actions are meet.
   *
   * @return {Boolean} False of any of the conditions aren't meet.
   */
  _areConditionsMeet() {
    var cond = this.conditions;
    if (!cond || !cond.length) {
      return true;
    }
    var args = {
      request: this._request,
      requestBody: this._requestBody,
      response: this._response,
      responseBody: this._responseBody
    };
    for (let i = 0, len = cond.length; i < len; i++) {
      if (!cond[i].satisfied(args)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Checks if any source (either for main configuration or conditions') requires
   * to read request / response body.
   *
   * @return {Object} Map with boolean values for both request and response.
   * True indicates that the request / response body needs to be read.
   *
   * ### example
   * ```
   * {
   *  request: false,
   *  response: true
   * }
   * ```
   */
  _requiresBody() {
    let result = {
      request: false,
      response: false
    };
    if (this._source.indexOf('request.body') !== -1) {
      result.request = true;
    }
    if (this._source.indexOf('response.body') !== -1) {
      result.response = true;
    }
    var cond = this.conditions;
    if (cond && cond.length) {
      cond.forEach((obj) => {
        if (obj._source.indexOf('request.body') !== -1) {
          result.request = true;
        }
        if (obj._source.indexOf('response.body') !== -1) {
          result.response = true;
        }
      });
    }
    return result;
  }

  /**
   * Gets the data from selected path.
   *
   * @param {Array<String>} path Data path.
   * @return {String|Number|undefined} Data to be processed
   */
  _getData(path) {
    var source;
    if (path[0] === 'request') {
      source = this._request;
    } else {
      source = this._response;
    }
    switch (path[1]) {
      case 'url': return this._getDataUrl(source.url, path.slice(2));
      case 'headers': return this._getDataHeaders(source, path.slice(2));
      case 'body':
        const ct = source.headers.get('content-type');
        if (path[0] === 'request') {
          source = this._requestBody;
        } else {
          source = this._responseBody;
        }
        return this._getPayloadValue(source, ct, path.slice(2));
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
    const value = this._parsedUrl(url);
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
    var obj;
    if (isNode) {
      const URLSearchParams = require('url-search-params');
      obj = new URLSearchParams(value);
    } else {
      obj = new URLSearchParams(value);
    }
    value = obj.get(param);
    if (!value && value !== '') {
      value = undefined;
    }
    return value;
  }
  /**
   * Gets consistent URL object depending on the environment.
   * @param {String} url An URL to parse
   * @return {URL} Parsed URL.
   */
  _parsedUrl(url) {
    if (isNode) {
      return this._parsedUrlNode(url);
    }
    return new URL(url);
  }
  /**
   * Creates an equivelent of browser's URL object.
   *
   * @param {String} url An URL to parse
   * @return {URL} Browser's URL object polyfill.
   */
  _parsedUrlNode(url) {
    const {URL} = require('url');
    if (URL) {
      return new URL(url);
    }
    const _url = require('url');
    const obj = _url.parse(url);
    const URLSearchParams = require('url-search-params');
    obj.searchParams = new URLSearchParams(obj.search);
    return obj;
  }
  /**
   * Returns a value for the headers.
   *
   * @param {Request|Response} source An object to read the url value from.
   * @param {?Array<String>} path Path to the object
   * @return {Headers|String} Value for the path.
   */
  _getDataHeaders(source, path) {
    var headers = source.headers;
    if (!path || !path.length) {
      return;
    }
    return headers.get(path[0]);
  }
  /**
   * Reads body value for given source.
   *
   * @param {Request|Response} source Request or Response object to read the
   * data from.
   * @return {Promise} Promise resolved to a value of the body.
   */
  _getBody(source) {
    const clone = source.clone();
    return clone.text();
  }
  /**
   * Gets a value from a text for current path. Path is part of the configuration
   * object passed to the constructor.
   *
   * @param {String} data Payload value.
   * @param {String} contentType Body content type.
   * @param {Array<String>} path Remaining path to follow
   * @return {String|undefined} Value for given path.
   */
  _getPayloadValue(data, contentType, path) {
    if (!path || !path.length || !data) {
      return data;
    }
    if (typeof data !== 'string') {
      return;
    }
    if (contentType.indexOf('application/json') !== -1) {
      try {
        return this._getPayloadJsonValue(JSON.parse(data), path);
      } catch (e) {
        return;
      }
    }
    if (contentType.indexOf('/xml') !== -1 || contentType.indexOf('+xml') !== -1) {
      return this._getPayloadXmlValue(data, path);
    }
  }
  /**
   * Reads a value of an JSON object for given path.
   *
   * @param {Object|Array} json JSON value to read
   * @param {Array<String>} path Path to search for the value.
   * @return {String|undefined} Value for given path.
   */
  _getPayloadJsonValue(json, path) {
    let part = path.shift();
    if (!part || !json || typeof json !== 'object') {
      return json;
    }
    var isNumber = false;
    if (!isNaN(part)) {
      part = Number(part);
      isNumber = true;
    }
    if (json instanceof Array && !isNumber) {
      return;
    }
    return this._getPayloadJsonValue(json[part], path);
  }
  /**
   * Gets a value of the XML type string for given path.
   *
   * @param {String} xmlStr An XML string of the request / response body
   * @param {Array<String>} path Path to search for the value.
   * @return {String|undefined} Value for given path.
   */
  _getPayloadXmlValue(xmlStr, path) {
    if (isNode) {
      const parser = new NodeXml(xmlStr);
      return parser.parse(path);
    }
    return this._getPayloadXmlValueWeb(xmlStr, path);
  }
  /**
   * Gets a value of the XML type string for given path.
   * Implementation for web browser.
   *
   * @param {String} xmlStr An XML string of the request / response body
   * @param {Array<String>} path Path to search for the value.
   * @return {String|undefined} Value for given path.
   */
  _getPayloadXmlValueWeb(xmlStr, path) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(xmlStr, 'text/xml');
    if (dom.querySelector('parsererror')) {
      return;
    }
    return this._getXmlValue(dom, path);
  }
  /**
   * Gets a value for the XML document for given path.
   *
   * @param {Document} dom DOM document.
   * @param {Array<String>} path Path to search for the value.
   * @return {String|undefined} Value for given path.
   */
  _getXmlValue(dom, path) {
    let part = path.shift();
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
    return this._getXmlValue(dom.querySelector(selector), path);
  }
  /**
   * Reads attribute value for current path.
   *
   * @param {Element} dom DOM element object
   * @param {Number} part Current part of the path.
   * @return {String|undefined} Returned value for path or undefined if not found.
   */
  _valueForAttr(dom, part) {
    let match = part.match(/attr\((.+)\)/);
    if (!match) {
      return;
    }
    let attrName = match[1];
    if (!dom.hasAttribute(attrName)) {
      return;
    }
    let attrValue = dom.getAttribute(attrName);
    if (!attrValue) {
      attrValue = true;
    }
    return attrValue;
  }
  /**
   * Performs action encoded in the configuration object.
   *
   * @param {String} value Value read from the request / response.
   * @return {Promise} Promise resolved when the action is performed.
   */
  _performAction(value) {
    switch (this._action) {
      case 'assign-variable': return this._assignVariable(value);
      default: throw new Error('Unknown action: ' + this._action);
    }
  }
  /**
   * Assigns value to a variable.
   * It sends an event (Custom Event in a browser or EventEmmiter in node)
   * so the application can handle change of the variable in a correct way.
   *
   * @param {?String} value A value read from the source path.
   * @return {Promise} A promise resolved when the value is updated.
   */
  _assignVariable(value) {
    let detail = {
      variable: this._destination,
      value: value,
      permament: this._opts.permament
    };
    this.emit('variable-update-action', detail);
  }
}

if (isNode) {
  exports.RequestLogicAction = RequestLogicAction;
}
