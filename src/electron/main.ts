import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'fs/promises'
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
  const mainWindow = new BrowserWindow({
    width: 1380,
    height: 1025,
    center: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(app.getAppPath(), 'dist-electron/preload.js'),
    },
  })
  loadApp(mainWindow)
})

ipcMain.handle('reports:download', async (_event, url: string, suggestedFileName: string) => {
  const saveResult = await dialog.showSaveDialog({
    defaultPath: suggestedFileName,
    filters: [getReportFileFilter(suggestedFileName)],
  })

  if (saveResult.canceled || !saveResult.filePath) {
    return {
      canceled: true,
      message: 'Se canceló el guardado del reporte.',
      ok: false,
    }
  }

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return {
        message: await readReportError(response),
        ok: false,
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.writeFile(saveResult.filePath, buffer)

    return {
      message: 'Reporte guardado correctamente.',
      ok: true,
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'No se pudo generar el reporte.',
      ok: false,
    }
  }
})

async function readReportError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) {
      return body.message.join(', ')
    }

    return body.message || `Error ${response.status} generando el reporte.`
  } catch {
    return response.statusText || `Error ${response.status} generando el reporte.`
  }
}

function getReportFileFilter(fileName: string) {
  if (fileName.toLowerCase().endsWith('.pdf')) {
    return { extensions: ['pdf'], name: 'PDF' }
  }

  return { extensions: ['xlsx'], name: 'Excel' }
}
