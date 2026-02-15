import { create } from 'zustand'
import { supabase } from '../hooks/useSupabase'
import type { AppView, Project, Task, Agent, Activity, AgentExecution, ActivityType } from '../../shared/types'
import type { RunTaskPayload } from '../../shared/ipc-channels'

// Agent identity from env — Sean sets EMPIRE HQ CTO, Cam sets SOFAR CTO
const AGENT_NAME = import.meta.env.VITE_AGENT_NAME || 'EMPIRE HQ CTO'
const AGENT_COLOR = AGENT_NAME === 'SOFAR CTO' ? '#7b2fff' : '#00f0ff'

interface JunosphereState {
  // Navigation
  view: AppView
  setView: (view: AppView) => void
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void

  // User
  userId: string | null
  agentName: string
  accentColor: string
  setUser: (id: string, name: string, color: string) => void

  // Data
  projects: Project[]
  setProjects: (projects: Project[]) => void
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  addTaskLocal: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  updateTaskLocal: (id: string, updates: Partial<Task>) => void
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  activity: Activity[]
  addActivity: (entry: Activity) => void

  // Settings
  hasApiKey: boolean
  setHasApiKey: (v: boolean) => void
  settingsModel: string
  setSettingsModel: (m: string) => void

  // Agent Executions
  executions: Map<string, AgentExecution>
  startExecution: (taskId: string, agentName: string) => string
  updateExecution: (executionId: string, updates: Partial<AgentExecution>) => void
  appendStream: (executionId: string, text: string) => void
  getExecution: (taskId: string) => AgentExecution | undefined
  executeTask: (task: Task) => Promise<void>
  cancelExecution: (executionId: string) => Promise<void>
}

export const useStore = create<JunosphereState>((set, get) => ({
  // Navigation
  view: 'hub',
  setView: (view) => set({ view }),
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),

  // User — set from env var
  userId: null,
  agentName: AGENT_NAME,
  accentColor: AGENT_COLOR,
  setUser: (id, name, color) => set({ userId: id, agentName: name, accentColor: color }),

  // Data — seeded with real projects
  projects: [
    { id: 'aiquickpath', name: 'AIQUICKPATH', description: 'Boutique AI consultancy — teach clients Claude Code & agentic AI, set them up with their own Junosphere station', status: 'active', owner_id: 'sean', created_at: new Date().toISOString() },
  ],
  setProjects: (projects) => set({ projects }),
  tasks: [
    { id: 'aqp-1', project_id: 'aiquickpath', title: 'Build AIQuickPath website', description: 'Next.js site at aiquickpath.com — dope cyberpunk consultancy site', status: 'in_progress', type: 'Build', assigned_to: 'EMPIRE HQ CTO', created_by: 'sean', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'aqp-2', project_id: 'aiquickpath', title: 'Design onboarding flow (3 Zoom sessions)', description: 'Map out the 3-session curriculum: Session 1 = Claude Code basics, Session 2 = agentic patterns, Session 3 = Junosphere station setup', status: 'todo', type: 'Design', assigned_to: 'SOFAR CTO', created_by: 'cam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'aqp-3', project_id: 'aiquickpath', title: 'Set up Stripe payment flow', description: 'Integrate Stripe checkout for seat purchases (~$2k/seat)', status: 'todo', type: 'Build', assigned_to: null, created_by: 'sean', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'aqp-4', project_id: 'aiquickpath', title: 'Create marketing content & social push', description: 'Cam handles marketing push — social media, outreach, testimonials', status: 'todo', type: 'Marketing', assigned_to: 'SOFAR CTO', created_by: 'cam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'aqp-5', project_id: 'aiquickpath', title: 'Deploy site to Vercel + connect domain', description: 'Push to GitHub, deploy to Vercel, point aiquickpath.com DNS', status: 'todo', type: 'Deploy', assigned_to: 'EMPIRE HQ CTO', created_by: 'sean', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'aqp-6', project_id: 'aiquickpath', title: 'Set up n8n lead capture workflow', description: 'Webhook → Airtable → Telegram → welcome email flow', status: 'todo', type: 'Build', assigned_to: 'EMPIRE HQ CTO', created_by: 'sean', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'aqp-7', project_id: 'aiquickpath', title: "Research 'Train your staff to use AI with AI QuickStart' angle", description: 'Explore positioning AIQuickPath as an enterprise AI training program — research competitors, pricing models, and content angles', status: 'todo', type: 'Research', assigned_to: 'SOFAR CTO', created_by: 'cam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  setTasks: (tasks) => set({ tasks }),

  // addTask — user action: update local + write to Supabase
  addTask: (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }))
    supabase.from('tasks').insert(task).then(({ error }) => {
      if (error) console.warn('[Supabase] addTask write failed:', error.message)
    })
  },

  // addTaskLocal — from real-time subscription only (no Supabase write, prevents echo loop)
  addTaskLocal: (task) => {
    const existing = get().tasks.find((t) => t.id === task.id)
    if (existing) return // already have it locally, skip
    set((state) => ({ tasks: [...state.tasks, task] }))
  },

  // updateTask — user action: update local + write to Supabase
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }))
    supabase.from('tasks').update(updates).eq('id', id).then(({ error }) => {
      if (error) console.warn('[Supabase] updateTask write failed:', error.message)
    })
  },

  // updateTaskLocal — from real-time subscription only (no Supabase write, prevents echo loop)
  updateTaskLocal: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }))
  },

  agents: [
    { id: 'agent-sean', profile_id: 'sean', name: 'EMPIRE HQ CTO', color: '#00f0ff', role: 'CTO // SEAN', is_online: true },
    { id: 'agent-cam', profile_id: 'cam', name: 'SOFAR CTO', color: '#7b2fff', role: 'CTO // SOFAR', is_online: true },
  ],
  setAgents: (agents) => set({ agents }),
  activity: [],
  addActivity: (entry) =>
    set((state) => ({ activity: [entry, ...state.activity].slice(0, 100) })),

  // Settings
  hasApiKey: false,
  setHasApiKey: (v) => set({ hasApiKey: v }),
  settingsModel: 'claude-sonnet-4-5-20250929',
  setSettingsModel: (m) => set({ settingsModel: m }),

  // Agent Executions
  executions: new Map(),

  startExecution: (taskId, agentName) => {
    const executionId = crypto.randomUUID()
    const execution: AgentExecution = {
      id: executionId,
      taskId,
      agentName,
      status: 'thinking',
      streamedText: '',
      startedAt: new Date().toISOString(),
    }
    set((state) => {
      const next = new Map(state.executions)
      next.set(executionId, execution)
      return { executions: next }
    })
    return executionId
  },

  updateExecution: (executionId, updates) => {
    set((state) => {
      const next = new Map(state.executions)
      const existing = next.get(executionId)
      if (existing) {
        next.set(executionId, { ...existing, ...updates })
      }
      return { executions: next }
    })
  },

  appendStream: (executionId, text) => {
    set((state) => {
      const next = new Map(state.executions)
      const existing = next.get(executionId)
      if (existing) {
        next.set(executionId, { ...existing, streamedText: existing.streamedText + text })
      }
      return { executions: next }
    })
  },

  getExecution: (taskId) => {
    const execs = get().executions
    for (const exec of execs.values()) {
      if (exec.taskId === taskId && (exec.status === 'thinking' || exec.status === 'working')) {
        return exec
      }
    }
    // Return most recent completed/error for this task
    let latest: AgentExecution | undefined
    for (const exec of execs.values()) {
      if (exec.taskId === taskId) {
        if (!latest || exec.startedAt > latest.startedAt) latest = exec
      }
    }
    return latest
  },

  executeTask: async (task) => {
    const state = get()
    const agentName = task.assigned_to || state.agentName
    const executionId = state.startExecution(task.id, agentName)

    // Mark task as in_progress
    state.updateTask(task.id, { status: 'in_progress', updated_at: new Date().toISOString() })

    // Add activity
    state.addActivity({
      id: crypto.randomUUID(),
      project_id: task.project_id,
      agent_id: agentName,
      action: 'agent_run',
      message: `${agentName} analyzing: ${task.title}`,
      timestamp: new Date().toISOString(),
    })

    const payload: RunTaskPayload = {
      executionId,
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description,
      agentName,
      systemPrompt: '',
      model: state.settingsModel,
    }

    await window.junosphere.agent.run(payload)
  },

  cancelExecution: async (executionId) => {
    await window.junosphere.agent.cancel(executionId)
  },
}))
