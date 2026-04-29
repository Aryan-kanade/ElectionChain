require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const mongoSanitize  = require('express-mongo-sanitize');
const hpp            = require('hpp');
const rateLimit      = require('express-rate-limit');

const authRoutes      = require('./routes/auth.routes');
const aadhaarRoutes   = require('./routes/aadhaar.routes');
const voteRoutes      = require('./routes/vote.routes');
const candidateRoutes = require('./routes/candidate.routes');
const electionRoutes  = require('./routes/election.routes');
const adminRoutes     = require('./routes/admin.routes');
const auditRoutes     = require('./routes/audit.routes');
const healthRoutes    = require('./routes/health.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(hpp());

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again later.' },
}));

app.use('/api/health',     healthRoutes);
app.use('/api/auth',            authRoutes);
app.use('/api/auth/aadhaar',    aadhaarRoutes);
app.use('/api/vote',       voteRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/election',   electionRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/audit',      auditRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
