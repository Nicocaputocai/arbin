const express = require('express');
const router = express.Router();
const CensusTreeController = require('../controllers/CensusTree');
const uploadImg = require('../middlewares/uploadImg');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Middleware wrapper para capturar errores de Multer y devolver JSON claro al frontend
const handleUpload = (req, res, next) => {
  const upload = uploadImg.fields([
    { name: 'leafImg', maxCount: 1 },
    { name: 'profileImg', maxCount: 1 },
  ]);

  upload(req, res, function (err) {
    if (err) {
      console.error('Error en subida de imagen:', err);
      return res.status(400).send({
        error: 'Error al procesar las imágenes adjuntas.',
        details: err.message,
      });
    }
    next();
  });
};

// Rutas de consulta y Dashboard (supervisores y admin)
router.get('/', verifyToken, checkRole('supervisor', 'admin'), CensusTreeController.getAll);
router.get('/species', verifyToken, CensusTreeController.getUniqueTrees);
router.get('/stats', verifyToken, checkRole('supervisor', 'admin'), CensusTreeController.getDashboardStats);

// Rutas de carga (cualquier usuario logueado) y validación (supervisores y admin)
router.post('/create', verifyToken, handleUpload, CensusTreeController.create);
router.patch('/validate/:id', verifyToken, checkRole('supervisor', 'admin'), CensusTreeController.validateTree);

module.exports = router;