import { supabase } from '../config/database';
import { MediaFile } from '../types';
import { isPhotoType, isVideoType } from '../config/multer';

export class DatabaseService {
  /**
   * Inserts a single media file record into the database
   */
  async insertMediaFile(
    practiceId: string,
    patientId: string,
    patientPhotoId: string,
    file: Express.Multer.File,
    category: string,
    mediaType: string,
    storagePath: string,
    storageUrl: string
  ): Promise<MediaFile> {
    try {
      const mediaFileData: Omit<MediaFile, 'id' | 'created_at' | 'updated_at'> = {
        practice_id: practiceId,
        patient_id: patientId,
        patient_photo_id: patientPhotoId,
        category: category as 'before' | 'after' | 'other',
        media_type: isPhotoType(file.mimetype) ? 'photo' : 'video',
        file_type: mediaType,
        original_filename: file.originalname,
        storage_path: storagePath,
        storage_url: storageUrl,
        file_size: file.size,
        upload_timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('media_files')
        .insert(mediaFileData)
        .select()
        .single();

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to save media file record: ${error}`);
    }
  }

  /**
   * Inserts multiple media file records in a transaction
   */
  async insertMediaFiles(
    practiceId: string,
    patientId: string,
    patientPhotoId: string,
    files: Express.Multer.File[],
    categories: string[],
    mediaTypes: string[],
    storagePaths: string[],
    storageUrls: string[]
  ): Promise<MediaFile[]> {
    try {
      const mediaFileData = files.map((file, index) => ({
        practice_id: practiceId,
        patient_id: patientId,
        patient_photo_id: patientPhotoId,
        category: categories[index] as 'before' | 'after' | 'other',
        media_type: isPhotoType(file.mimetype) ? 'photo' : 'video',
        file_type: mediaTypes[index],
        original_filename: file.originalname,
        storage_path: storagePaths[index],
        storage_url: storageUrls[index],
        file_size: file.size,
        upload_timestamp: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('media_files')
        .insert(mediaFileData)
        .select();

      if (error) {
        throw new Error(`Database batch insert failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to save media file records: ${error}`);
    }
  }

  /**
   * Retrieves media files by patient photo session
   */
  async getMediaFilesBySession(
    practiceId: string,
    patientPhotoId: string
  ): Promise<MediaFile[]> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('patient_photo_id', patientPhotoId)
        .order('upload_timestamp', { ascending: false });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to retrieve media files: ${error}`);
    }
  }

  /**
   * Deletes a media file record (for cleanup on error)
   */
  async deleteMediaFile(id: string): Promise<void> {
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete media file record ${id}:`, error);
    }
  }
}