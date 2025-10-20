import { supabase, STORAGE_BUCKET } from '../config/database';
import { StorageUploadResult } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  /**
   * Constructs the storage path for a file based on the dental practice hierarchy
   */
  private buildStoragePath(
    practiceId: string,
    patientPhotoId: string,
    category: string,
    filename: string
  ): string {
    // Normalize category to match folder structure
    const categoryFolder = category.toLowerCase() === 'other' ? 'Other' : 
                          category.charAt(0).toUpperCase() + category.slice(1);
    
    return `${practiceId}/_RawPhotos/${patientPhotoId}/${categoryFolder}/${filename}`;
  }

  /**
   * Uploads a single file to Supabase Storage
   */
  async uploadFile(
    practiceId: string,
    patientPhotoId: string,
    category: string,
    file: Express.Multer.File
  ): Promise<StorageUploadResult> {
    try {
      // Use original filename or generate unique name if needed
      const filename = file.originalname || `${uuidv4()}.${this.getFileExtension(file.mimetype)}`;
      const storagePath = this.buildStoragePath(practiceId, patientPhotoId, category, filename);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

      return {
        path: storagePath,
        url: urlData.publicUrl,
        size: file.size,
      };
    } catch (error) {
      throw new Error(`Failed to upload file ${file.originalname}: ${error}`);
    }
  }

  /**
   * Uploads multiple files in batch
   */
  async uploadFiles(
    practiceId: string,
    patientPhotoId: string,
    files: Express.Multer.File[],
    categories: string[]
  ): Promise<StorageUploadResult[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadFile(practiceId, patientPhotoId, categories[index], file)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Deletes a file from storage (for cleanup on error)
   */
  async deleteFile(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error(`Failed to delete file ${storagePath}:`, error);
    }
  }

  /**
   * Helper to get file extension from mimetype
   */
  private getFileExtension(mimetype: string): string {
    const extensionMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/avi': 'avi',
      'application/pdf': 'pdf'
    };
    
    return extensionMap[mimetype] || 'bin';
  }
}