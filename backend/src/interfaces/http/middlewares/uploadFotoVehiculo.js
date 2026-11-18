import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const carpetaFotos = path.resolve(
  __dirname,
  "../../../../uploads/transporte"
);

fs.mkdirSync(carpetaFotos, { recursive: true });

const extensionesPermitidas = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const almacenamiento = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, carpetaFotos);
  },

  filename: (req, file, callback) => {
    const extension = extensionesPermitidas[file.mimetype];

    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

export const uploadFotoVehiculo = multer({
  storage: almacenamiento,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    if (!extensionesPermitidas[file.mimetype]) {
      return callback(
        new Error("La fotografía debe ser JPG, PNG o WEBP.")
      );
    }

    callback(null, true);
  },
});