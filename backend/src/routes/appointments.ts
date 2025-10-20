import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface AppointmentSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  appointmentType: string;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  source: 'chatbot' | 'phone' | 'online' | 'walk-in';
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
const bookAppointmentSchema = Joi.object({
  patientName: Joi.string().required(),
  patientEmail: Joi.string().email().required(),
  patientPhone: Joi.string().required(),
  appointmentDate: Joi.string().isoDate().required(),
  appointmentTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
  appointmentType: Joi.string().valid('consultation', 'cleaning', 'checkup', 'emergency', 'procedure').default('consultation'),
  notes: Joi.string().allow('').default(''),
  source: Joi.string().valid('chatbot', 'phone', 'online', 'walk-in').default('chatbot')
});

const updateAppointmentSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
  notes: Joi.string().allow(''),
  appointmentDate: Joi.string().isoDate(),
  appointmentTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  appointmentType: Joi.string().valid('consultation', 'cleaning', 'checkup', 'emergency', 'procedure')
});

// GET /api/appointments/slots/available (Public endpoint)
router.get('/slots/available', async (req, res, next): Promise<void> => {
  try {
    const startDate = req.query.startDate as string || new Date().toISOString().split('T')[0];
    const endDate = req.query.endDate as string;
    const appointmentType = req.query.appointmentType as string;

    let query = supabase
      .from('appointment_slots')
      .select('*')
      .eq('isAvailable', true)
      .gte('date', startDate)
      .order('date', { ascending: true })
      .order('startTime', { ascending: true });

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (appointmentType) {
      query = query.eq('appointmentType', appointmentType);
    }

    const { data: slots, error } = await query;

    if (error) {
      throw error;
    }

    // Group slots by date for easier frontend consumption
    const groupedSlots: { [date: string]: AppointmentSlot[] } = {};
    (slots || []).forEach(slot => {
      if (!groupedSlots[slot.date]) {
        groupedSlots[slot.date] = [];
      }
      groupedSlots[slot.date].push(slot);
    });

    const response: ApiResponse = {
      success: true,
      data: {
        slots: groupedSlots,
        totalSlots: slots?.length || 0
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/appointments/book (Public endpoint)
router.post('/book', async (req, res, next): Promise<void> => {
  try {
    const { error: validationError } = bookAppointmentSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const appointmentData = req.body;

    // Check if the requested slot is available
    const { data: slot, error: slotError } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('date', appointmentData.appointmentDate)
      .eq('startTime', appointmentData.appointmentTime)
      .eq('isAvailable', true)
      .single();

    if (slotError || !slot) {
      res.status(400).json({
        success: false,
        error: 'The requested appointment slot is not available'
      });
      return;
    }

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) {
      throw appointmentError;
    }

    // Mark the slot as unavailable
    const { error: updateError } = await supabase
      .from('appointment_slots')
      .update({ isAvailable: false })
      .eq('id', slot.id);

    if (updateError) {
      // If we can't mark the slot as unavailable, delete the appointment
      await supabase.from('appointments').delete().eq('id', appointment.id);
      throw updateError;
    }

    const response: ApiResponse<Appointment> = {
      success: true,
      data: appointment,
      message: 'Appointment booked successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Protected routes (require authentication)
router.use(authenticateToken);

// GET /api/appointments
router.get('/', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const source = req.query.source as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let query = supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .order('appointmentDate', { ascending: true })
      .order('appointmentTime', { ascending: true });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source', source);
    }

    if (startDate) {
      query = query.gte('appointmentDate', startDate);
    }

    if (endDate) {
      query = query.lte('appointmentDate', endDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: appointments, error, count } = await query;

    if (error) {
      throw error;
    }

    const response: ApiResponse<Appointment[]> = {
      success: true,
      data: appointments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    const response: ApiResponse<Appointment> = {
      success: true,
      data: appointment
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error: validationError } = updateAppointmentSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    // Get current appointment
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentAppointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    // If changing date/time, check availability
    if (req.body.appointmentDate || req.body.appointmentTime) {
      const newDate = req.body.appointmentDate || currentAppointment.appointmentDate;
      const newTime = req.body.appointmentTime || currentAppointment.appointmentTime;

      // Check if new slot is available (unless it's the same slot)
      if (newDate !== currentAppointment.appointmentDate || newTime !== currentAppointment.appointmentTime) {
        const { data: slot, error: slotError } = await supabase
          .from('appointment_slots')
          .select('*')
          .eq('date', newDate)
          .eq('startTime', newTime)
          .eq('isAvailable', true)
          .single();

        if (slotError || !slot) {
          res.status(400).json({
            success: false,
            error: 'The requested appointment slot is not available'
          });
          return;
        }

        // Mark new slot as unavailable
        await supabase
          .from('appointment_slots')
          .update({ isAvailable: false })
          .eq('id', slot.id);

        // Mark old slot as available
        await supabase
          .from('appointment_slots')
          .update({ isAvailable: true })
          .eq('date', currentAppointment.appointmentDate)
          .eq('startTime', currentAppointment.appointmentTime);
      }
    }

    // If cancelling appointment, make slot available again
    if (req.body.status === 'cancelled' && currentAppointment.status !== 'cancelled') {
      await supabase
        .from('appointment_slots')
        .update({ isAvailable: true })
        .eq('date', currentAppointment.appointmentDate)
        .eq('startTime', currentAppointment.appointmentTime);
    }

    // Update appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<Appointment> = {
      success: true,
      data: appointment,
      message: 'Appointment updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    // Get appointment details before deletion
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    // Delete appointment
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Make the slot available again
    await supabase
      .from('appointment_slots')
      .update({ isAvailable: true })
      .eq('date', appointment.appointmentDate)
      .eq('startTime', appointment.appointmentTime);

    const response: ApiResponse = {
      success: true,
      message: 'Appointment deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/analytics/dashboard
router.get('/analytics/dashboard', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    // Get appointment statistics
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('status, source, appointmentDate');

    if (error) {
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisWeekStr = thisWeek.toISOString().split('T')[0];

    const stats = {
      total: appointments?.length || 0,
      pending: appointments?.filter(a => a.status === 'pending').length || 0,
      confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
      completed: appointments?.filter(a => a.status === 'completed').length || 0,
      cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
      todayAppointments: appointments?.filter(a => a.appointmentDate === today).length || 0,
      thisWeekAppointments: appointments?.filter(a => a.appointmentDate >= thisWeekStr).length || 0,
      chatbotBookings: appointments?.filter(a => a.source === 'chatbot').length || 0
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

export default router;