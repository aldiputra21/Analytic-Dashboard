// src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const CORPORATE_LOGO_UPLOAD_DIR = process.env.CORPORATE_LOGO_UPLOAD_DIR || 'assets/corporate-logos';
const CORPORATE_LOGO_MAX_SIZE = parseInt(process.env.CORPORATE_LOGO_MAX_SIZE || '2097152', 10); // Default 2MB
const CORPORATE_LOGO_ALLOWED_FORMATS = (process.env.CORPORATE_LOGO_ALLOWED_FORMATS || 'jpg,jpeg,png,webp').split(',').map(f => f.trim());

// Ensure directory exists
if (!fs.existsSync(CORPORATE_LOGO_UPLOAD_DIR)) {
  fs.mkdirSync(CORPORATE_LOGO_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CORPORATE_LOGO_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    if (req.params.id) {
      cb(null, req.params.id + path.extname(file.originalname));
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (allowedMimeTypes.includes(mime) && CORPORATE_LOGO_ALLOWED_FORMATS.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('INVALID_FILE_TYPE');
    (error as any).code = 'LIMIT_FILE_TYPES';
    (error as any).status = 400;
    cb(error as any);
  }
};

export const uploadLogo = multer({
  storage,
  limits: {
    fileSize: CORPORATE_LOGO_MAX_SIZE,
  },
  fileFilter,
});
