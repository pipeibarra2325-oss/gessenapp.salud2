-- 007: Seguimiento clínico de la persona con diabetes tipo II
-- Atiende las recomendaciones del concepto médico: indicadores de laboratorio (HbA1c, glucemia,
-- perfil lipídico, función renal), evolución del peso y del IMC, tamizaje de sarcopenia (SARC-F,
-- fuerza de prensión, circunferencia de pantorrilla) y autorización de platillos de índice glucémico medio.
-- Se puede ejecutar varias veces sin dañar los datos.

BEGIN;

-- Historial de peso y estatura (curvas de progreso antropométrico)
CREATE TABLE IF NOT EXISTS mediciones_peso (
  id_medicion     SERIAL PRIMARY KEY,
  id_usuario      INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  peso            NUMERIC(5,2) NOT NULL CHECK (peso BETWEEN 20 AND 300),
  estatura        NUMERIC(5,2) CHECK (estatura BETWEEN 50 AND 250),
  registrado_por  INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mediciones_peso_usuario ON mediciones_peso (id_usuario, fecha);

-- Indicadores clínicos y de fuerza muscular registrados por el paciente o el profesional
CREATE TABLE IF NOT EXISTS seguimiento_clinico (
  id_seguimiento            SERIAL PRIMARY KEY,
  id_usuario                INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  fecha                     DATE NOT NULL DEFAULT CURRENT_DATE,
  glucemia_ayunas           NUMERIC(6,1),   -- mg/dL
  glucemia_postprandial     NUMERIC(6,1),   -- mg/dL, 1-2 h después de comer
  hba1c                     NUMERIC(4,1),   -- %
  colesterol_total          NUMERIC(6,1),   -- mg/dL
  ldl                       NUMERIC(6,1),   -- mg/dL
  hdl                       NUMERIC(6,1),   -- mg/dL
  trigliceridos             NUMERIC(7,1),   -- mg/dL
  creatinina                NUMERIC(5,2),   -- mg/dL
  circunferencia_pantorrilla NUMERIC(5,1),  -- cm
  fuerza_prension           NUMERIC(5,1),   -- kg (dinamometría)
  sarc_f                    SMALLINT CHECK (sarc_f BETWEEN 0 AND 10),
  notas                     VARCHAR(500),
  registrado_por            INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_registro            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seguimiento_usuario ON seguimiento_clinico (id_usuario, fecha);

-- El profesional puede autorizar platillos de índice glucémico medio para un paciente
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permite_ig_medio BOOLEAN NOT NULL DEFAULT FALSE;

-- Primera medición de peso de cada usuario con el peso que ya tiene registrado
INSERT INTO mediciones_peso (id_usuario, fecha, peso, estatura)
SELECT u.id_usuario, COALESCE(u.fecha_registro::date, CURRENT_DATE), u.peso, u.estatura
FROM usuarios u
WHERE u.peso BETWEEN 20 AND 300
  AND (u.estatura IS NULL OR u.estatura BETWEEN 50 AND 250)
  AND NOT EXISTS (SELECT 1 FROM mediciones_peso m WHERE m.id_usuario = u.id_usuario);

COMMIT;
