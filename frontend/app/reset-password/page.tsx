'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { api, ApiError } from '@/components/lib/api';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !confirmationCode) {
      toast.error('Email and confirmation code are required');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/cognito-auth/reset-password', { 
        email,
        confirmationCode,
        newPassword 
      });
      
      if (response.success) {
        setResetSuccess(true);
        toast.success('Password reset successfully');
      } else {
        toast.error(response.message2 || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      let errorMessage = 'Failed to reset password. Please try again.';

      if (error instanceof ApiError) {
        errorMessage = error.responseBody?.message2 || `API Error: ${error.message}`;
        if (errorMessage.includes('Invalid or expired')) {
          setTokenValid(false);
        }
      } else if (error instanceof Error) {
        errorMessage = `An unexpected error occurred: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
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
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-0">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Password reset links expire after 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/forgot-password" className="block">
                  <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                    Request New Reset Link
                  </Button>
                </Link>
                
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full h-11">
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

  if (resetSuccess) {
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
                Password Reset Complete
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-0">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  You can now sign in with your new password.
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
        <Card className="shadow-2xl border-t-4 border-blue-600 rounded-xl">
          <CardHeader className="text-center pt-10 pb-4 space-y-3">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-blue-100">
                <Lock className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
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
                  Confirmation Code
                </Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  placeholder="123456"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="h-11 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500">Enter the code sent to your email</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-blue-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-blue-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" 
                disabled={isLoading || !email || !confirmationCode || !newPassword || !confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Updating Password...</span>
                  </div>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}