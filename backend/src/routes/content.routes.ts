import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(authenticateToken);

// Content library routes
router.get('/', ContentController.getContentLibrary);
router.post('/', ContentController.createContent);
router.put('/:id', ContentController.updateContent);
router.delete('/:id', ContentController.deleteContent);

export default router;