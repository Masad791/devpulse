# DevPulse

Tech news for builders: **AI models, system design, DevOps and software engineering**, pulled from free public APIs, ranked, and served as static pages from a CDN.

Sources: Hacker News · Dev.to · Lobsters · ByteByteGo · AWS Architecture · Cloudflare · Martin Fowler · Pragmatic Engineer · GitHub Engineering · InfoQ · Hugging Face · OpenAI · Kubernetes. Sidebar: trending Hugging Face models and rising GitHub repos.

## How it works

```mermaid
flowchart LR
  subgraph Sources [Source adapters]
    HN[Hacker News] & DT[Dev.to] & LB[Lobsters] & RSS[RSS/Atom blogs]
  end
  Sources -->|RawArticle[]| P[Pipeline<br/>categorize → dedupe → rank]
  P --> ISR[Static pages<br/>rebuilt every 15 min]
  P --> API[/api/feed JSON/]
  ISR --> CDN[(Vercel CDN)]
  API --> CDN
  CDN --> Users
```

- **Adapters** (`src/lib/sources/`) turn each upstream API into one `RawArticle` shape. All fetched in parallel with `Promise.allSettled`, so a dead source is reported in the sidebar, never fatal.
- **Pipeline** (`src/lib/pipeline.ts`) is pure and unit-tested: keyword + hint categorization, URL-normalized dedupe, and ranking = per-source popularity percentile × 24h half-life decay × same-source penalty.
- **Caching**: pages use ISR (`revalidate = 900`), so upstream APIs are hit at most every 15 min regardless of traffic. The API sets `s-maxage` so the CDN absorbs repeat calls.

## Public API

```
GET /api/feed?category=ai&limit=20
```

`category`: `ai` | `system-design` | `devops` | `engineering` (optional). `limit`: 1–200, default 50. CORS is open.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # pipeline unit tests
```

Optional: copy `.env.example` to `.env.local` and set `GITHUB_TOKEN` for a higher GitHub rate limit.

## Add a source

Write an adapter in `src/lib/sources/` that returns `RawArticle[]` (or, for an RSS/Atom feed, one line: `rssSource(name, url, [category])`) and add it to `SOURCES` in `src/lib/sources/index.ts`.

## Stack

Next.js 16 (App Router, ISR) · TypeScript · Tailwind CSS 4 · Vitest · GitHub Actions CI · Vercel.
