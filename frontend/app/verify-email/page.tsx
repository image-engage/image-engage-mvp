'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { api, ApiError } from '@/components/lib/api';

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setErrorMessage('Invalid or missing verification token');
        setIsLoading(false);
        return;
      }

      try {
        const email = searchParams.get('email');
        const code = searchParams.get('code');
        
        if (!email || !code) {
          setVerificationStatus('error');
          setErrorMessage('Missing email or confirmation code in URL');
          return;
        }
        
        const response = await api.post('/cognito-auth/confirm-signup', { 
          email, 
          confirmationCode: code 
        });
        
        if (response.success) {
          setVerificationStatus('success');
          toast.success('Email verified successfully');
        } else {
          setVerificationStatus('error');
          setErrorMessage(response.message2 || 'Email verification failed');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        
        if (error instanceof ApiError) {
          setErrorMessage(error.responseBody?.message2 || 'Email verification failed');
        } else if (error instanceof Error) {
          setErrorMessage(`An unexpected error occurred: ${error.message}`);
        } else {
          setErrorMessage('Email verification failed');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm sm:max-w-md">
          <Card className="shadow-2xl border-t-4 border-blue-600 rounded-xl">
            <CardHeader className="text-center pt-10 pb-4 space-y-3">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-blue-100">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Verifying Email
              </CardTitle>
              <CardDescription className="text-gray-600">
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm sm:max-w-md">
          <Card className="shadow-2xl border-t-4 border-green-600 rounded-xl">
            <CardHeader className="text-center pt-10 pb-4 space-y-3">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Email Verified!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your email address has been successfully verified
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-0">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Thank you for verifying your email address. You can now access all features of your account.
                </p>
              </div>

              <Link href="/login" className="block">
                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                  Continue to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card className="shadow-2xl border-t-4 border-red-600 rounded-xl">
          <CardHeader className="text-center pt-10 pb-4 space-y-3">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-red-100">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verification Failed
            </CardTitle>
            <CardDescription className="text-gray-600">
              We couldn't verify your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {errorMessage || 'The verification link may be invalid or expired.'}
              </p>
              <p className="text-xs text-gray-500">
                Verification links expire after 1 hour for security reasons.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                  Go to Login
                </Button>
              </Link>
              
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full h-11">
                  Create New Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}