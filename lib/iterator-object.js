'use strict';
/* global self */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
}

(function(scope) {
  if (typeof scope.ActionIterableObject === 'function') {
    return;
  }
  /**
   * Class responsible for extracting data from JSON values.
   */
  class ActionIterableObject {
    /**
     * @constructor
     * @param {Object} opts Iterator options
     */
    constructor(opts) {
      opts = opts || {};
      this._validate(opts);
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
     */
    _validate(opts) {
      var valid = true;
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
        let ops = [
          'equal', 'not-equal', 'greater-than', 'greater-than-equal',
          'less-than', 'less-than-equal', 'contains', 'regex'
        ];
        if (ops.indexOf(opts.operator) === -1) {
          valid = false;
        }
      }
      this.valid = valid;
    }
  }
  scope.ActionIterableObject = ActionIterableObject;
})(isNode ? exports : window);
