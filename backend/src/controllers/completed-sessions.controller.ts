import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/database';
import { ApiResponse } from '../types';

export class CompletedSessionsController {
  static async getCompletedSessions(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      
      // Direct query without any services
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, created_at')
        .eq('practice_id', practiceId)
        .limit(10);

      const sessions = (patients || []).map(patient => ({
        id: patient.id,
        patientName: `${patient.first_name} ${patient.last_name}`,
        procedure: 'Dental Procedure',
        completedDate: patient.created_at,
        beforePhotos: [],
        afterPhotos: [],
        videos: [],
        consentPdfs: [],
        totalFiles: 0
      }));

      res.json({
        success: true,
        message2: 'Completed sessions retrieved successfully',
        data: sessions
      });
    } catch (error) {
      console.error('Get completed sessions error:', error);
      res.status(500).json({
        success: false,
        message2: 'Failed to fetch completed sessions'
      });
    }
  }

  static async downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const decodedFileId = decodeURIComponent(fileId);

      res.json({
        success: true,
        message2: 'File URL retrieved',
        data: { url: decodedFileId }
      });
    } catch (error) {
      console.error('Download file error:', error);
      res.status(500).json({
        success: false,
        message2: 'Failed to download file'
      });
    }
  }
}