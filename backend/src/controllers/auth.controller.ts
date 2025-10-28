// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { PracticeService } from '../services/practice.service'; // Ensure this path is correct
import { EmailService } from '../services/email.service';
//import { GoogleDriveService } from '../services/google-drive.service'; // Assuming this is correct
import { generateToken } from '../utils/jwt'; // Ensure this path is correct
import { ApiResponse } from '../types'; // Adjust types as needed
import { JWTPayload } from '../types'; // Import JWTPayload if not already in types.ts

// Extend Request type to include user property from authentication middleware
// This is a common pattern when you have middleware that decodes JWT and attaches user info.
declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload; // Assuming your JWT middleware attaches this
  }
}

export class AuthController {
  /**
   * Handles registration of a new practice and its initial admin user.
   */
  static async register(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // Extract all necessary fields for practice and user creation from the request body
      const { practiceName, firstName, lastName, email, password, role } = req.body;
      
      // Basic validation for required fields
      if (!practiceName || !firstName || !lastName || !email || !password) {
        res.status(400).json({ success: false, message2: 'All practice and admin user fields are required.' });
        return;
      }

      // Call the service to create both the practice and the admin user
      const result = await PracticeService.createPracticeAndAdminUser(
        practiceName,
        firstName,
        lastName,
        email,
        password,
        role // This will typically be 'admin' for initial signup
      );
      
      if (!result.success) {
        res.status(400).json(result); // Pass along the error message from the service
        return;
      }

      // Generate JWT token for the newly created user (admin)
      // The token payload should contain the user's ID, email, and their practice ID
      const token = generateToken(result.data!.practice.id, result.data!.user.email, result.data!.user.id);

      // Determine if Google Auth setup is needed (e.g., for the new practice admin)
      // This is a simplified check; real logic might be more complex based on subscription, etc.
      const requiresGoogleAuth = result.data!.user.role === 'admin' && !result.data!.practice.google_drive_folder_id;

      // Send verification email
      const emailSent = await EmailService.sendVerificationEmail(result.data!.user.email, result.data!.user.id);
      
      res.status(201).json({
        success: true,
        message2: 'Practice and admin account created successfully. Please check your email to verify your account.',
        data: {
          user: result.data!.user, // Return the user data (without password hash)
          practice: result.data!.practice, // Return the practice data
          token,
          requiresGoogleAuth: requiresGoogleAuth,
          emailSent
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during registration'
      });
    }
  }

  /**
   * Handles user login.
   */
  static async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message2: 'Email and password are required'
        });
        return;
      }

      // Authenticate against the 'users' table
      const result = await PracticeService.authenticateUser(email, password);

      if (!result.success) {
        res.status(401).json(result); // Pass along the error message from the service
        return;
      }

      // Generate JWT token for the authenticated user
      // The token payload should contain the user's ID, email, and their practice ID
      const token = generateToken(result.data!.practice_data.id, result.data!.email, result.data!.id);

      res.json({
        success: true,
        message2: 'Login successful',
        data: {
          user: result.data, // Return user data (without password hash, includes practice_data)
          practice: result.data!.practice_data, // Explicitly return practice data for clarity
          token,
          // Check Google Drive access status from the joined practice data
          hasGoogleDriveAccess: !!result.data!.practice_data?.google_drive_folder_id
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during login'
      });
    }
  }

  /**
   * Initiates Google Drive authentication flow.
   * This now requires the practice_id to be passed, typically from the authenticated user's session.
   */
  // static async initiateGoogleAuth(req: Request, res: Response): Promise<void> {
  //   try {
  //     // In a real application, you would get the practiceId from the authenticated user's JWT token
  //     // which would be decoded by an authentication middleware and attached to req.user.
  //     // For demonstration, we'll temporarily allow it via query parameter for testing.
  //     // You should replace this with a secure method in production.
  //     const practiceId = req.query.practiceId as string || req.user?.practiceId; 

  //     if (!practiceId) {
  //       res.status(400).json({ success: false, message: 'Practice ID is required to initiate Google Auth. Please log in first.' });
  //       return;
  //     }

  //     // Pass the practiceId as the 'state' parameter to Google OAuth
  //     const authUrl = GoogleDriveService.getAuthUrl(practiceId); 
  //     res.redirect(authUrl);
  //   } catch (error) {
  //     console.error('Google auth initiation error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Failed to initiate Google authentication'
  //     });
  //   }
  // }

  /**
   * Handles the Google OAuth callback.
   * Retrieves tokens and updates the practice's refresh token using the 'state' parameter.
   */
  static async handleGoogleCallback(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { code, state } = req.query; // 'state' should contain practiceId

      if (!code) {
        res.status(400).json({
          success: false,
          message2: 'Authorization code is required'
        });
        return;
      }
      if (!state) {
        res.status(400).json({
          success: false,
          message2: 'State parameter (practice ID) is missing from Google callback'
        });
        return;
      }

      const practiceId = state as string; // Extract practiceId from the state parameter

      // // Get tokens from Google
      // const tokens = await GoogleDriveService.getTokenFromCode(code as string);
      
      // if (!tokens.refresh_token) {
      //   res.status(400).json({
      //     success: false,
      //     message2: 'Failed to obtain refresh token'
      //   });
      //   return;
      // }

      // Update the practice's Google Drive info with the new refresh token
      // For folderId, you might need a separate step or derive it.
      // For now, we'll pass an empty string if not immediately available,
      // assuming the updateGoogleDriveInfo service can handle it.
      // const updateResult = await PracticeService.updateGoogleDriveInfo(
      //   practiceId,
      //   '', // Placeholder for folderId if not immediately available
      //   tokens.refresh_token
      // );

      // if (!updateResult.success) {
      //   res.status(500).json(updateResult); // Propagate service error
      //   return;
      // }

      // Redirect to a frontend page to confirm setup or continue onboarding.
      // It's good practice to pass status/data via query parameters for client-side handling.
      // Ensure FRONTEND_URL is set in your backend's environment variables.
      res.redirect(`${process.env.FRONTEND_URL}/onboarding-success?practiceId=${practiceId}&status=google_auth_complete`);

    } catch (error) {
      console.error('Google callback error:', error);
      res.status(500).json({
        success: false,
        message2: 'Failed to process Google authentication'
      });
    }
  }

  /**
   * Verifies user email address
   */
  static async verifyEmail(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { userId } = req.body; // Set by email middleware

      const result = await PracticeService.verifyUserEmail(userId);
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json({
        success: true,
        message2: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during email verification'
      });
    }
  }

  /**
   * Sends password reset email
   */
  static async forgotPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message2: 'Email is required'
        });
        return;
      }

      const user = await PracticeService.getUserByEmail(email);
      
      if (!user.success || !user.data) {
        // Don't reveal if email exists or not for security
        res.json({
          success: true,
          message2: 'If an account with that email exists, a password reset link has been sent.'
        });
        return;
      }

      const emailSent = await EmailService.sendPasswordResetEmail(email, user.data.id);
      
      res.json({
        success: true,
        message2: 'If an account with that email exists, a password reset link has been sent.',
        data: { emailSent }
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }

  /**
   * Resets user password
   */
  static async resetPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { userId, newPassword } = req.body; // userId set by email middleware

      if (!newPassword) {
        res.status(400).json({
          success: false,
          message2: 'New password is required'
        });
        return;
      }

      const result = await PracticeService.updateUserPassword(userId, newPassword);
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json({
        success: true,
        message2: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during password reset'
      });
    }
  }

  /**
   * Resends email verification
   */
  static async resendVerification(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message2: 'Email is required'
        });
        return;
      }

      const user = await PracticeService.getUserByEmail(email);
      
      if (!user.success || !user.data) {
        // Don't reveal if email exists or not for security
        res.json({
          success: true,
          message2: 'If an account with that email exists and is unverified, a verification email has been sent.'
        });
        return;
      }

      // Check if already verified
      const fullUser = await PracticeService.getUserById(user.data.id);
      if (fullUser.success && fullUser.data?.email_verified) {
        res.json({
          success: true,
          message2: 'Email is already verified. You can sign in now.'
        });
        return;
      }

      const emailSent = await EmailService.sendVerificationEmail(email, user.data.id);
      
      res.json({
        success: true,
        message2: 'If an account with that email exists and is unverified, a verification email has been sent.',
        data: { emailSent }
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error'
      });
    }
  }
}