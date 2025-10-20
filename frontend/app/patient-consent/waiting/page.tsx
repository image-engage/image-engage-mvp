'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, User, Home } from 'lucide-react';
import Link from 'next/link';

export default function WaitingPage() {
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Get the patient session data from local storage
    const storedSessions = localStorage.getItem('patientSessions');
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions);
      // Get the last submitted session, assuming it's the current one
      if (sessions.length > 0) {
        setSessionData(sessions[sessions.length - 1]);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Please wait for the next step</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-orange-900 mb-2">
                Thank you, {sessionData?.patientName || 'Patient'}!
              </h2>
              <p className="text-orange-800 max-w-2xl mx-auto">
                Your consent for the **{sessionData?.procedure || 'procedure'}** has been successfully recorded. A staff member will guide you through the next steps.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Session Details
            </CardTitle>
            <CardDescription>
              A summary of the current session state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Patient Name</span>
                </div>
                <span className="text-sm">{sessionData?.patientName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Session Status</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Waiting for photos
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
