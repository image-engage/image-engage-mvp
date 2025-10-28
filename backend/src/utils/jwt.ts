import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

export const generateToken = (practiceId: string, email: string, userId: string, expiresIn?: string): string => {
  const payload = { practiceId, email, userId };
  const options: SignOptions = {
    expiresIn: (expiresIn || JWT_EXPIRES_IN) as any,
  };

  return jwt.sign(payload, JWT_SECRET as string, options);
};

export const generateEmailToken = (type: string, email: string, userId: string, expiresIn: string = '1h'): string => {
  const payload = { type, email, userId };
  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign(payload, JWT_SECRET as string, options);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET as string) as JWTPayload;
};

export const decodeToken = (token: string): JWTPayload => {
  return jwt.decode(token) as JWTPayload;
};