import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Project } from '../../shared/types'
import { useStore } from '../store/useStore'

interface GalaxyMapProps {
  projects: Project[]
}

export function GalaxyMap({ projects }: GalaxyMapProps) {
  const holoRef = useRef<THREE.Group>(null)
  const setView = useStore((s) => s.setView)
  const setActiveProject = useStore((s) => s.setActiveProject)

  useFrame(() => {
    if (holoRef.current) {
      holoRef.current.rotation.y += 0.002
    }
  })

  // Demo projects if none loaded yet
  const displayProjects = projects.length > 0 ? projects : [
    { id: 'demo-1', name: 'PROJECT ALPHA', description: 'First collab', status: 'active' as const, owner_id: '', created_at: '' },
    { id: 'demo-2', name: 'PROJECT OMEGA', description: 'The big one', status: 'active' as const, owner_id: '', created_at: '' },
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

      {/* Rotating hologram container */}
      <group ref={holoRef}>
        {/* Central orb */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh>
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

        {/* Project nodes orbiting the center */}
        {displayProjects.map((project, i) => {
          const angle = (i / displayProjects.length) * Math.PI * 2
          const radius = 1.5
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius
          const colors = ['#00f0ff', '#7b2fff', '#ff2f7b', '#00ff88', '#ffaa00']
          const color = colors[i % colors.length]

          return (
            <group key={project.id} position={[x, 0, z]}>
              {/* Project orb */}
              <Float speed={3} rotationIntensity={1} floatIntensity={0.3}>
                <mesh
                  onClick={() => handleProjectClick(project.id)}
                  onPointerOver={(e) => {
                    document.body.style.cursor = 'pointer'
                    ;(e.object as THREE.Mesh).scale.setScalar(1.3)
                  }}
                  onPointerOut={(e) => {
                    document.body.style.cursor = 'default'
                    ;(e.object as THREE.Mesh).scale.setScalar(1)
                  }}
                >
                  <octahedronGeometry args={[0.25, 0]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.5}
                    wireframe
                  />
                </mesh>
              </Float>

              {/* Project label */}
              <Text
                position={[0, -0.5, 0]}
                fontSize={0.12}
                color={color}
                anchorX="center"
                anchorY="top"
                outlineColor="#000000"
                outlineWidth={0.01}
              >
                {project.name}
              </Text>

              {/* Connection line to center */}
              <Line
                points={[[x, 0, z], [0, 0, 0]]}
                color={color}
                transparent
                opacity={0.2}
                lineWidth={1}
              />
            </group>
          )
        })}
      </group>

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
