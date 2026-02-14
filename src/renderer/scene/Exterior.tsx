import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Exterior() {
  const terrainRef = useRef<THREE.Mesh>(null)

  // Generate procedural terrain heightmap
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 128, 128)
    const positions = geo.attributes.position.array as Float32Array

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 1]

      // Multi-octave noise for natural terrain
      let height = 0
      height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3
      height += Math.sin(x * 0.12 + 1.5) * Math.cos(z * 0.08 + 0.7) * 1.5
      height += Math.sin(x * 0.25 + 3.0) * Math.cos(z * 0.3 + 2.0) * 0.5
      height += Math.sin(x * 0.5) * Math.cos(z * 0.6) * 0.2

      // Create a flat zone around the station (radius ~15)
      const distFromCenter = Math.sqrt(x * x + z * z)
      const stationClearance = Math.max(0, Math.min(1, (distFromCenter - 14) / 8))
      height *= stationClearance

      positions[i + 2] = height
    }

    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <group>
      {/* Terrain surface */}
      <mesh
        ref={terrainRef}
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#0a0f1a"
          metalness={0.3}
          roughness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Terrain neon grid overlay — gives it that TRON feel */}
      <mesh
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.45, 0]}
      >
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={0.15}
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Distant mountains / rock formations */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const dist = 60 + Math.sin(i * 2.5) * 15
        const x = Math.cos(angle) * dist
        const z = Math.sin(angle) * dist
        const height = 8 + Math.sin(i * 1.7) * 6
        const width = 6 + Math.sin(i * 3.1) * 3

        return (
          <mesh key={`mountain-${i}`} position={[x, height / 2 - 0.5, z]}>
            <coneGeometry args={[width, height, 5]} />
            <meshStandardMaterial
              color="#050a15"
              metalness={0.5}
              roughness={0.7}
            />
          </mesh>
        )
      })}

      {/* Glowing crystal formations scattered on terrain */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2 + i * 0.3
        const dist = 18 + Math.sin(i * 1.7) * 8
        const x = Math.cos(angle) * dist
        const z = Math.sin(angle) * dist
        const height = 0.5 + Math.sin(i * 2.3) * 0.4
        const colors = ['#00f0ff', '#7b2fff', '#ff2f7b', '#00ff88']
        const color = colors[i % colors.length]

        return (
          <group key={`crystal-${i}`} position={[x, height / 2, z]}>
            <mesh rotation={[0, i * 0.7, Math.PI * 0.1 * Math.sin(i)]}>
              <octahedronGeometry args={[height, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={2}
                transparent
                opacity={0.7}
              />
            </mesh>
            {/* Crystal ground glow */}
            <pointLight
              position={[0, 0.2, 0]}
              intensity={0.3}
              distance={4}
              color={color}
              decay={2}
            />
          </group>
        )
      })}

      {/* Atmosphere — distant glow on the horizon */}
      <mesh position={[0, 5, 0]}>
        <sphereGeometry args={[90, 32, 16]} />
        <meshBasicMaterial
          color="#020818"
          side={THREE.BackSide}
        />
      </mesh>

      {/* Horizon glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[50, 90, 64]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Distant nebula / aurora in the sky */}
      <AuroraBorealis />
    </group>
  )
}

function AuroraBorealis() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0003
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.03 + Math.sin(state.clock.elapsedTime * 0.3) * 0.015
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 30, -40]} rotation={[0.3, 0, 0]}>
      <planeGeometry args={[120, 30, 32, 8]} />
      <meshBasicMaterial
        color="#7b2fff"
        transparent
        opacity={0.04}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
