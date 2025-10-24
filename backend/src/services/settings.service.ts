// src/services/settings.service.ts
import { supabase } from '../config/database';
import { ApiResponse, Practice, User } from '../types';

/**
 * Service class for handling settings-related operations.
 */
export class SettingsService {

  /**
   * Retrieves the full practice profile, including related settings data.
   * @param practiceId The ID of the practice.
   * @returns An ApiResponse containing the practice profile.
   */
  static async getPracticeProfile(practiceId: string): Promise<ApiResponse<Practice>> {
    try {
      const { data, error } = await supabase
        .from('practices')
        .select(`
          *,
          business_hours(*),
          social_media_accounts(*),
          subscriptions(*)
        `)
        .eq('id', practiceId)
        .single();

      if (error) {
        console.error('Error fetching practice profile:', error);
        return { success: false, message: 'Failed to retrieve practice profile.', error: error.message };
      }

      if (!data) {
        return { success: false, message: 'Practice not found.' };
      }

      return { success: true, message: 'Practice profile retrieved successfully.', data };
    } catch (error: any) {
      console.error('Unexpected error in getPracticeProfile:', error);
      return { success: false, message: 'An internal server error occurred.', error: error.message };
    }
  }

  /**
   * Retrieves the review settings for a practice.
   * @param practiceId The ID of the practice.
   * @returns An ApiResponse containing the review settings.
   */
  static async getReviewSettings(practiceId: string): Promise<ApiResponse> {
    // The 'review_settings' table does not exist in the provided schema.
    // This is a placeholder implementation.
    // To implement this fully, a 'review_settings' table linked to 'practices' is needed.
    console.warn(`Attempted to access 'review_settings' for practice ${practiceId}, but the table does not exist in the schema.`);
    return {
      success: true,
      message: "Review settings endpoint is not fully implemented pending database schema changes.",
      data: {
        email_enabled: false,
        sms_enabled: false,
        email_template: "This is a default template.",
        sms_template: "This is a default SMS template.",
        review_platforms: [],
        delay_hours: 24
      }
    };
  }

  /**
   * Retrieves all users associated with a practice.
   * @param practiceId The ID of the practice.
   * @returns An ApiResponse containing a list of users.
   */
  static async getPracticeUsers(practiceId: string): Promise<ApiResponse<User[]>> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('practice_id', practiceId);

    if (error) return { success: false, message: 'Failed to retrieve users.', error: error.message };
    return { success: true, message: 'Users retrieved successfully.', data: data || [] };
  }
}