const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Verifica que el usuario esté logueado (token válido)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Soporta formato "Bearer <token>" o "<token>" directo
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;

  if (!token) {
    return res.status(401).send({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Queda disponible { id, user, name, role } en toda la petición
    next();
  } catch (err) {
    return res.status(401).send({ message: 'Token inválido o expirado.' });
  }
};

// 2. Verifica que el usuario tenga alguno de los roles permitidos
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).send({
        message: 'No tenés permisos suficientes para realizar esta acción.',
      });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };