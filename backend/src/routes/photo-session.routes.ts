import { Router } from 'express';
import multer from 'multer';
import { PhotoSessionController } from '../controllers/photo-session.controller';
import { ImageController } from '../controllers/image.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes for photo sessions require authentication
router.use(authenticateToken);

// Route to check image quality
router.post('/check-quality', upload.single('image'), ImageController.checkQuality);

router.post(
  '/upload-photos',
  upload.fields([
    { name: 'mediaFiles', maxCount: 20 },
    { name: 'categories', maxCount: 20 },
  ]),
  PhotoSessionController.uploadPhotos
);

// Specific routes must come before dynamic routes.
router.get('/', PhotoSessionController.getPhotoSessions);
router.get('/waiting-patients', PhotoSessionController.getWaitingPatients);
router.post('/create-workflow', PhotoSessionController.createWorkflowSession);

// Dynamic route for a specific session ID. This must be last among GET routes.
router.get(
  '/:sessionId',
  (req, res, next) => {
    console.log('🔍 GET /:sessionId route hit');
    console.log('Session ID from params:', req.params.sessionId);
    next();
  },
  PhotoSessionController.getPhotoSessionById
);

export default router;