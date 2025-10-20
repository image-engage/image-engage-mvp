import { Router } from 'express';
import { CompletedSessionsController } from '../controllers/completed-sessions.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', CompletedSessionsController.getCompletedSessions);
router.get('/download/:fileId', CompletedSessionsController.downloadFile);

export default router;