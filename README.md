# Lecture Transcribe & Summarize

Upload **video or audio** → get **transcript** (Whisper) and **summary** (GPT).  
Deploy **backend** and **frontend** as two separate projects on Vercel.

---

## Deploy on Vercel (two projects)

### Backend

1. **New Project** on [Vercel](https://vercel.com) → Import your Git repo.
2. **Root Directory:** set to **`backend`**.
3. **Environment Variables:** add the same as in your `backend/.env`:
   - `OPENAI_API_KEY` = your OpenAI API key
4. Deploy. Copy the backend URL (e.g. `https://your-backend.vercel.app`).

### Frontend

1. **New Project** on Vercel → Import the same repo.
2. **Root Directory:** set to **`frontend`**.
3. **Environment Variables:** add:
   - `REACT_APP_API_URL` = **your backend Vercel URL** (e.g. `https://your-backend.vercel.app`)
4. Deploy. The frontend will call your deployed backend.

See **VERCEL_DEPLOY.md** for the full step-by-step.

**Backend on Vercel:** accepts **audio** (mp3, m4a, wav). For **video**, run the backend locally.

---

## Run locally

1. **Backend:** create `backend/.env` with `OPENAI_API_KEY` and `PORT=5000`.  
   Run: `cd backend && npm install && node index.js`
2. **Frontend:** `cd frontend && npm install && npm start`  
   Uses `http://localhost:5000` in development.

For **video** uploads you need ffmpeg installed and the backend running locally.
