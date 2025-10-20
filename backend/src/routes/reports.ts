import express from 'express';
import { PDFReportService } from '../services/pdf-report.service';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();
const pdfService = new PDFReportService();

router.use(authenticateToken);

// POST /api/reports/generate/:patientConsentId
router.post('/generate/:patientConsentId', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { patientConsentId } = req.params;
    
    const reportPath = await pdfService.generateComparisonReport(patientConsentId);
    
    res.download(reportPath, `patient_report_${patientConsentId}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ success: false, error: 'Failed to download report' });
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;