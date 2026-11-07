-- =========================================================================

-- HABILITAR EXTENSIÓN PARA UUIDs (CORRECCIÓN DE ERROR GEN_RANDOM_UUID)

-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================

-- SCRIPT SQL DDL • CONTROLLABS (POSTGRESQL)

-- =========================================================================

CREATE TABLE users (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email VARCHAR(255) NOT NULL UNIQUE,

  nombre VARCHAR(150) NOT NULL,

  rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'GUARDA', 'INSTRUCTOR')),

  activo BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE rooms (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nombre VARCHAR(100) NOT NULL UNIQUE,

  bloque VARCHAR(50) NOT NULL,

  capacidad_pcs INTEGER NOT NULL CHECK (capacidad_pcs >= 0),

  estado VARCHAR(20) NOT NULL DEFAULT 'OPERATIVO' CHECK (estado IN ('OPERATIVO', 'MANTENIMIENTO', 'INACTIVO'))

);

CREATE TABLE equipment (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  placa_sena VARCHAR(50) NOT NULL UNIQUE,

  codigo_activo VARCHAR(100) NOT NULL UNIQUE,

  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('COMPUTADOR', 'MOUSE', 'TECLADO', 'CARGADOR', 'TELEVISOR', 'CONTROL_TV')),

  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,

  estado VARCHAR(20) NOT NULL DEFAULT 'OPERATIVO' CHECK (estado IN ('OPERATIVO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO'))

);

CREATE TABLE loans (

  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,

  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  guarda_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  numero_pc INTEGER NOT NULL CHECK (numero_pc > 0),

  estado VARCHAR(24) NOT NULL DEFAULT 'PENDIENTE_APROBACION' CHECK (estado IN ('PENDIENTE_APROBACION', 'APROBADO_Y_FIRMADO')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  accepted_at TIMESTAMPTZ,

  CHECK ((estado = 'PENDIENTE_APROBACION' AND accepted_at IS NULL) OR (estado = 'APROBADO_Y_FIRMADO' AND accepted_at IS NOT NULL))

);

CREATE TABLE loan_equipment (

  loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,

  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,

  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  returned_at TIMESTAMPTZ,

  CHECK (returned_at IS NULL OR returned_at >= assigned_at),

  PRIMARY KEY (loan_id, equipment_id)

);

CREATE TABLE incidents (

  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,

  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  descripcion TEXT NOT NULL,

  prioridad VARCHAR(10) NOT NULL CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),

  estado VARCHAR(16) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'RESUELTA')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX idx_equipment_room ON equipment(room_id);

CREATE INDEX idx_loans_room_created ON loans(room_id, created_at DESC);

CREATE INDEX idx_incidents_equipment_status ON incidents(equipment_id, estado);

CREATE UNIQUE INDEX uq_loan_equipment_active ON loan_equipment(equipment_id) WHERE returned_at IS NULL;

-- =========================================================================

-- SEED DATA MASIVO CON INVENTARIO COMPLETO (COMPUTADOR, MOUSE, TECLADO, ETC.)

-- =========================================================================

INSERT INTO users (id, email, nombre, rol, activo) VALUES

  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin.sena@sena.edu.co', 'Carlos Administrador', 'ADMIN', true),

  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'guarda.seguridad@sena.edu.co', 'Alberto Guarda', 'GUARDA', true),

  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'instructor.ti@sena.edu.co', 'Diana Instructor', 'INSTRUCTOR', true);

DO $$

DECLARE r_num INT; r_id UUID; b_name VARCHAR(50); i INT;

BEGIN

  FOR r_num IN 301..510 LOOP

    IF r_num <= 399 THEN b_name := 'Bloque 3';

    ELSIF r_num <= 499 THEN b_name := 'Bloque 4';

    ELSE b_name := 'Bloque 5';

    END IF;

    INSERT INTO rooms (nombre, bloque, capacidad_pcs, estado)

    VALUES ('Sala ' || r_num, b_name, 30, 'OPERATIVO') RETURNING id INTO r_id;

    FOR i IN 1..30 LOOP

      INSERT INTO equipment (placa_sena, codigo_activo, tipo, room_id, estado)

      VALUES

        ('SENA-PC-' || r_num || '-' || i, 'ACT-PC-' || r_num || '-' || i, 'COMPUTADOR', r_id, 'OPERATIVO'),

        ('SENA-MS-' || r_num || '-' || i, 'ACT-MS-' || r_num || '-' || i, 'MOUSE', r_id, 'OPERATIVO'),

        ('SENA-TC-' || r_num || '-' || i, 'ACT-TC-' || r_num || '-' || i, 'TECLADO', r_id, 'OPERATIVO'),

        ('SENA-CR-' || r_num || '-' || i, 'ACT-CR-' || r_num || '-' || i, 'CARGADOR', r_id, 'OPERATIVO');

    END LOOP;

    -- 2 Televisores y controles por sala

    FOR i IN 1..2 LOOP

      INSERT INTO equipment (placa_sena, codigo_activo, tipo, room_id, estado)

      VALUES

        ('SENA-TV-' || r_num || '-' || i, 'ACT-TV-' || r_num || '-' || i, 'TELEVISOR', r_id, 'OPERATIVO'),

        ('SENA-CTRL-' || r_num || '-' || i, 'ACT-CTRL-' || r_num || '-' || i, 'CONTROL_TV', r_id, 'OPERATIVO');

    END LOOP;

  END LOOP;

END $$;