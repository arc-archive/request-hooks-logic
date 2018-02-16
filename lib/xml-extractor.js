'use strict';
/* global self */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
}

if (isNode) {
  var {ActionIterableObject} = require('./iterator-object');
}
(function(scope) {
  if (typeof scope.XmlExtractor === 'function') {
    return;
  }
  class XmlExtractor {
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
      if (isNode) {
        const {NodeXml} = require('./node/xml.js');
        const parser = new NodeXml(this._data);
        return parser.parse(this._path);
      }
      return this._getPayloadXmlValueWeb(this._data, this._path);
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
      return this._getValue(dom, path);
    }
    /**
     * Gets a value for the XML document for given path.
     *
     * @param {Document} dom DOM document.
     * @param {Array<String>} path Path to search for the value.
     * @return {String|undefined} Value for given path.
     */
    _getValue(dom, path) {
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
  }
  scope.XmlExtractor = XmlExtractor;
})(isNode ? exports : window);
