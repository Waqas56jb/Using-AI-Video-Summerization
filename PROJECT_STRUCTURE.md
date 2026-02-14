# Project structure & deploy

## Repo layout

```
video_sumarizer/
├── frontend/                 # React app (Vercel builds this)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.js    # API_BASE = REACT_APP_API_URL || localhost:5000
│   │   └── App.js
│   └── package.json
├── backend/                  # Node/Express (local or Render)
│   ├── config/constants.js   # PORT, REDIS, loads backend/.env
│   ├── queue/                # BullMQ or in-memory queue
│   ├── routes/summarize.js   # POST /api/upload, GET /api/status/:jobId
│   ├── services/             # transcribe (Whisper), summarize (GPT), video-file (ffmpeg)
│   ├── workers/video-processor.js
│   ├── index.js              # Loads backend/.env, starts Express
│   └── .env                  # OPENAI_API_KEY, PORT, etc.
├── api/                      # Vercel serverless (no ffmpeg, no queue)
│   ├── index.js              # GET /api → health
│   ├── upload.js             # POST /api/upload → audio only, sync transcribe+summarize
│   └── status/[jobId].js     # GET /api/status/:id → 404 on Vercel (no jobs)
├── vercel.json               # Build frontend, route /api/* to serverless
├── package.json              # Root scripts + deps for api (openai, etc.)
└── .env.example
```

## Modes

| Mode        | Where it runs        | Video support | How |
|------------|----------------------|---------------|-----|
| **Local**  | backend (Node)       | Yes           | ffmpeg extracts audio → Whisper → GPT; queue for jobs |
| **Vercel** | api/* serverless     | No (audio only) | Upload audio → Whisper → GPT in one request; no queue |

- **Frontend**: Same app. Uses `REACT_APP_API_URL` (empty on Vercel = same origin; local = `http://localhost:5000`).
- **Backend (local)**: `cd backend && node index.js`. Needs ffmpeg, `.env` in `backend/`.
- **Vercel**: Deploy from root. Build = frontend. API = serverless in `api/`. Set `OPENAI_API_KEY` in Vercel env. No Redis/ffmpeg.

## Env

- **Local backend**: `backend/.env` — `OPENAI_API_KEY`, `PORT`, optional `REDIS_*`.
- **Vercel**: Project Settings → Environment Variables — `OPENAI_API_KEY`. Optional: `REACT_APP_API_URL` (usually leave blank so UI calls same origin).
- **Frontend**: `REACT_APP_API_URL` — only if backend is on another host (e.g. Render).

## API contract (same for local and Vercel)

- `GET /` or `GET /api` → `{ success, message, endpoints }`
- `POST /api/upload` (multipart, field `video`)  
  - **Local**: returns `{ jobId, status: 'processing' }`; poll `GET /api/status/:jobId`.  
  - **Vercel (audio only)**: returns `{ status: 'completed', transcript, summary }` in one response (no jobId).
- `GET /api/status/:jobId` → **Local**: job state + result. **Vercel**: 404 (no jobs).

Frontend supports both: if upload response has `transcript` and `summary`, it shows them; otherwise it polls status.
