import { supabase } from '../config/database';

/**
 * Contains all business logic and database interactions for the patient workflow.
 */
export class WorkflowService {
  /**
   * Creates a new patient profile and a pending consent form.
   * @param {string} practiceId - The ID of the practice.
   * @param {{ firstName: string, lastName: string, email: string, phone: string }} patientData - Patient demographic data.
   * @returns {Promise<{ patientId: string, consentFormId: string, error?: string }>}
   */
  static async startSession(practiceId: string, patientData: { firstName: string; lastName: string; email: string; phone: string }) {
    try {
      const { firstName, lastName, email, phone } = patientData;

      // Check if the patient already exists for this practice
      const { data: existingPatient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('practice_id', practiceId)
        .eq('email', email)
        .single();

      let patientId: string;
      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: newPatientError } = await supabase
          .from('patients')
          .insert({
            practice_id: practiceId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
          })
          .select('id')
          .single();

        if (newPatientError) throw newPatientError;
        patientId = newPatient.id;
      }

      // Create a new consent form record for the session
      const { data: newConsentForm, error: consentError } = await supabase
        .from('consent_forms')
        .insert({
          practice_id: practiceId,
          patient_id: patientId,
          procedure_type: 'General Consent', // Default type
          status: 'pending'
        })
        .select('id')
        .single();

      if (consentError) throw consentError;

      return {
        message: 'Patient session started successfully.',
        patientId: patientId,
        consentFormId: newConsentForm.id
      };
    } catch (err) {
      console.error('Supabase error starting patient session:', err);
      return { error: 'Failed to start patient session.' };
    }
  }

  /**
   * Updates a pending consent form to 'completed' and adds patient signature.
   * @param {string} practiceId - The ID of the practice.
   * @param {string} patientId - The ID of the patient.
   * @param {string} consentFormId - The ID of the consent form.
   * @param {{ procedureType: string, notes?: string, signatureData: string, sharedContent: any[] }} updateData - The consent form data to update.
   * @returns {Promise<{ message: string, error?: string }>}
   */
  static async completeConsentForm(practiceId: string, patientId: string, consentFormId: string, updateData: { procedureType: string; notes?: string; signatureData: string; sharedContent: any[] }) {
    try {
      const { data, error } = await supabase
        .from('consent_forms')
        .update({
          procedure_type: updateData.procedureType,
          notes: updateData.notes,
          signature_data: updateData.signatureData,
          shared_content: updateData.sharedContent,
          status: 'completed',
          consent_date: new Date().toISOString()
        })
        .eq('id', consentFormId)
        .eq('patient_id', patientId)
        .eq('practice_id', practiceId)
        .select();

      if (error) throw error;
      if (data.length === 0) {
        return { error: 'Consent form not found or already completed.' };
      }

      await supabase
        .from('patients')
        .update({ consent_status: 'active' })
        .eq('id', patientId)
        .eq('practice_id', practiceId);

      return { message: 'Consent form completed successfully.' };
    } catch (err) {
      console.error('Supabase error completing consent form:', err);
      return { error: 'Failed to complete consent form.' };
    }
  }

  /**
   * Fetches patients who have a completed consent form but no photo session.
   * @param {string} practiceId - The ID of the practice.
   * @returns {Promise<{ message: string, patients: any[], error?: string }>}
   */
  static async getWaitingPatients(practiceId: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, last_photo_session')
        .eq('practice_id', practiceId)
        .eq('consent_status', 'active');

      if (error) throw error;

      return {
        message: 'Waiting patients fetched successfully.',
        patients: data
      };
    } catch (err) {
      console.error('Supabase error fetching waiting patients:', err);
      return { error: 'Failed to fetch waiting patients.' };
    }
  }

  /**
   * Creates a new photo session record in the database.
   * @param {string} practiceId - The ID of the practice.
   * @param {string} patientId - The ID of the patient.
   * @param {string} photoType - The type of photos to be taken ('before' or 'after').
   * @returns {Promise<{ message: string, sessionId: string, error?: string }>}
   */
  static async startPhotoSession(practiceId: string, patientId: string, photoType: string) {
    try {
      const sessionDate = new Date().toISOString();
      const patientPhotoId = `${patientId}-${Date.now()}`;

      const { data: newSession, error } = await supabase
        .from('photo_sessions')
        .insert({
          practice_id: practiceId,
          patient_id: patientId,
          patient_photo_id: patientPhotoId,
          session_date: sessionDate,
          storage_folder_path: `${practiceId}/${patientId}/${patientPhotoId}`,
          photo_type: photoType || 'before'
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        message: 'Photo session created successfully.',
        sessionId: newSession.id
      };
    } catch (err) {
      console.error('Supabase error starting photo session:', err);
      return { error: 'Failed to start photo session.' };
    }
  }

  /**
   * Appends a new photo URL to an existing photo session record.
   * @param {string} practiceId - The ID of the practice.
   * @param {string} sessionId - The ID of the photo session.
   * @param {string} photoUrl - The URL of the uploaded photo.
   * @returns {Promise<{ message: string, photoUrls: string[], error?: string }>}
   */
  static async uploadPhoto(practiceId: string, sessionId: string, photoUrl: string) {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('photo_sessions')
        .select('file_urls, photos_count')
        .eq('id', sessionId)
        .eq('practice_id', practiceId)
        .single();

      if (sessionError || !session) throw new Error('Photo session not found.');

      const updatedUrls = [...(session.file_urls || []), photoUrl];
      const updatedCount = session.photos_count + 1;

      const { error: updateError } = await supabase
        .from('photo_sessions')
        .update({
          file_urls: updatedUrls,
          photos_count: updatedCount
        })
        .eq('id', sessionId)
        .eq('practice_id', practiceId);

      if (updateError) throw updateError;

      return { message: 'Photo uploaded successfully.', photoUrls: updatedUrls };
    } catch (err) {
      console.error('Supabase error uploading photo:', err);
      return { error: 'Failed to upload photo.' };
    }
  }
}