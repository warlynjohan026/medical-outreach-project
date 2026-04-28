import { app, BrowserWindow } from 'electron'
import path from 'path'
import { isDev } from './utils/util.js'

const devServerUrl = 'http://localhost:2626/'

function loadApp(mainWindow: BrowserWindow) {
  if (isDev()) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      setTimeout(() => loadApp(mainWindow), 500)
    })
    return
  }

  mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react/index.html'))
}

app.on('ready', () => {
  const mainWindow = new BrowserWindow({})
  loadApp(mainWindow)
})
