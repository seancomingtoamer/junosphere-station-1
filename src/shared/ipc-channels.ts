// IPC channel names — shared between main + preload + renderer types

export const IPC = {
  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_DELETE: 'config:delete',

  // Agent runtime
  AGENT_RUN: 'agent:run',
  AGENT_CANCEL: 'agent:cancel',
  AGENT_STREAM: 'agent:stream',     // main -> renderer (text chunks)
  AGENT_STATUS: 'agent:status',     // main -> renderer (status changes)
  AGENT_DONE: 'agent:done',         // main -> renderer (execution complete)
  AGENT_ERROR: 'agent:error',       // main -> renderer (execution error)
} as const

// Payload types for IPC messages

export interface RunTaskPayload {
  executionId: string
  taskId: string
  taskTitle: string
  taskDescription: string
  agentName: string
  systemPrompt: string
  model: string
}

export interface StreamChunkPayload {
  executionId: string
  text: string
}

export interface StatusPayload {
  executionId: string
  status: 'thinking' | 'working' | 'completed' | 'cancelled' | 'error'
  message?: string
}

export interface DonePayload {
  executionId: string
  result: string
  tokensUsed?: number
}

export interface ErrorPayload {
  executionId: string
  error: string
}
