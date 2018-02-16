'use strict';
/* global self */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
}

(function(scope) {
  if (typeof scope.RequestLogicCondition === 'function') {
    return;
  }
  /**
   * Conditions check for request and response objects.
   *
   * Condition data model:
   * ```javascript
   * {
   *  source: 'String', // the same as for action
   *  operator: 'String', // see below for list of all operators
   *  condition: 'any' // value to use to compare the value get from the action `source` property
   * }
   * ```
   * Operator can be one of:
   * - equal
   * - not-equal
   * - greater-than
   * - greater-than-equal
   * - less-than
   * - less-than-equal
   * - contains
   * - regex
   *
   * Contains can operate on strings, simple arrays (e.g. `['test', 123]`) or
   * objects (e.g. {'key':'value'}).
   */
  class RequestLogicCondition {
    constructor(condition) {
      this.enabled = typeof condition.enabled === 'undefined' ? true : condition.enabled;
      if (!this.enabled) {
        return;
      }
      RequestLogicCondition.validate(condition);
      this._source = condition.source;
      this._operator = condition.operator;
      this._condition = condition.condition;
    }

    /**
     * Validates condition definition object.
     *
     * @param {Object} condition Condition definition model. See constructor for details.
     */
    static validate(condition) {
      if (!condition) {
        throw new Error('The definition definition is missing.');
      }
      var errors = [];
      if (!condition.source) {
        errors.push('Definition source is missing');
      }
      if (!condition.operator) {
        errors.push('Definition operator is missing');
      }
      if (!condition.condition) {
        errors.push('Definition condition is missing');
      }
      if (errors.length) {
        throw new Error('Action did not pass validation: \n' + errors.join('\n'));
      }
    }
    /**
     * Checks if the condition has been satified for current request and response
     * objects.
     *
     * @param {Object} requestData Request and response data:
     * - request {Request} The Request object as defin ed in Fetch api
     * - response {Response} The Response object as defin ed in Fetch api
     * - requestBody {String} Optional, body (as text) sent with the request
     * - responseBody {String} Optional, body (as text) received with the response
     * @return {Boolean} True if the condition is satisfied and false otherwise.
     */
    satisfied(requestData) {
      if (!this.enabled) {
        return true;
      }
      let Clz = scope.DataExtractor;
      if (isNode) {
        Clz = require('./data-extractor').DataExtractor;
      }
      const extractor = new Clz(requestData);
      const value = extractor.extract(this._source);
      return this.checkCondition(value, this._operator, this._condition);
    }
    /**
     * Checks if given condition is satisfied by both value and operator.
     *
     * @param {any} value Value rread from the response / request object
     * @param {String} operator Comparition term.
     * @param {String} condition Value to compare.
     * @return {Boolean} True if the condition is satisfied and false otherwise.
     */
    checkCondition(value, operator, condition) {
      switch (operator) {
        case 'equal': return this.isEqual(value, condition);
        case 'not-equal': return this.isNotEqual(value, condition);
        case 'greater-than': return this.isGreaterThan(value, condition);
        case 'greater-than-equal': return this.isGreaterThanEqual(value, condition);
        case 'less-than': return this.isLessThan(value, condition);
        case 'less-than-equal': return this.isLessThanEqual(value, condition);
        case 'contains': return this.contains(value, condition);
        case 'regex': return this.isRegex(value, condition);
      }
    }
    /**
     * Checks if values equal.
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value
     * @return {Boolean} True if objects matches.
     */
    isEqual(value, condition) {
      if (typeof value !== 'undefined') {
        value = String(value);
      }
      if (typeof condition !== 'undefined') {
        condition = String(condition);
      }
      if (!isNaN(condition)) {
        condition = Number(condition);
        value = Number(value);
        return value === condition;
      }
      return condition === value;
    }
    /**
     * Oposite of `isEqual()`.
     *
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value
     * @return {Boolean} False if objects matches.
     */
    isNotEqual(value, condition) {
      return !this.isEqual(value, condition);
    }
    /**
     * Checks if value is less than comparator.
     *
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value
     * @return {Boolean} True if value is less than condition.
     */
    isLessThan(value, condition) {
      condition = Number(condition);
      value = Number(value);
      if (condition !== condition || value !== value) {
        return false;
      }
      return value < condition;
    }
    /**
     * Checks if value is less than or equal to comparator.
     *
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value
     * @return {Boolean} True if value is less than or equal to `condition`.
     */
    isLessThanEqual(value, condition) {
      condition = Number(condition);
      value = Number(value);
      if (condition !== condition || value !== value) {
        return false;
      }
      return value <= condition;
    }
    /**
     * Checks if value is greater than comparator.
     *
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value
     * @return {Boolean} True if value is greater than `condition`.
     */
    isGreaterThan(value, condition) {
      condition = Number(condition);
      value = Number(value);
      if (condition !== condition || value !== value) {
        return false;
      }
      return value > condition;
    }
    /**
     * Checks if value is greater than or equal to comparator.
     *
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value
     * @return {Boolean} True if value is greater than or equal to `condition`.
     */
    isGreaterThanEqual(value, condition) {
      condition = Number(condition);
      value = Number(value);
      if (condition !== condition || value !== value) {
        return false;
      }
      return value >= condition;
    }
    /**
     * Checks if value contains the `condition`.
     * It works on strings, arrays and objects.
     *
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value
     * @return {Boolean} True if value contains the `condition`.
     */
    contains(value, condition) {
      if (!value) {
        return false;
      }
      if (typeof value === 'string') {
        return value.indexOf(condition) !== -1;
      }
      if (value instanceof Array) {
        if (!isNaN(condition) && typeof condition !== 'number') {
          let result = value.indexOf(Number(condition));
          if (result !== -1) {
            return true;
          }
        }
        return value.indexOf(condition) !== -1;
      }
      if (typeof value !== 'object') {
        return false;
      }
      return condition in value;
    }
    /**
     * Checks if `value` can be tested agains regular expression.
     *
     * @param {String|any} value Value to compare
     * @param {String|any} condition Comparator value - regex string.
     * @return {Boolean} Value of calling `test()` function on stirng.
     */
    isRegex(value, condition) {
      let re;
      try {
        re = new RegExp(condition);
      } catch (e) {
        return false;
      }
      value = String(value);
      return value.test(re);
    }
  }
  scope.RequestLogicCondition = RequestLogicCondition;
})(isNode ? exports : window);
