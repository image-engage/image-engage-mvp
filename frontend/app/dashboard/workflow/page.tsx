'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, Clock, ArrowRight, ListChecks, Smile } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/components/lib/api';
import { ApiResponse } from '../../../../backend/src/types';
import { v4 as uuidv4 } from 'uuid';

export default function WorkflowPage() {
  const [stats, setStats] = useState({
    totalConsents: 0,
    waitingPatients: 0,
    photosToday: 0,
    completedSessions: 0,
  });
  const [consentUrl, setConsentUrl] = useState('');
  const [isGeneratingConsent, setIsGeneratingConsent] = useState(false);

  const handleGenerateConsentForm = async () => {
    setIsGeneratingConsent(true);

    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/sessions/generate-qr-token', { 
        expiresIn: 60
      }, token || undefined) as { success: boolean; data?: { sessionToken: string } };
      
      if (response.success && response.data?.sessionToken) {
        const baseUrl = window.location.origin;
        const consentFormUrl = `${baseUrl}/patient-consent?session=${response.data.sessionToken}`;
        setConsentUrl(consentFormUrl);
        window.open(consentFormUrl, '_blank');
      } else {
        throw new Error('Failed to generate secure token');
      }
    } catch (error) {
      console.error('Error generating consent form:', error);
      const fallbackToken = uuidv4();
      const baseUrl = window.location.origin;
      const fallbackUrl = `${baseUrl}/patient-consent?session=${fallbackToken}`;
      setConsentUrl(fallbackUrl);
      window.open(fallbackUrl, '_blank');
    } finally {
      setIsGeneratingConsent(false);
    }
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Start New Session */}
        <Card className="shadow-lg border-2 border-indigo-100 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-indigo-700">
              <FileText className="h-6 w-6 text-indigo-500" />
              Start New Patient Session
            </CardTitle>
            <CardDescription>
              Begin the workflow for a new patient by generating a consent form.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="flex-grow space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  This is the first step for any new patient. Once the consent form is signed, the patient will be added to the queue for photo capture.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleGenerateConsentForm}
              disabled={isGeneratingConsent}
              size="lg" 
              className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600"
            >
              {isGeneratingConsent ? 'Generating...' : 'Generate Consent Form'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Patient Queue */}
        <Card className="shadow-lg border-2 border-amber-100 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-amber-700">
              <ListChecks className="h-6 w-6 text-amber-500" />
              Continue Patient Session
            </CardTitle>
            <CardDescription>
              Complete photo capture for patients who have already signed consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="flex-grow space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <span className="text-lg font-semibold text-amber-800">Patients Waiting:</span>
                <Badge className="bg-amber-500 text-white text-xl font-bold px-4 py-1">
                  {stats.waitingPatients}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Select a patient from the queue to proceed with their "Before" or "After" photo session.
              </p>
            </div>
            <Link
              href={stats.waitingPatients === 0 ? '#' : "/dashboard/workflow/patient-queue"}
              className={buttonVariants({
                size: 'lg',
                className: `w-full mt-6 bg-amber-600 hover:bg-amber-700 ${stats.waitingPatients === 0 ? 'opacity-50 cursor-not-allowed' : ''}`
              })}
              onClick={(e) => stats.waitingPatients === 0 && e.preventDefault()}
            >
              View Patient Queue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}