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
  settings: undefined,
  panelItem: {},

  config: {
    autoDownloadOnOpen: {
      type: 'boolean',
      default: true
    },
    autoUploadOnSave: {
      type: 'boolean',
      default: true
    },
    presistDownload: {
      type: 'boolean',
      default: true
    }
  },
  //TODO: upload new folder in the project
  /**
   *
   */
  activate: function() {
    AtomFtpEditor.panelItem.item = document.createElement("div");
    atom.workspace.addBottomPanel(AtomFtpEditor.panelItem);
    AtomFtpEditor.showLog('atom ftp editor activated make sure the settings (' + PROJECT_PATH + ') are correct');

    // register commands
    atom.commands.add('atom-workspace', {
      'ftp-editor:create': AtomFtpEditor.createSettings,
      'ftp-editor:download': AtomFtpEditor.downloadProject,
      'ftp-editor:current-download': AtomFtpEditor.currentDownload,
      'ftp-editor:current-upload': AtomFtpEditor.currentUpload
    });

    // register listeners
    if (atom.config.get('atom-ftp-editor.autoUploadOnSave')) {
      document.addEventListener('core:save', AtomFtpEditor.__onsave);
    }
    if (atom.config.get('atom-ftp-editor.autoDownloadOnOpen')) {
      atom.workspace.paneContainer.observePaneItems(AtomFtpEditor.__onopen);
    }
  },

  currentDownload: function() {
    var cleanPath = AtomFtpEditor.__getCurrentFile()
                    .split(PROJECT_PATH).join('').replace(/\\/g, '/');
    if (!AtomFtpEditor.ftpClient) {
      AtomFtpEditor.__createFTP(AtomFtpEditor.currentDownload);
    } else {
      AtomFtpEditor.__download(AtomFtpEditor.settings.path + cleanPath, AtomFtpEditor.__getCurrentFile());
    }
  },

  currentUpload: function() {
    if (!AtomFtpEditor.ftpClient) {
      AtomFtpEditor.__createFTP(AtomFtpEditor.__uploadCurrent);
    } else {
      AtomFtpEditor.__uploadCurrent();
    }

  },

  __onopen: function(e) {
    if (!e || !e.getPath) {
      return;
    }
    var cleanPath = e.getPath()
                    .split(PROJECT_PATH).join('').replace(/\\/g, '/');
    if (!AtomFtpEditor.ftpClient) {
      AtomFtpEditor.__createFTP(AtomFtpEditor.__onopen);
    } else {
      AtomFtpEditor.__download(AtomFtpEditor.settings.path + cleanPath, e.getPath());
    }
  },

  /**
   *
   */
  __onsave: function() {
    if (!AtomFtpEditor.ftpClient) {
      AtomFtpEditor.__createFTP(AtomFtpEditor.__uploadCurrent);
    } else {
      AtomFtpEditor.__uploadCurrent();
    }
  },

  __createFTP: function(func) {
    AtomFtpEditor.ftpClient = new Ftp();
    AtomFtpEditor.ftpClient.on('ready', func);
    if (!AtomFtpEditor.settings) {
      AtomFtpEditor.settings = require(SETTINGS_PATH);
    }
    AtomFtpEditor.ftpClient.connect(AtomFtpEditor.settings);
    // AtomFtpEditor.ftpClient.on('close', function(e){debugger;});
  },

  /**
   *
   */
  __uploadCurrent: function() {
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

    AtomFtpEditor.__createFTP(AtomFtpEditor.__setDefaults);

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
    AtomFtpEditor.showLog('downloading file ' + fromFile);
    AtomFtpEditor.ftpClient.get(fromFile, function(err, stream) {
      if (err) {
        AtomFtpEditor.showLog('Error downloading ' + fromFile + 'will try again later');
        if (atom.config.get('atom-ftp-editor.presistDownload')) {
          AtomFtpEditor.__download(fromFile, toFile); // keep trying until everything done
        }
      } else {
        AtomFtpEditor.showLog('downloaded ' + fromFile);
        stream.pipe(fs.createWriteStream(toFile));
      }
    });

  },

  __upload: function(fromFile, toFile) {
    if(fromFile.replace(/\\/g, '/') === SETTINGS_PATH.replace(/\\/g, '/')) { //with slashfix
      AtomFtpEditor.showLog('you shouldn\'t upload the config file :/');
      return;
    } else {
      AtomFtpEditor.showLog('uploading ' + fromFile);
    }

    AtomFtpEditor.ftpClient.put(fromFile, toFile, function(err) {
      if (err) {throw err;}

      AtomFtpEditor.showLog('uploaded ' + fromFile);
      AtomFtpEditor.ftpClient.end();
      AtomFtpEditor.ftpClient = undefined;
    });
  },

  showLog: function(text) {
    console.log(text);
    React.render(
      React.createElement("div", null, {text}),
        AtomFtpEditor.panelItem.item
      );
  }

};
