import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function ParticleDust() {
  const meshRef = useRef<THREE.Points>(null)
  const count = 800

  const { positions, colors, sizes, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const ph = new Float32Array(count) // phase offset for twinkle

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22
      pos[i * 3 + 1] = Math.random() * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22

      // Mix of cyan, purple, and white particles
      const colorRoll = Math.random()
      if (colorRoll < 0.45) {
        // Cyan
        col[i * 3] = 0.0
        col[i * 3 + 1] = 0.7 + Math.random() * 0.3
        col[i * 3 + 2] = 1.0
      } else if (colorRoll < 0.75) {
        // Purple
        col[i * 3] = 0.4 + Math.random() * 0.2
        col[i * 3 + 1] = 0.1
        col[i * 3 + 2] = 0.8 + Math.random() * 0.2
      } else {
        // Warm white / faint gold
        col[i * 3] = 0.8 + Math.random() * 0.2
        col[i * 3 + 1] = 0.8 + Math.random() * 0.15
        col[i * 3 + 2] = 0.7 + Math.random() * 0.1
      }

      // Varied sizes — mostly tiny, a few larger motes
      sz[i] = Math.random() < 0.9
        ? 0.015 + Math.random() * 0.02
        : 0.04 + Math.random() * 0.03

      ph[i] = Math.random() * Math.PI * 2
    }
    return { positions: pos, colors: col, sizes: sz, phases: ph }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const posArr = meshRef.current.geometry.attributes.position.array as Float32Array
    const sizeArr = meshRef.current.geometry.attributes.size.array as Float32Array
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      // Slow drift — slightly different per particle
      posArr[i * 3] += Math.sin(t * 0.08 + i * 0.7) * 0.0008
      posArr[i * 3 + 1] += Math.cos(t * 0.12 + i * 0.4) * 0.0004
      posArr[i * 3 + 2] += Math.sin(t * 0.1 + i * 0.3) * 0.0008

      // Wrap around vertically
      if (posArr[i * 3 + 1] > 8) posArr[i * 3 + 1] = 0
      if (posArr[i * 3 + 1] < 0) posArr[i * 3 + 1] = 8

      // Twinkle — pulse size with individual phase
      const twinkle = Math.sin(t * 1.5 + phases[i]) * 0.3 + 0.7
      sizeArr[i] = sizes[i] * twinkle
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.geometry.attributes.size.needsUpdate = true
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
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
