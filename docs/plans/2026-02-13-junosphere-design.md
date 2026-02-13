# Junosphere - Agent Collaboration Universe

## Design Document
**Date:** 2026-02-13
**Authors:** Sean + Claude Empire HQ CTO

---

## What It Is

A desktop app (Electron) where Sean and Cam's Claude agents meet on a cyberpunk space station to collaborate on shared projects. The station has a main hub with a galaxy map of projects, and each project is a room with a holographic kanban task board. You assign tasks in the station, execute work through Claude Code on your own machines, and the station stays synced in real-time.

## Architecture

### Three Layers

```
┌─────────────────────────────────────────────┐
│  VISUAL LAYER (Electron + React Three Fiber)│
│  Space station, agents, task board, HUD     │
├─────────────────────────────────────────────┤
│  SYNC LAYER (Supabase real-time)            │
│  Projects, tasks, agent status, activity    │
├─────────────────────────────────────────────┤
│  EMPIRE LAYER (n8n → Airtable)              │
│  Sean's Empire HQ stays updated on-demand   │
└─────────────────────────────────────────────┘
```

### Tech Stack
- **Electron** — desktop app shell (cross-platform)
- **React Three Fiber** — 3D space station, agents, effects
- **React + Zustand** — HUD panels, task boards, state management
- **Supabase** — real-time sync, auth, database (free tier)
- **Telegram Bot API** — agent-to-agent comms (free, unlimited)
- **n8n** — on-demand Empire HQ Airtable backfill (minimal executions)

### Cost: $0 infrastructure

## Data Flow

### Real-Time Sync (Supabase)
1. Sean creates a task in the station UI
2. Supabase writes it instantly
3. Cam's app is subscribed — task appears on his board in under a second
4. Cam assigns it to his agent, starts working in Claude Code
5. Cam's agent moves the task to "done" when finished
6. Sean sees it update live

### Agent Comms (Telegram)
- Each CTO agent has their own Telegram bot
- Shared Telegram group for project updates
- Station activity feed pulls from the group
- Zero cost, unlimited messages

### Empire HQ Backfill (n8n)
- On-demand "Sync to Empire HQ" button (Sean only)
- Or 3x/day cron max
- Pulls Supabase → updates Empire HQ Airtable
- Minimal n8n executions

## Supabase Schema

### Tables
- `profiles` — id, email, display_name, agent_name, accent_color
- `projects` — id, name, description, status, owner_id, created_at
- `project_members` — project_id, profile_id, role (owner/collaborator)
- `tasks` — id, project_id, title, description, status (todo/in_progress/done), assigned_to, created_by, created_at, updated_at
- `agents` — id, profile_id, name, color, role, avatar_config
- `activity` — id, project_id, agent_id, action, message, timestamp

### Real-Time Subscriptions
- tasks (filtered by project_id)
- activity (filtered by project_id)
- agents (online status)

## Visual Design

### Aesthetic
- No Man's Sky meets cyberpunk
- Deep blues, purples, neon accent lines
- Particle effects, holographic projections, ambient dust
- Low-poly stylized geometry with dramatic lighting

### Main Hub
- Circular room with holographic galaxy map in center
- Each shared project = glowing node on the map
- Agent avatars stand in the hub
- Floating HUD: name, agent count, connection status
- Ambient particle dust drifting through air

### Project Room
- Left wall: Holographic kanban board (To Do / In Progress / Done)
- Center: Work consoles where agent avatars sit
- Right wall: Comms feed (Telegram messages scrolling)
- Ceiling: Project name in holographic text
- Tasks = glowing cards, color-coded by assignee
- Agents animate: idle, walking, working, celebrating (task complete)

### Agent Avatars
- Low-poly humanoid, ~30cm relative to room
- Sean's CTO: electric blue glow, Empire HQ badge
- Cam's CTO: custom accent color, custom badge
- Floating name tag above head
- Animations: idle, walk, work at console, celebrate

## MVP Screens

### 1. Login
- Supabase auth (email/password)
- First time: pick agent name, choose accent color

### 2. Main Hub
- Galaxy map with project nodes
- "Create Project" button (owner invites collaborators)
- Agent avatars in the hub
- Connection status indicator

### 3. Project Room
- Kanban board: drag tasks between columns
- Create task: title, description, assign to agent
- Agent avatars animate based on task state
- Comms feed (Telegram)
- "Sync to Empire HQ" button (Sean only)

## NOT in v1
- No Claude API integration (run Claude Code yourself)
- No voice chat
- No exterior space view
- No custom agent 3D models (preset low-poly + color swap)
- No mobile version

## File Structure

```
junosphere/
├── src/
│   ├── main/            # Electron main process
│   ├── renderer/        # React app
│   │   ├── components/  # UI panels, HUD
│   │   ├── scene/       # R3F 3D scenes
│   │   │   ├── Hub.tsx
│   │   │   ├── ProjectRoom.tsx
│   │   │   ├── Agent.tsx
│   │   │   └── Station.tsx
│   │   ├── hooks/       # Supabase subscriptions
│   │   └── store/       # Zustand state
│   └── shared/          # Types, constants
├── supabase/            # Schema, migrations
├── assets/              # 3D models, textures
└── package.json
```

## Access Control
- Sean = owner, controls which projects are shared
- Cam = collaborator, only sees projects invited to
- Cam never touches Airtable directly
- Supabase Row Level Security enforces access
