import { supabase } from '../config/database';
import { ApiResponse } from '../types';

interface CompletedSession {
  id: string;
  patientName: string;
  procedure: string;
  completedDate: string;
  beforePhotos: MediaFile[];
  afterPhotos: MediaFile[];
  videos: MediaFile[];
  consentPdfs: MediaFile[];
  totalFiles: number;
}

interface MediaFile {
  id: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'video';
  fileSize: number;
  url: string;
  thumbnail?: string;
}

export class CompletedSessionsNewService {
  static async getCompletedSessions(
    practiceId: string,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<CompletedSession[]>> {
    try {
      // Simple query to get patients
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, created_at')
        .eq('practice_id', practiceId);

      if (error) {
        console.error('Database error:', error);
        return { success: false, message2: 'Failed to fetch patients' };
      }

      const completedSessions: CompletedSession[] = [];

      for (const patient of patients || []) {
        const mockSession: CompletedSession = {
          id: patient.id,
          patientName: `${patient.first_name} ${patient.last_name}`,
          procedure: 'Test Procedure',
          completedDate: patient.created_at,
          beforePhotos: [],
          afterPhotos: [],
          videos: [],
          consentPdfs: [],
          totalFiles: 0
        };

        completedSessions.push(mockSession);
      }

      return {
        success: true,
        message2: 'Completed sessions retrieved successfully',
        data: completedSessions
      };
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return { success: false, message2: 'Internal server error' };
    }
  }

  static async getFileDownloadUrl(practiceId: string, fileId: string): Promise<ApiResponse<{ url: string }>> {
    return {
      success: true,
      message2: 'File URL retrieved',
      data: { url: fileId }
    };
  }
}