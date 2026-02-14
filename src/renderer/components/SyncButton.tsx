import { useState } from 'react'

const SYNC_WEBHOOK = 'https://seanpro.app.n8n.cloud/webhook/junosphere-sync'

type SyncState = 'idle' | 'syncing' | 'synced' | 'error'

export function SyncButton() {
  const [state, setState] = useState<SyncState>('idle')
  const [syncCount, setSyncCount] = useState(0)

  const handleSync = async () => {
    setState('syncing')
    try {
      const res = await fetch(SYNC_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'station-1', timestamp: new Date().toISOString() }),
      })
      const data = await res.json()
      setSyncCount(data.synced || 0)
      setState('synced')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  const labels: Record<SyncState, string> = {
    idle: 'SYNC TO EMPIRE HQ',
    syncing: 'SYNCING...',
    synced: `SYNCED ${syncCount} TASKS`,
    error: 'SYNC FAILED',
  }

  const colors: Record<SyncState, string> = {
    idle: '#ffaa00',
    syncing: '#ffaa00',
    synced: '#00ff88',
    error: '#ff4444',
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === 'syncing'}
      style={{
        width: '100%',
        padding: '8px 16px',
        background: `${colors[state]}15`,
        border: `1px solid ${colors[state]}40`,
        color: colors[state],
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 10,
        letterSpacing: 2,
        cursor: state === 'syncing' ? 'wait' : 'pointer',
        opacity: state === 'syncing' ? 0.6 : 1,
        transition: 'all 0.3s',
      }}
    >
      {state === 'syncing' ? '[ ••• ] ' : state === 'synced' ? '[ OK ] ' : '[ >> ] '}
      {labels[state]}
    </button>
  )
}
