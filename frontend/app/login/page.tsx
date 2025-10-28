'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { api, ApiError } from '@/components/lib/api';

// --- Type Definitions ---
interface LoginSuccessData {
  token: string;
  user: {
    role: string;
  };
  practice: {
    isonboarded: boolean;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  message2: string;
  data?: T;
}
// --- End of type definitions ---

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: ApiResponse<LoginSuccessData> = await api.post('/auth/login', { email, password });
      
      if (response.success && response.data) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('practice', JSON.stringify(response.data.practice));
        
        toast.success('Login successful! Welcome back.');
        
        if (!response.data.practice.isonboarded && response.data.user.role === 'admin') {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error(response.message2 || 'Login failed: Invalid response.');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* IMPROVEMENT 1: Elevated Card Style */}
        <Card className="shadow-2xl border-t-4 border-blue-600 rounded-xl transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="text-center pt-10 pb-4 space-y-3">
            <div className="flex justify-center mb-2">
              {/* IMPROVEMENT 2: Cleaner Logo Presentation */}
              <div className="p-2 rounded-xl border border-gray-100 shadow-inner">
                <img
                  src="/EmageSmile.png"
                  alt="EmageSmile Logo"
                  className="h-20 w-20 "
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold text-gray-900">
              EmageSmile
            </CardTitle>
            <CardDescription className="text-gray-500 text-base">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* IMPROVEMENT 3: Grouped Input & Label */}
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
                  className="h-11 border-gray-300 rounded-lg transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-gray-300 rounded-lg transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-blue-500"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Links for password and email verification */}
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      toast.error('Please enter your email address first');
                      return;
                    }
                    try {
                      const response = await api.post('/auth/resend-verification', { email });
                      if (response.success) {
                        toast.success('Verification email sent! Check your inbox.');
                      } else {
                        toast.error(response.message2 || 'Failed to send verification email');
                      }
                    } catch (error) {
                      toast.error('Failed to send verification email');
                    }
                  }}
                  className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  Resend Verification
                </button>
                <Link href="/forgot-password" passHref className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              {/* IMPROVEMENT 4: Primary Action Button with Integrated Loading */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center" 
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500 font-medium">Don't have an account?</span>
              </div>
            </div>

            {/* IMPROVEMENT 5: Secondary Action Button */}
            {true ? ( // Keeping the 'true' check from the original logic
                <Button
                    variant="outline"
                    className="w-full h-11 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    disabled
                >
                    <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                    Request New Account
                </Button>
            ) : (
                <Link href="/signup" className="block">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200"
                    >
                        <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                        Create New Account
                    </Button>
                </Link>
            )}
            
            {/* Footer Text */}
            <p className="text-center text-xs text-gray-400 pt-4">
                © {new Date().getFullYear()} EmageSmile. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}