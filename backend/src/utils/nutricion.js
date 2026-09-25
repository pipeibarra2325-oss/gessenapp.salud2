// Aporte nutricional total de cada platillo (receta completa), calculado a partir de
// los valores por 100 g de sus ingredientes y la cantidad en gramos de cada uno.
// Se usa como subconsulta para no multiplicar filas al unir con otras tablas.
export const NUTRIENTES_PLATILLO_SQL = `
  SELECT
    pi.id_platillo,
    COALESCE(ROUND(SUM(CASE WHEN n.nombre = 'Calorías'      THEN v.cantidad_por_100g * pi.cantidad / 100.0 END), 1), 0) AS calorias,
    COALESCE(ROUND(SUM(CASE WHEN n.nombre = 'Carbohidratos' THEN v.cantidad_por_100g * pi.cantidad / 100.0 END), 1), 0) AS carbohidratos,
    COALESCE(ROUND(SUM(CASE WHEN n.nombre = 'Azúcares'      THEN v.cantidad_por_100g * pi.cantidad / 100.0 END), 1), 0) AS azucares,
    COALESCE(ROUND(SUM(CASE WHEN n.nombre = 'Grasas'        THEN v.cantidad_por_100g * pi.cantidad / 100.0 END), 1), 0) AS grasas,
    COALESCE(ROUND(SUM(CASE WHEN n.nombre = 'Proteínas'     THEN v.cantidad_por_100g * pi.cantidad / 100.0 END), 1), 0) AS proteinas,
    COALESCE(ROUND(SUM(CASE WHEN n.nombre = 'Fibra'         THEN v.cantidad_por_100g * pi.cantidad / 100.0 END), 1), 0) AS fibra,
    COALESCE(ROUND(SUM(CASE WHEN n.nombre = 'Sodio'         THEN v.cantidad_por_100g * pi.cantidad / 100.0 END), 1), 0) AS sodio
  FROM platillos_ingredientes pi
  JOIN ingrediente_valores_nutricionales v ON v.id_ingrediente = pi.id_ingrediente
  JOIN nutrientes n ON n.id_nutriente = v.id_nutriente
  GROUP BY pi.id_platillo
`;
