import { Router } from 'express';
import { PracticeController } from '../controllers/practice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(authenticateToken);

router.get('/profile', PracticeController.getProfile);
router.put('/profile', PracticeController.updateProfile);
router.get('/folder-structure', PracticeController.getFolderStructure);

export default router;