import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/kpi', DashboardController.getKpiData);

export default router;