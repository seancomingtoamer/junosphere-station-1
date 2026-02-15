import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import type { StreamChunkPayload, StatusPayload, DonePayload, ErrorPayload } from '../../shared/ipc-channels'
import type { ActivityType } from '../../shared/types'

export function useAgentEvents(): void {
  const updateExecution = useStore((s) => s.updateExecution)
  const appendStream = useStore((s) => s.appendStream)
  const addActivity = useStore((s) => s.addActivity)
  const updateTask = useStore((s) => s.updateTask)
  const setHasApiKey = useStore((s) => s.setHasApiKey)

  // Check for API key on mount
  useEffect(() => {
    window.junosphere.config.get('anthropicApiKey').then((key) => {
      setHasApiKey(!!key)
    })
  }, [setHasApiKey])

  // Subscribe to agent events from main process
  useEffect(() => {
    const unsubStream = window.junosphere.agent.onStream((raw) => {
      const payload = raw as StreamChunkPayload
      appendStream(payload.executionId, payload.text)
    })

    const unsubStatus = window.junosphere.agent.onStatus((raw) => {
      const payload = raw as StatusPayload
      updateExecution(payload.executionId, {
        status: payload.status as ActivityType,
        ...(payload.status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
      })

      if (payload.message) {
        addActivity({
          id: crypto.randomUUID(),
          project_id: '',
          agent_id: '',
          action: payload.status,
          message: payload.message,
          timestamp: new Date().toISOString(),
        })
      }
    })

    const unsubDone = window.junosphere.agent.onDone((raw) => {
      const payload = raw as DonePayload
      updateExecution(payload.executionId, {
        status: 'completed',
        result: payload.result,
        completedAt: new Date().toISOString(),
      })

      // Find the execution to get the taskId, mark task as done
      const execs = useStore.getState().executions
      const exec = execs.get(payload.executionId)
      if (exec) {
        updateTask(exec.taskId, { status: 'done', updated_at: new Date().toISOString() })
        addActivity({
          id: crypto.randomUUID(),
          project_id: '',
          agent_id: exec.agentName,
          action: 'completed',
          message: `${exec.agentName} completed task. ${payload.tokensUsed ? `(${payload.tokensUsed} tokens)` : ''}`,
          timestamp: new Date().toISOString(),
        })
      }
    })

    const unsubError = window.junosphere.agent.onError((raw) => {
      const payload = raw as ErrorPayload
      updateExecution(payload.executionId, {
        status: 'error',
        error: payload.error,
        completedAt: new Date().toISOString(),
      })

      addActivity({
        id: crypto.randomUUID(),
        project_id: '',
        agent_id: '',
        action: 'error',
        message: `Error: ${payload.error}`,
        timestamp: new Date().toISOString(),
      })
    })

    return () => {
      unsubStream()
      unsubStatus()
      unsubDone()
      unsubError()
    }
  }, [updateExecution, appendStream, addActivity, updateTask])
}
