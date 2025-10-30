import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { ApiResponse, JWTPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  practiceId?: string;
  practiceEmail?: string;
  user?: JWTPayload;
}

// JWKS client for Cognito token verification
const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

// Get signing key for JWT verification
const getKey = (header: any, callback: any) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

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
  
  // For development: use simple decode (faster, less secure)
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_JWT_VERIFICATION === 'true') {
    try {
      const decoded = jwt.decode(token) as any;
      
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token structure');
      }
      
      processTokenData(decoded, req);
      next();
    } catch (error) {
      console.error('Token decode error:', error);
      res.status(403).json({
        success: false,
        message2: 'Invalid token'
      });
    }
    return;
  }
  
  // Production: full JWT verification
  jwt.verify(token, getKey, {
    audience: process.env.COGNITO_CLIENT_ID,
    issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      res.status(403).json({
        success: false,
        message2: 'Invalid or expired token'
      });
      return;
    }
    
    try {
      processTokenData(decoded as any, req);
      next();
    } catch (error) {
      console.error('Token processing error:', error);
      res.status(403).json({
        success: false,
        message2: 'Token processing failed'
      });
    }
  });
};

// Helper function to process token data
const processTokenData = (decoded: any, req: AuthenticatedRequest) => {
  if (!decoded || !decoded.sub) {
    throw new Error('Invalid token structure');
  }
  
  // Map Cognito token fields to application structure
  const practiceId = decoded['custom:practice_id'];
  const role = decoded['custom:role'];
  const practiceName = decoded['custom:practice_name'];
  
  if (!practiceId || !role) {
    throw new Error('Missing required user attributes');
  }
  
  // Set request properties for backward compatibility
  req.practiceId = practiceId;
  req.practiceEmail = decoded.email;
  
  // Build user object matching JWTPayload interface
  req.user = {
    id: decoded.sub,
    userId: decoded.sub,
    sub: decoded.sub,
    email: decoded.email,
    given_name: decoded.given_name,
    family_name: decoded.family_name,
    practiceId: practiceId,
    "custom:practice_id": practiceId,
    "custom:role": role,
    "custom:practice_name": practiceName,
    iat: decoded.iat,
    exp: decoded.exp
  };
};

export { ApiResponse };
