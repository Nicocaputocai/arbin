const mongoose = require("mongoose");
const { REF } = require("../types/types");

const CensusTreeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "Feature",
    },
    properties: {
      // --- DATOS PRINCIPALES DEL CENSO ---
      tree: {
        type: String,
        required: [true, "La especie es obligatoria"],
        trim: true,
      },
      commonName: {
        type: String,
        trim: true,
      },
      origin: {
        type: String,
        enum: ["Nativa", "Exótica"],
        required: [true, "Debe especificar si es Nativa o Exótica"],
      },
      relativeHeight: {
        type: String,
        enum: [
          "Bajo la línea de cables",
          "A la altura",
          "Por encima",
          "Gran porte",
        ],
        required: [true, "La altura relativa es obligatoria"],
      },
      visibleState: {
        type: String,
        enum: ["Bueno", "Regular", "Malo", "Seco"],
        required: [true, "El estado visible es obligatorio"],
      },

      // --- UBICACIÓN DESCRIPTIVA ---
      address: {
        type: String,
        required: [true, "La dirección o referencia de ubicación es obligatoria"],
        trim: true,
      },
      neighborhood: {
        type: String,
        trim: true,
        default: "",
      },

      // --- AUDITORÍA Y CONTROL DE CARGA ---
      createdBy: {
        type: String,
        required: true,
        default: "Usuario Anónimo",
        trim: true,
      },
      // Opcional: si en el futuro querés referenciar el ID del usuario además del nombre
      // userId: {
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: REF.USER,
      // },
      loadTimeSeconds: {
        type: Number, // Tiempo en segundos que le llevó al censista cargar el árbol
        default: 0,
      },

      // --- IMÁGENES (Opcionales por si se usan más adelante) ---
      leafImg: {
        type: String,
        default: "",
      },
      profileImg: {
        type: String,
        default: "",
      },
      needsReview: {
        type: Boolean,
        default: false, // Checkbox: true si el censista duda de la especie detectada por IA
      },
      observations: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // --- GEOLOCALIZACIÓN (GeoJSON: [longitud, latitud]) ---
    geometry: {
      type: {
        type: String,
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Las coordenadas [lng, lat] son obligatorias"],
        index: "2dsphere",
      },
    },
  },
  {
    timestamps: true, // Genera automáticamente createdAt y updatedAt
  }
);

// Índices compuestos para acelerar las consultas y filtros del Dashboard
CensusTreeSchema.index({ "properties.createdBy": 1, createdAt: -1 });
CensusTreeSchema.index({ "properties.tree": 1 });
CensusTreeSchema.index({ "properties.needsReview": 1 }); // Para filtrar rápido los casos a validar

const CensusTree = mongoose.model("CensusTree", CensusTreeSchema);

module.exports = CensusTree;