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

1. Go to **https://render.com** → Sign up (free)
2. **New** → **Web Service** → Connect your GitHub repo
3. Settings:
   - **Name:** `electionchain-backend`
   - **Root Directory:** `electionchain-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

4. **Environment Variables** → Add these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `MONGODB_URI` | *(your Atlas URI)* |
   | `JWT_SECRET` | *(random 64-char hex)* |
   | `ADMIN_ADDRESS` | *(your MetaMask address)* |
   | `ADMIN_PRIVATE_KEY` | *(your private key)* |
   | `CONTRACT_ADDRESS` | *(deployed contract)* |
   | `POLYGON_AMOY_RPC` | `https://rpc-amoy.polygon.technology` |
   | `CORS_ORIGINS` | `https://your-app.netlify.app` |
   | `SMTP_USER` | *(your Gmail)* |
   | `SMTP_PASS` | *(your App Password)* |
   | `REQUIRED_APPROVALS` | `1` |

5. Click **Create Web Service** → wait ~2 min for build
6. Your backend URL: `https://electionchain-backend.onrender.com`

> **Note:** Free Render services sleep after 15 min of inactivity. First request after sleep takes ~30s. Upgrade to Starter ($7/mo) to disable sleep for production use.

---

## Step 3 — Deploy Frontend on Netlify (Free)

1. Go to **https://netlify.com** → Sign up (free)
2. **Add new site** → **Import from Git** → connect your repo
3. Settings:
   - **Publish directory:** `/` (root, where demo.html lives)
   - **Build command:** *(leave empty)*
4. Click **Deploy site**
5. Your frontend URL: `https://your-app.netlify.app`

### Fix API URL for Production

In `electionchain-backend/api.js`, change line 1:
```js
// Development
const API_BASE = 'http://localhost:4000/api';

// Production — replace with your Render URL
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:4000/api'
  : 'https://electionchain-backend.onrender.com/api';
```

### Fix Admin Dashboard Link

In `demo.html`, the admin dashboard button should link to `admin-dashboard.html`.
Copy `frontend/admin-dashboard.html` to your project root (same level as `demo.html`).

---

## Step 4 — Fix CORS After Deployment

After you know your Netlify URL, update `CORS_ORIGINS` in Render:
```
CORS_ORIGINS=https://your-app.netlify.app,https://custom-domain.com
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
# Test your live backend health endpoint:
curl https://electionchain-backend.onrender.com/api/health

# Expected response:
# { "status":"ok", "version":"4.0.0", "dbConnected":true, ... }
```

---

## Quick-Start for Local Dev

```bash
# Terminal 1 — Backend
cd electionchain-backend
cp .env.example .env   # fill in your values
npm install
node server.js         # runs on http://localhost:4000

# Terminal 2 — Frontend
cd ..                  # project root
npx http-server . -p 3000
# Open: http://localhost:3000/demo.html
# Admin: http://localhost:3000/admin-dashboard.html
```

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
