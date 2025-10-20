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

export class CompletedSessionsService {
  static async getCompletedSessions(
    practiceId: string,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<CompletedSession[]>> {
    try {
      // Return mock data for testing
      const mockSession: CompletedSession = {
        id: '123',
        patientName: 'John Doe',
        procedure: 'Dental Cleaning',
        completedDate: new Date().toISOString(),
        beforePhotos: [],
        afterPhotos: [],
        videos: [],
        consentPdfs: [],
        totalFiles: 0
      };

      return {
        success: true,
        message2: 'Completed sessions retrieved successfully',
        data: [mockSession]
      };
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return { success: false, message2: 'Internal server error' };
    }
  }

  static async getConsentPdfs(practiceId: string, patientId: string): Promise<MediaFile[]> {
    try {
      // Get consent PDFs from media_files table
      const { data: consentFiles } = await supabase
        .from('media_files')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('patient_id', patientId)
        .eq('file_type', 'pdf');

      return (consentFiles || []).map(file => ({
        id: file.id,
        fileName: file.original_filename,
        fileType: 'pdf' as const,
        fileSize: file.file_size || 0,
        url: file.storage_url
      }));
    } catch (error) {
      console.error('Error fetching consent PDFs:', error);
      return [];
    }
  }

  static async getFileDownloadUrl(practiceId: string, fileId: string): Promise<ApiResponse<{ url: string }>> {
    try {
      // If fileId contains a URL, return it directly
      if (fileId.startsWith('http')) {
        return {
          success: true,
          message2: 'File URL retrieved',
          data: { url: fileId }
        };
      }
      
      // Try to find the file in media_files table
      const { data: mediaFile, error } = await supabase
        .from('media_files')
        .select('storage_url')
        .eq('practice_id', practiceId)
        .eq('id', fileId)
        .single();
      
      if (error || !mediaFile) {
        return { success: false, message2: 'File not found' };
      }
      
      return {
        success: true,
        message2: 'File URL retrieved',
        data: { url: mediaFile.storage_url }
      };
    } catch (error) {
      return { success: false, message2: 'File not found' };
    }
  }

  private static async getFileSize(url: string): Promise<number> {
    try {
      // For Supabase storage URLs, we can try to get file info
      // This is a simplified approach - in production you might want to store file sizes
      return 0; // Placeholder - would need actual implementation
    } catch (error) {
      return 0;
    }
  }

  private static getFileType(fileName: string): 'image' | 'pdf' | 'video' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', '3gp'].includes(ext || '')) return 'video';
    return 'image'; // default
  }
}