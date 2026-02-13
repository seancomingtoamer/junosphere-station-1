import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('junosphere', {
  platform: process.platform
})
