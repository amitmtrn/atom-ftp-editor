var React = require("react");
var nodePromises = require('node-promises');
var Ftp = require('ftp');
var fs = nodePromises('fs');

module.exports = AtomReactStarter = {
  panelItem: {},
  ftpClient: undefined,
  settings: {},
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
    var settingsPath = projectPath[0] + '/.ftp-settings.json';

    fs.existsPromise(settingsPath)
    .then(function(args) {
      var defaultSettings = {
        host: 'localhost',
        port: '21',
        secure: false,
        secureOptions: undefined,
        user: 'anonymous',
        password: 'anonymous@',
        connTimeout: 10000,
        pasvTimeout: 10000,
        keepalive: 10000,
        path: '/www'
      }
      if(!args[0]) {
        return fs.writeFile(settingsPath, JSON.stringify(defaultSettings));
      } else {
        return ['file already exists'];
      }
    }).then(function(args) {
      return AtomReactStarter.settings = require(settingsPath);
    }).then(function(data) {
      AtomReactStarter.ftpClient = new Ftp();
      // Going through each file and check the modified date.
      // if the file is newer the the local it download it.
      AtomReactStarter.ftpClient.on('ready', AtomReactStarter.setDefaults);
      AtomReactStarter.ftpClient.connect(data);
    });
  },
  setDefaults: function() {
    AtomReactStarter.ftpClient.cwd(AtomReactStarter.settings.path, AtomReactStarter.getAllData);
  },
  getAllData: function(path) {
    var path = path || '';
    AtomReactStarter.ftpClient.list(AtomReactStarter.settings.path + path, function(err, files) {
      var i;
      var files = files || [];
      for(i = 2; i < files.length; i++) {
        (function(i, path, files){
          var projectPath = atom.project.getPaths()[0];
          if(files[i].type === 'd') { // if directory make sure exists and get all data from
            fs.existsPromise(projectPath + path + '/' + files[i].name)
            .then(function(args) {
              if(args[0]) {
                AtomReactStarter.getAllData(path + '/' + files[i].name);
                return [true];
              } else {
                return fs.mkdirPromise(projectPath + path + '/' + files[i].name);
              }
            }).then(function(args) {
              if(!args[0]) {
                AtomReactStarter.getAllData(path + '/' + files[i].name);
              }
            });
          } else {
            fs.existsPromise(projectPath + path + '/' + files[i].name)
            .then(function(args){
              if(args[0]) {

              } else {

              }
            });
          }
        }(i, path, files));
      }
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
      <div>my src test</div>,
        AtomReactStarter.panelItem.item
      );
      atom.workspace.addBottomPanel(AtomReactStarter.panelItem);
    }

  };
