import { supabase } from '../config/database';
import { MediaPost, MediaPostFilters, MediaPostUpdate } from '../types/media-posts';

/**
 * Service for managing media posts in Supabase
 * Handles all database operations for the media_posts table
 */
export class MediaPostsService {
  
  /**
   * Retrieves media posts with filtering and pagination
   * @param filters - Filter criteria including status, date range, search, pagination
   * @returns Paginated list of media posts with metadata
   */
  async getMediaPosts(filters: MediaPostFilters): Promise<{
    posts: MediaPost[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      let query = supabase
        .from('media_posts')
        .select('*', { count: 'exact' });

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply media type filter
      if (filters.mediaType && filters.mediaType !== 'all') {
        query = query.eq('media_type', filters.mediaType);
      }

      // Apply date range filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
      }

      // Apply search filter (searches in caption and file_name)
      if (filters.search) {
        query = query.or(`caption.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%`);
      }

      // Get total count
      const { count } = await query;

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to retrieve media posts: ${error.message}`);
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      return {
        posts: data || [],
        total: count || 0,
        page,
        limit,
        totalPages
      };

    } catch (error) {
      console.error('MediaPostsService.getMediaPosts error:', error);
      throw new Error(`Failed to retrieve media posts: ${error}`);
    }
  }

  /**
   * Retrieves a single media post by ID
   * @param id - UUID of the media post
   * @returns Media post or null if not found
   */
  async getMediaPostById(id: string): Promise<MediaPost | null> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to retrieve media post: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('MediaPostsService.getMediaPostById error:', error);
      throw new Error(`Failed to retrieve media post: ${error}`);
    }
  }

/**
 * Creates a new media post
 * @param postData - Media post data to insert
 * @returns Newly created media post
 */
 async createMediaPost(postData: {
    file_name: string;
    file_path: string;
    bucket_name: string;
    image_url: string;
    caption: string;
    hashtags?: string;
    targetPlatforms?: string[];
    media_type?: 'photo' | 'video';
    media_id?: string;
    permalink?: string;
    }): Promise<MediaPost> {
    try {
        const insertData: any = {
        file_name: postData.file_name,
        file_path: postData.file_path,
        bucket_name: postData.bucket_name || 'media-uploads',
        image_url: postData.image_url,
        caption: postData.caption || '',
        status: 'pending', // Default status for new posts
        media_type: postData.media_type || 'photo'
        };

        // Add optional fields if provided
        if (postData.hashtags) insertData.hashtags = postData.hashtags;
        if (postData.media_id) insertData.media_id = postData.media_id;
        if (postData.permalink) insertData.permalink = postData.permalink;
        
        // Handle target_platforms (convert from camelCase to snake_case)
        if (postData.targetPlatforms && postData.targetPlatforms.length > 0) {
        insertData.target_platforms = postData.targetPlatforms;
        } else {
        insertData.target_platforms = ['Instagram']; // Default platform
        }

        const { data, error } = await supabase
        .from('media_posts')
        .insert(insertData)
        .select()
        .single();

        if (error) {
        throw new Error(`Failed to create media post: ${error.message}`);
        }

        return data;

    } catch (error) {
        console.error('MediaPostsService.createMediaPost error:', error);
        throw new Error(`Failed to create media post: ${error}`);
    }
  }

  /**
   * Updates a media post
   * @param id - UUID of the media post to update
   * @param updates - Partial updates to apply
   * @returns Updated media post
   */
  async updateMediaPost(id: string, updates: MediaPostUpdate): Promise<MediaPost> {
    try {
      const updateData: any = {};

      // Only include fields that are provided
      if (updates.caption !== undefined) updateData.caption = updates.caption;
      if (updates.hashtags !== undefined) updateData.hashtags = updates.hashtags;
      if (updates.targetPlatforms !== undefined) updateData.target_platforms = updates.targetPlatforms;
      
      if (updates.status !== undefined) {
        updateData.status = updates.status;
        
        // Update posted_at timestamp when status changes to 'posted'
        if (updates.status === 'posted') {
          updateData.posted_at = new Date().toISOString();
        }
        
        // Clear posted_at if status changes back to pending or approved
        if (updates.status === 'pending' || updates.status === 'approved') {
          updateData.posted_at = null;
        }
      }

      const { data, error } = await supabase
        .from('media_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update media post: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('MediaPostsService.updateMediaPost error:', error);
      throw new Error(`Failed to update media post: ${error}`);
    }
  }

  /**
   * Bulk update status for multiple media posts
   * @param ids - Array of media post UUIDs
   * @param status - New status to apply
   * @returns Array of updated media posts
   */
  async bulkUpdateStatus(ids: string[], status: string): Promise<MediaPost[]> {
    try {
      const updateData: any = { status };

      // Update posted_at timestamp when status changes to 'posted'
      if (status === 'posted') {
        updateData.posted_at = new Date().toISOString();
      }
      
      // Clear posted_at if status changes back
      if (status === 'pending' || status === 'approved') {
        updateData.posted_at = null;
      }

      const { data, error } = await supabase
        .from('media_posts')
        .update(updateData)
        .in('id', ids)
        .select();

      if (error) {
        throw new Error(`Failed to bulk update media posts: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('MediaPostsService.bulkUpdateStatus error:', error);
      throw new Error(`Failed to bulk update media posts: ${error}`);
    }
  }

  /**
   * Deletes a media post
   * @param id - UUID of the media post to delete
   */
  async deleteMediaPost(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete media post: ${error.message}`);
      }

    } catch (error) {
      console.error('MediaPostsService.deleteMediaPost error:', error);
      throw new Error(`Failed to delete media post: ${error}`);
    }
  }

  /**
   * Gets media post statistics for dashboard
   * @returns Statistics object with counts by status
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    declined: number;
    posted: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('status');

      if (error) {
        throw new Error(`Failed to retrieve statistics: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(p => p.status === 'pending').length || 0,
        approved: data?.filter(p => p.status === 'approved').length || 0,
        declined: data?.filter(p => p.status === 'declined').length || 0,
        posted: data?.filter(p => p.status === 'posted').length || 0
      };

      return stats;

    } catch (error) {
      console.error('MediaPostsService.getStatistics error:', error);
      throw new Error(`Failed to retrieve statistics: ${error}`);
    }
  }

  /**
   * Gets recent media posts (last 14 days)
   * @param limit - Maximum number of posts to return
   * @returns Array of recent media posts
   */
  async getRecentPosts(limit: number = 50): Promise<MediaPost[]> {
    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to retrieve recent posts: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('MediaPostsService.getRecentPosts error:', error);
      throw new Error(`Failed to retrieve recent posts: ${error}`);
    }
  }

  /**
   * Gets posts by platform
   * @param platform - Social media platform name
   * @returns Array of posts targeted for that platform
   */
  async getPostsByPlatform(platform: string): Promise<MediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .contains('target_platforms', [platform])
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve posts by platform: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('MediaPostsService.getPostsByPlatform error:', error);
      throw new Error(`Failed to retrieve posts by platform: ${error}`);
    }
  }
}