import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { supabase } from '../config/database';
import { ApiResponse, User, AuthRequest, JWTPayload } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const Schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('admin', 'staff').default('staff')
});

// POST /api/auth/
router.post('/', async (req, res, next): Promise<void> => {
  try {
    const { error: validationError } = Schema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { email, password } = req.body;

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

const token = jwt.sign(
  { 
    userId: user.id, 
    email: user.email, 
    exp: Math.floor(Date.now() / 1000) + (parseInt(process.env.JWT_EXPIRES_IN || '7', 10) || 7) * 24 * 60 * 60 
  },
  jwtSecret
);
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message2: ' successful'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next): Promise<void> => {
  try {
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
      return;
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      })
      .select('id, email, firstName, lastName, role, createdAt, updatedAt')
      .single();

    if (error) {
      throw error;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

   const token = jwt.sign(
  { 
    userId: newUser.id, 
    email: newUser.email, 
    exp: Math.floor(Date.now() / 1000) + (parseInt(process.env.JWT_EXPIRES_IN || '7', 10) || 7) * 24 * 60 * 60 
  },
  jwtSecret
); 

  const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: {
          ...newUser,
          first_name: newUser.firstName, // Map firstName to first_name
          last_name: newUser.lastName,   // Map lastName to last_name
          password_hash: '', // Password hash should not be sent to the frontend
          practice_id: '', // This should be set based on your application's logic
          created_at: newUser.createdAt,
          updated_at: newUser.updatedAt
        },
        token
      },
      message2: 'Registration successful'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res, next): Promise<void> => {
  try {
    const response: ApiResponse<JWTPayload> = {
      success: true,
      data: req.user!,
      message2: 'User profile retrieved'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just return a success response
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;