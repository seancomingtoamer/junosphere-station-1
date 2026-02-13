import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent as AgentType } from '../../shared/types'

interface AgentProps {
  agent: AgentType
  position: [number, number, number]
  isWorking?: boolean
}

export function Agent({ agent, position, isWorking = false }: AgentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)

  const color = agent.color || '#00f0ff'

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Idle breathing animation
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 2 + position[0]) * 0.03
    }

    // Subtle body sway
    groupRef.current.rotation.y = Math.sin(t * 0.5 + position[0] * 2) * 0.1
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <group ref={bodyRef}>
        {/* Torso */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.35, 0.45, 0.2]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Chest accent line */}
        <mesh position={[0, 0.65, 0.101]}>
          <boxGeometry args={[0.3, 0.04, 0.001]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[0.22, 0.25, 0.2]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Visor / eyes */}
        <mesh position={[0, 1.07, 0.101]}>
          <boxGeometry args={[0.18, 0.06, 0.001]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={3}
          />
        </mesh>

        {/* Left arm */}
        <mesh position={[-0.25, 0.6, 0]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.12]} />
          <meshStandardMaterial color="#151528" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Right arm */}
        <mesh position={[0.25, 0.6, 0]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.12]} />
          <meshStandardMaterial color="#151528" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Left leg */}
        <mesh position={[-0.1, 0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.14]} />
          <meshStandardMaterial color="#101020" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Right leg */}
        <mesh position={[0.1, 0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.14]} />
          <meshStandardMaterial color="#101020" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Shoulder pads with accent */}
        <mesh position={[-0.22, 0.85, 0]}>
          <boxGeometry args={[0.15, 0.06, 0.22]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0.22, 0.85, 0]}>
          <boxGeometry args={[0.15, 0.06, 0.22]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Ground glow ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>

      {/* Name tag - always faces camera */}
      <Billboard position={[0, 1.45, 0]}>
        {/* Badge background */}
        <mesh>
          <planeGeometry args={[0.8, 0.18]} />
          <meshStandardMaterial
            color="#000010"
            transparent
            opacity={0.7}
          />
        </mesh>
        <Text
          fontSize={0.08}
          color={color}
          anchorX="center"
          anchorY="middle"

        >
          {agent.name}
        </Text>
      </Billboard>

      {/* Role badge */}
      <Billboard position={[0, 1.28, 0]}>
        <Text
          fontSize={0.05}
          color="#6080a0"
          anchorX="center"
          anchorY="middle"

        >
          {agent.role}
        </Text>
      </Billboard>

      {/* Online indicator */}
      {agent.is_online && (
        <pointLight
          position={[0, 1.1, 0.3]}
          intensity={0.5}
          distance={2}
          color={color}
          decay={2}
        />
      )}
    </group>
  )
}
