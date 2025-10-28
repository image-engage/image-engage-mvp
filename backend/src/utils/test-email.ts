import { EmailService } from '../services/email.service';
import dotenv from 'dotenv';

dotenv.config();

// Simple test function to verify email configuration
export const testEmailConfiguration = async () => {
  try {
    console.log('Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' : 'Not set');
    
    // Test sending a verification email
    const result = await EmailService.sendVerificationEmail('znabil85@outlook.com', 'test-user-id');
    console.log('Email test result:', result);
    
    return result;
  } catch (error) {
    console.error('Email test failed:', error);
    return false;
  }
};

// Uncomment to run test
// testEmailConfiguration();