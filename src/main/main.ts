import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { IPC } from '../shared/ipc-channels'
import type { RunTaskPayload } from '../shared/ipc-channels'
import { getConfig, setConfig, deleteConfig } from './config-store'
import { runTask, cancelTask } from './agent-runtime'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'JUNOSPHERE',
    backgroundColor: '#000008',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000008',
      symbolColor: '#00f0ff',
      height: 36
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webgl: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  // Config handlers
  ipcMain.handle(IPC.CONFIG_GET, (_event, key: string) => {
    return getConfig(key as 'anthropicApiKey' | 'model' | 'agentPrompts')
  })

  ipcMain.handle(IPC.CONFIG_SET, (_event, key: string, value: unknown) => {
    setConfig(key as 'anthropicApiKey' | 'model' | 'agentPrompts', value)
  })

  ipcMain.handle(IPC.CONFIG_DELETE, (_event, key: string) => {
    deleteConfig(key as 'anthropicApiKey' | 'model' | 'agentPrompts')
  })

  // Agent runtime handlers
  ipcMain.handle(IPC.AGENT_RUN, (_event, payload: RunTaskPayload) => {
    // Fire and forget — results come back via events
    runTask(payload)
    return { started: true }
  })

  ipcMain.handle(IPC.AGENT_CANCEL, (_event, executionId: string) => {
    return { cancelled: cancelTask(executionId) }
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
