import ElectronStore from 'electron-store'

// electron-store v10 is ESM — handle CJS interop from electron-vite externalize
const Store = (ElectronStore as unknown as { default: typeof ElectronStore }).default || ElectronStore

interface ConfigSchema {
  anthropicApiKey?: string
  model?: string
  agentPrompts?: Record<string, string>
}

const store = new Store<ConfigSchema>({
  name: 'junosphere-config',
  encryptionKey: 'junosphere-v1-local-encryption',
  defaults: {
    model: 'claude-sonnet-4-5-20250929',
    agentPrompts: {},
  },
})

export function getConfig(key: keyof ConfigSchema): unknown {
  return store.get(key)
}

export function setConfig(key: keyof ConfigSchema, value: unknown): void {
  store.set(key, value)
}

export function deleteConfig(key: keyof ConfigSchema): void {
  store.delete(key)
}

export function getApiKey(): string | undefined {
  return store.get('anthropicApiKey')
}

export function getModel(): string {
  return store.get('model') || 'claude-sonnet-4-5-20250929'
}

export function getAgentPrompt(agentName: string): string {
  const prompts = store.get('agentPrompts') || {}
  return prompts[agentName] || `You are ${agentName}, an AI agent working in the Junosphere collaboration platform. Complete the assigned task thoroughly and concisely.`
}
