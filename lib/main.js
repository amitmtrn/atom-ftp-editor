var React = require("react");
var nodePromises = require('node-promises');
var fs = nodePromises('fs');

module.exports = AtomReactStarter = {
  panelItem: {},
  activate: function() {
    atom.commands.add('atom-workspace', {
      'ftp-editor:create': AtomReactStarter.createSettings
    });
    // document.addEventListener("core:save", function(e) {
    //   fs.existsPromise(atom.workspace.getActivePane().activeItem.buffer.file.path)
    //     .then(function (exists) {
    //       console.log(exists);s
    //     });
    // });
  },

  createSettings: function() {
    var projectPath = atom.project.getPaths();
    var settingsPath = projectPath[0] + '/.ftp-settings';

    fs.existsPromise(settingsPath)
    .then(function(args) {
      if(!args[0]) {
        return fs.writeFile(settingsPath, '{}');
      } else {
        return ['err - file already exists'];
      }
    }).then(function(args) {
      return require(settingsPath);
    }).then(function(data) {
      console.log(data);
    });
  },

  deactivate: function() {

  },

  serialize: function() {

  },

  toggle: function() {
    AtomReactStarter.panelItem
    .item = document.createElement("div");
    React.render(
      React.createElement("div", null, "my src test"),
        AtomReactStarter.panelItem.item
      );
      atom.workspace.addBottomPanel(AtomReactStarter.panelItem);
    }

  };
