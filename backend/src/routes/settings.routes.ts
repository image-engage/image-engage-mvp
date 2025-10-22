import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// All routes in this file would be prefixed with something like /api/practice

// GET /api/settings
router.get('/', SettingsController.getSettings);

// PUT /api/settings
router.put('/', SettingsController.updateSettings);

export default router;