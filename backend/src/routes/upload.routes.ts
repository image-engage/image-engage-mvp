import { Router } from 'express';
import { upload } from '../config/multer';
import { UploadController } from '../controllers/upload.controller';


const router = Router();


// POST /upload/media
router.post('/media', upload.array('mediaFiles'), 
  UploadController.uploadPhotos
);

// GET /upload/:practiceId/:patientPhotoId
router.get('/:practiceId/:patientPhotoId', 
  UploadController.getSessionFiles
);

export default router;