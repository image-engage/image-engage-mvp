import { Router } from 'express';
import multer from 'multer';
import { ImageController } from '../controllers/image.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/check-quality', upload.single('image'), ImageController.checkQuality);

export { router as imageRoutes };