import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { RunTaskPayload } from '../shared/ipc-channels'

contextBridge.exposeInMainWorld('junosphere', {
  platform: process.platform,

  // Config API — API keys never leave main process, only get/set via IPC
  config: {
    get: (key: string) => ipcRenderer.invoke(IPC.CONFIG_GET, key),
    set: (key: string, value: unknown) => ipcRenderer.invoke(IPC.CONFIG_SET, key, value),
    delete: (key: string) => ipcRenderer.invoke(IPC.CONFIG_DELETE, key),
  },

  // Agent API
  agent: {
    run: (payload: RunTaskPayload) => ipcRenderer.invoke(IPC.AGENT_RUN, payload),
    cancel: (executionId: string) => ipcRenderer.invoke(IPC.AGENT_CANCEL, executionId),

    // Event listeners — renderer subscribes to these
    onStream: (callback: (payload: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload)
      ipcRenderer.on(IPC.AGENT_STREAM, handler)
      return () => ipcRenderer.removeListener(IPC.AGENT_STREAM, handler)
    },
    onStatus: (callback: (payload: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload)
      ipcRenderer.on(IPC.AGENT_STATUS, handler)
      return () => ipcRenderer.removeListener(IPC.AGENT_STATUS, handler)
    },
    onDone: (callback: (payload: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload)
      ipcRenderer.on(IPC.AGENT_DONE, handler)
      return () => ipcRenderer.removeListener(IPC.AGENT_DONE, handler)
    },
    onError: (callback: (payload: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload)
      ipcRenderer.on(IPC.AGENT_ERROR, handler)
      return () => ipcRenderer.removeListener(IPC.AGENT_ERROR, handler)
    },
  },
})
