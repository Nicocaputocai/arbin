const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Fallback por si el archivo llega en el FormData antes que req.body.tree
    const rawFolder = req.body.tree || 'general';
    // Sanitizamos el nombre para evitar caracteres inválidos en rutas (ej. / \ : * ? " < > |)
    const safeFolder = rawFolder
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ_-]/gi, '_');

    const folderPath = path.join(__dirname, '../public/img', safeFolder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Filtro para permitir solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen.'), false);
  }
};

// Middleware de Multer sin bloqueo por fotos pesadas
const uploadImg = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB por archivo (evita bloqueos con cámaras de alta resolución)
    fieldSize: 25 * 1024 * 1024, // 25MB para campos de texto
  },
});

module.exports = uploadImg;