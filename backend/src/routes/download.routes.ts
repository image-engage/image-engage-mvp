import { Router } from 'express';
import { DownloadController } from '../controllers/download.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/zip', DownloadController.downloadFilesAsZip);

export default router;