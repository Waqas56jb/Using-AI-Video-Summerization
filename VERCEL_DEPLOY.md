# Deploy on Vercel – two projects (backend + frontend)

Deploy **backend** and **frontend** as two separate Vercel projects. Use **Root Directory** for each and set env in the dashboard.

---

## 1. Deploy backend

1. In Vercel: **New Project** → Import the same Git repo.
2. **Root Directory:** set to **`backend`** (only the backend folder).
3. **Output Directory:** In **Project Settings → General**, find **Output Directory**. Leave it **empty** (delete any value like `public`). The backend is API-only; no static output.
4. **Environment Variables** (same as your current `backend/.env`):
   - `OPENAI_API_KEY` = your OpenAI API key
   - Optionally: `PORT`, `REDIS_HOST`, `REDIS_PORT` (not required on Vercel)
5. Deploy. Copy the deployed URL, e.g. `https://your-backend.vercel.app`.

**Note:** On Vercel the backend accepts **audio only** (mp3, m4a, wav). Video is supported when you run the backend locally.

---

## 2. Deploy frontend

1. In Vercel: **New Project** → Import the same Git repo again (or use a second project).
2. **Root Directory:** set to **`frontend`** (only the frontend folder).
3. **Environment Variables:**
   - `REACT_APP_API_URL` = **your deployed backend URL** (e.g. `https://your-backend.vercel.app`)  
     No trailing slash.
4. Deploy. Your app will be at e.g. `https://your-frontend.vercel.app` and will call the backend URL you set.

---

## Summary

| Project  | Root Directory | Env vars |
|----------|----------------|----------|
| Backend  | `backend`      | `OPENAI_API_KEY` (from your current backend .env) |
| Frontend | `frontend`    | `REACT_APP_API_URL` = backend Vercel link |

- Backend env = use the same values as in `backend/.env` (at least `OPENAI_API_KEY`).
- Frontend env = set `REACT_APP_API_URL` to the backend’s Vercel URL so the frontend talks to your deployed backend.
