import { Response } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Handles all API requests for the patient workflow.
 */
export class WorkflowController {
  /**
   * Starts a new patient session, creating a patient and a pending consent form.
   * @param {AuthenticatedRequest} req - The Express request object with user data.
   * @param {Response} res - The Express response object.
   */
  static async startPatientSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { firstName, lastName, email, phone } = req.body;
      const practiceId = req.user?.practiceId;

      if (!practiceId || !firstName || !lastName || !email || !phone) {
        return res.status(400).json({ error: 'Missing required patient or practice details.' });
      }

      const result = await WorkflowService.startSession(practiceId, { firstName, lastName, email, phone });

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(201).json(result);
    } catch (err) {
      console.error('Error in startPatientSession controller:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  /**
   * Updates a consent form with completion details (signature, shared content, etc.).
   * @param {AuthenticatedRequest} req - The Express request object with user data.
   * @param {Response} res - The Express response object.
   */
  static async completeConsentForm(req: AuthenticatedRequest, res: Response) {
    try {
      const { consentFormId, patientId, procedureType, notes, signatureData, sharedContent } = req.body;
      const practiceId = req.user?.practiceId;

      if (!practiceId || !consentFormId || !patientId || !procedureType || !signatureData) {
        return res.status(400).json({ error: 'Missing required details.' });
      }

      const result = await WorkflowService.completeConsentForm(practiceId, patientId, consentFormId, {
        procedureType,
        notes,
        signatureData,
        sharedContent
      });

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error in completeConsentForm controller:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  /**
   * Retrieves a list of patients with an active consent form but no completed photo session.
   * @param {AuthenticatedRequest} req - The Express request object with user data.
   * @param {Response} res - The Express response object.
   */
  static async getWaitingPatients(req: AuthenticatedRequest, res: Response) {
    try {
      const practiceId = req.user?.practiceId;
      if (!practiceId) {
        return res.status(400).json({ error: 'Practice ID is required.' });
      }

      const result = await WorkflowService.getWaitingPatients(practiceId);

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error in getWaitingPatients controller:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  /**
   * Creates a new photo session record for a given patient.
   * @param {AuthenticatedRequest} req - The Express request object with user data.
   * @param {Response} res - The Express response object.
   */
  static async startPhotoSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, photoType } = req.body;
      const practiceId = req.user?.practiceId;

      if (!practiceId || !patientId) {
        return res.status(400).json({ error: 'Patient ID and practice ID are required.' });
      }

      const result = await WorkflowService.startPhotoSession(practiceId, patientId, photoType);

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(201).json(result);
    } catch (err) {
      console.error('Error in startPhotoSession controller:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  /**
   * Adds a photo URL to an existing photo session record.
   * @param {AuthenticatedRequest} req - The Express request object with user data.
   * @param {Response} res - The Express response object.
   */
  static async uploadPhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const { photoUrl } = req.body;
      const practiceId = req.user?.practiceId;

      if (!practiceId || !photoUrl) {
        return res.status(400).json({ error: 'Photo URL and practice ID are required.' });
      }

      const result = await WorkflowService.uploadPhoto(practiceId, sessionId, photoUrl);

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error in uploadPhoto controller:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
}