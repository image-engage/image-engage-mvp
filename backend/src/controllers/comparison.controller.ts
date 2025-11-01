import { Response } from 'express';
import { ComparisonService } from '../services/comparison.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class ComparisonController {
  /**
   * Generate before/after comparison
   */
  static async generateComparison(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('Comparison request received:', req.body);
      console.log('User info:', req.user);
      
      const { patientId, beforeImageId, afterImageId } = req.body;
      const practiceId = req.user?.practiceId;

      if (!practiceId || !patientId || !beforeImageId || !afterImageId) {
        console.error('Missing parameters:', { practiceId, patientId, beforeImageId, afterImageId });
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const result = await ComparisonService.generateComparison(
        practiceId,
        patientId,
        beforeImageId,
        afterImageId
      );

      if (result.error) {
        console.error('Service error:', result.error);
        return res.status(500).json({ error: result.error });
      }

      console.log('Comparison generated successfully');
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in generateComparison controller:', error);
      return res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
  }
}