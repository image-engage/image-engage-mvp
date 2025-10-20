import { Router } from 'express';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: any, res) => {
  try {
    res.json({
      success: true,
      message2: 'Test endpoint working',
      data: [{
        id: '123',
        patientName: 'Test Patient',
        procedure: 'Test Procedure',
        completedDate: new Date().toISOString(),
        beforePhotos: [],
        afterPhotos: [],
        videos: [],
        consentPdfs: [],
        totalFiles: 0
      }]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message2: 'Test endpoint failed'
    });
  }
});

export default router;