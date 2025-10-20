import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface ShareableLink {
  id: string;
  patientConsentId: string;
  token: string;
  expiresAt: string;
  selectedMedia: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
const createShareLinkSchema = Joi.object({
  patientConsentId: Joi.string().required(),
  selectedMedia: Joi.array().items(Joi.string()).min(1).required(),
  expiryHours: Joi.number().integer().min(1).max(168).default(72)
});

const updateShareLinkSchema = Joi.object({
  isActive: Joi.boolean()
});

// Apply authentication to protected routes
router.use('/create', authenticateToken);
router.use('/manage', authenticateToken);

// POST /api/sharing/create
router.post('/create', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { error: validationError } = createShareLinkSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { patientConsentId, selectedMedia, expiryHours } = req.body;

    // Verify patient consent exists
    const { data: consent, error: consentError } = await supabase
      .from('patient_consents')
      .select('id')
      .eq('id', patientConsentId)
      .single();

    if (consentError || !consent) {
      res.status(404).json({
        success: false,
        error: 'Patient consent not found'
      });
      return;
    }

    // Verify all selected media exists and belongs to the patient
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('patient_media')
      .select('id')
      .eq('patientConsentId', patientConsentId)
      .in('id', selectedMedia);

    if (mediaError || !mediaFiles || mediaFiles.length !== selectedMedia.length) {
      res.status(400).json({
        success: false,
        error: 'Some selected media files are invalid or do not belong to this patient'
      });
      return;
    }

    // Generate unique token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    // Create shareable link
    const linkData = {
      patientConsentId,
      token,
      expiresAt: expiresAt.toISOString(),
      selectedMedia,
      isActive: true,
      createdBy: req.user!.id
    };

    const { data: shareLink, error } = await supabase
      .from('shareable_links')
      .insert(linkData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<ShareableLink> = {
      success: true,
      data: shareLink,
      message: 'Shareable link created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/sharing/manage/:patientConsentId
router.get('/manage/:patientConsentId', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { patientConsentId } = req.params;

    const { data: shareLinks, error } = await supabase
      .from('shareable_links')
      .select('*')
      .eq('patientConsentId', patientConsentId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw error;
    }

    const response: ApiResponse<ShareableLink[]> = {
      success: true,
      data: shareLinks || []
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/sharing/manage/:id
router.put('/manage/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error: validationError } = updateShareLinkSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { data: shareLink, error } = await supabase
      .from('shareable_links')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<ShareableLink> = {
      success: true,
      data: shareLink,
      message: 'Shareable link updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/sharing/public/:token (Public endpoint - no auth required)
router.get('/public/:token', async (req, res, next): Promise<void> => {
  try {
    const { token } = req.params;

    // Get shareable link
    const { data: shareLink, error: linkError } = await supabase
      .from('shareable_links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkError || !shareLink) {
      res.status(404).json({
        success: false,
        error: 'Share link not found'
      });
      return;
    }

    // Check if link is active and not expired
    if (!shareLink.isActive) {
      res.status(403).json({
        success: false,
        error: 'This share link has been deactivated'
      });
      return;
    }

    if (new Date(shareLink.expiresAt) < new Date()) {
      res.status(403).json({
        success: false,
        error: 'This share link has expired'
      });
      return;
    }

    // Get patient consent data
    const { data: consent, error: consentError } = await supabase
      .from('patient_consents')
      .select('id, firstName, lastName, procedureType, consentDate')
      .eq('id', shareLink.patientConsentId)
      .single();

    if (consentError || !consent) {
      res.status(404).json({
        success: false,
        error: 'Patient data not found'
      });
      return;
    }

    // Get selected media files
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('patient_media')
      .select('id, fileName, fileType, mediaCategory, fileSize, uploadDate, filePath')
      .in('id', shareLink.selectedMedia);

    if (mediaError) {
      throw mediaError;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        shareLink,
        patient: consent,
        media: mediaFiles || []
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/sharing/media/:token/:mediaId (Public endpoint for serving media files)
router.get('/media/:token/:mediaId', async (req, res, next): Promise<void> => {
  try {
    const { token, mediaId } = req.params;

    // Verify token and get shareable link
    const { data: shareLink, error: linkError } = await supabase
      .from('shareable_links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkError || !shareLink || !shareLink.isActive || new Date(shareLink.expiresAt) < new Date()) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    // Check if media is in the selected media list
    if (!shareLink.selectedMedia.includes(mediaId)) {
      res.status(403).json({
        success: false,
        error: 'Media file not included in this share'
      });
      return;
    }

    // Get media file info
    const { data: media, error: mediaError } = await supabase
      .from('patient_media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
      return;
    }

    // In a real implementation, you would serve the file from your storage
    // For now, we'll return the file path
    res.json({
      success: true,
      data: {
        fileName: media.fileName,
        fileType: media.fileType,
        filePath: media.filePath,
        downloadUrl: `/uploads/${media.fileName}`
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;