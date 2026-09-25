-- =====================================================================
-- Migración 001: soporte del panel de administración
--   * Tabla logs (auditoría de acciones)
--   * Tabla configuracion (ajustes de la aplicación)
--   * Columna imagen_credito en platillos (atribución de las fotos)
--   * Borrado en cascada de datos dependientes de usuarios y platillos
-- Ejecutar sobre BD_gessenapp:
--   psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/001_panel_admin_logs.sql
-- =====================================================================
BEGIN;

-- ---------- LOGS ----------
CREATE TABLE IF NOT EXISTS public.logs (
    id_log      SERIAL PRIMARY KEY,
    id_usuario  INTEGER REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    accion      VARCHAR(60)  NOT NULL,          -- ej. LOGIN, LOGIN_FALLIDO, CREAR_PLATILLO
    entidad     VARCHAR(60),                    -- ej. usuarios, platillos, reportes
    id_entidad  INTEGER,
    detalle     JSONB,
    ip          VARCHAR(45),
    fecha       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logs_fecha   ON public.logs (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON public.logs (id_usuario);
CREATE INDEX IF NOT EXISTS idx_logs_accion  ON public.logs (accion);

-- ---------- CONFIGURACIÓN ----------
CREATE TABLE IF NOT EXISTS public.configuracion (
    clave               VARCHAR(60) PRIMARY KEY,
    valor               TEXT,
    actualizado_por     INTEGER REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.configuracion (clave, valor) VALUES
    ('app_name', 'GessenApp'),
    ('idioma', 'es'),
    ('zona_horaria', 'GMT-5 Colombia'),
    ('notificar_usuarios', 'true'),
    ('notificar_recetas', 'true')
ON CONFLICT (clave) DO NOTHING;

-- ---------- CRÉDITO DE IMÁGENES ----------
ALTER TABLE public.platillos ADD COLUMN IF NOT EXISTS imagen_credito TEXT;

-- ---------- BORRADO EN CASCADA ----------
-- Al eliminar un usuario se eliminan su historial y sus enfermedades asociadas
ALTER TABLE public.historial_consumo DROP CONSTRAINT IF EXISTS historial_consumo_id_usuario_fkey;
ALTER TABLE public.historial_consumo ADD CONSTRAINT historial_consumo_id_usuario_fkey
    FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.usuarios_enfermedades DROP CONSTRAINT IF EXISTS usuarios_enfermedades_id_usuario_fkey;
ALTER TABLE public.usuarios_enfermedades ADD CONSTRAINT usuarios_enfermedades_id_usuario_fkey
    FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

-- Al eliminar un platillo se eliminan sus ingredientes y recomendaciones.
-- El historial de consumo NO se borra en cascada: el backend impide eliminar platillos ya consumidos.
ALTER TABLE public.platillos_ingredientes DROP CONSTRAINT IF EXISTS platillos_ingredientes_id_platillo_fkey;
ALTER TABLE public.platillos_ingredientes ADD CONSTRAINT platillos_ingredientes_id_platillo_fkey
    FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo) ON DELETE CASCADE;

ALTER TABLE public.recomendaciones DROP CONSTRAINT IF EXISTS recomendaciones_id_platillo_fkey;
ALTER TABLE public.recomendaciones ADD CONSTRAINT recomendaciones_id_platillo_fkey
    FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo) ON DELETE CASCADE;

COMMIT;
