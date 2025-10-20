import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(authenticateToken);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.get('/practice-info', UserController.getPracticeInfo);

export default router;