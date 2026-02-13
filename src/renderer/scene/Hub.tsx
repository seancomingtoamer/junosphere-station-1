import { useStore } from '../store/useStore'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Scanline } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Agent } from './Agent'
import { GalaxyMap } from './GalaxyMap'
import { StationInterior } from './StationInterior'
import { ParticleDust } from './ParticleDust'

export function Hub() {
  const projects = useStore((s) => s.projects)
  const agents = useStore((s) => s.agents)

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.08} color="#1a1a3e" />
      <pointLight position={[0, 6, 0]} intensity={2} color="#00f0ff" distance={20} decay={2} />
      <pointLight position={[-5, 3, -3]} intensity={1} color="#7b2fff" distance={15} decay={2} />
      <pointLight position={[5, 3, -3]} intensity={1} color="#ff2f7b" distance={15} decay={2} />

      {/* Distant stars visible through station windows */}
      <Stars radius={200} depth={80} count={5000} factor={4} saturation={0.5} fade speed={0.3} />

      {/* Station structure */}
      <StationInterior />

      {/* Galaxy map hologram in center */}
      <GalaxyMap projects={projects} />

      {/* Floating dust particles */}
      <ParticleDust />

      {/* Agent avatars */}
      {agents.map((agent, i) => (
        <Agent
          key={agent.id}
          agent={agent}
          position={[i % 2 === 0 ? -2.5 : 2.5, 0, 2 + i * 0.5]}
        />
      ))}

      {/* Post-processing for that cyberpunk feel */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
        <Scanline density={1.2} opacity={0.05} />
      </EffectComposer>
    </>
  )
}
