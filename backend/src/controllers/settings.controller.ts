// src/controllers/settings.controller.ts
import { Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { AuthRequest } from '../types';

export class SettingsController {
  /**
   * Retrieves the full practice profile, including related settings data.
   */
  static async getPracticeProfile(req: AuthRequest, res: Response): Promise<void> {
    const practiceId = req.user?.practiceId;
    if (!practiceId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await SettingsService.getPracticeProfile(practiceId);
    res.status(result.success ? 200 : 404).json(result);
  }

  /**
   * Retrieves the review settings for a practice.
   * NOTE: This currently returns placeholder data.
   */
  static async getReviewSettings(req: AuthRequest, res: Response): Promise<void> {
    const practiceId = req.user?.practiceId;
    if (!practiceId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await SettingsService.getReviewSettings(practiceId);
    res.status(200).json(result);
  }

  /**
   * Retrieves all users associated with a practice.
   */
  static async getPracticeUsers(req: AuthRequest, res: Response): Promise<void> {
    const practiceId = req.user?.practiceId;
    if (!practiceId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await SettingsService.getPracticeUsers(practiceId);
    res.status(result.success ? 200 : 500).json(result);
  }

  /**
   * Updates the practice profile.
   */
  static async updatePracticeProfile(req: AuthRequest, res: Response): Promise<void> {
    const practiceId = req.user?.practiceId;
    if (!practiceId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await SettingsService.updatePracticeProfile(practiceId, req.body);
    res.status(result.success ? 200 : 500).json(result);
  }

  /**
   * Updates the review settings.
   */
  static async updateReviewSettings(req: AuthRequest, res: Response): Promise<void> {
    const practiceId = req.user?.practiceId;
    if (!practiceId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await SettingsService.updateReviewSettings(practiceId, req.body);
    res.status(result.success ? 200 : 500).json(result);
  }
}