//dependencies
const nodePromises = require('node-promises');
const Ftp = require('ftp');
const fs = nodePromises('fs');
const atomVisual = require('./modules/atom-visual');

// constant
const PROJECT_PATHS = atom.project.getPaths();
const SETTINGS_FILE_NAME = '/.ftp-settings.json';
const SETTINGS_PATH = PROJECT_PATHS[0] + SETTINGS_FILE_NAME;
const FTP = new WeakMap();
const CONNECTION = Symbol('connection');

const config = {
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
}

//////////////////////////////////////////////

module.exports = {
  config: config,
  activate: activate
}

//////////////////////////////////////////////

function activate() {
  // register commands
  atom.commands.add('atom-workspace', {
    'ftp-editor:create': createSettings,
    'ftp-editor:download': ()=>connect(downloadProject),
    // 'ftp-editor:current-download': currentDownload,
    // 'ftp-editor:current-upload': currentUpload
  });

  // register listeners
  // if (atom.config.get('atom-ftp-editor.autoUploadOnSave')) {
  //   document.addEventListener('core:save', AtomFtpEditor.__onsave);
  // }
  // if (atom.config.get('atom-ftp-editor.autoDownloadOnOpen')) {
  //   atom.workspace.paneContainer.observePaneItems(AtomFtpEditor.__onopen);
  // }
}

/////////////////////////
// download functions //
///////////////////////

function downloadProject() {
  let fileList = getFileList();
  fileList.forEach((v)=>{download(v);});
  FTP.get(CONNECTION).end();
}

function getFileList() {
  let settings = require(SETTINGS_PATH);
  let filesList = [];
  let folders = [settings.path];

  while (folders.length > 0) {
    let path = folders.pop();
    FTP.get(CONNECTION).list(path, (err, list)=> {
      if (err) throw err;
      list.forEach((v)=>{console.log(v);});
    });
  }

  return filesList;
}

function download(fromFile) {
  atomVisual.showLog('downloading file ' + fromFile);
  AtomFtpEditor.ftpClient.get(fromFile, function(err, stream) {
    if (err) {
      atomVisual.showLog('Error downloading ' + fromFile + 'will try again later');
      if (atom.config.get('atom-ftp-editor.presistDownload')) {
        download(fromFile, toFile); // keep trying until everything done
      }
    } else {
      atomVisual.showLog('downloaded ' + fromFile);
      stream.pipe(fs.createWriteStream(toFile));
    }
  });

}

function handleFile(path, file) {
  var localPath = PROJECT_PATH + path + '/' + file.name;
  var remotePath = path + '/' + file.name;
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
      download(AtomFtpEditor.settings.path + remotePath, localPath);
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
}

//////////////////////
// Upload functions //
/////////////////////
function upload(fromFile, toFile) {
  if(fromFile.replace(/\\/g, '/') === SETTINGS_PATH.replace(/\\/g, '/')) { //with slashfix
    atomVisual.showLog('you shouldn\'t upload the config file :/');
    return;
  } else {
    atomVisual.showLog('uploading ' + fromFile);
  }

  AtomFtpEditor.ftpClient.put(fromFile, toFile, function(err) {
    if (err) {throw err;}

    atomVisual.showLog('uploaded ' + fromFile);
    AtomFtpEditor.ftpClient.end();
    AtomFtpEditor.ftpClient = undefined;
  });
}

///////////////////
// FTP function //
/////////////////

function createSettings() {
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
      fs.writeFile(SETTINGS_PATH, JSON.stringify(defaultSettings));
      atomVisual.showLog('Settings file created');
    } else {
      atomVisual.showLog('Settings file already exists');
    }
  });
}

function connect(action) {
  let settings = require(SETTINGS_PATH);
  atomVisual.showLog('connecting ' + settings.host);

  FTP.set(CONNECTION, new Ftp());
  FTP.get(CONNECTION).on('ready', action);
  FTP.get(CONNECTION).on('error', (e)=>atomVisual.showLog(e));

  FTP.get(CONNECTION).connect(settings);
  FTP.get(CONNECTION).on('close', (e)=>atomVisual.showLog('connection close'));

}
