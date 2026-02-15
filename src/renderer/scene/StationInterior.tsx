import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

export function StationInterior() {
  const neonRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (neonRef.current) {
      // Subtle pulse on neon strips
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.9
      neonRef.current.children.forEach((child) => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = pulse
        }
      })
    }
  })

  return (
    <group>
      {/* Floor — dark metallic with grid lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.6}
          mirror={0.5}
          minDepthThreshold={0.9}
          maxDepthThreshold={1}
          depthScale={0}
          color="#8a8a95"
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>

      {/* Floor grid overlay */}
      <gridHelper
        args={[24, 48, '#0a2a3a', '#061525']}
        position={[0, 0, 0]}
      />

      {/* Circular walls */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[12, 12, 8, 64, 1, true]} />
        <meshStandardMaterial
          color="#121230"
          metalness={0.8}
          roughness={0.35}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ceiling dome */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[12, 64, 32, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial
          color="#0a0a20"
          metalness={0.9}
          roughness={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Neon accent strips on walls */}
      <group ref={neonRef}>
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2
          const x = Math.cos(angle) * 11.8
          const z = Math.sin(angle) * 11.8
          return (
            <mesh key={i} position={[x, 2, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
              <boxGeometry args={[0.05, 4, 0.02]} />
              <meshStandardMaterial
                color="#00f0ff"
                emissive="#00f0ff"
                emissiveIntensity={1}
              />
            </mesh>
          )
        })}
      </group>

      {/* Window panels — nebula glow bleeding in from deep space */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        const x = Math.cos(angle) * 11.7
        const z = Math.sin(angle) * 11.7
        const windowColors = ['#001040', '#100030', '#001040', '#100030']
        const windowEmissive = ['#0050c0', '#4010a0', '#0050c0', '#4010a0']
        return (
          <mesh key={`window-${i}`} position={[x, 4, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <planeGeometry args={[4, 5]} />
            <meshStandardMaterial
              color={windowColors[i]}
              transparent
              opacity={0.2}
              emissive={windowEmissive[i]}
              emissiveIntensity={0.6}
            />
          </mesh>
        )
      })}

      {/* Central platform ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3, 64]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Console stations around the room */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const x = Math.cos(angle) * 8
        const z = Math.sin(angle) * 8
        return (
          <group key={`console-${i}`} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            {/* Console desk */}
            <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[1.5, 0.1, 0.8]} />
              <meshStandardMaterial color="#151525" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Desk accent strip */}
            <mesh position={[0, 0.86, 0]}>
              <boxGeometry args={[1.3, 0.01, 0.02]} />
              <meshStandardMaterial
                color="#00f0ff"
                emissive="#00f0ff"
                emissiveIntensity={1}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
