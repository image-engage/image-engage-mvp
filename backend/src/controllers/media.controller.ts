import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/database';

export class MediaController {
  /**
   * Update media file category and notes
   */
  static async updateMedia(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { category, notes } = req.body;
      const practiceId = req.user?.practiceId;

      if (!practiceId || !id) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Use media_annotations table to store notes and category
      const { data, error } = await supabase
        .from('media_annotations')
        .upsert({
          media_id: id,
          practice_id: practiceId,
          category: category,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating media:', error);
        return res.status(500).json({ error: 'Failed to update media file' });
      }

      return res.status(200).json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Error in updateMedia controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}