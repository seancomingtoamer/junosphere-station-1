import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useStore } from './store/useStore'
import { Hub } from './scene/Hub'
import { ProjectRoom } from './scene/ProjectRoom'
import { AIQuickPathRoom } from './scene/AIQuickPathRoom'
import { HUD } from './components/HUD'
import { TaskPanel } from './components/TaskPanel'
import { useRealtime } from './hooks/useRealtime'

export function App() {
  const view = useStore((s) => s.view)
  const activeProjectId = useStore((s) => s.activeProjectId)
  // Connect to Supabase real-time (no-op if env vars not set)
  useRealtime()

  // Custom rooms for specific projects
  const isAIQuickPath = activeProjectId === 'aiquickpath'

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 3, 10], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000008' }}
      >
        <fog attach="fog" args={['#000008', 15, 80]} />
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={18}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.65}
          target={[0, 1.5, 0]}
          autoRotate
          autoRotateSpeed={0.3}
        />
        {view === 'hub' && <Hub />}
        {view === 'project-room' && activeProjectId && (
          isAIQuickPath ? <AIQuickPathRoom /> : <ProjectRoom />
        )}
      </Canvas>

      {/* UI Overlay */}
      <HUD />
      {view === 'project-room' && <TaskPanel />}
    </div>
  )
}
