import multer from "multer";

// Photos are stored in the database (see the Photo model), not on disk —
// Render's filesystem is ephemeral. Multer keeps the upload in memory so the
// controller can persist file.buffer + file.mimetype straight into Postgres.
const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes"));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
