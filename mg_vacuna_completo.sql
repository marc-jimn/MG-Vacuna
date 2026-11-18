--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: generar_numero_empleado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generar_numero_empleado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.numero_empleado IS NULL OR NEW.numero_empleado = '' THEN
        NEW.numero_empleado := 'EMP-' || LPAD(
            nextval('personal_numero_seq')::TEXT, 3, '0'
        );
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: biologicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.biologicos (
    id bigint NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(220) NOT NULL,
    nombre_corto character varying(100) NOT NULL,
    fabricante character varying(180),
    presentacion character varying(100) NOT NULL,
    dosis_por_envase smallint NOT NULL,
    temperatura_min_c numeric(5,2),
    temperatura_max_c numeric(5,2),
    stock_minimo_dosis integer DEFAULT 0 NOT NULL,
    tipo character varying(20) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT biologicos_dosis_por_envase_check CHECK ((dosis_por_envase > 0)),
    CONSTRAINT biologicos_stock_minimo_dosis_check CHECK ((stock_minimo_dosis >= 0)),
    CONSTRAINT biologicos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['humano'::character varying, 'veterinario'::character varying])::text[]))),
    CONSTRAINT chk_temperatura_biologico CHECK (((temperatura_min_c IS NULL) OR (temperatura_max_c IS NULL) OR (temperatura_min_c <= temperatura_max_c)))
);


--
-- Name: TABLE biologicos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.biologicos IS 'Catálogo general de vacunas y otros biológicos humanos y veterinarios.';


--
-- Name: COLUMN biologicos.stock_minimo_dosis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.biologicos.stock_minimo_dosis IS 'Stock mínimo expresado en dosis, no en envases.';


--
-- Name: biologicos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.biologicos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.biologicos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: brigada_integrantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brigada_integrantes (
    id bigint NOT NULL,
    brigada_id bigint NOT NULL,
    campania_id bigint NOT NULL,
    personal_id bigint NOT NULL,
    funcion character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT brigada_integrantes_funcion_check CHECK (((funcion)::text = ANY ((ARRAY['responsable'::character varying, 'medico'::character varying, 'enfermero'::character varying, 'conductor'::character varying])::text[])))
);


--
-- Name: TABLE brigada_integrantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.brigada_integrantes IS 'Personal que integra cada brigada y función que desempeña.';


--
-- Name: COLUMN brigada_integrantes.funcion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.brigada_integrantes.funcion IS 'Responsable, médico, enfermero o conductor.';


--
-- Name: brigada_integrantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.brigada_integrantes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.brigada_integrantes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: brigada_localidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brigada_localidades (
    id bigint NOT NULL,
    campania_id bigint NOT NULL,
    brigada_id bigint NOT NULL,
    localidad_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE brigada_localidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.brigada_localidades IS 'Localidades asignadas a cada brigada dentro de una campaña.';


--
-- Name: brigada_localidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.brigada_localidades ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.brigada_localidades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: brigadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brigadas (
    id bigint NOT NULL,
    campania_id bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(120) NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    capacidad_personal smallint DEFAULT 5 NOT NULL,
    dosis_asignadas integer DEFAULT 0 NOT NULL,
    objetivo_dosis integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT brigadas_capacidad_personal_check CHECK ((capacidad_personal = 5)),
    CONSTRAINT brigadas_dosis_asignadas_check CHECK ((dosis_asignadas >= 0)),
    CONSTRAINT brigadas_estado_check CHECK (((estado)::text = ANY ((ARRAY['disponible'::character varying, 'asignada'::character varying, 'en_ruta'::character varying, 'en_visita'::character varying, 'terminada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT brigadas_objetivo_dosis_check CHECK ((objetivo_dosis >= 0))
);


--
-- Name: TABLE brigadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.brigadas IS 'Equipos de trabajo asignados a una campaña de vacunación.';


--
-- Name: COLUMN brigadas.estado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.brigadas.estado IS 'Disponible, asignada, en_ruta, en_visita, terminada o cancelada.';


--
-- Name: COLUMN brigadas.capacidad_personal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.brigadas.capacidad_personal IS 'Cada brigada está integrada por cinco personas.';


--
-- Name: brigadas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.brigadas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.brigadas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: campanias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campanias (
    id bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    categoria character varying(20) DEFAULT 'humana'::character varying NOT NULL,
    icono character varying(100),
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    dosis_asignadas integer DEFAULT 0 NOT NULL,
    objetivo_dosis integer DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'planeada'::character varying NOT NULL,
    responsable_id bigint,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_campania_categoria CHECK (((categoria)::text = ANY ((ARRAY['veterinaria'::character varying, 'humana'::character varying])::text[]))),
    CONSTRAINT chk_campania_dosis_asignadas CHECK ((dosis_asignadas >= 0)),
    CONSTRAINT chk_campania_estado CHECK (((estado)::text = ANY ((ARRAY['activa'::character varying, 'planeada'::character varying, 'finalizada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT chk_campania_fechas CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT chk_campania_objetivo CHECK ((objetivo_dosis >= 0))
);


--
-- Name: campanias_biologicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campanias_biologicos (
    campania_id bigint NOT NULL,
    biologico_id bigint NOT NULL,
    dosis_asignadas integer DEFAULT 0 NOT NULL,
    objetivo_dosis integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    stock_minimo integer DEFAULT 0 NOT NULL,
    CONSTRAINT campanias_biologicos_dosis_asignadas_check CHECK ((dosis_asignadas >= 0)),
    CONSTRAINT campanias_biologicos_objetivo_dosis_check CHECK ((objetivo_dosis >= 0)),
    CONSTRAINT campanias_biologicos_stock_minimo_check CHECK ((stock_minimo >= 0))
);


--
-- Name: TABLE campanias_biologicos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.campanias_biologicos IS 'Biológicos asociados a cada campaña y cantidades correspondientes.';


--
-- Name: campanias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.campanias ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.campanias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: campanias_localidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campanias_localidades (
    campania_id bigint NOT NULL,
    localidad_id bigint NOT NULL
);


--
-- Name: insumos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insumos (
    id bigint NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(180) NOT NULL,
    unidad character varying(40) NOT NULL,
    stock_minimo numeric(14,2) DEFAULT 0 NOT NULL,
    stock_objetivo_reposicion numeric(14,2),
    activo boolean DEFAULT true NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_insumo_objetivo_reposicion CHECK (((stock_objetivo_reposicion IS NULL) OR (stock_objetivo_reposicion >= stock_minimo))),
    CONSTRAINT insumos_stock_minimo_check CHECK ((stock_minimo >= (0)::numeric))
);


--
-- Name: insumos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.insumos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.insumos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inventario_biologico_lotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventario_biologico_lotes (
    id bigint NOT NULL,
    campania_id bigint NOT NULL,
    biologico_id bigint NOT NULL,
    codigo_lote character varying(80) NOT NULL,
    fabricante character varying(180) NOT NULL,
    fecha_caducidad date NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventario_biologico_lotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.inventario_biologico_lotes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.inventario_biologico_lotes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: localidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.localidades (
    id bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(150) NOT NULL,
    tipo character varying(30),
    municipio character varying(120) DEFAULT 'Tuxtla Gutiérrez'::character varying NOT NULL,
    estado character varying(120) DEFAULT 'Chiapas'::character varying NOT NULL,
    codigo_postal character varying(10),
    poblacion integer,
    ubicacion public.geography(Point,4326),
    color_marcador character varying(7) DEFAULT '#2878B8'::character varying NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_localidad_color CHECK (((color_marcador)::text ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT chk_localidad_poblacion CHECK (((poblacion IS NULL) OR (poblacion >= 0))),
    CONSTRAINT chk_localidad_tipo CHECK (((tipo IS NULL) OR ((tipo)::text = ANY ((ARRAY['localidad'::character varying, 'colonia'::character varying, 'barrio'::character varying, 'ejido'::character varying, 'rancheria'::character varying, 'otro'::character varying])::text[]))))
);


--
-- Name: localidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.localidades ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.localidades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: movimientos_biologicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_biologicos (
    id bigint NOT NULL,
    lote_id bigint NOT NULL,
    tipo_movimiento character varying(32) NOT NULL,
    cantidad integer NOT NULL,
    brigada_id bigint,
    visita_id bigint,
    visita_jornada_id bigint,
    fecha_operacion date DEFAULT CURRENT_DATE NOT NULL,
    persona_entrega character varying(180),
    persona_recibe character varying(180),
    observaciones text,
    clave_registro character varying(120),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_movimiento_biologico_nivel CHECK (((((tipo_movimiento)::text = ANY ((ARRAY['recepcion_campania'::character varying, 'recepcion_programada'::character varying, 'devolucion_campania'::character varying, 'ajuste_entrada'::character varying, 'ajuste_salida'::character varying])::text[])) AND (brigada_id IS NULL) AND (visita_id IS NULL) AND (visita_jornada_id IS NULL)) OR (((tipo_movimiento)::text = ANY ((ARRAY['entrega_brigada'::character varying, 'devolucion_brigada'::character varying])::text[])) AND (brigada_id IS NOT NULL) AND (visita_id IS NULL) AND (visita_jornada_id IS NULL)) OR (((tipo_movimiento)::text = ANY ((ARRAY['entrega_visita'::character varying, 'devolucion_visita'::character varying])::text[])) AND (brigada_id IS NULL) AND (visita_id IS NOT NULL) AND (visita_jornada_id IS NULL)) OR (((tipo_movimiento)::text = ANY ((ARRAY['entrega_jornada'::character varying, 'aplicacion'::character varying, 'devolucion_jornada'::character varying, 'merma'::character varying])::text[])) AND (brigada_id IS NULL) AND (visita_id IS NULL) AND (visita_jornada_id IS NOT NULL)))),
    CONSTRAINT movimientos_biologicos_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT movimientos_biologicos_tipo_movimiento_check CHECK (((tipo_movimiento)::text = ANY ((ARRAY['recepcion_campania'::character varying, 'recepcion_programada'::character varying, 'entrega_brigada'::character varying, 'entrega_visita'::character varying, 'entrega_jornada'::character varying, 'aplicacion'::character varying, 'devolucion_jornada'::character varying, 'devolucion_visita'::character varying, 'devolucion_brigada'::character varying, 'devolucion_campania'::character varying, 'merma'::character varying, 'ajuste_entrada'::character varying, 'ajuste_salida'::character varying])::text[])))
);


--
-- Name: movimientos_biologicos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.movimientos_biologicos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.movimientos_biologicos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: movimientos_insumos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_insumos (
    id bigint NOT NULL,
    insumo_id bigint NOT NULL,
    tipo_movimiento character varying(24) NOT NULL,
    cantidad numeric(14,2) NOT NULL,
    fecha_operacion date DEFAULT CURRENT_DATE NOT NULL,
    responsable character varying(180),
    observaciones text,
    clave_registro character varying(120),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT movimientos_insumos_cantidad_check CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT movimientos_insumos_tipo_movimiento_check CHECK (((tipo_movimiento)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying, 'ajuste_positivo'::character varying, 'ajuste_negativo'::character varying])::text[])))
);


--
-- Name: movimientos_insumos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.movimientos_insumos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.movimientos_insumos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id bigint NOT NULL,
    tipo character varying(60) NOT NULL,
    categoria character varying(30) NOT NULL,
    severidad character varying(16) NOT NULL,
    titulo character varying(180) NOT NULL,
    mensaje text NOT NULL,
    campania_id bigint,
    visita_id bigint,
    visita_jornada_id bigint,
    lote_id bigint,
    insumo_id bigint,
    movimiento_biologico_id bigint,
    movimiento_insumo_id bigint,
    clave_deduplicacion character varying(160),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    leida_at timestamp with time zone,
    resuelta_at timestamp with time zone,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notificaciones_categoria_check CHECK (((categoria)::text = ANY ((ARRAY['biologicos'::character varying, 'insumos'::character varying, 'campanias'::character varying, 'brigadas'::character varying, 'visitas'::character varying, 'general'::character varying])::text[]))),
    CONSTRAINT notificaciones_severidad_check CHECK (((severidad)::text = ANY ((ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'danger'::character varying])::text[])))
);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notificaciones ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: origenes_recorrido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.origenes_recorrido (
    id bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(180) NOT NULL,
    direccion text,
    referencia text,
    municipio character varying(120) DEFAULT 'Tuxtla Gutiérrez'::character varying NOT NULL,
    estado character varying(120) DEFAULT 'Chiapas'::character varying NOT NULL,
    codigo_postal character varying(10),
    ubicacion public.geography(Point,4326) NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: origenes_recorrido_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.origenes_recorrido ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.origenes_recorrido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: permiso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permiso (
    id bigint NOT NULL,
    clave character varying(100) NOT NULL,
    descripcion text
);


--
-- Name: permiso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.permiso ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.permiso_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: personal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal (
    id bigint NOT NULL,
    numero_empleado character varying(20) NOT NULL,
    nombres character varying(150) NOT NULL,
    apellido_paterno character varying(100) NOT NULL,
    apellido_materno character varying(100),
    curp character varying(18) NOT NULL,
    telefono character varying(20),
    correo character varying(150),
    foto text,
    fecha_nacimiento date,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rol_id bigint,
    CONSTRAINT chk_personal_estado CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'vacaciones'::character varying, 'baja'::character varying])::text[])))
);


--
-- Name: personal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.personal ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.personal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: personal_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: puntos_vacunacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.puntos_vacunacion (
    id bigint NOT NULL,
    localidad_id bigint NOT NULL,
    nombre character varying(180) NOT NULL,
    direccion text,
    referencia text,
    ubicacion public.geography(Point,4326),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE puntos_vacunacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.puntos_vacunacion IS 'Catálogo de centros de salud, escuelas, parques y otros lugares donde se realizan jornadas de vacunación.';


--
-- Name: COLUMN puntos_vacunacion.ubicacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.puntos_vacunacion.ubicacion IS 'Coordenadas geográficas del punto de vacunación. Se utilizarán para calcular recorridos.';


--
-- Name: puntos_vacunacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.puntos_vacunacion ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.puntos_vacunacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: recorridos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recorridos (
    id bigint NOT NULL,
    visita_jornada_id bigint NOT NULL,
    origen_id bigint NOT NULL,
    geometria public.geometry(Geometry,4326),
    distancia_m numeric(12,2),
    duracion_seg integer,
    modo_transporte character varying(20) DEFAULT 'driving'::character varying NOT NULL,
    proveedor character varying(50),
    instrucciones jsonb,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    error_detalle text,
    calculado_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_recorrido_distancia CHECK (((distancia_m IS NULL) OR (distancia_m >= (0)::numeric))),
    CONSTRAINT chk_recorrido_duracion CHECK (((duracion_seg IS NULL) OR (duracion_seg >= 0))),
    CONSTRAINT chk_recorrido_estado CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'calculado'::character varying, 'error'::character varying])::text[]))),
    CONSTRAINT chk_recorrido_modo CHECK (((modo_transporte)::text = ANY ((ARRAY['driving'::character varying, 'walking'::character varying, 'cycling'::character varying])::text[])))
);


--
-- Name: recorridos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.recorridos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.recorridos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text NOT NULL
);


--
-- Name: rol_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rol ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rol_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rol_permiso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol_permiso (
    rol_id bigint NOT NULL,
    permiso_id bigint NOT NULL
);


--
-- Name: telegram_codigos_vinculacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_codigos_vinculacion (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    codigo_hash character(64) NOT NULL,
    expira_at timestamp with time zone NOT NULL,
    consumido_at timestamp with time zone,
    creado_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: telegram_codigos_vinculacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.telegram_codigos_vinculacion ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.telegram_codigos_vinculacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: telegram_consultas_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_consultas_auditoria (
    id bigint NOT NULL,
    usuario_id bigint,
    telegram_user_id character varying(30) NOT NULL,
    pregunta text NOT NULL,
    resultado character varying(40) NOT NULL,
    creado_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: telegram_consultas_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.telegram_consultas_auditoria ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.telegram_consultas_auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: telegram_vinculaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_vinculaciones (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    telegram_user_id character varying(30) NOT NULL,
    chat_id character varying(30) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    vinculado_at timestamp with time zone DEFAULT now() NOT NULL,
    revocado_at timestamp with time zone
);


--
-- Name: telegram_vinculaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.telegram_vinculaciones ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.telegram_vinculaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    personal_id bigint NOT NULL,
    username character varying(60) NOT NULL,
    correo character varying(150) NOT NULL,
    password_hash text NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    debe_cambiar_password boolean DEFAULT true NOT NULL,
    ultimo_acceso timestamp with time zone,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_usuarios_estado CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying, 'bloqueado'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vehiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos (
    id bigint NOT NULL,
    numero_economico character varying(30) NOT NULL,
    marca character varying(80) NOT NULL,
    modelo character varying(80) NOT NULL,
    anio integer,
    placas character varying(20),
    color character varying(40),
    capacidad_personas integer,
    kilometraje integer DEFAULT 0 NOT NULL,
    foto text,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    conductor_id bigint,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_vehiculos_anio CHECK (((anio IS NULL) OR ((anio >= 1980) AND (anio <= 2100)))),
    CONSTRAINT chk_vehiculos_capacidad CHECK (((capacidad_personas IS NULL) OR (capacidad_personas > 0))),
    CONSTRAINT chk_vehiculos_estado CHECK (((estado)::text = ANY ((ARRAY['disponible'::character varying, 'en_uso'::character varying, 'mantenimiento'::character varying, 'fuera_servicio'::character varying])::text[]))),
    CONSTRAINT chk_vehiculos_kilometraje CHECK ((kilometraje >= 0))
);


--
-- Name: vehiculos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vehiculos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vehiculos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: visita_jornadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visita_jornadas (
    id bigint NOT NULL,
    visita_id bigint NOT NULL,
    punto_vacunacion_id bigint NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    dosis_asignadas integer DEFAULT 0 NOT NULL,
    objetivo_dosis integer DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'programada'::character varying NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_jornada_fechas CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT chk_jornada_horarios CHECK ((hora_fin > hora_inicio)),
    CONSTRAINT visita_jornadas_dosis_asignadas_check CHECK ((dosis_asignadas >= 0)),
    CONSTRAINT visita_jornadas_estado_check CHECK (((estado)::text = ANY ((ARRAY['programada'::character varying, 'en_curso'::character varying, 'completada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT visita_jornadas_objetivo_dosis_check CHECK ((objetivo_dosis >= 0))
);


--
-- Name: TABLE visita_jornadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visita_jornadas IS 'Programación de cada punto de vacunación con fechas, horarios, dosis asignadas y objetivo.';


--
-- Name: COLUMN visita_jornadas.fecha_inicio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visita_jornadas.fecha_inicio IS 'Primer día del periodo de atención en el punto de vacunación.';


--
-- Name: COLUMN visita_jornadas.fecha_fin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visita_jornadas.fecha_fin IS 'Último día del periodo de atención en el punto de vacunación.';


--
-- Name: COLUMN visita_jornadas.dosis_asignadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.visita_jornadas.dosis_asignadas IS 'Dosis asignadas a este punto de vacunación para el periodo indicado.';


--
-- Name: visita_jornadas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.visita_jornadas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.visita_jornadas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: visitas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitas (
    id bigint NOT NULL,
    brigada_localidad_id bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(150) NOT NULL,
    estado character varying(20) DEFAULT 'planeada'::character varying NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT visitas_estado_check CHECK (((estado)::text = ANY ((ARRAY['planeada'::character varying, 'activa'::character varying, 'completada'::character varying, 'cancelada'::character varying])::text[])))
);


--
-- Name: TABLE visitas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visitas IS 'Agrupación de jornadas de vacunación de una brigada en una localidad asignada.';


--
-- Name: visitas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.visitas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.visitas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vw_conciliacion_jornadas_biologicas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_conciliacion_jornadas_biologicas AS
 WITH contexto AS (
         SELECT c.id AS campania_id,
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
           FROM (((((public.visita_jornadas vj
             JOIN public.visitas v ON ((v.id = vj.visita_id)))
             JOIN public.brigada_localidades bl ON ((bl.id = v.brigada_localidad_id)))
             JOIN public.brigadas b ON ((b.id = bl.brigada_id)))
             JOIN public.campanias c ON ((c.id = b.campania_id)))
             LEFT JOIN public.puntos_vacunacion pv ON ((pv.id = vj.punto_vacunacion_id)))
        ), movimientos AS (
         SELECT m.visita_jornada_id,
            COALESCE(sum(m.cantidad) FILTER (WHERE ((m.tipo_movimiento)::text = 'entrega_jornada'::text)), (0)::bigint) AS dosis_entregadas,
            COALESCE(sum(m.cantidad) FILTER (WHERE ((m.tipo_movimiento)::text = 'aplicacion'::text)), (0)::bigint) AS dosis_aplicadas,
            COALESCE(sum(m.cantidad) FILTER (WHERE ((m.tipo_movimiento)::text = 'devolucion_jornada'::text)), (0)::bigint) AS dosis_devueltas,
            COALESCE(sum(m.cantidad) FILTER (WHERE ((m.tipo_movimiento)::text = 'merma'::text)), (0)::bigint) AS dosis_merma
           FROM public.movimientos_biologicos m
          WHERE (m.visita_jornada_id IS NOT NULL)
          GROUP BY m.visita_jornada_id
        ), conciliacion AS (
         SELECT x.campania_id,
            x.campania_codigo,
            x.brigada_id,
            x.brigada_codigo,
            x.visita_id,
            x.visita_codigo,
            x.visita_jornada_id,
            x.fecha_inicio,
            x.fecha_fin,
            x.jornada_estado,
            x.dosis_asignadas,
            x.objetivo_dosis,
            x.punto_id,
            x.punto_nombre,
            COALESCE(m.dosis_entregadas, (0)::bigint) AS dosis_entregadas,
            COALESCE(m.dosis_aplicadas, (0)::bigint) AS dosis_aplicadas,
            COALESCE(m.dosis_devueltas, (0)::bigint) AS dosis_devueltas,
            COALESCE(m.dosis_merma, (0)::bigint) AS dosis_merma,
            (((COALESCE(m.dosis_entregadas, (0)::bigint) - COALESCE(m.dosis_aplicadas, (0)::bigint)) - COALESCE(m.dosis_devueltas, (0)::bigint)) - COALESCE(m.dosis_merma, (0)::bigint)) AS diferencia
           FROM (contexto x
             LEFT JOIN movimientos m ON ((m.visita_jornada_id = x.visita_jornada_id)))
        )
 SELECT campania_id,
    campania_codigo,
    brigada_id,
    brigada_codigo,
    visita_id,
    visita_codigo,
    visita_jornada_id,
    fecha_inicio,
    fecha_fin,
    jornada_estado,
    dosis_asignadas,
    objetivo_dosis,
    punto_id,
    punto_nombre,
    dosis_entregadas,
    dosis_aplicadas,
    dosis_devueltas,
    dosis_merma,
    diferencia,
    GREATEST(diferencia, (0)::bigint) AS dosis_sin_justificar,
    GREATEST((- diferencia), (0)::bigint) AS exceso_registrado,
        CASE
            WHEN (dosis_entregadas = 0) THEN 'sin_entrega'::text
            WHEN (diferencia = 0) THEN 'cuadrado'::text
            WHEN (diferencia > 0) THEN 'faltante'::text
            ELSE 'exceso_registrado'::text
        END AS estado_conciliacion
   FROM conciliacion;


--
-- Name: vw_existencias_insumos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_existencias_insumos AS
 SELECT i.id AS insumo_id,
    i.codigo,
    i.nombre,
    i.unidad,
    i.stock_minimo,
    i.stock_objetivo_reposicion,
    (COALESCE(sum(
        CASE
            WHEN ((mi.tipo_movimiento)::text = ANY ((ARRAY['entrada'::character varying, 'ajuste_positivo'::character varying])::text[])) THEN mi.cantidad
            WHEN ((mi.tipo_movimiento)::text = ANY ((ARRAY['salida'::character varying, 'ajuste_negativo'::character varying])::text[])) THEN (- mi.cantidad)
            ELSE (0)::numeric
        END), (0)::numeric))::numeric(14,2) AS existencia_actual,
    max(mi.fecha_operacion) FILTER (WHERE ((mi.tipo_movimiento)::text = 'entrada'::text)) AS ultimo_reabastecimiento,
    (GREATEST((COALESCE(i.stock_objetivo_reposicion, i.stock_minimo) - COALESCE(sum(
        CASE
            WHEN ((mi.tipo_movimiento)::text = ANY ((ARRAY['entrada'::character varying, 'ajuste_positivo'::character varying])::text[])) THEN mi.cantidad
            WHEN ((mi.tipo_movimiento)::text = ANY ((ARRAY['salida'::character varying, 'ajuste_negativo'::character varying])::text[])) THEN (- mi.cantidad)
            ELSE (0)::numeric
        END), (0)::numeric)), (0)::numeric))::numeric(14,2) AS cantidad_sugerida_reponer,
    (COALESCE(sum(
        CASE
            WHEN ((mi.tipo_movimiento)::text = ANY ((ARRAY['entrada'::character varying, 'ajuste_positivo'::character varying])::text[])) THEN mi.cantidad
            WHEN ((mi.tipo_movimiento)::text = ANY ((ARRAY['salida'::character varying, 'ajuste_negativo'::character varying])::text[])) THEN (- mi.cantidad)
            ELSE (0)::numeric
        END), (0)::numeric) < i.stock_minimo) AS bajo_stock_minimo
   FROM (public.insumos i
     LEFT JOIN public.movimientos_insumos mi ON ((mi.insumo_id = i.id)))
  GROUP BY i.id, i.codigo, i.nombre, i.unidad, i.stock_minimo, i.stock_objetivo_reposicion;


--
-- Name: vw_resumen_inventario_biologico_campanias; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_resumen_inventario_biologico_campanias AS
 WITH plan AS (
         SELECT cb_1.campania_id,
            cb_1.biologico_id,
            COALESCE(sum(vj.dosis_asignadas), (0)::bigint) AS dosis_asignadas,
            COALESCE(sum(vj.objetivo_dosis), (0)::bigint) AS objetivo_vacunacion
           FROM ((((public.campanias_biologicos cb_1
             LEFT JOIN public.brigadas b ON ((b.campania_id = cb_1.campania_id)))
             LEFT JOIN public.brigada_localidades bl ON ((bl.brigada_id = b.id)))
             LEFT JOIN public.visitas v ON ((v.brigada_localidad_id = bl.id)))
             LEFT JOIN public.visita_jornadas vj ON ((vj.visita_id = v.id)))
          GROUP BY cb_1.campania_id, cb_1.biologico_id
        ), mov AS (
         SELECT l.campania_id,
            l.biologico_id,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'recepcion_campania'::text)), (0)::bigint) AS dosis_recibidas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'recepcion_programada'::text)), (0)::bigint) AS dosis_programadas_recibir,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'entrega_brigada'::text)), (0)::bigint) AS entregadas_a_brigadas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'entrega_visita'::text)), (0)::bigint) AS entregadas_a_visitas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'entrega_jornada'::text)), (0)::bigint) AS entregadas_a_jornadas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'aplicacion'::text)), (0)::bigint) AS dosis_aplicadas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'devolucion_jornada'::text)), (0)::bigint) AS devueltas_por_jornadas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'devolucion_visita'::text)), (0)::bigint) AS devueltas_por_visitas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'devolucion_brigada'::text)), (0)::bigint) AS devueltas_por_brigadas,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'devolucion_campania'::text)), (0)::bigint) AS devueltas_a_campania,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'merma'::text)), (0)::bigint) AS dosis_merma,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'ajuste_entrada'::text)), (0)::bigint) AS ajustes_entrada,
            COALESCE(sum(m_1.cantidad) FILTER (WHERE ((m_1.tipo_movimiento)::text = 'ajuste_salida'::text)), (0)::bigint) AS ajustes_salida
           FROM (public.movimientos_biologicos m_1
             JOIN public.inventario_biologico_lotes l ON ((l.id = m_1.lote_id)))
          GROUP BY l.campania_id, l.biologico_id
        ), conciliacion AS (
         SELECT c.campania_id,
            sum(c.dosis_sin_justificar) AS dosis_sin_justificar,
            sum(c.exceso_registrado) AS exceso_registrado
           FROM public.vw_conciliacion_jornadas_biologicas c
          GROUP BY c.campania_id
        )
 SELECT ca.id AS campania_id,
    ca.codigo AS campania_codigo,
    ca.nombre AS campania_nombre,
    bio.id AS biologico_id,
    bio.codigo AS biologico_codigo,
    bio.nombre AS biologico_nombre,
    cb.stock_minimo,
    COALESCE(p.dosis_asignadas, (0)::bigint) AS dosis_asignadas,
    COALESCE(p.objetivo_vacunacion, (0)::bigint) AS objetivo_vacunacion,
    COALESCE(m.dosis_recibidas, (0)::bigint) AS dosis_recibidas,
    COALESCE(m.dosis_programadas_recibir, (0)::bigint) AS dosis_programadas_recibir,
    ((COALESCE(m.dosis_recibidas, (0)::bigint) + COALESCE(m.dosis_programadas_recibir, (0)::bigint)) - COALESCE(p.dosis_asignadas, (0)::bigint)) AS reserva_proyectada,
    GREATEST((((COALESCE(p.dosis_asignadas, (0)::bigint) + cb.stock_minimo) - COALESCE(m.dosis_recibidas, (0)::bigint)) - COALESCE(m.dosis_programadas_recibir, (0)::bigint)), (0)::bigint) AS dosis_faltantes_para_plan_y_reserva,
    (((COALESCE(m.dosis_recibidas, (0)::bigint) + COALESCE(m.dosis_programadas_recibir, (0)::bigint)) - COALESCE(p.dosis_asignadas, (0)::bigint)) < cb.stock_minimo) AS bajo_stock_minimo,
    COALESCE(m.entregadas_a_brigadas, (0)::bigint) AS entregadas_a_brigadas,
    COALESCE(m.entregadas_a_visitas, (0)::bigint) AS entregadas_a_visitas,
    COALESCE(m.entregadas_a_jornadas, (0)::bigint) AS entregadas_a_jornadas,
    COALESCE(m.dosis_aplicadas, (0)::bigint) AS dosis_aplicadas,
    COALESCE(m.devueltas_por_jornadas, (0)::bigint) AS devueltas_por_jornadas,
    COALESCE(m.devueltas_por_visitas, (0)::bigint) AS devueltas_por_visitas,
    COALESCE(m.devueltas_por_brigadas, (0)::bigint) AS devueltas_por_brigadas,
    COALESCE(m.devueltas_a_campania, (0)::bigint) AS devueltas_a_campania,
    COALESCE(m.dosis_merma, (0)::bigint) AS dosis_merma,
    COALESCE(co.dosis_sin_justificar, (0)::numeric) AS dosis_sin_justificar,
    COALESCE(co.exceso_registrado, (0)::numeric) AS exceso_registrado,
    (((((COALESCE(m.dosis_recibidas, (0)::bigint) + COALESCE(m.devueltas_por_brigadas, (0)::bigint)) + COALESCE(m.ajustes_entrada, (0)::bigint)) - COALESCE(m.entregadas_a_brigadas, (0)::bigint)) - COALESCE(m.devueltas_a_campania, (0)::bigint)) - COALESCE(m.ajustes_salida, (0)::bigint)) AS existencia_en_campania
   FROM (((((public.campanias_biologicos cb
     JOIN public.campanias ca ON ((ca.id = cb.campania_id)))
     JOIN public.biologicos bio ON ((bio.id = cb.biologico_id)))
     LEFT JOIN plan p ON (((p.campania_id = cb.campania_id) AND (p.biologico_id = cb.biologico_id))))
     LEFT JOIN mov m ON (((m.campania_id = cb.campania_id) AND (m.biologico_id = cb.biologico_id))))
     LEFT JOIN conciliacion co ON ((co.campania_id = cb.campania_id)));


--
-- Data for Name: biologicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.biologicos (id, codigo, nombre, nombre_corto, fabricante, presentacion, dosis_por_envase, temperatura_min_c, temperatura_max_c, stock_minimo_dosis, tipo, activo, created_at, updated_at) FROM stdin;
1	BIO-INF	Vacuna contra Influenza	Influenza	Sanofi Pasteur	Jeringa prellenada	1	2.00	8.00	100	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
2	BIO-SRP	Vacuna contra el sarampión, la rubéola y la parotiditis	SRP	Merck Sharp & Dohme (MSD)	Frasco unidosis	1	2.00	8.00	80	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
3	BIO-TD	Vacuna contra el tétanos y la difteria	TD	BIRMEX	Frasco multidosis	10	2.00	8.00	80	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
4	BIO-COVID	Vacuna contra la enfermedad por coronavirus 2019	COVID-19	Pfizer	Frasco multidosis	6	2.00	8.00	60	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
5	BIO-BCG	Vacuna contra la tuberculosis meníngea	BCG	AJ Vaccines	Frasco multidosis	10	2.00	8.00	50	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
6	BIO-NEUMO	Vacuna contra la enfermedad neumocócica	Neumococo	Pfizer	Jeringa prellenada	1	2.00	8.00	30	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
7	BIO-VPH	Vacuna contra el virus del papiloma humano	VPH	Merck Sharp & Dohme (MSD)	Jeringa prellenada	1	2.00	8.00	20	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
8	BIO-HEPB	Vacuna contra la hepatitis B	Hepatitis B	Merck Sharp & Dohme (MSD)	Frasco unidosis	1	2.00	8.00	30	humano	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
9	BIO-RAB	Vacuna antirrábica para perros y gatos	Rabia	MSD Animal Health	Frasco multidosis	10	2.00	8.00	100	veterinario	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
10	BIO-PARVO	Vacuna contra el parvovirus canino	Parvovirus	Zoetis	Frasco unidosis	1	2.00	8.00	50	veterinario	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
11	BIO-MOQ	Vacuna contra el moquillo canino	Moquillo	MSD Animal Health	Frasco unidosis	1	2.00	8.00	50	veterinario	t	2026-11-18 02:37:35.361288+00	2026-11-18 02:37:35.361288+00
\.


--
-- Data for Name: brigada_integrantes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brigada_integrantes (id, brigada_id, campania_id, personal_id, funcion, created_at) FROM stdin;
1	1	6	26	conductor	2026-11-18 02:37:35.363824+00
2	1	6	6	enfermero	2026-11-18 02:37:35.363824+00
3	1	6	27	enfermero	2026-11-18 02:37:35.363824+00
4	1	6	24	medico	2026-11-18 02:37:35.363824+00
5	1	6	23	responsable	2026-11-18 02:37:35.363824+00
6	2	6	16	conductor	2026-11-18 02:37:35.363824+00
7	2	6	25	enfermero	2026-11-18 02:37:35.363824+00
8	2	6	13	enfermero	2026-11-18 02:37:35.363824+00
9	2	6	33	medico	2026-11-18 02:37:35.363824+00
10	2	6	8	responsable	2026-11-18 02:37:35.363824+00
11	3	7	14	conductor	2026-11-18 02:37:35.363824+00
12	3	7	28	enfermero	2026-11-18 02:37:35.363824+00
13	3	7	37	enfermero	2026-11-18 02:37:35.363824+00
14	3	7	20	medico	2026-11-18 02:37:35.363824+00
15	3	7	23	responsable	2026-11-18 02:37:35.363824+00
16	4	7	7	conductor	2026-11-18 02:37:35.363824+00
17	4	7	9	enfermero	2026-11-18 02:37:35.363824+00
18	4	7	40	enfermero	2026-11-18 02:37:35.363824+00
19	4	7	19	medico	2026-11-18 02:37:35.363824+00
20	4	7	12	responsable	2026-11-18 02:37:35.363824+00
21	5	7	26	conductor	2026-11-18 02:37:35.363824+00
22	5	7	10	enfermero	2026-11-18 02:37:35.363824+00
23	5	7	4	enfermero	2026-11-18 02:37:35.363824+00
24	5	7	3	medico	2026-11-18 02:37:35.363824+00
25	5	7	8	responsable	2026-11-18 02:37:35.363824+00
26	6	10	16	conductor	2026-11-18 02:37:35.363824+00
27	6	10	18	enfermero	2026-11-18 02:37:35.363824+00
28	6	10	36	enfermero	2026-11-18 02:37:35.363824+00
29	6	10	20	medico	2026-11-18 02:37:35.363824+00
30	6	10	12	responsable	2026-11-18 02:37:35.363824+00
31	7	10	26	conductor	2026-11-18 02:37:35.363824+00
32	7	10	30	enfermero	2026-11-18 02:37:35.363824+00
33	7	10	5	enfermero	2026-11-18 02:37:35.363824+00
34	7	10	31	medico	2026-11-18 02:37:35.363824+00
35	7	10	23	responsable	2026-11-18 02:37:35.363824+00
36	8	10	7	conductor	2026-11-18 02:37:35.363824+00
37	8	10	29	enfermero	2026-11-18 02:37:35.363824+00
38	8	10	11	enfermero	2026-11-18 02:37:35.363824+00
39	8	10	3	medico	2026-11-18 02:37:35.363824+00
40	8	10	8	responsable	2026-11-18 02:37:35.363824+00
41	9	10	14	conductor	2026-11-18 02:37:35.363824+00
42	9	10	32	enfermero	2026-11-18 02:37:35.363824+00
43	9	10	15	enfermero	2026-11-18 02:37:35.363824+00
44	9	10	19	medico	2026-11-18 02:37:35.363824+00
45	9	10	12	responsable	2026-11-18 02:37:35.363824+00
46	10	10	7	conductor	2026-11-18 02:37:35.363824+00
47	10	10	34	enfermero	2026-11-18 02:37:35.363824+00
48	10	10	22	enfermero	2026-11-18 02:37:35.363824+00
49	10	10	24	medico	2026-11-18 02:37:35.363824+00
50	10	10	8	responsable	2026-11-18 02:37:35.363824+00
\.


--
-- Data for Name: brigada_localidades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brigada_localidades (id, campania_id, brigada_id, localidad_id, created_at) FROM stdin;
1	6	1	1	2026-11-18 02:37:35.365465+00
2	6	2	2	2026-11-18 02:37:35.365465+00
3	7	3	4	2026-11-18 02:37:35.365465+00
4	7	3	3	2026-11-18 02:37:35.365465+00
5	7	4	6	2026-11-18 02:37:35.365465+00
6	7	4	5	2026-11-18 02:37:35.365465+00
7	7	5	2	2026-11-18 02:37:35.365465+00
8	10	6	7	2026-11-18 02:37:35.365465+00
9	10	7	10	2026-11-18 02:37:35.365465+00
10	10	7	1	2026-11-18 02:37:35.365465+00
11	10	8	3	2026-11-18 02:37:35.365465+00
12	10	9	4	2026-11-18 02:37:35.365465+00
13	10	9	8	2026-11-18 02:37:35.365465+00
14	10	10	9	2026-11-18 02:37:35.365465+00
\.


--
-- Data for Name: brigadas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brigadas (id, campania_id, codigo, nombre, descripcion, estado, capacidad_personal, dosis_asignadas, objetivo_dosis, created_at, updated_at) FROM stdin;
1	6	BRI-001	Brigada VPH Esperanza	Equipo de vacunación encargado de realizar jornadas de inmunización contra el virus del papiloma humano en instituciones educativas, promoviendo la prevención de infecciones y cánceres asociados.	disponible	5	1039	945	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
2	6	BRI-002	Brigada Juvenil Saludable	Brigada enfocada en la aplicación de vacunas contra el VPH a estudiantes, brindando orientación sobre la importancia de la vacunación y la prevención de enfermedades relacionadas.	disponible	5	611	555	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
3	7	BRI-003	Brigada Comunitaria Antigripal	Brigada móvil responsable de acercar los servicios de vacunación contra la influenza a diferentes colonias y comunidades, facilitando el acceso a la población en general.	disponible	5	1579	1436	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
4	7	BRI-004	Brigada Invierno Seguro	Equipo encargado de realizar jornadas de vacunación contra la influenza en centros de salud y espacios comunitarios, priorizando la protección de la población durante la temporada invernal.	disponible	5	971	882	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
5	7	BRI-005	Brigada Salud Materno Infantil	Equipo enfocado en la vacunación de mujeres embarazadas, niños y población infantil, promoviendo la protección contra la influenza y reduciendo los riesgos de complicaciones.	disponible	5	750	682	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
6	10	BRI-006	Brigada Patitas Protegidas	Equipo veterinario encargado de aplicar vacunas antirrábicas a perros y gatos, promoviendo la tenencia responsable y la prevención de la rabia.	disponible	5	2566	2333	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
7	10	BRI-007	Brigada Guardianes de la Rabia	Equipo responsable de ejecutar acciones de vacunación preventiva para perros y gatos, contribuyendo al control de la rabia y a la protección de la salud pública.	disponible	5	2065	1877	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
8	10	BRI-008	Brigada Huellitas Saludables	Brigada móvil dedicada a realizar jornadas gratuitas de vacunación antirrábica para mascotas en colonias y espacios públicos, acercando los servicios veterinarios a la comunidad.	disponible	5	1446	1314	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
9	10	BRI-009	Brigada Amigos de Cuatro Patas	Brigada encargada de recorrer diferentes sectores de la ciudad mediante unidades móviles para proporcionar vacunación antirrábica gratuita y orientación a los propietarios de mascotas.	disponible	5	1756	1597	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
10	10	BRI-010	Brigada Huellas de Esperanza	Brigada veterinaria móvil encargada de realizar jornadas gratuitas de vacunación antirrábica para perros y gatos en colonias y comunidades, promoviendo la tenencia responsable de mascotas y contribuyendo a la prevención de la rabia y la protección de la salud pública.	disponible	5	967	879	2026-11-18 02:37:35.363056+00	2026-11-18 02:37:35.363056+00
\.


--
-- Data for Name: campanias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campanias (id, codigo, nombre, descripcion, categoria, icono, fecha_inicio, fecha_fin, dosis_asignadas, objetivo_dosis, estado, responsable_id, fecha_creacion, fecha_actualizacion) FROM stdin;
1	CAM-001	Unidos contra el sarampión 2025-2026	Vacunación para prevenir brotes de sarampión y recuperar esquemas incompletos de la población.	humana	\N	2025-09-24	2026-04-30	5200	4800	finalizada	2	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
2	CAM-002	Vacunación invernal 2025-2026	Aplicación de vacunas contra influenza, COVID-19 y neumococo a población prioritaria.	humana	\N	2025-10-13	2026-03-03	0	0	cancelada	17	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
3	CAM-003	Semana Nacional de Vacunación 2026	Aplicación y actualización de esquemas básicos de vacunación en niños, adolescentes y adultos.	humana	\N	2026-04-25	2026-05-02	2100	1850	finalizada	2	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
4	CAM-004	Vacunación Tdpa y Td	Aplicación de vacunas contra tétanos, difteria y tosferina, especialmente a embarazadas y personas con esquemas incompletos.	humana	\N	2026-06-01	2026-07-31	4800	4300	finalizada	38	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
5	CAM-005	Campaña contra neumococo en adultos mayores	Vacunación de adultos mayores para disminuir el riesgo de enfermedades neumocócicas graves.	humana	\N	2026-08-01	2026-09-30	3950	3500	finalizada	2	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
6	CAM-006	Vacunación contra VPH 2026	Vacunación escolar para prevenir infecciones por virus del papiloma humano y cánceres asociados.	humana	\N	2026-10-16	2026-12-11	1650	1500	planeada	17	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
7	CAM-007	Campaña de vacunación contra influenza 2026-2027	Vacunación preventiva de niños, adultos mayores, embarazadas y personas con factores de riesgo durante la temporada invernal.	humana	\N	2026-10-16	2027-04-02	3300	3000	planeada	38	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
8	CAM-008	Campaña contra hepatitis B	Vacunación de personas sin esquema completo, trabajadores de salud y grupos con mayor riesgo de exposición.	humana	\N	2027-02-01	2027-03-31	2750	2400	activa	\N	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
9	CAM-009	Campaña de vacunación infantil	Recuperación de esquemas de vacunación infantil contra poliomielitis, difteria, tétanos, tosferina y otras enfermedades prevenibles.	humana	\N	2027-01-15	2027-03-15	4100	3700	activa	\N	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
10	CAM-010	Chucho Móvil 2027	Programa de vacunación gratuita contra la rabia para perros y gatos mediante unidades móviles que recorrerán colonias, parques y espacios públicos.	veterinaria	\N	2027-01-11	2027-03-31	8800	8000	planeada	17	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
11	CAM-011	Protege a tu Cachorro 2027 – Parvovirus	Jornada de vacunación dirigida a cachorros y perros jóvenes para prevenir el parvovirus canino, enfermedad viral altamente contagiosa que puede provocar vómitos, diarrea intensa y deshidratación.	veterinaria	\N	2027-04-01	2027-06-30	4650	4200	activa	\N	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
12	CAM-012	Un Hogar sin Moquillo 2027	Campaña de vacunación preventiva contra el moquillo canino, enfermedad viral contagiosa que afecta los sistemas respiratorio, digestivo y nervioso de los perros.	veterinaria	\N	2027-07-01	2027-09-30	3450	3100	activa	\N	2026-11-18 02:37:35.354504+00	2026-11-18 02:37:35.354504+00
\.


--
-- Data for Name: campanias_biologicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campanias_biologicos (campania_id, biologico_id, dosis_asignadas, objetivo_dosis, created_at, stock_minimo) FROM stdin;
1	2	0	0	2026-11-18 02:37:35.3619+00	0
2	6	0	0	2026-11-18 02:37:35.3619+00	0
2	4	0	0	2026-11-18 02:37:35.3619+00	0
2	1	0	0	2026-11-18 02:37:35.3619+00	0
3	8	0	0	2026-11-18 02:37:35.3619+00	0
3	5	0	0	2026-11-18 02:37:35.3619+00	0
3	3	0	0	2026-11-18 02:37:35.3619+00	0
3	2	0	0	2026-11-18 02:37:35.3619+00	0
4	3	0	0	2026-11-18 02:37:35.3619+00	0
5	6	0	0	2026-11-18 02:37:35.3619+00	0
8	8	0	0	2026-11-18 02:37:35.3619+00	0
9	8	0	0	2026-11-18 02:37:35.3619+00	0
9	5	0	0	2026-11-18 02:37:35.3619+00	0
9	3	0	0	2026-11-18 02:37:35.3619+00	0
9	2	0	0	2026-11-18 02:37:35.3619+00	0
11	10	0	0	2026-11-18 02:37:35.3619+00	0
12	11	0	0	2026-11-18 02:37:35.3619+00	0
6	7	0	0	2026-11-18 02:37:35.3619+00	20
7	1	0	0	2026-11-18 02:37:35.3619+00	100
10	9	0	0	2026-11-18 02:37:35.3619+00	100
\.


--
-- Data for Name: campanias_localidades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campanias_localidades (campania_id, localidad_id) FROM stdin;
6	1
6	2
7	3
7	4
7	5
7	6
7	2
10	3
10	4
10	7
10	1
10	8
10	9
10	10
\.


--
-- Data for Name: insumos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.insumos (id, codigo, nombre, unidad, stock_minimo, stock_objetivo_reposicion, activo, observaciones, created_at, updated_at) FROM stdin;
1	INS-001	Guantes de nitrilo	Cajas	10.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
2	INS-002	Cubrebocas quirurgicos	Cajas	10.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
3	INS-003	Gel antibacterial	Litros	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
4	INS-004	Gasas esteriles	Paquetes	15.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
5	INS-005	Algodon	Rollos	10.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
6	INS-006	Alcohol al 70%	Litros	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
7	INS-007	Jeringas desechables de 1 ml	Piezas	500.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
8	INS-008	Agujas desechables	Piezas	500.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
9	INS-009	Torundas de algodon	Paquetes	15.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
10	INS-010	Curitas o apositos adhesivos	Cajas	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
11	INS-011	Contenedores para punzocortantes	Piezas	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
12	INS-012	Bolsas rojas para residuos biologicos	Paquetes	10.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
13	INS-013	Bolsas negras para basura comun	Paquetes	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
14	INS-014	Solucion desinfectante	Litros	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
15	INS-015	Campos desechables	Paquetes	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
16	INS-016	Cinta microporosa	Rollos	10.00	20.00	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
17	INS-017	Termometros digitales	Piezas	3.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
18	INS-018	Termos portavacunas	Piezas	3.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
19	INS-019	Paquetes refrigerantes	Piezas	20.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
20	INS-020	Hojas de registro de vacunacion	Paquetes	10.00	20.00	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
21	INS-021	Plumas	Piezas	15.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
22	INS-022	Etiquetas para identificacion	Rollos	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
23	INS-023	Caretas de proteccion	Piezas	5.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
24	INS-024	Batas desechables	Piezas	30.00	\N	t	\N	2026-11-18 02:37:35.379481+00	2026-11-18 02:37:35.379481+00
\.


--
-- Data for Name: inventario_biologico_lotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventario_biologico_lotes (id, campania_id, biologico_id, codigo_lote, fabricante, fecha_caducidad, activo, observaciones, created_at, updated_at) FROM stdin;
1	6	7	VPH26-MSD-014	Merck Sharp & Dohme	2029-10-14	t	Lote y caducidad propuestos; verificar contra envase y acta de recepcion.	2026-11-18 02:37:35.374688+00	2026-11-18 02:37:35.374688+00
2	7	1	INF26-SAN-027	Sanofi Pasteur	2027-10-15	t	Lote y caducidad propuestos; verificar contra envase y acta de recepcion.	2026-11-18 02:37:35.374688+00	2026-11-18 02:37:35.374688+00
3	10	9	RAB27-MSD-009	MSD Animal Health	2031-01-09	f	Lote y caducidad propuestos; lote pendiente de recepcion. Verificar contra envase y acta; confirmar conservacion segun indicaciones del fabricante.	2026-11-18 02:37:35.374688+00	2026-11-18 02:37:35.374688+00
\.


--
-- Data for Name: localidades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.localidades (id, codigo, nombre, tipo, municipio, estado, codigo_postal, poblacion, ubicacion, color_marcador, activa, created_at, updated_at) FROM stdin;
1	LOC-001	Copoya	localidad	Tuxtla Gutiérrez	Chiapas	29100	9868	0101000020E61000000B5EF415A44757C0D97C5C1B2AB63040	#E76F70	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
2	LOC-002	El Jobo	localidad	Tuxtla Gutiérrez	Chiapas	29100	5798	0101000020E6100000787FBC57AD4657C040F67AF7C7B33040	#F28C45	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
3	LOC-003	Terán	ejido	Tuxtla Gutiérrez	Chiapas	29050	8280	0101000020E61000008D7A8846774A57C0C66D3480B7C03040	#E5A13A	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
4	LOC-004	Patria Nueva	colonia	Tuxtla Gutiérrez	Chiapas	29045	3930	0101000020E61000002A745E63974457C0D42B6519E2C03040	#D85D87	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
5	LOC-005	Centro	colonia	Tuxtla Gutiérrez	Chiapas	29000	3500	0101000020E6100000D8648D7A884857C0F92CCF83BBBB3040	#E85D5D	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
6	LOC-006	Cerro Hueco	colonia	Tuxtla Gutiérrez	Chiapas	29094	4000	0101000020E6100000A48D23D6E24557C0800EF3E505B83040	#D9A441	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
7	LOC-007	Las Granjas	colonia	Tuxtla Gutiérrez	Chiapas	29019	14700	0101000020E610000058D647F1BB4657C0E1D80EA1A5CA3040	#D98269	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
8	LOC-008	Plan de Ayala	colonia	Tuxtla Gutiérrez	Chiapas	29020	6130	0101000020E610000079E92631084C57C06666666666C63040	#C77C55	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
9	LOC-009	24 de Junio	colonia	Tuxtla Gutiérrez	Chiapas	29047	5540	0101000020E61000000B462575024657C0DB8AFD65F7C43040	#CC668E	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
10	LOC-010	Las Águilas	otro	Tuxtla Gutiérrez	Chiapas	29049	1960	0101000020E6100000367689EAAD4557C0384A5E9D63C83040	#C99B42	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
11	LOC-011	Jardines Pedregal	colonia	Tuxtla Gutiérrez	Chiapas	29049	6170	0101000020E610000076FD82DDB04557C09335EA211AC53040	#5278C7	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
12	LOC-012	San Fernando	otro	Tuxtla Gutiérrez	Chiapas	29120	11867	0101000020E61000008195438B6C4757C08CB96B09F9C03040	#399B83	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
13	LOC-013	Loma Bonita de Terán	colonia	Tuxtla Gutiérrez	Chiapas	29059	8000	0101000020E6100000CDE9B298D84A57C0A5DAA7E331BB3040	#8065B9	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
14	LOC-014	Ampliación Terán	colonia	Tuxtla Gutiérrez	Chiapas	29059	8280	0101000020E6100000459E245D334957C0A514747B49C33040	#368FAE	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
15	LOC-015	Real del Bosque	otro	Tuxtla Gutiérrez	Chiapas	29040	42000	0101000020E61000009E077767ED4A57C07A8D5DA27AB33040	#548D69	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
16	LOC-016	Los Tamarindos	colonia	Tuxtla Gutiérrez	Chiapas	29059	\N	0101000020E610000083A3E4D5394A57C0910F7A36ABBE3040	#6575B9	t	2026-11-18 02:37:35.355397	2026-11-18 02:37:35.355397
\.


--
-- Data for Name: movimientos_biologicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_biologicos (id, lote_id, tipo_movimiento, cantidad, brigada_id, visita_id, visita_jornada_id, fecha_operacion, persona_entrega, persona_recibe, observaciones, clave_registro, created_at) FROM stdin;
1	1	recepcion_campania	1670	\N	\N	\N	2026-10-14	\N	Andrea Salazar Flores	Recepcion reportada. Empaques integros; se indico conservacion de 2 a 8 °C, sujeta a comprobacion del registro de temperatura. Lote/caducidad propuestos.	SEED-RECEPCION-CAM006	2026-11-18 02:37:35.375651+00
2	2	recepcion_campania	3400	\N	\N	\N	2026-10-15	\N	Ximena Beltran Ochoa	Recepcion reportada. Empaques integros y sin alteracion visible; verificar monitoreo de cadena de frio. Lote/caducidad propuestos.	SEED-RECEPCION-CAM007	2026-11-18 02:37:35.375651+00
3	3	recepcion_programada	8900	\N	\N	\N	2027-01-09	\N	\N	Recepcion programada para el 09/01/2027 (dos dias antes del inicio de CAM-010). Responsable previsto: Andrea Salazar Flores. No contabilizar como existencia fisica hasta confirmar la entrega. Lote/caducidad propuestos; confirmar conservacion con indicaciones del fabricante.	SEED-RECEPCION-CAM010	2026-11-18 02:37:35.375651+00
4	1	entrega_brigada	851	1	\N	\N	2026-10-19	\N	\N	Traspaso consolidado de 851 dosis para los tres puntos atendidos de VIS-001. Fecha de referencia; validar contra el comprobante de entrega.	SEED-VIS001-ENTREGA-BRI001	2026-11-18 02:37:35.376646+00
5	1	entrega_visita	851	\N	1	\N	2026-10-19	\N	\N	Traspaso consolidado de 851 dosis recibidas para VIS-001 y distribuidas entre sus tres puntos atendidos. Fecha de referencia; validar contra el comprobante de entrega.	SEED-VIS001-ENTREGA-VISITA	2026-11-18 02:37:35.377467+00
6	1	entrega_jornada	315	\N	\N	6	2026-10-19	\N	\N	Entrega registrada para la jornada; fecha operativa tomada del inicio programado.	SEED-VIS001-CENTRO-ENTREGA	2026-11-18 02:37:35.378184+00
7	1	aplicacion	301	\N	\N	6	2026-10-23	\N	\N	Cantidad aplicada de ejemplo para pruebas; sustituir por el dato real validado.	SEED-VIS001-CENTRO-APLICACION	2026-11-18 02:37:35.378184+00
8	1	devolucion_jornada	10	\N	\N	3	2026-11-06	\N	\N	Devolucion incompleta. De 252 entregadas, 240 aplicadas y 10 devueltas, quedan 2 dosis sin justificar.	SEED-VIS001-PLAZA-DEVOLUCION	2026-11-18 02:37:35.378184+00
9	1	aplicacion	240	\N	\N	3	2026-11-06	\N	\N	Cantidad aplicada de ejemplo para pruebas; sustituir por el dato real validado.	SEED-VIS001-PLAZA-APLICACION	2026-11-18 02:37:35.378184+00
10	1	devolucion_jornada	14	\N	\N	6	2026-10-23	\N	\N	Devolucion completa: 315 entregadas menos 301 aplicadas = 14 devueltas.	SEED-VIS001-CENTRO-DEVOLUCION	2026-11-18 02:37:35.378184+00
11	1	entrega_jornada	252	\N	\N	3	2026-11-03	\N	\N	Entrega registrada para la jornada; fecha operativa tomada del inicio programado.	SEED-VIS001-PLAZA-ENTREGA	2026-11-18 02:37:35.378184+00
12	1	devolucion_jornada	13	\N	\N	4	2026-10-30	\N	\N	Devolución completa: 284 entregadas menos 271 aplicadas = 13 devueltas.	SEED-VIS001-PRIMARIA-DEVOLUCION	2026-11-18 02:37:35.383895+00
13	1	aplicacion	271	\N	\N	4	2026-10-30	\N	\N	Cantidad aplicada de ejemplo para pruebas; sustituir por el dato real validado.	SEED-VIS001-PRIMARIA-APLICACION	2026-11-18 02:37:35.383895+00
14	1	entrega_jornada	284	\N	\N	4	2026-10-26	\N	\N	Entrega registrada para la jornada; cantidad proporcionada para Primaria Lázaro Cárdenas.	SEED-VIS001-PRIMARIA-ENTREGA	2026-11-18 02:37:35.383895+00
\.


--
-- Data for Name: movimientos_insumos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_insumos (id, insumo_id, tipo_movimiento, cantidad, fecha_operacion, responsable, observaciones, clave_registro, created_at) FROM stdin;
1	1	entrada	30.00	2026-10-05	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-001	2026-11-18 02:37:35.380132+00
2	2	entrada	40.00	2026-10-08	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-002	2026-11-18 02:37:35.380132+00
3	3	entrada	25.00	2026-10-10	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-003	2026-11-18 02:37:35.380132+00
4	4	entrada	50.00	2026-10-02	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-004	2026-11-18 02:37:35.380132+00
5	5	entrada	30.00	2026-10-02	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-005	2026-11-18 02:37:35.380132+00
6	6	entrada	20.00	2026-10-05	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-006	2026-11-18 02:37:35.380132+00
7	7	entrada	2000.00	2026-10-12	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-007	2026-11-18 02:37:35.380132+00
8	8	entrada	2000.00	2026-10-12	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-008	2026-11-18 02:37:35.380132+00
9	9	entrada	60.00	2026-10-02	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-009	2026-11-18 02:37:35.380132+00
10	10	entrada	20.00	2026-10-06	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-010	2026-11-18 02:37:35.380132+00
11	11	entrada	20.00	2026-10-09	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-011	2026-11-18 02:37:35.380132+00
12	12	entrada	30.00	2026-10-09	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-012	2026-11-18 02:37:35.380132+00
13	13	entrada	20.00	2026-10-09	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-013	2026-11-18 02:37:35.380132+00
14	14	entrada	15.00	2026-10-10	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-014	2026-11-18 02:37:35.380132+00
15	15	entrada	20.00	2026-10-07	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-015	2026-11-18 02:37:35.380132+00
16	16	entrada	3.00	2026-09-15	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-016	2026-11-18 02:37:35.380132+00
17	17	entrada	12.00	2026-10-11	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-017	2026-11-18 02:37:35.380132+00
18	18	entrada	12.00	2026-10-11	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-018	2026-11-18 02:37:35.380132+00
19	19	entrada	60.00	2026-10-11	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-019	2026-11-18 02:37:35.380132+00
20	20	entrada	4.00	2026-09-20	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-020	2026-11-18 02:37:35.380132+00
21	21	entrada	50.00	2026-10-08	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-021	2026-11-18 02:37:35.380132+00
22	22	entrada	15.00	2026-10-08	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-022	2026-11-18 02:37:35.380132+00
23	23	entrada	15.00	2026-10-05	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-023	2026-11-18 02:37:35.380132+00
24	24	entrada	100.00	2026-10-05	\N	Existencia inicial capturada con los datos proporcionados.	SEED-STOCK-INS-024	2026-11-18 02:37:35.380132+00
\.


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificaciones (id, tipo, categoria, severidad, titulo, mensaje, campania_id, visita_id, visita_jornada_id, lote_id, insumo_id, movimiento_biologico_id, movimiento_insumo_id, clave_deduplicacion, metadata, leida_at, resuelta_at, fecha_creacion) FROM stdin;
1	recepcion_biologico_registrada	biologicos	info	Recepcion de biologico registrada	Se registraron 1,670 dosis de BIO-VPH para VPH 2026.	6	\N	\N	1	\N	\N	\N	SEED-NOTIF-RECEPCION-CAM006	{"dosis_recibidas": 1670, "fecha_recepcion": "2026-10-14"}	\N	\N	2026-11-18 02:37:35.381014+00
2	recepcion_biologico_registrada	biologicos	info	Recepcion de biologico registrada	Se registraron 3,400 dosis de BIO-INF para Influenza 2026-2027.	7	\N	\N	2	\N	\N	\N	SEED-NOTIF-RECEPCION-CAM007	{"dosis_recibidas": 3400, "fecha_recepcion": "2026-10-15"}	\N	\N	2026-11-18 02:37:35.381014+00
3	conciliacion_jornada_completa	biologicos	success	Jornada finalizada y conciliada	Centro de Salud Copoya: jornada finalizada. Se registraron 315 dosis entregadas, 301 aplicadas y 14 devueltas. La conciliacion esta completa.	6	1	6	\N	\N	\N	\N	SEED-NOTIF-CENTRO	{}	\N	\N	2026-11-18 02:37:35.382045+00
4	diferencia_biologico_jornada	biologicos	danger	Devolucion incompleta: 2 dosis sin justificar	Plaza Comunitaria IDH Copoya: jornada finalizada con 252 dosis entregadas, 240 aplicadas y 10 devueltas. Se esperaban 12 dosis devueltas; faltan 2 por aclarar.	6	1	3	\N	\N	\N	\N	SEED-NOTIF-PLAZA-DIFERENCIA	{"dosis_aplicadas": 240, "dosis_devueltas": 10, "dosis_entregadas": 252, "dosis_sin_justificar": 2}	\N	\N	2026-11-18 02:37:35.382765+00
5	stock_minimo_insumo	insumos	danger	Insumo por debajo del stock minimo	Cinta microporosa: existencia de 3 rollos, por debajo del minimo de 10. La reposicion sugerida es de 17 rollos para alcanzar una existencia objetivo de 20.	\N	\N	\N	\N	16	\N	\N	SEED-NOTIF-STOCK-CINTA	{"stock_minimo": 10, "existencia_actual": 3, "objetivo_reposicion": 20, "cantidad_sugerida_reponer": 17}	\N	\N	2026-11-18 02:37:35.383366+00
6	stock_minimo_insumo	insumos	danger	Insumo por debajo del stock minimo	Hojas de registro de vacunacion: existencia de 4 paquetes, por debajo del minimo de 10. La reposicion sugerida es de 16 paquetes para alcanzar una existencia objetivo de 20.	\N	\N	\N	\N	20	\N	\N	SEED-NOTIF-STOCK-HOJAS	{"stock_minimo": 10, "existencia_actual": 4, "objetivo_reposicion": 20, "cantidad_sugerida_reponer": 16}	\N	\N	2026-11-18 02:37:35.383366+00
7	conciliacion_jornada_completa	biologicos	success	Jornada finalizada y conciliada	Primaria Lázaro Cárdenas: jornada finalizada. Se registraron 284 dosis entregadas, 271 aplicadas y 13 devueltas. La conciliación está completa.	6	1	4	\N	\N	\N	\N	SEED-NOTIF-PRIMARIA	{"aplicadas": 271, "devueltas": 13, "entregadas": 284}	\N	\N	2026-11-18 02:37:35.385069+00
\.


--
-- Data for Name: origenes_recorrido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.origenes_recorrido (id, codigo, nombre, direccion, referencia, municipio, estado, codigo_postal, ubicacion, es_principal, activo, created_at, updated_at) FROM stdin;
1	ORI-001	Jurisdicción Sanitaria 1	Av. 10ª Norte Poniente #987, Col. Vista Hermosa / Centro	Esquina con 9ª Norte Poniente	Tuxtla Gutiérrez	Chiapas	29030	0101000020E610000096438B6CE74757C08AB0E1E995C23040	t	t	2026-11-18 02:37:35.371423	2026-11-18 02:37:35.371423
\.


--
-- Data for Name: permiso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permiso (id, clave, descripcion) FROM stdin;
1	personal.ver	Consultar el personal
2	personal.crear	Registrar personal
3	personal.editar	Editar personal
\.


--
-- Data for Name: personal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal (id, numero_empleado, nombres, apellido_paterno, apellido_materno, curp, telefono, correo, foto, fecha_nacimiento, estado, fecha_creacion, fecha_actualizacion, rol_id) FROM stdin;
1	EMP-001	Roberto	Sánchez	Pérez	SAPR850315HXXNBR00	9617483702	roberto.sanchez27@mgvacuna.mx	/uploads/personal/EMP-001.jpg	1978-03-15	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	1
2	EMP-002	Pedro	Morales	Díaz	MODI790722HXXRZD00	9617483704	pedro.morales56@mgvacuna.mx	/uploads/personal/EMP-002.jpg	1992-07-22	baja	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	2
3	EMP-003	Ana	Hernández	López	HELA920614MXXRPN00	9617483701	ana.hernandez43@mgvacuna.mx	/uploads/personal/EMP-003.jpg	1993-06-14	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	5
4	EMP-004	Laura	Méndez	García	MEGA880921MXXNRR00	9617483703	laura.mendez81@mgvacuna.mx	/uploads/personal/EMP-004.jpg	1997-09-21	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
5	EMP-005	Juan	Pérez	Ruiz	PERU950412HXXZJN00	9617483706	juan.perez74@mgvacuna.mx	/uploads/personal/EMP-005.jpg	1995-04-12	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
6	EMP-006	Sofía	Ramírez	Torres	RATS900823MXXMRR00	9617483707	sofia.ramirez19@mgvacuna.mx	/uploads/personal/EMP-006.jpg	2001-08-23	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
7	EMP-007	Carlos	Gómez	Vázquez	GOVC820517HXXMZR00	9617483708	carlos.gomez62@mgvacuna.mx	/uploads/personal/EMP-007.jpg	1990-05-17	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	7
8	EMP-008	Daniela	Ruiz	Castillo	RUCA960211MXXZNS00	9617483711	daniela.ruiz68@mgvacuna.mx	/uploads/personal/EMP-008.jpg	1980-02-11	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	3
9	EMP-009	Miguel	Díaz	Castro	DICA870930HXXZGS00	9617483710	miguel.diaz41@mgvacuna.mx	/uploads/personal/EMP-009.jpg	2000-09-30	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
10	EMP-010	José	Torres	Luna	TOLU910708HXXRNS00	9617483712	jose.torres24@mgvacuna.mx	/uploads/personal/EMP-010.jpg	2000-07-08	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
11	EMP-011	Patricia	Vázquez	Flores	VAFP800126MXXZRL00	9617483713	patricia.vazquez93@mgvacuna.mx	/uploads/personal/EMP-011.jpg	2002-01-26	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
12	EMP-012	Luis	Jiménez	Ortiz	JIOL850619HXXMRR00	9617483714	luis.jimenez37@mgvacuna.mx	/uploads/personal/EMP-012.jpg	2001-06-19	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	3
13	EMP-013	Gabriela	Castro	Núñez	CANG930305MXXSXB00	9617483715	gabriela.castro51@mgvacuna.mx	/uploads/personal/EMP-013.jpg	1986-03-05	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
14	EMP-014	Fernando	Aguilar	Domínguez	AUDF770914HXXGMR00	9617483716	fernando.aguilar76@mgvacuna.mx	/uploads/personal/EMP-014.jpg	1994-09-14	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	7
15	EMP-015	Jorge	Luna	Mendoza	LUMJ890427HXXNDR00	9617483718	jorge.luna64@mgvacuna.mx	/uploads/personal/EMP-015.jpg	1992-04-27	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
16	EMP-016	Ricardo	Núñez	Vega	NUVR810812HXXXGC00	9617483720	ricardo.nunez82@mgvacuna.mx	/uploads/personal/EMP-016.jpg	1975-08-12	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	7
17	EMP-017	Andrea	Salazar	Flores	SAFA970219MXXLNR00	9617483717	andrea.salazar28@mgvacuna.mx	/uploads/personal/EMP-017.jpg	1997-02-19	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	2
18	EMP-018	Valeria	Ortiz	Santos	OISV940611MXXRNL00	9617483719	valeria.ortiz17@mgvacuna.mx	/uploads/personal/EMP-018.jpg	1996-06-11	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
19	EMP-019	Arturo	Mendoza	León	MELA860923HXXNTR00	9617483722	arturo.mendoza39@mgvacuna.mx	/uploads/personal/EMP-019.jpg	1996-09-23	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	5
20	EMP-020	Carmen	Flores	Ríos	FORC900130MXXLRS00	9617483721	carmen.flores45@mgvacuna.mx	/uploads/personal/EMP-020.jpg	1967-01-30	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	5
21	EMP-021	Óscar	Ríos	Navarro	RINO780516HXXSVS00	9617483724	oscar.rios26@mgvacuna.mx	/uploads/personal/EMP-021.jpg	1998-05-16	vacaciones	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	3
22	EMP-022	Diana	Aguilar	Solís	AUSD920827MXXGLN00	9617483723	diana.aguilar71@mgvacuna.mx	/uploads/personal/EMP-022.jpg	1998-08-27	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
23	EMP-023	Paola	Cabrera	Vargas	CAVP950309MXXBRR00	9617483725	paola.cabrera58@mgvacuna.mx	/uploads/personal/EMP-023.jpg	1998-03-09	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	3
24	EMP-024	Emilio	Delgado	Pineda	DEPE830721HXXLNM00	9617483726	emilio.delgado34@mgvacuna.mx	/uploads/personal/EMP-024.jpg	1982-07-21	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	5
25	EMP-025	Natalia	Acosta	Herrera	AOHN990415MXXCST00	9617483727	natalia.acosta92@mgvacuna.mx	/uploads/personal/EMP-025.jpg	1981-04-15	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
26	EMP-026	Iván	Campos	Cortés	CACI880628HXXMPR00	9617483728	ivan.campos47@mgvacuna.mx	/uploads/personal/EMP-026.jpg	1990-06-28	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	7
27	EMP-027	Fernanda	Rojas	Valdez	ROVF960902MXXJLN00	9617483729	fernanda.rojas63@mgvacuna.mx	/uploads/personal/EMP-027.jpg	1992-09-02	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
28	EMP-028	Alejandra	Medina	Ochoa	MEOA910118MXXDCL00	9617483731	alejandra.medina55@mgvacuna.mx	/uploads/personal/EMP-028.jpg	1993-01-18	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
29	EMP-029	Héctor	Vargas	Cervantes	VACH800724HXXRRC00	9617483732	hector.vargas87@mgvacuna.mx	/uploads/personal/EMP-029.jpg	1987-07-24	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
30	EMP-030	Samuel	Pineda	Carrillo	PICS930510HXXNMR00	9617483734	samuel.pineda46@mgvacuna.mx	/uploads/personal/EMP-030.jpg	1974-05-10	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
31	EMP-031	Diego	Fuentes	Pacheco	FUPD970831HXXNCC00	9617483730	diego.fuentes18@mgvacuna.mx	/uploads/personal/EMP-031.jpg	1992-08-31	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	5
32	EMP-032	Mónica	Contreras	Ibarra	COIM850207MXXNBR00	9617483733	monica.contreras29@mgvacuna.mx	/uploads/personal/EMP-032.jpg	1991-02-07	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
33	EMP-033	Adrián	Cortés	Espinosa	COEA890619HXXRDS00	9617483736	adrian.cortes21@mgvacuna.mx	/uploads/personal/EMP-033.jpg	1992-06-19	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	5
34	EMP-034	Claudia	Herrera	Montes	HEMC940925MXXRNL00	9617483735	claudia.herrera73@mgvacuna.mx	/uploads/personal/EMP-034.jpg	1982-09-25	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
35	EMP-035	Pablo	Pacheco	Serrano	PASP820314HXXCBB00	9617483738	pablo.pacheco35@mgvacuna.mx	/uploads/personal/EMP-035.jpg	1979-03-14	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	4
36	EMP-036	Renata	Valdez	Mejía	VAMR980722MXXLJN00	9617483737	renata.valdez66@mgvacuna.mx	/uploads/personal/EMP-036.jpg	1990-07-22	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
37	EMP-037	Ángel	Acosta	Jiménez	AOJA860105HXXCMN00	9617483740	angel.acosta52@mgvacuna.mx	/uploads/personal/EMP-037.jpg	1988-01-05	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
38	EMP-038	Ximena	Beltrán	Ochoa	OOBX000417MXXCLN00	9617483739	ximena.beltran89@mgvacuna.mx	/uploads/personal/EMP-038.jpg	2001-04-17	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	2
39	EMP-039	Elena	Cruz	Jiménez	CUJE910812MXXRML00	9617483709	elena.cruz85@mgvacuna.mx	/uploads/personal/EMP-039.jpg	1989-08-12	vacaciones	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	5
40	EMP-040	María	López	Gómez	LOGM870226MXXPZR00	9617483705	maria.lopez32@mgvacuna.mx	/uploads/personal/EMP-040.jpg	1973-02-26	activo	2026-11-18 02:37:35.352229+00	2026-11-18 02:37:35.352229+00	6
\.


--
-- Data for Name: puntos_vacunacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.puntos_vacunacion (id, localidad_id, nombre, direccion, referencia, ubicacion, activo, created_at, updated_at) FROM stdin;
5	1	Centro de Salud Copoya	\N	\N	0101000020E61000004E7ADFF8DA4757C0CB10C7BAB8B53040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
4	1	Primaria Lázaro Cárdenas	\N	\N	0101000020E6100000DBF97E6ABC4857C0780B24287EBC3040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
3	1	Plaza Comunitaria IDH Copoya	\N	\N	0101000020E61000001DC9E53FA44757C0499D8026C2B63040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
2	1	Domo de cancha de básquetbol	\N	\N	0101000020E61000009357E718904757C02D26361FD7B63040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
1	1	Parque Central de Copoya	\N	\N	0101000020E610000076E09C11A54757C03B70CE88D2B63040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
9	2	Centro de Salud El Jobo	\N	\N	0101000020E61000009FCDAACFD54657C04E62105839B43040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
8	2	Primaria Francisco Sarabia	\N	\N	0101000020E610000010CAFB389A4657C0DC114E0B5EB43040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
7	2	Secundaria Moisés Sáenz Garza	\N	\N	0101000020E6100000CE6F9868904657C0EDD632198EB33040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
6	2	Centro Ejidal del Jobo	\N	\N	0101000020E6100000E63FA4DFBE4657C032772D211FB43040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
12	3	Centro de Salud Terán	\N	\N	0101000020E6100000B8E9CF7EA44A57C040BFEFDFBCC03040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
11	3	Casa de la Cultura de Terán	\N	\N	0101000020E61000000C8FFD2C964A57C085949F54FBC03040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
10	3	Parque de Terán	\N	\N	0101000020E610000095826E2F694A57C0FE43FAEDEBC03040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
16	4	Centro de Salud Patria Nueva	\N	\N	0101000020E61000004D158C4AEA4457C0F90FE9B7AFC33040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
15	4	Cancha comunitaria	\N	\N	0101000020E61000008F386403E94457C04C1762F547C43040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
14	4	Agencia Municipal Patria Nueva	\N	\N	0101000020E61000002DE92807B34457C003780B2428C23040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
13	4	Unidad Deportiva Patria Nueva	\N	\N	0101000020E6100000971DE21FB64457C0B325AB22DCC03040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
18	5	Centro de Salud Urbano	\N	\N	0101000020E6100000B1C403CAA64457C048BF7D1D38BF3040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
17	5	Plaza Central	\N	\N	0101000020E6100000959F54FB744757C04C1C7920B2C03040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
19	6	Agencia Municipal de Cerro Hueco	\N	\N	0101000020E6100000764F1E166A4557C06E861BF0F9B93040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
22	7	Centro de Salud Urbano Las Granjas	\N	\N	0101000020E6100000179E978A8D4657C0D21C59F965C83040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
21	7	Agencia Municipal Las Granjas	\N	\N	0101000020E6100000F452B131AF4657C09E996038D7C83040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
20	7	Parque El Aguaje	\N	\N	0101000020E61000004EECA17DAC4657C0F5B86FB54EC83040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
24	8	Agencia Municipal Plan de Ayala	\N	\N	0101000020E6100000AB5B3D27BD4B57C07E74EACA67C13040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
23	8	Parque Central de Plan de Ayala	\N	\N	0101000020E6100000560E2DB29D4B57C06F1283C0CAC13040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
25	9	Parque comunitario 24 de Junio	\N	\N	0101000020E61000003D9B559FAB4557C08A8EE4F21FC23040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
26	10	Parque comunitario de Las Águilas	\N	\N	0101000020E6100000F163CC5D4B4557C0956247E350C33040	t	2026-11-18 02:37:35.368052+00	2026-11-18 02:37:35.371423+00
\.


--
-- Data for Name: recorridos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recorridos (id, visita_jornada_id, origen_id, geometria, distancia_m, duracion_seg, modo_transporte, proveedor, instrucciones, estado, error_detalle, calculado_at, created_at, updated_at) FROM stdin;
1	1	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
2	2	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
3	3	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
4	4	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
5	5	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
6	6	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
7	7	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
8	8	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
9	9	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
10	10	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
11	11	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
12	12	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
13	13	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
14	14	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
15	15	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
16	16	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
17	17	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
18	18	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
19	19	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
20	20	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
21	21	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
22	22	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
23	23	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
24	24	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
25	25	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
26	26	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
27	27	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
28	28	1	\N	\N	\N	driving	\N	\N	pendiente	\N	\N	2026-11-18 02:37:35.372387	2026-11-18 02:37:35.372387
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rol (id, nombre, descripcion) FROM stdin;
1	Administrador general	Controla todo el sistema: usuarios, campañas, reportes y configuración.
2	Coordinador de campaña	Organiza las campañas de vacunación, las fechas y las localidades que se visitan.
3	Responsable de brigada	Está al frente de una brigada en campo y supervisa sus visitas y registros.
4	Encargado de inventario	Controla las vacunas e insumos: entradas, salidas y existencias.
5	Médico	Atiende y valora a los pacientes durante las brigadas.
6	Enfermero	Aplica las vacunas a las personas durante las jornadas de salud.
7	Conductor	Maneja el vehículo que lleva a la brigada y el material a las comunidades.
\.


--
-- Data for Name: rol_permiso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rol_permiso (rol_id, permiso_id) FROM stdin;
1	1
1	2
1	3
2	1
\.



--
-- Data for Name: telegram_codigos_vinculacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.telegram_codigos_vinculacion (id, usuario_id, codigo_hash, expira_at, consumido_at, creado_at) FROM stdin;
\.


--
-- Data for Name: telegram_consultas_auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.telegram_consultas_auditoria (id, usuario_id, telegram_user_id, pregunta, resultado, creado_at) FROM stdin;
\.


--
-- Data for Name: telegram_vinculaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.telegram_vinculaciones (id, usuario_id, telegram_user_id, chat_id, activo, vinculado_at, revocado_at) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, personal_id, username, correo, password_hash, estado, debe_cambiar_password, ultimo_acceso, fecha_creacion, fecha_actualizacion) FROM stdin;
1	1	emp-001	roberto.sanchez27@mgvacuna.mx	$2a$12$4sD.EOuJJDI58jt6/NUZVOxUNMd/Y5pLmTAssEqNARWaNqMv/3kiW	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
2	2	emp-002	pedro.morales56@mgvacuna.mx	$2a$12$JG2MWzM33k0UlYCQSt/osufa5Q1.h81W7mplwqnAXptM9VCR56JrG	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
3	8	emp-008	daniela.ruiz68@mgvacuna.mx	$2a$12$h4zmMD6iBLszvPB0/g7XwO5zck5x16TakRdxnsQTnBgmKUjHjIMJm	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
4	12	emp-012	luis.jimenez37@mgvacuna.mx	$2a$12$7LDbVItmaLsc5ed2EyLsgetJJN2ZKr8pEUdXjlVglNKdi14A8eZ2G	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
5	17	emp-017	andrea.salazar28@mgvacuna.mx	$2a$12$XWMu9MpQkPopaI/krHVg3Ond9FjPqmMvOxJD433hztlph4hPCuadW	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
6	21	emp-021	oscar.rios26@mgvacuna.mx	$2a$12$Ga45zKoMSShdtN67Af3PT.c3fGEQzvIzacBQMBtH2zjGGMsPXrsae	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
7	23	emp-023	paola.cabrera58@mgvacuna.mx	$2a$12$7B/d8jadffTce/61BFFc8O4coigldvUpOMFJITTr8BXKQifwd4Qay	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
8	35	emp-035	pablo.pacheco35@mgvacuna.mx	$2a$12$2ugpvVLYUfYr66Tjn39NTeos/rIHhCjfAgdrTvOyOoWENK2rkr8cW	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
9	38	emp-038	ximena.beltran89@mgvacuna.mx	$2a$12$LW6CrtBtgkYQerzeIhOCMuSGfiD0xPZ/2L1JWIxOwHIa1E.DR9GN2	activo	t	\N	2026-11-18 02:37:35.424318+00	2026-11-18 02:37:35.424318+00
\.


--
-- Data for Name: vehiculos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehiculos (id, numero_economico, marca, modelo, anio, placas, color, capacidad_personas, kilometraje, foto, estado, conductor_id, fecha_creacion, fecha_actualizacion) FROM stdin;
1	VS-001	Nissan	Urvan	2021	DYA-482-C	Blanco	15	86450	/uploads/transporte/nissan-urvan.png	en_uso	26	2026-01-12 14:30:00+00	2026-10-28 15:15:00+00
2	VS-002	Nissan	Urvan	2020	DYA-593-C	Blanco	15	112300	/uploads/transporte/nissan-urvan.png	en_uso	7	2026-01-12 14:35:00+00	2026-10-29 16:20:00+00
3	VS-003	Toyota	Hiace	2022	DYA-614-C	Blanco	15	64800	/uploads/transporte/toyota-hiace.png	en_uso	16	2026-02-05 15:00:00+00	2026-11-02 14:45:00+00
4	VS-004	Nissan	NP300	2019	CW-3842-B	Blanco	5	138600	/uploads/transporte/nissan-np300.png	en_uso	14	2026-01-15 17:20:00+00	2026-10-30 18:10:00+00
5	VS-005	Ford	Ranger	2018	CW-5291-B	Blanco	5	165200	/uploads/transporte/ford-ranger.png	mantenimiento	\N	2026-01-18 14:00:00+00	2026-11-03 20:30:00+00
6	VS-006	Nissan	Urvan	2017	DYA-728-C	Blanco	15	194500	/uploads/transporte/nissan-urvan.png	fuera_servicio	\N	2026-01-20 16:00:00+00	2026-10-15 22:00:00+00
7	VS-007	Toyota	Hiace	2018	DYA-836-C	Blanco	15	178900	/uploads/transporte/toyota-hiace.png	fuera_servicio	\N	2026-01-22 15:30:00+00	2026-09-22 19:45:00+00
8	VS-008	Nissan	NP300	2016	CW-6472-B	Blanco	5	210350	/uploads/transporte/nissan-np300.png	fuera_servicio	\N	2026-01-25 14:45:00+00	2026-08-19 17:30:00+00
9	VS-009	Nissan	Urvan	2023	DYA-942-C	Blanco	15	32700	/uploads/transporte/nissan-urvan.png	disponible	\N	2026-03-10 16:15:00+00	2026-11-04 15:00:00+00
10	VS-010	Ford	Transit	2022	DYA-157-C	Blanco	15	51200	/uploads/transporte/ford-transit.png	disponible	\N	2026-03-15 15:20:00+00	2026-11-05 14:30:00+00
\.


--
-- Data for Name: visita_jornadas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visita_jornadas (id, visita_id, punto_vacunacion_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, dosis_asignadas, objetivo_dosis, estado, observaciones, created_at, updated_at) FROM stdin;
1	10	1	2027-01-22	2027-01-24	09:00:00	14:00:00	823	748	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
2	1	2	2026-11-09	2026-11-13	08:00:00	14:00:00	188	171	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
3	1	3	2026-11-03	2026-11-06	08:30:00	13:30:00	252	229	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
4	1	4	2026-10-26	2026-10-30	08:30:00	13:30:00	284	259	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
5	10	5	2027-01-16	2027-01-19	09:00:00	14:30:00	900	818	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
6	1	5	2026-10-19	2026-10-23	08:00:00	13:00:00	315	286	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
7	7	6	2027-03-01	2027-03-05	08:00:00	14:00:00	300	273	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
8	2	7	2026-11-30	2026-12-04	08:00:00	14:00:00	141	128	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
9	2	8	2026-11-23	2026-11-27	08:00:00	13:00:00	220	200	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
10	7	9	2027-02-06	2027-02-07	08:00:00	14:00:00	450	409	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
11	2	9	2026-11-16	2026-11-20	08:00:00	13:00:00	250	227	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
12	11	10	2027-03-20	2027-03-30	09:00:00	14:30:00	1446	1314	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
13	4	11	2027-01-11	2027-01-15	08:00:00	14:00:00	421	383	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
14	4	12	2026-11-14	2026-11-15	08:00:00	13:30:00	650	591	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
15	12	13	2027-02-20	2027-02-21	09:00:00	14:00:00	286	260	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
16	12	14	2027-01-09	2027-01-10	09:00:00	14:30:00	400	364	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
17	3	15	2026-12-05	2026-12-08	08:00:00	13:30:00	200	182	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
18	3	16	2026-11-21	2026-11-22	08:00:00	14:00:00	308	280	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
19	6	17	2027-02-08	2027-02-12	08:00:00	14:00:00	153	139	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
20	6	18	2027-02-01	2027-02-05	08:00:00	14:00:00	300	273	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
21	5	19	2027-02-15	2027-02-19	08:00:00	14:00:00	518	470	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
22	8	20	2027-02-13	2027-02-14	09:00:00	14:00:00	666	606	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
23	8	21	2027-01-25	2027-01-28	09:00:00	14:30:00	900	818	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
24	8	22	2027-01-05	2027-01-08	09:00:00	14:30:00	1000	909	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
25	13	23	2027-03-09	2027-03-13	09:00:00	14:00:00	420	382	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
26	13	24	2027-03-06	2027-03-07	09:00:00	14:30:00	650	591	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
27	14	25	2027-01-29	2027-01-31	09:00:00	14:30:00	967	879	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
28	9	26	2027-02-25	2027-02-28	09:00:00	14:00:00	342	311	programada	\N	2026-11-18 02:37:35.369742+00	2026-11-18 02:37:35.369742+00
\.


--
-- Data for Name: visitas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visitas (id, brigada_localidad_id, codigo, nombre, estado, observaciones, created_at, updated_at) FROM stdin;
1	1	VIS-001	Visita 1 - Copoya	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
2	2	VIS-002	Visita 2 - El Jobo	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
3	3	VIS-004	Visita 4 - Patria Nueva	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
4	4	VIS-003	Visita 3 - Terán	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
5	5	VIS-006	Visita 6 - Cerro Hueco	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
6	6	VIS-005	Visita 5 - Centro	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
7	7	VIS-007	Visita 7 - El Jobo	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
8	8	VIS-008	Visita 8 - Las Granjas	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
9	9	VIS-010	Visita 10 - Las Águilas	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
10	10	VIS-009	Visita 9 - Copoya	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
11	11	VIS-011	Visita 11 - Terán	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
12	12	VIS-013	Visita 13 - Patria Nueva	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
13	13	VIS-012	Visita 12 - Plan de Ayala	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
14	14	VIS-014	Visita 14 - 24 de Junio	planeada	\N	2026-11-18 02:37:35.366429+00	2026-11-18 02:37:35.366429+00
\.


--
-- Name: biologicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.biologicos_id_seq', 11, true);


--
-- Name: brigada_integrantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brigada_integrantes_id_seq', 50, true);


--
-- Name: brigada_localidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brigada_localidades_id_seq', 14, true);


--
-- Name: brigadas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brigadas_id_seq', 10, true);


--
-- Name: campanias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.campanias_id_seq', 12, true);


--
-- Name: insumos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.insumos_id_seq', 24, true);


--
-- Name: inventario_biologico_lotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventario_biologico_lotes_id_seq', 3, true);


--
-- Name: localidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.localidades_id_seq', 16, true);


--
-- Name: movimientos_biologicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movimientos_biologicos_id_seq', 14, true);


--
-- Name: movimientos_insumos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movimientos_insumos_id_seq', 24, true);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificaciones_id_seq', 7, true);


--
-- Name: origenes_recorrido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.origenes_recorrido_id_seq', 1, true);


--
-- Name: permiso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permiso_id_seq', 3, true);


--
-- Name: personal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_id_seq', 40, true);


--
-- Name: personal_numero_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_numero_seq', 1, false);


--
-- Name: puntos_vacunacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.puntos_vacunacion_id_seq', 26, true);


--
-- Name: recorridos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recorridos_id_seq', 28, true);


--
-- Name: rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rol_id_seq', 7, true);


--
-- Name: telegram_codigos_vinculacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.telegram_codigos_vinculacion_id_seq', 1, false);


--
-- Name: telegram_consultas_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.telegram_consultas_auditoria_id_seq', 1, false);


--
-- Name: telegram_vinculaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.telegram_vinculaciones_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 9, true);


--
-- Name: vehiculos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehiculos_id_seq', 10, true);


--
-- Name: visita_jornadas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visita_jornadas_id_seq', 28, true);


--
-- Name: visitas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visitas_id_seq', 14, true);


--
-- Name: biologicos biologicos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biologicos
    ADD CONSTRAINT biologicos_codigo_key UNIQUE (codigo);


--
-- Name: biologicos biologicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biologicos
    ADD CONSTRAINT biologicos_pkey PRIMARY KEY (id);


--
-- Name: brigada_integrantes brigada_integrantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_integrantes
    ADD CONSTRAINT brigada_integrantes_pkey PRIMARY KEY (id);


--
-- Name: brigada_localidades brigada_localidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_localidades
    ADD CONSTRAINT brigada_localidades_pkey PRIMARY KEY (id);


--
-- Name: brigadas brigadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigadas
    ADD CONSTRAINT brigadas_pkey PRIMARY KEY (id);


--
-- Name: campanias campanias_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias
    ADD CONSTRAINT campanias_codigo_key UNIQUE (codigo);


--
-- Name: campanias campanias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias
    ADD CONSTRAINT campanias_pkey PRIMARY KEY (id);


--
-- Name: insumos insumos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_codigo_key UNIQUE (codigo);


--
-- Name: insumos insumos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_nombre_key UNIQUE (nombre);


--
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id);


--
-- Name: inventario_biologico_lotes inventario_biologico_lotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_biologico_lotes
    ADD CONSTRAINT inventario_biologico_lotes_pkey PRIMARY KEY (id);


--
-- Name: localidades localidades_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localidades
    ADD CONSTRAINT localidades_codigo_key UNIQUE (codigo);


--
-- Name: localidades localidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.localidades
    ADD CONSTRAINT localidades_pkey PRIMARY KEY (id);


--
-- Name: movimientos_biologicos movimientos_biologicos_clave_registro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_biologicos
    ADD CONSTRAINT movimientos_biologicos_clave_registro_key UNIQUE (clave_registro);


--
-- Name: movimientos_biologicos movimientos_biologicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_biologicos
    ADD CONSTRAINT movimientos_biologicos_pkey PRIMARY KEY (id);


--
-- Name: movimientos_insumos movimientos_insumos_clave_registro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_insumos
    ADD CONSTRAINT movimientos_insumos_clave_registro_key UNIQUE (clave_registro);


--
-- Name: movimientos_insumos movimientos_insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_insumos
    ADD CONSTRAINT movimientos_insumos_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: origenes_recorrido origenes_recorrido_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.origenes_recorrido
    ADD CONSTRAINT origenes_recorrido_codigo_key UNIQUE (codigo);


--
-- Name: origenes_recorrido origenes_recorrido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.origenes_recorrido
    ADD CONSTRAINT origenes_recorrido_pkey PRIMARY KEY (id);


--
-- Name: permiso permiso_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permiso
    ADD CONSTRAINT permiso_clave_key UNIQUE (clave);


--
-- Name: permiso permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permiso
    ADD CONSTRAINT permiso_pkey PRIMARY KEY (id);


--
-- Name: personal personal_curp_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT personal_curp_key UNIQUE (curp);


--
-- Name: personal personal_numero_empleado_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT personal_numero_empleado_key UNIQUE (numero_empleado);


--
-- Name: personal personal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT personal_pkey PRIMARY KEY (id);


--
-- Name: campanias_biologicos pk_campanias_biologicos; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias_biologicos
    ADD CONSTRAINT pk_campanias_biologicos PRIMARY KEY (campania_id, biologico_id);


--
-- Name: campanias_localidades pk_campanias_localidades; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias_localidades
    ADD CONSTRAINT pk_campanias_localidades PRIMARY KEY (campania_id, localidad_id);


--
-- Name: puntos_vacunacion puntos_vacunacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_vacunacion
    ADD CONSTRAINT puntos_vacunacion_pkey PRIMARY KEY (id);


--
-- Name: recorridos recorridos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorridos
    ADD CONSTRAINT recorridos_pkey PRIMARY KEY (id);


--
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- Name: rol_permiso rol_permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_pkey PRIMARY KEY (rol_id, permiso_id);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id);


--
-- Name: telegram_codigos_vinculacion telegram_codigos_vinculacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_codigos_vinculacion
    ADD CONSTRAINT telegram_codigos_vinculacion_pkey PRIMARY KEY (id);


--
-- Name: telegram_consultas_auditoria telegram_consultas_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_consultas_auditoria
    ADD CONSTRAINT telegram_consultas_auditoria_pkey PRIMARY KEY (id);


--
-- Name: telegram_vinculaciones telegram_vinculaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_vinculaciones
    ADD CONSTRAINT telegram_vinculaciones_pkey PRIMARY KEY (id);


--
-- Name: telegram_vinculaciones telegram_vinculaciones_telegram_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_vinculaciones
    ADD CONSTRAINT telegram_vinculaciones_telegram_user_id_key UNIQUE (telegram_user_id);


--
-- Name: brigada_integrantes uq_brigada_personal; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_integrantes
    ADD CONSTRAINT uq_brigada_personal UNIQUE (brigada_id, personal_id);


--
-- Name: brigadas uq_brigadas_codigo_campania; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigadas
    ADD CONSTRAINT uq_brigadas_codigo_campania UNIQUE (campania_id, codigo);


--
-- Name: brigadas uq_brigadas_id_campania; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigadas
    ADD CONSTRAINT uq_brigadas_id_campania UNIQUE (id, campania_id);


--
-- Name: brigada_localidades uq_localidad_por_campania; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_localidades
    ADD CONSTRAINT uq_localidad_por_campania UNIQUE (campania_id, localidad_id);


--
-- Name: inventario_biologico_lotes uq_lote_por_campania_biologico; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_biologico_lotes
    ADD CONSTRAINT uq_lote_por_campania_biologico UNIQUE (campania_id, biologico_id, codigo_lote);


--
-- Name: puntos_vacunacion uq_punto_por_localidad; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_vacunacion
    ADD CONSTRAINT uq_punto_por_localidad UNIQUE (localidad_id, nombre);


--
-- Name: recorridos uq_recorrido_jornada; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorridos
    ADD CONSTRAINT uq_recorrido_jornada UNIQUE (visita_jornada_id);


--
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- Name: usuarios usuarios_personal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_personal_id_key UNIQUE (personal_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: vehiculos vehiculos_numero_economico_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_numero_economico_key UNIQUE (numero_economico);


--
-- Name: vehiculos vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_placas_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_placas_key UNIQUE (placas);


--
-- Name: visita_jornadas visita_jornadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visita_jornadas
    ADD CONSTRAINT visita_jornadas_pkey PRIMARY KEY (id);


--
-- Name: visitas visitas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_codigo_key UNIQUE (codigo);


--
-- Name: visitas visitas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_pkey PRIMARY KEY (id);


--
-- Name: idx_brigada_integrantes_brigada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brigada_integrantes_brigada ON public.brigada_integrantes USING btree (brigada_id);


--
-- Name: idx_brigada_integrantes_personal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brigada_integrantes_personal ON public.brigada_integrantes USING btree (personal_id);


--
-- Name: idx_brigada_localidades_brigada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brigada_localidades_brigada ON public.brigada_localidades USING btree (brigada_id);


--
-- Name: idx_brigadas_campania; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brigadas_campania ON public.brigadas USING btree (campania_id);


--
-- Name: idx_campanias_biologicos_biologico; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanias_biologicos_biologico ON public.campanias_biologicos USING btree (biologico_id);


--
-- Name: idx_campanias_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanias_categoria ON public.campanias USING btree (categoria);


--
-- Name: idx_campanias_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanias_estado ON public.campanias USING btree (estado);


--
-- Name: idx_campanias_responsable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanias_responsable ON public.campanias USING btree (responsable_id);


--
-- Name: idx_cl_localidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cl_localidad ON public.campanias_localidades USING btree (localidad_id);


--
-- Name: idx_localidades_ubicacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_localidades_ubicacion ON public.localidades USING gist (ubicacion);


--
-- Name: idx_mov_biologicos_brigada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_biologicos_brigada ON public.movimientos_biologicos USING btree (brigada_id) WHERE (brigada_id IS NOT NULL);


--
-- Name: idx_mov_biologicos_jornada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_biologicos_jornada ON public.movimientos_biologicos USING btree (visita_jornada_id) WHERE (visita_jornada_id IS NOT NULL);


--
-- Name: idx_mov_biologicos_lote_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_biologicos_lote_fecha ON public.movimientos_biologicos USING btree (lote_id, fecha_operacion DESC);


--
-- Name: idx_mov_biologicos_visita; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_biologicos_visita ON public.movimientos_biologicos USING btree (visita_id) WHERE (visita_id IS NOT NULL);


--
-- Name: idx_mov_insumos_insumo_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_insumos_insumo_fecha ON public.movimientos_insumos USING btree (insumo_id, fecha_operacion DESC);


--
-- Name: idx_notificaciones_feed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificaciones_feed ON public.notificaciones USING btree (fecha_creacion DESC);


--
-- Name: idx_notificaciones_pendientes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificaciones_pendientes ON public.notificaciones USING btree (fecha_creacion DESC) WHERE ((leida_at IS NULL) AND (resuelta_at IS NULL));


--
-- Name: idx_personal_rol_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personal_rol_id ON public.personal USING btree (rol_id);


--
-- Name: idx_puntos_vacunacion_localidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_puntos_vacunacion_localidad ON public.puntos_vacunacion USING btree (localidad_id);


--
-- Name: idx_puntos_vacunacion_ubicacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_puntos_vacunacion_ubicacion ON public.puntos_vacunacion USING gist (ubicacion);


--
-- Name: idx_recorridos_geometria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recorridos_geometria ON public.recorridos USING gist (geometria);


--
-- Name: idx_recorridos_origen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recorridos_origen ON public.recorridos USING btree (origen_id);


--
-- Name: idx_tg_codigos_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tg_codigos_hash ON public.telegram_codigos_vinculacion USING btree (codigo_hash);


--
-- Name: idx_visita_jornadas_fechas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visita_jornadas_fechas ON public.visita_jornadas USING btree (fecha_inicio, fecha_fin);


--
-- Name: idx_visita_jornadas_punto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visita_jornadas_punto ON public.visita_jornadas USING btree (punto_vacunacion_id);


--
-- Name: idx_visita_jornadas_visita; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visita_jornadas_visita ON public.visita_jornadas USING btree (visita_id);


--
-- Name: idx_visitas_brigada_localidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitas_brigada_localidad ON public.visitas USING btree (brigada_localidad_id);


--
-- Name: uq_brigada_funcion_individual; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_brigada_funcion_individual ON public.brigada_integrantes USING btree (brigada_id, funcion) WHERE ((funcion)::text = ANY ((ARRAY['responsable'::character varying, 'medico'::character varying, 'conductor'::character varying])::text[]));


--
-- Name: uq_campanias_biologicos_campania_biologico; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_campanias_biologicos_campania_biologico ON public.campanias_biologicos USING btree (campania_id, biologico_id);


--
-- Name: uq_notificacion_activa_clave; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_notificacion_activa_clave ON public.notificaciones USING btree (clave_deduplicacion) WHERE ((clave_deduplicacion IS NOT NULL) AND (resuelta_at IS NULL));


--
-- Name: uq_origen_recorrido_principal; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_origen_recorrido_principal ON public.origenes_recorrido USING btree (es_principal) WHERE (es_principal = true);


--
-- Name: uq_visita_jornada_punto_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_visita_jornada_punto_periodo ON public.visita_jornadas USING btree (visita_id, punto_vacunacion_id, fecha_inicio, fecha_fin);


--
-- Name: personal trg_generar_numero_empleado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_generar_numero_empleado BEFORE INSERT ON public.personal FOR EACH ROW EXECUTE FUNCTION public.generar_numero_empleado();


--
-- Name: brigada_integrantes fk_bi_brigada; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_integrantes
    ADD CONSTRAINT fk_bi_brigada FOREIGN KEY (brigada_id, campania_id) REFERENCES public.brigadas(id, campania_id) ON DELETE CASCADE;


--
-- Name: brigada_integrantes fk_bi_personal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_integrantes
    ADD CONSTRAINT fk_bi_personal FOREIGN KEY (personal_id) REFERENCES public.personal(id) ON DELETE RESTRICT;


--
-- Name: brigada_localidades fk_bl_brigada; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_localidades
    ADD CONSTRAINT fk_bl_brigada FOREIGN KEY (brigada_id, campania_id) REFERENCES public.brigadas(id, campania_id) ON DELETE CASCADE;


--
-- Name: brigada_localidades fk_bl_campania_localidad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigada_localidades
    ADD CONSTRAINT fk_bl_campania_localidad FOREIGN KEY (campania_id, localidad_id) REFERENCES public.campanias_localidades(campania_id, localidad_id) ON DELETE RESTRICT;


--
-- Name: brigadas fk_brigadas_campania; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brigadas
    ADD CONSTRAINT fk_brigadas_campania FOREIGN KEY (campania_id) REFERENCES public.campanias(id) ON DELETE CASCADE;


--
-- Name: campanias fk_campania_responsable; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias
    ADD CONSTRAINT fk_campania_responsable FOREIGN KEY (responsable_id) REFERENCES public.personal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: campanias_biologicos fk_cb_biologico; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias_biologicos
    ADD CONSTRAINT fk_cb_biologico FOREIGN KEY (biologico_id) REFERENCES public.biologicos(id) ON DELETE RESTRICT;


--
-- Name: campanias_biologicos fk_cb_campania; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias_biologicos
    ADD CONSTRAINT fk_cb_campania FOREIGN KEY (campania_id) REFERENCES public.campanias(id) ON DELETE CASCADE;


--
-- Name: campanias_localidades fk_cl_campania; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias_localidades
    ADD CONSTRAINT fk_cl_campania FOREIGN KEY (campania_id) REFERENCES public.campanias(id) ON DELETE CASCADE;


--
-- Name: campanias_localidades fk_cl_localidad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanias_localidades
    ADD CONSTRAINT fk_cl_localidad FOREIGN KEY (localidad_id) REFERENCES public.localidades(id) ON DELETE CASCADE;


--
-- Name: visita_jornadas fk_jornadas_punto; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visita_jornadas
    ADD CONSTRAINT fk_jornadas_punto FOREIGN KEY (punto_vacunacion_id) REFERENCES public.puntos_vacunacion(id) ON DELETE RESTRICT;


--
-- Name: visita_jornadas fk_jornadas_visita; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visita_jornadas
    ADD CONSTRAINT fk_jornadas_visita FOREIGN KEY (visita_id) REFERENCES public.visitas(id) ON DELETE CASCADE;


--
-- Name: inventario_biologico_lotes fk_lote_campania_biologico; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_biologico_lotes
    ADD CONSTRAINT fk_lote_campania_biologico FOREIGN KEY (campania_id, biologico_id) REFERENCES public.campanias_biologicos(campania_id, biologico_id) ON DELETE RESTRICT;


--
-- Name: personal fk_personal_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT fk_personal_rol FOREIGN KEY (rol_id) REFERENCES public.rol(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: puntos_vacunacion fk_puntos_localidad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_vacunacion
    ADD CONSTRAINT fk_puntos_localidad FOREIGN KEY (localidad_id) REFERENCES public.localidades(id) ON DELETE RESTRICT;


--
-- Name: recorridos fk_recorrido_jornada; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorridos
    ADD CONSTRAINT fk_recorrido_jornada FOREIGN KEY (visita_jornada_id) REFERENCES public.visita_jornadas(id) ON DELETE CASCADE;


--
-- Name: recorridos fk_recorrido_origen; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorridos
    ADD CONSTRAINT fk_recorrido_origen FOREIGN KEY (origen_id) REFERENCES public.origenes_recorrido(id) ON DELETE RESTRICT;


--
-- Name: vehiculos fk_vehiculos_conductor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT fk_vehiculos_conductor FOREIGN KEY (conductor_id) REFERENCES public.personal(id);


--
-- Name: visitas fk_visitas_brigada_localidad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT fk_visitas_brigada_localidad FOREIGN KEY (brigada_localidad_id) REFERENCES public.brigada_localidades(id) ON DELETE CASCADE;


--
-- Name: movimientos_biologicos movimientos_biologicos_brigada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_biologicos
    ADD CONSTRAINT movimientos_biologicos_brigada_id_fkey FOREIGN KEY (brigada_id) REFERENCES public.brigadas(id) ON DELETE RESTRICT;


--
-- Name: movimientos_biologicos movimientos_biologicos_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_biologicos
    ADD CONSTRAINT movimientos_biologicos_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.inventario_biologico_lotes(id) ON DELETE RESTRICT;


--
-- Name: movimientos_biologicos movimientos_biologicos_visita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_biologicos
    ADD CONSTRAINT movimientos_biologicos_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id) ON DELETE RESTRICT;


--
-- Name: movimientos_biologicos movimientos_biologicos_visita_jornada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_biologicos
    ADD CONSTRAINT movimientos_biologicos_visita_jornada_id_fkey FOREIGN KEY (visita_jornada_id) REFERENCES public.visita_jornadas(id) ON DELETE RESTRICT;


--
-- Name: movimientos_insumos movimientos_insumos_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_insumos
    ADD CONSTRAINT movimientos_insumos_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id) ON DELETE RESTRICT;


--
-- Name: notificaciones notificaciones_campania_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_campania_id_fkey FOREIGN KEY (campania_id) REFERENCES public.campanias(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.inventario_biologico_lotes(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_movimiento_biologico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_movimiento_biologico_id_fkey FOREIGN KEY (movimiento_biologico_id) REFERENCES public.movimientos_biologicos(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_movimiento_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_movimiento_insumo_id_fkey FOREIGN KEY (movimiento_insumo_id) REFERENCES public.movimientos_insumos(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_visita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_visita_jornada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_visita_jornada_id_fkey FOREIGN KEY (visita_jornada_id) REFERENCES public.visita_jornadas(id) ON DELETE SET NULL;


--
-- Name: rol_permiso rol_permiso_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permiso(id) ON DELETE CASCADE;


--
-- Name: rol_permiso rol_permiso_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol(id) ON DELETE CASCADE;


--
-- Name: telegram_codigos_vinculacion telegram_codigos_vinculacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_codigos_vinculacion
    ADD CONSTRAINT telegram_codigos_vinculacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: telegram_consultas_auditoria telegram_consultas_auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_consultas_auditoria
    ADD CONSTRAINT telegram_consultas_auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: telegram_vinculaciones telegram_vinculaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_vinculaciones
    ADD CONSTRAINT telegram_vinculaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_personal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES public.personal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


