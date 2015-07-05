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
      if(!AtomReactStarter.ftpClient) {
        AtomReactStarter.ftpClient = new Ftp();
        AtomReactStarter.ftpClient.on('ready', AtomReactStarter.uploadThisFile);
        AtomReactStarter.settings = require(atom.project.getPaths()[0] + '/.ftp-settings.json');
        AtomReactStarter.ftpClient.connect(AtomReactStarter.settings);
      }
    });
  },
  uploadThisFile: function() {
    var projectPath = atom.project.getPaths()[0];
    var path = atom.workspace.getActivePane().activeItem.buffer.file.path.split(atom.project.getPaths()[0]).join('');
    AtomReactStarter.uploadToFtp(atom.workspace.getActivePane().activeItem.buffer.file.path, AtomReactStarter.settings.path + path.replace(/\\/g, '/'));
  },
  createSettings: function() {
    if (!window.confirm("Do you want to download all files?")) {
      return;
    }
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
                AtomReactStarter.downloadFromFtp(AtomReactStarter.settings.path + path + '/' + files[i].name, projectPath + path + '/' + files[i].name);
              }
            });
          }
        }(i, path, files));
      }
    });

  },

  downloadFromFtp: function(fromFile, toFile) {
    AtomReactStarter.ftpClient.get(fromFile, function(err, stream) {
      if (err) {
        AtomReactStarter.downloadFromFtp(fromFile, toFile);
      } else {
        stream.once('close', function() { AtomReactStarter.ftpClient.end(); });
        stream.pipe(fs.createWriteStream(toFile));
      }
    });

  },

  uploadToFtp: function(fromFile, toFile){
    AtomReactStarter.ftpClient.put(fromFile, toFile, function(err) {
      if (err) throw err;
      AtomReactStarter.ftpClient.end();
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
