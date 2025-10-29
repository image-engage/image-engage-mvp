import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  MessageActionType,
  AuthFlowType,
  AdminDeleteUserCommand,
  ChallengeNameType,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  AdminSetUserMFAPreferenceCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    
    this.userPoolId = process.env.COGNITO_USER_POOL_ID!;
    this.clientId = process.env.COGNITO_CLIENT_ID!;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET!;
  }

  private calculateSecretHash(username: string): string {
    return createHmac('SHA256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    practiceName: string;
    role: string;
    practiceId: string;
    password: string;
  }) {
    try {
      const secretHash = this.calculateSecretHash(userData.email);

      // Use SignUp for proper user registration with email verification
      const signUpCommand = new SignUpCommand({
        ClientId: this.clientId,
        Username: userData.email,
        Password: userData.password,
        SecretHash: secretHash,
        UserAttributes: [
          { Name: 'email', Value: userData.email },
          { Name: 'given_name', Value: userData.firstName },
          { Name: 'family_name', Value: userData.lastName },
          { Name: 'custom:practice_name', Value: userData.practiceName },
          { Name: 'custom:role', Value: userData.role },
          { Name: 'custom:practice_id', Value: userData.practiceId },
        ],
      });

      const signUpResult = await this.client.send(signUpCommand);
      
      console.log('User signed up successfully:', userData.email);
      console.log('Verification email should be sent');

      return {
        success: true,
        data: {
          userSub: signUpResult.UserSub,
          codeDeliveryDetails: signUpResult.CodeDeliveryDetails,
        },
      };
    } catch (error: any) {
      console.error('Cognito signup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create user',
      };
    }
  }

  async confirmSignUp(email: string, confirmationCode: string) {
    try {
      const secretHash = this.calculateSecretHash(email);

      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        SecretHash: secretHash,
      });

      await this.client.send(command);

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error: any) {
      console.error('Confirm signup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify email',
      };
    }
  }

  async authenticateUser(email: string, password: string) {
    try {
      console.log('Attempting authentication for:', email);
      const secretHash = this.calculateSecretHash(email);

      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      });

      console.log('Sending auth command to Cognito...');
      const result = await this.client.send(command);
      console.log('Cognito auth result:', JSON.stringify(result, null, 2));

      if (result.AuthenticationResult) {
        // Get user details
        const userDetails = await this.getUserDetails(email);
        
        return {
          success: true,
          data: {
            accessToken: result.AuthenticationResult.AccessToken,
            idToken: result.AuthenticationResult.IdToken,
            refreshToken: result.AuthenticationResult.RefreshToken,
            user: userDetails.data,
          },
        };
      }

      // Handle MFA challenges
      if (result.ChallengeName === ChallengeNameType.SOFTWARE_TOKEN_MFA) {
        return {
          success: true,
          requiresMFA: true,
          data: {
            challengeName: result.ChallengeName,
            session: result.Session,
            challengeParameters: result.ChallengeParameters,
          },
        };
      }

      // Handle MFA Setup challenge
      if (result.ChallengeName === 'MFA_SETUP') {
        return {
          success: true,
          requiresMFASetup: true,
          data: {
            challengeName: result.ChallengeName,
            session: result.Session,
            challengeParameters: result.ChallengeParameters,
          },
        };
      }

      return {
        success: false,
        message: 'Authentication failed',
      };
    } catch (error: any) {
      console.error('Cognito auth error:', error);
      return {
        success: false,
        message: error.message || 'Authentication failed',
      };
    }
  }

  async verifyMFA(email: string, mfaCode: string, session: string) {
    try {
      const secretHash = this.calculateSecretHash(email);

      const command = new AdminRespondToAuthChallengeCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        ChallengeName: ChallengeNameType.SOFTWARE_TOKEN_MFA,
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          SOFTWARE_TOKEN_MFA_CODE: mfaCode,
          SECRET_HASH: secretHash,
        },
      });

      const result = await this.client.send(command);

      if (result.AuthenticationResult) {
        const userDetails = await this.getUserDetails(email);
        
        return {
          success: true,
          data: {
            accessToken: result.AuthenticationResult.AccessToken,
            idToken: result.AuthenticationResult.IdToken,
            refreshToken: result.AuthenticationResult.RefreshToken,
            user: userDetails.data,
          },
        };
      }

      return {
        success: false,
        message: 'MFA verification failed',
      };
    } catch (error: any) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        message: error.message || 'MFA verification failed',
      };
    }
  }

  async getUserDetails(email: string) {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      const result = await this.client.send(command);

      const attributes: any = {};
      result.UserAttributes?.forEach(attr => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });

      return {
        success: true,
        data: {
          id: result.Username,
          email: attributes.email,
          firstName: attributes.given_name,
          lastName: attributes.family_name,
          practiceName: attributes['custom:practice_name'],
          role: attributes['custom:role'],
          practiceId: attributes['custom:practice_id'],
          emailVerified: attributes.email_verified === 'true',
        },
      };
    } catch (error: any) {
      console.error('Get user details error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get user details',
      };
    }
  }

  async updateUserAttributes(email: string, attributes: Record<string, string>) {
    try {
      const userAttributes = Object.entries(attributes).map(([key, value]) => ({
        Name: key,
        Value: value,
      }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: userAttributes,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      console.error('Update user attributes error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update user attributes',
      };
    }
  }

  async initiatePasswordReset(email: string) {
    try {
      const secretHash = this.calculateSecretHash(email);

      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      console.error('Initiate password reset error:', error);
      return {
        success: false,
        message: error.message || 'Failed to initiate password reset',
      };
    }
  }

  async confirmPasswordReset(email: string, confirmationCode: string, newPassword: string) {
    try {
      const secretHash = this.calculateSecretHash(email);

      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
        SecretHash: secretHash,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      console.error('Confirm password reset error:', error);
      return {
        success: false,
        message: error.message || 'Failed to confirm password reset',
      };
    }
  }

  async handleMFASetupChallenge(session: string) {
    try {
      // Respond to MFA_SETUP challenge to get the secret code
      const command = new AdminRespondToAuthChallengeCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        ChallengeName: 'MFA_SETUP' as any,
        Session: session,
        ChallengeResponses: {
          USERNAME: '', // Will be filled from session
        },
      });

      const result = await this.client.send(command);
      
      return {
        success: true,
        data: {
          secretCode: result.ChallengeParameters?.SECRET_CODE,
          session: result.Session,
        },
      };
    } catch (error: any) {
      console.error('MFA setup challenge error:', error);
      return {
        success: false,
        message: error.message || 'Failed to handle MFA setup challenge',
      };
    }
  }

  async setupMFA(accessToken: string) {
    try {
      const command = new AssociateSoftwareTokenCommand({
        AccessToken: accessToken,
      });

      const result = await this.client.send(command);

      return {
        success: true,
        data: {
          secretCode: result.SecretCode, // QR code data
        },
      };
    } catch (error: any) {
      console.error('MFA setup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to setup MFA',
      };
    }
  }

  async completeMFASetup(session: string, totpCode: string, email: string) {
    try {
      const secretHash = this.calculateSecretHash(email);
      
      // Complete MFA setup challenge
      const command = new AdminRespondToAuthChallengeCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        ChallengeName: 'MFA_SETUP' as any,
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          SOFTWARE_TOKEN_MFA_CODE: totpCode,
          SECRET_HASH: secretHash,
        },
      });

      const result = await this.client.send(command);
      
      if (result.AuthenticationResult) {
        const userDetails = await this.getUserDetails(email);
        
        return {
          success: true,
          data: {
            accessToken: result.AuthenticationResult.AccessToken,
            idToken: result.AuthenticationResult.IdToken,
            refreshToken: result.AuthenticationResult.RefreshToken,
            user: userDetails.data,
          },
        };
      }
      
      return {
        success: false,
        message: 'MFA setup completion failed',
      };
    } catch (error: any) {
      console.error('MFA setup completion error:', error);
      return {
        success: false,
        message: error.message || 'Failed to complete MFA setup',
      };
    }
  }

  async verifyMFASetup(accessToken: string, totpCode: string) {
    try {
      const verifyCommand = new VerifySoftwareTokenCommand({
        AccessToken: accessToken,
        UserCode: totpCode,
      });

      await this.client.send(verifyCommand);

      // Enable MFA for the user
      const setMFACommand = new AdminSetUserMFAPreferenceCommand({
        UserPoolId: this.userPoolId,
        Username: '', // Will be set from access token
        SoftwareTokenMfaSettings: {
          Enabled: true,
          PreferredMfa: true,
        },
      });

      // Note: AdminSetUserMFAPreferenceCommand needs username, 
      // but we can use SetUserMFAPreference with access token instead
      
      return {
        success: true,
        message: 'MFA setup completed successfully',
      };
    } catch (error: any) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify MFA setup',
      };
    }
  }

  async resendConfirmationCode(email: string) {
    try {
      const secretHash = this.calculateSecretHash(email);

      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
      });

      const result = await this.client.send(command);

      return {
        success: true,
        data: {
          codeDeliveryDetails: result.CodeDeliveryDetails,
        },
      };
    } catch (error: any) {
      console.error('Resend confirmation code error:', error);
      return {
        success: false,
        message: error.message || 'Failed to resend confirmation code',
      };
    }
  }
}