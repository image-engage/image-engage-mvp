// src/routes/settings.routes.ts
import { Router, Response } from 'express';
import { SettingsController } from '../controllers/settings.controller'; // Correct path
import { AuthRequest } from '../types'; // Correct path
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/settings/practice-profile
 * @description Get the full profile for the authenticated practice.
 * @access Private
 */
router.get('/practice-profile', authenticateToken, SettingsController.getPracticeProfile);

/**
 * @route GET /api/settings/review-settings
 * @description Get the review settings for the authenticated practice.
 * @access Private
 */
router.get('/review-settings', authenticateToken, SettingsController.getReviewSettings);

/**
 * @route GET /api/settings/users
 * @description Get all users for the authenticated practice.
 * @access Private
 */
router.get('/users', authenticateToken, SettingsController.getPracticeUsers);


export default router;