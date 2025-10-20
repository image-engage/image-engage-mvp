import { supabase } from '../config/database';
import { ContentItem, ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ContentService {
  static async getContentLibrary(
    practiceId: string,
    filters?: {
      category?: string;
      contentType?: 'article' | 'pdf' | 'video' | 'image';
      search?: string;
      tags?: string[];
      isActive?: boolean;
    }
  ): Promise<ApiResponse<ContentItem[]>> {
    try {
      let query = supabase
        .from('content_library')
        .select('*')
        .eq('practice_id', practiceId);

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.contentType) {
        query = query.eq('content_type', filters.contentType);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      query = query.order('created_at', { ascending: false });

      const { data: content, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to retrieve content library'
        };
      }

      return {
        success: true,
        message2: 'Content library retrieved successfully',
        data: content || []
      };
    } catch (error) {
      console.error('Error retrieving content library:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async createContentItem(
    practiceId: string,
    contentData: {
      title: string;
      description: string;
      contentType: 'article' | 'pdf' | 'video' | 'image';
      category: string;
      fileName: string;
      fileSize: number;
      filePath: string;
      tags: string[];
      createdBy: string;
    }
  ): Promise<ApiResponse<ContentItem>> {
    try {
      const contentId = uuidv4();
      const currentDate = new Date().toISOString();

      const { data: content, error } = await supabase
        .from('content_library')
        .insert({
          id: contentId,
          practice_id: practiceId,
          title: contentData.title,
          description: contentData.description,
          content_type: contentData.contentType,
          category: contentData.category,
          file_name: contentData.fileName,
          file_size: contentData.fileSize,
          file_path: contentData.filePath,
          tags: contentData.tags,
          is_active: true,
          created_by: contentData.createdBy,
          created_at: currentDate,
          updated_at: currentDate
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to create content item'
        };
      }

      return {
        success: true,
        message2: 'Content item created successfully',
        data: content
      };
    } catch (error) {
      console.error('Error creating content item:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async updateContentItem(
    contentId: string,
    practiceId: string,
    updateData: Partial<{
      title: string;
      description: string;
      category: string;
      tags: string[];
      isActive: boolean;
    }>
  ): Promise<ApiResponse<ContentItem>> {
    try {
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.title) updateFields.title = updateData.title;
      if (updateData.description) updateFields.description = updateData.description;
      if (updateData.category) updateFields.category = updateData.category;
      if (updateData.tags) updateFields.tags = updateData.tags;
      if (updateData.isActive !== undefined) updateFields.is_active = updateData.isActive;

      const { data: content, error } = await supabase
        .from('content_library')
        .update(updateFields)
        .eq('id', contentId)
        .eq('practice_id', practiceId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to update content item'
        };
      }

      return {
        success: true,
        message2: 'Content item updated successfully',
        data: content
      };
    } catch (error) {
      console.error('Error updating content item:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async deleteContentItem(
    contentId: string,
    practiceId: string
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('content_library')
        .delete()
        .eq('id', contentId)
        .eq('practice_id', practiceId);

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to delete content item'
        };
      }

      return {
        success: true,
        message2: 'Content item deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting content item:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }
}