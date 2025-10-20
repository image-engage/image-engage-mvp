import { Request, Response } from 'express';
import { StorageService } from '../services/storage.service';
import { DatabaseService } from '../services/database.service';
import { validateUploadRequest, validateFileArrays } from '../validators/upload.validator';
import { ApiResponse, UploadRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Handles all API requests for file uploads and media retrieval.
 */
export class UploadController {

  /**
   * Handles photo and video uploads for a patient session.
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   */
  static async uploadPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract and validate request data
      const uploadData = UploadController.extractUploadData(req);
      const validationErrors = UploadController.validateRequest(uploadData);

      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          message2: validationErrors.map(e => `${e.field}: ${e.message}`).join(', '),
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      const { practiceId, patientId, patientPhotoId, files, categories, mediaTypes } = uploadData;

      // Initialize services
      const storageService = new StorageService();
      const databaseService = new DatabaseService();

      console.log(`Starting upload for practice ${practiceId}, patient ${patientId}, session ${patientPhotoId}`);

      const storageResults = await storageService.uploadFiles(
        practiceId,
        patientPhotoId,
        files,
        categories
      );

      const mediaFiles = await databaseService.insertMediaFiles(
        practiceId,
        patientId,
        patientPhotoId,
        files,
        categories,
        mediaTypes,
        storageResults.map((r: { path: any; }) => r.path),
        storageResults.map((r: { url: any; }) => r.url)
      );

      console.log(`Successfully uploaded ${files.length} files for session ${patientPhotoId}`);

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        message2: `Uploaded ${files.length} files to patient session ${patientPhotoId}`,
        data: {
          uploadedFiles: mediaFiles.length,
          sessionId: patientPhotoId,
          practiceId,
          files: mediaFiles
        }
      } as ApiResponse);

    } catch (error) {
      console.error('Upload failed:', error);
      
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        message2: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: 'UPLOAD_ERROR'
      } as ApiResponse);
    }
  }

  /**
   * Gets media files for a patient session.
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   */
  static async getSessionFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { practiceId, patientPhotoId } = req.params;
      const databaseService = new DatabaseService();

      if (!practiceId || !patientPhotoId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          error: 'MISSING_PARAMETERS'
        } as ApiResponse);
        return;
      }

      const mediaFiles = await databaseService.getMediaFilesBySession(
        practiceId,
        patientPhotoId
      );

      res.status(200).json({
        success: true,
        message: 'Files retrieved successfully',
        data: {
          files: mediaFiles,
          count: mediaFiles.length,
          practiceId,
          patientPhotoId
        }
      } as ApiResponse);

    } catch (error) {
      console.error('Failed to retrieve session files:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve files',
        error: 'RETRIEVAL_ERROR'
      } as ApiResponse);
    }
  }

  /**
   * Extracts and normalizes upload data from a request.
   * @param {Request} req - The Express request object.
   * @returns {UploadRequest} The extracted upload data.
   */
  private static extractUploadData(req: AuthenticatedRequest): UploadRequest {
    const files = req.files as Express.Multer.File[];
    
    const categories = Array.isArray(req.body.categories) 
      ? req.body.categories 
      : (req.body.categories ? [req.body.categories] : []);
    
    const mediaTypes = Array.isArray(req.body.mediaTypes) 
      ? req.body.mediaTypes 
      : (req.body.mediaTypes ? [req.body.mediaTypes] : []);

    return {
      practiceId: req.body.practiceId,
      patientId: req.body.patientId,
      patientPhotoId: req.body.patientPhotoId,
      files,
      categories,
      mediaTypes
    };
  }

  /**
   * Validates the upload request data.
   * @param {UploadRequest} uploadData - The data to validate.
   * @returns {any[]} An array of validation errors.
   */
  private static validateRequest(uploadData: UploadRequest) {
    const { practiceId, patientId, patientPhotoId, files, categories, mediaTypes } = uploadData;
    
    const fieldErrors = validateUploadRequest({
      practiceId,
      patientId,
      patientPhotoId,
      categories,
      mediaTypes
    });

    const fileErrors = validateFileArrays(files, categories, mediaTypes);

    return [...fieldErrors, ...fileErrors];
  }
}