import pool from "../config/database.js";
import { NUTRIENTES_PLATILLO_SQL } from "../utils/nutricion.js";
import { registrarLog } from "../utils/logger.js";
import { construirReporte } from "../utils/reporte.js";

export const obtenerPlatillos = async (req, res) => {
  try {
    const query = `
      SELECT
        p.id_platillo as id,
        p.nombre_platillo as title,
        p.descripcion as description,
        p.imagen_url as image,
        p.imagen_credito as "imageCredit",
        COALESCE(p.tiempo_preparacion, 20) as "prepTimeRaw",
        p.porcion_personas as servings,
        cp.nombre as category,
        (SELECT ARRAY_AGG(s.nombre ORDER BY s.nombre) FROM platillos_sabores ps
           JOIN sabores s ON s.id_sabor = ps.id_sabor WHERE ps.id_platillo = p.id_platillo) as flavors,
        (SELECT ARRAY_AGG(pr.nombre ORDER BY pr.nombre) FROM platillos_preferencias pp
           JOIN preferencias pr ON pr.id_preferencia = pp.id_preferencia WHERE pp.id_platillo = p.id_platillo) as preferences,
        LOWER(p.nivel_glucemico) as "glycemicIndexRaw",
        p.preparacion as "preparationRaw",
        COALESCE(nt.calorias, 0) as calories,
        COALESCE(nt.carbohidratos, 0) as carbs,
        COALESCE(nt.azucares, 0) as sugars,
        COALESCE(nt.grasas, 0) as fats,
        COALESCE(nt.proteinas, 0) as protein,
        COALESCE(nt.fibra, 0) as fiber,
        COALESCE(nt.sodio, 0) as sodium,
        (SELECT ARRAY_AGG(CONCAT(i.nombre_ingrediente, ' (', ROUND(pi.cantidad, 1), ' ', pi.unidad, ')') ORDER BY i.nombre_ingrediente)
           FROM platillos_ingredientes pi JOIN ingredientes i ON i.id_ingrediente = pi.id_ingrediente
          WHERE pi.id_platillo = p.id_platillo) as ingredients
      FROM platillos p
      LEFT JOIN categorias_platillo cp ON p.id_categoria = cp.id_categoria
      LEFT JOIN (${NUTRIENTES_PLATILLO_SQL}) nt ON nt.id_platillo = p.id_platillo
      ORDER BY p.nombre_platillo ASC;
    `;

    const resultado = await pool.query(query);

    const platillos = resultado.rows.map(p => {
      const caloriesNum = parseFloat(p.calories) || 0;
      const carbsNum = parseFloat(p.carbs) || 0;
      const proteinNum = parseFloat(p.protein) || 0;
      const fatsNum = parseFloat(p.fats) || 0;
      const totalMacros = carbsNum + proteinNum + fatsNum || 1;

      let caloricLevel = "Medio";
      if (caloriesNum < 200) caloricLevel = "Bajo";
      else if (caloriesNum > 400) caloricLevel = "Alto";

      const glycemicLoad = (p.glycemicIndexRaw || 'bajo').toLowerCase() === 'bajo'
        ? Math.round((carbsNum * 0.5))
        : Math.round((carbsNum * 1.2));

      let instructions = [];
      if (p.preparationRaw) {
        instructions = p.preparationRaw
          .split('\n')
          .map(step => step.trim())
          .filter(step => step.length > 1);
      }

      if (instructions.length === 0) {
        instructions = ["Preparar todos los ingredientes.", "Cocinar según las indicaciones.", "Servir caliente."];
      }

      return {
        ...p,
        prepTime: `${p.prepTimeRaw} min`,
        servings: Number(p.servings) || 2,
        glycemicIndex: p.glycemicIndexRaw || 'bajo',
        instructions,
        calories: `${caloriesNum} kcal`,
        carbs: `${carbsNum}g`,
        protein: `${proteinNum}g`,
        fiber: `${parseFloat(p.fiber) || 0}g`,
        fats: `${fatsNum}g`,
        sugars: `${parseFloat(p.sugars) || 0}g`,
        sodium: `${parseFloat(p.sodium) || 0}mg`,
        caloricLevel,
        glycemicLoad: `${glycemicLoad}`,
        macroDistribution: {
          carbs: Math.round((carbsNum / totalMacros) * 100),
          protein: Math.round((proteinNum / totalMacros) * 100),
          fat: Math.round((fatsNum / totalMacros) * 100)
        },
        ingredients: p.ingredients || [],
        rating: 4.5
      };
    });

    res.status(200).json(platillos);
  } catch (error) {
    console.error("Error al obtener platillos:", error);
    res.status(500).json({ error: "Error al obtener los platillos" });
  }
};

// ==================== FAVORITOS ====================
// Devuelve los IDs (como texto) de los platillos favoritos del usuario autenticado.
// Un administrador puede consultar los de cualquier usuario.
export const obtenerFavoritos = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId es obligatorio" });
    if (userId !== req.user.id_usuario && req.user.id_rol !== 1) {
      return res.status(403).json({ error: "No puedes consultar los favoritos de otro usuario" });
    }

    const resultado = await pool.query(
      "SELECT id_platillo FROM usuarios_favoritos WHERE id_usuario = $1",
      [userId]
    );

    res.json(resultado.rows.map(row => row.id_platillo.toString()));
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
};

// ==================== CONSUMO Y CALIFICACIÓN ====================
const MOMENTOS = ["Desayuno", "Almuerzo", "Merienda", "Cena", "Snack"];

export const registrarConsumo = async (req, res) => {
  const { platilloId, mealTime, portions = 1, rating, comment } = req.body || {};
  const userId = req.user.id_usuario;

  if (!platilloId) {
    return res.status(400).json({ error: "platilloId es obligatorio" });
  }
  if (!MOMENTOS.includes(mealTime)) {
    return res.status(400).json({ error: `mealTime debe ser uno de: ${MOMENTOS.join(", ")}` });
  }
  const porciones = Number(portions);
  if (!(porciones > 0 && porciones <= 10)) {
    return res.status(400).json({ error: "La porción debe ser mayor que 0 y menor o igual a 10" });
  }

  const client = await pool.connect();
  try {
    const existe = await client.query("SELECT 1 FROM platillos WHERE id_platillo = $1", [platilloId]);
    if (existe.rows.length === 0) {
      return res.status(404).json({ error: "El platillo no existe" });
    }

    await client.query('BEGIN');

    // Gramos consumidos según el peso total de la receta
    const pesoResult = await client.query(
      "SELECT COALESCE(SUM(cantidad), 0) as peso_base FROM platillos_ingredientes WHERE id_platillo = $1",
      [platilloId]
    );
    const porcionGramos = Math.round((parseFloat(pesoResult.rows[0].peso_base) || 0) * porciones);
    const calificacion = rating >= 1 && rating <= 5 ? Math.round(rating) : null;

    const insert = await client.query(`
      INSERT INTO historial_consumo
        (id_usuario, id_platillo, fecha_consumo, porcion_consumida, meal_time, porcion_gramos, rating_usuario, comentario)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)
      RETURNING id_historial
    `, [userId, platilloId, porciones, mealTime, porcionGramos, calificacion, comment?.trim() || null]);

    // Guardar calificación del platillo (UPSERT)
    if (calificacion) {
      await client.query(`
        INSERT INTO platillo_calificaciones (id_usuario, id_platillo, rating, comentario)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_usuario, id_platillo)
        DO UPDATE SET rating = EXCLUDED.rating, comentario = EXCLUDED.comentario, fecha_calificacion = CURRENT_TIMESTAMP;
      `, [userId, platilloId, calificacion, comment?.trim() || null]);
    }

    await client.query('COMMIT');
    await registrarLog(req, "REGISTRAR_CONSUMO", { entidad: "historial_consumo", id_entidad: insert.rows[0].id_historial, detalle: { id_platillo: Number(platilloId), mealTime, porciones } });
    res.status(201).json({ success: true, id: insert.rows[0].id_historial, message: "Consumo registrado correctamente" });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error("Error al registrar consumo:", error);
    res.status(500).json({ error: "Error al registrar el consumo" });
  } finally {
    client.release();
  }
};

// ==================== TOGGLE FAVORITO ====================
export const toggleFavorito = async (req, res) => {
  try {
    const { platilloId } = req.body || {};
    const userId = req.user.id_usuario;
    if (!platilloId) return res.status(400).json({ error: "platilloId es obligatorio" });

    const existe = await pool.query(
      "SELECT 1 FROM usuarios_favoritos WHERE id_usuario = $1 AND id_platillo = $2",
      [userId, platilloId]
    );

    if (existe.rows.length > 0) {
      await pool.query("DELETE FROM usuarios_favoritos WHERE id_usuario = $1 AND id_platillo = $2", [userId, platilloId]);
      return res.json({ success: true, isFavorite: false, message: "Favorito eliminado" });
    }

    await pool.query("INSERT INTO usuarios_favoritos (id_usuario, id_platillo) VALUES ($1, $2)", [userId, platilloId]);
    return res.json({ success: true, isFavorite: true, message: "Favorito agregado" });
  } catch (error) {
    if (error.code === "23503") return res.status(404).json({ error: "El platillo no existe" });
    console.error("Error en toggleFavorito:", error);
    res.status(500).json({ error: "Error al actualizar favorito" });
  }
};

// ==================== CONSUMOS DEL USUARIO ====================
// Consumos del usuario autenticado en una fecha (por defecto, hoy) con su aporte nutricional
export const obtenerMisConsumos = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD, hora local
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: "La fecha debe tener el formato AAAA-MM-DD" });
    }
    const reporte = await construirReporte(req.user.id_usuario, { desde: fecha, hasta: fecha });
    if (!reporte) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(reporte.registros);
  } catch (error) {
    console.error("Error al obtener consumos:", error);
    res.status(500).json({ error: "Error al obtener los consumos" });
  }
};

// Elimina un consumo propio (un administrador puede eliminar cualquiera)
export const eliminarConsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT id_usuario, id_platillo FROM historial_consumo WHERE id_historial = $1", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "El consumo no existe" });
    if (rows[0].id_usuario !== req.user.id_usuario && req.user.id_rol !== 1) {
      return res.status(403).json({ error: "No puedes eliminar consumos de otro usuario" });
    }
    await pool.query("DELETE FROM historial_consumo WHERE id_historial = $1", [id]);
    await registrarLog(req, "ELIMINAR_CONSUMO", { entidad: "historial_consumo", id_entidad: Number(id), detalle: { id_platillo: rows[0].id_platillo } });
    res.json({ success: true, message: "Consumo eliminado" });
  } catch (error) {
    console.error("Error al eliminar consumo:", error);
    res.status(500).json({ error: "Error al eliminar el consumo" });
  }
};
