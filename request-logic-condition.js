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
import './request-data-extractor.js';
/**
 * An element that performs a logic condition check defined in request / response
 * actions for ARC.
 *
 * @polymer
 * @customElement
 * @memberof LogicElements
 */
export class RequestLogicCondition extends LitElement {
  static get properties() {
    return {
      /**
       * A flag to determine if the condition is enabled.
       * When set the `satisfied()` function always returns `false`.
       */
      enabled: { type: Boolean },
      /**
       * Condition data source
       */
      source: { type: String },
      /**
       * The comparator name
       */
      operator: { type: String },
      /**
       * A value to test against the source value.
       */
      condition: { type: String }
    };
  }
  /**
   * @return {Element} A reference to `request-data-extractor` component
   */
  get extractor() {
    const k = 'request-data-extractor';
    let node = this.shadowRoot.querySelector(k);
    if (!node) {
      node = document.createElement(k);
      this.shadowRoot.appendChild(node);
    }
    return node;
  }
  /**
   * Checks if the condition has been satified for current request and response
   * objects.
   *
   * @param {Object} request The ARC request object. Comnatins `url`, `method`,
   * `headers` and `payload` (all strings)
   * @param {Object} response {Object} ARC Response object as defined in
   * https://github.com/advanced-rest-client/api-components-api/blob/master/
   * docs/api-request-and-response.md
   * @return {Boolean} True if the condition is satisfied and false otherwise.
   */
  satisfied(request, response) {
    if (!this.enabled) {
      return false;
    }
    const extractor = this.extractor;
    extractor.request = request;
    extractor.response = response;
    extractor.path = this.source;
    const value = extractor.extract();
    return this.checkCondition(value, this.operator, this.condition);
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
        const result = value.indexOf(Number(condition));
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
      re = new RegExp(condition, 'm');
    } catch (e) {
      return false;
    }
    value = String(value);
    return re.test(value);
  }
}
window.customElements.define('request-logic-condition', RequestLogicCondition);
