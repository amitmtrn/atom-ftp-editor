var React = require('react');

module.exports = atomVisual = (function() {
  function init() {
    atomVisual.panelItem = document.createElement("div");
    atom.workspace.addBottomPanel(atomVisual.panelItem);
  }

  function showLog(text) {
    React.render(
      <div>{{text}}</div>,
        AtomFtpEditor.panelItem
      );
  }

  init();

  return {
    showLog: showLog
  };

}());
