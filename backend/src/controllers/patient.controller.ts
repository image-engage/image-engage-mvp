// src/controllers/patient.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PatientService } from '../services/patient.service';
import { ApiResponse, PatientConsent } from '../types';

export class PatientController {
  /**
   * Creates a new patient profile record in the database.
   * This corresponds to the patient_consents table, which acts as a patient's core profile.
   */
  static async createPatientProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const result = await PatientService.createPatientProfile(practiceId, req.body);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create patient profile error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

   /**
   * Retrieves all patient profiles for the authenticated practice.
   * This is a list of all patients and their consent statuses.
   */
  // --- FIX: Updated the 'res' parameter type to correctly reflect the possible return types ---
   static async getPatientProfiles(req: AuthenticatedRequest, res: Response<ApiResponse | PatientConsent[]>): Promise<void> {
    try {
      console.log('req.practiceIdXX:', req.practiceId)
      const practiceId = req.practiceId!;
      const result = await PatientService.getPatientProfilesByPractice(practiceId);

      // Check for success: if successful, return the data array with a 200 status.
      if (result.success && result.data) {
        // NOTE: We return only the data array here because the Express Response type allows PatientConsent[]
        res.status(200).json(result.data); 
      } else {
        // If not successful (e.g., DB error), return the full ApiResponse with a 404 status.
        // The service's message2 will be included in the response.
        res.status(404).json(result); 
      }

    } catch (error) {
      console.error('Get patient profiles error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      } as ApiResponse); // Cast to ApiResponse for type safety on error
    }
  }

  /**
   * Retrieves a single patient profile record by patient ID.
   */
  static async getPatientProfileById(req: AuthenticatedRequest, res: Response<ApiResponse | PatientConsent>): Promise<void> {
    try {
      console.log('req.params.patientId:', req.params.patientId);
      console.log('req.practiceId:', req.practiceId)
      const practiceId = req.practiceId!;
      const patientId = req.params.patientId as string;

      if (!patientId) {
        res.status(400).json({
          success: false,
          message2: 'Patient ID is required'
        });
        return;
      }

      const result = await PatientService.getPatientProfileById(practiceId, patientId);

      if (result.success && result.data) {
        res.status(200).json(result.data); // Return the single PatientConsent object
      } else {
        // If not successful (e.g., not found), return the full ApiResponse with a 404 status.
        res.status(404).json(result); 
      }

    } catch (error) {
      console.error('Get single patient profile error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Updates the 'last_photo_session' column for a specific patient.
   */
  static async updateLastPhotoSession(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const patientId = req.params.patientId as string;
      // Expect the new session timestamp (as a string or Date-like format) in the request body
      const { sessionId } = req.body; 

      if (!patientId || !sessionId) {
        res.status(400).json({
          success: false,
          message2: 'Patient ID and sessionTimestamp are required.'
        });
        return;
      }

      const result = await PatientService.updateLastPhotoSession(
        practiceId,
        patientId,
        sessionId
      );

      if (result.success) {
        // Successful update returns a 200 OK status.
        res.status(200).json(result); 
      } else if (result.message2 === 'Patient profile not found') {
        // If the service indicates the patient wasn't found.
        res.status(404).json(result);
      } else {
        // Other service-level errors (e.g., DB failure).
        res.status(400).json(result); 
      }
    } catch (error) {
      console.error('Update last_photo_session error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      } as ApiResponse);
    }
  }

}
