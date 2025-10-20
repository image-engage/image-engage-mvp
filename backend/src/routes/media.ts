import express from 'express';
import path from 'path';
import fs from 'fs';
import Joi from 'joi';
import sharp from 'sharp';
import { supabase } from '../config/database';
import { ApiResponse, PatientMedia, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const uploadSchema = Joi.object({
  patientConsentId: Joi.string().required(),
  mediaCategory: Joi.string().valid('before', 'after', 'consents').required()
});

// GET /api/media
router.get('/', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const patientConsentId = req.query.patientConsentId as string;
    const mediaCategory = req.query.mediaCategory as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    let query = supabase
      .from('patient_media')
      .select('*', { count: 'exact' })
      .order('uploadDate', { ascending: false });

    // Apply filters
    if (patientConsentId) {
      query = query.eq('patientConsentId', patientConsentId);
    }

    if (mediaCategory) {
      query = query.eq('mediaCategory', mediaCategory);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: media, error, count } = await query;

    if (error) {
      throw error;
    }

    const response: ApiResponse<PatientMedia[]> = {
      success: true,
      data: media || [],
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

// GET /api/media/:id
router.get('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: media, error } = await supabase
      .from('patient_media')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !media) {
      res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
      return;
    }

    const response: ApiResponse<PatientMedia> = {
      success: true,
      data: media
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/media/upload
router.post('/upload', upload.array('files', 10), async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { error: validationError } = uploadSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { patientConsentId, mediaCategory } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
      return;
    }

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

    const uploadedMedia: PatientMedia[] = [];

    for (const file of files) {
      try {
        let processedFilePath = file.path;

        // Advanced image processing with Sharp
        if (file.mimetype.startsWith('image/')) {
          const optimizedPath = file.path.replace(path.extname(file.path), '_optimized' + path.extname(file.path));
          
          await sharp(file.path)
            .resize(1920, 1080, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .sharpen(1.0, 1.0, 2.0) // Dental image sharpening
            .modulate({ brightness: 1.05, saturation: 1.1 }) // Clinical enhancement
            .jpeg({ quality: 90, progressive: true })
            .toFile(optimizedPath);

          // Generate thumbnail for quick preview
          const thumbnailPath = file.path.replace(path.extname(file.path), '_thumb' + path.extname(file.path));
          await sharp(file.path)
            .resize(300, 200, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

          // Replace original with optimized version
          fs.unlinkSync(file.path);
          fs.renameSync(optimizedPath, file.path);
        }

        // Save media metadata to database
        const mediaData = {
          patientConsentId,
          fileName: file.filename,
          originalName: file.originalname,
          fileType: file.mimetype.startsWith('image/') ? 'image' : file.mimetype === 'application/pdf' ? 'pdf' : 'video',
          mediaCategory,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: req.user!.userId,
          uploadDate: new Date().toISOString()
        };

        const { data: media, error } = await supabase
          .from('patient_media')
          .insert(mediaData)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          // Clean up file if database insert fails
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          continue;
        }

        uploadedMedia.push(media);
      } catch (fileError) {
        console.error('File processing error:', fileError);
        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    if (uploadedMedia.length === 0) {
      res.status(500).json({
        success: false,
        error: 'Failed to upload any files'
      });
      return;
    }

    const response: ApiResponse<PatientMedia[]> = {
      success: true,
      data: uploadedMedia,
      message2: `Successfully uploaded ${uploadedMedia.length} file(s)`
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/media/:id
router.delete('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    // Get media file info
    const { data: media, error: fetchError } = await supabase
      .from('patient_media')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !media) {
      res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
      return;
    }

    // Delete file from filesystem
    if (fs.existsSync(media.filePath)) {
      fs.unlinkSync(media.filePath);
    }

    // Delete from database
    const { error } = await supabase
      .from('patient_media')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      message2: 'Media file deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/media/download/:id
router.get('/download/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: media, error } = await supabase
      .from('patient_media')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !media) {
      res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
      return;
    }

    if (!fs.existsSync(media.filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
      return;
    }

    res.download(media.filePath, media.originalName);
  } catch (error) {
    next(error);
  }
});

export default router;