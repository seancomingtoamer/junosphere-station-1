import Anthropic from '@anthropic-ai/sdk'
import { BrowserWindow } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { RunTaskPayload, StreamChunkPayload, StatusPayload, DonePayload, ErrorPayload } from '../shared/ipc-channels'
import { getApiKey, getModel, getAgentPrompt } from './config-store'

// Track active executions for cancellation
const activeExecutions = new Map<string, AbortController>()

function sendToRenderer(channel: string, payload: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send(channel, payload)
  }
}

export async function runTask(payload: RunTaskPayload): Promise<void> {
  const { executionId, taskTitle, taskDescription, agentName, model } = payload

  const apiKey = getApiKey()
  if (!apiKey) {
    sendToRenderer(IPC.AGENT_ERROR, {
      executionId,
      error: 'No API key configured. Open Settings to add your Anthropic API key.',
    } satisfies ErrorPayload)
    return
  }

  // Send thinking status
  sendToRenderer(IPC.AGENT_STATUS, {
    executionId,
    status: 'thinking',
    message: `${agentName} analyzing task...`,
  } satisfies StatusPayload)

  const abortController = new AbortController()
  activeExecutions.set(executionId, abortController)

  try {
    const client = new Anthropic({ apiKey })
    const systemPrompt = payload.systemPrompt || getAgentPrompt(agentName)
    const selectedModel = model || getModel()

    const userMessage = `## Task: ${taskTitle}\n\n${taskDescription}\n\nProvide a thorough, actionable response. Be specific and concise.`

    // Send working status
    sendToRenderer(IPC.AGENT_STATUS, {
      executionId,
      status: 'working',
      message: `${agentName} working on task...`,
    } satisfies StatusPayload)

    // Stream the response
    let fullText = ''

    const stream = client.messages.stream({
      model: selectedModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }, { signal: abortController.signal })

    for await (const event of stream) {
      if (abortController.signal.aborted) break

      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullText += event.delta.text
        sendToRenderer(IPC.AGENT_STREAM, {
          executionId,
          text: event.delta.text,
        } satisfies StreamChunkPayload)
      }
    }

    if (abortController.signal.aborted) {
      sendToRenderer(IPC.AGENT_STATUS, {
        executionId,
        status: 'cancelled',
        message: 'Execution cancelled.',
      } satisfies StatusPayload)
    } else {
      const finalMessage = await stream.finalMessage()
      const tokensUsed = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0)

      sendToRenderer(IPC.AGENT_DONE, {
        executionId,
        result: fullText,
        tokensUsed,
      } satisfies DonePayload)

      sendToRenderer(IPC.AGENT_STATUS, {
        executionId,
        status: 'completed',
        message: `${agentName} completed task.`,
      } satisfies StatusPayload)
    }
  } catch (err: unknown) {
    if (abortController.signal.aborted) {
      sendToRenderer(IPC.AGENT_STATUS, {
        executionId,
        status: 'cancelled',
        message: 'Execution cancelled.',
      } satisfies StatusPayload)
    } else {
      const message = err instanceof Error ? err.message : 'Unknown error'
      sendToRenderer(IPC.AGENT_ERROR, {
        executionId,
        error: message,
      } satisfies ErrorPayload)
    }
  } finally {
    activeExecutions.delete(executionId)
  }
}

export function cancelTask(executionId: string): boolean {
  const controller = activeExecutions.get(executionId)
  if (controller) {
    controller.abort()
    activeExecutions.delete(executionId)
    return true
  }
  return false
}
