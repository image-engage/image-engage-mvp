import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PracticeService } from '../services/practice.service';

export interface EmailTokenPayload {
  type: string;
  email: string;
  userId: string;
  iat?: number;
  exp?: number;
}

export const verifyEmailToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message2: 'Verification token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as EmailTokenPayload;

    if (decoded.type !== 'verification') {
      return res.status(400).json({
        success: false,
        message2: 'Invalid token type'
      });
    }

    req.body.userId = decoded.userId;
    req.body.email = decoded.email;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message2: 'Invalid or expired verification token'
    });
  }
};

export const verifyPasswordResetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message2: 'Reset token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as EmailTokenPayload;

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message2: 'Invalid token type'
      });
    }

    req.body.userId = decoded.userId;
    req.body.email = decoded.email;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message2: 'Invalid or expired reset token'
    });
  }
};