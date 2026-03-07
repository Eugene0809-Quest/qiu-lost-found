// middleware/authMiddleware.js
// Protects routes — only logged-in users can access them

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // JWT is sent in the Authorization header as "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // extract token part

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
  }

  try {
    // Verify signature and expiry — throws if invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request object
    next();             // pass control to the actual route handler
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token invalid or expired. Please log in again.' });
  }
}

module.exports = authMiddleware;
