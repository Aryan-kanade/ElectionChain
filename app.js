/**
 * ElectionChain — app.js
 * Express app factory (separated from server startup for testability)
 */

require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const mongoSanitize  = require('express-mongo-sanitize');
const hpp            = require('hpp');
const rateLimit      = require('express-rate-limit');

const authRoutes      = require('./routes/auth.routes');
const voteRoutes      = require('./routes/vote.routes');
const candidateRoutes = require('./routes/candidate.routes');
const electionRoutes  = require('./routes/election.routes');
const adminRoutes     = require('./routes/admin.routes');
const auditRoutes     = require('./routes/audit.routes');
const healthRoutes    = require('./routes/health.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// ── SECURITY HEADERS ──────────────────────────────────────────────
// CSP permits exactly what demo.html uses: jsdelivr (face-api + models),
// cdnjs (Font Awesome), Google Fonts, and the page's own inline scripts.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src':      ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      'script-src-attr': ["'unsafe-inline'"],
      'style-src':       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      'font-src':        ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      'img-src':         ["'self'", 'data:', 'blob:', 'https:'],
      'media-src':       ["'self'", 'blob:'],
      'connect-src':     ["'self'", 'https:'],
      'worker-src':      ["'self'", 'blob:'],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500'
).split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));

// ── BODY PARSING ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── NOSQL INJECTION PREVENTION ────────────────────────────────────
app.use(mongoSanitize());

// ── HTTP PARAMETER POLLUTION PREVENTION ──────────────────────────
app.use(hpp());

// ── GLOBAL RATE LIMITER ───────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again later.' },
}));

// ── VOTER DEMO FRONTEND (whitelisted static files) ────────────────
// Serves only these exact paths from the repo root — never a directory
// listing or any other file (keeps .env, source, contract out of reach).
const path = require('path');
const fs   = require('fs');
const staticFiles = {
  '/':          path.join(__dirname, 'demo.html'),
  '/demo.html': path.join(__dirname, 'demo.html'),
  '/api.js':    path.join(__dirname, 'api.js'),
  '/config.js': path.join(__dirname, 'config.js'), // optional frontend override
};
app.get(Object.keys(staticFiles), (req, res) => {
  const file = staticFiles[req.path];
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(file);
});

// ── ROUTES ────────────────────────────────────────────────────────
app.use('/api/health',     healthRoutes);
app.use('/api/auth',       authRoutes);
app.use('/api/vote',       voteRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/election',   electionRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/audit',      auditRoutes);

// ── ERROR HANDLING ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
