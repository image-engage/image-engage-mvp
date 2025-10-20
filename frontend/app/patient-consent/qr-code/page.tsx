'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode as QrCodeIcon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// NOTE: Remember to install the QR code library if you haven't already:
// npm install react-qr-code uuid

export default function AdminQRCodePage(): JSX.Element {
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60); // State for the countdown timer

  const handleGenerateQR = async () => {
    setIsLoading(true);
    setGeneratedUrl('');
    setCountdown(60); // Reset countdown on new QR code generation

    try {
      // Simulate a secure, authenticated API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const patientToken: string = uuidv4();
      const baseUrl: string = window.location.origin;
      const consentFormUrl: string = `${baseUrl}/patient-consent?token=${patientToken}`;
      
      setGeneratedUrl(consentFormUrl);
    } catch (error) {
      console.error('Error generating token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Start the initial QR code generation when the component mounts
    handleGenerateQR();

    // Set up an interval to regenerate the QR code every 60 seconds
    const intervalId = setInterval(() => {
      handleGenerateQR();
    }, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (generatedUrl) {
      // Start a countdown timer after the URL is generated
      const timerId = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown > 0 ? prevCountdown - 1 : 60);
      }, 1000);

      // Clean up the countdown timer
      return () => clearInterval(timerId);
    }
  }, [generatedUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-2xl w-full px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-6 w-6 text-blue-600" />
              Patient Consent QR Code Generator
            </CardTitle>
            <CardDescription>
              A new, secure QR code is automatically generated every 60 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={handleGenerateQR} disabled={isLoading} className="w-full">
              {isLoading ? 'Generating...' : `Generate Now (${countdown}s)`}
            </Button>
            
            <Link href="/patient-consent">
              <Button variant="outline" className="w-full">
                View Patient Consent Form
              </Button>
            </Link>
            
            {generatedUrl && (
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-semibold">Ready for Patient</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Secure & Single-Use
                  </Badge>
                </div>
                
                <div className="bg-white p-6 rounded-lg border flex items-center justify-center">
                  <QRCode 
                    value={generatedUrl} 
                    size={256} 
                    className="w-full max-w-sm" 
                  />
                </div>
                
                <p className="text-sm text-gray-600">
                  Instruct the patient to scan this code with their smartphone camera to access the form.
                </p>

                {/* Optional: Show the link for testing */}
                <div className="bg-gray-100 p-3 rounded-md text-sm break-all">
                  <p className="font-semibold">Test Link:</p>
                  <Link href={generatedUrl} className="text-blue-600 hover:underline">{generatedUrl}</Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// Admin Login (Secure): An admin logs in with a username and password. On successful authentication, the server generates a session token (JWT or a similar token) and sets it as an HTTP-only cookie. This is the standard, secure way to handle authenticated sessions in web applications. The token is never stored in local storage, protecting it from client-side attacks.

// Generate a Patient Token (Backend): When the admin wants to prepare a form for a patient, they navigate to a new page (e.g., /admin/generate-qr). The frontend makes an authenticated API call to a protected endpoint on your server. The server verifies the admin's session token and then generates a new, short-lived, single-use token specifically for the patient form. This patient token is what the QR code will contain.

// Display the QR Code (Frontend): The backend sends the patient token back to the frontend. The frontend then uses this token to construct the URL for the consent form (e.g., /consent?token=xyz123) and generates a QR code.

// Patient Scans QR Code: The patient scans the QR code. This takes them to the consent form URL, which includes the unique patient token.

// Form Submission (Secure): When the patient submits the form, the frontend includes the patient token in the Authorization header of the API request. The backend validates this token, processes the form data, and then immediately invalidates the token to prevent it from being used again.