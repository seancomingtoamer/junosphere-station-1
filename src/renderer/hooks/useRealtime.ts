import { useEffect } from 'react'
import { supabase } from './useSupabase'
import { useStore } from '../store/useStore'
import type { Task, Activity } from '../../shared/types'

export function useRealtime() {
  const setProjects = useStore((s) => s.setProjects)
  const setTasks = useStore((s) => s.setTasks)
  const setAgents = useStore((s) => s.setAgents)
  const addActivity = useStore((s) => s.addActivity)
  const addTaskLocal = useStore((s) => s.addTaskLocal)
  const updateTaskLocal = useStore((s) => s.updateTaskLocal)

  useEffect(() => {
    // Skip if no Supabase URL configured
    if (!import.meta.env.VITE_SUPABASE_URL) return

    // Initial data load — if Supabase is empty, seed it from local store defaults
    async function loadData() {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projects && projects.length > 0) {
        setProjects(projects)
      } else {
        // Seed Supabase with default projects from store
        const defaultProjects = useStore.getState().projects
        if (defaultProjects.length > 0) {
          await supabase.from('projects').upsert(defaultProjects, { onConflict: 'id' })
          console.log('[Supabase] Seeded projects:', defaultProjects.length)
        }
      }

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true })

      if (tasks && tasks.length > 0) {
        setTasks(tasks)
      } else {
        // Seed Supabase with default tasks from store
        const defaultTasks = useStore.getState().tasks
        if (defaultTasks.length > 0) {
          await supabase.from('tasks').upsert(defaultTasks, { onConflict: 'id' })
          console.log('[Supabase] Seeded tasks:', defaultTasks.length)
        }
      }

      const { data: agents } = await supabase
        .from('agents')
        .select('*')

      if (agents && agents.length > 0) {
        setAgents(agents)
      } else {
        // Seed Supabase with default agents from store
        const defaultAgents = useStore.getState().agents
        if (defaultAgents.length > 0) {
          await supabase.from('agents').upsert(defaultAgents, { onConflict: 'id' })
          console.log('[Supabase] Seeded agents:', defaultAgents.length)
        }
      }
    }

    loadData()

    // Real-time subscriptions — use LOCAL methods to avoid echo loops
    // When another user writes to Supabase, we get the event and update locally only
    // (no re-write to Supabase, which would cause infinite loops)
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          addTaskLocal(payload.new as Task)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          const updated = payload.new as Task
          updateTaskLocal(updated.id, updated)
        }
      )
      .subscribe()

    const activityChannel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity' },
        (payload) => {
          addActivity(payload.new as Activity)
        }
      )
      .subscribe()

    const agentsChannel = supabase
      .channel('agents-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agents' },
        async () => {
          const { data } = await supabase.from('agents').select('*')
          if (data) setAgents(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(activityChannel)
      supabase.removeChannel(agentsChannel)
    }
  }, [])
}
