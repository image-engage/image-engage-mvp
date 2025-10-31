import { Request, Response } from 'express';
import { CognitoService } from '../services/cognito.service';
import { PracticeService } from '../services/practice.service';
import { ApiResponse } from '../types';

export class CognitoAuthController {
  private static cognitoService = new CognitoService();

  /**
   * Register new user with Cognito and create practice
   */
  static async register(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { practiceName, firstName, lastName, email, password, role } = req.body;

      if (!practiceName || !firstName || !lastName || !email || !password) {
        res.status(400).json({ 
          success: false, 
          message2: 'All fields are required.' 
        });
        return;
      }

      // Create practice first
      const practiceResult = await PracticeService.createPracticeOnly(practiceName);
      
      if (!practiceResult.success || !practiceResult.data) {
        res.status(400).json(practiceResult);
        return;
      }

      // Create user in Cognito
      const cognitoResult = await CognitoAuthController.cognitoService.createUser({
        email,
        firstName,
        lastName,
        practiceName,
        role: role || 'admin',
        practiceId: practiceResult.data.id,
        password,
      });

      if (!cognitoResult.success) {
        // Cleanup: delete practice if Cognito user creation failed
        // You might want to implement practice deletion
        res.status(400).json({
          success: false,
          message2: cognitoResult.message || 'Failed to create user account',
        });
        return;
      }

      res.status(201).json({
        success: true,
        message2: 'Account created successfully! You can now sign in.',
        data: {
          practice: practiceResult.data,
          user: {
            email,
            firstName,
            lastName,
            role: role || 'admin',
          },
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during registration',
      });
    }
  }

  /**
   * Login user with Cognito
   */
  static async login(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message2: 'Email and password are required',
        });
        return;
      }

      // Authenticate with Cognito
      const authResult = await CognitoAuthController.cognitoService.authenticateUser(email, password);

      if (!authResult.success) {
        res.status(401).json({
          success: false,
          message2: 'Invalid credentials',
        });
        return;
      }

      // Handle MFA challenge
      if (authResult.requiresMFA) {
        res.json({
          success: true,
          requiresMFA: true,
          message2: 'MFA code required',
          data: {
            session: authResult.data?.session,
            challengeName: authResult.data?.challengeName,
          },
        });
        return;
      }

      // Handle MFA Setup challenge
      if ((authResult as any).requiresMFASetup) {
        res.json({
          success: true,
          requiresMFASetup: true,
          message2: 'MFA setup required',
          data: {
            session: authResult.data?.session,
            challengeName: authResult.data?.challengeName,
          },
        });
        return;
      }

      if (!authResult.data) {
        res.status(401).json({
          success: false,
          message2: 'Authentication failed',
        });
        return;
      }

      // Get practice data
      const practiceResult = await PracticeService.getPracticeById(authResult.data.user.practiceId);

      if (!practiceResult.success) {
        res.status(500).json({
          success: false,
          message2: 'Failed to retrieve practice information',
        });
        return;
      }

      res.json({
        success: true,
        message2: 'Login successful',
        data: {
          token: authResult.data.idToken, // Use Cognito ID token
          accessToken: authResult.data.accessToken,
          refreshToken: authResult.data.refreshToken,
          user: authResult.data.user,
          practice: practiceResult.data,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during login',
      });
    }
  }

  /**
   * Initiate password reset
   */
  static async forgotPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message2: 'Email is required',
        });
        return;
      }

      const result = await CognitoAuthController.cognitoService.initiatePasswordReset(email);

      // Always return success for security (don't reveal if email exists)
      res.json({
        success: true,
        message2: 'If an account with that email exists, a password reset code has been sent.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error',
      });
    }
  }

  /**
   * Confirm password reset
   */
  static async resetPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, confirmationCode, newPassword } = req.body;

      if (!email || !confirmationCode || !newPassword) {
        res.status(400).json({
          success: false,
          message2: 'Email, confirmation code, and new password are required',
        });
        return;
      }

      const result = await CognitoAuthController.cognitoService.confirmPasswordReset(
        email,
        confirmationCode,
        newPassword
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message2: 'Invalid confirmation code or password reset failed',
        });
        return;
      }

      res.json({
        success: true,
        message2: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during password reset',
      });
    }
  }

  /**
   * Verify MFA code
   */
  static async verifyMFA(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, mfaCode, session } = req.body;

      if (!email || !mfaCode || !session) {
        res.status(400).json({
          success: false,
          message2: 'Email, MFA code, and session are required',
        });
        return;
      }

      const result = await CognitoAuthController.cognitoService.verifyMFA(email, mfaCode, session);

      if (!result.success || !result.data) {
        res.status(400).json({
          success: false,
          message2: 'Invalid MFA code',
        });
        return;
      }

      // Get practice data
      const practiceResult = await PracticeService.getPracticeById(result.data.user.practiceId);

      if (!practiceResult.success) {
        res.status(500).json({
          success: false,
          message2: 'Failed to retrieve practice information',
        });
        return;
      }

      res.json({
        success: true,
        message2: 'MFA verification successful',
        data: {
          token: result.data.idToken,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          user: result.data.user,
          practice: practiceResult.data,
        },
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during MFA verification',
      });
    }
  }

  /**
   * Confirm email verification
   */
  static async confirmSignUp(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email, confirmationCode } = req.body;

      if (!email || !confirmationCode) {
        res.status(400).json({
          success: false,
          message2: 'Email and confirmation code are required',
        });
        return;
      }

      const result = await CognitoAuthController.cognitoService.confirmSignUp(email, confirmationCode);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message2: result.message || 'Email verification failed',
        });
        return;
      }

      res.json({
        success: true,
        message2: 'Email verified successfully. You can now sign in.',
      });
    } catch (error) {
      console.error('Confirm signup error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error during email verification',
      });
    }
  }

  /**
   * Resend confirmation code
   */
  static async resendConfirmationCode(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message2: 'Email is required',
        });
        return;
      }

      const result = await CognitoAuthController.cognitoService.resendConfirmationCode(email);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message2: result.message || 'Failed to resend confirmation code',
        });
        return;
      }

      res.json({
        success: true,
        message2: 'Confirmation code sent to your email',
      });
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      res.status(500).json({
        success: false,
        message2: 'Internal server error',
      });
    }
  }
}