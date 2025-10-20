import { Response } from 'express';
import { MediaPostsService } from '../services/media-posts.service';
import { ApiResponse, MediaPostFilters, MediaPostUpdate, BulkStatusUpdate } from '../types/media-posts';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Handles all API requests for media posts retrieval and management
 * Controller layer that validates requests and delegates to service layer
 */
export class MediaPostsController {
  
  /**
   * Gets all media posts with optional filtering
   * GET /api/media-posts?status=pending&search=smile&startDate=2024-01-01&page=1&limit=12
   * 
   * Query params:
   * - status: Filter by status (pending, approved, declined, posted, all)
   * - mediaType: Filter by type (photo, video, all)
   * - startDate: Filter from date (YYYY-MM-DD)
   * - endDate: Filter to date (YYYY-MM-DD)
   * - search: Search in captions and filenames
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 50)
   */
  static async getAllMediaPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract and validate query parameters
      const filters: MediaPostFilters = {
        status: req.query.status as string,
        mediaType: req.query.mediaType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      // Validate page and limit
      if (filters.page && (filters.page < 1 || isNaN(filters.page))) {
        res.status(400).json({
          success: false,
          message: 'Invalid page number',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      if (filters.limit && (filters.limit < 1 || filters.limit > 100 || isNaN(filters.limit))) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      const mediaPostsService = new MediaPostsService();
      const result = await mediaPostsService.getMediaPosts(filters);

      res.status(200).json({
        success: true,
        message: 'Media posts retrieved successfully',
        data: result
      } as ApiResponse);

    } catch (error) {
      console.error('MediaPostsController.getAllMediaPosts error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve media posts',
        message2: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: 'RETRIEVAL_ERROR'
      } as ApiResponse);
    }
  }

  /**
   * Gets a specific media post by ID
   * GET /api/media-posts/:id
   */
  static async getMediaPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Media post ID is required',
          error: 'MISSING_PARAMETER'
        } as ApiResponse);
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid media post ID format',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      const mediaPostsService = new MediaPostsService();
      const mediaPost = await mediaPostsService.getMediaPostById(id);

      if (!mediaPost) {
        res.status(404).json({
          success: false,
          message: 'Media post not found',
          error: 'NOT_FOUND'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Media post retrieved successfully',
        data: mediaPost
      } as ApiResponse);

    } catch (error) {
      console.error('MediaPostsController.getMediaPostById error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve media post',
        message2: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: 'RETRIEVAL_ERROR'
      } as ApiResponse);
    }
  }

  /**
 * Creates a new media post
 * POST /api/media-posts
 * 
 * Body:
 * {
 *   "file_name": "patient_smile.jpg",
 *   "file_path": "uploads/2024/patient_smile.jpg",
 *   "bucket_name": "media-uploads",
 *   "image_url": "https://...",
 *   "caption": "Amazing transformation!",
 *   "hashtags": "#NewSmile #Dental",
 *   "targetPlatforms": ["Instagram", "Facebook"],
 *   "media_type": "photo"
 * }
 */
static async createMediaPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      file_name,
      file_path,
      bucket_name,
      image_url,
      caption,
      hashtags,
      targetPlatforms,
      media_type,
      media_id,
      permalink
    } = req.body;

    // Validate required fields
    if (!file_name || !file_path || !image_url) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: file_name, file_path, and image_url are required',
        error: 'VALIDATION_ERROR'
      } as ApiResponse);
      return;
    }

    // Validate file_name format
    if (typeof file_name !== 'string' || file_name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'file_name must be a non-empty string',
        error: 'VALIDATION_ERROR'
      } as ApiResponse);
      return;
    }

    // Validate image_url format (basic URL check)
    try {
      new URL(image_url);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'image_url must be a valid URL',
        error: 'VALIDATION_ERROR'
      } as ApiResponse);
      return;
    }

    // Validate media_type if provided
    if (media_type && !['photo', 'video'].includes(media_type)) {
      res.status(400).json({
        success: false,
        message: 'media_type must be either "photo" or "video"',
        error: 'VALIDATION_ERROR'
      } as ApiResponse);
      return;
    }

    // Validate targetPlatforms if provided
    if (targetPlatforms && !Array.isArray(targetPlatforms)) {
      res.status(400).json({
        success: false,
        message: 'targetPlatforms must be an array',
        error: 'VALIDATION_ERROR'
      } as ApiResponse);
      return;
    }

    // Validate caption length if provided
    if (caption && caption.length > 2200) {
      res.status(400).json({
        success: false,
        message: 'Caption must be 2200 characters or less',
        error: 'VALIDATION_ERROR'
      } as ApiResponse);
      return;
    }

    const mediaPostsService = new MediaPostsService();
    const newPost = await mediaPostsService.createMediaPost({
      file_name,
      file_path,
      bucket_name: bucket_name || 'media-uploads',
      image_url,
      caption: caption || '',
      hashtags,
      targetPlatforms,
      media_type: media_type || 'photo',
      media_id,
      permalink
    });

    res.status(201).json({
      success: true,
      message: 'Media post created successfully',
      data: newPost
    } as ApiResponse);

  } catch (error) {
    console.error('MediaPostsController.createMediaPost error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create media post',
      message2: error instanceof Error ? error.message : 'An unexpected error occurred',
      error: 'CREATE_ERROR'
    } as ApiResponse);
  }
}

  /**
   * Updates a media post (status, caption, hashtags, target platforms)
   * PUT /api/media-posts/:id
   * 
   * Body:
   * {
   *   "caption": "Updated caption",
   *   "hashtags": "#NewSmile #Dental",
   *   "targetPlatforms": ["Instagram", "Facebook"],
   *   "status": "approved"
   * }
   */
  static async updateMediaPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: MediaPostUpdate = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Media post ID is required',
          error: 'MISSING_PARAMETER'
        } as ApiResponse);
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid media post ID format',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      // Validate at least one field to update
      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No fields to update',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      // Validate status if provided
      if (updates.status && !['pending', 'approved', 'declined', 'posted'].includes(updates.status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status value. Must be: pending, approved, declined, or posted',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      // Validate targetPlatforms if provided
      if (updates.targetPlatforms && !Array.isArray(updates.targetPlatforms)) {
        res.status(400).json({
          success: false,
          message: 'targetPlatforms must be an array',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      // Validate caption length if provided
      if (updates.caption && updates.caption.length > 2200) {
        res.status(400).json({
          success: false,
          message: 'Caption must be 2200 characters or less',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      const mediaPostsService = new MediaPostsService();
      const updatedPost = await mediaPostsService.updateMediaPost(id, updates);

      res.status(200).json({
        success: true,
        message: 'Media post updated successfully',
        data: updatedPost
      } as ApiResponse);

    } catch (error) {
      console.error('MediaPostsController.updateMediaPost error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update media post',
        message2: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: 'UPDATE_ERROR'
      } as ApiResponse);
    }
  }

  /**
   * Bulk update status for multiple media posts
   * PUT /api/media-posts/bulk/status
   * 
   * Body:
   * {
   *   "ids": ["uuid1", "uuid2", "uuid3"],
   *   "status": "approved"
   * }
   */
  static async bulkUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ids, status }: BulkStatusUpdate = req.body;

      // Validate ids
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Array of media post IDs is required',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      // Validate maximum bulk update size
      if (ids.length > 100) {
        res.status(400).json({
          success: false,
          message: 'Cannot update more than 100 posts at once',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      // Validate all IDs are valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = ids.filter(id => !uuidRegex.test(id));
      if (invalidIds.length > 0) {
        res.status(400).json({
          success: false,
          message: `Invalid ID format for: ${invalidIds.join(', ')}`,
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      // Validate status
      if (!status || !['pending', 'approved', 'declined', 'posted'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status is required (pending, approved, declined, posted)',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      const mediaPostsService = new MediaPostsService();
      const updatedPosts = await mediaPostsService.bulkUpdateStatus(ids, status);

      res.status(200).json({
        success: true,
        message: `Successfully updated ${updatedPosts.length} media post(s)`,
        data: {
          updatedCount: updatedPosts.length,
          posts: updatedPosts
        }
      } as ApiResponse);

    } catch (error) {
      console.error('MediaPostsController.bulkUpdateStatus error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update media posts',
        message2: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: 'BULK_UPDATE_ERROR'
      } as ApiResponse);
    }
  }

  /**
   * Deletes a media post
   * DELETE /api/media-posts/:id
   */
  static async deleteMediaPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Media post ID is required',
          error: 'MISSING_PARAMETER'
        } as ApiResponse);
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid media post ID format',
          error: 'VALIDATION_ERROR'
        } as ApiResponse);
        return;
      }

      const mediaPostsService = new MediaPostsService();
      await mediaPostsService.deleteMediaPost(id);

      res.status(200).json({
        success: true,
        message: 'Media post deleted successfully'
      } as ApiResponse);

    } catch (error) {
      console.error('MediaPostsController.deleteMediaPost error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete media post',
        message2: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: 'DELETE_ERROR'
      } as ApiResponse);
    }
  }

  /**
   * Gets media post statistics
   * GET /api/media-posts/stats
   */
  static async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const mediaPostsService = new MediaPostsService();
      const stats = await mediaPostsService.getStatistics();

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      } as ApiResponse);

    } catch (error) {
      console.error('MediaPostsController.getStatistics error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        message2: error instanceof Error ? error.message : 'An unexpected error occurred',
        error: 'RETRIEVAL_ERROR'
      } as ApiResponse);
    }
  }
}