//dependencies
var React = require('react');
var nodePromises = require('node-promises');
var Ftp = require('ftp');
var fs = nodePromises('fs');

// constant
var PROJECT_PATH = atom.project.getPaths()[0];
var SETTINGS_PATH = PROJECT_PATH + '/.ftp-settings.json';

module.exports = AtomReactStarter = {
  ftpClient: undefined,
  settings: {},

  //TODO: upload new files in the project
  /**
   *
   */
  activate: function() {
    alert('atom ftp editor activated make sure the settings (' + PROJECT_PATH + ') are correct');

    // register commands
    atom.commands.add('atom-workspace', {
      'ftp-editor:create': AtomReactStarter.createSettings,
      'ftp-editor:download': AtomReactStarter.downloadProject
    });

    // register listeners
    document.addEventListener('core:save', AtomReactStarter.__onsave);
  },

  /**
   *
   */
  __onsave: function() {
    if (!AtomReactStarter.ftpClient) {
      AtomReactStarter.ftpClient = new Ftp();
      AtomReactStarter.ftpClient.on('ready', AtomReactStarter.__uploadCurrent);
      AtomReactStarter.settings = require(SETTINGS_PATH);
      AtomReactStarter.ftpClient.connect(AtomReactStarter.settings);
    } else {
      AtomReactStarter.__uploadCurrent();
    }
  },

  /**
   *
   */
  __uploadCurrent: function() {
    //TODO: custom upload and download files
    var cleanPath = AtomReactStarter.__getCurrentFile()
                    .split(PROJECT_PATH).join('').replace(/\\/g, '/');
    AtomReactStarter.__upload(AtomReactStarter.__getCurrentFile(), AtomReactStarter.settings.path + cleanPath);
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
    fs.existsPromise(SETTINGS_PATH)
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
      var exists = args[0];

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

    AtomReactStarter.settings ? AtomReactStarter.settings = require(SETTINGS_PATH) : '';
    AtomReactStarter.ftpClient = new Ftp();
    AtomReactStarter.ftpClient.on('ready', AtomReactStarter.__setDefaults);
    AtomReactStarter.ftpClient.connect(AtomReactStarter.settings);

    //TODO: need to add loader that show if the project still download
  },

  /**
   *
   */
  __setDefaults: function() {
    AtomReactStarter.ftpClient.cwd(AtomReactStarter.settings.path, AtomReactStarter.__downloadProject);
  },

  /**
   *
   */
  __downloadProject: function(path) {
    var path = path || '';
    /**
     *
     */
    var __handleDownload = function(err, files) {
      var i;
      var files = files || [];

      for (i = 2; i < files.length; i++) {
        AtomReactStarter.__handleFile(path, files[i]);
      }
    };

    ////////////////////////////////
    AtomReactStarter.ftpClient.list(AtomReactStarter.settings.path + path, __handleDownload);

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
    var __isFolderExist = function(args) {
      var exists = args[0];
      if (exists) {
        AtomReactStarter.__downloadProject(remotePath);
        return [true];
      } else {
        return fs.mkdirPromise(localPath);
      }
    };
    /**
     *
     */
    var __continueRecursion = function(args) {
      var folderNotExist = args[0];
      if (!folderNotExist) {
        AtomReactStarter.__downloadProject(remotePath);
      }
    };
    /**
     *
     */
    var __singleFileHandler = function(args) {
      var exists = args[0];
      if (exists) {
        // TODO: if file exists need to check date modified and download if new on exists
        console.log('');
      } else {
        AtomReactStarter.__download(AtomReactStarter.settings.path + remotePath, localPath);
      }
    };

    ////////////////////////////
    if (file.type === 'd') { // if directory make sure exists and get all data from
      fs.existsPromise(localPath)
      .then(__isFolderExist).then(__continueRecursion);
    } else {
      fs.existsPromise(localPath)
      .then(__singleFileHandler);
    }
  },

  __download: function(fromFile, toFile) {
    AtomReactStarter.ftpClient.get(fromFile, function(err, stream) {
      if (err) {
        //TODO: add presist mode
        AtomReactStarter.__download(fromFile, toFile); // keep trying until everything done
      } else {
        //TODO: add indication for downloading
        console.log('download file' + toFile);

        stream.once('close', function() {
          AtomReactStarter.ftpClient.end();
        });

        stream.pipe(fs.createWriteStream(toFile));
      }
    });

  },

  __upload: function(fromFile, toFile) {
    AtomReactStarter.ftpClient.put(fromFile, toFile, function(err) {
      if (err) {throw err};

      //TODO: add indication for uploading
      console.log('upload file' + toFile);
      AtomReactStarter.ftpClient.end();
      AtomReactStarter.ftpClient = undefined;
    });
  }
};
