import { ipcRenderer } from 'electron'

export const checkAppInstall = (appName: string) => {
  ipcRenderer.send('check-app-exist', appName)
}

export const startApp = (appName: string) => {
  console.log('---startApp appName: ',appName)
  ipcRenderer.send('start-app', appName)
}

export const checkAppInfoEvent = (cb: (data: any) => void) => {
  ipcRenderer.on('check-app-exist-result', (e, data) => {
    cb && cb(data)
  })
}

export const startAppInfoEvent = (cb: (data: any) => void) => {
  ipcRenderer.on('start-app-result', (e, data) => {
    cb && cb(data)
  })
}

