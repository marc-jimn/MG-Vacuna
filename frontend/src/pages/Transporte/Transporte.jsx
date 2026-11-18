import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import vehiculoService from "../../services/vehiculoService";
import api from "../../services/api";
import "./Transporte.css";

const API_URL = "http://localhost:3000";

const modelos = [
  {
    marca: "Nissan",
    modelo: "Urvan",
    nombre: "Nissan Urvan",
    imagen: "/uploads/transporte/nissan-urvan.png",
    descripcion: "Unidad de transporte para traslado de personal.",
    tipo: "Van de pasajeros",
  },
  {
    marca: "Toyota",
    modelo: "Hiace",
    nombre: "Toyota Hiace",
    imagen: "/uploads/transporte/toyota-hiace.png",
    descripcion: "Vehículo de transporte amplio y versátil.",
    tipo: "Van de pasajeros",
  },
  {
    marca: "Nissan",
    modelo: "NP300",
    nombre: "Nissan NP300",
    imagen: "/uploads/transporte/nissan-np300.png",
    descripcion: "Unidad de carga y apoyo operativo.",
    tipo: "Pickup",
  },
  {
    marca: "Ford",
    modelo: "Ranger",
    nombre: "Ford Ranger",
    imagen: "/uploads/transporte/ford-ranger.png",
    descripcion: "Vehículo de apoyo para actividades de campo.",
    tipo: "Pickup",
  },
  {
    marca: "Ford",
    modelo: "Transit",
    nombre: "Ford Transit",
    imagen: "/uploads/transporte/ford-transit.png",
    descripcion: "Unidad para traslado de personal y equipo.",
    tipo: "Van de pasajeros",
  },
];

const obtenerNombreConductor = (vehiculo) => {
  if (!vehiculo.conductor_id) return "Sin conductor asignado";

  const nombre = [
    vehiculo.conductor_nombres,
    vehiculo.conductor_apellido_paterno,
    vehiculo.conductor_apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");

  return nombre || "Conductor asignado";
};

const obtenerClaseEstado = (estado) => {
  const clases = {
    disponible: "estado-disponible",
    en_uso: "estado-en-uso",
    mantenimiento: "estado-mantenimiento",
    fuera_servicio: "estado-fuera",
  };

  return clases[estado] || "estado-desconocido";
};

const formatearEstado = (estado) => {
  const nombres = {
    disponible: "Disponible",
    en_uso: "En uso",
    mantenimiento: "Mantenimiento",
    fuera_servicio: "Fuera de servicio",
  };

  return nombres[estado] || estado || "Sin estado";
};

const formularioInicial = {
  numero_economico: "",
  marca: "Nissan",
  modelo: "Urvan",
  anio: "",
  placas: "",
  color: "Blanco",
  capacidad_personas: "",
  kilometraje: 0,
  estado: "disponible",
  conductor_id: "",
};

function Transporte() {
  const [vehiculos, setVehiculos] = useState([]);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [rotacionCarrusel, setRotacionCarrusel] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estados del formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [conductores, setConductores] = useState([]);

  const [datosFormulario, setDatosFormulario] = useState({
    ...formularioInicial,
  });

  // Cargar vehículos desde el servidor
  const cargarVehiculos = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await vehiculoService.obtenerVehiculos();

      const registros = Array.isArray(respuesta)
        ? respuesta
        : Array.isArray(respuesta?.datos)
          ? respuesta.datos
          : Array.isArray(respuesta?.data)
            ? respuesta.data
            : [];

      setVehiculos(registros);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);

      setError(
        error.response?.data?.mensaje ||
          "No fue posible cargar los vehículos. Verifica que el backend esté iniciado."
      );
    } finally {
      setCargando(false);
    }
  };

  // Cargar personal para asignar conductores
  const cargarPersonal = async () => {
    try {
      const respuesta = await api.get("/personal");

      const registros = Array.isArray(respuesta.data)
        ? respuesta.data
        : Array.isArray(respuesta.data?.datos)
          ? respuesta.data.datos
          : Array.isArray(respuesta.data?.data)
            ? respuesta.data.data
            : [];

      setConductores(
        registros.filter((persona) => Number(persona.rol_id) === 7)
      );

    } catch (error) {
      console.error("Error al cargar personal:", error);
    }
  };

  // Cargar registros al entrar al módulo
  useEffect(() => {
  const inicializar = async () => {
    await Promise.all([
      cargarVehiculos(),
      cargarPersonal(),
    ]);
  };
    inicializar();
  }, []);

  // Modelo actualmente seleccionado
  const modeloActivo = modelos[indiceActivo];

  // Filtrar vehículos del modelo seleccionado
  const vehiculosDelModelo = useMemo(() => {
    if (!modeloActivo) return [];

    return vehiculos
      .filter(
        (vehiculo) =>
          vehiculo.marca?.toLowerCase() ===
            modeloActivo.marca.toLowerCase() &&
          vehiculo.modelo?.toLowerCase() ===
            modeloActivo.modelo.toLowerCase()
      )
      .sort((a, b) => Number(a.id) - Number(b.id));
  }, [vehiculos, modeloActivo]);

  // Resumen de unidades por estado
  const resumen = useMemo(() => {
    return {
      total: vehiculosDelModelo.length,

      disponibles: vehiculosDelModelo.filter(
        (v) => v.estado === "disponible"
      ).length,

      enUso: vehiculosDelModelo.filter(
        (v) => v.estado === "en_uso"
      ).length,

      mantenimiento: vehiculosDelModelo.filter(
        (v) => v.estado === "mantenimiento"
      ).length,

      fueraServicio: vehiculosDelModelo.filter(
        (v) => v.estado === "fuera_servicio"
      ).length,
    };
  }, [vehiculosDelModelo]);

  // Ángulo de separación entre vehículos
  const anguloModelo = 360 / modelos.length;

  // Cambiar modelo con rotación continua
  const cambiarModelo = (direccion) => {
    setIndiceActivo((actual) => {
      return (
        (actual + direccion + modelos.length) % modelos.length
      );
    });

    setRotacionCarrusel((actual) => {
      return actual + direccion * anguloModelo;
    });
  };

  // Seleccionar modelo directamente
  const seleccionarModelo = (indice) => {
    const diferencia = indice - indiceActivo;

    setIndiceActivo(indice);

    setRotacionCarrusel((actual) => {
      return actual + diferencia * anguloModelo;
    });
  };

  // Manejar cambios del formulario
  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target;

    if (name === "modelo") {
      const modeloSeleccionado = modelos.find(
        (modelo) => modelo.modelo === value
      );

      if (modeloSeleccionado) {
        setDatosFormulario((actual) => ({
          ...actual,
          marca: modeloSeleccionado.marca,
          modelo: modeloSeleccionado.modelo,
        }));
      }

      return;
    }

    setDatosFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  // Registrar nueva unidad
  const registrarUnidad = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");

      const modeloSeleccionado = modelos.find(
        (modelo) => modelo.modelo === datosFormulario.modelo
      );

      if (!modeloSeleccionado) {
        setError("Selecciona un modelo válido.");
        return;
      }

      const datos = {
        ...datosFormulario,
        marca: modeloSeleccionado.marca,
        anio: Number(datosFormulario.anio),
        capacidad_personas: Number(
          datosFormulario.capacidad_personas
        ),
        kilometraje: Number(datosFormulario.kilometraje || 0),
        conductor_id: datosFormulario.conductor_id
          ? Number(datosFormulario.conductor_id)
          : null,
        foto: modeloSeleccionado.imagen,
      };

      await vehiculoService.crearVehiculo(datos);

      await cargarVehiculos();

      const nuevoIndice = modelos.findIndex(
        (modelo) => modelo.modelo === datos.modelo
      );

      if (nuevoIndice !== -1) {
        seleccionarModelo(nuevoIndice);
      }

      setDatosFormulario({ ...formularioInicial });
      setMostrarFormulario(false);

    } catch (error) {
      console.error("Error al registrar unidad:", error);

      setError(
        error.response?.data?.mensaje ||
          error.response?.data?.error ||
          "No fue posible registrar la unidad. Revisa los datos e inténtalo nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="transporte-page">

      <PageHeader
        titulo="Transporte"
        descripcion="Administración y control de la flotilla vehicular."
        accion="Registrar vehículo"
        onAccion={() => {
          setError("");
          setMostrarFormulario(true);
        }}
      />

      <section className="transporte-contenido">

        {/* IZQUIERDA: CARRUSEL DE MODELOS */}
        <aside className="transporte-panel-carrusel">

          <div className="carrusel-encabezado">
            <span className="transporte-etiqueta">
              FLOTILLA VEHICULAR
            </span>

            <h3>Explora los modelos</h3>

            <p>
              Selecciona un vehículo para consultar sus unidades.
            </p>
          </div>

          {/* CARRUSEL 3D */}
          <div className="carrusel-escenario">
            <div className="carrusel-brillo" />
            <div className="carrusel-piso" />

            <div
              className="carrusel-rueda"
              style={{
                transform: `rotateY(${-rotacionCarrusel}deg)`,
              }}
            >
              {modelos.map((modelo, indice) => (
                <button
                  key={modelo.nombre}
                  type="button"
                  className={`carrusel-vehiculo ${
                    indice === indiceActivo
                      ? "carrusel-activo"
                      : ""
                  }`}
                  style={{
                    transform: `
                      rotateY(${indice * anguloModelo}deg)
                      translateZ(var(--radio-carrusel))
                    `,
                  }}
                  onClick={() => seleccionarModelo(indice)}
                  aria-label={`Seleccionar ${modelo.nombre}`}
                  aria-pressed={indice === indiceActivo}
                >
                  <img
                    src={`${API_URL}${modelo.imagen}`}
                    alt={modelo.nombre}
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                  />

                  <span>{modelo.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CONTROLES */}
          <div className="carrusel-controles">

            <button
              type="button"
              className="carrusel-flecha"
              onClick={() => cambiarModelo(-1)}
              aria-label="Modelo anterior"
            >
              ‹
            </button>

            <div className="carrusel-indicadores">
              {modelos.map((modelo, indice) => (
                <button
                  key={modelo.nombre}
                  type="button"
                  className={
                    indice === indiceActivo
                      ? "indicador-activo"
                      : ""
                  }
                  onClick={() => seleccionarModelo(indice)}
                  aria-label={`Ir a ${modelo.nombre}`}
                  aria-current={
                    indice === indiceActivo ? "true" : undefined
                  }
                />
              ))}
            </div>

            <button
              type="button"
              className="carrusel-flecha"
              onClick={() => cambiarModelo(1)}
              aria-label="Modelo siguiente"
            >
              ›
            </button>

          </div>

          {/* MODELO SELECCIONADO */}
          <div className="carrusel-seleccion">
            <span>MODELO ACTUAL</span>

            <strong>{modeloActivo.nombre}</strong>

            <small>
              {vehiculosDelModelo.length}{" "}
              {vehiculosDelModelo.length === 1
                ? "unidad registrada"
                : "unidades registradas"}
            </small>
          </div>

        </aside>

        {/* DERECHA: INFORMACIÓN E INVENTARIO */}
        <div className="transporte-panel-modelo">
          <div className="transporte-panel-superior">
            <div>
              <span className="transporte-etiqueta">
                MODELO SELECCIONADO
              </span>

              <h2>{modeloActivo.nombre}</h2>

              <p>{modeloActivo.descripcion}</p>
            </div>

            <span className="transporte-tipo">
              {modeloActivo.tipo}
            </span>
          </div>

          {/* RESUMEN DE UNIDADES */}
          <div className="transporte-resumen">

            <div className="resumen-item resumen-total">
              <span>Total de unidades</span>
              <strong>{resumen.total}</strong>
            </div>

            <div className="resumen-item">
              <span>Disponibles</span>
              <strong>{resumen.disponibles}</strong>
            </div>

            <div className="resumen-item">
              <span>En uso</span>
              <strong>{resumen.enUso}</strong>
            </div>

            <div className="resumen-item">
              <span>En mantenimiento</span>
              <strong>{resumen.mantenimiento}</strong>
            </div>

            <div className="resumen-item">
              <span>Fuera de servicio</span>
              <strong>{resumen.fueraServicio}</strong>
            </div>

          </div>

          {/* ENCABEZADO DEL INVENTARIO */}
          <div className="transporte-listado-encabezado">
            <div>
              <span className="transporte-etiqueta">
                INVENTARIO
              </span>

              <h3>Unidades de este modelo</h3>
            </div>

            <span className="transporte-contador">
              {vehiculosDelModelo.length} unidades
            </span>
          </div>

          {/* ESTADOS DE CARGA */}
          {cargando ? (
            <div className="transporte-mensaje">
              <div className="transporte-spinner" />
              <p>Cargando flotilla...</p>
            </div>
          ) : error && !mostrarFormulario ? (
            <div className="transporte-error">
              <span>!</span>

              <div>
                <strong>
                  No se pudo cargar la información
                </strong>

                <p>{error}</p>

                <button
                  type="button"
                  onClick={cargarVehiculos}
                >
                  Volver a intentar
                </button>
              </div>
            </div>
          ) : vehiculosDelModelo.length === 0 ? (
            <div className="transporte-vacio">
              <span className="transporte-vacio-icono">
                ⌕
              </span>

              <strong>
                No hay unidades registradas
              </strong>

              <p>
                No encontramos vehículos de este modelo.
              </p>
            </div>
          ) : (
            /* LISTADO DE VEHÍCULOS */
            <div className="transporte-unidades">
              {vehiculosDelModelo.map((vehiculo) => (
                <article
                  className="unidad-card"
                  key={vehiculo.id}
                >
                  <div className="unidad-identificador">
                    <div className="unidad-icono">
                      🚐
                    </div>

                    <div>
                      <strong>
                        {vehiculo.numero_economico}
                      </strong>

                      <span>
                        {vehiculo.marca} {vehiculo.modelo} ·{" "}
                        {vehiculo.anio}
                      </span>
                    </div>
                  </div>

                  <div className="unidad-datos">

                    <div>
                      <span>Placas</span>

                      <strong>
                        {vehiculo.placas || "Sin placas"}
                      </strong>
                    </div>

                    <div>
                      <span>Kilometraje</span>

                      <strong>
                        {Number(
                          vehiculo.kilometraje || 0
                        ).toLocaleString("es-MX")} km
                      </strong>
                    </div>

                    <div>
                      <span>Conductor</span>

                      <strong>
                        {obtenerNombreConductor(vehiculo)}
                      </strong>
                    </div>

                    <div>
                      <span>Capacidad</span>

                      <strong>
                        {vehiculo.capacidad_personas
                          ? `${vehiculo.capacidad_personas} personas`
                          : "No especificada"}
                      </strong>
                    </div>

                  </div>

                  <div className="unidad-pie">

                    <span
                      className={`unidad-estado ${obtenerClaseEstado(
                        vehiculo.estado
                      )}`}
                    >
                      <i />
                      {formatearEstado(vehiculo.estado)}
                    </span>

                    <span className="unidad-color">
                      <i
                        style={{
                          backgroundColor:
                            vehiculo.color?.toLowerCase() || "#ddd",
                        }}
                      />

                      {vehiculo.color || "Sin color"}
                    </span>

                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* MODAL PARA REGISTRAR UNIDAD */}
      {mostrarFormulario && (
        <div
          className="transporte-modal-fondo"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !guardando
            ) {
              setMostrarFormulario(false);
            }
          }}
        >
          <div
            className="transporte-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-transporte"
          >

            {/* ENCABEZADO DEL MODAL */}
            <div className="transporte-modal-encabezado">
              <div>
                <span className="transporte-etiqueta">
                  ADMINISTRACIÓN DE FLOTILLA
                </span>

                <h2 id="titulo-formulario-transporte">
                  Registrar unidad
                </h2>

                <p>
                  Ingresa la información del nuevo vehículo.
                </p>
              </div>

              <button
                type="button"
                className="transporte-modal-cerrar"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

            <form onSubmit={registrarUnidad}>

              <div className="transporte-formulario-contenido">

                {/* SECCIÓN 01 */}
                <div className="formulario-seccion-titulo">
                  <span>01</span>
                  Información de la unidad
                </div>

                <div className="transporte-form-grid">

                  <div className="transporte-campo">
                    <label>Número económico *</label>

                    <input
                      type="text"
                      name="numero_economico"
                      placeholder="Ej. VS-011"
                      value={datosFormulario.numero_economico}
                      onChange={manejarCambioFormulario}
                      required
                      maxLength={30}
                    />
                  </div>

                  <div className="transporte-campo">
                    <label>Modelo del vehículo *</label>

                    <select
                      name="modelo"
                      value={datosFormulario.modelo}
                      onChange={manejarCambioFormulario}
                      required
                    >
                      {modelos.map((modelo) => (
                        <option
                          key={modelo.modelo}
                          value={modelo.modelo}
                        >
                          {modelo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="transporte-campo">
                    <label>Marca</label>

                    <input
                      type="text"
                      value={datosFormulario.marca}
                      readOnly
                    />
                  </div>

                  <div className="transporte-campo">
                    <label>Año *</label>

                    <input
                      type="number"
                      name="anio"
                      placeholder="Ej. 2024"
                      min="1980"
                      max="2100"
                      value={datosFormulario.anio}
                      onChange={manejarCambioFormulario}
                      required
                    />
                  </div>

                  <div className="transporte-campo">
                    <label>Placas</label>

                    <input
                      type="text"
                      name="placas"
                      placeholder="Ej. DYA-123-C"
                      value={datosFormulario.placas}
                      onChange={manejarCambioFormulario}
                      maxLength={20}
                    />
                  </div>

                  <div className="transporte-campo">
                    <label>Color</label>

                    <input
                      type="text"
                      name="color"
                      placeholder="Ej. Blanco"
                      value={datosFormulario.color}
                      onChange={manejarCambioFormulario}
                      maxLength={40}
                    />
                  </div>

                </div>

                {/* SECCIÓN 02 */}
                <div className="formulario-seccion-titulo">
                  <span>02</span>
                  Capacidad y operación
                </div>

                <div className="transporte-form-grid">

                  <div className="transporte-campo">
                    <label>Capacidad de personas *</label>

                    <input
                      type="number"
                      name="capacidad_personas"
                      placeholder="Ej. 15"
                      min="1"
                      value={datosFormulario.capacidad_personas}
                      onChange={manejarCambioFormulario}
                      required
                    />
                  </div>

                  <div className="transporte-campo">
                    <label>Kilometraje actual *</label>

                    <input
                      type="number"
                      name="kilometraje"
                      min="0"
                      value={datosFormulario.kilometraje}
                      onChange={manejarCambioFormulario}
                      required
                    />
                  </div>

                  <div className="transporte-campo">
                    <label>Estado de la unidad *</label>

                    <select
                      name="estado"
                      value={datosFormulario.estado}
                      onChange={manejarCambioFormulario}
                      required
                    >
                      <option value="disponible">
                        Disponible
                      </option>

                      <option value="en_uso">
                        En uso
                      </option>

                      <option value="mantenimiento">
                        Mantenimiento
                      </option>

                      <option value="fuera_servicio">
                        Fuera de servicio
                      </option>
                    </select>
                  </div>

                  <div className="transporte-campo">
                    <label>Personal asignado</label>

                    <select
                      name="conductor_id"
                      value={datosFormulario.conductor_id}
                      onChange={manejarCambioFormulario}
                    >
                      <option value="">
                        Sin asignar
                      </option>

                      {conductores.map((persona) => (
                        <option
                          key={persona.id}
                          value={persona.id}
                        >
                          {persona.nombres}{" "}
                          {persona.apellido_paterno}{" "}
                          {persona.apellido_materno || ""}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* NOTA DE LA FOTOGRAFÍA */}
                <div className="transporte-foto-nota">
                  <span>✓</span>

                  <p>
                    La fotografía se asignará automáticamente según
                    el modelo seleccionado. Las unidades del mismo
                    modelo compartirán la misma imagen.
                  </p>
                </div>

                {/* MENSAJE DE ERROR */}
                {error && (
                  <div className="transporte-formulario-error">
                    {error}
                  </div>
                )}

              </div>

              {/* BOTONES DEL MODAL */}
              <div className="transporte-modal-pie">

                <button
                  type="button"
                  className="transporte-btn-cancelar"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="transporte-btn-guardar"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar unidad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transporte;