import { Router } from 'express';
import { ConsentController } from '../controllers/consent.controller';
import { authenticateToken } from '../middleware/auth';
import { validateConsentForm } from '../middleware/validation';

const router = Router();

// Protected routes
router.use(authenticateToken);

// Consent form routes
router.post('/', validateConsentForm, ConsentController.createConsent);
router.get('/', ConsentController.getConsents);
router.get('/:id/download', ConsentController.downloadConsent);
router.get('/:id', ConsentController.getConsentById);
router.put('/:id', ConsentController.updateConsent);
router.delete('/:id', ConsentController.deleteConsent);
// Endpoint to add shared content to a consent form
router.post('/:id/share', authenticateToken, ConsentController.addSharedContent);

// Endpoint to send a review request (email/sms) for a consent form
router.post('/:id/send-review-request', authenticateToken, ConsentController.sendReviewRequest);


// Shared content routes
router.post('/:id/share-content', ConsentController.addSharedContent);

// Review request routes
router.post('/:id/send-review', ConsentController.sendReviewRequest);

export default router;