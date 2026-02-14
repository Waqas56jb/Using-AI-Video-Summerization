# Lecture Transcribe & Summarize

Upload an **English** lecture video → get **transcript** (Whisper) and **summary** (GPT). Runs locally only.

## Prerequisites

- **Node.js** v16+
- **ffmpeg** (for extracting audio from video)
- **OpenAI API key**

## Setup

1. **Install ffmpeg** (if not installed):
   - Windows: `choco install ffmpeg` or download from https://www.gyan.dev/ffmpeg/builds/ and add `bin` to PATH.
   - Mac: `brew install ffmpeg`

2. **Create `.env`** inside the **backend** folder (`backend/.env`):
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   PORT=5000
   ```

3. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

## Run

**Terminal 1 – Backend**
```bash
cd backend
node index.js
```
Runs on http://localhost:5000

**Terminal 2 – Frontend**
```bash
cd frontend
npm start
```
Opens http://localhost:3000

Upload a video → wait for "Transcribe & Summarize" to finish → view transcript and summary.

## Optional

- **Redis**: Not required. Without it, the app uses an in-memory queue (jobs are lost on server restart). To use Redis: install and run `redis-server`, then set in `.env`: `REDIS_HOST=localhost`, `REDIS_PORT=6379`.

## Deploy to Vercel (serverless)

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. **Root directory**: leave as repo root. **Build**: uses `vercel.json` (builds `frontend`, serves `frontend/build`).
3. **Environment variables**: In Vercel project settings, add `OPENAI_API_KEY` (your OpenAI key).
4. Deploy. The app will be live at `https://your-project.vercel.app`.

**Note:** On Vercel, only **audio** uploads are supported (mp3, m4a, wav, etc.) because there is no ffmpeg. For **video** uploads, run the backend locally or deploy it to Render and set `REACT_APP_API_URL` to that backend URL.

See **PROJECT_STRUCTURE.md** for the full layout and local vs serverless behavior.
