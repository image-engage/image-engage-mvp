import { Response } from 'express';
import * as settingsService from '../services/settings.service';
import { UpdatePracticeDto} from '../types/settings-practice';
import { ApiResponse } from '../types'; 
import { AuthenticatedRequest } from '../middleware/auth';

export class SettingsController {
  /**
   * Handles GET request to fetch practice settings.
   */
  static async getSettings(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      // Get the practiceId from the authenticated user's token.
      const practiceId = req.user?.practiceId;

      if (!practiceId) {
        res.status(401).json({ success: false, message: 'Authentication required: Practice ID not found in token.' });
        return;
      }

      const settings = await settingsService.getPracticeSettings(practiceId);

      if (!settings) {
        res.status(404).json({ success: false, message: 'Practice settings not found.' });
        return;
      }

      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      console.error('Error fetching practice settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      res.status(500).json({ success: false, message: 'Internal server error.', error: errorMessage });
    }
  }

  /**
   * Handles PUT request to update practice settings.
   */
  static async updateSettings(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.user?.practiceId;
      const updateData: UpdatePracticeDto = req.body;

      if (!practiceId) {
        res.status(401).json({ success: false, message: 'Authentication required: Practice ID not found in token.' });
        return;
      }

      // Ensure there's something to update
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ success: false, message: 'No update data provided.' });
        return;
      }

      const updatedSettings = await settingsService.updatePracticeSettings(practiceId, updateData);

      if (!updatedSettings) {
        // This could be because the practiceId is invalid
        res.status(404).json({ success: false, message: 'Practice not found.' });
        return;
      }
      res.status(200).json({ success: true, data: updatedSettings });
    } catch (error) {
      console.error('Error updating practice settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      res.status(500).json({ success: false, message: 'Internal server error.', error: errorMessage });
    }
  }
}