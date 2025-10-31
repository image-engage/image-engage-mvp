import { Router } from 'express';
import { CognitoAuthController } from '../controllers/cognito-auth.controller';

const router = Router();

// Cognito-based authentication routes
router.post('/register', CognitoAuthController.register);
router.post('/confirm-signup', CognitoAuthController.confirmSignUp);
router.post('/resend-confirmation', CognitoAuthController.resendConfirmationCode);
router.post('/login', CognitoAuthController.login);
router.post('/verify-mfa', CognitoAuthController.verifyMFA);
router.post('/forgot-password', CognitoAuthController.forgotPassword);
router.post('/reset-password', CognitoAuthController.resetPassword);

export default router;