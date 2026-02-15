import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { SyncButton } from './SyncButton'
import type { Task } from '../../shared/types'

const TASK_TYPES = ['Build', 'Research', 'Design', 'Marketing', 'Deploy', 'Bug'] as const
const AGENTS = ['Unassigned', 'EMPIRE HQ CTO', 'SOFAR CTO'] as const

const typeColors: Record<string, string> = {
  Build: '#00f0ff',
  Research: '#c084fc',
  Design: '#f472b6',
  Marketing: '#34d399',
  Deploy: '#fbbf24',
  Bug: '#ef4444',
}

const statusColors: Record<string, string> = {
  todo: '#ff4444',
  in_progress: '#ffaa00',
  done: '#00ff88',
}

const statusLabels: Record<string, string> = {
  todo: 'TO DO',
  in_progress: 'IN PROGRESS',
  done: 'DONE',
}

const STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'done']

type FilterMode = 'all' | 'mine' | 'EMPIRE HQ CTO' | 'SOFAR CTO'

/* ── Chip selector — inline clickable chips, no dropdown needed ── */
function ChipSelect({ value, options, onChange, colorMap }: {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  colorMap?: Record<string, string>
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {options.map((opt) => {
        const active = opt === value
        const accent = colorMap?.[opt] || '#00f0ff'
        return (
          <button
            key={opt}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(opt) }}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontFamily: "'Rajdhani', sans-serif",
              color: active ? accent : '#506070',
              background: active ? `${accent}20` : 'rgba(0,240,255,0.03)',
              border: `1px solid ${active ? `${accent}60` : 'rgba(0,240,255,0.1)'}`,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              outline: 'none',
            }}
          >
            {opt === 'EMPIRE HQ CTO' ? 'HQ CTO' : opt === 'SOFAR CTO' ? 'SOFAR' : opt}
          </button>
        )
      })}
    </div>
  )
}

/* ── Task Detail Card — full overlay when a task is selected ── */
function TaskDetailCard({ task, onClose, onStatusChange, onAssigneeChange, onTypeChange }: {
  task: Task
  onClose: () => void
  onStatusChange: (status: Task['status']) => void
  onAssigneeChange: (agent: string) => void
  onTypeChange: (type: string) => void
}) {
  const sColor = statusColors[task.status]
  const tColor = typeColors[task.type || ''] || '#888'

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0,0,8,0.95)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${sColor}30`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 10,
          color: sColor,
          letterSpacing: 2,
        }}>
          TASK DETAIL
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255,68,68,0.15)',
            border: '1px solid rgba(255,68,68,0.3)',
            color: '#ff4444',
            padding: '2px 10px',
            fontSize: 16,
            cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          &times;
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Title */}
        <div style={{ color: '#e0eef8', fontSize: 16, fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.3 }}>
          {task.title}
        </div>

        {/* Status selector */}
        <div>
          <div style={{ fontSize: 9, color: '#506070', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, marginBottom: 6 }}>STATUS</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_ORDER.map((s) => {
              const active = task.status === s
              const c = statusColors[s]
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: 10,
                    fontFamily: "'Orbitron', sans-serif",
                    letterSpacing: 1,
                    color: active ? c : '#405060',
                    background: active ? `${c}20` : 'rgba(0,240,255,0.03)',
                    border: `1px solid ${active ? `${c}60` : 'rgba(0,240,255,0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {statusLabels[s]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <div style={{ fontSize: 9, color: '#506070', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, marginBottom: 6 }}>ASSIGNED TO</div>
          <ChipSelect
            value={task.assigned_to || 'Unassigned'}
            options={AGENTS}
            onChange={onAssigneeChange}
          />
        </div>

        {/* Type */}
        <div>
          <div style={{ fontSize: 9, color: '#506070', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, marginBottom: 6 }}>TYPE</div>
          <ChipSelect
            value={task.type || 'Build'}
            options={TASK_TYPES}
            onChange={onTypeChange}
            colorMap={typeColors}
          />
        </div>

        {/* Description */}
        <div>
          <div style={{ fontSize: 9, color: '#506070', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, marginBottom: 6 }}>DESCRIPTION</div>
          <div style={{
            color: '#90a0b0',
            fontSize: 13,
            fontFamily: "'Rajdhani', sans-serif",
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: '10px 12px',
            background: 'rgba(0,240,255,0.03)',
            border: '1px solid rgba(0,240,255,0.08)',
          }}>
            {task.description || 'No description.'}
          </div>
        </div>

        {/* Meta */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '10px 12px',
          background: 'rgba(0,240,255,0.02)',
          border: '1px solid rgba(0,240,255,0.06)',
        }}>
          <div style={{ fontSize: 9, color: '#506070', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, marginBottom: 2 }}>META</div>
          <div style={{ fontSize: 11, color: '#607080' }}>
            Created by: <span style={{ color: '#00f0ff' }}>{task.created_by || 'Unknown'}</span>
          </div>
          <div style={{ fontSize: 11, color: '#607080' }}>
            Created: <span style={{ color: '#90a0b0' }}>{new Date(task.created_at).toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11, color: '#607080' }}>
            Updated: <span style={{ color: '#90a0b0' }}>{new Date(task.updated_at).toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11, color: '#607080' }}>
            ID: <span style={{ color: '#405060', fontFamily: 'monospace', fontSize: 10 }}>{task.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0,240,255,0.05)',
  border: '1px solid rgba(0,240,255,0.2)',
  color: '#c0d0e0',
  padding: '5px 8px',
  fontSize: 13,
  fontFamily: "'Rajdhani', sans-serif",
  outline: 'none',
}


export function TaskPanel() {
  const tasks = useStore((s) => s.tasks)
  const activeProjectId = useStore((s) => s.activeProjectId)
  const agentName = useStore((s) => s.agentName)
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)

  const descRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAssignee, setNewAssignee] = useState<string>('Unassigned')
  const [newType, setNewType] = useState<string>('Build')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [dirty, setDirty] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const projectTasks = tasks.filter((t) => t.project_id === activeProjectId)

  const filteredTasks = projectTasks.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'mine') return t.assigned_to === agentName
    return t.assigned_to === filter
  })

  const handleAddTask = () => {
    if (!newTitle.trim() || !activeProjectId) return
    const task: Task = {
      id: crypto.randomUUID(),
      project_id: activeProjectId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: 'todo',
      type: newType || undefined,
      assigned_to: newAssignee === 'Unassigned' ? null : newAssignee,
      created_by: agentName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addTask(task)
    setNewTitle('')
    setNewDesc('')
    setNewAssignee('Unassigned')
    setNewType('Build')
    setIsAdding(false)
    setDirty(true)
  }

  return (
    <div style={{
      position: 'absolute',
      top: 80,
      right: 16,
      width: 340,
      maxHeight: 'calc(100vh - 120px)',
      background: 'rgba(0,0,12,0.85)',
      border: '1px solid rgba(0,240,255,0.15)',
      fontFamily: "'Rajdhani', sans-serif",
      pointerEvents: 'auto',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0,240,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 12,
          color: '#00f0ff',
          letterSpacing: 2,
        }}>
          TASK BOARD
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: isAdding ? 'rgba(255,68,68,0.15)' : 'rgba(0,240,255,0.15)',
            border: `1px solid ${isAdding ? 'rgba(255,68,68,0.3)' : 'rgba(0,240,255,0.3)'}`,
            color: isAdding ? '#ff4444' : '#00f0ff',
            padding: '2px 10px',
            fontSize: 16,
            cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {isAdding ? '×' : '+'}
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid rgba(0,240,255,0.1)',
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
      }}>
        {(['all', 'mine', 'EMPIRE HQ CTO', 'SOFAR CTO'] as FilterMode[]).map((f) => {
          const active = filter === f
          const label = f === 'all' ? 'ALL' : f === 'mine' ? 'MINE' : f === 'EMPIRE HQ CTO' ? 'HQ' : 'SOFAR'
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: active ? 'rgba(0,240,255,0.2)' : 'transparent',
                border: `1px solid ${active ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.1)'}`,
                color: active ? '#00f0ff' : '#506070',
                padding: '2px 8px',
                fontSize: 10,
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Add task form */}
      {isAdding && (
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(0,240,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <button
            type="button"
            onClick={() => titleRef.current?.focus()}
            style={{ display: 'block', width: '100%', padding: 0, margin: 0, background: 'none', border: 'none' }}
          >
            <input
              ref={titleRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Task title..."
              autoFocus
              style={inputStyle}
            />
          </button>
          <button
            type="button"
            onClick={() => descRef.current?.focus()}
            style={{ display: 'block', width: '100%', padding: 0, margin: 0, background: 'none', border: 'none' }}
          >
            <textarea
              ref={descRef}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </button>

          {/* Assign To — chip selector */}
          <div>
            <div style={{ fontSize: 9, color: '#506070', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, marginBottom: 4 }}>ASSIGN TO</div>
            <ChipSelect value={newAssignee} options={AGENTS} onChange={setNewAssignee} />
          </div>

          {/* Type — chip selector */}
          <div>
            <div style={{ fontSize: 9, color: '#506070', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, marginBottom: 4 }}>TYPE</div>
            <ChipSelect value={newType} options={TASK_TYPES} onChange={setNewType} colorMap={typeColors} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: '#506070' }}>
              By: <span style={{ color: '#00f0ff' }}>{agentName}</span>
            </span>
            <button
              onClick={handleAddTask}
              style={{
                background: 'rgba(0,255,136,0.2)',
                border: '1px solid rgba(0,255,136,0.4)',
                color: '#00ff88',
                padding: '4px 16px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: 1,
              }}
            >
              ADD
            </button>
          </div>
        </div>
      )}

      {/* Task list — scrollable */}
      <div
        className="task-scroll"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
          scrollBehavior: 'smooth',
        }}
      >
        <style>{`
          .task-scroll::-webkit-scrollbar { width: 4px; }
          .task-scroll::-webkit-scrollbar-track { background: rgba(0,0,12,0.5); }
          .task-scroll::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.3); border-radius: 2px; }
          .task-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,240,255,0.5); }
        `}</style>
        {filteredTasks.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#304050',
            fontSize: 13,
          }}>
            {filter === 'all' ? 'No tasks yet. Click + to add one.' : 'No tasks matching filter.'}
          </div>
        ) : (
          filteredTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  textAlign: 'left',
                  padding: '8px 14px',
                  borderLeft: `3px solid ${statusColors[task.status]}`,
                  margin: '2px 8px',
                  background: `${statusColors[task.status]}08`,
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                {/* Row 1: Title + badges — click to open detail card */}
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                >
                  <span style={{ color: '#c0d0e0', fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {task.title}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {task.type && (
                      <span style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 7,
                        color: typeColors[task.type] || '#888',
                        letterSpacing: 1,
                        padding: '2px 5px',
                        border: `1px solid ${(typeColors[task.type] || '#888')}40`,
                      }}>
                        {task.type.toUpperCase()}
                      </span>
                    )}
                    <span style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 7,
                      color: statusColors[task.status],
                      letterSpacing: 1,
                      padding: '2px 5px',
                      border: `1px solid ${statusColors[task.status]}40`,
                    }}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                </button>

                {/* Row 2: Assignee */}
                <div style={{ marginTop: 4 }}>
                  {task.assigned_to ? (
                    <span style={{ fontSize: 11, color: '#506070' }}>
                      {task.assigned_to}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#354050' }}>Unassigned</span>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Footer stats */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(0,240,255,0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        fontSize: 11,
      }}>
        <span style={{ color: '#ff4444' }}>
          {projectTasks.filter((t) => t.status === 'todo').length} TODO
        </span>
        <span style={{ color: '#ffaa00' }}>
          {projectTasks.filter((t) => t.status === 'in_progress').length} WIP
        </span>
        <span style={{ color: '#00ff88' }}>
          {projectTasks.filter((t) => t.status === 'done').length} DONE
        </span>
      </div>

      {/* Sync to Empire HQ */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,170,0,0.1)' }}>
        <SyncButton dirty={dirty} onSynced={() => setDirty(false)} />
      </div>

      {/* Task Detail Overlay */}
      {selectedTaskId && (() => {
        const task = tasks.find((t) => t.id === selectedTaskId)
        if (!task) return null
        return (
          <TaskDetailCard
            task={task}
            onClose={() => setSelectedTaskId(null)}
            onStatusChange={(status) => {
              updateTask(task.id, { status, updated_at: new Date().toISOString() })
              setDirty(true)
            }}
            onAssigneeChange={(agent) => {
              updateTask(task.id, {
                assigned_to: agent === 'Unassigned' ? null : agent,
                updated_at: new Date().toISOString(),
              })
              setDirty(true)
            }}
            onTypeChange={(type) => {
              updateTask(task.id, { type, updated_at: new Date().toISOString() })
              setDirty(true)
            }}
          />
        )
      })()}
    </div>
  )
}
