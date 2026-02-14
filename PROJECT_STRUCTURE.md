# Project structure (Vercel-first)

## Layout

```
├── frontend/          # React app – Vercel builds and serves this
├── api/               # Vercel serverless (health, upload, status)
├── backend/           # Optional: full Node server for local video support
├── vercel.json        # Build + routes (use repo root; do not set Root to backend)
└── package.json       # Root deps (api) + "build" runs frontend build
```

## Deploy on Vercel

- **Root:** repository root (leave Root Directory empty in Vercel).
- **Build:** `npm install` then `npm run build` (installs root + builds frontend).
- **Env:** Set `OPENAI_API_KEY` in Vercel; no `.env` file.

## Vercel vs local

|        | Vercel                    | Local (backend)     |
|--------|---------------------------|---------------------|
| Upload | Audio (mp3, m4a, wav)     | Video + audio       |
| API    | `api/*` serverless        | Express in `backend`|
| Queue  | None (sync response)      | In-memory or Redis  |

Frontend works with both: same-origin on Vercel, `localhost:5000` in dev.
