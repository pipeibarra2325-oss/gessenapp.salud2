-- =====================================================================
-- Migración 002: sincroniza las secuencias de los ID autoincrementales
-- con el valor máximo de cada tabla.
-- Problema corregido: en el dump original la secuencia de platillos estaba en 1
-- aunque existían platillos hasta el ID 96, por lo que crear un platillo fallaba
-- con "llave duplicada viola restricción de unicidad".
-- Ejecutar sobre BD_gessenapp:
--   psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/002_sincronizar_secuencias.sql
-- =====================================================================
DO $$
DECLARE
    r RECORD;
    maximo BIGINT;
BEGIN
    FOR r IN
        SELECT c.table_schema, c.table_name, c.column_name,
               pg_get_serial_sequence(format('%I.%I', c.table_schema, c.table_name), c.column_name) AS secuencia
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND pg_get_serial_sequence(format('%I.%I', c.table_schema, c.table_name), c.column_name) IS NOT NULL
    LOOP
        EXECUTE format('SELECT MAX(%I) FROM %I.%I', r.column_name, r.table_schema, r.table_name) INTO maximo;
        IF maximo IS NULL THEN
            PERFORM setval(r.secuencia, 1, false);
        ELSE
            PERFORM setval(r.secuencia, maximo, true);
        END IF;
        RAISE NOTICE '% -> %', r.secuencia, COALESCE(maximo, 0);
    END LOOP;
END $$;
