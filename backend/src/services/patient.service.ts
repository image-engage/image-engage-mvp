// src/services/patient.service.ts
import { supabase } from '../config/database';
import { PatientConsent, ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PatientService {
  /**
   * Creates a new patient profile record in the new `patients` table.
   * This now acts as the core patient profile, without consent-specific details.
   */
  static async createPatientProfile(
    practiceId: string,
    // The patientData parameter is updated to reflect the new table structure.
    patientData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }
  ): Promise<ApiResponse<PatientConsent>> {
    try {
      const patientId = uuidv4();
      const currentDate = new Date().toISOString();

      const { data: patient, error } = await supabase
        // Updated table name from 'patient_consents' to 'patients'
        .from('patients')
        .insert({
          id: patientId,
          practice_id: practiceId,
          first_name: patientData.firstName,
          last_name: patientData.lastName,
          email: patientData.email,
          phone: patientData.phone,
          // The following columns are removed as they are no longer in the table:
          // procedure_type, consent_date, consent_status
          created_at: currentDate,
          updated_at: currentDate
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to create patient profile'
        };
      }

      return {
        success: true,
        message2: 'Patient profile created successfully',
        data: patient
      };
    } catch (error) {
      console.error('Error creating patient profile:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Retrieves all patient profiles associated with a given practice from the `patients` table.
   */
  static async getPatientProfilesByPractice(practiceId: string, searchTerm?: string): Promise<ApiResponse<PatientConsent[]>> {
    try {
      let query = supabase
        // Updated table name from 'patient_consents' to 'patients'
        .from('patients')
        .select('*')
        .eq('practice_id', practiceId);

      // If a search term is provided, add a filter
      if (searchTerm) {
        const searchPattern = `%${searchTerm}%`;
        // Use .or() to search in multiple columns. The syntax is a string of filters.
        query = query.or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
      }

      const { data: patients, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to retrieve patient profiles'
        };
      }

      return {
        success: true,
        message2: 'Patient profiles retrieved successfully',
        data: patients || []
      };
    } catch (error) {
      console.error('Error retrieving patient profiles:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }
  
  static async getPatientProfileById(practiceId: string, patientId: string): Promise<ApiResponse<PatientConsent>> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('practice_id', practiceId)
        .single(); // Use single() to get a single object or null

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to retrieve patient profile'
        };
      }

      if (!patient) {
        return {
          success: false,
          message2: 'Patient profile not found'
        };
      }

      return {
        success: true,
        message2: 'Patient profile retrieved successfully',
        data: patient
      };
    } catch (error) {
      console.error('Error retrieving single patient profile:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Updates the 'last_photo_session' column for a specific patient.
   */
  static async updateLastPhotoSession(
    practiceId: string,
    patientId: string,
    sessionId: string
  ): Promise<ApiResponse> {
    try {
      const currentDate = new Date().toISOString();

      const { data, error, count } = await supabase
        .from('patients')
        .update({ 
          last_photo_session: sessionId, // This is the correct column to update
          updated_at: currentDate // Also update the general updated_at column
        })
        .eq('id', patientId)
        .eq('practice_id', practiceId)
        .select()
        .maybeSingle(); // Use maybeSingle to check if a row was updated

      if (error) {
        console.error('Database update error:', error);
        return {
          success: false,
          message2: 'Failed to update last photo session'
        };
      }
      
      // 'data' will be null if no row matched the filter criteria
      if (!data) {
        return {
          success: false,
          message2: 'Patient profile not found'
        };
      }

      return {
        success: true,
        message2: 'Last photo session updated successfully',
        // Optional: you could return the updated patient object here if needed (PatientConsent)
      };
    } catch (error) {
      console.error('Error updating last photo session:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  /**
   * Completes workflow session when after photos are skipped
   */
  static async completeWorkflowSkipAfter(
    practiceId: string,
    patientId: string,
    sessionId: string
  ): Promise<ApiResponse> {
    try {
      const currentDate = new Date().toISOString();

      const { data, error } = await supabase
        .from('patient_workflow_sessions')
        .update({
          current_step: 'completed',
          after_photos_completed: true,
          after_completed_at: currentDate,
          workflow_completed_at: currentDate,
          updated_at: currentDate
        })
        .eq('patient_id', patientId)
        .eq('practice_id', practiceId)
        .eq('id', sessionId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Database update error:', error);
        return {
          success: false,
          message2: 'Failed to complete workflow session'
        };
      }

      if (!data) {
        return {
          success: false,
          message2: 'Workflow session not found'
        };
      }

      return {
        success: true,
        message2: 'Workflow session completed successfully'
      };
    } catch (error) {
      console.error('Error completing workflow session:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

}
