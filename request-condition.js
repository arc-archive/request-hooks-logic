'use strict';
/* global self */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
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
}

if (typeof exports !== 'undefined') {
  exports.RequestLogicCondition = _RequestLogicCondition;
} else {
  window.RequestLogicCondition = _RequestLogicCondition;
}
