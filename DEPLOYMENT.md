# ElectionChain — Deployment Guide
## Backend → Render | Frontend → Netlify | DB → MongoDB Atlas

---

## Step 1 — MongoDB Atlas (Free Cloud DB)

1. Go to **https://cloud.mongodb.com** → Create free account
2. Create a **Free M0 Cluster** (512 MB, free forever)
3. **Database Access** → Add user → copy username + password
4. **Network Access** → Add IP → `0.0.0.0/0` (allow all — required for Render)
5. **Connect** → Drivers → copy connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/electionchain
   ```
6. Save this — you'll paste it into Render's env vars.

---

## Step 2 — Deploy Backend on Render (Free)

2. Go to **https://render.com** → Sign up (free)
3. **New** → **Web Service** → Connect your GitHub repo
4. Settings:
   - **Name:** `electionchain`
   - **Root Directory:** *(leave empty — repo root)*
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

5. **Environment Variables** → Add these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `MONGODB_URI` | *(your Atlas URI)* |
   | `JWT_SECRET` | *(random 64-char hex)* |
   | `ADMIN_ADDRESS` | *(your admin wallet address)* |
   | `ADMIN_PRIVATE_KEY` | *(your private key — only if contract deployed)* |
   | `CONTRACT_ADDRESS` | *(deployed contract — only if contract deployed)* |
   | `POLYGON_AMOY_RPC` | `https://rpc-amoy.polygon.technology` |
   | `CORS_ORIGINS` | `https://your-service.onrender.com` |
   | `SMTP_USER` | *(your Gmail — optional)* |
   | `SMTP_PASS` | *(your App Password — optional)* |
   | `REQUIRED_APPROVALS` | `1` |

6. Click **Create Web Service** → wait ~2 min for build
7. Your app URL: `https://your-service.onrender.com` — **the backend serves the
   voter demo at `/`**, no separate frontend hosting needed.

> **Note:** Free Render services sleep after 15 min of inactivity. First request after sleep takes ~30s. Upgrade to Starter ($7/mo) to disable sleep for production use.

---

## Step 3 — Frontend (already handled ✅)

No separate frontend deployment needed. `app.js` serves `demo.html` and `api.js`
from the backend origin (whitelisted static routes), and `api.js` automatically
targets same-origin `/api` in production.

---

## Step 4 — CORS

`CORS_ORIGINS` only matters if you host the frontend on a different domain.
For the same-origin deployment the default is fine:
```
CORS_ORIGINS=https://your-service.onrender.com
```

---

## Step 5 — Generate a Strong JWT Secret

Run this locally and paste the output into Render's `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 6 — Verify Everything Works

```bash
# Test your live app:
curl https://your-service.onrender.com/api/health

# Expected response:
# { "status":"ok", "version":"4.0.0", "dbConnected":true, ... }
```

Then open `https://your-service.onrender.com/` — the voter demo loads there.

---

## Quick-Start for Local Dev

```bash
cp .env.example .env   # fill in your values
npm install
node server.js         # http://localhost:4000 — serves the demo at /
```

> Optional (split hosting): serve the repo with any static server
> (e.g. `npx http-server . -p 3000`) — `api.js` detects localhost and targets
> `http://localhost:4000/api` automatically.

---

## Checklist Before Submission

- [ ] MongoDB Atlas connected (check `/api/health` → `dbConnected: true`)
- [ ] Contract deployed on Polygon Amoy or Sepolia
- [ ] Contract address visible on PolygonScan / Etherscan
- [ ] OTP email working (or dev mode with console output)
- [ ] Face registration + verification working
- [ ] Voting flow end-to-end working
- [ ] Admin dashboard accessible and showing charts
- [ ] `npm test` passes all tests
- [ ] Live URL deployed and accessible
- [ ] README.md updated with your live URL
