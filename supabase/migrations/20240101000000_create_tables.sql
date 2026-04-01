-- Create enum for threat levels
create type threat_level as enum ('critical', 'high', 'medium', 'low');

-- Articles table
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  content text not null,
  threat_level threat_level not null default 'medium',
  category text not null,
  cves text[] default '{}',
  affected_products text[] default '{}',
  threat_actors text[] default '{}',
  industries text[] default '{}',
  attack_vector text not null,
  source text not null,
  source_url text not null,
  published_at timestamptz not null,
  updated_at timestamptz not null default now(),
  discovered_at timestamptz,
  exploited_at timestamptz,
  patched_at timestamptz,
  verified boolean not null default false,
  verified_by text[] default '{}',
  tags text[] default '{}',
  region text not null default 'Global',
  created_at timestamptz not null default now()
);

-- Threat actors table
create table threat_actors (
  id text primary key,
  name text not null unique,
  aliases text[] default '{}',
  origin text not null,
  description text not null,
  target_industries text[] default '{}',
  first_seen text not null,
  last_active text not null,
  ttps text[] default '{}',
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_articles_threat_level on articles (threat_level);
create index idx_articles_category on articles (category);
create index idx_articles_published_at on articles (published_at desc);
create index idx_articles_slug on articles (slug);
create index idx_articles_industries on articles using gin (industries);
create index idx_articles_cves on articles using gin (cves);
create index idx_articles_threat_actors on articles using gin (threat_actors);
create index idx_articles_tags on articles using gin (tags);

-- Full-text search index
alter table articles add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, ''))
  ) stored;
create index idx_articles_fts on articles using gin (fts);

-- Row Level Security
alter table articles enable row level security;
alter table threat_actors enable row level security;

-- Public read access
create policy "Articles are publicly readable"
  on articles for select
  using (true);

create policy "Threat actors are publicly readable"
  on threat_actors for select
  using (true);

-- Enable realtime
alter publication supabase_realtime add table articles;
