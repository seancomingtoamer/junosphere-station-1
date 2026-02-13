export interface Profile {
  id: string
  email: string
  display_name: string
  agent_name: string
  accent_color: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'archived'
  owner_id: string
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  profile_id: string
  name: string
  color: string
  role: string
  is_online: boolean
}

export interface Activity {
  id: string
  project_id: string
  agent_id: string
  action: string
  message: string
  timestamp: string
}

export type AppView = 'login' | 'hub' | 'project-room'
