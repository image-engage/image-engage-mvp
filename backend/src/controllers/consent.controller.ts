import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../middleware/auth';
import { ConsentService } from '../services/consent.service';

/**
 * Handles all API requests for the patient workflow.
 */
export class ConsentController {
  static async createConsent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      // Correctly destructure the fields to match the front-end formData
      const {
        firstName, // Now sent directly from the front-end
        lastName,  // Now sent directly from the front-end
        email,
        phone,     // Mapped from 'phone' on the front-end
        procedure,
        consentDate,
        signatureData,
        dateOfBirth,
        consentAcknowledged,
        risksUnderstood,
        questionsAnswered,
        financialConsent
      } = req.body;

      console.log('ConsentController.createConsent called with data:', req.body);

      // Validate required fields based on the front-end form
      if (!firstName || !lastName || !email || !phone || !procedure || !consentDate || !signatureData) {
        res.status(400).json({
          success: false,
          message2: 'First name, last name, email, phone, procedure, consent date, and signature are required.'
        });
        return;
      }
      
      // Combine all the consent checkbox data into a single notes field for now
      const notes = JSON.stringify({
        dateOfBirth,
        consentAcknowledged,
        risksUnderstood,
        questionsAnswered,
        financialConsent,
      });

      const result = await ConsentService.createConsentForm(practiceId, {
        firstName,
        lastName,
        email,
        phone, 
        procedureType: procedure,
        notes,
        signatureData,
        sharedContent: [] // Placeholder for now, as the form doesn't provide this
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create consent error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async getConsents(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const {
        status,
        search,
        sortBy,
        page = '1',
        limit = '10'
      } = req.query;

      const filters = {
        status: status as 'completed' | 'pending' | 'all',
        search: search as string,
        sortBy: sortBy as 'newest' | 'oldest' | 'asc' | 'desc',
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await ConsentService.getConsentsByPractice(practiceId, filters);
      res.json(result);
    } catch (error) {
      console.error('Get consents error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async getConsentById(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message2: 'Consent ID is required'
        });
        return;
      }

      const result = await ConsentService.getConsentById(id, practiceId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get consent by ID error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async updateConsent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message2: 'Consent ID is required'
        });
        return;
      }

      const result = await ConsentService.updateConsentForm(id, practiceId, updateData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update consent error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async deleteConsent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message2: 'Consent ID is required'
        });
        return;
      }

      const result = await ConsentService.deleteConsentForm(id, practiceId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Delete consent error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async addSharedContent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;
      const { contentId, contentTitle, contentType } = req.body;

      if (!id || !contentId || !contentTitle || !contentType) {
        res.status(400).json({
          success: false,
          message2: 'Missing required fields: contentId, contentTitle, contentType'
        });
        return;
      }

      const result = await ConsentService.addSharedContent(
        id,
        practiceId,
        contentId,
        contentTitle,
        contentType
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Add shared content error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async sendReviewRequest(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;
      const { method } = req.body;

      if (!id || !method || !['email', 'sms'].includes(method)) {
        res.status(400).json({
          success: false,
          message2: 'Invalid method. Must be "email" or "sms"'
        });
        return;
      }

      const result = await ConsentService.sendReviewRequest(id, practiceId, method);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Send review request error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async downloadConsent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message2: 'Consent ID is required'
        });
        return;
      }

      const result = await ConsentService.getConsentPdfUrl(id, practiceId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Download consent error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }
}
