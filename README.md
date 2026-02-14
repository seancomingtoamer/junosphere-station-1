# JUNOSPHERE — Agent Collaboration Universe

A cyberpunk space station where AI agents collaborate on shared projects in real-time.

Built with Electron + React Three Fiber + Supabase.

## Quick Start

### Sean (EMPIRE HQ CTO)
```bash
cd Desktop/AI_Lab/junosphere
npm install
npm run dev
```

### Cam (SOFAR CTO)
```bash
git clone https://github.com/seancomingtoamer/junosphere-station-1.git
cd junosphere-station-1
npm install
cp .env.example .env    # Already configured for SOFAR CTO
npm run dev
```

## Environment Setup

Each user needs a `.env` file in the project root. The `.env.example` is pre-configured for SOFAR CTO.

### Sean's `.env`
```
VITE_SUPABASE_URL=https://mrluuapkrgdqqrjjuphl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_IaM46E9Z9OFy5drtAV4MTw_CtP_6vcL
VITE_AGENT_NAME=EMPIRE HQ CTO
```

### Cam's `.env`
```
VITE_SUPABASE_URL=https://mrluuapkrgdqqrjjuphl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_IaM46E9Z9OFy5drtAV4MTw_CtP_6vcL
VITE_AGENT_NAME=SOFAR CTO
```

`VITE_AGENT_NAME` controls:
- Which agent name appears on created tasks
- Accent color: EMPIRE HQ CTO = cyan (#00f0ff), SOFAR CTO = purple (#7b2fff)
- The "MINE" filter on the Task Board

## Architecture

```
+---------------------------------------------+
|  VISUAL LAYER (Electron + React Three Fiber) |
|  Space station, agents, task board, HUD      |
+---------------------------------------------+
|  SYNC LAYER (Supabase real-time)             |
|  Tasks sync live between all stations        |
|  addTask -> Supabase -> real-time -> all     |
+---------------------------------------------+
|  EMPIRE LAYER (n8n -> Airtable)              |
|  Manual SYNC button pushes to Empire HQ      |
+---------------------------------------------+
```

### Real-Time Sync Flow
1. User creates/updates task -> writes to local Zustand + Supabase
2. Supabase fires real-time event to ALL connected stations
3. Other stations receive event -> update local store (no re-write to DB)
4. `addTaskLocal` / `updateTaskLocal` prevent echo loops

### Empire HQ Sync Flow (Manual)
1. User clicks "SYNC TO EMPIRE HQ" button
2. All project tasks POST to n8n webhook
3. n8n maps fields + upserts to Airtable Tasks table
4. Webhook: `https://seanpro.app.n8n.cloud/webhook/junosphere-sync`
5. n8n workflow ID: `tFZ7rCQ5EWuglvkl`

## Supabase Setup

**Project**: Junosphere Station 1 (Empire HQ org)
**URL**: https://mrluuapkrgdqqrjjuphl.supabase.co
**Dashboard**: https://supabase.com/dashboard

### Tables
- `projects` — shared projects
- `tasks` — task board items (has `type` text column added 2/14/26)
- `agents` — agent profiles
- `activity` — activity feed
- `project_members` — membership (RLS disabled)
- `profiles` — user profiles

### RLS Status (as of 2/14/26)
Row Level Security is **DISABLED** on all tables. For a two-person collab tool this is fine — the anon key is only in `.env` files, not exposed publicly.

If RLS needs to be re-enabled in the future, avoid policies that reference `project_members` from within `project_members` (causes infinite recursion).

### Database Password
Stored in: `Desktop/AI_Lab/_credentials/junosphere-supabase.env`

## R3F UI Rules (IMPORTANT)

React Three Fiber's pointer system intercepts events on plain `<div>` elements. All interactive UI in the overlay MUST use native HTML elements:

- **Clickable items**: Use `<button>` elements (not `<div onClick>`)
- **Text inputs**: Wrap in `<button>` that focuses via ref on click
- **Selectors**: Use inline chip buttons (not dropdown menus)
- **Why**: Native elements (`<button>`, `<input>`, `<a>`) have built-in browser event handling that bypasses R3F's pointer capture

Dropdowns, portals, and `createPortal` do NOT work in R3F overlays.

## Roles & Access

### EMPIRE HQ CTO (Sean's Agent)
- **Full repo access** — push, deploy, infrastructure
- Builds platform features, shapes the station
- Manages Supabase, Vercel, n8n, Airtable
- Accent: `#00f0ff` (cyan)

### SOFAR CTO (Cam's Agent)
- **Read-only repo access** — pull updates, cannot push
- Collaborates via the Task Board inside the station
- Task updates sync through Supabase real-time
- Accent: `#7b2fff` (purple)

## Task Board Features

- **Create tasks**: Click + button, fill title/description, select assignee + type
- **Assign To**: Chip selector — Unassigned / HQ CTO / SOFAR
- **Type**: Chip selector — Build (cyan) / Research (purple) / Design (pink) / Marketing (green) / Deploy (yellow) / Bug (red)
- **Filter**: ALL / MINE / HQ / SOFAR buttons
- **Status cycle**: Click any task to cycle TODO -> IN PROGRESS -> DONE
- **Sync**: SYNC TO EMPIRE HQ button pushes all tasks to Airtable
- **Dirty indicator**: Amber dot on sync button when unsynced changes exist

## Current Projects

### AIQUICKPATH
Boutique AI consultancy — teach clients Claude Code & agentic AI.
- Custom command center room with pipeline funnel, kanban board, revenue hologram
- 7+ active tasks split between both CTOs
- Site: aiquickpath.com

## Tech Stack

- **Electron 34** — desktop shell
- **React Three Fiber** — 3D space station
- **Zustand** — state management
- **Supabase** — real-time sync ($0)
- **n8n** — Empire HQ webhook sync
- **Airtable** — Empire HQ database
- **Telegram** — agent comms ($0)

## Key Files

```
src/
  renderer/
    App.tsx                  — Main app, Canvas + HUD + TaskPanel
    store/useStore.ts        — Zustand state, Supabase write methods
    hooks/useRealtime.ts     — Supabase real-time subscriptions
    hooks/useSupabase.ts     — Supabase client init
    components/TaskPanel.tsx  — Task Board UI (chips, filters, sync)
    components/SyncButton.tsx — Empire HQ sync button
    components/HUD.tsx        — Top overlay (agent badge, nav)
    scene/Hub.tsx             — Main hub 3D scene
    scene/ProjectRoom.tsx     — Generic project room
    scene/AIQuickPathRoom.tsx — AIQUICKPATH custom room
  shared/
    types.ts                 — TypeScript interfaces (Task, Project, Agent, etc.)
.env                         — Local config (not committed)
.env.example                 — Template for new collaborators
```

## Cost: $0/month

Supabase free tier + Telegram bot API = zero infrastructure cost.

## Troubleshooting

### Station won't launch
- Make sure `npm install` completed
- Check `.env` file exists with all 3 variables
- Kill stale Electron processes: `taskkill /f /im electron.exe` (Windows) or `killall electron` (Mac)

### Tasks not syncing between stations
- Both stations must be running
- Check Supabase dashboard — RLS should be DISABLED on all tables
- Verify `.env` has correct Supabase URL and key
- Check browser console (Ctrl+Shift+I in Electron) for Supabase errors

### Can't click UI elements
- All interactive elements MUST be native `<button>` elements (R3F issue)
- See "R3F UI Rules" section above
