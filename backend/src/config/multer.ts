import multer from 'multer';
import path from 'path';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [...ALLOWED_PHOTO_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Supported types: ${allowedTypes.join(', ')}`));
  }
};

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 20 // Maximum 20 files per request
  }
});

export const isPhotoType = (mimetype: string): boolean => {
  return ALLOWED_PHOTO_TYPES.includes(mimetype);
};

export const isVideoType = (mimetype: string): boolean => {
  return ALLOWED_VIDEO_TYPES.includes(mimetype);
};