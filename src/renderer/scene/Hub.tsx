import { useRef, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Scanline, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { YBotAgent } from './YBotAgent'
import { GalaxyMap } from './GalaxyMap'
import { StationInterior } from './StationInterior'
import { ParticleDust } from './ParticleDust'

// Starting positions for agents — spread across station floor
const AGENT_STARTS: [number, number, number][] = [
  [-2.5, 0, 2.5],   // Agent 0 (EMPIRE HQ CTO) — left side
  [2.5, 0, 2.0],     // Agent 1 (SOFAR CTO) — right side
  [-1.5, 0, 3.5],   // Extra agents if added
  [1.5, 0, 1.5],
]

export function Hub() {
  const projects = useStore((s) => s.projects)
  const agents = useStore((s) => s.agents)

  // Live position refs — each agent writes to its own, reads from partner's
  // These are mutable Vector3 objects updated every frame by each Agent
  const livePositions = useMemo(() =>
    agents.map((_, i) => {
      const pos = AGENT_STARTS[i] || AGENT_STARTS[0]
      return new THREE.Vector3(pos[0], 0, pos[2])
    }),
    [agents.length]
  )

  return (
    <>
      {/* Depth fog — fades distant objects into darkness */}
      <fog attach="fog" args={['#020208', 8, 28]} />

      {/* Lighting — richer with more fill */}
      <ambientLight intensity={0.08} color="#1a1a3e" />
      <pointLight position={[0, 6, 0]} intensity={2} color="#00f0ff" distance={20} decay={2} />
      <pointLight position={[-5, 3, -3]} intensity={1} color="#7b2fff" distance={15} decay={2} />
      <pointLight position={[5, 3, -3]} intensity={1} color="#ff2f7b" distance={15} decay={2} />
      {/* Extra fill lights for depth */}
      <pointLight position={[0, 2, 8]} intensity={0.5} color="#00f0ff" distance={12} decay={2} />
      <pointLight position={[-8, 5, -6]} intensity={0.3} color="#4020a0" distance={18} decay={2} />
      <pointLight position={[8, 5, -6]} intensity={0.3} color="#a02060" distance={18} decay={2} />

      {/* Distant stars — denser field visible through station windows */}
      <Stars radius={200} depth={80} count={8000} factor={4} saturation={0.5} fade speed={0.3} />

      {/* Station structure */}
      <StationInterior />

      {/* Galaxy map hologram in center */}
      <GalaxyMap projects={projects} />

      {/* Floating dust particles */}
      <ParticleDust />

      {/* Agent avatars — Y Bot models with full animation */}
      {agents.map((agent, i) => {
        const pos = AGENT_STARTS[i] || AGENT_STARTS[0]
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

      {/* Post-processing for that cyberpunk feel */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
        <Scanline density={1.2} opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  )
}
