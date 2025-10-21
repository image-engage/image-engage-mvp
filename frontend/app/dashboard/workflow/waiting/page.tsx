'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, User, Home, Zap, Smile, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Define the expected session interface for better type safety
interface PatientSession {
  sessionId: string;
  patientId: string;
  patientName: string;
  procedure: string;
  currentStep: string;
  createdAt: string;
  // Add other relevant fields if necessary
}

export default function WaitingPage() {
  const [sessionData, setSessionData] = useState<PatientSession | null>(null);

  useEffect(() => {
    // Get the current session data from local storage (set by consent form)
    const currentSession = localStorage.getItem('currentSession');
    if (currentSession) {
      const session: PatientSession = JSON.parse(currentSession);
      setSessionData(session);
    } else {
      // Fallback: Get the most recent session from patientSessions if currentSession doesn't exist
      const storedSessions = localStorage.getItem('patientSessions');
      if (storedSessions) {
        const sessions: PatientSession[] = JSON.parse(storedSessions);
        if (sessions.length > 0) {
          setSessionData(sessions[sessions.length - 1]);
        }
      }
    }
  }, []);

  const patientFirstName = sessionData?.patientName.split(' ')[0] || 'Patient';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* IMPROVED HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/workflow/patient-queue">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Queue
              </Button>
            </Link>
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Workflow Holding Screen</h1>
          </div>

        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* CONSOLIDATED SUCCESS CARD WITH CALMING DESIGN */}
        <Card className="mb-10 shadow-2xl border-t-8 border-blue-600 bg-white">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600 animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <Smile className="h-6 w-6 text-yellow-500" />
                Thank You, {patientFirstName}!
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
                Your initial step for the **{sessionData?.procedure || 'procedure'}** is complete.
              </p>
              <p className="text-lg text-gray-500 mt-4">
                Please remain seated. A staff member will return shortly to initiate the next phase of your visit.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* --- */}

        {/* INFO AND NEXT STEPS CARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card className="shadow-lg border-l-4 border-yellow-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-yellow-700">
                        <Info className="h-5 w-5" />
                        Next Steps
                    </CardTitle>
                    <CardDescription>
                        What happens now?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        **Consent/Intake** is officially recorded.
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                        <Zap className="h-4 w-4 text-blue-500" />
                        The system is now waiting for a staff member to select **"Start Photo Capture."**
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-orange-500" />
                        This screen will automatically update when the workflow proceeds.
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-blue-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                  <User className="h-5 w-5" />
                  Session Summary
                </CardTitle>
                <CardDescription>
                  A quick review of the current session data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Patient Name:</span>
                  <span className="text-base font-semibold text-gray-900">{sessionData?.patientName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Procedure:</span>
                  <Badge className="bg-blue-100 text-blue-800 font-semibold">
                    {sessionData?.procedure || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Workflow Status:</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-semibold">
                    <Clock className="h-3 w-3 mr-1" />
                    Waiting for Photo Capture
                  </Badge>
                </div>
              </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}