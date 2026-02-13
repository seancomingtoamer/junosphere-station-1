import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useStore } from './store/useStore'
import { Hub } from './scene/Hub'
import { ProjectRoom } from './scene/ProjectRoom'
import { HUD } from './components/HUD'
import { TaskPanel } from './components/TaskPanel'
import { useRealtime } from './hooks/useRealtime'

export function App() {
  const view = useStore((s) => s.view)
  const activeProjectId = useStore((s) => s.activeProjectId)
  const setAgents = useStore((s) => s.setAgents)
  const setProjects = useStore((s) => s.setProjects)
  const setTasks = useStore((s) => s.setTasks)

  // Connect to Supabase real-time (no-op if env vars not set)
  useRealtime()

  // Seed demo data on first load (used when Supabase not connected yet)
  useEffect(() => {
    setAgents([
      {
        id: 'agent-sean',
        profile_id: 'sean',
        name: 'EMPIRE HQ CTO',
        color: '#00f0ff',
        role: 'CTO // SEAN',
        is_online: true,
      },
      {
        id: 'agent-cam',
        profile_id: 'cam',
        name: 'SOFAR CTO',
        color: '#7b2fff',
        role: 'CTO // SOFAR',
        is_online: true,
      },
    ])

    setProjects([
      {
        id: 'project-alpha',
        name: 'PROJECT ALPHA',
        description: 'First collaboration project',
        status: 'active',
        owner_id: 'sean',
        created_at: new Date().toISOString(),
      },
      {
        id: 'project-omega',
        name: 'PROJECT OMEGA',
        description: 'The big one',
        status: 'active',
        owner_id: 'sean',
        created_at: new Date().toISOString(),
      },
    ])

    setTasks([
      {
        id: 'task-1',
        project_id: 'project-alpha',
        title: 'Set up project repository',
        description: '',
        status: 'done',
        assigned_to: 'EMPIRE HQ CTO',
        created_by: 'sean',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-2',
        project_id: 'project-alpha',
        title: 'Build landing page',
        description: '',
        status: 'in_progress',
        assigned_to: 'CAM CTO',
        created_by: 'cam',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-3',
        project_id: 'project-alpha',
        title: 'Set up Supabase auth',
        description: '',
        status: 'todo',
        assigned_to: 'EMPIRE HQ CTO',
        created_by: 'sean',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-4',
        project_id: 'project-alpha',
        title: 'Design API routes',
        description: '',
        status: 'todo',
        assigned_to: null,
        created_by: 'sean',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000008' }}
      >
        <fog attach="fog" args={['#000008', 10, 50]} />
        {view === 'hub' && <Hub />}
        {view === 'project-room' && activeProjectId && <ProjectRoom />}
      </Canvas>

      {/* UI Overlay */}
      <HUD />
      {view === 'project-room' && <TaskPanel />}
    </div>
  )
}
