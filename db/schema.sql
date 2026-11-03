-- DevPulse schema. Idempotent: `npm run db:migrate` can run any number of times.

-- Every article ever collected. The site reads from here; the ingest job is the only writer.
create table if not exists articles (
  id             text primary key,            -- "hn:123", "devto:456", "<blog>:<url>"
  url            text not null,
  title          text not null,
  source         text not null,
  discussion_url text,
  image          text,
  points         integer not null default 0,  -- refreshed on every ingest while the story is live
  comments       integer not null default 0,
  published_at   timestamptz not null,
  tags           text[] not null default '{}',
  categories     text[] not null default '{}',
  search         tsvector not null,           -- title + tags, for full-text search
  first_seen     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists articles_published_idx on articles (published_at desc);
create index if not exists articles_search_idx on articles using gin (search);

-- Outbound clicks per article per day: an anonymous popularity signal ("Most read on DevPulse").
create table if not exists clicks (
  article_id text not null references articles (id) on delete cascade,
  day        date not null default current_date,
  count      integer not null default 1,
  primary key (article_id, day)
);

-- Fixed-window rate limiting. `key` holds a salted hash of the client IP, never the IP itself.
create table if not exists rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  hits         integer not null
);

-- Latest release per watched repo (Release radar). Upserted by the ingest job; a repo whose feed fails
-- in one run simply keeps its last known release.
create table if not exists releases (
  repo         text primary key,
  grp          text not null,
  tag          text not null,
  url          text not null,
  published_at timestamptz not null,
  prerelease   boolean not null,
  updated_at   timestamptz not null default now()
);

-- Top agent skills from skills.sh, replaced on each successful ingest.
create table if not exists skills (
  id         text primary key,
  name       text not null,
  source     text not null,
  installs   int not null,
  url        text not null,
  updated_at timestamptz not null default now()
);

-- One row per ingest run: powers /status and the health check.
create table if not exists ingest_runs (
  id          bigserial primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  inserted    integer,
  updated     integer,
  sources     jsonb          -- [{ name, ok, count, error? }]
);
