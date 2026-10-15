-- Sage: cloud mailbox schema.
-- Supabase is NOT the system of record. It is a handoff point between
-- mobile/work devices and the home PC's Life Agent. RLS denies anon/
-- authenticated roles entirely; every read/write goes through the
-- service-role client inside an Edge Function that checks a Capture
-- Token or Sync Token first.

create extension if not exists pgcrypto;

create table if not exists inbox_items (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  created_at timestamptz not null default now(),
  client_created_at timestamptz,
  source text not null check (source in ('mobile', 'work', 'home')),
  type text not null check (type in ('memo', 'caffeine', 'mood', 'consult_later', 'philosophy_answer')),
  content text,
  metadata jsonb not null default '{}'::jsonb,
  sync_status text not null default 'new' check (sync_status in ('new', 'synced')),
  synced_at timestamptz,
  schema_version int not null default 1
);

create index if not exists inbox_items_sync_status_idx on inbox_items (sync_status, created_at);
create index if not exists inbox_items_type_created_idx on inbox_items (type, created_at);

alter table inbox_items enable row level security;
-- Intentionally no policies: anon/authenticated have zero access.
-- Edge Functions use the service_role key, which bypasses RLS.

create table if not exists philosophy_questions (
  id text primary key,
  text text not null,
  category text not null,
  active boolean not null default true
);

alter table philosophy_questions enable row level security;
-- Also service_role only, kept consistent with "Edge Function経由を基本とする".

comment on table inbox_items is 'Temporary mailbox for Sage captures. Life Agent on the home PC is the system of record; rows here are deleted from relevance once synced, never treated as permanent storage.';
comment on table philosophy_questions is 'Static question bank for the daily philosophy prompt. Not personal data.';
