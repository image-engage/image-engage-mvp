import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/database';
import { ApiResponse } from '../types';

export class DashboardController {
  static async getKpiData(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const practiceId = req.practiceId!;
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      // Get today's new consents
      const { data: todayConsents, error: consentsError } = await supabase
        .from('consent_forms')
        .select('id')
        .eq('practice_id', practiceId)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (consentsError) {
        console.error('Error fetching today\'s consents:', consentsError);
      }

      // Get sessions in progress (patients with workflow sessions not completed)
      const { data: sessionsInProgress, error: sessionsError } = await supabase
        .from('patient_workflow_sessions')
        .select('id')
        .eq('practice_id', practiceId)
        .neq('current_step', 'completed');

      if (sessionsError) {
        console.error('Error fetching sessions in progress:', sessionsError);
      }

      res.json({
        success: true,
        message2: 'KPI data retrieved successfully',
        data: {
          todayConsents: todayConsents?.length || 0,
          sessionsInProgress: sessionsInProgress?.length || 0
        }
      });
    } catch (error) {
      console.error('Dashboard KPI error:', error);
      res.status(500).json({
        success: false,
        message2: 'Failed to fetch dashboard data'
      });
    }
  }
}