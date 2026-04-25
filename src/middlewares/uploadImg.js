const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const treeFolder = req.body.tree; // Nombre de la carpeta basado en `req.body.tree`
    
    if (!treeFolder) {
      return cb(new Error('El campo "tree" es obligatorio en el cuerpo de la solicitud.'));
    }

    const folderPath = path.join(__dirname, '../public/img', treeFolder);

    // Verifica si la carpeta existe, si no, la crea
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Filtro para permitir solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen.'));
  }
};

// Middleware de Multer
const uploadImg = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 20 * 1024 * 1024, // Aumentado a 20MB por foto
    fieldSize: 10 * 1024 * 1024 // Aumentado a 10MB para campos de texto/datos
  }, 
});

module.exports = uploadImg;

module.exports = uploadImg;
