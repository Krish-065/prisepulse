const jwt = require('jsonwebtoken');
const { query } = require('../db/index');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session is valid
    const sessionResult = await query(
      `SELECT * FROM sessions WHERE id = $1 AND user_id = $2 AND is_valid = true AND expires_at > NOW()`,
      [decoded.sessionId, decoded.id]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }
    
    // Update last active
    await query(`UPDATE sessions SET last_active = NOW() WHERE id = $1`, [decoded.sessionId]);
    
    req.user = decoded;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate };