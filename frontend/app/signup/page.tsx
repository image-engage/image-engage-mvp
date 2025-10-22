'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft, UserPlus, Loader2, Info } from 'lucide-react'; // Added Info icon for requirements box
import { toast } from 'sonner';
import Link from 'next/link';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// Re-defining interface from the login component for consistency
interface LoginSuccessData {
  token: string;
  user: {
    role: string;
  };
  practice: {
    isonboarded: boolean;
  };
}


export default function SignupPage() {
  const [formData, setFormData] = useState({
    practiceName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' // Changed default role to 'admin' as this is the primary registration point for a new practice
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.practiceName.trim()) {
      toast.error('Practice name is required.');
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last names are required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    if (formData.password.length < 8) { // Increased minimum length for better security practice
      toast.error('Password must be at least 8 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    if (!BACKEND_API_URL) {
      toast.error('Backend API URL is not configured.');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          practiceName: formData.practiceName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role // Role will typically be 'admin' for a new practice setup
        }),
      });

      const data: any = await response.json(); // Use 'any' for the API response body for simpler type handling here

      if (response.ok && data.success) {
        // Successful registration and automatic login/token generation
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('practice', JSON.stringify(data.data.practice));
        localStorage.setItem('user', JSON.stringify(data.data.user));

        toast.success(data.message2 || 'Account created successfully! Redirecting to setup...');

        // Redirect based on onboarding status
        if (!data.data.practice.isonboarded && data.data.user.role === 'admin') {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }

      } else {
        toast.error(data.message2 || 'Failed to create account. Please check your details.');
      }
    } catch (error) {
      console.error('Network or unexpected error during signup:', error);
      toast.error('A network error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    // IMPROVEMENT 1: Simplified Background
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl sm:max-w-xl"> {/* Increased max-width for better two-column layout */}
        {/* IMPROVEMENT 2: Elevated Card Style */}
        <Card className="shadow-2xl border-t-4 border-blue-600 rounded-xl">
          <CardHeader className="text-center pt-10 pb-4 space-y-3">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-xl border border-gray-100 shadow-inner">
                <img
                  src="/EmageSmile.png"
                  alt="EmageSmile Logo"
                  className="h-20 w-20 object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold text-gray-900">
              Create Your Admin Account
            </CardTitle>
            <CardDescription className="text-gray-500 text-base">
              Start your free trial by setting up your primary account and practice.
            </CardDescription>
          </CardHeader>

          {/* IMPROVEMENT 3: Grouped and Spaced Content */}
          <CardContent className="space-y-6 pt-0">
            {/* Form Requirements Alert Box */}
            <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                <Info className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold mb-1">Account Requirements</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                        <li>Password must be at least 8 characters.</li>
                        <li>This account will be the **Administrator** for the practice.</li>
                    </ul>
                </div>
            </div>
            
            <form onSubmit={handleSignup} className="space-y-6"> {/* Increased vertical space */}
              
              {/* Personal Details - Two Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="h-11 border-gray-300 rounded-lg transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="h-11 border-gray-300 rounded-lg transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Email and Practice Name - Two Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@dental.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-11 border-gray-300 rounded-lg transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="practiceName" className="text-sm font-medium text-gray-700">Practice/Clinic Name</Label>
                  <Input
                    id="practiceName"
                    type="text"
                    placeholder="Daylight Dental"
                    value={formData.practiceName}
                    onChange={(e) => handleInputChange('practiceName', e.target.value)}
                    className="h-11 border-gray-300 rounded-lg transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              {/* Role Select (Hidden/Read-only for Admin Signup) */}
              <div className="space-y-2 hidden"> {/* Hide the role select for this specific admin signup flow */}
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)} disabled>
                  <SelectTrigger className="h-11 border-gray-300 rounded-lg">
                    <SelectValue placeholder="Administrator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator (Default)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Fields - Two Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
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
                      {showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="h-11 border-gray-300 rounded-lg transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-blue-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                    </Button>
                  </div>
                </div>
              </div>
              

              {/* Submit Button with Loading State */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Start Free Trial</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500 font-medium">Already registered?</span>
              </div>
            </div>

            <Link href="/login" className="block">
              <Button
                variant="outline"
                className="w-full h-11 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
            
            <p className="text-center text-xs text-gray-400 pt-4">
                By creating an account, you agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
            </p>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}