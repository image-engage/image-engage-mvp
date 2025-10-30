import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PracticeService } from '../services/practice.service';
import { ApiResponse } from '../types';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId;
      const user = req.user;
      
      if (!practiceId || !user) {
        res.status(400).json({
          success: false,
          message2: 'Authentication data not found'
        });
        return;
      }

      // Get practice data from Supabase
      const practiceResult = await PracticeService.getPracticeById(practiceId);
      
      if (!practiceResult.success) {
        res.status(404).json(practiceResult);
        return;
      }

      // Build user data from Cognito token
      const userData = {
        id: user.sub,
        email: user.email,
        first_name: user.given_name || '',
        last_name: user.family_name || '',
        role: user['custom:role'],
        practice_id: user['custom:practice_id'],
        practice_data: practiceResult.data
      };

      res.json({
        success: true,
        message2: 'Profile retrieved successfully',
        data: userData
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