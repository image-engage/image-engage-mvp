import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(authenticateToken);

// Endpoint to start a new patient session
router.post('/start-session', WorkflowController.startPatientSession);

// Endpoint to complete a consent form
router.post('/complete-consent-form', WorkflowController.completeConsentForm);

// Endpoint to get patients waiting for photos
router.get('/waiting-patients', WorkflowController.getWaitingPatients);

// Endpoint to start a new photo session for a patient
router.post('/start-photo-session', WorkflowController.startPhotoSession);

// Endpoint to upload a photo to a session
router.post('/sessions/:sessionId/upload-photo', WorkflowController.uploadPhoto);

export default router;