import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import { Response } from 'express';

const router = Router();

// Test endpoint to verify auth middleware works with Cognito tokens
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    message2: 'Authentication successful',
    data: {
      user: req.user,
      practiceId: req.practiceId,
      practiceEmail: req.practiceEmail
    }
  });
});

export default router;