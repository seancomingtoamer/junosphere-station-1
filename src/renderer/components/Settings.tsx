import { useStore } from '../store/useStore'

export function Settings() {
  const setView = useStore((s) => s.setView)
  const agentName = useStore((s) => s.agentName)
  const accentColor = useStore((s) => s.accentColor)
  const agents = useStore((s) => s.agents)
  const projects = useStore((s) => s.projects)

  const onlineCount = agents.filter((a) => a.is_online).length

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0,0,8,0.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      <div style={{
        width: 440,
        background: 'rgba(0,0,18,0.95)',
        border: '1px solid rgba(0,240,255,0.2)',
        padding: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,240,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 13,
            color: '#00f0ff',
            letterSpacing: 3,
          }}>
            SETTINGS
          </span>
          <button
            onClick={() => setView('hub')}
            style={{
              background: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.3)',
              color: '#ff4444',
              padding: '2px 10px',
              fontSize: 16,
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Agent Identity */}
          <div>
            <div style={{
              fontSize: 10,
              color: '#506070',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: 2,
              marginBottom: 10,
            }}>
              AGENT IDENTITY
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: `${accentColor}10`,
              border: `1px solid ${accentColor}30`,
            }}>
              <div style={{
                width: 14,
                height: 14,
                background: accentColor,
                boxShadow: `0 0 10px ${accentColor}`,
              }} />
              <div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 14,
                  color: accentColor,
                  letterSpacing: 2,
                }}>
                  {agentName}
                </div>
              </div>
            </div>
          </div>

          {/* Station Status */}
          <div>
            <div style={{
              fontSize: 10,
              color: '#506070',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: 2,
              marginBottom: 10,
            }}>
              STATION STATUS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: 'rgba(0,240,255,0.03)',
                border: '1px solid rgba(0,240,255,0.08)',
              }}>
                <span style={{ fontSize: 13, color: '#607080' }}>Agents Online</span>
                <span style={{ fontSize: 13, color: '#00ff88', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1 }}>
                  {onlineCount}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: 'rgba(0,240,255,0.03)',
                border: '1px solid rgba(0,240,255,0.08)',
              }}>
                <span style={{ fontSize: 13, color: '#607080' }}>Projects</span>
                <span style={{ fontSize: 13, color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1 }}>
                  {projects.length}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: 'rgba(0,240,255,0.03)',
                border: '1px solid rgba(0,240,255,0.08)',
              }}>
                <span style={{ fontSize: 13, color: '#607080' }}>Supabase</span>
                <span style={{ fontSize: 13, color: '#00ff88', fontFamily: "'Orbitron', sans-serif", letterSpacing: 1 }}>
                  CONNECTED
                </span>
              </div>
            </div>
          </div>

          {/* Crew Roster */}
          <div>
            <div style={{
              fontSize: 10,
              color: '#506070',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: 2,
              marginBottom: 10,
            }}>
              CREW ROSTER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    background: `${agent.color}08`,
                    border: `1px solid ${agent.color}20`,
                  }}
                >
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: agent.is_online ? '#00ff88' : '#404050',
                    boxShadow: agent.is_online ? '0 0 6px #00ff88' : 'none',
                  }} />
                  <div style={{
                    width: 10,
                    height: 10,
                    background: agent.color,
                  }} />
                  <span style={{ fontSize: 13, color: agent.color, fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, flex: 1 }}>
                    {agent.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#506070' }}>
                    {agent.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
