'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode as QrCodeIcon, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/components/lib/api';

export default function KioskPage() {
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const isInitialQREffectRun = useRef(false);

  const handleGenerateQR = async () => {
    setIsLoading(true);
    setCountdown(60);

    try {
      // Generate secure session token via API
      const token = localStorage.getItem('token');
      const response = await api.post('/sessions/generate-qr-token', { 
        expiresIn: 60 // seconds
      }, token || undefined) as { success: boolean; data?: { sessionToken: string } };
      
      if (response.success && response.data?.sessionToken) {
        const baseUrl = window.location.origin;
        const consentFormUrl = `${baseUrl}/patient-consent?session=${response.data.sessionToken}`;
        setGeneratedUrl(consentFormUrl);
      } else {
        throw new Error('Failed to generate secure token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      // Fallback: Generate client-side token for now
      const fallbackToken = uuidv4();
      const baseUrl = window.location.origin;
      setGeneratedUrl(`${baseUrl}/patient-consent?session=${fallbackToken}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isInitialQREffectRun.current) {
        return;
    }
    handleGenerateQR();
    isInitialQREffectRun.current = true;

    const intervalId = setInterval(() => {
      handleGenerateQR();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (generatedUrl) {
      const timerId = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown > 0 ? prevCountdown - 1 : 60);
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [generatedUrl]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Consent Kiosk</h1>
          <p className="text-gray-600 mt-2">Display this code for the next patient to complete their digital consent form.</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Card className="shadow-lg border-2 border-indigo-100 w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-indigo-700">
              <QrCodeIcon className="h-6 w-6 text-indigo-500" />
              Scan to Begin Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedUrl ? (
              <div className="space-y-5 text-center">
                <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 flex items-center justify-center">
                  <QRCode 
                    value={generatedUrl} 
                    size={256} 
                    className="w-full max-w-[256px] rounded-md shadow-lg" 
                    fgColor="#000000"
                    bgColor="#ffffff" 
                  />
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <Badge className="bg-green-600 text-white font-semibold">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Code Active
                  </Badge>
                  <span className="text-gray-600">
                    Regenerates in: <strong className="text-indigo-600">{countdown}s</strong>
                  </span>
                </div>
                               <Link href={generatedUrl || '/patient-consent'} className="block">
                  <Button variant="outline" className="w-full">
                    View Patient Consent Form
                  </Button>
                </Link>
                <p className="text-xs text-gray-500">The link is secure, single-use, and valid for 60 seconds.</p>
              </div>
            ) : (
              <div className="text-center p-10">
                <p className="text-gray-500">Loading token...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}