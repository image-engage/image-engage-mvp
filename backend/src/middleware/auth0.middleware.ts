import { Request, Response, NextFunction } from 'express';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// Extend Request type to include Auth0 user
declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        email: string;
        [key: string]: any;
      };
    }
  }
}

// Auth0 JWT verification middleware
export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// Middleware to extract user info and sync with database
export const syncUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ success: false, message2: 'No authentication data' });
    }

    const { sub: auth0Id, email } = req.auth;
    
    // Here you would sync with your Supabase users table
    // For now, we'll attach the Auth0 user info to the request
    req.user = {
      auth0Id,
      email,
      // Add other user properties as needed
    };

    next();
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ success: false, message2: 'User synchronization failed' });
  }
};

// HIPAA compliance middleware - session timeout check
export const sessionTimeoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sessionTimeout = parseInt(process.env.AUTH0_SESSION_TIMEOUT || '28800'); // 8 hours default
  const inactivityTimeout = parseInt(process.env.AUTH0_INACTIVITY_TIMEOUT || '1800'); // 30 minutes default
  
  // Check if token is close to expiration
  if (req.auth?.exp) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = req.auth.exp - now;
    
    // If token expires in less than 5 minutes, require refresh
    if (timeUntilExpiry < 300) {
      return res.status(401).json({ 
        success: false, 
        message2: 'Session expired. Please refresh your authentication.',
        code: 'SESSION_EXPIRED'
      });
    }
  }
  
  next();
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, message2: 'Authentication required' });
    }

    const userRoles = req.auth['https://emage-smile.com/roles'] || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        success: false, 
        message2: 'Insufficient permissions',
        required_roles: roles,
        user_roles: userRoles
      });
    }

    next();
  };
};

// MFA verification middleware
export const requireMFA = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) {
    return res.status(401).json({ success: false, message2: 'Authentication required' });
  }

  const mfaEnrolled = req.auth['https://emage-smile.com/mfa_enrolled'];
  const amr = req.auth.amr || []; // Authentication Methods References

  if (!mfaEnrolled || !amr.includes('mfa')) {
    return res.status(403).json({ 
      success: false, 
      message2: 'Multi-factor authentication required',
      code: 'MFA_REQUIRED'
    });
  }

  next();
};