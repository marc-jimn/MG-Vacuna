import { copyFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const carpetaFotos = path.resolve(
  __dirname,
  "../../../../uploads/transporte"
);

export class VehiculoController {
  constructor({
    crearVehiculo,
    obtenerVehiculos,
    obtenerVehiculoPorId,
    actualizarVehiculo,
    guardarFotoVehiculo,
  }) {
    this.crearVehiculo = crearVehiculo;
    this.obtenerVehiculos = obtenerVehiculos;
    this.obtenerVehiculoPorId = obtenerVehiculoPorId;
    this.actualizarVehiculo = actualizarVehiculo;
    this.guardarFotoVehiculo = guardarFotoVehiculo;
  }

  crear = async (req, res, next) => {
    try {
      const resultado = await this.crearVehiculo.ejecutar(req.body);

      res.status(201).json({
        mensaje: "Vehículo registrado correctamente.",
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  obtenerTodos = async (req, res, next) => {
    try {
      const resultado = await this.obtenerVehiculos.ejecutar();

      res.status(200).json({
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  obtenerPorId = async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "El ID proporcionado no es válido.",
        });
      }

      const resultado = await this.obtenerVehiculoPorId.ejecutar(id);

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró el vehículo solicitado.",
        });
      }

      res.status(200).json({
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "El ID proporcionado no es válido.",
        });
      }

      const resultado = await this.actualizarVehiculo.ejecutar(
        id,
        req.body
      );

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró el vehículo solicitado.",
        });
      }

      res.status(200).json({
        mensaje: "Vehículo actualizado correctamente.",
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  subirFoto = async (req, res, next) => {
    let rutaDestino = null;

    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        if (req.file) {
          await unlink(req.file.path).catch(() => {});
        }

        return res.status(400).json({
          mensaje: "El ID proporcionado no es válido.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          mensaje: "No se recibió ninguna fotografía.",
        });
      }

      const vehiculo = await this.obtenerVehiculoPorId.ejecutar(id);

      if (!vehiculo) {
        await unlink(req.file.path).catch(() => {});

        return res.status(404).json({
          mensaje: "No se encontró el vehículo solicitado.",
        });
      }

      const numeroEconomico = vehiculo.numero_economico;

      if (!/^[a-zA-Z0-9_-]+$/.test(numeroEconomico)) {
        await unlink(req.file.path).catch(() => {});

        return res.status(400).json({
          mensaje: "El número económico del vehículo no es válido.",
        });
      }

      const extension = path.extname(req.file.filename).toLowerCase();

      const nombreArchivo = `${numeroEconomico}${extension}`;

      rutaDestino = path.join(carpetaFotos, nombreArchivo);

      await copyFile(req.file.path, rutaDestino);

      const rutaFoto = `/uploads/transporte/${nombreArchivo}`;

      const resultado = await this.guardarFotoVehiculo.ejecutar(
        id,
        rutaFoto
      );

      await unlink(req.file.path).catch(() => {});

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró el vehículo solicitado.",
        });
      }

      res.status(200).json({
        mensaje: "Fotografía del vehículo guardada correctamente.",
        datos: resultado,
      });
    } catch (error) {
      if (req.file) {
        await unlink(req.file.path).catch(() => {});
      }

      next(error);
    }
  };
}