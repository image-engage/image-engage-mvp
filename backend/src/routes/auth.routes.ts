import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// Public routes for registration and login.
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Route for handling the Google OAuth callback.
router.get('/google/callback', AuthController.handleGoogleCallback);

// You would also have a route to initiate Google Auth, e.g.:
// router.get('/google', auth, AuthController.initiateGoogleAuth);

export default router;