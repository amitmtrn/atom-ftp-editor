var React = require("react");
var nodePromises = require('node-promises');
var Ftp = require('ftp');
var fs = nodePromises('fs');

module.exports = AtomReactStarter = {
  panelItem: {},
  ftpClient: undefined,
  activate: function() {
    atom.commands.add('atom-workspace', {
      'ftp-editor:create': AtomReactStarter.createSettings
    });
    document.addEventListener("core:save", function(e) {
      fs.existsPromise(atom.workspace.getActivePane().activeItem.buffer.file.path)
        .then(function (exists) { // upload the new file to the ftp host
          console.log(exists);
        });
    });
  },

  createSettings: function() {
    var projectPath = atom.project.getPaths();
    var settingsPath = projectPath[0] + '/.ftp-settings';

    fs.existsPromise(settingsPath)
    .then(function(args) {
      if(!args[0]) {
        return fs.writeFile(settingsPath, '{}');
      } else {
        return ['file already exists'];
      }
    }).then(function(args) {
      return require(settingsPath);
    }).then(function(data) {
      AtomReactStarter.ftpClient = new Ftp(data);
      // Going through each file and check the modified date.
      // if the file is newer the the local it download it.
      AtomReactStarter.ftpClient.on('ready', AtomReactStarter.getAllData);
    });
  },

  getAllData: function() {

  },

  deactivate: function() {

  },

  serialize: function() {

  },

  toggle: function() {
    AtomReactStarter.panelItem
    .item = document.createElement("div");
    React.render(
      <div>my src test</div>,
        AtomReactStarter.panelItem.item
      );
      atom.workspace.addBottomPanel(AtomReactStarter.panelItem);
    }

  };
