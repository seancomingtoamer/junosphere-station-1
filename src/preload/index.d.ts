import type { RunTaskPayload } from '../shared/ipc-channels'

interface JunosphereAPI {
  platform: string

  config: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    delete: (key: string) => Promise<void>
  }

  agent: {
    run: (payload: RunTaskPayload) => Promise<{ started: boolean }>
    cancel: (executionId: string) => Promise<{ cancelled: boolean }>
    onStream: (callback: (payload: unknown) => void) => () => void
    onStatus: (callback: (payload: unknown) => void) => () => void
    onDone: (callback: (payload: unknown) => void) => () => void
    onError: (callback: (payload: unknown) => void) => () => void
  }
}

declare global {
  interface Window {
    junosphere: JunosphereAPI
  }
}
