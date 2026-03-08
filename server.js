// server.js — Entry point for the Campus Lost & Found System
// Loads environment variables FIRST before anything else
require('dotenv').config();

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

// Import route modules
const authRoutes  = require('./routes/auth');
const itemRoutes  = require('./routes/items');

const app  = express();
app.set('trust proxy', 1); // ← ADD THIS LINE
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────

// Helmet sets secure HTTP headers automatically
//  - X-XSS-Protection, Content-Security-Policy, etc.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:      ["'self'"],
      scriptSrc:       ["'self'", "'unsafe-inline'"],
      scriptSrcAttr:   ["'unsafe-inline'"],
      styleSrc:        ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc:         ["'self'", "https://fonts.gstatic.com"],
      imgSrc:          ["'self'", "data:"],
      connectSrc:      ["'self'"],
    }
  }
}));

// CORS — allow only same origin in production
// ✅ REPLACE WITH THIS
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Rate limiting — prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 login attempts per 15 min
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 200 });

app.use(generalLimiter);

// ─────────────────────────────────────────
// BODY PARSING MIDDLEWARE
// ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));        // parse JSON body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // parse form data

// ─────────────────────────────────────────
// STATIC FILE SERVING
// ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',   // browsers cache static files for 1 day (performance)
  etag:   true,
}));

// ─────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────
app.use('/api/auth',  authLimiter, authRoutes);
app.use('/api/items', itemRoutes);

// ─────────────────────────────────────────
// SPA FALLBACK — serve index.html for all non-API routes
// (lets the frontend JS handle routing)
// ─────────────────────────────────────────
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────
// 404 HANDLER — catches unknown API routes
// ─────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Any unhandled error in route handlers lands here
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  // Never expose stack traces to the client in production
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message
  });
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
});
