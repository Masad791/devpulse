# Contributing to DevPulse

Thanks for helping! Most contributions are a one- or two-line change.

## Setup

```bash
npm install
npm run dev          # http://localhost:3000
```

Before opening a PR, run what CI runs:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Common contributions

**Add a blog / RSS feed** — one line in `FEEDS` in [`src/lib/sources/index.ts`](src/lib/sources/index.ts):

```ts
["Name", "https://example.com/feed.xml", ["system-design"]],
```

The third value is the list of topics every post from that feed belongs to (optional; keyword rules still apply). Please check the feed is active (posts in the last few weeks) and under ~1 MB.

**Add an engineer to Buzz** — add their Bluesky handle to `BLUESKY_HANDLES` in [`src/lib/sources/social.ts`](src/lib/sources/social.ts). Keep it to people who mostly post about tech.

**Improve topic matching** — keywords live in `KEYWORDS` in [`src/lib/pipeline.ts`](src/lib/pipeline.ts). Add a test case in `pipeline.test.ts` for anything subtle.

**Add a repo category or issue label** — `REPO_CATEGORIES` / `ISSUE_LABELS` in [`src/lib/sources/github.ts`](src/lib/sources/github.ts). A category is one or more GitHub search queries (e.g. `"topic:rag"`).

**Add a theme** — add a `[data-theme="your-theme"]` block with the six color variables to [`src/app/globals.css`](src/app/globals.css), and an entry in `THEMES` in [`src/lib/prefs.ts`](src/lib/prefs.ts) with matching swatch colors. Check text contrast (muted text on the background should be at least 4.5:1).

**Add a non-RSS source** — write an adapter in `src/lib/sources/` that returns `RawArticle[]` (see `hackernews.ts` for a ~30-line example) and add it to `SOURCES`.

## Guidelines

- Free APIs only, no keys required for the default setup.
- Keep PRs focused; one feature or fix per PR.
- No new dependencies without a good reason — explain it in the PR.
