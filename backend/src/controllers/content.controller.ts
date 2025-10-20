import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ContentService } from '../services/content.service';
import { ApiResponse } from '../types';

export class ContentController {
  static async getContentLibrary(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const {
        category,
        contentType,
        search,
        tags,
        isActive = 'true'
      } = req.query;

      const filters = {
        category: category as string,
        contentType: contentType as 'article' | 'pdf' | 'video' | 'image',
        search: search as string,
        tags: tags ? (tags as string).split(',') : undefined,
        isActive: isActive === 'true'
      };

      const result = await ContentService.getContentLibrary(practiceId, filters);
      res.json(result);
    } catch (error) {
      console.error('Get content library error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async createContent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const practiceEmail = req.practiceEmail!;
      const {
        title,
        description,
        contentType,
        category,
        fileName,
        fileSize,
        filePath,
        tags
      } = req.body;

      // Validate required fields
      if (!title || !description || !contentType || !category || !fileName) {
        res.status(400).json({
          success: false,
          message2: 'Missing required fields: title, description, contentType, category, fileName'
        });
        return;
      }

      const result = await ContentService.createContentItem(practiceId, {
        title,
        description,
        contentType,
        category,
        fileName,
        fileSize: fileSize || 0,
        filePath: filePath || '',
        tags: tags || [],
        createdBy: practiceEmail
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create content error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async updateContent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message2: 'Content ID is required'
        });
        return;
      }

      const result = await ContentService.updateContentItem(id, practiceId, updateData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Update content error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  static async deleteContent(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message2: 'Content ID is required'
        });
        return;
      }

      const result = await ContentService.deleteContentItem(id, practiceId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }
}