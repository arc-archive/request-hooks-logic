'use strict';
const xml = require('xml-parse');
/**
 * Nodes implementation of getting XML value from JSON path.
 */
class NodeXml{
  /**
   * @constructor
   * @param {String} xmlStr XML strin from the HTTP response / request
   */
  constructor(xmlStr) {
    this.xmlStr = xmlStr;
  }
  /**
   * Searches for value for given path.
   * Note, this function always returns Strning value, whether the value is
   * numeric, boolean or nullable.
   *
   * @param {Array<String>} path Path to search for the value.
   * @return {String|undefined} Returned value for path or undefined if not found.
   */
  parse(path) {
    var doc = new xml.DOM(xml.parse(this.xmlStr)).document;
    return this._getValue(doc, path);
  }
  /**
   * Recursively iterates over the path and tries to read value for it.
   *
   * @param {Element} dom xml-parse library Element object
   * @param {Array<String>} path The path to iterate over.
   * @return {String|undefined} Returned value for path or undefined if not found.
   */
  _getValue(dom, path) {
    let part = path.shift();
    if (!dom) {
      return;
    }
    if (!part) {
      return dom.innerXML;
    }
    part = part.trim();
    if (part.trim().indexOf('attr(') === 0) {
      return this._valueForAttr(dom, part);
    }
    if (!isNaN(part)) {
      return this._valueForNumber(dom, part, path);
    }
    let element = dom.getElementsByTagName(part);
    if (!isNaN(path[0])) {
      let next = Number(path[0]);
      path.shift();
      element = element[next];
    } else {
      element = element[0];
    }
    return this._getValue(element, path);
  }
  /**
   * Gets the value for a number argument for the path.
   * @param {Element} dom xml-parse library Element object
   * @param {Number} part Current part of the path.
   * @param {Array<String>} path The path to iterate over.
   * @return {String|undefined} Returned value for path or undefined if not found.
   */
  _valueForNumber(dom, part, path) {
    if (!(dom instanceof Array)) {
      return;
    }
    part = Number(part);
    return this._getValue(dom[part], path);
  }
  /**
   * Reads attribute value for current path.
   *
   * @param {Element} dom xml-parse library Element object
   * @param {Number} part Current part of the path.
   * @return {String|undefined} Returned value for path or undefined if not found.
   */
  _valueForAttr(dom, part) {
    let match = part.match(/attr\((.+)\)/);
    if (!match) {
      return;
    }
    let attrName = match[1];
    return dom.attributes[attrName];
  }
}
exports.NodeXml = NodeXml;
