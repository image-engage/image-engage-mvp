import express from 'express';
import path from 'path';
import fs from 'fs';
import Joi from 'joi';
import { supabase } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

interface ContentItem {
  id: string;
  title: string;
  description: string;
  contentType: 'article' | 'pdf' | 'video' | 'image';
  category: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const contentSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true)
});

const updateContentSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  isActive: Joi.boolean()
});

// GET /api/content
router.get('/', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const contentType = req.query.contentType as string;
    const isActive = req.query.isActive as string;

    let query = supabase
      .from('content_library')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (contentType) {
      query = query.eq('contentType', contentType);
    }

    if (isActive !== undefined) {
      query = query.eq('isActive', isActive === 'true');
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: content, error, count } = await query;

    if (error) {
      throw error;
    }

    const response: ApiResponse<ContentItem[]> = {
      success: true,
      data: content || [],
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

// GET /api/content/:id
router.get('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: content, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !content) {
      res.status(404).json({
        success: false,
        error: 'Content not found'
      });
      return;
    }

    const response: ApiResponse<ContentItem> = {
      success: true,
      data: content
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/content/upload
router.post('/upload', upload.single('file'), async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { error: validationError } = contentSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const { title, description, category, tags, isActive } = req.body;

    // Determine content type based on MIME type
    let contentType: 'article' | 'pdf' | 'video' | 'image' = 'article';
    if (file.mimetype.includes('pdf')) contentType = 'pdf';
    else if (file.mimetype.includes('video')) contentType = 'video';
    else if (file.mimetype.includes('image')) contentType = 'image';

    // Save content metadata to database
    const contentData = {
      title,
      description,
      contentType,
      category,
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      filePath: file.path,
      mimeType: file.mimetype,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user!.id
    };

    const { data: content, error } = await supabase
      .from('content_library')
      .insert(contentData)
      .select()
      .single();

    if (error) {
      // Clean up file if database insert fails
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }

    const response: ApiResponse<ContentItem> = {
      success: true,
      data: content,
      message: 'Content uploaded successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/content/:id
router.put('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error: validationError } = updateContentSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    // Check if content exists
    const { data: existingContent, error: fetchError } = await supabase
      .from('content_library')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingContent) {
      res.status(404).json({
        success: false,
        error: 'Content not found'
      });
      return;
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const { data: content, error } = await supabase
      .from('content_library')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response: ApiResponse<ContentItem> = {
      success: true,
      data: content,
      message: 'Content updated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/content/:id
router.delete('/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    // Get content info
    const { data: content, error: fetchError } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !content) {
      res.status(404).json({
        success: false,
        error: 'Content not found'
      });
      return;
    }

    // Delete file from filesystem
    if (fs.existsSync(content.filePath)) {
      fs.unlinkSync(content.filePath);
    }

    // Delete from database
    const { error } = await supabase
      .from('content_library')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Content deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/content/download/:id
router.get('/download/:id', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: content, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !content) {
      res.status(404).json({
        success: false,
        error: 'Content not found'
      });
      return;
    }

    if (!fs.existsSync(content.filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
      return;
    }

    res.download(content.filePath, content.originalName);
  } catch (error) {
    next(error);
  }
});

// GET /api/content/categories
router.get('/meta/categories', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { data: categories, error } = await supabase
      .from('content_library')
      .select('category')
      .eq('isActive', true);

    if (error) {
      throw error;
    }

    // Get unique categories
    const uniqueCategories = [...new Set(categories.map(c => c.category))];

    const response: ApiResponse<string[]> = {
      success: true,
      data: uniqueCategories
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/content/tags
router.get('/meta/tags', async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const { data: content, error } = await supabase
      .from('content_library')
      .select('tags')
      .eq('isActive', true);

    if (error) {
      throw error;
    }

    // Flatten and get unique tags
    const allTags = content.flatMap(c => c.tags || []);
    const uniqueTags = [...new Set(allTags)];

    const response: ApiResponse<string[]> = {
      success: true,
      data: uniqueTags
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;