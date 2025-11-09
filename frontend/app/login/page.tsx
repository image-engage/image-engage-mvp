'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        prompt: 'login',
        // Force MFA challenge
        acr_values: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor'
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <Card className="shadow-2xl border-t-4 border-blue-600 rounded-xl transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="text-center pt-10 pb-4 space-y-3">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-xl border border-gray-100 shadow-inner">
                <img
                  src="/EmageSmile.png"
                  alt="EmageSmile Logo"
                  className="h-20 w-20"
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold text-gray-900">
              EmageSmile
            </CardTitle>
            <CardDescription className="text-gray-500 text-base">
              Secure access to your dental practice platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            {/* HIPAA Compliance Notice */}
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-100">
              <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">HIPAA-Compliant Authentication</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Multi-factor authentication required</li>
                  <li>• Encrypted data transmission</li>
                  <li>• Secure session management</li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign In Securely
            </Button>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500 font-medium">New to EmageSmile?</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-11 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              disabled
            >
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              Request New Account
            </Button>
            
            <p className="text-center text-xs text-gray-400 pt-4">
              © {new Date().getFullYear()} EmageSmile. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}