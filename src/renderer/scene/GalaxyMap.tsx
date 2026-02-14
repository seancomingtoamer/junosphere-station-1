import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Project } from '../../shared/types'
import { useStore } from '../store/useStore'

interface GalaxyMapProps {
  projects: Project[]
}

export function GalaxyMap({ projects }: GalaxyMapProps) {
  const coreRef = useRef<THREE.Group>(null)
  const setView = useStore((s) => s.setView)
  const setActiveProject = useStore((s) => s.setActiveProject)

  useFrame(() => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.003
    }
  })

  const displayProjects = projects.length > 0 ? projects : [
    { id: 'aiquickpath', name: 'AIQUICKPATH', description: 'Boutique AI consultancy', status: 'active' as const, owner_id: '', created_at: '' },
  ]

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId)
    setView('project-room')
  }

  return (
    <group position={[0, 1.5, 0]}>
      {/* Hologram base projector */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.8, 1, 0.3, 32]} />
        <meshStandardMaterial color="#151525" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Projection beam */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.6, 1.2, 16]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={2}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Rotating central core — visual only, no click targets here */}
      <group ref={coreRef}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh raycast={() => null}>
            <icosahedronGeometry args={[0.4, 1]} />
            <meshStandardMaterial
              color="#00f0ff"
              emissive="#00f0ff"
              emissiveIntensity={1}
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
        </Float>
      </group>

      {/* Project nodes — OUTSIDE rotating group so clicks work reliably */}
      {displayProjects.map((project, i) => {
        const angle = (i / displayProjects.length) * Math.PI * 2
        const radius = 1.8
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const colors = ['#00f0ff', '#7b2fff', '#ff2f7b', '#00ff88', '#ffaa00']
        const color = colors[i % colors.length]

        return (
          <ProjectNode
            key={project.id}
            project={project}
            position={[x, 0, z]}
            color={color}
            onSelect={() => handleProjectClick(project.id)}
          />
        )
      })}

      {/* Title */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.2}
        color="#00f0ff"
        anchorX="center"
        outlineColor="#000000"
        outlineWidth={0.01}
      >
        JUNOSPHERE
      </Text>
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.08}
        color="#4080a0"
        anchorX="center"
      >
        AGENT COLLABORATION STATION
      </Text>
    </group>
  )
}

/* Separate component for each project node — handles its own hover/click state */
function ProjectNode({ project, position, color, onSelect }: {
  project: Project
  position: [number, number, number]
  color: string
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const orbRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += 0.02
      orbRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.2
      const scale = hovered ? 1.4 : 1
      orbRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
    if (glowRef.current) {
      glowRef.current.intensity = hovered ? 2 : 0.5
    }
  })

  return (
    <group position={position}>
      {/* Clickable orb — solid geometry, not wireframe */}
      <mesh
        ref={orbRef}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2.5 : 1.5}
        />
      </mesh>

      {/* Wireframe ring around the orb */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.5, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
          transparent
          opacity={hovered ? 0.6 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point light glow */}
      <pointLight ref={glowRef} color={color} intensity={0.5} distance={3} decay={2} />

      {/* Project label */}
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.14}
        color={hovered ? '#ffffff' : color}
        anchorX="center"
        anchorY="top"
        outlineColor="#000000"
        outlineWidth={0.01}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        {project.name}
      </Text>

      {/* "ENTER" hint on hover */}
      {hovered && (
        <Text
          position={[0, -0.85, 0]}
          fontSize={0.07}
          color="#ffffff"
          anchorX="center"
        >
          [ CLICK TO ENTER ]
        </Text>
      )}

      {/* Connection line to center — drawn as a thin box */}
      <mesh
        position={[-position[0] / 2, 0, -position[2] / 2]}
        rotation={[0, Math.atan2(-position[0], -position[2]), 0]}
        raycast={() => null}
      >
        <boxGeometry args={[0.01, 0.01, Math.sqrt(position[0] ** 2 + position[2] ** 2)]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  )
}
