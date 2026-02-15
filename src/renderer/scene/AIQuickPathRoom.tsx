import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Stars, Line, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Scanline } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { YBotAgent } from './YBotAgent'
import { ParticleDust } from './ParticleDust'

// Starting positions for agents at their desks
const AQP_AGENT_STARTS: [number, number, number][] = [
  [-3, 0, 2.8],   // Agent 0 — left desk
  [3, 0, 2.8],    // Agent 1 — right desk
]

export function AIQuickPathRoom() {
  const tasks = useStore((s) => s.tasks)
  const agents = useStore((s) => s.agents)
  const activeProjectId = useStore((s) => s.activeProjectId)

  // Live position refs for YBotAgent collision avoidance
  const livePositions = useMemo(() =>
    agents.slice(0, 2).map((_, i) => {
      const pos = AQP_AGENT_STARTS[i] || AQP_AGENT_STARTS[0]
      return new THREE.Vector3(pos[0], 0, pos[2])
    }),
    [agents.length]
  )

  const projectTasks = tasks.filter((t) => t.project_id === activeProjectId)
  const todoTasks = projectTasks.filter((t) => t.status === 'todo')
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in_progress')
  const doneTasks = projectTasks.filter((t) => t.status === 'done')

  return (
    <>
      {/* Lighting — warmer with cyan + purple emphasis */}
      <ambientLight intensity={0.06} color="#1a1a3e" />
      <pointLight position={[0, 6, 0]} intensity={2} color="#00f0ff" distance={18} decay={2} />
      <pointLight position={[-6, 3, -3]} intensity={1} color="#7b2fff" distance={15} decay={2} />
      <pointLight position={[6, 3, -3]} intensity={1} color="#ff2f7b" distance={15} decay={2} />
      <pointLight position={[0, 2, -5]} intensity={0.8} color="#00ff88" distance={10} decay={2} />

      <Stars radius={100} depth={50} count={2000} factor={3} fade speed={0.3} />

      {/* === ROOM STRUCTURE === */}
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.8}
          mirror={0.6}
          minDepthThreshold={0.9}
          maxDepthThreshold={1}
          depthScale={0}
          color="#0a0a12"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
      <gridHelper args={[18, 36, '#0a2a3a', '#061525']} position={[0, 0, 0]} />

      {/* Back wall */}
      <mesh position={[0, 4.5, -7]}>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color="#080818" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-9, 4.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#080818" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Right wall */}
      <mesh position={[9, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#080818" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#050510" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Neon trim on ceiling edges */}
      {[[-9, 9, 0], [9, 9, 0]].map((pos, i) => (
        <mesh key={`ceil-trim-${i}`} position={pos as [number, number, number]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <boxGeometry args={[14, 0.02, 0.02]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1} />
        </mesh>
      ))}

      {/* === BACK WALL — AIQUICKPATH BRAND + PIPELINE === */}
      <BackWallDisplay />

      {/* === LEFT WALL — KANBAN BOARD === */}
      <KanbanBoard todoTasks={todoTasks} inProgressTasks={inProgressTasks} doneTasks={doneTasks} />

      {/* === RIGHT WALL — SESSION ROADMAP === */}
      <SessionRoadmap />

      {/* === CENTER — HOLOGRAPHIC REVENUE TRACKER === */}
      <RevenueHologram />

      {/* Work consoles */}
      {[[-3, 0, 2], [3, 0, 2]].map((pos, i) => (
        <group key={`desk-${i}`} position={pos as [number, number, number]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[2, 0.08, 1]} />
            <meshStandardMaterial color="#151525" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Desk accent strip */}
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.8, 0.01, 0.02]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1} />
          </mesh>
        </group>
      ))}

      {/* Agents at desks — YBot animated avatars */}
      {agents.slice(0, 2).map((agent, i) => {
        const pos = AQP_AGENT_STARTS[i] || AQP_AGENT_STARTS[0]
        const partnerIdx = i === 0 ? 1 : 0
        return (
          <YBotAgent
            key={agent.id}
            agent={agent}
            position={pos}
            livePosition={livePositions[i]}
            partnerLivePosition={livePositions[partnerIdx]}
          />
        )
      })}

      {/* Floor accent ring around revenue hologram */}
      <mesh position={[0, 0.02, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.5, 64]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} transparent opacity={0.2} />
      </mesh>

      <ParticleDust />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
        <Scanline density={1.2} opacity={0.05} />
      </EffectComposer>
    </>
  )
}

/* ─── BACK WALL — Brand header + client pipeline funnel ─── */
function BackWallDisplay() {
  const funnelRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (funnelRef.current) {
      funnelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
  })

  const pipelineStages = [
    { label: 'LEADS', count: 12, color: '#00f0ff', width: 3.5 },
    { label: 'QUALIFIED', count: 6, color: '#7b2fff', width: 2.8 },
    { label: 'BOOKED', count: 3, color: '#ff2f7b', width: 2.0 },
    { label: 'ACTIVE', count: 1, color: '#00ff88', width: 1.2 },
  ]

  return (
    <group position={[0, 4.5, -6.9]}>
      {/* AIQUICKPATH title */}
      <Text
        position={[0, 3, 0.01]}
        fontSize={0.6}
        color="#00f0ff"
        anchorX="center"
        outlineColor="#000000"
        outlineWidth={0.02}
      >
        AIQUICKPATH
      </Text>
      <Text
        position={[0, 2.4, 0.01]}
        fontSize={0.14}
        color="#4080a0"
        anchorX="center"
      >
        BOUTIQUE AI CONSULTANCY // COMMAND CENTER
      </Text>

      {/* Pipeline funnel — holographic bars */}
      <group ref={funnelRef} position={[0, 0.5, 0.05]}>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.12}
          color="#00f0ff"
          anchorX="center"
        >
          CLIENT PIPELINE
        </Text>

        {pipelineStages.map((stage, i) => (
          <group key={stage.label} position={[0, 0.8 - i * 0.7, 0]}>
            {/* Funnel bar */}
            <mesh>
              <boxGeometry args={[stage.width, 0.4, 0.02]} />
              <meshStandardMaterial
                color={stage.color}
                emissive={stage.color}
                emissiveIntensity={0.3}
                transparent
                opacity={0.25}
              />
            </mesh>
            {/* Bar border */}
            <mesh position={[0, 0, 0.01]}>
              <boxGeometry args={[stage.width, 0.4, 0.001]} />
              <meshStandardMaterial
                color={stage.color}
                emissive={stage.color}
                emissiveIntensity={1}
                wireframe
                transparent
                opacity={0.4}
              />
            </mesh>
            {/* Label */}
            <Text
              position={[-stage.width / 2 - 0.3, 0, 0.02]}
              fontSize={0.08}
              color={stage.color}
              anchorX="right"
            >
              {stage.label}
            </Text>
            {/* Count */}
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.18}
              color="#ffffff"
              anchorX="center"
            >
              {String(stage.count)}
            </Text>
          </group>
        ))}
      </group>

      {/* Accent lines on back wall */}
      <mesh position={[-6, 0, 0.01]}>
        <boxGeometry args={[0.02, 7, 0.001]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1} transparent opacity={0.3} />
      </mesh>
      <mesh position={[6, 0, 0.01]}>
        <boxGeometry args={[0.02, 7, 0.001]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

/* ─── LEFT WALL — Kanban board ─── */
function KanbanBoard({ todoTasks, inProgressTasks, doneTasks }: { todoTasks: any[]; inProgressTasks: any[]; doneTasks: any[] }) {
  return (
    <group position={[-8.9, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* Board header */}
      <Text
        position={[0, 3.5, 0.01]}
        fontSize={0.15}
        color="#00f0ff"
        anchorX="center"
      >
        MISSION BOARD
      </Text>

      {/* Board background */}
      <mesh>
        <planeGeometry args={[11, 6]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.03} transparent opacity={0.06} />
      </mesh>

      {/* Column headers */}
      {['TO DO', 'IN PROGRESS', 'DONE'].map((label, i) => {
        const xPos = (i - 1) * 3.4
        const colors = ['#ff4444', '#ffaa00', '#00ff88']
        return (
          <group key={label}>
            <Text position={[xPos, 2.5, 0.01]} fontSize={0.16} color={colors[i]} anchorX="center">
              {label}
            </Text>
            {/* Underline */}
            <mesh position={[xPos, 2.3, 0.01]}>
              <boxGeometry args={[2.8, 0.01, 0.001]} />
              <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={1} />
            </mesh>
            {/* Column divider */}
            {i < 2 && (
              <mesh position={[xPos + 1.7, 0, 0.01]}>
                <boxGeometry args={[0.01, 5.5, 0.001]} />
                <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} transparent opacity={0.2} />
              </mesh>
            )}
          </group>
        )
      })}

      {/* Task cards */}
      {todoTasks.slice(0, 5).map((task, i) => (
        <TaskCard key={task.id} task={task} x={-3.4} y={1.6 - i * 0.7} color="#ff4444" />
      ))}
      {inProgressTasks.slice(0, 5).map((task, i) => (
        <TaskCard key={task.id} task={task} x={0} y={1.6 - i * 0.7} color="#ffaa00" />
      ))}
      {doneTasks.slice(0, 5).map((task, i) => (
        <TaskCard key={task.id} task={task} x={3.4} y={1.6 - i * 0.7} color="#00ff88" />
      ))}
    </group>
  )
}

/* ─── RIGHT WALL — 3-Session Roadmap ─── */
function SessionRoadmap() {
  const sessions = [
    { num: '01', title: 'FOUNDATIONS', desc: 'Claude Code Mastery', color: '#00f0ff', status: 'READY' },
    { num: '02', title: 'AGENT ARCHITECTURE', desc: 'Infrastructure Setup', color: '#7b2fff', status: 'READY' },
    { num: '03', title: 'STATION LAUNCH', desc: 'Deploy Junosphere', color: '#ff2f7b', status: 'READY' },
  ]

  return (
    <group position={[8.9, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Header */}
      <Text position={[0, 3.5, 0.01]} fontSize={0.15} color="#7b2fff" anchorX="center">
        ONBOARDING PROTOCOL
      </Text>
      <Text position={[0, 3.1, 0.01]} fontSize={0.08} color="#4040a0" anchorX="center">
        3 SESSIONS // 90 MIN EACH // $1,997/SEAT
      </Text>

      {/* Background */}
      <mesh>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#7b2fff" emissive="#7b2fff" emissiveIntensity={0.02} transparent opacity={0.06} />
      </mesh>

      {/* Session cards */}
      {sessions.map((session, i) => (
        <group key={session.num} position={[0, 1.8 - i * 1.8, 0.02]}>
          {/* Card bg */}
          <mesh>
            <planeGeometry args={[8, 1.4]} />
            <meshStandardMaterial
              color={session.color}
              emissive={session.color}
              emissiveIntensity={0.05}
              transparent
              opacity={0.1}
            />
          </mesh>

          {/* Left accent bar */}
          <mesh position={[-3.99, 0, 0.01]}>
            <boxGeometry args={[0.04, 1.4, 0.001]} />
            <meshStandardMaterial color={session.color} emissive={session.color} emissiveIntensity={2} />
          </mesh>

          {/* Session number */}
          <Text position={[-3.2, 0.25, 0.01]} fontSize={0.25} color={session.color} anchorX="center">
            {session.num}
          </Text>

          {/* Title */}
          <Text position={[-0.5, 0.25, 0.01]} fontSize={0.16} color="#ffffff" anchorX="center">
            {session.title}
          </Text>

          {/* Description */}
          <Text position={[-0.5, -0.1, 0.01]} fontSize={0.09} color="#808090" anchorX="center">
            {session.desc}
          </Text>

          {/* Status badge */}
          <group position={[3.2, 0, 0.01]}>
            <mesh>
              <boxGeometry args={[1, 0.3, 0.001]} />
              <meshStandardMaterial color={session.color} emissive={session.color} emissiveIntensity={0.2} transparent opacity={0.2} />
            </mesh>
            <Text position={[0, 0, 0.01]} fontSize={0.09} color={session.color} anchorX="center">
              {session.status}
            </Text>
          </group>

          {/* Connection line to next session */}
          {i < sessions.length - 1 && (
            <mesh position={[-3.2, -0.85, 0.01]}>
              <boxGeometry args={[0.02, 0.3, 0.001]} />
              <meshStandardMaterial color={session.color} emissive={session.color} emissiveIntensity={1} transparent opacity={0.4} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/* ─── CENTER — Revenue Hologram ─── */
function RevenueHologram() {
  const holoRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (holoRef.current) {
      holoRef.current.rotation.y += 0.005
    }
  })

  return (
    <group position={[0, 1.5, -2]}>
      {/* Base projector */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 0.25, 32]} />
        <meshStandardMaterial color="#151525" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Projection beam */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.5, 1, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} transparent opacity={0.12} />
      </mesh>

      {/* Rotating hologram */}
      <group ref={holoRef}>
        {/* Revenue display orb */}
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
          <mesh>
            <dodecahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} wireframe transparent opacity={0.5} />
          </mesh>
        </Float>

        {/* Revenue text */}
        <Text position={[0, 0.7, 0]} fontSize={0.12} color="#00ff88" anchorX="center">
          REVENUE TARGET
        </Text>
        <Text position={[0, 0.45, 0]} fontSize={0.25} color="#ffffff" anchorX="center">
          $19,970
        </Text>
        <Text position={[0, 0.25, 0]} fontSize={0.08} color="#00ff88" anchorX="center">
          10 SEATS @ $1,997
        </Text>

        {/* Stats ring */}
        <Text position={[0, -0.5, 0]} fontSize={0.08} color="#4080a0" anchorX="center">
          SEATS SOLD: 0 // PIPELINE: 12 // CLOSE RATE: --
        </Text>
      </group>

      {/* Orbiting data points */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2
        const r = 0.9
        return (
          <mesh key={`orbit-${i}`} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={3} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ─── Task Card ─── */
function TaskCard({ task, x, y, color }: { task: any; x: number; y: number; color: string }) {
  return (
    <group position={[x, y, 0.02]}>
      <mesh>
        <planeGeometry args={[3, 0.55]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} transparent opacity={0.12} />
      </mesh>
      <mesh position={[-1.49, 0, 0.001]}>
        <boxGeometry args={[0.03, 0.55, 0.001]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <Text position={[0, 0.05, 0.01]} fontSize={0.09} color="#e0e0e0" anchorX="center" maxWidth={2.6}>
        {task.title}
      </Text>
      {task.assigned_to && (
        <Text position={[0, -0.15, 0.01]} fontSize={0.065} color={color} anchorX="center">
          {task.assigned_to}
        </Text>
      )}
    </group>
  )
}
