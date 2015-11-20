var React = require('react');

module.exports = (function() {
  var atomVisual = {};

  function init() {
    atomVisual.item = document.createElement("div");
    atom.workspace.addBottomPanel(atomVisual);
  }

  atomVisual.showLog = function(text) {
    React.render(
      <div>{{text}}</div>,
        atomVisual.item
      );
  }

  init();

  return atomVisual;

}());
