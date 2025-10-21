import { Router } from 'express';
import { PracticeController } from '../controllers/practice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// This route is for finalizing the onboarding process.
router.patch(
  '/complete-onboarding',
  // authenticateToken is already applied by router.use() above
  PracticeController.completeOnboarding
);

// Routes for fetching and updating the practice profile.
router.get('/profile', PracticeController.getProfile);
router.patch('/profile', PracticeController.updateProfile);

// A route to get the folder structure (currently mocked).
router.get('/folder-structure', PracticeController.getFolderStructure);

export default router;