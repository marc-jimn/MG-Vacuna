-- =============================================================
-- 1. RELACIÓN PERSONAL - ROL
-- =============================================================

ALTER TABLE personal ADD COLUMN IF NOT EXISTS rol_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_personal_rol'
          AND conrelid = 'personal'::regclass
    ) THEN
        ALTER TABLE personal
            ADD CONSTRAINT fk_personal_rol
            FOREIGN KEY (rol_id) REFERENCES rol(id)
            ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END $$;

-- =============================================================
-- 2. RELACIÓN CAMPAÑAS - PERSONAL
-- =============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_campania_responsable'
          AND conrelid = 'campanias'::regclass
    ) THEN
        ALTER TABLE campanias
            ADD CONSTRAINT fk_campania_responsable
            FOREIGN KEY (responsable_id) REFERENCES personal(id)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- =============================================================
-- 3. RELACIÓN VEHÍCULOS - PERSONAL
-- =============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_vehiculos_conductor'
          AND conrelid = 'vehiculos'::regclass
    ) THEN
        ALTER TABLE vehiculos
            ADD CONSTRAINT fk_vehiculos_conductor
            FOREIGN KEY (conductor_id) REFERENCES personal(id);
    END IF;
END $$;

-- =============================================================
-- 4. RELACIÓN CAMPAÑAS - LOCALIDADES
-- =============================================================

CREATE TABLE IF NOT EXISTS campanias_localidades (
    campania_id BIGINT NOT NULL,
    localidad_id BIGINT NOT NULL,
    CONSTRAINT pk_campanias_localidades PRIMARY KEY (campania_id, localidad_id),
    CONSTRAINT fk_cl_campania FOREIGN KEY (campania_id)
        REFERENCES campanias(id) ON DELETE CASCADE,
    CONSTRAINT fk_cl_localidad FOREIGN KEY (localidad_id)
        REFERENCES localidades(id) ON DELETE CASCADE
);

-- =============================================================
-- 5. RELACIÓN BRIGADAS - INTEGRANTES
-- =============================================================

BEGIN

CREATE TABLE public.brigada_integrantes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brigada_id BIGINT NOT NULL,
    campania_id BIGINT NOT NULL,
    personal_id BIGINT NOT NULL,

    funcion VARCHAR(20) NOT NULL
        CHECK (
            funcion IN (
                'responsable',
                'medico',
                'enfermero',
                'conductor'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bi_brigada
        FOREIGN KEY (brigada_id, campania_id)
        REFERENCES public.brigadas(id, campania_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bi_personal
        FOREIGN KEY (personal_id)
        REFERENCES public.personal(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_brigada_personal
        UNIQUE (brigada_id, personal_id)
);

CREATE UNIQUE INDEX uq_brigada_funcion_individual
ON public.brigada_integrantes (
    brigada_id,
    funcion
)
WHERE funcion IN (
    'responsable',
    'medico',
    'conductor'
);

COMMIT

-- =============================================================
-- 6. RELACIÓN BRIGADAS - LOCALIDADES
-- =============================================================

CREATE TABLE public.brigada_localidades (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campania_id BIGINT NOT NULL,
    brigada_id BIGINT NOT NULL,
    localidad_id BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bl_brigada
        FOREIGN KEY (brigada_id, campania_id)
        REFERENCES public.brigadas(id, campania_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_bl_campania_localidad
        FOREIGN KEY (campania_id, localidad_id)
        REFERENCES public.campanias_localidades(
            campania_id,
            localidad_id
        )
        ON DELETE RESTRICT,

    CONSTRAINT uq_localidad_por_campania
        UNIQUE (campania_id, localidad_id)
);

-- =============================================================
-- ÍNDICES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_personal_rol_id ON personal(rol_id);

CREATE INDEX IF NOT EXISTS idx_campanias_estado ON campanias(estado);
CREATE INDEX IF NOT EXISTS idx_campanias_responsable ON campanias(responsable_id);
CREATE INDEX IF NOT EXISTS idx_campanias_categoria ON campanias(categoria);

CREATE INDEX IF NOT EXISTS idx_localidades_ubicacion ON localidades USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_cl_localidad ON campanias_localidades(localidad_id);

CREATE INDEX idx_brigada_integrantes_personal ON public.brigada_integrantes(personal_id);
CREATE INDEX idx_brigada_integrantes_brigada ON public.brigada_integrantes(brigada_id);

CREATE INDEX idx_brigadas_campania ON public.brigadas(campania_id);
CREATE INDEX idx_brigada_localidades_brigada ON public.brigada_localidades(brigada_id);

CREATE INDEX idx_puntos_vacunacion_localidad ON public.puntos_vacunacion(localidad_id);
CREATE INDEX idx_puntos_vacunacion_ubicacion ON public.puntos_vacunacion USING GIST (ubicacion);

CREATE INDEX idx_visitas_brigada_localidad ON public.visitas(brigada_localidad_id);
CREATE INDEX idx_visita_jornadas_visita ON public.visita_jornadas(visita_id);
CREATE INDEX idx_visita_jornadas_punto ON public.visita_jornadas(punto_vacunacion_id);
CREATE INDEX idx_visita_jornadas_fechas ON public.visita_jornadas(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_recorridos_geometria ON public.recorridos USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_recorridos_origen ON public.recorridos (origen_id);

CREATE INDEX IF NOT EXISTS idx_mov_insumos_insumo_fecha ON movimientos_insumos (insumo_id, fecha_operacion DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_feed ON notificaciones (fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_pendientes ON notificaciones (fecha_creacion DESC)
    WHERE leida_at IS NULL AND resuelta_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_notificacion_activa_clave ON notificaciones (clave_deduplicacion)
    WHERE clave_deduplicacion IS NOT NULL AND resuelta_at IS NULL;

-- =============================================================
-- COMENTARIOS
-- =============================================================

COMMENT ON TABLE public.brigadas IS
'Equipos de trabajo asignados a una campaña de vacunación.';

COMMENT ON TABLE public.brigada_integrantes IS
'Personal que integra cada brigada y función que desempeña.';

COMMENT ON TABLE public.brigada_localidades IS
'Localidades asignadas a cada brigada dentro de una campaña.';

COMMENT ON COLUMN public.brigada_integrantes.funcion IS
'Responsable, médico, enfermero o conductor.';

COMMENT ON COLUMN public.brigadas.capacidad_personal IS
'Cada brigada está integrada por cinco personas.';

COMMENT ON COLUMN public.brigadas.estado IS
'Disponible, asignada, en_ruta, en_visita, terminada o cancelada.';

COMMENT ON TABLE public.puntos_vacunacion IS
'Catálogo de centros de salud, escuelas, parques y otros lugares donde se realizan jornadas de vacunación.';

COMMENT ON TABLE public.visitas IS
'Agrupación de jornadas de vacunación de una brigada en una localidad asignada.';

COMMENT ON TABLE public.visita_jornadas IS
'Programación de cada punto de vacunación con fechas, horarios, dosis asignadas y objetivo.';

COMMENT ON COLUMN public.puntos_vacunacion.ubicacion IS
'Coordenadas geográficas del punto de vacunación. Se utilizarán para calcular recorridos.';

COMMENT ON COLUMN public.visita_jornadas.fecha_inicio IS
'Primer día del periodo de atención en el punto de vacunación.';

COMMENT ON COLUMN public.visita_jornadas.fecha_fin IS
'Último día del periodo de atención en el punto de vacunación.';

COMMENT ON COLUMN public.visita_jornadas.dosis_asignadas IS
'Dosis asignadas a este punto de vacunación para el periodo indicado.';