import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/database';
import { ApiResponse, ReviewSettings, ReviewRequest, AuthRequest, ReviewPlatform } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const reviewSettingsSchema = Joi.object({
  emailEnabled: Joi.boolean().required(),
  smsEnabled: Joi.boolean().required(),
  emailTemplate: Joi.string().required(),
  smsTemplate: Joi.string().required(),
  reviewPlatforms: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    enabled: Joi.boolean().required()
  })).required(),
  delayHours: Joi.number().integer().min(1).max(168).required()
});

const sendReviewRequestSchema = Joi.object({
  patientConsentId: Joi.string().required(),
  requestType: Joi.string().valid('email', 'sms').required(),
  reviewPlatform: Joi.string().required()
});

const updateRequestStatusSchema = Joi.object({
  status: Joi.string().valid('sent', 'clicked', 'reviewed', 'failed').required()
});

// GET /api/reviews/settings
router.get('/settings', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { data: settings, error } = await supabase
      .from('review_settings')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    const response: ApiResponse<ReviewSettings | null> = {
      success: true,
      data: settings || null
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews/settings
router.post('/settings', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { error: validationError } = reviewSettingsSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const settingsData = {
      ...req.body,
      createdBy: req.user!.id
    };

    const { data: settings, error } = await supabase
      .from('review_settings')
      .insert(settingsData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<ReviewSettings> = {
      success: true,
      data: settings,
      message: 'Review settings saved successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/reviews/settings/:id
router.put('/settings/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error: validationError } = reviewSettingsSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { data: settings, error } = await supabase
      .from('review_settings')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<ReviewSettings> = {
      success: true,
      data: settings,
      message: 'Review settings updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews/send-request
router.post('/send-request', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { error: validationError } = sendReviewRequestSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { patientConsentId, requestType, reviewPlatform } = req.body;

    // Get patient consent details
    const { data: consent, error: consentError } = await supabase
      .from('patient_consents')
      .select('*')
      .eq('id', patientConsentId)
      .single();

    if (consentError || !consent) {
      res.status(404).json({
        success: false,
        error: 'Patient consent not found'
      });
      return;
    }

    // Get review settings
    const { data: settings, error: settingsError } = await supabase
      .from('review_settings')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (settingsError || !settings) {
      res.status(404).json({
        success: false,
        error: 'Review settings not configured'
      });
      return;
    }

    // Find the review platform
    const platforms = settings.reviewPlatforms as ReviewPlatform[];
    const platform = platforms.find(p => p.name === reviewPlatform && p.enabled);

    if (!platform) {
      res.status(400).json({
        success: false,
        error: 'Review platform not found or disabled'
      });
      return;
    }

    // Generate personalized message
    const template = requestType === 'email' ? settings.emailTemplate : settings.smsTemplate;
    const messageContent = template
      .replace(/\{\{patientName\}\}/g, `${consent.firstName} ${consent.lastName}`)
      .replace(/\{\{procedureType\}\}/g, consent.procedureType)
      .replace(/\{\{reviewUrl\}\}/g, platform.url);

    // Create review request record
    const requestData = {
      patientConsentId,
      requestType,
      status: 'sent' as const,
      reviewPlatform: platform.name,
      reviewUrl: platform.url,
      messageContent,
      sentAt: new Date().toISOString()
    };

    const { data: reviewRequest, error: requestError } = await supabase
      .from('review_requests')
      .insert(requestData)
      .select()
      .single();

    if (requestError) {
      throw requestError;
    }

    // Here you would integrate with actual email/SMS service
    // For demo purposes, we'll just simulate success
    console.log(`Sending ${requestType} to ${consent.email}:`, messageContent);

    const response: ApiResponse<ReviewRequest> = {
      success: true,
      data: reviewRequest,
      message: `Review request sent via ${requestType}`
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/reviews/requests
router.get('/requests', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const patientConsentId = req.query.patientConsentId as string;

    let query = supabase
      .from('review_requests')
      .select(`
        *,
        patient_consents (
          firstName,
          lastName,
          email,
          procedureType
        )
      `, { count: 'exact' })
      .order('sentAt', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (patientConsentId) {
      query = query.eq('patientConsentId', patientConsentId);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: requests, error, count } = await query;

    if (error) {
      throw error;
    }

    const response: ApiResponse<ReviewRequest[]> = {
      success: true,
      data: requests || [],
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

// PUT /api/reviews/requests/:id/status
router.put('/requests/:id/status', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error: validationError } = updateRequestStatusSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { status } = req.body;
    const updateData: any = { status };

    // Set timestamp based on status
    if (status === 'clicked') {
      updateData.clickedAt = new Date().toISOString();
    } else if (status === 'reviewed') {
      updateData.reviewedAt = new Date().toISOString();
    }

    const { data: request, error } = await supabase
      .from('review_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<ReviewRequest> = {
      success: true,
      data: request,
      message: 'Review request status updated'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews/trigger-automated
router.post('/trigger-automated', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { patientConsentId } = req.body;

    if (!patientConsentId) {
      res.status(400).json({
        success: false,
        error: 'Patient consent ID is required'
      });
      return;
    }

    // Get patient consent
    const { data: consent, error: consentError } = await supabase
      .from('patient_consents')
      .select('*')
      .eq('id', patientConsentId)
      .eq('status', 'completed')
      .single();

    if (consentError || !consent) {
      res.status(404).json({
        success: false,
        error: 'Completed patient consent not found'
      });
      return;
    }

    // Get review settings
    const { data: settings, error: settingsError } = await supabase
      .from('review_settings')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (settingsError || !settings) {
      res.status(404).json({
        success: false,
        error: 'Review settings not configured'
      });
      return;
    }

    const platforms = settings.reviewPlatforms as ReviewPlatform[];
    const enabledPlatform = platforms.find(p => p.enabled);

    if (!enabledPlatform) {
      res.status(400).json({
        success: false,
        error: 'No review platforms enabled'
      });
      return;
    }

    const requests = [];

    // Send email if enabled
    if (settings.emailEnabled) {
      const emailContent = settings.emailTemplate
        .replace(/\{\{patientName\}\}/g, `${consent.firstName} ${consent.lastName}`)
        .replace(/\{\{procedureType\}\}/g, consent.procedureType)
        .replace(/\{\{reviewUrl\}\}/g, enabledPlatform.url);

      const { data: emailRequest, error: emailError } = await supabase
        .from('review_requests')
        .insert({
          patientConsentId,
          requestType: 'email',
          status: 'sent',
          reviewPlatform: enabledPlatform.name,
          reviewUrl: enabledPlatform.url,
          messageContent: emailContent,
          sentAt: new Date().toISOString()
        })
        .select()
        .single();

      if (!emailError) {
        requests.push(emailRequest);
      }
    }

    // Send SMS if enabled
    if (settings.smsEnabled) {
      const smsContent = settings.smsTemplate
        .replace(/\{\{patientName\}\}/g, `${consent.firstName} ${consent.lastName}`)
        .replace(/\{\{procedureType\}\}/g, consent.procedureType)
        .replace(/\{\{reviewUrl\}\}/g, enabledPlatform.url);

      const { data: smsRequest, error: smsError } = await supabase
        .from('review_requests')
        .insert({
          patientConsentId,
          requestType: 'sms',
          status: 'sent',
          reviewPlatform: enabledPlatform.name,
          reviewUrl: enabledPlatform.url,
          messageContent: smsContent,
          sentAt: new Date().toISOString()
        })
        .select()
        .single();

      if (!smsError) {
        requests.push(smsRequest);
      }
    }

    const response: ApiResponse<ReviewRequest[]> = {
      success: true,
      data: requests,
      message: `Automated review requests triggered for ${consent.firstName} ${consent.lastName}`
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;