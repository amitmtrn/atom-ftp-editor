//dependencies
var React = require('react');
var nodePromises = require('node-promises');
var Ftp = require('ftp');
var fs = nodePromises('fs');

// constant
var PROJECT_PATH = atom.project.getPaths()[0];
var SETTINGS_PATH = PROJECT_PATH + '/.ftp-settings.json';

module.exports = AtomFtpEditor = {
  ftpClient: undefined,
  settings: {},
  panelItem: {},

  //TODO: upload new files in the project
  /**
   *
   */
  activate: function() {
    alert('atom ftp editor activated make sure the settings (' + PROJECT_PATH + ') are correct');
    AtomFtpEditor.panelItem.item = document.createElement("div");
    atom.workspace.addBottomPanel(AtomFtpEditor.panelItem);

    // register commands
    atom.commands.add('atom-workspace', {
      'ftp-editor:create': AtomFtpEditor.createSettings,
      'ftp-editor:download': AtomFtpEditor.downloadProject
    });

    // register listeners
    document.addEventListener('core:save', AtomFtpEditor.__onsave);
    document.addEventListener('link:open', AtomFtpEditor.test);
  },

  test: function(e) {
    console.log(e);
  },

  /**
   *
   */
  __onsave: function() {
    if (!AtomFtpEditor.ftpClient) {
      AtomFtpEditor.ftpClient = new Ftp();
      AtomFtpEditor.ftpClient.on('ready', AtomFtpEditor.__uploadCurrent);
      AtomFtpEditor.settings = require(SETTINGS_PATH);
      AtomFtpEditor.ftpClient.connect(AtomFtpEditor.settings);
    } else {
      AtomFtpEditor.__uploadCurrent();
    }
  },

  /**
   *
   */
  __uploadCurrent: function() {
    //TODO: custom upload and download files
    var cleanPath = AtomFtpEditor.__getCurrentFile()
                    .split(PROJECT_PATH).join('').replace(/\\/g, '/');
    AtomFtpEditor.__upload(AtomFtpEditor.__getCurrentFile(), AtomFtpEditor.settings.path + cleanPath);
  },

  /**
   *
   */
  __getCurrentFile: function() {
    return atom.workspace.getActivePane().activeItem.buffer.file.path;
  },

  /**
   *
   */
  createSettings: function() {
    AtomFtpEditor.ftpClient = undefined;
    fs.existsPromise(SETTINGS_PATH)
    .spread(function(exists) {
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
      };

      if (!exists) {
        return fs.writeFile(SETTINGS_PATH, JSON.stringify(defaultSettings));
      } else {
        return ['file already exists'];
      }
    });
  },

  /**
   *
   */
  downloadProject: function() {
    if (!window.confirm('Do you want to download all files?')) {
      return;
    }

    if (AtomFtpEditor.settings) {
      AtomFtpEditor.settings = require(SETTINGS_PATH);
    }

    AtomFtpEditor.ftpClient = new Ftp();
    AtomFtpEditor.ftpClient.on('ready', AtomFtpEditor.__setDefaults);
    AtomFtpEditor.ftpClient.connect(AtomFtpEditor.settings);

    //TODO: need to add loader that show if the project still download
  },

  /**
   *
   */
  __setDefaults: function() {
    AtomFtpEditor.ftpClient.cwd(AtomFtpEditor.settings.path, AtomFtpEditor.__downloadProject);
  },

  /**
   *
   */
  __downloadProject: function(pathInput) {
    var path = pathInput || '';
    /**
     *
     */
    var __handleDownload = function(err, filesInput) {
      var i;
      var files = filesInput || [];

      for (i = 2; i < files.length; i++) {
        AtomFtpEditor.__handleFile(path, files[i]);
      }
    };

    ////////////////////////////////
    AtomFtpEditor.ftpClient.list(AtomFtpEditor.settings.path + path, __handleDownload);
  },

  /**
   *
   */
  __handleFile: function(path, file) {
    var localPath = PROJECT_PATH + path + '/' + file.name;
    var remotePath = path + '/' + file.name;
    /**
     *
     */
    var __isFolderExist = function(exists) {
      if (exists) {
        AtomFtpEditor.__downloadProject(remotePath);
        return [true];
      } else {
        return fs.mkdirPromise(localPath);
      }
    };
    /**
     *
     */
    var __continueRecursion = function(folderNotExist) {
      if (!folderNotExist) {
        AtomFtpEditor.__downloadProject(remotePath);
      }
    };
    /**
     *
     */
    var __singleFileHandler = function(exists) {
      if (exists) {
        // TODO: if file exists need to check date modified and download if new on exists
        console.log('');
      } else {
        AtomFtpEditor.__download(AtomFtpEditor.settings.path + remotePath, localPath);
      }
    };

    ////////////////////////////
    if (file.type === 'd') { // if directory make sure exists and get all data from
      fs.existsPromise(localPath)
        .spread(__isFolderExist)
        .spread(__continueRecursion);
    } else {
      fs.existsPromise(localPath)
        .spread(__singleFileHandler);
    }
  },

  __download: function(fromFile, toFile) {
    AtomFtpEditor.ftpClient.get(fromFile, function(err, stream) {
      if (err) {
        //TODO: add presist mode
        AtomFtpEditor.__download(fromFile, toFile); // keep trying until everything done
      } else {
        AtomFtpEditor.showLog('download file ' + fromFile);
        stream.pipe(fs.createWriteStream(toFile));
      }
    });

  },

  __upload: function(fromFile, toFile) {
    AtomFtpEditor.ftpClient.put(fromFile, toFile, function(err) {
      if (err) {throw err;}

      AtomFtpEditor.showLog('upload file ' + fromFile);
      AtomFtpEditor.ftpClient.end();
      AtomFtpEditor.ftpClient = undefined;
    });
  },

  showLog: function(text) {
    React.render(
      React.createElement("div", null, {text}),
        AtomFtpEditor.panelItem.item
      );
  }

};
