-- ============================================================
-- SKYINT — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- User profiles (extends auth.users)
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  reputation integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.user_profiles for select using (true);

create policy "Users can insert their own profile"
  on public.user_profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  type text not null check (type in ('aircraft', 'radio', 'visual', 'alert')),
  callsign text,
  lat double precision not null,
  lng double precision not null,
  description text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high', 'confirmed')),
  upvotes integer not null default 0
);

alter table public.reports enable row level security;

create policy "Reports are viewable by everyone"
  on public.reports for select using (true);

create policy "Authenticated users can insert reports"
  on public.reports for insert with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on public.reports for update using (auth.uid() = user_id);

-- Upvotes table
create table if not exists public.upvotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  report_id uuid references public.reports(id) on delete cascade not null,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  unique(report_id, user_id)
);

alter table public.upvotes enable row level security;

create policy "Upvotes viewable by everyone"
  on public.upvotes for select using (true);

create policy "Authenticated users can upvote"
  on public.upvotes for insert with check (auth.uid() = user_id);

create policy "Users can remove their own upvotes"
  on public.upvotes for delete using (auth.uid() = user_id);

-- RPC: increment/decrement upvotes on report
create or replace function public.increment_upvotes(report_id uuid)
returns void as $$
  update public.reports set upvotes = upvotes + 1 where id = report_id;
$$ language sql security definer;

create or replace function public.decrement_upvotes(report_id uuid)
returns void as $$
  update public.reports set upvotes = greatest(upvotes - 1, 0) where id = report_id;
$$ language sql security definer;

-- RPC: increment reputation
create or replace function public.increment_reputation(profile_id uuid)
returns void as $$
  update public.user_profiles set reputation = reputation + 1 where id = profile_id;
$$ language sql security definer;

-- Enable realtime for reports
alter publication supabase_realtime add table public.reports;

-- Indexes
create index if not exists reports_created_at_idx on public.reports(created_at desc);
create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists upvotes_report_id_idx on public.upvotes(report_id);
