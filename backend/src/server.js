import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool, verificarConexion } from "./infrastructure/database/database.js";

// Personal

import { PersonalRepositoryPostgres } from "./infrastructure/repositories/PersonalRepositoryPostgres.js";

import { CrearPersonal } from "./application/use-cases/CrearPersonal.js";
import { ObtenerPersonal } from "./application/use-cases/ObtenerPersonal.js";
import { ObtenerPersonalPorId } from "./application/use-cases/ObtenerPersonalPorId.js";
import { ActualizarPersonal } from "./application/use-cases/ActualizarPersonal.js";
import { GuardarFotoPersonal } from "./application/use-cases/GuardarFotoPersonal.js";

import { PersonalController } from "./interfaces/http/controllers/PersonalController.js";
import { crearPersonalRoutes } from "./interfaces/http/routes/PersonalRoutes.js";

// Roles

import { RolRepositoryPostgres } from "./infrastructure/repositories/RolRepositoryPostgres.js";
import { ObtenerRoles } from "./application/use-cases/ObtenerRoles.js";
import { RolController } from "./interfaces/http/controllers/RolController.js";
import { crearRolRoutes } from "./interfaces/http/routes/RolRoutes.js";

// Localidades

import localidadRoutes from "./interfaces/http/routes/LocalidadRoutes.js";

// Campañas

import { CampaniaRepositoryPostgres } from "./infrastructure/repositories/CampaniaRepositoryPostgres.js";

import { CrearCampania } from "./application/use-cases/CrearCampania.js";
import { ObtenerCampanias } from "./application/use-cases/ObtenerCampanias.js";
import { ObtenerCampaniaPorId } from "./application/use-cases/ObtenerCampaniaPorId.js";
import { ActualizarCampania } from "./application/use-cases/ActualizarCampania.js";
import { ObtenerResponsablesCampania } from "./application/use-cases/ObtenerResponsablesCampania.js";

import { CampaniaController } from "./interfaces/http/controllers/CampaniaController.js";
import { crearCampaniaRoutes } from "./interfaces/http/routes/CampaniaRoutes.js";

// Vehículos

import { VehiculoRepositoryPostgres } from "./infrastructure/repositories/VehiculoRepositoryPostgres.js";

import { CrearVehiculo } from "./application/use-cases/CrearVehiculo.js";
import { ObtenerVehiculos } from "./application/use-cases/ObtenerVehiculos.js";
import { ObtenerVehiculoPorId } from "./application/use-cases/ObtenerVehiculoPorId.js";
import { ActualizarVehiculo } from "./application/use-cases/ActualizarVehiculo.js";
import { GuardarFotoVehiculo } from "./application/use-cases/GuardarFotoVehiculo.js";

import { VehiculoController } from "./interfaces/http/controllers/VehiculoController.js";
import { crearVehiculoRoutes } from "./interfaces/http/routes/VehiculoRoutes.js";

// Brigadas

import { BrigadaRepositoryPostgres } from "./infrastructure/repositories/BrigadaRepositoryPostgres.js";

import { CrearBrigada } from "./application/use-cases/CrearBrigada.js";
import { ObtenerBrigadas } from "./application/use-cases/ObtenerBrigadas.js";
import { ObtenerBrigadaPorId } from "./application/use-cases/ObtenerBrigadaPorId.js";
import { ActualizarBrigada } from "./application/use-cases/ActualizarBrigada.js";
import { AsignarIntegrantes } from "./application/use-cases/AsignarIntegrantes.js";
import { AsignarLocalidades } from "./application/use-cases/AsignarLocalidades.js";

import { BrigadaController } from "./interfaces/http/controllers/BrigadaController.js";
import { crearBrigadaRoutes } from "./interfaces/http/routes/BrigadaRoutes.js";

// Visitas

import { VisitaRepositoryPostgres } from "./infrastructure/repositories/VisitaRepositoryPostgres.js";

import { ObtenerVisitas } from "./application/use-cases/ObtenerVisitas.js";
import { ObtenerVisitaPorId } from "./application/use-cases/ObtenerVisitaPorId.js";
import { CrearVisita } from "./application/use-cases/CrearVisita.js";
import { ActualizarVisita } from "./application/use-cases/ActualizarVisita.js";
import { AgregarJornadasVisita } from "./application/use-cases/AgregarJornadasVisita.js";
import { ActualizarJornadaVisita } from "./application/use-cases/ActualizarJornadaVisita.js";
import { EliminarJornadaVisita } from "./application/use-cases/EliminarJornadaVisita.js";
import { CancelarVisita } from "./application/use-cases/CancelarVisita.js";
import { ObtenerCatalogosVisita } from "./application/use-cases/ObtenerCatalogosVisita.js";
import { CrearPuntoVacunacion } from "./application/use-cases/CrearPuntoVacunacion.js";
import { ActualizarEstadosVisitas } from "./application/use-cases/ActualizarEstadosVisitas.js";

import { VisitaController } from "./interfaces/http/controllers/VisitaController.js";
import { crearVisitaRoutes } from "./interfaces/http/routes/VisitaRoutes.js";

// Recorridos

import { OSRMService } from "./infrastructure/services/OSRMService.js";

import { RecorridoRepositoryPostgres } from "./infrastructure/repositories/RecorridoRepositoryPostgres.js";
import { ObtenerRecorridos } from "./application/use-cases/ObtenerRecorridos.js";
import { ObtenerRecorridosPorVisita } from "./application/use-cases/ObtenerRecorridosPorVisita.js";
import { CalcularRecorridosVisita } from "./application/use-cases/CalcularRecorridosVisita.js";

import { RecorridoController } from "./interfaces/http/controllers/RecorridoController.js";
import { crearRecorridoRoutes } from "./interfaces/http/routes/RecorridoRoutes.js";

// Inventario

import { crearRutasInventario } from "./interfaces/http/routes/InventarioRoutes.js";

// Reportes

import { crearRutasTablero } from "./interfaces/http/routes/TableroRoutes.js";

// Autenticación y usuarios

import { UsuarioRepositoryPostgres } from "./infrastructure/repositories/UsuarioRepositoryPostgres.js";

import { IniciarSesion } from "./application/use-cases/IniciarSesion.js";
import { ObtenerPerfil } from "./application/use-cases/ObtenerPerfil.js";
import { CambiarPassword } from "./application/use-cases/CambiarPassword.js";

import { AuthController } from "./interfaces/http/controllers/AuthController.js";

import { crearAuthRoutes } from "./interfaces/http/routes/AuthRoutes.js";
import { autenticarUsuario } from "./interfaces/http/middlewares/autenticarUsuario.js";
import { verificarPermiso } from "./interfaces/http/middlewares/verificarPermiso.js";

// Telegram y Ollama

import { TelegramService } from "./infrastructure/telegram/TelegramService.js";
import { OllamaService } from "./infrastructure/telegram/OllamaService.js";
import { TelegramBot } from "./infrastructure/telegram/TelegramBot.js";
import { crearTelegramRoutes } from "./interfaces/http/routes/TelegramRoutes.js";

import TableroRepositoryPostgres from "./infrastructure/repositories/TableroRepositoryPostgres.js";
import ObtenerReportes from "./application/use-cases/ObtenerReportes.js";

// Middlewares

import { errorHandler } from "./interfaces/http/middlewares/errorHandler.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const carpetaUploads = path.resolve(__dirname, "..", "uploads");

// Configuración del servidor

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

// Acceso público a las fotografías

app.use(
  "/uploads",
  express.static(carpetaUploads)
);

// Personal

const personalRepository = new PersonalRepositoryPostgres();

const controller = new PersonalController({
  crearPersonal: new CrearPersonal(personalRepository),
  obtenerPersonal: new ObtenerPersonal(personalRepository),
  obtenerPersonalPorId: new ObtenerPersonalPorId(personalRepository),
  actualizarPersonal: new ActualizarPersonal(personalRepository),
  guardarFotoPersonal: new GuardarFotoPersonal(personalRepository),
});

// Roles

const rolRepository = new RolRepositoryPostgres();

const obtenerRoles = new ObtenerRoles(rolRepository);

const rolController = new RolController(obtenerRoles);

// Campañas

const campaniaRepository = new CampaniaRepositoryPostgres();

const campaniaController = new CampaniaController({
  crearCampania: new CrearCampania(campaniaRepository),
  obtenerCampanias: new ObtenerCampanias(campaniaRepository),
  obtenerCampaniaPorId: new ObtenerCampaniaPorId(campaniaRepository),
  actualizarCampania: new ActualizarCampania(campaniaRepository),
  obtenerResponsables: new ObtenerResponsablesCampania(campaniaRepository),
});

// Vehículos

const vehiculoRepository = new VehiculoRepositoryPostgres();

const crearVehiculo = new CrearVehiculo(vehiculoRepository);
const obtenerVehiculos = new ObtenerVehiculos(vehiculoRepository);
const obtenerVehiculoPorId = new ObtenerVehiculoPorId(vehiculoRepository);
const actualizarVehiculo = new ActualizarVehiculo(vehiculoRepository);
const guardarFotoVehiculo = new GuardarFotoVehiculo(vehiculoRepository);

const vehiculoController = new VehiculoController({
  crearVehiculo,
  obtenerVehiculos,
  obtenerVehiculoPorId,
  actualizarVehiculo,
  guardarFotoVehiculo,
});

// Brigadas

const brigadaRepository = new BrigadaRepositoryPostgres();

const brigadaController = new BrigadaController({
  crearBrigada: new CrearBrigada(brigadaRepository),
  obtenerBrigadas: new ObtenerBrigadas(brigadaRepository),
  obtenerBrigadaPorId: new ObtenerBrigadaPorId(brigadaRepository),
  actualizarBrigada: new ActualizarBrigada(brigadaRepository),
  asignarIntegrantes: new AsignarIntegrantes(brigadaRepository),
  asignarLocalidades: new AsignarLocalidades(brigadaRepository),
});

// Visitas

const visitaRepository = new VisitaRepositoryPostgres();

const visitaController = new VisitaController({
  obtenerVisitas: new ObtenerVisitas(visitaRepository),
  obtenerVisitaPorId: new ObtenerVisitaPorId(visitaRepository),
  crearVisita: new CrearVisita(visitaRepository),
  actualizarVisita: new ActualizarVisita(visitaRepository),
  agregarJornadas: new AgregarJornadasVisita(visitaRepository),
  actualizarJornada: new ActualizarJornadaVisita(visitaRepository),
  eliminarJornada: new EliminarJornadaVisita(visitaRepository),
  cancelarVisita: new CancelarVisita(visitaRepository),
  obtenerCatalogos: new ObtenerCatalogosVisita(visitaRepository),
  crearPuntoVacunacion: new CrearPuntoVacunacion(visitaRepository),
});

const actualizarEstadosVisitas = new ActualizarEstadosVisitas(
  visitaRepository
);

// Rutas y recorridos

const osrmService = new OSRMService();

const recorridoRepository = new RecorridoRepositoryPostgres({
  osrmService,
});

const recorridoController = new RecorridoController({
  obtenerRecorridos: new ObtenerRecorridos(
    recorridoRepository
  ),

  obtenerRecorridosPorVisita: new ObtenerRecorridosPorVisita(
    recorridoRepository
  ),

  calcularRecorridosVisita: new CalcularRecorridosVisita(
    recorridoRepository
  ),
});

// Autenticación y Usuarios

const usuarioRepository = new UsuarioRepositoryPostgres();

const authController = new AuthController({
  iniciarSesion: new IniciarSesion(usuarioRepository),
  obtenerPerfil: new ObtenerPerfil(usuarioRepository),
  cambiarPassword: new CambiarPassword(usuarioRepository),
});

// Comprobar conexión

app.get("/api/health", async (req, res, next) => {
  try {
    const conexion = await verificarConexion();

    res.json({
      mensaje: "Servidor funcionando correctamente.",
      base_datos: "Conectada",
      fecha: conexion.fecha,
    });
  } catch (error) {
    next(error);
  }
});

// Rutas de la API

app.use("/api/auth", crearAuthRoutes(authController, autenticarUsuario));

app.use("/api", autenticarUsuario);

// Telegram

const telegramService = new TelegramService(pool);

app.use(
  "/api/telegram",
  crearTelegramRoutes(telegramService)
);

// Rutas por módulo 

app.use("/api/personal", crearPersonalRoutes(controller, verificarPermiso));
app.use("/api/localidades", localidadRoutes);
app.use("/api/roles", crearRolRoutes(rolController));
app.use("/api/campanias", crearCampaniaRoutes(campaniaController));
app.use("/api/vehiculos", crearVehiculoRoutes(vehiculoController));
app.use("/api/brigadas", crearBrigadaRoutes(brigadaController));
app.use("/api/visitas", crearVisitaRoutes(visitaController));
app.use("/api/rutas", crearRecorridoRoutes(recorridoController));
app.use("/api/inventario", crearRutasInventario(pool));
app.use("/api", crearRutasTablero(pool));

// Ruta no encontrada

app.use((req, res) => {
  res.status(404).json({
    mensaje: "Ruta no encontrada.",
  });
});

// Manejo de errores

app.use(errorHandler);

// Actualización automática de visitas

let sincronizacionEnCurso = false;

const ejecutarSincronizacionVisitas = async () => {
  if (sincronizacionEnCurso) {
    return;
  }

  sincronizacionEnCurso = true;

  try {
    await actualizarEstadosVisitas.ejecutar();

  } catch (error) {
    console.error(
      "[VISITAS] Error al actualizar estados:",
      error.message
    );

  } finally {
    sincronizacionEnCurso = false;
  }
};

// Puerto

const PORT = process.env.PORT || 3000;

// Inicializar TelegramBot

const telegramBot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot({
      token: process.env.TELEGRAM_BOT_TOKEN,

      telegramService,

      ollamaService: new OllamaService({
        url: process.env.OLLAMA_URL,
        model: process.env.OLLAMA_MODEL || "llama3.2:3b",
        timeoutMs: 0
      }),

      reportes: new ObtenerReportes(
        new TableroRepositoryPostgres(pool)
      )
    })
  : null;

// Iniciar servidor

const iniciarServidor = async () => {
  try {
    await verificarConexion();

    // Primera sincronización al iniciar el backend.
    await ejecutarSincronizacionVisitas();

    // Repetir sincronización cada minuto.
    const intervaloVisitas = setInterval(
      ejecutarSincronizacionVisitas,
      60_000
    );

    // Evitar que el temporizador impida cerrar el proceso.
    intervaloVisitas.unref?.();

    const servidor = app.listen(PORT, () => {
      console.log("-----------------------------------");
      console.log("MG-Vacuna | Backend iniciado");
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log(`API Personal: http://localhost:${PORT}/api/personal`);
      console.log(`Telegram: ${telegramBot ? "configurado" : "sin configurar (opcional)"}`);
      console.log(`API Visitas: http://localhost:${PORT}/api/visitas`);
      console.log(`Fotografías: http://localhost:${PORT}/uploads`);
      console.log("-----------------------------------");
    });

    // Iniciar bot de Telegram.
    if (telegramBot) {
      telegramBot.iniciar();
    }

  } catch (error) {
    console.error(
      "No se pudo conectar a PostgreSQL:",
      error.message
    );

    await pool.end();

    process.exit(1);
  }
};

iniciarServidor();

// Cierre

const cerrarServidor = async () => {
  telegramBot?.detener();

  await pool.end();

  process.exit(0);
};

process.on("SIGINT", cerrarServidor);
process.on("SIGTERM", cerrarServidor);