import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Scanline } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { Agent } from './Agent'
import { ParticleDust } from './ParticleDust'

export function ProjectRoom() {
  const tasks = useStore((s) => s.tasks)
  const agents = useStore((s) => s.agents)
  const projects = useStore((s) => s.projects)
  const activeProjectId = useStore((s) => s.activeProjectId)

  const project = projects.find((p) => p.id === activeProjectId)
  const projectTasks = tasks.filter((t) => t.project_id === activeProjectId)

  const todoTasks = projectTasks.filter((t) => t.status === 'todo')
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in_progress')
  const doneTasks = projectTasks.filter((t) => t.status === 'done')

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.06} color="#1a1a3e" />
      <pointLight position={[0, 5, 0]} intensity={1.5} color="#00f0ff" distance={15} />
      <pointLight position={[-6, 3, 0]} intensity={0.8} color="#7b2fff" distance={12} />
      <pointLight position={[6, 3, 0]} intensity={0.8} color="#ff2f7b" distance={12} />

      <Stars radius={100} depth={50} count={2000} factor={3} fade speed={0.3} />

      {/* Room structure */}
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#0a0a12" metalness={0.9} roughness={0.3} />
      </mesh>
      <gridHelper args={[16, 32, '#0a2a3a', '#061525']} position={[0, 0, 0]} />

      {/* Back wall */}
      <mesh position={[0, 4, -6]}>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#080818" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-8, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#080818" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Right wall */}
      <mesh position={[8, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#080818" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#050510" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Project name on ceiling */}
      <Text
        position={[0, 7.5, -2]}
        fontSize={0.5}
        color="#00f0ff"
        anchorX="center"

        outlineColor="#000000"
        outlineWidth={0.02}
      >
        {project?.name || 'PROJECT ROOM'}
      </Text>

      {/* === KANBAN BOARD — LEFT WALL === */}
      <group position={[-7.9, 3.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Board background */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[10, 5]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={0.05}
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Column headers */}
        {['TO DO', 'IN PROGRESS', 'DONE'].map((label, i) => {
          const xPos = (i - 1) * 3.2
          const colors = ['#ff4444', '#ffaa00', '#00ff88']
          return (
            <group key={label}>
              <Text
                position={[xPos, 2, 0.01]}
                fontSize={0.18}
                color={colors[i]}
                anchorX="center"
        
              >
                {label}
              </Text>
              {/* Column divider line */}
              {i < 2 && (
                <mesh position={[xPos + 1.6, 0, 0.01]}>
                  <boxGeometry args={[0.01, 4.5, 0.001]} />
                  <meshStandardMaterial
                    color="#00f0ff"
                    emissive="#00f0ff"
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.3}
                  />
                </mesh>
              )}
            </group>
          )
        })}

        {/* Task cards — TO DO column */}
        {todoTasks.slice(0, 5).map((task, i) => (
          <TaskCard key={task.id} task={task} x={-3.2} y={1.2 - i * 0.7} color="#ff4444" />
        ))}

        {/* Task cards — IN PROGRESS column */}
        {inProgressTasks.slice(0, 5).map((task, i) => (
          <TaskCard key={task.id} task={task} x={0} y={1.2 - i * 0.7} color="#ffaa00" />
        ))}

        {/* Task cards — DONE column */}
        {doneTasks.slice(0, 5).map((task, i) => (
          <TaskCard key={task.id} task={task} x={3.2} y={1.2 - i * 0.7} color="#00ff88" />
        ))}
      </group>

      {/* === COMMS FEED — RIGHT WALL === */}
      <group position={[7.9, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[8, 4]} />
          <meshStandardMaterial
            color="#7b2fff"
            emissive="#7b2fff"
            emissiveIntensity={0.03}
            transparent
            opacity={0.08}
          />
        </mesh>
        <Text
          position={[0, 1.7, 0.01]}
          fontSize={0.15}
          color="#7b2fff"
          anchorX="center"
  
        >
          AGENT COMMS
        </Text>
      </group>

      {/* Work consoles in center */}
      {[[-2, 0, 1], [2, 0, 1]].map((pos, i) => (
        <group key={`desk-${i}`} position={pos as [number, number, number]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.8, 0.08, 1]} />
            <meshStandardMaterial color="#151525" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.2, -0.4]}>
            <planeGeometry args={[1.4, 0.7]} />
            <meshStandardMaterial
              color="#00f0ff"
              emissive="#00f0ff"
              emissiveIntensity={0.3}
              transparent
              opacity={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Agents at their desks */}
      {agents.slice(0, 2).map((agent, i) => (
        <Agent
          key={agent.id}
          agent={agent}
          position={[i === 0 ? -2 : 2, 0, 2]}
          isWorking
        />
      ))}

      <ParticleDust />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
        <Scanline density={1.2} opacity={0.05} />
      </EffectComposer>
    </>
  )
}

function TaskCard({ task, x, y, color }: { task: any; x: number; y: number; color: string }) {
  return (
    <group position={[x, y, 0.02]}>
      {/* Card background */}
      <mesh>
        <planeGeometry args={[2.8, 0.55]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Card border */}
      <mesh position={[-1.39, 0, 0.001]}>
        <boxGeometry args={[0.03, 0.55, 0.001]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      {/* Task title */}
      <Text
        position={[0, 0.05, 0.01]}
        fontSize={0.1}
        color="#e0e0e0"
        anchorX="center"
        maxWidth={2.5}

      >
        {task.title}
      </Text>
      {/* Assignee */}
      {task.assigned_to && (
        <Text
          position={[0, -0.15, 0.01]}
          fontSize={0.07}
          color={color}
          anchorX="center"
  
        >
          {task.assigned_to}
        </Text>
      )}
    </group>
  )
}
