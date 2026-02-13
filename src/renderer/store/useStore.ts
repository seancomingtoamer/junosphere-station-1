import { create } from 'zustand'
import type { AppView, Project, Task, Agent, Activity } from '../../shared/types'

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
  updateTask: (id: string, updates: Partial<Task>) => void
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  activity: Activity[]
  addActivity: (entry: Activity) => void
}

export const useStore = create<JunosphereState>((set) => ({
  // Navigation
  view: 'hub',
  setView: (view) => set({ view }),
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),

  // User
  userId: null,
  agentName: 'CTO Agent',
  accentColor: '#00f0ff',
  setUser: (id, name, color) => set({ userId: id, agentName: name, accentColor: color }),

  // Data
  projects: [],
  setProjects: (projects) => set({ projects }),
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    })),
  agents: [],
  setAgents: (agents) => set({ agents }),
  activity: [],
  addActivity: (entry) =>
    set((state) => ({ activity: [entry, ...state.activity].slice(0, 100) }))
}))
