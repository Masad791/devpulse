# Security

Please report vulnerabilities privately via GitHub: **Security → Report a vulnerability** on this repository, rather than opening a public issue. You'll get a reply within a few days.

What's in place:

- DevPulse has no accounts, no database and stores nothing about visitors; preferences live only in the visitor's browser.
- All third-party content is rendered as text, and only `http(s)` links are accepted from upstream sources (`httpUrl` / `sanitize` in `src/lib/pipeline.ts`).
- User input to GitHub search is restricted to known values or sanitized (`issueQuery` in `src/lib/sources/github.ts`, with tests).
- The optional `GITHUB_TOKEN` is read only on the server and needs no permissions beyond public read access.
