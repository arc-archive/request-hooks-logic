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
import {PolymerElement} from '../../@polymer/polymer/polymer-element.js';
import './request-logic-condition.js';
import './request-data-extractor.js';
/**
 * An element that runs request / response action.
 *
 * @polymer
 * @customElement
 * @memberof LogicElements
 */
export class RequestLogicAction extends PolymerElement {
  static get properties() {
    return {
      /**
       * Action's source value
       */
      source: String,
      /**
       * Source as a path.
       * @type {Array<String>}
       */
      _sourcePath: {
        type: Array,
        computed: '_computeSourcePath(source)'
      },
      /**
       * An action to perform.
       * Supported actions are:
       *
       * - assign-variable
       * - store-variable
       */
      action: String,
      /**
       * The destination variable name.
       */
      destination: String,
      /**
       * List of conditions to use. See RequestLogicCondition class for
       * description.
       * @type {Array<Object>}
       */
      conditions: Array,
      // Computed list of condition instances
      _conditions: {
        type: Array,
        computed: '_prepareConditions(conditions)'
      },
      /**
       * Iterator object.
       * See `request-actions-panel` for more details.
       */
      iterator: Object,
      iteratorEnabled: Boolean
    };
  }

  /**
   * @return {Object} A reference to `request-data-extractor` component
   */
  get extractor() {
    if (!this.$) {
      this.$ = {};
    }
    const k = 'request-data-extractor';
    if (!this.$[k]) {
      this.$[k] = document.createElement(k);
    }
    return this.$[k];
  }

  _computeSourcePath(source) {
    return source && source.split('.');
  }
  /**
   * Prepares list of condition objects.
   * It throws an error if condition is not validated.
   *
   * @param {Array<Object>} conditions List of condition model.
   * @return {Array<RequestLogicCondition>|undefined} Liost of condition class
   * instances or undefined when no argument.
   */
  _prepareConditions(conditions) {
    if (!conditions) {
      return;
    }
    const result = [];
    for (let i = 0, len = conditions.length; i < len; i++) {
      const info = conditions[i];
      if (!info.enabled) {
        continue;
      }
      const c = document.createElement('request-logic-condition');
      c.enabled = true;
      c.source = info.source;
      c.operator = info.operator;
      c.condition = info.condition;
      result.push(c);
    }
    return result;
  }

  /**
   * Runs the request hook action.
   *
   * @param {Request} request ARC request object
   * @param {Response} response ARC response object
   * @return {Promise} Promise resolved to Boolean `true` if the action was
   * performed or `false` if the action wasn't performed because haven't meet
   * defined conditions.
   */
  run(request, response) {
    const cResult = this._areConditionsMeet(request, response);
    if (!cResult) {
      return Promise.resolve(false);
    }
    return this._execute(request, response);
  }
  /**
   * Executes the action after the condisions are meet.
   *
   * @param {Request} request ARC request object
   * @param {Response} response ARC response object
   * @return {Promise} Promise resolved fo Boolean `true`
   */
  _execute(request, response) {
    const extractor = this.extractor;
    extractor.request = request;
    extractor.response = response;
    extractor.path = this.source;
    const iterator = this.iteratorEnabled ? this.iterator : undefined;
    const value = extractor.extract(iterator);
    return this._performAction(value)
    .then(() => true);
  }
  /**
   * Checks is conditions for the actions are meet.
   *
   * @param {Request} request ARC request object
   * @param {Response} response ARC response object
   * @return {Boolean} False of any of the conditions aren't meet.
   */
  _areConditionsMeet(request, response) {
    const cond = this._conditions;
    if (!cond || !cond.length) {
      return true;
    }
    for (let i = 0, len = cond.length; i < len; i++) {
      if (!cond[i].satisfied(request, response)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Performs action encoded in the configuration object.
   *
   * @param {String} value Value read from the request / response.
   * @return {Promise} Promise resolved when the action is performed.
   */
  _performAction(value) {
    switch (this.action) {
      case 'assign-variable': return this._assignVariable(value);
      case 'store-variable': return this._storeVariable(value);
      default: throw new Error('Unknown action: ' + this.action);
    }
  }
  /**
   * Assigns value to a variable.
   * It sends an event (Custom Event in a browser or EventEmmiter in node)
   * so the application can handle change of the variable in a correct way.
   * This event mean to update variable value in memory only. The implementation
   * should not store the new value in the data store.
   *
   * @param {?String} value A value read from the source path.
   * @return {Promise} A promise resolved when the value is updated.
   */
  _assignVariable(value) {
    const detail = {
      variable: this.destination,
      value: value
    };
    this.dispatchEvent(new CustomEvent('variable-update-action', {
      bubbles: true,
      composed: true,
      detail
    }));
    return Promise.resolve();
  }
  /**
   * Assigns value to a variable.
   * It sends an event (Custom Event in a browser or EventEmmiter in node)
   * so the application can handle change of the variable in a correct way.
   *
   * This event mean to update variable value and store it in the data store.
   *
   * @param {?String} value A value read from the source path.
   * @return {Promise} A promise resolved when the value is updated.
   */
  _storeVariable(value) {
    const detail = {
      variable: this.destination,
      value: value
    };
    this.dispatchEvent(new CustomEvent('variable-store-action', {
      bubbles: true,
      composed: true,
      detail
    }));
    return Promise.resolve();
  }
}
window.customElements.define('request-logic-action', RequestLogicAction);