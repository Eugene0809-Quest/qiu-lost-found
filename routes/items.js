// routes/items.js — Full CRUD for lost & found items
const express  = require('express');
const { body, param, validationResult } = require('express-validator');
const xss      = require('xss');
const db       = require('../db');
const auth     = require('../middleware/authMiddleware');

const router = express.Router();

// Shared validation rules for creating / updating items
const itemValidation = [
  body('type').isIn(['lost', 'found']).withMessage('Type must be lost or found'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('category').isIn([
    'Electronics','Clothing','Accessories',
    'Books & Stationery','ID & Cards','Keys',
    'Bags','Sports Equipment','Other'
  ]).withMessage('Invalid category'),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 250 }),
  body('date_occurred').isDate().withMessage('Valid date required'),
  body('time_occurred').optional({ checkFalsy: true }).matches(/^\d{2}:\d{2}$/).withMessage('Invalid time format'),
  body('contact_name').trim().notEmpty().withMessage('Contact name required').isLength({ max: 100 }),
  body('contact_email').trim().isEmail().withMessage('Valid contact email required').normalizeEmail(),
  body('contact_phone').optional({ checkFalsy: true }).matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Invalid phone'),
];

// Helper — sanitize all string fields with XSS library
function sanitizeItem(body) {
  return {
    type:           body.type,
    title:          xss(body.title),
    description:    xss(body.description),
    category:       body.category,
    location:       xss(body.location),
    date_occurred:  body.date_occurred,
    time_occurred:  body.time_occurred || null,
    contact_name:   xss(body.contact_name),
    contact_email:  body.contact_email,
    contact_phone:  body.contact_phone ? xss(body.contact_phone) : null,
  };
}

// ─────────────────────────────────────────
// GET /api/items — list all items
// Optional query: ?type=lost|found  ?status=active|claimed|resolved
// ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let sql    = 'SELECT i.*, u.name AS reporter_name FROM items i JOIN users u ON i.user_id = u.id WHERE 1=1';
    const params = [];

    if (req.query.type && ['lost','found'].includes(req.query.type)) {
      sql += ' AND i.type = ?';
      params.push(req.query.type);
    }
    if (req.query.status && ['active','claimed','resolved'].includes(req.query.status)) {
      sql += ' AND i.status = ?';
      params.push(req.query.status);
    }

    sql += ' ORDER BY i.created_at DESC';

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /items error:', err);
    res.status(500).json({ success: false, message: 'Could not retrieve items.' });
  }
});

// ─────────────────────────────────────────
// GET /api/items/:id — single item detail
// ─────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT i.*, u.name AS reporter_name FROM items i JOIN users u ON i.user_id = u.id WHERE i.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not retrieve item.' });
  }
});

// ─────────────────────────────────────────
// POST /api/items — create new report
// ─────────────────────────────────────────
router.post('/', auth, itemValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const d = sanitizeItem(req.body);

    const [result] = await db.execute(
      `INSERT INTO items
        (user_id, type, title, description, category, location,
         date_occurred, time_occurred, contact_name, contact_email, contact_phone)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, d.type, d.title, d.description, d.category, d.location,
       d.date_occurred, d.time_occurred, d.contact_name, d.contact_email, d.contact_phone]
    );

    const [newItem] = await db.execute('SELECT * FROM items WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Report submitted successfully.', data: newItem[0] });
  } catch (err) {
    console.error('POST /items error:', err);
    res.status(500).json({ success: false, message: 'Could not create report.' });
  }
});

// ─────────────────────────────────────────
// PUT /api/items/:id — full update
// ─────────────────────────────────────────
router.put('/:id', auth, itemValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    // Only the owner can edit their own report
    const [rows] = await db.execute('SELECT user_id FROM items WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const d = sanitizeItem(req.body);

    await db.execute(
      `UPDATE items SET
        type=?, title=?, description=?, category=?, location=?,
        date_occurred=?, time_occurred=?, contact_name=?,
        contact_email=?, contact_phone=?
       WHERE id = ?`,
      [d.type, d.title, d.description, d.category, d.location,
       d.date_occurred, d.time_occurred, d.contact_name,
       d.contact_email, d.contact_phone, req.params.id]
    );

    const [updated] = await db.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Report updated.', data: updated[0] });
  } catch (err) {
    console.error('PUT /items error:', err);
    res.status(500).json({ success: false, message: 'Could not update report.' });
  }
});

// ─────────────────────────────────────────
// PATCH /api/items/:id/status — update status only
// ─────────────────────────────────────────
router.patch(
  '/:id/status', auth,
  [body('status').isIn(['active','claimed','resolved']).withMessage('Invalid status')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const [rows] = await db.execute('SELECT user_id FROM items WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
      if (rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });

      await db.execute('UPDATE items SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
      res.json({ success: true, message: `Status updated to ${req.body.status}.` });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Could not update status.' });
    }
  }
);

// ─────────────────────────────────────────
// DELETE /api/items/:id — remove report
// ─────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT user_id FROM items WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });

    await db.execute('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('DELETE /items error:', err);
    res.status(500).json({ success: false, message: 'Could not delete report.' });
  }
});

module.exports = router;
