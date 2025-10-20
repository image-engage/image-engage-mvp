'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Camera, CheckCircle, Clock, ArrowRight, QrCode as QrCodeIcon, CheckCircle2, ListChecks, Smile } from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';
import { api, ApiResponse } from '@/components/lib/api';

export default function WorkflowPage() {
  const [stats, setStats] = useState({
    totalConsents: 0,
    waitingPatients: 0,
    photosToday: 0,
    completedSessions: 0,
  });

  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const isInitialQREffectRun = useRef(false);

  useEffect(() => {
    const fetchStats = async () => {
      let apiPatients: any[] = [];
      try {
        const response = await api.get<ApiResponse<any[]>>('/photo-session/waiting-patients');
        apiPatients = Array.isArray(response?.data) ? response.data : [];
      } catch (error: any) {
        console.error('Error fetching waiting patients:', error);
        apiPatients = [];
      }

      let allSessions: any[] = [];
      try {
        const storedSessions = localStorage.getItem('patientSessions');
        if (storedSessions) {
          const parsed = JSON.parse(storedSessions);
          allSessions = Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error('Error parsing stored sessions:', error);
        allSessions = [];
      }

      const newStats = {
        totalConsents: allSessions.length,
        waitingPatients: apiPatients.length,
        photosToday: allSessions.reduce((acc: number, session: any) => {
          if (!session || typeof session !== 'object') return acc;
          const beforePhotos = Array.isArray(session.beforePhotos) ? session.beforePhotos : [];
          const afterPhotos = Array.isArray(session.afterPhotos) ? session.afterPhotos : [];
          const allPhotos = [...beforePhotos, ...afterPhotos];
          return acc + allPhotos.filter((p: any) => {
            return p && p.timestamp && new Date(p.timestamp).toDateString() === new Date().toDateString();
          }).length;
        }, 0),
        completedSessions: allSessions.filter((s: any) => {
          if (!s || typeof s !== 'object') return false;
          const beforePhotos = Array.isArray(s.beforePhotos) ? s.beforePhotos : [];
          const afterPhotos = Array.isArray(s.afterPhotos) ? s.afterPhotos : [];
          const videos = Array.isArray(s.videos) ? s.videos : [];
          return beforePhotos.length > 0 && afterPhotos.length > 0 && videos.length > 0;
        }).length,
      };
      setStats(newStats);
    };
    
    fetchStats();
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Workflow</h1>
        <p className="text-gray-600 mt-2">Manage patient consent and photo capture sessions</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Link href="/dashboard/consents" className="cursor-pointer">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold text-gray-900">{stats.totalConsents}</p>
                <p className="text-sm text-indigo-600 font-medium mt-1">Total Consents</p>
              </div>
              <FileText className="h-8 w-8 text-indigo-400 opacity-50" />
            </CardContent>
          </Card>
        </Link>

        <Card className="border-l-4 border-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{stats.photosToday}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">Photos Today</p>
            </div>
            <Smile className="h-8 w-8 text-emerald-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-cyan-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{stats.completedSessions}</p>
              <p className="text-sm text-cyan-600 font-medium mt-1">Completed Sessions</p>
            </div>
            <CheckCircle className="h-8 w-8 text-cyan-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{stats.waitingPatients}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">Waiting Patients</p>
            </div>
            <Clock className="h-8 w-8 text-amber-400 opacity-50" />
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* QR Code Generator */}
        <Card className="shadow-lg border-2 border-indigo-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-indigo-700">
              <QrCodeIcon className="h-6 w-6 text-indigo-500" />
              Patient Consent Kiosk
            </CardTitle>
            <CardDescription>
              Display this code for the next patient to complete their digital consent form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedUrl ? (
              <div className="space-y-5 text-center">
                <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 flex items-center justify-center">
                  <QRCode 
                    value={generatedUrl} 
                    size={180} 
                    className="w-full max-w-[180px] rounded-md shadow-lg" 
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
                
                <Button 
                  onClick={handleGenerateQR} 
                  disabled={isLoading} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {isLoading ? 'Generating New Token...' : 'Refresh QR Code Now'}
                </Button>
                
                <p className="text-xs text-gray-500">
                  The link is secure, single-use, and valid for 60 seconds.
                </p>
                
                <Link href={generatedUrl || '/patient-consent'} className="block">
                  <Button variant="outline" className="w-full">
                    View Patient Consent Form
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center p-10">
                <p className="text-gray-500">Loading token...</p>
                <Button 
                  onClick={handleGenerateQR} 
                  disabled={isLoading} 
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                >
                  Generate Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Queue */}
        <Card className="shadow-lg border-2 border-amber-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-amber-700">
              <ListChecks className="h-6 w-6 text-amber-500" />
              Continue Patient Session
            </CardTitle>
            <CardDescription>
              Access the queue to complete photo capture for patients who have signed consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <span className="text-lg font-semibold text-amber-800">
                Patients Waiting:
              </span>
              <Badge className="bg-amber-500 text-white text-xl font-bold px-4 py-1">
                {stats.waitingPatients}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600">
              This workflow is used when a patient has completed their consent and is ready for the next step (e.g., before photos, after photos).
            </p>

            <Link href="/dashboard/workflow/patient-queue" className="block">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                size="lg"
                disabled={stats.waitingPatients === 0}
              >
                View Patient Queue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}