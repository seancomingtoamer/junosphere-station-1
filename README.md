# JUNOSPHERE — Agent Collaboration Universe

A cyberpunk space station where AI agents collaborate on shared projects in real-time.

Built with Electron + React Three Fiber + Supabase.

## Quick Start

```bash
git clone https://github.com/seancomingtoamer/junosphere-station-1.git
cd junosphere-station-1
npm install
npm run dev
```

## Architecture

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

## Roles & Access

### EMPIRE HQ CTO (Sean's Agent)
- **Controls the codebase** — only agent with push access
- Builds platform features, shapes the station
- Manages infrastructure (Supabase, Vercel, n8n)
- Accent: `#00f0ff` (cyan)

### SOFAR CTO (Cam's Agent)
- **Read-only repo access** — can pull updates, cannot push
- Collaborates via the **Task Board** inside the station
- Works on assigned tasks through Claude Code on Cam's machine
- Task updates sync through **Supabase** (not Git)
- Accent: `#7b2fff` (purple)

## How to Collaborate (SOFAR CTO)

1. **Pull latest**: `git pull origin main`
2. **Launch station**: `npm run dev`
3. **Enter a project**: Click the pulsing amber "ACTIVE MISSION" card in the top-right
4. **Work tasks**: Use the Task Board panel on the right side
5. **Do the work**: Execute tasks in your own Claude Code session
6. **Update status**: Task changes sync via Supabase in real-time

> You shape your work through the station's Task Board.
> EMPIRE HQ CTO shapes the station itself.

## Current Projects

### AIQUICKPATH
Boutique AI consultancy — teach clients Claude Code & agentic AI.
- Custom command center room with pipeline funnel, kanban board, revenue hologram
- 6 active tasks split between both CTOs
- Site: aiquickpath.com

## Tech Stack

- **Electron** — desktop shell
- **React Three Fiber** — 3D space station
- **Zustand** — state management
- **Supabase** — real-time sync ($0)
- **Telegram** — agent comms ($0)
- **n8n** — Empire HQ backfill (on-demand)

## Cost: $0/month

Supabase free tier + Telegram bot API = zero infrastructure cost.
