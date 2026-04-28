// src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { configService } from '../services/management/configService';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = await configService.get('CORPORATE_LOGO_UPLOAD_DIR', 'assets/corporate-logos');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
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

const fileFilter = async (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFormats = await configService.get<string[]>('CORPORATE_LOGO_ALLOWED_FORMATS', ['jpg', 'jpeg', 'png', 'webp']);
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (allowedMimeTypes.includes(mime) && allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('INVALID_FILE_TYPE');
    (error as any).code = 'LIMIT_FILE_TYPES';
    (error as any).status = 400;
    cb(error as any);
  }
};

/**
 * Dynamic upload middleware that reads limits from configService.
 */
export const uploadLogo = (req: Request, res: Response, next: NextFunction) => {
  const getMiddleware = async () => {
    const maxSize = await configService.get('CORPORATE_LOGO_MAX_SIZE', 2097152);
    
    return multer({
      storage,
      limits: {
        fileSize: maxSize,
      },
      fileFilter: (req, file, cb) => {
        // Wrap async fileFilter for multer
        fileFilter(req as any, file, cb);
      },
    }).single('logo');
  };

  getMiddleware().then(mw => mw(req, res, next)).catch(next);
};
