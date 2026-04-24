// src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/upload/corporate-logos';
const MAX_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '2097152', 10); // Default 2MB

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
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
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedMimeTypes.includes(mime) && allowedExtensions.includes(ext)) {
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
    fileSize: MAX_SIZE,
  },
  fileFilter,
});
