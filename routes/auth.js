// routes/auth.js — Register & Login endpoints
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const xss      = require('xss');
const db       = require('../db');

const router = express.Router();

// ─────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account
// ─────────────────────────────────────────
router.post(
  '/register',
  [
    // Server-side validation rules (express-validator)
    body('name')
      .trim().notEmpty().withMessage('Name is required')
      .isLength({ max: 100 }).withMessage('Name too long'),
    body('email')
      .trim().isEmail().withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
  .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Sanitize inputs with XSS library before storing
      const name  = xss(req.body.name.trim());
      const email = req.body.email.trim().toLowerCase();

      // Check if email already registered
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE email = ?',   // parameterized query → prevents SQL injection
        [email]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      }

      // Hash password — NEVER store plaintext passwords
      const salt     = await bcrypt.genSalt(12);  // 12 = cost factor (higher = slower = safer)
      const hashed   = await bcrypt.hash(req.body.password, salt);

      // Insert user — parameterized to prevent SQL injection
      const [result] = await db.execute(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashed]
      );

      // Issue JWT
      const token = jwt.sign(
        { id: result.insertId, name, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({ success: true, token, user: { id: result.insertId, name, email } });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }
);

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const email = req.body.email.trim().toLowerCase();

      // Fetch user by email
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      if (rows.length === 0) {
        // Vague message on purpose — don't reveal if email exists
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const user = rows[0];

      // Compare submitted password against stored hash
      const match = await bcrypt.compare(req.body.password, user.password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Sign JWT
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }
);

module.exports = router;
