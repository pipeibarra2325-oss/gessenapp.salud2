-- 006: región por defecto de Nariño.
-- Nariño tiene una zona andina (Pasto, Ipiales, Túquerres), donde vive la mayor parte de su población,
-- y una zona pacífica (Tumaco y la costa). Por defecto se asigna la región Andina; quien viva en la costa
-- puede elegir la región Pacífica en su perfil (usuarios.id_region, migración 004).
-- Idempotente: puede ejecutarse más de una vez.
BEGIN;
UPDATE departamentos
SET id_region = (SELECT id_region FROM regiones WHERE nombre_region = 'Andina')
WHERE nombre_departamento = 'Nariño';
COMMIT;
