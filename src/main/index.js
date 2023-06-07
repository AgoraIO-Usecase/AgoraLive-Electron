import { app, BrowserWindow, systemPreferences, ipcMain } from 'electron'
import { exec } from 'child_process'
import * as os from 'os'
import path from 'path';
import { format as formatUrl } from 'url';
import { checkAppExists } from './util'

const isDevelopment = process.env.NODE_ENV !== 'production';
app.allowRendererProcessReuse = false;

if (systemPreferences.askForMediaAccess) {
  systemPreferences.askForMediaAccess('camera');
  systemPreferences.askForMediaAccess('microphone');
}

const registerIpcMainEvent = () => {
  ipcMain.on('check-app-exist', (event, args) => {
    console.log('----check-app-exist args: ',args)
    let isExist = checkAppExists(args)
    event.reply('check-app-exist-result', isExist)
  })

  ipcMain.on('start-app', (event, args) => {
    console.log('----start-app args: ',args)
    var appProcess
    if (os.platform() === 'win32') {
      appProcess = exec(`start ${args}`)
    } else if (os.platform() === 'darwin') {
      appProcess = exec(`open -a ${args}`)
    }
    appProcess.on('error', (e) => {
      console.log('error: ',e)
      event.reply('start-app-result', 'failed');
    })
    appProcess.on('close', (code) => {
      console.log('-----code: ',code)
      if (code === 0) {
        event.reply('start-app-result', 'success');
      } else {
        event.reply('start-app-result', 'failed');
      }
    })
  })
}

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });
  window.setMinimumSize(1024,768)
  window.webContents.openDevTools({
    mode: 'detach',
    activate: true,
  });

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      })
    );
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
  registerIpcMainEvent()
});
