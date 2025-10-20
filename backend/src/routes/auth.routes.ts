import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validatePracticeRegistration, validateUserRegistration } from '../middleware/validation';

const router = Router();

// Practice registration and login
router.post('/register', validateUserRegistration, AuthController.register);
router.post('/login', AuthController.login);

// Google OAuth routes
//router.get('/google', AuthController.initiateGoogleAuth);
//router.get('/google/callback', AuthController.handleGoogleCallback);

export default router;