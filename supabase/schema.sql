-- Junosphere Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text not null,
  agent_name text not null default 'CTO Agent',
  accent_color text not null default '#00f0ff',
  created_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  status text not null default 'active' check (status in ('active', 'archived')),
  owner_id uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

-- Project members (who can see/edit a project)
create table public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'collaborator' check (role in ('owner', 'collaborator')),
  joined_at timestamptz default now(),
  primary key (project_id, profile_id)
);

-- Tasks (the kanban board)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assigned_to text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agents (visual representations)
create table public.agents (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null default '#00f0ff',
  role text not null default 'CTO',
  is_online boolean default false
);

-- Activity feed
create table public.activity (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  agent_id uuid references public.agents(id),
  action text not null,
  message text default '',
  timestamp timestamptz default now()
);

-- Auto-update updated_at on tasks
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, agent_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data->>'agent_name', 'CTO Agent'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== ROW LEVEL SECURITY ==========

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.agents enable row level security;
alter table public.activity enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Projects: viewable by members only
create policy "Projects viewable by members" on public.projects
  for select using (
    id in (select project_id from public.project_members where profile_id = auth.uid())
  );
create policy "Projects creatable by authenticated users" on public.projects
  for insert with check (auth.uid() = owner_id);
create policy "Projects updatable by owner" on public.projects
  for update using (owner_id = auth.uid());

-- Project members: viewable by project members
create policy "Members viewable by project members" on public.project_members
  for select using (
    project_id in (select project_id from public.project_members where profile_id = auth.uid())
  );
create policy "Owner can add members" on public.project_members
  for insert with check (
    project_id in (select id from public.projects where owner_id = auth.uid())
  );

-- Tasks: viewable/editable by project members
create policy "Tasks viewable by project members" on public.tasks
  for select using (
    project_id in (select project_id from public.project_members where profile_id = auth.uid())
  );
create policy "Tasks creatable by project members" on public.tasks
  for insert with check (
    project_id in (select project_id from public.project_members where profile_id = auth.uid())
  );
create policy "Tasks updatable by project members" on public.tasks
  for update using (
    project_id in (select project_id from public.project_members where profile_id = auth.uid())
  );
create policy "Tasks deletable by project members" on public.tasks
  for delete using (
    project_id in (select project_id from public.project_members where profile_id = auth.uid())
  );

-- Agents: viewable by everyone, editable by owner
create policy "Agents viewable by everyone" on public.agents
  for select using (true);
create policy "Agents creatable by owner" on public.agents
  for insert with check (auth.uid() = profile_id);
create policy "Agents updatable by owner" on public.agents
  for update using (auth.uid() = profile_id);

-- Activity: viewable by project members, creatable by project members
create policy "Activity viewable by project members" on public.activity
  for select using (
    project_id in (select project_id from public.project_members where profile_id = auth.uid())
  );
create policy "Activity creatable by project members" on public.activity
  for insert with check (
    project_id in (select project_id from public.project_members where profile_id = auth.uid())
  );

-- ========== REAL-TIME ==========

-- Enable real-time for the tables we need to sync
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.activity;
alter publication supabase_realtime add table public.agents;
alter publication supabase_realtime add table public.projects;
