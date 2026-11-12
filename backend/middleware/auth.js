const jwt = require('jsonwebtoken');

// En producción la clave es obligatoria: con una clave fija conocida cualquiera
// podría fabricar tokens válidos (incluso de administrador).
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}
const JWT_SECRET = process.env.JWT_SECRET || 'itams-secret-key-2024-solo-desarrollo';

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { auth, adminOnly, JWT_SECRET };
