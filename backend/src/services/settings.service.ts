import { supabase } from '../config/database';
import { Practice, UpdatePracticeDto } from '../types/settings-practice'; // Assuming types are in a central types file

/**
 * Fetches practice settings by practice ID.
 * @param practiceId - The UUID of the practice.
 * @returns The practice settings.
 */
export const getPracticeSettings = async (practiceId: string): Promise<Practice | null> => {
  const { data, error } = await supabase
    .from('practices')
    .select('*')
    .eq('id', practiceId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "No rows found"
    console.error('Error fetching practice settings:', error);
    throw new Error(error.message);
  }

  return data as Practice | null;
};

/**
 * Updates practice settings.
 * @param practiceId - The UUID of the practice to update.
 * @param updateData - The data to update.
 * @returns The updated practice settings.
 */
export const updatePracticeSettings = async (
  practiceId: string,
  updateData: UpdatePracticeDto
): Promise<Practice | null> => {
  // Filter out undefined values so we only update provided fields
  const validUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof UpdatePracticeDto] = value;
    }
    return acc;
  }, {} as { [key: string]: any });

  if (Object.keys(validUpdateData).length === 0) {
    // If no valid data to update, just fetch and return the current settings
    return getPracticeSettings(practiceId);
  }

  const { data, error } = await supabase
    .from('practices')
    .update({ ...validUpdateData, updated_at: new Date().toISOString() })
    .eq('id', practiceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating practice settings:', error);
    throw new Error(error.message);
  }

  return data as Practice | null;
};