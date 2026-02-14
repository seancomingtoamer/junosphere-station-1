import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent as AgentType } from '../../shared/types'

// --- Behavior types ---
type BehaviorState = 'idle' | 'wander' | 'approach_camera' | 'approach_partner' | 'point' | 'look_at_camera'

interface AgentBehavior {
  state: BehaviorState
  target: THREE.Vector3
  timer: number        // seconds until next state change
  pointArm: 'left' | 'right'
  walkSpeed: number
}

// Station floor bounds — agents stay within this area
const BOUNDS = { minX: -3.5, maxX: 3.5, minZ: 0.5, maxZ: 4.5 }
// Center exclusion zone (galaxy map hologram)
const CENTER_RADIUS = 1.2
// Collision avoidance — minimum distance between agents
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

function pickNextBehavior(current: BehaviorState): BehaviorState {
  const weights: [BehaviorState, number][] = [
    ['idle', 30],
    ['wander', 35],
    ['approach_camera', 8],
    ['approach_partner', 12],
    ['look_at_camera', 10],
    ['point', 5],
  ]
  const filtered = current === 'idle' ? weights : weights.filter(([s]) => s !== current)
  const total = filtered.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [state, weight] of filtered) {
    r -= weight
    if (r <= 0) return state
  }
  return 'idle'
}

function behaviorDuration(state: BehaviorState): number {
  switch (state) {
    case 'idle': return 3 + Math.random() * 5
    case 'wander': return 4 + Math.random() * 6
    case 'approach_camera': return 3 + Math.random() * 3
    case 'approach_partner': return 3 + Math.random() * 4
    case 'look_at_camera': return 2 + Math.random() * 3
    case 'point': return 2 + Math.random() * 2
    default: return 4
  }
}

interface AgentProps {
  agent: AgentType
  position: [number, number, number]
  livePosition?: THREE.Vector3         // mutable — this agent writes its position here every frame
  partnerLivePosition?: THREE.Vector3  // mutable — read partner's real-time position from here
  isWorking?: boolean
}

export function Agent({ agent, position, livePosition, partnerLivePosition, isWorking = false }: AgentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const leftLegRef = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)

  const color = agent.color || '#00f0ff'

  const behavior = useRef<AgentBehavior>({
    state: 'idle',
    target: new THREE.Vector3(position[0], 0, position[2]),
    timer: 2 + Math.random() * 3,
    pointArm: Math.random() > 0.5 ? 'left' : 'right',
    walkSpeed: 0.4 + Math.random() * 0.2,
  })

  const currentPos = useRef(new THREE.Vector3(position[0], 0, position[2]))
  const currentRotY = useRef(0)
  const isMoving = useRef(false)

  // Reusable temp vectors to avoid GC pressure
  const _tmpVec = useMemo(() => new THREE.Vector3(), [])
  const _repulsion = useMemo(() => new THREE.Vector3(), [])

  const phase = useMemo(() => position[0] * 1.7 + position[2] * 0.3, [position])

  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return
    const t = state.clock.elapsedTime
    const b = behavior.current

    // --- Broadcast live position so partner can read it ---
    if (livePosition) {
      livePosition.copy(currentPos.current)
    }

    // --- State timer ---
    b.timer -= delta
    if (b.timer <= 0) {
      const nextState = pickNextBehavior(b.state)
      b.state = nextState
      b.timer = behaviorDuration(nextState)
      b.pointArm = Math.random() > 0.5 ? 'left' : 'right'

      switch (nextState) {
        case 'wander':
          b.target = randomFloorPoint()
          break
        case 'approach_camera': {
          const cam = state.camera.position.clone()
          const dir = cam.clone().sub(currentPos.current).normalize()
          const t2 = currentPos.current.clone().add(dir.multiplyScalar(2))
          t2.y = 0
          clampToBounds(t2)
          b.target = t2
          break
        }
        case 'approach_partner': {
          if (partnerLivePosition) {
            // Use partner's LIVE position, stop 1 unit away
            const dir = partnerLivePosition.clone().sub(currentPos.current).normalize()
            const t2 = partnerLivePosition.clone().sub(dir.multiplyScalar(1.0))
            t2.y = 0
            b.target = t2
          } else {
            b.target = randomFloorPoint()
          }
          break
        }
        case 'idle':
        case 'look_at_camera':
        case 'point':
          b.target = currentPos.current.clone()
          break
      }
    }

    // --- Movement ---
    _tmpVec.copy(b.target).sub(currentPos.current)
    _tmpVec.y = 0
    const dist = _tmpVec.length()
    const shouldMove = dist > 0.15 && (b.state === 'wander' || b.state === 'approach_camera' || b.state === 'approach_partner')

    if (shouldMove) {
      isMoving.current = true
      const moveDir = _tmpVec.normalize()
      const step = Math.min(b.walkSpeed * delta, dist)
      currentPos.current.add(moveDir.multiplyScalar(step))

      const targetRotY = Math.atan2(moveDir.x, moveDir.z)
      currentRotY.current += (targetRotY - currentRotY.current) * 4 * delta
    } else {
      isMoving.current = false
    }

    // --- Collision avoidance — push away from partner ---
    if (partnerLivePosition) {
      _repulsion.copy(currentPos.current).sub(partnerLivePosition)
      _repulsion.y = 0
      const partnerDist = _repulsion.length()

      if (partnerDist < COLLISION_RADIUS && partnerDist > 0.01) {
        // Repulsion strength increases as agents get closer
        const overlap = COLLISION_RADIUS - partnerDist
        const pushStrength = COLLISION_FORCE * (overlap / COLLISION_RADIUS)
        _repulsion.normalize().multiplyScalar(pushStrength * delta)
        currentPos.current.add(_repulsion)
      }
    }

    // --- Keep agent inside bounds and away from center hologram ---
    clampToBounds(currentPos.current)
    const centerDist = Math.sqrt(currentPos.current.x * currentPos.current.x + currentPos.current.z * currentPos.current.z)
    if (centerDist < CENTER_RADIUS) {
      // Push outward from center
      _tmpVec.set(currentPos.current.x, 0, currentPos.current.z).normalize().multiplyScalar(CENTER_RADIUS + 0.1)
      currentPos.current.x = _tmpVec.x
      currentPos.current.z = _tmpVec.z
    }

    // --- Facing direction for non-movement states ---
    if (b.state === 'look_at_camera' || (b.state === 'approach_camera' && !shouldMove)) {
      const cam = state.camera.position
      _tmpVec.set(cam.x - currentPos.current.x, 0, cam.z - currentPos.current.z)
      if (_tmpVec.length() > 0.1) {
        const targetRotY = Math.atan2(_tmpVec.x, _tmpVec.z)
        currentRotY.current += (targetRotY - currentRotY.current) * 3 * delta
      }
    } else if (b.state === 'approach_partner' && !shouldMove && partnerLivePosition) {
      _tmpVec.set(
        partnerLivePosition.x - currentPos.current.x,
        0,
        partnerLivePosition.z - currentPos.current.z
      )
      if (_tmpVec.length() > 0.1) {
        const targetRotY = Math.atan2(_tmpVec.x, _tmpVec.z)
        currentRotY.current += (targetRotY - currentRotY.current) * 3 * delta
      }
    } else if (b.state === 'idle') {
      currentRotY.current += Math.sin(t * 0.3 + phase) * 0.15 * delta
    }

    // --- Apply position & rotation ---
    groupRef.current.position.set(currentPos.current.x, 0, currentPos.current.z)
    groupRef.current.rotation.y = currentRotY.current

    // --- Walking animation ---
    const walkCycle = t * 8
    const walkAmount = isMoving.current ? 1 : 0

    if (bodyRef.current) {
      const breathe = Math.sin(t * 2 + phase) * 0.02
      const walkBob = isMoving.current ? Math.abs(Math.sin(walkCycle)) * 0.04 : 0
      bodyRef.current.position.y = breathe + walkBob
      bodyRef.current.rotation.x = isMoving.current ? 0.08 : 0
    }

    if (leftLegRef.current && rightLegRef.current) {
      const legSwing = Math.sin(walkCycle) * 0.35 * walkAmount
      leftLegRef.current.rotation.x = legSwing
      rightLegRef.current.rotation.x = -legSwing
    }

    if (leftArmRef.current && rightArmRef.current) {
      const armSwing = Math.sin(walkCycle) * 0.3 * walkAmount

      if (b.state === 'point' && !isMoving.current) {
        const pointProgress = Math.min((behaviorDuration('point') - b.timer) * 2, 1)
        if (b.pointArm === 'right') {
          rightArmRef.current.rotation.x = -1.2 * pointProgress
          rightArmRef.current.rotation.z = -0.3 * pointProgress
          leftArmRef.current.rotation.x = 0
          leftArmRef.current.rotation.z = 0
        } else {
          leftArmRef.current.rotation.x = -1.2 * pointProgress
          leftArmRef.current.rotation.z = 0.3 * pointProgress
          rightArmRef.current.rotation.x = 0
          rightArmRef.current.rotation.z = 0
        }
      } else {
        leftArmRef.current.rotation.x = -armSwing
        leftArmRef.current.rotation.z = 0
        rightArmRef.current.rotation.x = armSwing
        rightArmRef.current.rotation.z = 0
      }
    }

    if (headRef.current) {
      if (b.state === 'look_at_camera' || (b.state === 'approach_camera' && !isMoving.current)) {
        headRef.current.rotation.x = -0.25 + Math.sin(t * 1.5) * 0.05
        headRef.current.rotation.y = 0
      } else if (b.state === 'point') {
        headRef.current.rotation.x = -0.15
        headRef.current.rotation.y = b.pointArm === 'right' ? 0.3 : -0.3
      } else {
        headRef.current.rotation.x = Math.sin(t * 0.7 + phase) * 0.06
        headRef.current.rotation.y = Math.sin(t * 0.4 + phase * 2) * 0.08
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Body — all limbs inside this group for breathing/bob */}
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

        {/* Head group — separate ref for look direction */}
        <group ref={headRef} position={[0, 1.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.25, 0.2]} />
            <meshStandardMaterial
              color="#1a1a2e"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Visor / eyes */}
          <mesh position={[0, 0.02, 0.101]}>
            <boxGeometry args={[0.18, 0.06, 0.001]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={3}
            />
          </mesh>
        </group>

        {/* Left arm — pivot from shoulder */}
        <group position={[-0.25, 0.8, 0]}>
          <mesh ref={leftArmRef} position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.12]} />
            <meshStandardMaterial color="#151528" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* Right arm — pivot from shoulder */}
        <group position={[0.25, 0.8, 0]}>
          <mesh ref={rightArmRef} position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.12]} />
            <meshStandardMaterial color="#151528" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* Left leg — pivot from hip */}
        <group position={[-0.1, 0.4, 0]}>
          <mesh ref={leftLegRef} position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.12, 0.4, 0.14]} />
            <meshStandardMaterial color="#101020" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* Right leg — pivot from hip */}
        <group position={[0.1, 0.4, 0]}>
          <mesh ref={rightLegRef} position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.12, 0.4, 0.14]} />
            <meshStandardMaterial color="#101020" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

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
