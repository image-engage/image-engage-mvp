import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/database';
import { ApiResponse, PatientConsent, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const consentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  procedureType: Joi.string().required(),
  notes: Joi.string().allow(''),
  signatureData: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'completed').default('pending')
});

const updateConsentSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  procedureType: Joi.string(),
  notes: Joi.string().allow(''),
  signatureData: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'completed')
});

// GET /api/consents
router.get('/', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    let query = supabase
  .from('consent_forms')
  // Selects all columns from consent_forms (*) 
  // AND the specified columns from the joined 'patients' table.
  .select(
    `
      *, 
      patients (first_name, last_name, email, phone) 
    `, 
    { count: 'exact' }
  )
  .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: consents, error, count } = await query;

    if (error) {
      throw error;
    }

    const response: ApiResponse<PatientConsent[]> = {
      success: true,
      data: consents || [],
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

// GET /api/consents/:id
router.get('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: consent, error } = await supabase
      .from('patient_consents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consent) {
      res.status(404).json({
        success: false,
        error: 'Consent form not found'
      });
      return;
    }

    const response: ApiResponse<PatientConsent> = {
      success: true,
      data: consent
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/consents
router.post('/', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { error: validationError } = consentSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const consentData = {
      ...req.body,
      createdBy: req.user!.id,
      consentDate: new Date().toISOString()
    };

    const { data: consent, error } = await supabase
      .from('patient_consents')
      .insert(consentData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<PatientConsent> = {
      success: true,
      data: consent,
      message: 'Consent form created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/consents/:id
router.put('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error: validationError } = updateConsentSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    // Check if consent exists
    const { data: existingConsent, error: fetchError } = await supabase
      .from('patient_consents')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingConsent) {
      res.status(404).json({
        success: false,
        error: 'Consent form not found'
      });
      return;
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const { data: consent, error } = await supabase
      .from('patient_consents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<PatientConsent> = {
      success: true,
      data: consent,
      message: 'Consent form updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/consents/:id
router.delete('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if consent exists
    const { data: existingConsent, error: fetchError } = await supabase
      .from('patient_consents')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingConsent) {
      res.status(404).json({
        success: false,
        error: 'Consent form not found'
      });
      return;
    }

    // Delete associated media files first
    const { error: mediaError } = await supabase
      .from('patient_media')
      .delete()
      .eq('patientConsentId', id);

    if (mediaError) {
      throw mediaError;
    }

    // Delete consent
    const { error } = await supabase
      .from('patient_consents')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Consent form deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;