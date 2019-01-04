/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   request-hooks-logic.html
 */

/// <reference path="../polymer/types/polymer-element.d.ts" />
/// <reference path="../variables-evaluator/variables-evaluator.d.ts" />
/// <reference path="request-logic-action.d.ts" />

declare namespace LogicElements {

  /**
   * A component responsible for logic for ARC's request and responses actions.
   *
   * Actions are logical operations that the user can define in the request panel
   * which the result is assigned to a variable.
   *
   * Note, this component does not use Polymer library. Use standard DOM methods
   * when using this element.
   */
  class RequestHooksLogic extends Polymer.Element {
    readonly evalElement: any;
    connectedCallback(): void;
    disconnectedCallback(): void;

    /**
     * A handler for the `run-response-actions` custom event.
     * It cancels the event and processes the actions.
     * See componnent description for event details info.
     */
    _handler(e: CustomEvent|null): void;
    processActions(actions: any, request: any, response: any): any;
    _evaluateAction(action: any): any;

    /**
     * Creates a copy of the actio object.
     *
     * @param action Action model
     * @returns Deep copy of the action model.
     */
    _copyAction(action: object|null): object|null;
    _runRecursive(actions: any, request: any, response: any): any;
  }
}

interface HTMLElementTagNameMap {
  "request-hooks-logic": LogicElements.RequestHooksLogic;
}
