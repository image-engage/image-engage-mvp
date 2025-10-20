import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PracticeService } from '../services/practice.service';
//import { GoogleDriveService } from '../services/google-drive.service';
import { ApiResponse } from '../types';

export class PracticeController {
  static async getProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const result = await PracticeService.getPracticeById(practiceId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { name, email, phone, branding_colors, social_media, isonboarded } = req.body;

      const result = await PracticeService.updatePracticeProfile(
        practiceId,
        { name, email, phone, branding_colors, social_media, isonboarded }
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  // static async setupGoogleDriveFolders(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
  //   try {
  //     const practiceId = req.practiceId!;
  //     const { refreshToken, practiceName } = req.body;

  //     if (!refreshToken || !practiceName) {
  //       res.status(400).json({
  //         success: false,
  //         message2: 'Refresh token and practice name are required'
  //       });
  //       return;
  //     }

  //     // Create folder structure
  //     const folders = await GoogleDriveService.createPracticeFolderStructure(
  //       refreshToken,
  //       practiceName,
  //       practiceId
  //     );

  //     // Update practice with Google Drive info
  //     const rootFolder = folders[0];
  //     await PracticeService.updateGoogleDriveInfo(
  //       practiceId,
  //       rootFolder.id,
  //       refreshToken
  //     );

  //     res.json({
  //       success: true,
  //       message2: 'Google Drive folder structure created successfully',
  //       data: { folders }
  //     });
  //   } catch (error) {
  //     console.error('Setup folders error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message2: 'Failed to setup Google Drive folders'
  //     });
  //   }
  // }

  static async getFolderStructure(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      
      // In production, you'd fetch this from the database
      const mockStructure = {
        practiceId,
        practiceName: 'Mock Practice',
        folders: {
          consents: `/${practiceId}/_Consents/`,
          rawPhotos: `/${practiceId}/_RawPhotos/`,
          editedPhotos: `/${practiceId}/_EditedPhotos/`,
          collagesReview: `/${practiceId}/_CollagesReadyForReview/`,
          publishedArchive: `/${practiceId}/_PublishedArchive/`
        }
      };

      res.json({
        success: true,
        message2: 'Folder structure retrieved successfully',
        data: mockStructure
      });
    } catch (error) {
      console.error('Get folder structure error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }
}