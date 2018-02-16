'use strict';
/* global self, URLSearchParams */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
}

(function(scope) {
  if (typeof scope.DataExtractor === 'function') {
    return;
  }
  /**
   * Extracts the data from either request or response.
   */
  class DataExtractor {
    /**
     * @constructor
     * @param {Object} options Request, response and bodies.
     */
    constructor(options) {
      this._request = options.request;
      this._requestBody = options.requestBody;
      this._response = options.response;
      this._responseBody = options.responseBody;
      this._pathDelimiter = options.pathDelimiter || '.';
    }
    /**
     * Gets the data from selected path.
     *
     * @param {Array<String>|String} path Data path. Either array of path segments
     * or full path as string.
     * @param {Object} iterator Iterator model. Used only with response body.
     * @return {String|Number|undefined} Data to be processed
     */
    extract(path, iterator) {
      if (typeof path === 'string') {
        path = path.split(this._pathDelimiter);
      }
      let source;
      if (path[0] === 'request') {
        source = this._request;
      } else {
        iterator = undefined;
        source = this._response;
      }
      switch (path[1]) {
        case 'url': return this._getDataUrl(source.url, path.slice(2));
        case 'headers': return this._getDataHeaders(source, path.slice(2));
        case 'status': return this._getDataStatus(source);
        case 'body':
          const ct = source.headers.get('content-type');
          if (path[0] === 'request') {
            source = this._requestBody;
          } else {
            source = this._responseBody;
          }
          return this._getPayloadValue(source, ct, path.slice(2), iterator);
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
      let obj;
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
      let headers = source.headers;
      if (!path || !path.length) {
        return;
      }
      return headers.get(path[0]);
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
      if (typeof data !== 'string') {
        return;
      }
      if (contentType.indexOf('application/json') !== -1) {
        let clz = scope.JsonExtractor;
        if (isNode) {
          clz  = require('./json-extractor').JsonExtractor;
        }
        const extractor = new clz(data, path, iterator);
        return extractor.extract();
      }
      if (contentType.indexOf('/xml') !== -1 ||
          contentType.indexOf('+xml') !== -1 ||
          contentType.indexOf('text/html' === 0)) {
        let clz = scope.XmlExtractor;
        if (isNode) {
          clz  = require('./xml-extractor').XmlExtractor;
        }
        const extractor = new clz(data, path, iterator);
        return extractor.extract();
      }
    }

    /**
     * Returns status code from the response object.
     * If the source is the `Request` object then it returns `undefined`.
     *
     * @param {Request|Response} source Reuest or Response object.
     * @return {Number|undefined} Status code or `undefined` if not set.
     */
    _getDataStatus(source) {
      return source.status;
    }
  }
  scope.DataExtractor = DataExtractor;
})(isNode ? exports : window);
