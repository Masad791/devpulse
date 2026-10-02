# DevPulse

[![CI](https://github.com/Masad791/devpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/Masad791/devpulse/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Open-source tech news for builders: **AI & ML, system design, DevOps, cloud, web, data, security, languages, mobile, open source and career**, plus what engineers are saying on Bluesky and Mastodon. Built entirely on free public APIs.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Masad791/devpulse)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Masad791/devpulse)

## Features

- **12 topics** from 54 sources: Hacker News, Dev.to, Lobsters, Hugging Face Papers and 50 engineering blogs (Netflix, Meta, Stripe, Cloudflare, ByteByteGo, AWS, Kubernetes, Rust, Go, Krebs, Martin Fowler…).
- **Buzz**: posts from 20 well-known engineers on Bluesky + trending tech posts on Mastodon, updated live (checks every minute, "N new posts" like Twitter).
- **Make it yours**: 9 themes (Dracula, Nord, Midnight, Solarized, Terminal…), any accent color, list or card layout, compact mode, sans or mono font, and a personal **For you** feed — no account, saved in your browser.
- Ranked feed with pagination, a sidebar of trending AI models and rising GitHub repos, and live source health.
- **Free JSON API** with open CORS.

## How it works

```mermaid
flowchart LR
  subgraph Sources [54 source adapters]
    HN[Hacker News] & DT[Dev.to] & LB[Lobsters] & HF[HF Papers] & RSS[50 RSS/Atom blogs]
  end
  Social[Bluesky + Mastodon] --> Buzz[Buzz ranking]
  Sources -->|RawArticle[], 10 at a time| P[Pipeline<br/>categorize → dedupe → rank]
  P --> C[(One cached feed<br/>5 min)]
  Buzz --> CB[(Cached buzz<br/>2 min)]
  C --> ISR[ISR pages] & API[/api/feed/]
  CB --> ISR & BAPI[/api/buzz/]
  ISR & API & BAPI --> CDN[(CDN)] --> Browser
  Browser -->|theme, layout, topics| LS[(localStorage)]
```

- **Adapters** (`src/lib/sources/`) turn each upstream API into one `RawArticle` shape. They run through a concurrency pool (10 in flight) so a deploy doesn't stampede 50 APIs at once; a failing source shows red in the sidebar and never breaks the page.
- **Pipeline** (`src/lib/pipeline.ts`) is pure and unit-tested: keyword topics, URL-normalized dedupe, and ranking = per-source popularity percentile × 24h half-life × same-source penalty.
- **Caching**: the processed feed is one cache entry shared by every page and the API. Pages are ISR (static, rebuilt in the background), API responses carry `s-maxage`, so traffic hits the CDN, not the upstream APIs.
- **"Real-time"**: open pages re-fetch their (cached) server render every 5 minutes; Buzz polls every minute. True push would need the sources to push — free APIs don't.
- **Themes** are CSS variables per `data-theme`; layout/density are Tailwind custom variants (`cards:`, `compact:`). An inline script applies saved prefs before first paint, so static pages stay static with no theme flash.

## Public API

```
GET /api/feed?topic=ai,devops&page=1&limit=30
GET /api/buzz
```

`topic`: comma-separated, any of `ai system-design devops cloud web data security languages mobile open-source career engineering` (omit for all). `page`: 1–10. `limit`: 1–100.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test
```

Optional: copy `.env.example` to `.env.local` and set `GITHUB_TOKEN` for a higher GitHub rate limit.

## Contributing

Adding a feed, an engineer, a keyword or a theme is usually one line — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Stack

Next.js 16 (App Router, ISR) · TypeScript · Tailwind CSS 4 · Vitest · GitHub Actions · Vercel / Netlify. MIT licensed.
