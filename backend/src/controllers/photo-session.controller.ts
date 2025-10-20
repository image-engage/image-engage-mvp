// src/controllers/photo-session.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PhotoSessionService } from '../services/photo-session.service';
import { ApiResponse } from '../types';

export class PhotoSessionController {
  /**
   * Handles photo uploads and creates a new photo session.
   */
  static async uploadPhotos(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      // practiceId is expected to be set by the authentication middleware
      const practiceId = req.practiceId;

      // Extract patientId, patientPhotoId, and categories from req.body
      // Multer processes non-file fields into req.body
      const { patientId, patientPhotoId, categories } = req.body;

      // Multer's upload.fields() stores files in req.files keyed by their fieldname
      const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };
      const files = uploadedFiles ? uploadedFiles['mediaFiles'] : undefined; // Get the files from the 'mediaFiles' field

      // --- Debugging Logs ---
      console.log('--- Backend received upload request ---');
      console.log('practiceId (from auth middleware):', practiceId);
      console.log('patientId (from req.body):', patientId);
      console.log('patientPhotoId (from req.body):', patientPhotoId);
      console.log('categories (raw from req.body):', categories);
      console.log('files (from req.files[\'mediaFiles\']):', files);
      console.log('files.length:', files ? files.length : 'N/A (files is undefined)');
      console.log('-------------------------------------');


      // Validate required fields and file types
      // The 'categories' field from FormData might be a string for a single item, or an array for multiple.
      // The service expects an array, so we'll normalize it after this initial check.
      if (!practiceId || !patientId || !patientPhotoId || !files || files.length === 0 || !categories) {
        console.error('Validation failed: One or more required fields are missing or empty.');
        res.status(400).json({
          success: false,
          message2: 'Patient ID, Patient Photo ID, files, and categories are required (and practiceId)'
        });
        return;
      }

      // Ensure categories is an array for the service layer
      const categoriesArray = Array.isArray(categories) ? categories : [categories];
      console.log('categoriesArray (after normalization):', categoriesArray);


      // Call the service method with the new parameters
      const result = await PhotoSessionService.createPhotoSessionAndUpload(
        practiceId, // Pass the practiceId
        patientId,
        patientPhotoId, // Pass the patientPhotoId from the frontend
        files,
        categoriesArray // Pass the array of categories
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Upload photos error:', error);
      res.status(500).json({
        success: false,
        message2: 'Failed to upload photos'
      });
    }
  }

  /**
   * Retrieves all photo sessions for the authenticated practice.
   */
  static async getPhotoSessions(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const result = await PhotoSessionService.getPhotoSessionsByPractice(practiceId);
      res.json(result);
    } catch (error) {
      console.error('Get photo sessions error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }



  /**
   * Retrieves all patients who are ready for a photo session.
   * This means they have a completed consent form but no photo session started yet.
   */
  static async getWaitingPatients(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const result = await PhotoSessionService.getWaitingPatients(practiceId);
      res.json(result);
    } catch (error) {
      console.error('Get waiting patients error:', error);
      res.status(500).json({
        success: false,
        message2: 'Failed to fetch waiting patients'
      });
    }
  }

  /**
   * Creates a workflow session for a patient.
   */
  static async createWorkflowSession(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { practiceId, patientId } = req.body;
      const result = await PhotoSessionService.createOrUpdateWorkflowSession(practiceId, patientId);
      res.json(result);
    } catch (error) {
      console.error('Create workflow session error:', error);
      res.status(500).json({
        success: false,
        message2: 'Failed to create workflow session'
      });
    }
  }
}
