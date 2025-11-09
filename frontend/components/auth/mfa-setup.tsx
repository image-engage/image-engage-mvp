'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Smartphone, QrCode, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MFASetupProps {
  onComplete: () => void;
  qrCodeUrl?: string;
  secret?: string;
}

export default function MFASetup({ onComplete, qrCodeUrl, secret }: MFASetupProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      // Call Auth0 Management API to verify MFA enrollment
      const response = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });

      if (response.ok) {
        toast.success('MFA setup completed successfully!');
        onComplete();
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-blue-600" />
        </div>
        <CardTitle>Setup Multi-Factor Authentication</CardTitle>
        <CardDescription>
          Secure your account with an authenticator app for HIPAA compliance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <div className="text-sm">
              <p className="font-medium">Step 1: Install an authenticator app</p>
              <p className="text-gray-600">Google Authenticator, Authy, or Microsoft Authenticator</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <QrCode className="h-5 w-5 text-blue-600" />
            <div className="text-sm">
              <p className="font-medium">Step 2: Scan QR code or enter secret</p>
              <p className="text-gray-600">Use your authenticator app to scan the QR code</p>
            </div>
          </div>
        </div>

        {qrCodeUrl && (
          <div className="text-center">
            <img src={qrCodeUrl} alt="MFA QR Code" className="mx-auto border rounded-lg" />
            {secret && (
              <p className="text-xs text-gray-500 mt-2 break-all">
                Manual entry: {secret}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-widest"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isVerifying || verificationCode.length !== 6}
          >
            {isVerifying ? (
              'Verifying...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}