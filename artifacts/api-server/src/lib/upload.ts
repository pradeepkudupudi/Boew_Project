import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const DATASET_DIR = path.resolve(process.cwd(), "dataset");
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// Ensure dirs exist
[DATASET_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function imageFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = /jpeg|jpg|png|gif|bmp|webp/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
}

export const datasetUpload = multer({
  storage: multer.diskStorage({
    destination: DATASET_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const queryUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export { DATASET_DIR, UPLOADS_DIR };
