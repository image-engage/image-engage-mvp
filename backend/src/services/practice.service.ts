// src/services/practice.service.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/database'; // Ensure this path is correct
import { Practice, User, ApiResponse } from '../types'; // Import User type
import bcrypt from 'bcryptjs';
// Removed uuidv4 as Supabase handles UUID generation by default for id columns
import { encrypt } from '../utils/encryption'; // Assuming this is correct

export class PracticeService {
  private static supabase: SupabaseClient = supabase; // Your Supabase client instance

  /**
   * Creates a new practice (organization) and its initial admin user.
   */
  static async createPracticeAndAdminUser(
    practiceName: string,
    firstName: string,
    lastName: string,
    email: string,
    passwordPlain: string,
    role: 'admin' | 'staff' | 'owner' = 'admin' // Default to admin for initial signup
  ): Promise<ApiResponse<{ practice: Practice; user: User }>> {
    try {
      // 1. Check if a user with this email already exists
      const { data: existingUser, error: userExistsError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userExistsError && userExistsError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Database error checking existing user:', userExistsError);
        return { success: false, message2: 'Failed to check user existence.' };
      }
      if (existingUser) {
        return { success: false, message2: 'Email already registered.' };
      }

      // 2. Hash the password
      const hashedPassword = await bcrypt.hash(passwordPlain, 12);

      // 3. Create the new practice (organization)
      const { data: newPractice, error: practiceError } = await this.supabase
        .from('practices')
        .insert({
          name: practiceName,
        })
        .select() // Select the newly created practice to get its ID
        .single();

      if (practiceError || !newPractice) {
        console.error('Error creating practice:', practiceError);
        return { success: false, message2: practiceError?.message || 'Failed to create practice.' };
      }

      // 4. Create the initial admin user linked to this practice
      const { data: newUser, error: userCreateError } = await this.supabase
        .from('users')
        .insert({
          practice_id: newPractice.id, // Link user to the new practice
          email: email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: role,
        })
        .select() // Select the newly created user to get its ID
        .single();

      if (userCreateError || !newUser) {
        console.error('Error creating admin user:', userCreateError);
        // IMPORTANT: If user creation fails, you might want to delete the newly created practice record
        // to prevent orphaned data. This would require a transaction or manual cleanup.
        // For example: await this.supabase.from('practices').delete().eq('id', newPractice.id);
        return { success: false, message2: userCreateError?.message || 'Failed to create admin user.' };
      }

      // Remove password hash before returning user data to prevent accidental exposure
      const { password_hash: userPasswordHash, ...userWithoutPassword } = newUser;

      return {
        success: true,
        message2: 'Practice and admin user registered successfully!',
        data: {
          practice: newPractice as Practice,
          user: userWithoutPassword as User // Return user without password hash
        }
      };

    } catch (error) {
      console.error('Error in PracticeService.createPracticeAndAdminUser:', error);
      return { success: false, message2: 'Internal server error during registration.' };
    }
  }

  /**
   * Authenticates a user against the 'users' table and fetches associated practice data.
   */
  static async authenticateUser(email: string, passwordPlain: string): Promise<ApiResponse<User & { practice_data: Practice }>> {
    try {
      // 1. Find the user by email in the 'users' table
      const { data: user, error: userFetchError } = await this.supabase
        .from('users')
        .select(`
          *,
          practice_data:practices (
            id, name, google_drive_folder_id, isonboarded
          )
        `) // Select user and join associated practice data
        .eq('email', email)
        .single();

      if (userFetchError && userFetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('User fetch error:', userFetchError);
        return { success: false, message2: 'Authentication failed.' }; // Generic message for security
      }
      if (!user) {
        return { success: false, message2: 'Invalid credentials.' };
      }

      // 2. Compare passwords
      const isValidPassword = await bcrypt.compare(passwordPlain, user.password_hash);
      if (!isValidPassword) {
        return { success: false, message2: 'Invalid credentials.' };
      }

      // Remove password hash from the user object before returning
      const { password_hash, ...userWithoutPassword } = user;

      // Ensure practice_data is always present if user is found
      if (!user.practice_data) {
        console.error('Authenticated user found but associated practice data is missing.');
        return { success: false, message2: 'User profile incomplete. Please contact support.' };
      }

      return {
        success: true,
        message2: 'Authentication successful',
        data: userWithoutPassword as User & { practice_data: Practice }
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return { success: false, message2: 'Internal server error during authentication.' };
    }
  }

  /**
   * Updates Google Drive information for a specific practice.
   */
  static async updateGoogleDriveInfo(
    practiceId: string,
    folderId: string,
    refreshToken: string
  ): Promise<ApiResponse> {
    try {
      const encryptedToken = encrypt(refreshToken);

      const { error } = await this.supabase
        .from('practices')
        .update({
          google_drive_folder_id: folderId,
          google_refresh_token: encryptedToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', practiceId);

      if (error) {
        console.error('Database error updating Google Drive info:', error);
        return {
          success: false,
          message2: 'Failed to update Google Drive information'
        };
      }

      return {
        success: true,
        message2: 'Google Drive integration completed successfully'
      };
    } catch (error) {
      console.error('Error updating Google Drive info:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Updates practice profile information.
   */
  static async updatePracticeProfile(
    practiceId: string,
    updateData: {
      name?: string;
      email?: string;
      phone?: string;
      branding_colors?: any;
      social_media?: any;
      isonboarded?: boolean;
    }
  ): Promise<ApiResponse<Practice>> {
    try {
      const { error } = await this.supabase
        .from('practices')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', practiceId);

      if (error) {
        console.error('Database error updating practice:', error);
        return { success: false, message2: 'Failed to update practice profile.' };
      }

      return {
        success: true,
        message2: 'Practice profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating practice profile:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Finalizes the onboarding process by updating the practice with all collected data.
   */
  static async finalizeOnboarding(
    practiceId: string,
    onboardingData: any
  ): Promise<ApiResponse<Practice>> {
    try {
      // Destructure from the nested basicInfo object sent by the frontend
      const {
        address, contactInfo, websiteUrl
      } = onboardingData?.basicInfo || {};
      
      // Other fields might be at the top level or in other nested objects
      const { brandColors } = onboardingData?.basicInfo || {};

      const updatePayload: Partial<Practice> & { [key: string]: any } = {
        address: address || null, // Ensure address is handled as an object or null
        phone: contactInfo?.phone, // phone and email are inside contactInfo
        email: contactInfo?.email,
        website_url: websiteUrl,
        branding_colors: brandColors,
        isonboarded: true, // Mark onboarding as complete
        updated_at: new Date().toISOString(),
      };

      const { data: updatedPractice, error } = await this.supabase
        .from('practices')
        .update(updatePayload)
        .eq('id', practiceId)
        .select()
        .single();

      if (error) {
        console.error('Database error finalizing onboarding:', error);
        return { success: false, message2: 'Failed to update practice profile during finalization.' };
      }

      return {
        success: true,
        message2: 'Onboarding completed and practice profile updated successfully.',
        data: updatedPractice as Practice,
      };
    } catch (error) {
      console.error('Error finalizing onboarding:', error);
      return { success: false, message2: 'Internal server error during onboarding finalization.' };
    }
  }

  /**
   * Retrieves a practice by its ID.
   */
  static async getPracticeById(practiceId: string): Promise<ApiResponse<Practice>> {
    try {
      const { data: practice, error } = await this.supabase
        .from('practices')
        .select('*')
        .eq('id', practiceId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Database error retrieving practice:', error);
        return { success: false, message2: 'Failed to retrieve practice.' };
      }
      if (!practice) {
        return { success: false, message2: 'Practice not found.' };
      }

      // Remove sensitive information before returning
      const { google_refresh_token, ...safePractice } = practice; // password_hash already removed from practices table

      return {
        success: true,
        message2: 'Practice retrieved successfully',
        data: safePractice as Practice
      };
    } catch (error) {
      console.error('Error retrieving practice:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Retrieves a user by their ID, including their practice data.
   */
  static async getUserById(userId: string): Promise<ApiResponse<User & { practice_data: Practice }>> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select(`
          *,
          practice_data:practices (
            id, name, google_drive_folder_id, phone, branding_colors, social_media, isonboarded
          )
        `)
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Database error retrieving user:', error);
        return { success: false, message2: 'Failed to retrieve user.' };
      }
      if (!user) {
        return { success: false, message2: 'User not found.' };
      }

      // Remove password hash before returning
      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        message2: 'User retrieved successfully',
        data: userWithoutPassword as User & { practice_data: Practice }
      };
    } catch (error) {
      console.error('Error retrieving user:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Retrieves a user by their email, including their practice data.
   */
  static async authenticateUserByEmail(email: string): Promise<ApiResponse<User & { practice_data: Practice }>> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select(`
          *,
          practice_data:practices (
            id, name, google_drive_folder_id,  phone, branding_colors, social_media, isonboarded
          )
        `)
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Database error retrieving user by email:', error);
        return { success: false, message2: 'Failed to retrieve user.' };
      }
      if (!user) {
        return { success: false, message2: 'User not found.' };
      }

      // Remove password hash before returning
      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        message2: 'User retrieved successfully',
        data: userWithoutPassword as User & { practice_data: Practice }
      };
    } catch (error) {
      console.error('Error retrieving user by email:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Creates a new staff user for an existing practice.
   * This would typically be called by an authenticated admin user.
   */
  static async createStaffUser(
    practiceId: string,
    firstName: string,
    lastName: string,
    email: string,
    passwordPlain: string,
    role: 'staff' | 'admin' = 'staff' // Can be staff or admin, but default to staff
  ): Promise<ApiResponse<User>> {
    try {
      // 1. Check if user with this email already exists
      const { data: existingUser, error: userExistsError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userExistsError && userExistsError.code !== 'PGRST116') {
        console.error('Database error checking existing user:', userExistsError);
        return { success: false, message2: 'Failed to check user existence.' };
      }
      if (existingUser) {
        return { success: false, message2: 'Email already registered.' };
      }

      // 2. Hash the password
      const hashedPassword = await bcrypt.hash(passwordPlain, 12);

      // 3. Create the new user
      const { data: newUser, error: userCreateError } = await this.supabase
        .from('users')
        .insert({
          practice_id: practiceId,
          email: email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: role,
        })
        .select()
        .single();

      if (userCreateError || !newUser) {
        console.error('Error creating staff user:', userCreateError);
        return { success: false, message2: userCreateError?.message || 'Failed to create staff user.' };
      }

      // Remove password hash before returning
      const { password_hash, ...userWithoutPassword } = newUser;

      return {
        success: true,
        message2: 'Staff user created successfully',
        data: userWithoutPassword as User
      };
    } catch (error) {
      console.error('Error in PracticeService.createStaffUser:', error);
      return { success: false, message2: 'Internal server error during staff user creation.' };
    }
  }
}