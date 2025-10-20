import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const beforeDir = path.join(uploadDir, 'before');
const afterDir = path.join(uploadDir, 'after');
const consentsDir = path.join(uploadDir, 'consents');

[uploadDir, beforeDir, afterDir, consentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.mediaCategory || 'before';
    const destPath = path.join(uploadDir, category);
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });
  
  const allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES ? process.env.ALLOWED_IMAGE_TYPES.split(',') : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = process.env.ALLOWED_VIDEO_TYPES ? process.env.ALLOWED_VIDEO_TYPES.split(',') : ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
  const allowedPdfTypes = ['application/pdf'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedPdfTypes];

  console.log('Allowed types:', allowedTypes);
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error(`File rejected - mimetype: ${file.mimetype}, allowed: ${allowedTypes.join(', ')}`);
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000') // 50MB default
  }
});