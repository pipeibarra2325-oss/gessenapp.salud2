# Base de datos de GessenApp

## Instalación desde cero

```bash
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE \"BD_gessenapp\""
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/BD_gessenapp.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/001_panel_admin_logs.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/002_sincronizar_secuencias.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/003_imagenes_platillos.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/004_region_usuario_y_recetas.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/005_preparaciones.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/006_region_narino.sql
psql -h localhost -p 5433 -U postgres -d BD_gessenapp -f database/migraciones/007_seguimiento_clinico.sql
```

## Migraciones

| Archivo | Qué hace |
|---|---|
| `001_panel_admin_logs.sql` | Crea la tabla `logs` (auditoría), la tabla `configuracion`, la columna `platillos.imagen_credito` y el borrado en cascada del historial al eliminar un usuario. |
| `002_sincronizar_secuencias.sql` | Ajusta los contadores de los ID al valor máximo de cada tabla. Sin esto, crear un platillo falla con "llave duplicada". |
| `003_imagenes_platillos.sql` | Asigna a los 96 platillos una foto de Wikimedia Commons con su crédito (autor y licencia). Se genera con `database/imagenes/generar_sql.py`. |
| `004_region_usuario_y_recetas.sql` | Agrega `usuarios.id_region` (región alimentaria elegida por la persona; si es NULL se usa la del departamento, útil en Nariño, donde Pasto es andino y Tumaco pacífico). Agrega 32 ingredientes que faltaban (arroz blanco, harina, azúcar, yuca, plátano verde, etc.) y reconstruye los ingredientes de los 96 platillos, que antes no correspondían a la preparación. Los valores nutricionales nuevos son aproximados y deben contrastarse con la Tabla de Composición de Alimentos Colombianos. |

| `005_preparaciones.sql` | Reemplaza el texto de ejemplo de la preparación de los 96 platillos por pasos coherentes con sus ingredientes (un paso por línea). |

| `006_region_narino.sql` | Asigna a Nariño la región Andina por defecto (Pasto, Ipiales, Túquerres); quien viva en la costa puede elegir la Pacífica en su perfil. |

| `007_seguimiento_clinico.sql` | Crea `mediciones_peso` (curva de peso e IMC, con la primera medición de cada usuario), `seguimiento_clinico` (glucemia en ayunas y posprandial, HbA1c, perfil lipídico, creatinina, circunferencia de pantorrilla, fuerza de prensión y SARC-F) y la columna `usuarios.permite_ig_medio` (el profesional autoriza platillos de índice glucémico medio). |

Las siete migraciones se pueden ejecutar varias veces sin dañar los datos.

## Tabla `logs`

| Columna | Descripción |
|---|---|
| `id_usuario` | Quién hizo la acción (NULL si el usuario fue eliminado) |
| `accion` | `LOGIN`, `LOGIN_FALLIDO`, `REGISTRO_USUARIO`, `REGISTRAR_CONSUMO`, `CREAR_PLATILLO`, `EDITAR_PLATILLO`, `ELIMINAR_PLATILLO`, `SUBIR_IMAGEN`, `EDITAR_USUARIO`, `ELIMINAR_USUARIO`, `CREAR_ADMINISTRADOR`, `EDITAR_ADMINISTRADOR`, `QUITAR_ADMINISTRADOR`, `ACTUALIZAR_CONFIGURACION`, `DESCARGAR_REPORTE_PDF`, `ACTUALIZAR_PERFIL`, `CAMBIAR_PASSWORD`, `ELIMINAR_CONSUMO`, `EDITAR_INGREDIENTES_PLATILLO`, `ENTRENAR_MODELO`, `REGISTRAR_SEGUIMIENTO`, `ELIMINAR_SEGUIMIENTO`, `PERMITIR_IG_MEDIO`, `RETIRAR_IG_MEDIO` |
| `entidad`, `id_entidad` | Objeto afectado (ej. `platillos`, 12) |
| `detalle` | Datos adicionales en JSON |
| `ip`, `fecha` | Origen y momento de la acción |

## Pruebas

`backend/tests/pruebas_funcionales.mjs` ejecuta 68 casos de prueba. Solo se ejecuta sobre una **copia** de la base cuyo nombre contenga `test`:

```bash
cd backend
DB_NAME=BD_gessenapp_test node tests/pruebas_funcionales.mjs
```

`backend/tests/pruebas_exploratorias.mjs` (53 casos de entradas inválidas o malintencionadas) y `backend/tests/pruebas_seguimiento.mjs` (34 casos del seguimiento clínico, las alertas, la autorización de IG medio y el ajuste del recomendador por IMC) se ejecutan igual, con el backend corriendo sobre la copia de pruebas.

## Datos de demostración

`backend/scripts/sembrar_usuarios_demo.mjs` crea 20 pacientes sintéticos (correos `@demo.gessenapp.co`) con 30 días de consumos, calificaciones y favoritos, en tres perfiles de alimentación: adherente, mixto y de riesgo. Todas las cuentas usan la contraseña definida en la constante `CLAVE_DEMO` del script. Si se ejecuta de nuevo, borra los pacientes demo anteriores y los vuelve a crear; los consumos quedan en los 30 días anteriores a la fecha de ejecución.

```bash
cd backend
node scripts/sembrar_usuarios_demo.mjs --si
```

Para quitarlos: `DELETE FROM usuarios WHERE email LIKE '%@demo.gessenapp.co';` (sus consumos, calificaciones y favoritos se borran en cascada).

## Recomendador con aprendizaje automático

`backend/src/ml/recomendador.js` entrena un modelo de filtrado colaborativo (factorización de matrices con BPR) con los consumos, favoritos y calificaciones de los pacientes. Se entrena al iniciar el backend (alrededor de 1 segundo), se reentrena solo cada 15 minutos cuando alguien pide sugerencias y puede reentrenarse desde el Dashboard del panel. Las sugerencias solo incluyen platillos de índice glucémico bajo, o también medio si el profesional lo autorizó al paciente (con prioridad para los de IG bajo); nunca los de IG alto. Con un IMC de 25 o más se priorizan los platillos con menos calorías. Los pacientes con menos de 3 platillos distintos reciben los más elegidos por otros pacientes (inicio en frío). El Dashboard muestra la validación leave-one-out (HitRate@10 y NDCG@10) frente a la línea base de popularidad.
