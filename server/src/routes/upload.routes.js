import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";

// Image uploads for the page editor. Files are stored on disk under
// server/uploads/ and served back at /api/uploads/<file>. The editor crops the
// image in the browser before uploading, so the server just persists the final
// bytes — no server-side image processing.

const router = Router();

// Resolve server/uploads relative to this file (src/routes -> ../../uploads).
const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(here, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || "bin";
    // Random name so filenames can't collide or be guessed/traversed.
    cb(null, `${crypto.randomBytes(16).toString("hex")}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    cb(new Error("Only JPEG, PNG, WebP or GIF images are allowed"));
  },
});

// POST /api/uploads  (multipart form field: "image") -> { url }
router.post("/", requireAuth, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Image must be 4 MB or smaller" : err.message;
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    res.status(201).json({ url: `/api/uploads/${req.file.filename}` });
  });
});

export default router;
