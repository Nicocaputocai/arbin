const CensusTree = require("../models/CensusTree");

module.exports = {
  // 1. OBTENER ÁRBOLES (Con filtros dinámicos para Mapa y Tabla del Dashboard)
  getAll: async function (req, res) {
    try {
      const { createdBy, startDate, endDate, needsReview, tree } = req.query;
      const filter = {};

      // Filtro por censista
      if (createdBy) {
        filter["properties.createdBy"] = createdBy;
      }

      // Filtro por especie
      if (tree) {
        filter["properties.tree"] = tree;
      }

      // Filtro por árboles marcados para validación IA
      if (needsReview !== undefined) {
        filter["properties.needsReview"] = needsReview === "true";
      }

      // Filtro por rango de fechas (cubre desde las 00:00:00 del inicio hasta las 23:59:59 del fin)
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
          filter.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
      }

      const trees = await CensusTree.find(filter).sort({ createdAt: -1 });

      // Devolvemos siempre 200 con FeatureCollection (incluso vacío) para que Leaflet/Mapbox y React no fallen con 204
      return res.status(200).send({
        type: "FeatureCollection",
        total: trees.length,
        features: trees,
      });
    } catch (err) {
      console.error("Error en getAll:", err);
      return res.status(500).send({ error: "Error al obtener los árboles censados.", details: err.message });
    }
  },

  // 2. CREAR REGISTRO DE CENSO
  create: async function (req, res) {
    try {
      if (!req.body.coordinates) {
        return res.status(400).send({ error: "Las coordenadas son obligatorias." });
      }

      const values = req.body.coordinates.split(",");
      const v1 = parseFloat(values[0]);
      const v2 = parseFloat(values[1]);

      if (isNaN(v1) || isNaN(v2)) {
        return res.status(400).send({ error: "Formato de coordenadas inválido." });
      }

      // Parseo seguro de booleano y número (vienen como String si se envían por FormData)
      const needsReview =
        req.body.needsReview === true || req.body.needsReview === "true";
      const loadTimeSeconds = req.body.loadTimeSeconds
        ? Number(req.body.loadTimeSeconds)
        : 0;

      const data = {
        properties: {
          tree: req.body.tree,
          commonName: req.body.commonName || "",
          origin: req.body.origin, // "Nativa" | "Exótica"
          relativeHeight: req.body.relativeHeight, // "Bajo la línea de cables" | "A la altura" | "Por encima" | "Gran porte"
          visibleState: req.body.visibleState, // "Bueno" | "Regular" | "Malo" | "Seco"
          address: req.body.address,
          neighborhood: req.body.neighborhood || req.body.neightboardhood || "",
          needsReview: needsReview,
          observations: req.body.observations || "",
          loadTimeSeconds: loadTimeSeconds,
          createdBy: req.body.createdBy || "Usuario Anónimo",
          leafImg: req.files?.leafImg?.[0]?.filename || "",
          profileImg: req.files?.profileImg?.[0]?.filename || "",
        },
        geometry: {
          type: "Point",
          coordinates: [v1, v2],
        },
      };

      const newTree = new CensusTree(data);
      const savedTree = await newTree.save();

      return res.status(201).send({ CensusTree: savedTree });
    } catch (err) {
      console.error("Error en create:", err);
      // Si falla una validación de Mongoose (ej. enum inválido), devolvemos 400
      if (err.name === "ValidationError") {
        return res.status(400).send({ error: "Datos inválidos en el formulario.", details: err.errors });
      }
      return res.status(500).send({ error: "Error al guardar el árbol.", details: err.message });
    }
  },

  // 3. OBTENER ESPECIES ÚNICAS
  getUniqueTrees: async function (req, res) {
    try {
      const uniqueTrees = await CensusTree.distinct("properties.tree");
      const formattedTrees = uniqueTrees.map((tree) =>
        tree.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      );
      return res.status(200).send(formattedTrees);
    } catch (err) {
      return res.status(500).send({ error: "Error al obtener especies únicas.", details: err.message });
    }
  },

  // 4. ESTADÍSTICAS Y GRÁFICOS PARA EL DASHBOARD EN TIEMPO REAL
  getDashboardStats: async function (req, res) {
    try {
      const { createdBy, startDate, endDate } = req.query;
      const matchStage = {};

      if (createdBy) matchStage["properties.createdBy"] = createdBy;
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) matchStage.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }

      const [stats] = await CensusTree.aggregate([
        { $match: matchStage },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalTrees: { $sum: 1 },
                  pendingReview: {
                    $sum: { $cond: ["$properties.needsReview", 1, 0] },
                  },
                  avgLoadTime: { $avg: "$properties.loadTimeSeconds" },
                },
              },
            ],
            byDate: [
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            byEnumerator: [
              { $group: { _id: "$properties.createdBy", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            byOrigin: [
              { $group: { _id: "$properties.origin", count: { $sum: 1 } } },
            ],
            byRelativeHeight: [
              { $group: { _id: "$properties.relativeHeight", count: { $sum: 1 } } },
            ],
            byVisibleState: [
              { $group: { _id: "$properties.visibleState", count: { $sum: 1 } } },
            ],
            topSpecies: [
              { $group: { _id: "$properties.tree", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ]);

      return res.status(200).send({
        summary: stats.totals[0] || { totalTrees: 0, pendingReview: 0, avgLoadTime: 0 },
        byDate: stats.byDate,
        byEnumerator: stats.byEnumerator,
        byOrigin: stats.byOrigin,
        byRelativeHeight: stats.byRelativeHeight,
        byVisibleState: stats.byVisibleState,
        topSpecies: stats.topSpecies,
      });
    } catch (err) {
      console.error("Error en getDashboardStats:", err);
      return res.status(500).send({ error: "Error al calcular métricas.", details: err.message });
    }
  },

  // 5. VALIDAR / CORREGIR UN ÁRBOL MARCADO POR EL CENSISTA (Para supervisores)
  validateTree: async function (req, res) {
    try {
      const { id } = req.params;
      const { tree, commonName, origin, observations } = req.body;

      const updateFields = {
        "properties.needsReview": false, // Se marca como ya validado
      };

      if (tree) updateFields["properties.tree"] = tree;
      if (commonName !== undefined) updateFields["properties.commonName"] = commonName;
      if (origin) updateFields["properties.origin"] = origin;
      if (observations !== undefined) updateFields["properties.observations"] = observations;

      const updated = await CensusTree.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).send({ error: "Árbol no encontrado." });
      }

      return res.status(200).send({ CensusTree: updated });
    } catch (err) {
      return res.status(500).send({ error: "Error al validar el árbol.", details: err.message });
    }
  },
};