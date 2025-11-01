import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Update media file
router.put('/update/:id', MediaController.updateMedia);

export default router;