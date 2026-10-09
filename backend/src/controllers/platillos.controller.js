import pool from "../config/database.js";
import { NUTRIENTES_PLATILLO_SQL } from "../utils/nutricion.js";
import { registrarLog } from "../utils/logger.js";
import { construirReporte } from "../utils/reporte.js";
import { recomendar } from "../ml/recomendador.js";
import { idValido, fechaValida } from "../utils/validacion.js";

// Caché del catálogo público: la consulta calcula los nutrientes de todas las recetas, así que se guarda
// 60 segundos y se descarta cuando el panel modifica una receta o llega una calificación nueva
let catalogoCache = null;
let catalogoHasta = 0;
export const invalidarCatalogo = () => { catalogoCache = null; };

export const obtenerPlatillos = async (req, res) => {
  try {
    if (catalogoCache && Date.now() < catalogoHasta) {
      return res.status(200).type("application/json").send(catalogoCache);
    }
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
        COALESCE(nt.carga_glucemica, 0) as "cargaGlucemica",
        (SELECT ARRAY_AGG(CONCAT(i.nombre_ingrediente, ' (', ROUND(pi.cantidad, 1), ' ', pi.unidad, ')') ORDER BY i.nombre_ingrediente)
           FROM platillos_ingredientes pi JOIN ingredientes i ON i.id_ingrediente = pi.id_ingrediente
          WHERE pi.id_platillo = p.id_platillo) as ingredients,
        cal.promedio as "ratingAvg",
        COALESCE(cal.total, 0)::int as "ratingCount"
      FROM platillos p
      LEFT JOIN (SELECT id_platillo, ROUND(AVG(rating)::numeric, 1)::float AS promedio, COUNT(*) AS total
                   FROM platillo_calificaciones GROUP BY id_platillo) cal ON cal.id_platillo = p.id_platillo
      LEFT JOIN categorias_platillo cp ON p.id_categoria = cp.id_categoria
      LEFT JOIN (${NUTRIENTES_PLATILLO_SQL}) nt ON nt.id_platillo = p.id_platillo
      -- Las recetas sin ingredientes aún no se publican: su aporte nutricional sería 0
      WHERE EXISTS (SELECT 1 FROM platillos_ingredientes pi2 WHERE pi2.id_platillo = p.id_platillo)
      ORDER BY p.nombre_platillo ASC;
    `;

    const resultado = await pool.query(query);

    const platillos = resultado.rows.map(p => {
      const caloriesNum = parseFloat(p.calories) || 0;
      const carbsNum = parseFloat(p.carbs) || 0;
      const proteinNum = parseFloat(p.protein) || 0;
      const fatsNum = parseFloat(p.fats) || 0;
      // Distribución de la energía: 4 kcal/g de carbohidratos y proteínas, 9 kcal/g de grasas
      const totalMacros = carbsNum * 4 + proteinNum * 4 + fatsNum * 9 || 1;

      let caloricLevel = "Medio";
      if (caloriesNum < 200) caloricLevel = "Bajo";
      else if (caloriesNum > 400) caloricLevel = "Alto";

      // Carga glucémica calculada con el índice glucémico y los carbohidratos de cada ingrediente
      const glycemicLoad = Math.round(parseFloat(p.cargaGlucemica) || 0);

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
          carbs: Math.round((carbsNum * 4 / totalMacros) * 100),
          protein: Math.round((proteinNum * 4 / totalMacros) * 100),
          fat: Math.round((fatsNum * 9 / totalMacros) * 100)
        },
        ingredients: p.ingredients || [],
        // Promedio de las calificaciones registradas por los usuarios (null si aún no hay)
        rating: p.ratingAvg,
        ratingCount: p.ratingCount
      };
    });

    catalogoCache = JSON.stringify(platillos);
    catalogoHasta = Date.now() + 60 * 1000;
    res.status(200).type("application/json").send(catalogoCache);
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
  const { platilloId, mealTime, portions = 1, rating, comment, hora } = req.body || {};
  const userId = req.user.id_usuario;

  if (!platilloId) {
    return res.status(400).json({ error: "platilloId es obligatorio" });
  }
  if (!idValido(platilloId)) {
    return res.status(400).json({ error: "El platillo no es válido" });
  }
  if (rating != null && rating !== "" && !(Number.isInteger(Number(rating)) && rating >= 1 && rating <= 5)) {
    return res.status(400).json({ error: "La calificación debe ser un número entero de 1 a 5" });
  }
  if (comment != null && String(comment).length > 500) {
    return res.status(400).json({ error: "El comentario admite hasta 500 caracteres" });
  }
  if (!MOMENTOS.includes(mealTime)) {
    return res.status(400).json({ error: `mealTime debe ser uno de: ${MOMENTOS.join(", ")}` });
  }
  const porciones = Number(portions);
  if (!(porciones > 0 && porciones <= 10)) {
    return res.status(400).json({ error: "La porción debe ser mayor que 0 y menor o igual a 10" });
  }
  // Hora opcional del consumo (HH:MM); si no se envía, se usa la hora del registro
  if (hora != null && hora !== "" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return res.status(400).json({ error: "La hora debe tener el formato HH:MM" });
  }

  // La conexión se libera antes de escribir el log: si se mantuviera ocupada mientras registrarLog pide otra,
  // con muchas solicitudes simultáneas todas las conexiones quedarían esperando y el servidor se bloquearía.
  let idHistorial;
  const client = await pool.connect();
  try {
    // Solo recetas publicadas: las que aún no tienen ingredientes no aparecen en el catálogo
    const existe = await client.query(
      "SELECT EXISTS (SELECT 1 FROM platillos_ingredientes pi WHERE pi.id_platillo = p.id_platillo) AS publicado FROM platillos p WHERE p.id_platillo = $1",
      [platilloId]
    );
    if (existe.rows.length === 0) {
      return res.status(404).json({ error: "El platillo no existe" });
    }
    if (!existe.rows[0].publicado) {
      return res.status(400).json({ error: "El platillo aún no está publicado: no tiene ingredientes" });
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
        (id_usuario, id_platillo, fecha_consumo, porcion_consumida, meal_time, porcion_gramos, rating_usuario, comentario, fecha_registro)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7,
              COALESCE(CURRENT_DATE + $8::time, CURRENT_TIMESTAMP))
      RETURNING id_historial
    `, [userId, platilloId, porciones, mealTime, porcionGramos, calificacion, comment?.trim() || null, hora || null]);

    // Guardar calificación del platillo (UPSERT)
    if (calificacion) {
      await client.query(`
        INSERT INTO platillo_calificaciones (id_usuario, id_platillo, rating, comentario)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_usuario, id_platillo)
        DO UPDATE SET rating = EXCLUDED.rating, comentario = EXCLUDED.comentario, fecha_calificacion = CURRENT_TIMESTAMP;
      `, [userId, platilloId, calificacion, comment?.trim() || null]);
      invalidarCatalogo();
    }

    await client.query('COMMIT');
    idHistorial = insert.rows[0].id_historial;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error("Error al registrar consumo:", error);
    if (error.code === "23503") return res.status(401).json({ error: "La sesión ya no es válida" });
    return res.status(500).json({ error: "Error al registrar el consumo" });
  } finally {
    client.release();
  }

  await registrarLog(req, "REGISTRAR_CONSUMO", { entidad: "historial_consumo", id_entidad: idHistorial, detalle: { id_platillo: Number(platilloId), mealTime, porciones } });
  res.status(201).json({ success: true, id: idHistorial, message: "Consumo registrado correctamente" });
};

// ==================== TOGGLE FAVORITO ====================
export const toggleFavorito = async (req, res) => {
  try {
    const { platilloId } = req.body || {};
    const userId = req.user.id_usuario;
    if (!platilloId) return res.status(400).json({ error: "platilloId es obligatorio" });
    if (!idValido(platilloId)) return res.status(400).json({ error: "El platillo no es válido" });

    // Quitar es siempre posible; agregar solo para recetas publicadas (con ingredientes).
    // Las operaciones son atómicas: varios clics simultáneos no producen errores ni duplicados.
    const quitado = await pool.query(
      "DELETE FROM usuarios_favoritos WHERE id_usuario = $1 AND id_platillo = $2 RETURNING 1",
      [userId, platilloId]
    );
    if (quitado.rowCount > 0) {
      return res.json({ success: true, isFavorite: false, message: "Favorito eliminado" });
    }

    const publicado = await pool.query(
      "SELECT 1 FROM platillos p WHERE p.id_platillo = $1 AND EXISTS (SELECT 1 FROM platillos_ingredientes pi WHERE pi.id_platillo = p.id_platillo)",
      [platilloId]
    );
    if (publicado.rowCount === 0) return res.status(404).json({ error: "El platillo no existe o aún no está publicado" });

    await pool.query(
      "INSERT INTO usuarios_favoritos (id_usuario, id_platillo) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, platilloId]
    );
    return res.json({ success: true, isFavorite: true, message: "Favorito agregado" });
  } catch (error) {
    if (error.code === "23503") return res.status(404).json({ error: "El platillo no existe" });
    console.error("Error en toggleFavorito:", error);
    res.status(500).json({ error: "Error al actualizar favorito" });
  }
};

// ==================== CONSUMOS DEL USUARIO ====================
// Consumos del usuario autenticado en una fecha (por defecto, hoy) o todo su historial, con su aporte nutricional
export const obtenerMisConsumos = async (req, res) => {
  try {
    // ?todos=1 devuelve todo el historial del usuario, del más reciente al más antiguo
    if (req.query.todos === "1") {
      const reporte = await construirReporte(req.user.id_usuario, {});
      if (!reporte) return res.status(404).json({ error: "Usuario no encontrado" });
      return res.json([...reporte.registros].reverse());
    }
    const fecha = req.query.fecha || new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD, hora local
    if (!fechaValida(fecha)) {
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

// ==================== RECOMENDACIONES CON APRENDIZAJE AUTOMÁTICO ====================
// Sugerencias personalizadas del modelo de filtrado colaborativo (ver ml/recomendador.js)
export const obtenerRecomendacionesML = async (req, res) => {
  try {
    const limite = Math.min(Math.max(Number(req.query.limite) || 6, 1), 20);
    res.json(await recomendar(req.user.id_usuario, limite));
  } catch (error) {
    console.error("Error en recomendaciones ML:", error);
    res.status(500).json({ error: "Error al generar las recomendaciones" });
  }
};

// ==================== INTERACCIONES (retroalimentación implícita) ====================
// Registra que el usuario abrió el detalle de un platillo; el modelo de recomendación usa estas vistas
// como una señal débil de interés (tabla user_interactions, evento "view").
export const registrarInteraccion = async (req, res) => {
  try {
    const { platilloId } = req.body || {};
    if (!Number.isInteger(Number(platilloId)) || Number(platilloId) <= 0) {
      return res.status(400).json({ error: "platilloId no es válido" });
    }
    const existe = await pool.query("SELECT nombre_platillo FROM platillos WHERE id_platillo = $1", [platilloId]);
    if (existe.rowCount === 0) return res.status(404).json({ error: "El platillo no existe" });
    await pool.query(`
      INSERT INTO user_interactions (id_usuario, event_type, entity_type, entity_id, metadata, score_implicit, source)
      VALUES ($1, 'view', 'platillo', $2, $3, 0.5, 'frontend')`,
      [req.user.id_usuario, Number(platilloId), JSON.stringify({ origen: "detalle_receta", title: existe.rows[0].nombre_platillo })]);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error al registrar interacción:", error);
    res.status(500).json({ error: "Error al registrar la interacción" });
  }
};
