import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiResponse } from '../types';

export interface AuthenticatedRequest extends Request {
  practiceId?: string;
  practiceEmail?: string;
  user?: {
    id: string;
    userId: string;
    email: string;
    practiceId: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message2: 'Access token required'
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    console.log('Decoded JWT:', decoded);
    
    req.practiceId = decoded.practiceId;
    req.practiceEmail = decoded.email;
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      practiceId: decoded.practiceId
    };
    console.log('Set req.user:', req.user);
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message2: 'Invalid or expired token'
    });
  }
};

export { ApiResponse };
