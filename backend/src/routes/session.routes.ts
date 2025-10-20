import { Router } from 'express';
import { generateQRToken, validateToken, markTokenUsed } from '../controllers/session.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Generate QR token (requires authentication)
router.post('/generate-qr-token', authenticateToken, generateQRToken);

// Validate token (public endpoint)
router.get('/validate/:token', validateToken);

// Mark token as used (public endpoint)
router.post('/mark-used/:token', markTokenUsed);

export default router;