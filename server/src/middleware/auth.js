const jwt = require('jsonwebtoken');
const { spareSecretKey } = require('../controller/user.controller')
require('dotenv').config()

function authenticateToken(req, res, next) {
  const tokenValue = req.header('Authorization');
  let token
  if(tokenValue) {
    token = tokenValue.split(" ")
  }else {
    return res.status(403).json({ error: 'Invalid token' });
  }
  if (!token) return res.status(401).json({ error: 'Access denied' });
  const secretKey = process.env.JWT_SECRET_KEY || spareSecretKey
  jwt.verify(token[1], secretKey, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

function authorizeRoles() {
  return (req, res, next) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
