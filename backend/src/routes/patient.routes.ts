import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticateToken } from '../middleware/auth';
import { validatePatientConsent } from '../middleware/validation';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes
router.use(authenticateToken);

router.post('/', PatientController.createPatientProfile);
router.get('/', PatientController.getPatientProfiles);
router.get('/:patientId', PatientController.getPatientProfileById);
router.put('/:patientId/last-photo-session',PatientController.updateLastPhotoSession
);

export default router;