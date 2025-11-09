'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { api, ApiError, ApiResponse } from '@/components/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post<ApiResponse>('/cognito-auth/forgot-password', { email });
      
      if (response.success) {
        setEmailSent(true);
        toast.success('Password reset instructions sent to your email');
      } else {
        toast.error(response.message2 || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';

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

  if (emailSent) {
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
                Check Your Email
              </CardTitle>
              <CardDescription className="text-gray-600">
                We've sent password reset instructions to your email address
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-0">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  If an account with <strong>{email}</strong> exists, you'll receive an email with instructions to reset your password.
                </p>
                <p className="text-xs text-gray-500">
                  Didn't receive an email? Check your spam folder or try again.
                </p>
              </div>

              <div className="space-y-3">
                <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="block">
                  <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                    Reset Password Now
                  </Button>
                </Link>
                
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full h-11"
                >
                  Try Different Email
                </Button>
                
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full h-11">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
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
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email address and we'll send you instructions to reset your password
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

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" 
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Send Reset Instructions
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                <ArrowLeft className="h-4 w-4 inline mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}