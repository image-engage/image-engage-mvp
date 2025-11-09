'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CallbackPage() {
  const { isLoading, isAuthenticated, error, user, getAccessTokenSilently } = useAuth0();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      if (isLoading) return;

      if (error) {
        console.error('Auth0 error:', error);
        setStatus('error');
        toast.error('Authentication failed. Please try again.');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (isAuthenticated && user) {
        try {
          // Get access token for API calls
          const token = await getAccessTokenSilently();
          
          // Store user data and token
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('auth0_token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Check if user needs MFA setup
          const needsMFA = !user['https://emage-smile.com/mfa_enrolled'];
          
          setStatus('success');
          toast.success('Login successful!');

          // Redirect based on MFA status and user metadata
          setTimeout(() => {
            if (needsMFA) {
              router.push('/mfa-setup');
            } else if (!user['https://emage-smile.com/onboarded']) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          }, 1500);

        } catch (tokenError) {
          console.error('Token error:', tokenError);
          setStatus('error');
          toast.error('Failed to complete authentication.');
          setTimeout(() => router.push('/login'), 3000);
        }
      }
    };

    handleCallback();
  }, [isLoading, isAuthenticated, error, user, getAccessTokenSilently, router]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-center">Completing Sign In...</CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Please wait while we securely log you in.
            </p>
          </>
        );
      
      case 'success':
        return (
          <>
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-center text-green-700">Sign In Successful!</CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Redirecting you to your dashboard...
            </p>
          </>
        );
      
      case 'error':
        return (
          <>
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-center text-red-700">Sign In Failed</CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Redirecting you back to login...
            </p>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img
              src="/EmageSmile.png"
              alt="EmageSmile Logo"
              className="h-16 w-16"
            />
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}