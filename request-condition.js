'use strict';
/* global self */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
}

if (isNode) {
  var {DataExtractor} = require('./data-extractor.js');
}

class _RequestLogicCondition {
  constructor(condition) {
    _RequestLogicCondition.validate(condition);
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
    const extractor = new DataExtractor(requestData);
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
      case 'grather-than': return this.isGratherThan(value, condition);
      case 'grather-than-equal': return this.isGratherThanEqual(value, condition);
      case 'less-than': return this.isLessThan(value, condition);
      case 'less-than-equal': return this.isLessThanEqual(value, condition);
      case 'contains': return this.contains(value, condition);
    }
  }

  isEqual(value, condition) {
    if (value) {
      value = String(value);
    }
    if (!isNaN(condition)) {
      condition = Number(condition);
      value = Number(value);
      return value === condition;
    }
    return condition === value;
  }

  isNotEqual(value, condition) {
    if (value) {
      value = String(value);
    }
    if (!isNaN(condition)) {
      condition = Number(condition);
      value = Number(value);
      return value !== condition;
    }
    return condition !== value;
  }

  isLessThan(value, condition) {
    condition = Number(condition);
    value = Number(value);
    if (condition !== condition || value !== value) {
      return false;
    }
    return value < condition;
  }

  isLessThanEqual(value, condition) {
    condition = Number(condition);
    value = Number(value);
    if (condition !== condition || value !== value) {
      return false;
    }
    return value <= condition;
  }

  isGratherThan(value, condition) {
    condition = Number(condition);
    value = Number(value);
    if (condition !== condition || value !== value) {
      return false;
    }
    return value > condition;
  }

  isGratherThanEqual(value, condition) {
    condition = Number(condition);
    value = Number(value);
    if (condition !== condition || value !== value) {
      return false;
    }
    return value >= condition;
  }

  contains(value, condition) {
    if (!value) {
      return false;
    }
    if (typeof value === 'string' || value instanceof Array) {
      return value.indexOf(condition) !== -1;
    }
    if (typeof value !== 'object') {
      return false;
    }
    return condition in value;
  }
}

if (typeof exports !== 'undefined') {
  exports.RequestLogicCondition = _RequestLogicCondition;
} else {
  window.RequestLogicCondition = _RequestLogicCondition;
}
