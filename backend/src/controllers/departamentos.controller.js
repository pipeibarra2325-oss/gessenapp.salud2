import pool from "../config/database.js";

export const obtenerDepartamentos = async (req, res) => {
  try {
    const query = `
      SELECT 
        d.id_departamento,
        d.nombre_departamento,
        r.nombre_region as region
      FROM departamentos d
      LEFT JOIN regiones r ON d.id_region = r.id_region
      ORDER BY d.nombre_departamento ASC;
    `;

    const resultado = await pool.query(query);
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({
      error: "Error al obtener departamentos de la base de datos"
    });
  }
};

export const obtenerRegiones = async (req, res) => {
  try {
    const resultado = await pool.query("SELECT id_region, nombre_region FROM regiones ORDER BY nombre_region ASC");
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener regiones:", error);
    res.status(500).json({ error: "Error al obtener regiones" });
  }
};