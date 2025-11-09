'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { api, ApiError, ApiResponse } from '@/components/lib/api';

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  const searchParams = useSearchParams();

  useState(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !confirmationCode) {
      toast.error('Email and confirmation code are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<ApiResponse>('/cognito-auth/confirm-signup', {
        email,
        confirmationCode,
      });
      
      if (response.success) {
        setVerificationSuccess(true);
        toast.success('Email verified successfully!');
      } else {
        toast.error(response.message2 || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      let errorMessage = 'Email verification failed. Please try again.';

      if (error instanceof ApiError) {
        errorMessage = error.responseBody?.message2 || `API Error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `An unexpected error occurred: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSuccess) {
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
        <Card className="shadow-2xl border-t-4 border-blue-600 rounded-xl">
          <CardHeader className="text-center pt-10 pb-4 space-y-3">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-blue-100">
                <Mail className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter the verification code sent to your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmationCode" className="text-sm font-medium text-gray-700">
                  Verification Code
                </Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  placeholder="123456"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-11 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500">Enter the 6-digit code from your email</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" 
                disabled={isLoading || !email || !confirmationCode}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error('Please enter your email address first');
                    return;
                  }
                  try {
                    const response = await api.post<ApiResponse>('/cognito-auth/resend-confirmation', { email });
                    if (response.success) {
                      toast.success('New verification code sent to your email!');
                    } else {
                      toast.error(response.message2 || 'Failed to resend code');
                    }
                  } catch (error) {
                    toast.error('Failed to resend verification code');
                  }
                }}
                className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Resend Code
              </button>
              
              <div>
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Back to Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}