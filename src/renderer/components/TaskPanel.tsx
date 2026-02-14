import { useState } from 'react'
import { useStore } from '../store/useStore'
import { SyncButton } from './SyncButton'
import type { Task } from '../../shared/types'

export function TaskPanel() {
  const tasks = useStore((s) => s.tasks)
  const activeProjectId = useStore((s) => s.activeProjectId)
  const agents = useStore((s) => s.agents)
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)

  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const projectTasks = tasks.filter((t) => t.project_id === activeProjectId)

  const handleAddTask = () => {
    if (!newTitle.trim() || !activeProjectId) return
    const task: Task = {
      id: crypto.randomUUID(),
      project_id: activeProjectId,
      title: newTitle.trim(),
      description: '',
      status: 'todo',
      assigned_to: null,
      created_by: 'local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addTask(task)
    setNewTitle('')
    setIsAdding(false)
  }

  const cycleStatus = (task: Task) => {
    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'
    updateTask(task.id, { status: next, updated_at: new Date().toISOString() })
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

  return (
    <div style={{
      position: 'absolute',
      top: 80,
      right: 16,
      width: 320,
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
            background: 'rgba(0,240,255,0.15)',
            border: '1px solid rgba(0,240,255,0.3)',
            color: '#00f0ff',
            padding: '2px 10px',
            fontSize: 16,
            cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          +
        </button>
      </div>

      {/* Add task form */}
      {isAdding && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(0,240,255,0.1)',
          display: 'flex',
          gap: 8,
        }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Task title..."
            autoFocus
            style={{
              flex: 1,
              background: 'rgba(0,240,255,0.05)',
              border: '1px solid rgba(0,240,255,0.2)',
              color: '#c0d0e0',
              padding: '4px 8px',
              fontSize: 14,
              fontFamily: "'Rajdhani', sans-serif",
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddTask}
            style={{
              background: 'rgba(0,255,136,0.2)',
              border: '1px solid rgba(0,255,136,0.4)',
              color: '#00ff88',
              padding: '4px 12px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: 1,
            }}
          >
            ADD
          </button>
        </div>
      )}

      {/* Task list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {projectTasks.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#304050',
            fontSize: 13,
          }}>
            No tasks yet. Click + to add one.
          </div>
        ) : (
          projectTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => cycleStatus(task)}
              style={{
                padding: '8px 16px',
                borderLeft: `3px solid ${statusColors[task.status]}`,
                margin: '2px 8px',
                background: `${statusColors[task.status]}08`,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = `${statusColors[task.status]}15`)}
              onMouseOut={(e) => (e.currentTarget.style.background = `${statusColors[task.status]}08`)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: '#c0d0e0', fontSize: 14 }}>
                  {task.title}
                </span>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 8,
                  color: statusColors[task.status],
                  letterSpacing: 1,
                  padding: '2px 6px',
                  border: `1px solid ${statusColors[task.status]}40`,
                }}>
                  {statusLabels[task.status]}
                </span>
              </div>
              {task.assigned_to && (
                <span style={{ fontSize: 11, color: '#506070' }}>
                  Assigned to: {task.assigned_to}
                </span>
              )}
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
        <SyncButton />
      </div>
    </div>
  )
}
