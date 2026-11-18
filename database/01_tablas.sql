-- =============================================================
-- EXTENSIONES NECESARIAS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- PERSONAL
-- =============================================================

CREATE TABLE personal (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_empleado VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(150) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    curp VARCHAR(18) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(150),
    foto TEXT,
    fecha_nacimiento DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_personal_estado

        CHECK (estado IN ('activo', 'vacaciones', 'baja'))
);

-- =============================================================
-- ROL
-- =============================================================

CREATE TABLE IF NOT EXISTS rol (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL
);

-- =============================================================
-- CAMPAÑAS
-- =============================================================

CREATE TABLE IF NOT EXISTS campanias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(20) NOT NULL DEFAULT 'humana',
    icono VARCHAR(100),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dosis_asignadas INTEGER NOT NULL DEFAULT 0,
    objetivo_dosis INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'planeada',
    responsable_id BIGINT,

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_campania_fechas
        CHECK (fecha_fin >= fecha_inicio),

    CONSTRAINT chk_campania_dosis_asignadas
        CHECK (dosis_asignadas >= 0),

    CONSTRAINT chk_campania_objetivo
        CHECK (objetivo_dosis >= 0),

    CONSTRAINT chk_campania_estado
        CHECK (
            estado IN (
                'activa',
                'planeada',
                'finalizada',
                'cancelada'
            )
        ),

    CONSTRAINT chk_campania_categoria
        CHECK (categoria IN ('veterinaria', 'humana'))
);

-- =============================================================
-- LOCALIDADES
-- =============================================================

CREATE TABLE localidades (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(30),
    municipio VARCHAR(120) NOT NULL DEFAULT 'Tuxtla Gutiérrez',
    estado VARCHAR(120) NOT NULL DEFAULT 'Chiapas',
    codigo_postal VARCHAR(10),
    poblacion INTEGER,
    ubicacion GEOGRAPHY(Point, 4326),
    color_marcador VARCHAR(7) NOT NULL DEFAULT '#2878B8',
    activa BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_localidad_poblacion
        CHECK (poblacion IS NULL OR poblacion >= 0),

    CONSTRAINT chk_localidad_tipo
        CHECK (
            tipo IS NULL OR

            tipo IN (
                'localidad',
                'colonia',
                'barrio',
                'ejido',
                'rancheria',
                'otro'
            )
        ),

    CONSTRAINT chk_localidad_color
        CHECK (color_marcador ~ '^#[0-9A-Fa-f]{6}$')
);

-- =============================================================
-- VEHICULOS
-- =============================================================

CREATE TABLE vehiculos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_economico VARCHAR(30) NOT NULL UNIQUE,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio INTEGER,
    placas VARCHAR(20) UNIQUE,
    color VARCHAR(40),
    capacidad_personas INTEGER,
    kilometraje INTEGER NOT NULL DEFAULT 0,
    foto TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
    conductor_id BIGINT,

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_vehiculos_estado
        CHECK (
            estado IN (
                'disponible',
                'en_uso',
                'mantenimiento',
                'fuera_servicio'
            )
        ),

    CONSTRAINT chk_vehiculos_anio
        CHECK (anio IS NULL OR anio BETWEEN 1980 AND 2100),

    CONSTRAINT chk_vehiculos_capacidad
        CHECK (capacidad_personas IS NULL OR capacidad_personas > 0),

    CONSTRAINT chk_vehiculos_kilometraje
        CHECK (kilometraje >= 0)
);

-- =============================================================
-- BIOLÓGICOS
-- =============================================================

BEGIN;

CREATE TABLE public.biologicos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(220) NOT NULL,
    nombre_corto VARCHAR(100) NOT NULL,
    fabricante VARCHAR(180),
    presentacion VARCHAR(100) NOT NULL,

    dosis_por_envase SMALLINT NOT NULL
        CHECK (dosis_por_envase > 0),

    temperatura_min_c NUMERIC(5,2),
    temperatura_max_c NUMERIC(5,2),

    stock_minimo_dosis INTEGER NOT NULL DEFAULT 0
        CHECK (stock_minimo_dosis >= 0),

    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('humano', 'veterinario')),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_temperatura_biologico
        CHECK (
            temperatura_min_c IS NULL
            OR temperatura_max_c IS NULL
            OR temperatura_min_c <= temperatura_max_c
        )
);

CREATE TABLE public.campanias_biologicos (
    campania_id BIGINT NOT NULL,
    biologico_id BIGINT NOT NULL,

    dosis_asignadas INTEGER NOT NULL DEFAULT 0
        CHECK (dosis_asignadas >= 0),

    objetivo_dosis INTEGER NOT NULL DEFAULT 0
        CHECK (objetivo_dosis >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_campanias_biologicos
        PRIMARY KEY (campania_id, biologico_id),

    CONSTRAINT fk_cb_campania
        FOREIGN KEY (campania_id)
        REFERENCES public.campanias(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cb_biologico
        FOREIGN KEY (biologico_id)
        REFERENCES public.biologicos(id)
        ON DELETE RESTRICT
);


CREATE INDEX idx_campanias_biologicos_biologico
    ON public.campanias_biologicos(biologico_id);

COMMENT ON TABLE public.biologicos IS
'Catálogo general de vacunas y otros biológicos humanos y veterinarios.';

COMMENT ON COLUMN public.biologicos.stock_minimo_dosis IS
'Stock mínimo expresado en dosis, no en envases.';

COMMENT ON TABLE public.campanias_biologicos IS
'Biológicos asociados a cada campaña y cantidades correspondientes.';

COMMIT;

-- =============================================================
-- BRIGADAS
-- =============================================================

CREATE TABLE public.brigadas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campania_id BIGINT NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,

    estado VARCHAR(20) NOT NULL DEFAULT 'disponible'
        CHECK (
            estado IN (
                'disponible',
                'asignada',
                'en_ruta',
                'en_visita',
                'terminada',
                'cancelada'
            )
        ),

    capacidad_personal SMALLINT NOT NULL DEFAULT 5
        CHECK (capacidad_personal = 5),

    dosis_asignadas INTEGER NOT NULL DEFAULT 0
        CHECK (dosis_asignadas >= 0),

    objetivo_dosis INTEGER NOT NULL DEFAULT 0
        CHECK (objetivo_dosis >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_brigadas_campania
        FOREIGN KEY (campania_id)
        REFERENCES public.campanias(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_brigadas_codigo_campania
        UNIQUE (campania_id, codigo),

    CONSTRAINT uq_brigadas_id_campania
        UNIQUE (id, campania_id)
);

-- =====================================================
-- VISITAS
-- =====================================================

BEGIN;

CREATE TABLE public.puntos_vacunacion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    localidad_id BIGINT NOT NULL,
    nombre VARCHAR(180) NOT NULL,
    direccion TEXT,
    referencia TEXT,
    ubicacion GEOGRAPHY(Point, 4326),
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_puntos_localidad
        FOREIGN KEY (localidad_id)
        REFERENCES public.localidades(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_punto_por_localidad
        UNIQUE (localidad_id, nombre)

);

CREATE TABLE public.visitas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brigada_localidad_id BIGINT NOT NULL,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'planeada'
        CHECK (
            estado IN (
                'planeada',
                'activa',
                'completada',
                'cancelada'
            )
        ),

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_visitas_brigada_localidad
        FOREIGN KEY (brigada_localidad_id)
        REFERENCES public.brigada_localidades(id)
        ON DELETE CASCADE

);

CREATE TABLE public.visita_jornadas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visita_id BIGINT NOT NULL,
    punto_vacunacion_id BIGINT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    dosis_asignadas INTEGER NOT NULL DEFAULT 0
        CHECK (dosis_asignadas >= 0),

    objetivo_dosis INTEGER NOT NULL DEFAULT 0
        CHECK (objetivo_dosis >= 0),

    estado VARCHAR(20) NOT NULL DEFAULT 'programada'
        CHECK (
            estado IN (
                'programada',
                'en_curso',
                'completada',
                'cancelada'
            )
        ),

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_jornadas_visita
        FOREIGN KEY (visita_id)
        REFERENCES public.visitas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_jornadas_punto
        FOREIGN KEY (punto_vacunacion_id)
        REFERENCES public.puntos_vacunacion(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_jornada_fechas
        CHECK (fecha_fin >= fecha_inicio),

    CONSTRAINT chk_jornada_horarios
        CHECK (hora_fin > hora_inicio)
);

COMMIT

-- =====================================================
-- CATÁLOGO DE ORÍGENES DE RECORRIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.origenes_recorrido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(180) NOT NULL,
    direccion TEXT,
    referencia TEXT,
	
    municipio VARCHAR(120) NOT NULL
        DEFAULT 'Tuxtla Gutiérrez',

    estado VARCHAR(120) NOT NULL
        DEFAULT 'Chiapas',

    codigo_postal VARCHAR(10),
    ubicacion GEOGRAPHY(Point, 4326) NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_origen_recorrido_principal
ON public.origenes_recorrido (es_principal)
WHERE es_principal = TRUE;

-- =====================================================
-- RECORRIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recorridos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visita_jornada_id BIGINT NOT NULL,
    origen_id BIGINT NOT NULL,
    geometria GEOMETRY(Geometry, 4326),
    distancia_m NUMERIC(12, 2),
    duracion_seg INTEGER,
    modo_transporte VARCHAR(20) NOT NULL DEFAULT 'driving',
    proveedor VARCHAR(50),
    instrucciones JSONB,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    error_detalle TEXT,
    calculado_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_recorrido_jornada
        UNIQUE (visita_jornada_id),

    CONSTRAINT fk_recorrido_jornada
        FOREIGN KEY (visita_jornada_id)
        REFERENCES public.visita_jornadas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recorrido_origen
        FOREIGN KEY (origen_id)
        REFERENCES public.origenes_recorrido(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_recorrido_distancia
        CHECK (
            distancia_m IS NULL OR distancia_m >= 0
        ),

    CONSTRAINT chk_recorrido_duracion
        CHECK (
            duracion_seg IS NULL OR duracion_seg >= 0
        ),

    CONSTRAINT chk_recorrido_modo
        CHECK (
            modo_transporte IN (
                'driving',
                'walking',
                'cycling'
            )
        ),

    CONSTRAINT chk_recorrido_estado
        CHECK (
            estado IN (
                'pendiente',
                'calculado',
                'error'
            )
        )
    );

-- =============================================================
-- INVENTARIO
-- =============================================================

BEGIN;

ALTER TABLE campanias_biologicos
    ADD COLUMN IF NOT EXISTS stock_minimo INTEGER NOT NULL DEFAULT 0
    CHECK (stock_minimo >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS uq_campanias_biologicos_campania_biologico
    ON campanias_biologicos (campania_id, biologico_id);

CREATE TABLE IF NOT EXISTS inventario_biologico_lotes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campania_id BIGINT NOT NULL,
    biologico_id BIGINT NOT NULL,
    codigo_lote VARCHAR(80) NOT NULL,
    fabricante VARCHAR(180) NOT NULL,
    fecha_caducidad DATE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_lote_campania_biologico FOREIGN KEY (campania_id, biologico_id)
        REFERENCES campanias_biologicos (campania_id, biologico_id) ON DELETE RESTRICT,
    CONSTRAINT uq_lote_por_campania_biologico UNIQUE (campania_id, biologico_id, codigo_lote)
);

CREATE TABLE IF NOT EXISTS movimientos_biologicos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lote_id BIGINT NOT NULL REFERENCES inventario_biologico_lotes(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(32) NOT NULL CHECK (tipo_movimiento IN (
        'recepcion_campania',
        'recepcion_programada',
        'entrega_brigada',
        'entrega_visita',
        'entrega_jornada',
        'aplicacion',
        'devolucion_jornada',
        'devolucion_visita',
        'devolucion_brigada',
        'devolucion_campania',
        'merma',
        'ajuste_entrada',
        'ajuste_salida'
    )),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    brigada_id BIGINT REFERENCES brigadas(id) ON DELETE RESTRICT,
    visita_id BIGINT REFERENCES visitas(id) ON DELETE RESTRICT,
    visita_jornada_id BIGINT REFERENCES visita_jornadas(id) ON DELETE RESTRICT,
    fecha_operacion DATE NOT NULL DEFAULT CURRENT_DATE,
    persona_entrega VARCHAR(180),
    persona_recibe VARCHAR(180),
    observaciones TEXT,
    clave_registro VARCHAR(120) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_movimiento_biologico_nivel CHECK (
        (tipo_movimiento IN ('recepcion_campania', 'recepcion_programada', 'devolucion_campania', 'ajuste_entrada', 'ajuste_salida')
            AND brigada_id IS NULL AND visita_id IS NULL AND visita_jornada_id IS NULL)
        OR
        (tipo_movimiento IN ('entrega_brigada', 'devolucion_brigada')
            AND brigada_id IS NOT NULL AND visita_id IS NULL AND visita_jornada_id IS NULL)
        OR
        (tipo_movimiento IN ('entrega_visita', 'devolucion_visita')
            AND brigada_id IS NULL AND visita_id IS NOT NULL AND visita_jornada_id IS NULL)
        OR
        (tipo_movimiento IN ('entrega_jornada', 'aplicacion', 'devolucion_jornada', 'merma')
            AND brigada_id IS NULL AND visita_id IS NULL AND visita_jornada_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_mov_biologicos_lote_fecha
    ON movimientos_biologicos (lote_id, fecha_operacion DESC);
CREATE INDEX IF NOT EXISTS idx_mov_biologicos_jornada
    ON movimientos_biologicos (visita_jornada_id)
    WHERE visita_jornada_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mov_biologicos_visita
    ON movimientos_biologicos (visita_id)
    WHERE visita_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mov_biologicos_brigada
    ON movimientos_biologicos (brigada_id)
    WHERE brigada_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS insumos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(180) NOT NULL UNIQUE,
    unidad VARCHAR(40) NOT NULL,
    stock_minimo NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    stock_objetivo_reposicion NUMERIC(14,2),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_insumo_objetivo_reposicion CHECK (stock_objetivo_reposicion IS NULL OR stock_objetivo_reposicion >= stock_minimo)
);

CREATE TABLE IF NOT EXISTS movimientos_insumos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    insumo_id BIGINT NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(24) NOT NULL CHECK (tipo_movimiento IN (
        'entrada', 'salida', 'ajuste_positivo', 'ajuste_negativo'
    )),
    cantidad NUMERIC(14,2) NOT NULL CHECK (cantidad > 0),
    fecha_operacion DATE NOT NULL DEFAULT CURRENT_DATE,
    responsable VARCHAR(180),
    observaciones TEXT,
    clave_registro VARCHAR(120) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- NOTIFICACIONES
-- =============================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo VARCHAR(60) NOT NULL,
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN (
        'biologicos', 'insumos', 'campanias', 'brigadas', 'visitas', 'general'
    )),
    severidad VARCHAR(16) NOT NULL CHECK (severidad IN (
        'info', 'success', 'warning', 'danger'
    )),
    titulo VARCHAR(180) NOT NULL,
    mensaje TEXT NOT NULL,
    campania_id BIGINT REFERENCES campanias(id) ON DELETE SET NULL,
    visita_id BIGINT REFERENCES visitas(id) ON DELETE SET NULL,
    visita_jornada_id BIGINT REFERENCES visita_jornadas(id) ON DELETE SET NULL,
    lote_id BIGINT REFERENCES inventario_biologico_lotes(id) ON DELETE SET NULL,
    insumo_id BIGINT REFERENCES insumos(id) ON DELETE SET NULL,
    movimiento_biologico_id BIGINT REFERENCES movimientos_biologicos(id) ON DELETE SET NULL,
    movimiento_insumo_id BIGINT REFERENCES movimientos_insumos(id) ON DELETE SET NULL,
    clave_deduplicacion VARCHAR(160),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    leida_at TIMESTAMPTZ,
    resuelta_at TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

BEGIN

CREATE OR REPLACE VIEW vw_existencias_insumos AS
SELECT
    i.id AS insumo_id,
    i.codigo,
    i.nombre,
    i.unidad,
    i.stock_minimo,
    i.stock_objetivo_reposicion,
    COALESCE(SUM(
        CASE
            WHEN mi.tipo_movimiento IN ('entrada', 'ajuste_positivo') THEN mi.cantidad
            WHEN mi.tipo_movimiento IN ('salida', 'ajuste_negativo') THEN -mi.cantidad
            ELSE 0
        END
    ), 0)::NUMERIC(14,2) AS existencia_actual,
    MAX(mi.fecha_operacion) FILTER (WHERE mi.tipo_movimiento = 'entrada') AS ultimo_reabastecimiento,
    GREATEST(COALESCE(i.stock_objetivo_reposicion, i.stock_minimo) - COALESCE(SUM(
        CASE
            WHEN mi.tipo_movimiento IN ('entrada', 'ajuste_positivo') THEN mi.cantidad
            WHEN mi.tipo_movimiento IN ('salida', 'ajuste_negativo') THEN -mi.cantidad
            ELSE 0
        END
    ), 0), 0)::NUMERIC(14,2) AS cantidad_sugerida_reponer,
    (COALESCE(SUM(
        CASE
            WHEN mi.tipo_movimiento IN ('entrada', 'ajuste_positivo') THEN mi.cantidad
            WHEN mi.tipo_movimiento IN ('salida', 'ajuste_negativo') THEN -mi.cantidad
            ELSE 0
        END
    ), 0) < i.stock_minimo) AS bajo_stock_minimo
FROM insumos i
LEFT JOIN movimientos_insumos mi ON mi.insumo_id = i.id
GROUP BY i.id, i.codigo, i.nombre, i.unidad, i.stock_minimo, i.stock_objetivo_reposicion;

CREATE OR REPLACE VIEW vw_conciliacion_jornadas_biologicas AS
WITH contexto AS (
    SELECT
        c.id AS campania_id,
        c.codigo AS campania_codigo,
        b.id AS brigada_id,
        b.codigo AS brigada_codigo,
        v.id AS visita_id,
        v.codigo AS visita_codigo,
        vj.id AS visita_jornada_id,
        vj.fecha_inicio,
        vj.fecha_fin,
        vj.estado AS jornada_estado,
        vj.dosis_asignadas,
        vj.objetivo_dosis,
        pv.id AS punto_id,
        pv.nombre AS punto_nombre
    FROM visita_jornadas vj
    JOIN visitas v ON v.id = vj.visita_id
    JOIN brigada_localidades bl ON bl.id = v.brigada_localidad_id
    JOIN brigadas b ON b.id = bl.brigada_id
    JOIN campanias c ON c.id = b.campania_id
    LEFT JOIN puntos_vacunacion pv ON pv.id = vj.punto_vacunacion_id
), movimientos AS (
    SELECT
        m.visita_jornada_id,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_jornada'), 0) AS dosis_entregadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'aplicacion'), 0) AS dosis_aplicadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_jornada'), 0) AS dosis_devueltas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'merma'), 0) AS dosis_merma
    FROM movimientos_biologicos m
    WHERE m.visita_jornada_id IS NOT NULL
    GROUP BY m.visita_jornada_id
), conciliacion AS (
    SELECT
        x.*,
        COALESCE(m.dosis_entregadas, 0) AS dosis_entregadas,
        COALESCE(m.dosis_aplicadas, 0) AS dosis_aplicadas,
        COALESCE(m.dosis_devueltas, 0) AS dosis_devueltas,
        COALESCE(m.dosis_merma, 0) AS dosis_merma,
        COALESCE(m.dosis_entregadas, 0)
            - COALESCE(m.dosis_aplicadas, 0)
            - COALESCE(m.dosis_devueltas, 0)
            - COALESCE(m.dosis_merma, 0) AS diferencia
    FROM contexto x
    LEFT JOIN movimientos m ON m.visita_jornada_id = x.visita_jornada_id
)
SELECT
    conciliacion.*,
    GREATEST(diferencia, 0) AS dosis_sin_justificar,
    GREATEST(-diferencia, 0) AS exceso_registrado,
    CASE
        WHEN dosis_entregadas = 0 THEN 'sin_entrega'
        WHEN diferencia = 0 THEN 'cuadrado'
        WHEN diferencia > 0 THEN 'faltante'
        ELSE 'exceso_registrado'
    END AS estado_conciliacion
FROM conciliacion;

CREATE OR REPLACE VIEW vw_resumen_inventario_biologico_campanias AS
WITH plan AS (
    SELECT
        cb.campania_id,
        cb.biologico_id,
        COALESCE(SUM(vj.dosis_asignadas), 0) AS dosis_asignadas,
        COALESCE(SUM(vj.objetivo_dosis), 0) AS objetivo_vacunacion
    FROM campanias_biologicos cb
    LEFT JOIN brigadas b ON b.campania_id = cb.campania_id
    LEFT JOIN brigada_localidades bl ON bl.brigada_id = b.id
    LEFT JOIN visitas v ON v.brigada_localidad_id = bl.id
    LEFT JOIN visita_jornadas vj ON vj.visita_id = v.id
    GROUP BY cb.campania_id, cb.biologico_id
), mov AS (
    SELECT
        l.campania_id,
        l.biologico_id,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'recepcion_campania'), 0) AS dosis_recibidas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'recepcion_programada'), 0) AS dosis_programadas_recibir,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_brigada'), 0) AS entregadas_a_brigadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_visita'), 0) AS entregadas_a_visitas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_jornada'), 0) AS entregadas_a_jornadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'aplicacion'), 0) AS dosis_aplicadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_jornada'), 0) AS devueltas_por_jornadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_visita'), 0) AS devueltas_por_visitas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_brigada'), 0) AS devueltas_por_brigadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_campania'), 0) AS devueltas_a_campania,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'merma'), 0) AS dosis_merma,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'ajuste_entrada'), 0) AS ajustes_entrada,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'ajuste_salida'), 0) AS ajustes_salida
    FROM movimientos_biologicos m
    JOIN inventario_biologico_lotes l ON l.id = m.lote_id
    GROUP BY l.campania_id, l.biologico_id
), conciliacion AS (
    SELECT
        c.campania_id,
        SUM(c.dosis_sin_justificar) AS dosis_sin_justificar,
        SUM(c.exceso_registrado) AS exceso_registrado
    FROM vw_conciliacion_jornadas_biologicas c
    GROUP BY c.campania_id
)
SELECT
    ca.id AS campania_id,
    ca.codigo AS campania_codigo,
    ca.nombre AS campania_nombre,
    bio.id AS biologico_id,
    bio.codigo AS biologico_codigo,
    bio.nombre AS biologico_nombre,
    cb.stock_minimo,
    COALESCE(p.dosis_asignadas, 0) AS dosis_asignadas,
    COALESCE(p.objetivo_vacunacion, 0) AS objetivo_vacunacion,
    COALESCE(m.dosis_recibidas, 0) AS dosis_recibidas,
    COALESCE(m.dosis_programadas_recibir, 0) AS dosis_programadas_recibir,
    COALESCE(m.dosis_recibidas, 0) + COALESCE(m.dosis_programadas_recibir, 0) - COALESCE(p.dosis_asignadas, 0) AS reserva_proyectada,
    GREATEST(COALESCE(p.dosis_asignadas, 0) + cb.stock_minimo - COALESCE(m.dosis_recibidas, 0) - COALESCE(m.dosis_programadas_recibir, 0), 0) AS dosis_faltantes_para_plan_y_reserva,
    (COALESCE(m.dosis_recibidas, 0) + COALESCE(m.dosis_programadas_recibir, 0) - COALESCE(p.dosis_asignadas, 0) < cb.stock_minimo) AS bajo_stock_minimo,
    COALESCE(m.entregadas_a_brigadas, 0) AS entregadas_a_brigadas,
    COALESCE(m.entregadas_a_visitas, 0) AS entregadas_a_visitas,
    COALESCE(m.entregadas_a_jornadas, 0) AS entregadas_a_jornadas,
    COALESCE(m.dosis_aplicadas, 0) AS dosis_aplicadas,
    COALESCE(m.devueltas_por_jornadas, 0) AS devueltas_por_jornadas,
    COALESCE(m.devueltas_por_visitas, 0) AS devueltas_por_visitas,
    COALESCE(m.devueltas_por_brigadas, 0) AS devueltas_por_brigadas,
    COALESCE(m.devueltas_a_campania, 0) AS devueltas_a_campania,
    COALESCE(m.dosis_merma, 0) AS dosis_merma,
    COALESCE(co.dosis_sin_justificar, 0) AS dosis_sin_justificar,
    COALESCE(co.exceso_registrado, 0) AS exceso_registrado,
    COALESCE(m.dosis_recibidas, 0)
        + COALESCE(m.devueltas_a_campania, 0)
        + COALESCE(m.ajustes_entrada, 0)
        - COALESCE(m.entregadas_a_brigadas, 0)
        - COALESCE(m.ajustes_salida, 0) AS existencia_en_campania
FROM campanias_biologicos cb
JOIN campanias ca ON ca.id = cb.campania_id
JOIN biologicos bio ON bio.id = cb.biologico_id
LEFT JOIN plan p ON p.campania_id = cb.campania_id AND p.biologico_id = cb.biologico_id
LEFT JOIN mov m ON m.campania_id = cb.campania_id AND m.biologico_id = cb.biologico_id
LEFT JOIN conciliacion co ON co.campania_id = cb.campania_id;

COMMIT;

-------------------------------------------------------------------------------
-------------------------------------------------------------------------------

BEGIN;

CREATE OR REPLACE VIEW vw_resumen_inventario_biologico_campanias AS
WITH plan AS (
    SELECT
        cb.campania_id,
        cb.biologico_id,
        COALESCE(SUM(vj.dosis_asignadas), 0) AS dosis_asignadas,
        COALESCE(SUM(vj.objetivo_dosis), 0) AS objetivo_vacunacion
    FROM campanias_biologicos cb
    LEFT JOIN brigadas b ON b.campania_id = cb.campania_id
    LEFT JOIN brigada_localidades bl ON bl.brigada_id = b.id
    LEFT JOIN visitas v ON v.brigada_localidad_id = bl.id
    LEFT JOIN visita_jornadas vj ON vj.visita_id = v.id
    GROUP BY cb.campania_id, cb.biologico_id
), mov AS (
    SELECT
        l.campania_id,
        l.biologico_id,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'recepcion_campania'), 0) AS dosis_recibidas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'recepcion_programada'), 0) AS dosis_programadas_recibir,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_brigada'), 0) AS entregadas_a_brigadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_visita'), 0) AS entregadas_a_visitas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_jornada'), 0) AS entregadas_a_jornadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'aplicacion'), 0) AS dosis_aplicadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_jornada'), 0) AS devueltas_por_jornadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_visita'), 0) AS devueltas_por_visitas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_brigada'), 0) AS devueltas_por_brigadas,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_campania'), 0) AS devueltas_a_campania,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'merma'), 0) AS dosis_merma,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'ajuste_entrada'), 0) AS ajustes_entrada,
        COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'ajuste_salida'), 0) AS ajustes_salida
    FROM movimientos_biologicos m
    JOIN inventario_biologico_lotes l ON l.id = m.lote_id
    GROUP BY l.campania_id, l.biologico_id
), conciliacion AS (
    SELECT
        c.campania_id,
        SUM(c.dosis_sin_justificar) AS dosis_sin_justificar,
        SUM(c.exceso_registrado) AS exceso_registrado
    FROM vw_conciliacion_jornadas_biologicas c
    GROUP BY c.campania_id
)
SELECT
    ca.id AS campania_id,
    ca.codigo AS campania_codigo,
    ca.nombre AS campania_nombre,
    bio.id AS biologico_id,
    bio.codigo AS biologico_codigo,
    bio.nombre AS biologico_nombre,
    cb.stock_minimo,
    COALESCE(p.dosis_asignadas, 0) AS dosis_asignadas,
    COALESCE(p.objetivo_vacunacion, 0) AS objetivo_vacunacion,
    COALESCE(m.dosis_recibidas, 0) AS dosis_recibidas,
    COALESCE(m.dosis_programadas_recibir, 0) AS dosis_programadas_recibir,
    COALESCE(m.dosis_recibidas, 0) + COALESCE(m.dosis_programadas_recibir, 0) - COALESCE(p.dosis_asignadas, 0) AS reserva_proyectada,
    GREATEST(COALESCE(p.dosis_asignadas, 0) + cb.stock_minimo - COALESCE(m.dosis_recibidas, 0) - COALESCE(m.dosis_programadas_recibir, 0), 0) AS dosis_faltantes_para_plan_y_reserva,
    (COALESCE(m.dosis_recibidas, 0) + COALESCE(m.dosis_programadas_recibir, 0) - COALESCE(p.dosis_asignadas, 0) < cb.stock_minimo) AS bajo_stock_minimo,
    COALESCE(m.entregadas_a_brigadas, 0) AS entregadas_a_brigadas,
    COALESCE(m.entregadas_a_visitas, 0) AS entregadas_a_visitas,
    COALESCE(m.entregadas_a_jornadas, 0) AS entregadas_a_jornadas,
    COALESCE(m.dosis_aplicadas, 0) AS dosis_aplicadas,
    COALESCE(m.devueltas_por_jornadas, 0) AS devueltas_por_jornadas,
    COALESCE(m.devueltas_por_visitas, 0) AS devueltas_por_visitas,
    COALESCE(m.devueltas_por_brigadas, 0) AS devueltas_por_brigadas,
    COALESCE(m.devueltas_a_campania, 0) AS devueltas_a_campania,
    COALESCE(m.dosis_merma, 0) AS dosis_merma,
    COALESCE(co.dosis_sin_justificar, 0) AS dosis_sin_justificar,
    COALESCE(co.exceso_registrado, 0) AS exceso_registrado,
    COALESCE(m.dosis_recibidas, 0)
        + COALESCE(m.devueltas_por_brigadas, 0)
        + COALESCE(m.ajustes_entrada, 0)
        - COALESCE(m.entregadas_a_brigadas, 0)
        - COALESCE(m.devueltas_a_campania, 0)
        - COALESCE(m.ajustes_salida, 0) AS existencia_en_campania
FROM campanias_biologicos cb
JOIN campanias ca ON ca.id = cb.campania_id
JOIN biologicos bio ON bio.id = cb.biologico_id
LEFT JOIN plan p ON p.campania_id = cb.campania_id AND p.biologico_id = cb.biologico_id
LEFT JOIN mov m ON m.campania_id = cb.campania_id AND m.biologico_id = cb.biologico_id
LEFT JOIN conciliacion co ON co.campania_id = cb.campania_id;

COMMIT;