import { supabase } from '../config/database';

export class ComparisonService {
  /**
   * Generate before/after comparison (simplified version)
   */
  static async generateComparison(practiceId: string, patientId: string, beforeImageId: string, afterImageId: string) {
    try {
      console.log('Starting comparison generation:', { practiceId, patientId, beforeImageId, afterImageId });
      
      // Get patient info
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patientId)
        .single();

      if (patientError || !patient) {
        console.error('Patient not found:', patientError);
        return { error: 'Patient not found' };
      }

      // Get practice info
      const { data: practice } = await supabase
        .from('practices')
        .select('name')
        .eq('id', practiceId)
        .single();

      // Get actual image URLs from photo sessions
      const { data: sessions } = await supabase
        .from('photo_sessions')
        .select('file_urls, photo_type')
        .eq('patient_id', patientId)
        .eq('practice_id', practiceId);

      let beforeImageUrl = 'https://via.placeholder.com/300x200/ffebee/c62828?text=BEFORE';
      let afterImageUrl = 'https://via.placeholder.com/300x200/e8f5e8/2e7d32?text=AFTER';

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          if (session.file_urls && session.file_urls.length > 0) {
            const photoTypes = session.photo_type ? session.photo_type.split(',') : [];
            session.file_urls.forEach((url: string, index: number) => {
              const type = photoTypes[index];
              if (type === 'before' && beforeImageUrl.includes('placeholder')) {
                beforeImageUrl = url;
              } else if (type === 'after' && afterImageUrl.includes('placeholder')) {
                afterImageUrl = url;
              }
            });
          }
        }
      }

      // Create HTML content with actual images
      const htmlContent = `<!DOCTYPE html><html><head><title>Before & After Comparison</title><style>body{font-family:Arial,sans-serif;margin:40px}.header{text-align:center;margin-bottom:30px}.comparison{display:flex;gap:20px;justify-content:center;align-items:flex-start}.image-container{text-align:center;max-width:400px}.comparison-image{width:100%;max-width:350px;height:auto;border:2px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}</style></head><body><div class="header"><h1>${practice?.name || 'Practice'}</h1><h2>Before & After Comparison</h2><p><strong>Patient:</strong> ${patient.first_name} ${patient.last_name}</p><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p></div><div class="comparison"><div class="image-container"><img src="${beforeImageUrl}" alt="Before" class="comparison-image"><h3>Before Treatment</h3></div><div class="image-container"><img src="${afterImageUrl}" alt="After" class="comparison-image"><h3>After Treatment</h3></div></div></body></html>`;

      return {
        htmlContent,
        filename: `${patient.first_name}_${patient.last_name}_comparison_${Date.now()}.html`
      };
    } catch (error) {
      console.error('Error generating comparison:', error);
      return { error: `Failed to generate comparison: ${error.message}` };
    }
  }
}

