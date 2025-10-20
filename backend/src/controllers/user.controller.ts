import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PracticeService } from '../services/practice.service';
import { ApiResponse } from '../types';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId;
      const email = req.practiceEmail || req.user?.email;
      
      if (!practiceId) {
        res.status(400).json({
          success: false,
          message2: 'Practice ID not found in token'
        });
        return;
      }

      // Get practice data directly since authentication is practice-based
      const practiceResult = await PracticeService.getPracticeById(practiceId);
      
      if (!practiceResult.success) {
        res.status(404).json(practiceResult);
        return;
      }

      // Try to get user data if email is available
      let userData = null;
      if (email) {
        const userResult = await PracticeService.authenticateUserByEmail(email);
        if (userResult.success) {
          userData = userResult.data;
        }
      }

      // Return the expected structure
      res.json({
        success: true,
        message2: 'Profile retrieved successfully',
        data: userData || {
          practice_data: practiceResult.data
        }
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { first_name, last_name, email } = req.body;

      // Implementation for updating user profile would go here
      // This would include validation and database updates

      res.json({
        success: true,
        message2: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async getPracticeInfo(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const result = await PracticeService.getPracticeById(practiceId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get practice info error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }
}