# Base de datos de GessenApp

## Instalación desde cero

```bash
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE \"BD_gessenapp\""
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/BD_gessenapp.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/001_panel_admin_logs.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/002_sincronizar_secuencias.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/003_imagenes_platillos.sql
```

## Migraciones

| Archivo | Qué hace |
|---|---|
| `001_panel_admin_logs.sql` | Crea la tabla `logs` (auditoría), la tabla `configuracion`, la columna `platillos.imagen_credito` y el borrado en cascada del historial al eliminar un usuario. |
| `002_sincronizar_secuencias.sql` | Ajusta los contadores de los ID al valor máximo de cada tabla. Sin esto, crear un platillo falla con "llave duplicada". |
| `003_imagenes_platillos.sql` | Asigna a los 96 platillos una foto de Wikimedia Commons con su crédito (autor y licencia). Se genera con `database/imagenes/generar_sql.py`. |

Las tres migraciones se pueden ejecutar varias veces sin dañar los datos.

## Tabla `logs`

| Columna | Descripción |
|---|---|
| `id_usuario` | Quién hizo la acción (NULL si el usuario fue eliminado) |
| `accion` | `LOGIN`, `LOGIN_FALLIDO`, `REGISTRO_USUARIO`, `REGISTRAR_CONSUMO`, `CREAR_PLATILLO`, `EDITAR_PLATILLO`, `ELIMINAR_PLATILLO`, `SUBIR_IMAGEN`, `EDITAR_USUARIO`, `ELIMINAR_USUARIO`, `CREAR_ADMINISTRADOR`, `EDITAR_ADMINISTRADOR`, `QUITAR_ADMINISTRADOR`, `ACTUALIZAR_CONFIGURACION`, `DESCARGAR_REPORTE_PDF`, `ACTUALIZAR_PERFIL`, `CAMBIAR_PASSWORD`, `ELIMINAR_CONSUMO` |
| `entidad`, `id_entidad` | Objeto afectado (ej. `platillos`, 12) |
| `detalle` | Datos adicionales en JSON |
| `ip`, `fecha` | Origen y momento de la acción |

## Pruebas

`backend/tests/pruebas_funcionales.mjs` ejecuta 51 casos de prueba. Solo se ejecuta sobre una **copia** de la base cuyo nombre contenga `test`:

```bash
cd backend
DB_NAME=BD_gessenapp_test node tests/pruebas_funcionales.mjs
```
