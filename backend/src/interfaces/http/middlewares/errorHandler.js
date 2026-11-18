export const errorHandler = (error, req, res, next) => {
  console.error(error);

  // Datos duplicados
  if (error.code === "23505") {
    let mensaje = "Ya existe un registro con esos datos.";

    if (error.constraint === "campanias_codigo_key") {
      mensaje = "El código de campaña ya está registrado.";
    }

    if (error.constraint === "personal_numero_empleado_key") {
      mensaje = "El número de empleado ya está registrado.";
    }

    if (error.constraint === "personal_curp_key") {
      mensaje = "La CURP ya está registrada.";
    }

    // Vehículos duplicados
    if (error.constraint === "vehiculos_numero_economico_key") {
      mensaje = "El número económico del vehículo ya está registrado.";
    }

    if (error.constraint === "vehiculos_placas_key") {
      mensaje = "Las placas del vehículo ya están registradas.";
    }

    return res.status(409).json({ mensaje });
  }

  // Restricciones de datos
  if (
    error.code === "23514" ||
    error.code === "23502" ||
    error.code === "23503"
  ) {
    return res.status(400).json({
      mensaje: "Los datos enviados no cumplen las restricciones de la base de datos.",
    });
  }

  // Error de formato de datos
  if (error.code === "22P02") {
    return res.status(400).json({
      mensaje: "El formato de alguno de los datos enviados no es válido.",
    });
  }

  // Errores de carga de fotografías
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      mensaje: "La fotografía no puede superar los 5 MB.",
    });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      mensaje: "Solo se permite subir una fotografía.",
    });
  }

  if (
    error.message === "La fotografía debe ser JPG, PNG o WEBP."
  ) {
    return res.status(400).json({
      mensaje: error.message,
    });
  }

  // Errores internos
  return res.status(500).json({
    mensaje: "Ocurrió un error interno en el servidor.",
  });
};