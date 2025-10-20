import express from 'express';
import { supabase } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/analytics/dashboard
router.get('/dashboard', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    // Get total patients count
    const { count: totalPatients, error: patientsError } = await supabase
      .from('patient_consents')
      .select('*', { count: 'exact', head: true });

    if (patientsError) throw patientsError;

    // Get completed consents this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyConsents, error: monthlyError } = await supabase
      .from('patient_consents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('createdAt', startOfMonth.toISOString());

    if (monthlyError) throw monthlyError;

    // Get total media files
    const { count: totalMedia, error: mediaError } = await supabase
      .from('patient_media')
      .select('*', { count: 'exact', head: true });

    if (mediaError) throw mediaError;

    // Calculate engagement rate (completed vs total consents)
    const { count: completedConsents, error: completedError } = await supabase
      .from('patient_consents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (completedError) throw completedError;

const engagementRate = totalPatients !== null && totalPatients > 0 
  ? Math.round((completedConsents !== null ? completedConsents : 0) / totalPatients) * 100
  : 0;
    // Get recent activity
    const { data: recentConsents, error: recentError } = await supabase
      .from('patient_consents')
      .select('firstName, lastName, procedureType, createdAt')
      .order('createdAt', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const stats = {
      totalPatients: totalPatients || 0,
      monthlyConsents: monthlyConsents || 0,
      totalMedia: totalMedia || 0,
      engagementRate,
      recentActivity: recentConsents || []
    };

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/procedures
router.get('/procedures', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { data: procedures, error } = await supabase
      .from('patient_consents')
      .select('procedureType')
      .eq('status', 'completed');

    if (error) throw error;

    // Count procedures
    const procedureCounts: { [key: string]: number } = {};
    procedures.forEach(p => {
      procedureCounts[p.procedureType] = (procedureCounts[p.procedureType] || 0) + 1;
    });

    // Convert to array format for charts
    const chartData = Object.entries(procedureCounts).map(([name, count]) => ({
      name,
      count
    }));

    const response: ApiResponse = {
      success: true,
      data: chartData
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/monthly-trends
router.get('/monthly-trends', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { data: consents, error } = await supabase
      .from('patient_consents')
      .select('createdAt')
      .eq('status', 'completed')
      .order('createdAt', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    consents.forEach(consent => {
      const date = new Date(consent.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Convert to array format
    const chartData = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count
    }));

    const response: ApiResponse = {
      success: true,
      data: chartData
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;