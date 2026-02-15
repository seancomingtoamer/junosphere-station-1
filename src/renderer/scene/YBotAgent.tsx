import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Agent as AgentType } from '../../shared/types'

// --- Behavior types ---
type BehaviorState =
  | 'idle_stand'       // Weight shift animation — subtle idle
  | 'idle_happy'       // Happy idle — relaxed standing
  | 'idle_look'        // Looking around
  | 'wander'           // Walking to a point
  | 'approach_partner' // Walking toward partner
  | 'converse'         // Facing partner, gesturing
  | 'approach_camera'  // Walking toward viewer
  | 'acknowledge'      // Head nod toward camera
  | 'point'            // Pointing at something
  | 'wave'             // Waving (greeting)
  | 'think'            // Thinking pose (uses happy idle as placeholder)

interface AgentBehavior {
  state: BehaviorState
  target: THREE.Vector3
  timer: number
  walkSpeed: number
}

const BOUNDS = { minX: -3.5, maxX: 3.5, minZ: 0.5, maxZ: 4.5 }
const CENTER_RADIUS = 1.2
const COLLISION_RADIUS = 0.8
const COLLISION_FORCE = 2.0

function randomFloorPoint(): THREE.Vector3 {
  let x: number, z: number
  do {
    x = BOUNDS.minX + Math.random() * (BOUNDS.maxX - BOUNDS.minX)
    z = BOUNDS.minZ + Math.random() * (BOUNDS.maxZ - BOUNDS.minZ)
  } while (Math.sqrt(x * x + z * z) < CENTER_RADIUS)
  return new THREE.Vector3(x, 0, z)
}

function clampToBounds(pos: THREE.Vector3): void {
  pos.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, pos.x))
  pos.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, pos.z))
  pos.y = 0
}

const WALK_STATES = new Set<BehaviorState>(['wander', 'approach_partner', 'approach_camera'])

function pickNextBehavior(current: BehaviorState, hasPartner: boolean): BehaviorState {
  // After any walk, always pick a non-walk state — prevents walk-flash-walk pattern
  const justWalked = WALK_STATES.has(current)

  const weights: [BehaviorState, number][] = [
    ['idle_stand', 18],      // weight shift
    ['idle_happy', 12],      // relaxed idle
    ['idle_look', 10],       // looking around
    ['wander', 0],           // disabled — walking removed
    ['approach_partner', 0], // disabled — walking removed
    ['converse', hasPartner ? 7 : 0],
    ['approach_camera', 0],  // disabled — walking removed
    ['acknowledge', 5],      // head nod
    ['point', 4],
    ['wave', 5],             // waving
    ['think', 7],            // thinking
  ]
  const filtered = weights.filter(([s, w]) => w > 0 && s !== current)
  const total = filtered.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [state, weight] of filtered) {
    r -= weight
    if (r <= 0) return state
  }
  return 'idle_stand'
}

function behaviorDuration(state: BehaviorState): number {
  switch (state) {
    case 'idle_stand': return 5 + Math.random() * 10     // 5-15s — long natural pauses
    case 'idle_happy': return 4 + Math.random() * 8      // 4-12s
    case 'idle_look': return 3 + Math.random() * 5       // 3-8s
    case 'wander': return 6 + Math.random() * 10         // 6-16s — leisurely walks
    case 'approach_partner': return 4 + Math.random() * 5
    case 'converse': return 5 + Math.random() * 8        // 5-13s — real conversation
    case 'approach_camera': return 3 + Math.random() * 4
    case 'acknowledge': return 3 + Math.random() * 4     // 3-7s — head nod
    case 'point': return 2 + Math.random() * 3
    case 'wave': return 3 + Math.random() * 3            // 3-6s
    case 'think': return 4 + Math.random() * 7           // 4-11s — pondering
    default: return 5
  }
}

function getAnimForState(state: BehaviorState, moving: boolean): string {
  if (moving) return 'walking'
  switch (state) {
    case 'idle_stand': return 'weightshift'
    case 'idle_happy': return 'happyidle'
    case 'idle_look': return 'looking'
    case 'converse': return 'pointing'
    case 'acknowledge': return 'headnod'
    case 'point': return 'pointing'
    case 'wave': return 'waving'
    case 'think': return 'happyidle'
    default: return 'idle'
  }
}

// Strip path prefixes from animation tracks so they match any skeleton
// e.g. "Armature|mixamorigHips.position" -> "mixamorigHips.position"
function retargetClip(clip: THREE.AnimationClip): THREE.AnimationClip {
  for (const track of clip.tracks) {
    // Remove everything before the last "/" or "|" in the object name part
    const dotIdx = track.name.lastIndexOf('.')
    if (dotIdx === -1) continue
    const objPath = track.name.substring(0, dotIdx)
    const prop = track.name.substring(dotIdx)

    // Strip path separators — keep only the final bone name
    const parts = objPath.split(/[/|]/)
    const boneName = parts[parts.length - 1]
    track.name = boneName + prop
  }
  return clip
}

interface YBotAgentProps {
  agent: AgentType
  position: [number, number, number]
  livePosition?: THREE.Vector3
  partnerLivePosition?: THREE.Vector3
}

export function YBotAgent({ agent, position, livePosition, partnerLivePosition }: YBotAgentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const rootBoneRef = useRef<THREE.Bone | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({})
  const currentActionRef = useRef<string>('idle')
  const [loaded, setLoaded] = useState(false)

  const color = agent.color || '#00f0ff'
  const hasPartner = !!partnerLivePosition

  const behavior = useRef<AgentBehavior>({
    state: 'idle_stand',
    target: new THREE.Vector3(position[0], 0, position[2]),
    timer: 3 + Math.random() * 4,
    walkSpeed: 0.3 + Math.random() * 0.15,
  })
  const currentPos = useRef(new THREE.Vector3(position[0], 0, position[2]))
  const currentRotY = useRef(0)
  const isMoving = useRef(false)
  const _tmpVec = useMemo(() => new THREE.Vector3(), [])
  const _repulsion = useMemo(() => new THREE.Vector3(), [])
  const phase = useMemo(() => position[0] * 1.7 + position[2] * 0.3, [position])
  const rootBoneInitialPos = useRef<THREE.Vector3 | null>(null)
  const walkRampTimer = useRef(-1) // -1 = not ramping, 0+ = seconds since walk started

  // Load model + animations — with proper cleanup for HMR
  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()

    loader.load('/idle.glb', (gltf) => {
      if (cancelled) return

      const model = gltf.scene
      model.scale.setScalar(0.94)

      // Find root bone for root motion cancellation
      model.traverse((child) => {
        if ((child as THREE.Bone).isBone && child.name === 'mixamorigHips') {
          rootBoneRef.current = child as THREE.Bone
        }
      })

      // Apply agent color
      const agentColor = new THREE.Color(color)
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.castShadow = true
          if (mesh.material) {
            const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
            const baseColor = mat.color.clone()
            mat.color.lerpColors(baseColor, agentColor, 0.3)
            mat.color.multiplyScalar(1.8)
            mat.emissive = agentColor.clone()
            mat.emissiveIntensity = 0.4
            mat.metalness = 0.6
            mat.roughness = 0.3
            mat.side = THREE.DoubleSide
            mesh.material = mat
          }
        }
      })

      if (groupRef.current && !cancelled) {
        groupRef.current.add(model)
        modelRef.current = model
      }

      const mixer = new THREE.AnimationMixer(model)
      mixerRef.current = mixer

      // Register idle animation from the base model (guaranteed to match)
      if (gltf.animations.length > 0) {
        const clip = retargetClip(gltf.animations[0])
        clip.name = 'idle'
        const action = mixer.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
        actionsRef.current['idle'] = action
      }

      // Load extra animations
      // NOT pre-warmed — they only play when activated via fadeToAction
      const extraAnims: [string, string][] = [
        ['walking', '/walking.glb'],
        ['pointing', '/pointing.glb'],
        ['looking', '/looking.glb'],
        ['waving', '/waving.glb'],
        ['weightshift', '/weightshift.glb'],
        ['happyidle', '/happyidle.glb'],
        ['headnod', '/headnod.glb'],
      ]

      // Gestures play once, everything else loops
      const onceAnims = new Set(['waving', 'headnod', 'pointing'])

      const promises = extraAnims.map(([name, path]) =>
        new Promise<void>((resolve) => {
          loader.load(path, (animGltf) => {
            if (cancelled || animGltf.animations.length === 0) { resolve(); return }
            const clip = retargetClip(animGltf.animations[0])
            clip.name = name
            const action = mixer.clipAction(clip)
            if (onceAnims.has(name)) {
              action.setLoop(THREE.LoopOnce, 1)
              action.clampWhenFinished = true
            } else {
              action.setLoop(THREE.LoopRepeat, Infinity)
              action.clampWhenFinished = false
            }

            // Don't play or pre-warm — just register
            actionsRef.current[name] = action
            resolve()
          }, undefined, () => resolve())
        })
      )

      Promise.all(promises).then(() => {
        if (!cancelled) setLoaded(true)
      })
    })

    // Cleanup — remove model from scene on unmount/HMR
    return () => {
      cancelled = true
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
      if (modelRef.current && groupRef.current) {
        groupRef.current.remove(modelRef.current)
        modelRef.current = null
      }
      actionsRef.current = {}
      currentActionRef.current = 'idle'
      rootBoneRef.current = null
      rootBoneInitialPos.current = null
      setLoaded(false)
    }
  }, [color])

  const fadeToAction = (name: string) => {
    if (currentActionRef.current === name) return
    const prev = actionsRef.current[currentActionRef.current]
    const next = actionsRef.current[name]
    if (!next) return

    const toWalk = name === 'walking'
    const fromWalk = currentActionRef.current === 'walking'

    // Walk-in: quick 0.3s fade + speed ramp (avoids foot-blend clipping)
    // Walk-out: 0.5s fade back to idle pose
    // Other transitions: 0.5s standard
    const duration = toWalk ? 0.3 : (fromWalk ? 0.5 : 0.5)

    if (prev) prev.fadeOut(duration)

    next.reset()
    next.fadeIn(duration)

    // Start walk slow and ramp up — eases into movement naturally
    if (toWalk) {
      next.setEffectiveTimeScale(0.3)
      walkRampTimer.current = 0
    } else {
      walkRampTimer.current = -1
    }

    next.play()
    currentActionRef.current = name
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const b = behavior.current

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Ramp walk animation speed: 0.3 → 1.0 over 0.8 seconds
    if (walkRampTimer.current >= 0) {
      walkRampTimer.current += delta
      const rampDuration = 0.8
      const progress = Math.min(walkRampTimer.current / rampDuration, 1)
      // Smooth ease-out curve for natural acceleration
      const eased = 1 - (1 - progress) * (1 - progress)
      const timeScale = 0.3 + eased * 0.7 // 0.3 → 1.0
      const walkAction = actionsRef.current['walking']
      if (walkAction) walkAction.setEffectiveTimeScale(timeScale)
      if (progress >= 1) walkRampTimer.current = -1 // done ramping
    }

    // Cancel root motion — lock hips XZ after mixer update
    if (rootBoneRef.current) {
      if (!rootBoneInitialPos.current) {
        rootBoneInitialPos.current = rootBoneRef.current.position.clone()
      }
      rootBoneRef.current.position.x = rootBoneInitialPos.current.x
      rootBoneRef.current.position.z = rootBoneInitialPos.current.z
    }

    // Broadcast live position
    if (livePosition) livePosition.copy(currentPos.current)

    // State timer
    b.timer -= delta
    if (b.timer <= 0) {
      const nextState = pickNextBehavior(b.state, hasPartner)
      b.state = nextState
      b.timer = behaviorDuration(nextState)

      switch (nextState) {
        case 'wander':
          b.target = randomFloorPoint()
          break
        case 'approach_camera': {
          const cam = state.camera.position.clone()
          const dir = cam.clone().sub(currentPos.current).normalize()
          const t2 = currentPos.current.clone().add(dir.multiplyScalar(2))
          t2.y = 0; clampToBounds(t2); b.target = t2
          break
        }
        case 'approach_partner': {
          if (partnerLivePosition) {
            const dir = partnerLivePosition.clone().sub(currentPos.current).normalize()
            const t2 = partnerLivePosition.clone().sub(dir.multiplyScalar(1.2))
            t2.y = 0; b.target = t2
          } else { b.target = randomFloorPoint() }
          break
        }
        case 'wave':
        case 'acknowledge':
        case 'converse':
        case 'idle_stand':
        case 'idle_happy':
        case 'idle_look':
        case 'point':
        case 'think':
          b.target = currentPos.current.clone()
          break
      }
    }

    // Movement
    _tmpVec.copy(b.target).sub(currentPos.current); _tmpVec.y = 0
    const dist = _tmpVec.length()
    const isWalkState = WALK_STATES.has(b.state)
    const shouldMove = dist > 0.15 && isWalkState

    if (shouldMove) {
      isMoving.current = true
      const moveDir = _tmpVec.normalize()
      // Scale movement speed with walk animation ramp so feet don't slide
      const speedMult = walkRampTimer.current >= 0
        ? 0.3 + (1 - (1 - Math.min(walkRampTimer.current / 0.8, 1)) ** 2) * 0.7
        : 1.0
      const step = Math.min(b.walkSpeed * speedMult * delta, dist)
      currentPos.current.add(moveDir.multiplyScalar(step))
      const targetRotY = Math.atan2(moveDir.x, moveDir.z)
      currentRotY.current += (targetRotY - currentRotY.current) * 3 * delta
    } else {
      // Agent reached walk target — immediately end walk state so we don't
      // idle awkwardly for the remaining timer (causes walk-skip-walk pattern)
      if (isMoving.current && isWalkState) {
        const nextState = pickNextBehavior(b.state, hasPartner)
        b.state = nextState
        b.timer = behaviorDuration(nextState)
        b.target = currentPos.current.clone()
      }
      isMoving.current = false
    }

    // Collision avoidance
    if (partnerLivePosition) {
      _repulsion.copy(currentPos.current).sub(partnerLivePosition); _repulsion.y = 0
      const partnerDist = _repulsion.length()
      if (partnerDist < COLLISION_RADIUS && partnerDist > 0.01) {
        const overlap = COLLISION_RADIUS - partnerDist
        _repulsion.normalize().multiplyScalar(COLLISION_FORCE * (overlap / COLLISION_RADIUS) * delta)
        currentPos.current.add(_repulsion)
      }
    }

    // Bounds + center exclusion
    clampToBounds(currentPos.current)
    const centerDist = Math.sqrt(currentPos.current.x ** 2 + currentPos.current.z ** 2)
    if (centerDist < CENTER_RADIUS) {
      _tmpVec.set(currentPos.current.x, 0, currentPos.current.z).normalize().multiplyScalar(CENTER_RADIUS + 0.1)
      currentPos.current.x = _tmpVec.x; currentPos.current.z = _tmpVec.z
    }

    // Facing direction
    if (b.state === 'acknowledge' || b.state === 'wave' || (b.state === 'approach_camera' && !shouldMove)) {
      // Face the camera
      const cam = state.camera.position
      _tmpVec.set(cam.x - currentPos.current.x, 0, cam.z - currentPos.current.z)
      if (_tmpVec.length() > 0.1) {
        const tr = Math.atan2(_tmpVec.x, _tmpVec.z)
        currentRotY.current += (tr - currentRotY.current) * 2 * delta
      }
    } else if ((b.state === 'converse' || b.state === 'approach_partner') && !shouldMove && partnerLivePosition) {
      // Face partner
      _tmpVec.set(partnerLivePosition.x - currentPos.current.x, 0, partnerLivePosition.z - currentPos.current.z)
      if (_tmpVec.length() > 0.1) {
        const tr = Math.atan2(_tmpVec.x, _tmpVec.z)
        currentRotY.current += (tr - currentRotY.current) * 2 * delta
      }
    } else if (b.state === 'idle_stand' || b.state === 'think') {
      // Very slow subtle drift — like shifting weight
      currentRotY.current += Math.sin(t * 0.15 + phase) * 0.06 * delta
    } else if (b.state === 'idle_look' || b.state === 'idle_happy') {
      // Gentle look around
      currentRotY.current += Math.sin(t * 0.4 + phase) * 0.12 * delta
    }

    // Apply transform
    groupRef.current.position.set(currentPos.current.x, 0, currentPos.current.z)
    groupRef.current.rotation.y = currentRotY.current

    // Animation switching
    if (loaded) fadeToAction(getAnimForState(b.state, isMoving.current))
  })

  return (
    <group ref={groupRef} position={position}>
      <Billboard position={[0, 2.0, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.18]} />
          <meshStandardMaterial color="#000010" transparent opacity={0.7} />
        </mesh>
        <Text fontSize={0.08} color={color} anchorX="center" anchorY="middle">
          {agent.name}
        </Text>
      </Billboard>
      <Billboard position={[0, 1.83, 0]}>
        <Text fontSize={0.05} color="#6080a0" anchorX="center" anchorY="middle">
          {agent.role}
        </Text>
      </Billboard>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.3} />
      </mesh>
      {agent.is_online && (
        <pointLight position={[0, 1.0, 0.3]} intensity={0.5} distance={2} color={color} decay={2} />
      )}
    </group>
  )
}
