var React = require('react');

module.exports = (function () {
  var atomVisual = {};

  function init() {
    atomVisual.item = document.createElement("div");
    atom.workspace.addBottomPanel(atomVisual);
  }

  atomVisual.showLog = function (text) {
    React.render(React.createElement(
      "div",
      null,
      { text }
    ), atomVisual.item);
  };

  init();

  return atomVisual;
})();