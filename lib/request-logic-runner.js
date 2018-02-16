'use strict';
/* global self */
var isNode = true;
if (typeof window !== 'undefined' || (typeof self !== 'undefined' && self.importScripts)) {
  isNode = false;
}

if (isNode) {
  var {RequestLogicAction} = require('./request-action.js');
  var ActionEventEmitter = require('events');
}
(function(scope) {
  if (typeof scope.RequestLogicRunner === 'function') {
    return;
  }
  class RequestLogicRunner extends ActionEventEmitter {
    /**
     * @constructor
     * @param {Array<Object>} actions List of action definitions.
     */
    constructor(actions) {
      if (!actions || !actions.length) {
        throw new Error('Actions not specified.');
      }
      super();
      this._actions = actions.map((config) => {
        return new RequestLogicAction(config);
      });
    }
    /**
     * Runs all actions for the request / response objects.
     *
     * @param {Request} request Request object as defined in Fetch API
     * @param {Response} response Response object as defined in Fetch API
     * @return {Promise} Promise resolved when all actions finish.
     */
    run(request, response) {
      return this._runRecursive(this._actions, request, response);
    }

    _runRecursive(actions, request, response) {
      if (!actions || !actions.length) {
        return Promise.resolve();
      }
      const action = actions.shift();
      this._attachListeners(action);
      return action.run(request, response)
      .then(() => {
        this._detatchListeners(action);
        return this._runRecursive(actions, request, response);
      });
    }

    _attachListeners(action) {
      if (isNode) {
        let l1 = this._actionHandler.bind(this, 'variable-store-action');
        let l2 = this._actionHandler.bind(this, 'variable-update-action');
        action.on('variable-store-action', l1);
        action.on('variable-update-action', l2);
      }
    }

    _detatchListeners(action) {
      if (isNode) {
        action.removeAllListeners('variable-store-action');
        action.removeAllListeners('variable-update-action');
      }
    }

    _actionHandler(type, detail) {
      if (isNode) {
        this.emit(type, detail);
      }
    }
  }
  scope.RequestLogicRunner = RequestLogicRunner;
})(isNode ? exports : window);
