// Image upload middleware: use imageUpload.single('image'). jpg/png/webp, max 2 MB, random filename.
// The file is served at /uploads/<req.file.filename>.
import crypto from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from './http.js';

const TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

fs.mkdirSync(env.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: env.uploadsDir,
  filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + TYPES[file.mimetype]),
});

const multerInstance = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (TYPES[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, 'VALIDATION', 'Please upload a JPG, PNG or WebP image.', { image: 'Must be a JPG, PNG or WebP image' }));
  },
});

// Wraps multer so its errors become 400 VALIDATION with fields.image.
function wrap(mw) {
  return (req, res, next) =>
    mw(req, res, (err) => {
      if (!err) return next();
      if (err instanceof HttpError) return next(err);
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2 MB or smaller' : 'Could not read the uploaded image';
      next(new HttpError(400, 'VALIDATION', message, { image: message }));
    });
}

export const imageUpload = {
  single: (field = 'image') => wrap(multerInstance.single(field)),
};

// Public URL for a stored upload.
export const uploadUrl = (filename) => `/uploads/${filename}`;
