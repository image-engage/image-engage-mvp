import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyEmailToken, verifyPasswordResetToken } from '../middleware/email.middleware';

const router = Router();

// Public routes for registration and login.
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Email verification routes
router.post('/verify-email', verifyEmailToken, AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', verifyPasswordResetToken, AuthController.resetPassword);

// Route for handling the Google OAuth callback.
router.get('/google/callback', AuthController.handleGoogleCallback);

// You would also have a route to initiate Google Auth, e.g.:
// router.get('/google', auth, AuthController.initiateGoogleAuth);

export default router;