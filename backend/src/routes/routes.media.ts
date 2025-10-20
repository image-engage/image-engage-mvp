// import { Router } from 'express';
// import multer from 'multer';
// import { getRawMedia, getEditedMedia, uploadEditedFiles } from '../controllers/media.controller';
// import { validatePracticeId } from '../middleware/validation';

// const router = Router();

// // Configure multer for file uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 500 * 1024 * 1024, // 500MB per file
//     files: 20 // Maximum 20 files per request
//   },
//   fileFilter: (req, file, cb) => {
//     // Accept images and videos
//     const allowedTypes = /jpeg|jpg|png|heic|mp4|mov|avi|webm/;
//     const extname = allowedTypes.test(file.originalname.toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (extname && mimetype) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only image and video files are allowed'));
//     }
//   }
// });

// // Routes
// router.get('/patients/:patientId/media', validatePracticeId, getRawMedia);
// router.get('/patients/:patientId/edited-media', validatePracticeId, getEditedMedia);
// router.post('/patients/:patientId/upload', validatePracticeId, upload.array('files'), uploadEditedFiles);

// export default router;
