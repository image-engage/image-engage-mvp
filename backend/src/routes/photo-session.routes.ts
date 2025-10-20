import { Router } from 'express';
import multer from 'multer';
import { PhotoSessionController } from '../controllers/photo-session.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes for photo sessions require authentication
router.use(authenticateToken);

router.post(
  '/upload-photos',
  upload.fields([
    { name: 'mediaFiles', maxCount: 20 },
    { name: 'categories', maxCount: 20 },
  ]),
  PhotoSessionController.uploadPhotos
);

router.get('/', PhotoSessionController.getPhotoSessions);
router.get('/waiting-patients', PhotoSessionController.getWaitingPatients);
router.post('/create-workflow', PhotoSessionController.createWorkflowSession);

export default router;