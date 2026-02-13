import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function ParticleDust() {
  const meshRef = useRef<THREE.Points>(null)
  const count = 500

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 7
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      // Slow drift
      positions[i * 3] += Math.sin(t * 0.1 + i) * 0.001
      positions[i * 3 + 1] += Math.cos(t * 0.15 + i * 0.5) * 0.0005
      positions[i * 3 + 2] += Math.sin(t * 0.12 + i * 0.3) * 0.001

      // Wrap around
      if (positions[i * 3 + 1] > 7) positions[i * 3 + 1] = 0
      if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 7
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#00f0ff"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
