const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/UsersController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Ruta de prueba y autenticación pública
router.get('/test', UsersController.test);
router.post('/login', UsersController.login);

// Gestión de usuarios (protegida por rol)
router.post('/register', verifyToken, checkRole('admin'), UsersController.register);
router.get('/', verifyToken, checkRole('admin', 'supervisor'), UsersController.getAllUsers);

module.exports = router;