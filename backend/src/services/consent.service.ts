import { supabase } from '../config/database';
import { ConsentForm, ApiResponse, SharedContent } from '../types';

export class ConsentService {
  static async createConsentForm(
    practiceId: string,
    consentData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      procedureType: string;
      notes?: string;
      signatureData?: string;
      sharedContent?: SharedContent[];
    }
  ): Promise<ApiResponse<ConsentForm>> {
    try {
      // Step 1: Check for an existing patient or create a new one
      let patientId: string;
      const { data: existingPatient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('practice_id', practiceId)
        .eq('email', consentData.email)
        .single();

      if (patientError && patientError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Database error checking for patient:', patientError);
        return {
          success: false,
          message2: 'Failed to check for existing patient'
        };
      }

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        // Create a new patient record since one doesn't exist
        const { data: newPatient, error: newPatientError } = await supabase
          .from('patients')
          .insert({
            practice_id: practiceId,
            first_name: consentData.firstName,
            last_name: consentData.lastName,
            email: consentData.email,
            phone: consentData.phone,
          })
          .select('id')
          .single();

        if (newPatientError) {
          console.error('Database error creating new patient:', newPatientError);
          return {
            success: false,
            message2: 'Failed to create new patient profile'
          };
        }
        patientId = newPatient!.id;
      }

      // Step 2: Create the consent form record, linking it to the patient
      const currentDate = new Date().toISOString();

      const { data: consent, error: consentError } = await supabase
        .from('consent_forms')
        .insert({
          practice_id: practiceId,
          patient_id: patientId, // Use the ID from the patient record
          procedure_type: consentData.procedureType,
          notes: consentData.notes,
          consent_date: currentDate,
          status: 'completed',
          signature_data: consentData.signatureData,
          shared_content: consentData.sharedContent || [],
        })
        .select()
        .single();

      if (consentError) {
        console.error('Database error creating consent form:', consentError);
        return {
          success: false,
          message2: 'Failed to create consent form'
        };
      }



      // Step 3: Create workflow session for the patient
      const { error: workflowError } = await supabase
        .from('patient_workflow_sessions')
        .insert({
          practice_id: practiceId,
          patient_id: patientId,
          current_step: 'before_photos'
        });

      if (workflowError) {
        console.error('Database error creating workflow session:', workflowError);
        // Continue even if workflow session creation fails
      }

      return {
        success: true,
        message2: 'Consent form and patient profile created successfully',
        data: {
          ...consent,
          practice_id: practiceId
        }
      };
    } catch (error) {
      console.error('Error creating consent form:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }
  
  static async getConsentsByPractice(
    practiceId: string,
    filters?: {
      status?: 'completed' | 'pending' | 'all';
      search?: string;
      sortBy?: 'newest' | 'oldest' | 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<{ consents: ConsentForm[]; total: number; totalPages: number }>> {
    try {
      let query = supabase
        .from('consent_forms')
        .select(`*, patients(first_name, last_name, email, phone,last_photo_session, consent_status)`, { count: 'exact' }) // JOIN with patients table
        .eq('practice_id', practiceId);

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply search filter
      if (filters?.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        query = query.or(`patients.first_name.ilike.${searchTerm},patients.last_name.ilike.${searchTerm},patients.email.ilike.${searchTerm},procedure_type.ilike.${searchTerm}`);
      }

      // Apply sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            query = query.order('consent_date', { ascending: false });
            break;
          case 'oldest':
            query = query.order('consent_date', { ascending: true });
            break;
          case 'asc':
            query = query.order('patients.last_name', { ascending: true });
            break;
          case 'desc':
            query = query.order('patients.last_name', { ascending: false });
            break;
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: consents, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to retrieve consent forms'
        };
      }

      const totalPages = Math.ceil((count || 0) / limit);

      // Format the data to include patient details directly
      const formattedConsents = consents?.map(consent => {
        // @ts-ignore
        const patientData = consent.patients;
        // @ts-ignore
        delete consent.patients;
        return {
          ...consent,
          firstName: patientData?.first_name,
          lastName: patientData?.last_name,
          email: patientData?.email,
          phone: patientData?.phone,
          lastPhotoSession: patientData?.last_photo_session,
          consentStatus: patientData?.consent_status,
        };
      });

      return {
        success: true,
        message2: 'Consent forms retrieved successfully',
        data: {
          consents: formattedConsents || [],
          total: count || 0,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error retrieving consent forms:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }
  
  static async getConsentById(
    consentId: string,
    practiceId: string
  ): Promise<ApiResponse<ConsentForm>> {
    try {
      const { data: consent, error } = await supabase
        .from('consent_forms')
        .select(`*, patients(first_name, last_name, email, phone)`) // JOIN with patients table
        .eq('id', consentId)
        .eq('practice_id', practiceId)
        .single();

      if (error || !consent) {
        return {
          success: false,
          message2: 'Consent form not found'
        };
      }
      
      // @ts-ignore
      const patientData = consent.patients;
      // @ts-ignore
      delete consent.patients;

      return {
        success: true,
        message2: 'Consent form retrieved successfully',
        data: {
          ...consent,
          firstName: patientData?.first_name,
          lastName: patientData?.last_name,
          email: patientData?.email,
          phone: patientData?.phone,
        }
      };
    } catch (error) {
      console.error('Error retrieving consent form:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async updateConsentForm(
    consentId: string,
    practiceId: string,
    updateData: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      procedureType: string;
      notes: string;
      status: 'completed' | 'pending';
      sharedContent: SharedContent[];
    }>
  ): Promise<ApiResponse<ConsentForm>> {
    try {
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };

      // Handle patient profile updates separately
      const patientUpdateFields: any = {};
      if (updateData.firstName) patientUpdateFields.first_name = updateData.firstName;
      if (updateData.lastName) patientUpdateFields.last_name = updateData.lastName;
      if (updateData.email) patientUpdateFields.email = updateData.email;
      if (updateData.phone) patientUpdateFields.phone = updateData.phone;

      // Update consent form fields
      if (updateData.procedureType) updateFields.procedure_type = updateData.procedureType;
      if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
      if (updateData.status) updateFields.status = updateData.status;
      if (updateData.sharedContent) updateFields.shared_content = updateData.sharedContent;

      const { data: consent, error } = await supabase
        .from('consent_forms')
        .update(updateFields)
        .eq('id', consentId)
        .eq('practice_id', practiceId)
        .select(`*, patients(first_name, last_name, email, phone)`)
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          message2: 'Failed to update consent form'
        };
      }
      
      // Update patient profile if demographic data was provided
      if (Object.keys(patientUpdateFields).length > 0) {
        // @ts-ignore
        const { error: patientUpdateError } = await supabase
          .from('patients')
          .update(patientUpdateFields)
          // @ts-ignore
          .eq('id', consent.patient_id)
          .eq('practice_id', practiceId);

        if (patientUpdateError) {
           console.error('Database error updating patient profile:', patientUpdateError);
           // You may choose to return an error or log it and continue
        }
      }

      // Format the data to include patient details directly
      // @ts-ignore
      const patientData = consent.patients;
      // @ts-ignore
      delete consent.patients;

      return {
        success: true,
        message2: 'Consent form and patient profile updated successfully',
        data: {
          ...consent,
          firstName: patientData?.first_name,
          lastName: patientData?.last_name,
          email: patientData?.email,
          phone: patientData?.phone,
        }
      };
    } catch (error) {
      console.error('Error updating consent form:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async deleteConsentForm(
    consentId: string,
    practiceId: string
  ): Promise<ApiResponse> {
    try {
      // Find the patient_id associated with this consent form
      const { data: consent, error: findError } = await supabase
        .from('consent_forms')
        .select('patient_id')
        .eq('id', consentId)
        .single();

      if (findError) {
        console.error('Database error:', findError);
        return { success: false, message2: 'Consent form not found' };
      }

      // Delete the consent form
      const { error: deleteError } = await supabase
        .from('consent_forms')
        .delete()
        .eq('id', consentId)
        .eq('practice_id', practiceId);

      if (deleteError) {
        console.error('Database error:', deleteError);
        return {
          success: false,
          message2: 'Failed to delete consent form'
        };
      }
      
      // OPTIONAL: Check if the patient has other consent forms. If not, you might want to delete the patient record.
      // const { count } = await supabase
      //   .from('consent_forms')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('patient_id', consent.patient_id);
      
      // if (count === 0) {
      //   await supabase
      //     .from('patients')
      //     .delete()
      //     .eq('id', consent.patient_id);
      // }

      return {
        success: true,
        message2: 'Consent form deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting consent form:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async addSharedContent(
    consentId: string,
    practiceId: string,
    contentId: string,
    contentTitle: string,
    contentType: 'article' | 'pdf' | 'video' | 'image'
  ): Promise<ApiResponse> {
    try {
      // First get the current consent form
      const { data: consent, error: fetchError } = await supabase
        .from('consent_forms')
        .select('shared_content')
        .eq('id', consentId)
        .eq('practice_id', practiceId)
        .single();

      if (fetchError || !consent) {
        return {
          success: false,
          message2: 'Consent form not found'
        };
      }

      const currentSharedContent = consent.shared_content || [];
      
      // Check if content is already shared
      if (currentSharedContent.some((item: SharedContent) => item.id === contentId)) {
        return {
          success: false,
          message2: 'Content already shared with this patient'
        };
      }

      // Add new shared content
      const newSharedContent: SharedContent = {
        id: contentId,
        title: contentTitle,
        content_type: contentType,
        shared_at: new Date().toISOString()
      };

      const updatedSharedContent = [...currentSharedContent, newSharedContent];

      const { error: updateError } = await supabase
        .from('consent_forms')
        .update({
          shared_content: updatedSharedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', consentId)
        .eq('practice_id', practiceId);

      if (updateError) {
        console.error('Database error:', updateError);
        return {
          success: false,
          message2: 'Failed to add shared content'
        };
      }

      return {
        success: true,
        message2: 'Content shared successfully'
      };
    } catch (error) {
      console.error('Error adding shared content:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async sendReviewRequest(
    consentId: string,
    practiceId: string,
    method: 'email' | 'sms'
  ): Promise<ApiResponse> {
    try {
      // Get consent form details
      const { data: consent, error } = await supabase
        .from('consent_forms')
        .select(`*, patients(first_name, last_name, email, phone)`)
        .eq('id', consentId)
        .eq('practice_id', practiceId)
        .single();

      if (error || !consent) {
        return {
          success: false,
          message2: 'Consent form not found'
        };
      }

      // In a real implementation, you would integrate with email/SMS services
      // For now, we'll simulate the request
      // @ts-ignore
      console.log(`Sending ${method} review request to:`, {
        // @ts-ignore
        name: `${consent.patients.first_name} ${consent.patients.last_name}`,
        // @ts-ignore
        contact: method === 'email' ? consent.patients.email : consent.patients.phone
      });

      return {
        success: true,
        message2: `Review request sent via ${method} successfully`
      };
    } catch (error) {
      console.error('Error sending review request:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }

  static async getConsentPdfUrl(
    consentId: string,
    practiceId: string
  ): Promise<ApiResponse<{ url: string }>> {
    try {
      // Get consent form and patient details
      const { data: consent, error } = await supabase
        .from('consent_forms')
        .select(`*, patients(first_name, last_name, id)`)
        .eq('id', consentId)
        .eq('practice_id', practiceId)
        .single();

      if (error || !consent) {
        return {
          success: false,
          message2: 'Consent form not found'
        };
      }

      // @ts-ignore
      const patientData = consent.patients;
      
      // For now, generate a simple data URL with consent information
      // In a real implementation, you would generate a proper PDF
      const consentInfo = {
        patientName: `${patientData.first_name} ${patientData.last_name}`,
        // @ts-ignore
        procedureType: consent.procedure_type,
        // @ts-ignore
        consentDate: consent.consent_date,
        // @ts-ignore
        signatureData: consent.signature_data,
        // @ts-ignore
        notes: consent.notes
      };
      
      // Create a simple HTML content for the PDF
      const htmlContent = `
        <html>
          <head><title>Consent Form</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Dental Consent Form</h1>
            <p><strong>Patient:</strong> ${consentInfo.patientName}</p>
            <p><strong>Procedure:</strong> ${consentInfo.procedureType}</p>
            <p><strong>Date:</strong> ${new Date(consentInfo.consentDate).toLocaleDateString()}</p>
            <p><strong>Notes:</strong> ${consentInfo.notes || 'None'}</p>
            ${consentInfo.signatureData ? `<p><strong>Signature:</strong><br><img src="${consentInfo.signatureData}" style="max-width: 200px;"></p>` : ''}
          </body>
        </html>
      `;
      
      // Convert to data URL
      const dataUrl = `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`;

      return {
        success: true,
        message2: 'Consent form URL generated successfully',
        data: {
          url: dataUrl
        }
      };
    } catch (error) {
      console.error('Error getting consent PDF URL:', error);
      return {
        success: false,
        message2: 'Internal server error'
      };
    }
  }
}