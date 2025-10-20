import { Router } from 'express';
import { CollageController } from '../controllers/collage.controller';
import { upload } from '../middleware/upload'; // Assuming a middleware for file uploads

const router = Router();

// Define routes and link them to controller methods
router.get('/', CollageController.getCollages);
router.post('/', upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), CollageController.createCollage);

export default router;