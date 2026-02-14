import { create } from 'zustand'
import { supabase } from '../hooks/useSupabase'
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
  addTask: (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }))
    supabase.from('tasks').insert(task).then(({ error }) => {
      if (error) console.warn('[Supabase] addTask write failed:', error.message)
    })
  },
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }))
    supabase.from('tasks').update(updates).eq('id', id).then(({ error }) => {
      if (error) console.warn('[Supabase] updateTask write failed:', error.message)
    })
  },
  agents: [
    { id: 'agent-sean', profile_id: 'sean', name: 'EMPIRE HQ CTO', color: '#00f0ff', role: 'CTO // SEAN', is_online: true },
    { id: 'agent-cam', profile_id: 'cam', name: 'SOFAR CTO', color: '#7b2fff', role: 'CTO // SOFAR', is_online: true },
  ],
  setAgents: (agents) => set({ agents }),
  activity: [],
  addActivity: (entry) =>
    set((state) => ({ activity: [entry, ...state.activity].slice(0, 100) }))
}))
