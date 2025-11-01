import { Router } from 'express';
import { ComparisonController } from '../controllers/comparison.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Generate before/after comparison
router.post('/generate', ComparisonController.generateComparison);

export default router;