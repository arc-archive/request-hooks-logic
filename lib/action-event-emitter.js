window.ActionEventEmitter = function() {};
window.ActionEventEmitter.prototype.emit = function(type, detail) {
  let ev = new CustomEvent(type, {
    bubbles: true,
    detail: detail,
    cancelable: true
  });
  document.body.dispatchEvent(ev);
  return ev;
};
