import { useStore } from '../store/useStore'

const pulseKeyframes = `
@keyframes missionPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 4px #ff8800, 0 0 8px #ff880060; }
  50% { opacity: 0.3; box-shadow: 0 0 2px #ff880040; }
}
@keyframes missionGlow {
  0%, 100% { border-color: rgba(255,136,0,0.5); }
  50% { border-color: rgba(255,136,0,0.2); }
}
`

export function HUD() {
  const view = useStore((s) => s.view)
  const agentName = useStore((s) => s.agentName)
  const accentColor = useStore((s) => s.accentColor)
  const agents = useStore((s) => s.agents)
  const projects = useStore((s) => s.projects)
  const setView = useStore((s) => s.setView)
  const setActiveProject = useStore((s) => s.setActiveProject)
  const onlineCount = agents.filter((a) => a.is_online).length

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      {/* Inject pulse animation */}
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />

      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '44px 20px 8px 20px',
        background: 'linear-gradient(to bottom, rgba(0,0,8,0.9), transparent)',
      }}>
        {/* Left — Logo + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 18,
            fontWeight: 900,
            color: '#00f0ff',
            letterSpacing: 4,
            textShadow: '0 0 10px #00f0ff40',
          }}>
            JUNOSPHERE
          </span>

          {view === 'project-room' && (
            <button
              onClick={() => {
                setActiveProject(null)
                setView('hub')
              }}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(0,240,255,0.1)',
                border: '1px solid rgba(0,240,255,0.3)',
                color: '#00f0ff',
                padding: '4px 12px',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: 2,
              }}
            >
              BACK TO HUB
            </button>
          )}

          <button
            onClick={() => setView('settings')}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(0,240,255,0.06)',
              border: '1px solid rgba(0,240,255,0.2)',
              color: '#607080',
              padding: '4px 12px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 13,
              cursor: 'pointer',
              letterSpacing: 2,
            }}
          >
            SETTINGS
          </button>
        </div>

        {/* Right — Agent info + Mission alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {/* Agent status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#00ff88',
                boxShadow: '0 0 6px #00ff88',
              }} />
              <span style={{ fontSize: 13, color: '#6080a0', letterSpacing: 1 }}>
                {onlineCount} AGENT{onlineCount !== 1 ? 'S' : ''} ONLINE
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              border: `1px solid ${accentColor}40`,
              background: `${accentColor}10`,
            }}>
              <div style={{
                width: 10,
                height: 10,
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }} />
              <span style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 11,
                color: accentColor,
                letterSpacing: 2,
              }}>
                {agentName}
              </span>
            </div>
          </div>

          {/* Mission alert cards — hub view only */}
          {view === 'hub' && projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProject(p.id)
                setView('project-room')
              }}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 14px',
                background: 'rgba(255,136,0,0.06)',
                border: '1px solid rgba(255,136,0,0.3)',
                cursor: 'pointer',
                animation: 'missionGlow 2s ease-in-out infinite',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,136,0,0.15)'
                e.currentTarget.style.borderColor = 'rgba(255,136,0,0.6)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255,136,0,0.15)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,136,0,0.06)'
                e.currentTarget.style.borderColor = 'rgba(255,136,0,0.3)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Pulsing amber beacon */}
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ff8800',
                animation: 'missionPulse 1.5s ease-in-out infinite',
              }} />

              {/* Mission label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 9,
                  color: '#ff880090',
                  letterSpacing: 3,
                  lineHeight: 1,
                }}>
                  ACTIVE MISSION
                </span>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12,
                  color: '#ff8800',
                  letterSpacing: 2,
                  lineHeight: 1,
                }}>
                  {p.name}
                </span>
              </div>

              {/* Enter arrow */}
              <span style={{
                fontSize: 14,
                color: '#ff880080',
                marginLeft: 4,
              }}>
                &rsaquo;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom bar — status */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '8px 20px',
        background: 'linear-gradient(to top, rgba(0,0,8,0.9), transparent)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: '#304050', letterSpacing: 2, fontFamily: "'Orbitron', sans-serif" }}>
          v0.1.0 // AGENT COLLABORATION UNIVERSE
        </span>
        <span style={{ fontSize: 11, color: '#304050', letterSpacing: 1 }}>
          SUPABASE: <span style={{ color: '#00ff88' }}>CONNECTED</span>
        </span>
      </div>

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 40, left: 0, width: 30, height: 1, background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
      <div style={{ position: 'absolute', top: 40, left: 0, width: 1, height: 30, background: `linear-gradient(to bottom, ${accentColor}, transparent)` }} />
      <div style={{ position: 'absolute', top: 40, right: 0, width: 30, height: 1, background: `linear-gradient(to left, ${accentColor}, transparent)` }} />
      <div style={{ position: 'absolute', top: 40, right: 0, width: 1, height: 30, background: `linear-gradient(to bottom, ${accentColor}, transparent)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 30, height: 1, background: `linear-gradient(to right, ${accentColor}40, transparent)` }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 1, background: `linear-gradient(to left, ${accentColor}40, transparent)` }} />
    </div>
  )
}
