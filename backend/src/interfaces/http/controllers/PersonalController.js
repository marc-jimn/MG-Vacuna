import { unlink } from "node:fs/promises";

export class PersonalController {
  constructor({
    crearPersonal,
    obtenerPersonal,
    obtenerPersonalPorId,
    actualizarPersonal,
    guardarFotoPersonal,
  }) {
    this.crearPersonal = crearPersonal;
    this.obtenerPersonal = obtenerPersonal;
    this.obtenerPersonalPorId = obtenerPersonalPorId;
    this.actualizarPersonal = actualizarPersonal;
    this.guardarFotoPersonal = guardarFotoPersonal;
  }

  crear = async (req, res, next) => {
    try {
      const resultado = await this.crearPersonal.ejecutar(req.body);

      res.status(201).json({
        mensaje: "Personal registrado correctamente.",
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  obtenerTodos = async (req, res, next) => {
    try {
      const resultado = await this.obtenerPersonal.ejecutar();

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

      const resultado = await this.obtenerPersonalPorId.ejecutar(id);

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró el personal solicitado.",
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

      const resultado = await this.actualizarPersonal.ejecutar(
        id,
        req.body
      );

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró el personal solicitado.",
        });
      }

      res.status(200).json({
        mensaje: "Personal actualizado correctamente.",
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  subirFoto = async (req, res, next) => {
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

      const rutaFoto = `/uploads/personal/${req.file.filename}`;

      const resultado = await this.guardarFotoPersonal.ejecutar(
        id,
        rutaFoto
      );

      if (!resultado) {
        await unlink(req.file.path).catch(() => {});

        return res.status(404).json({
          mensaje: "No se encontró el personal solicitado.",
        });
      }

      res.status(200).json({
        mensaje: "Fotografía guardada correctamente.",
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