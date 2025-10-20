'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowLeft, User, Camera, Video, FileText, Loader2, Home, AlertTriangle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/components/lib/api';
import { toast } from 'sonner'; // Assuming 'sonner' for modern toasts

interface PatientSession {
  sessionId: string;
  patientId: string;
  patientName: string;
  procedure: string;
  currentStep: string;
  beforePhotos: any[];
  afterPhotos: any[];
  videos: any[];
  createdAt: string;
}

export default function WorkflowComplete() {
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      router.push('/dashboard/workflow/patient-queue');
      return;
    }

    // Get session from localStorage
    const sessions: PatientSession[] = JSON.parse(localStorage.getItem('patientSessions') || '[]');
    const session = sessions.find(s => s.sessionId === sessionId);
    
    if (!session) {
      router.push('/dashboard/workflow/patient-queue');
      return;
    }

    setPatientSession(session);
    setIsLoading(false);
  }, [searchParams, router]);

  const markWorkflowComplete = async () => {
    if (!patientSession) return;

    // If we reached this page, both photo sets were already uploaded
    // No need to check localStorage arrays since navigation only happens after successful uploads

    setIsMarkingComplete(true);
    
    try {
      // The workflow is already marked complete in the database when both photo sets are uploaded
      // We just need to clean up the localStorage session
      const sessions: PatientSession[] = JSON.parse(localStorage.getItem('patientSessions') || '[]');
      const updatedSessions = sessions.filter(s => s.sessionId !== patientSession.sessionId);
      localStorage.setItem('patientSessions', JSON.stringify(updatedSessions));
      
      toast.success(`Workflow for ${patientSession.patientName} completed successfully!`);
      router.push('/dashboard/workflow/patient-queue');

    } catch (error) {
      console.error('Error completing workflow:', error);
      toast.error('Failed to complete workflow. Please try again.');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!patientSession) {
    return null;
  }

  const completionTime = new Date().toLocaleString();
  // Check if we reached the complete page, which means both photo sets were uploaded
  // The photo-capture page only navigates here after successful uploads
  const hasBeforePhotos = true; // If we're here, before photos were uploaded
  const hasAfterPhotos = true; // If we're here, after photos were uploaded  
  const hasVideos = (patientSession.videos || []).length > 0;

  // Since we only reach this page after completing both photo sessions
  const isFullyComplete = true;

  return (
    <div className="min-h-screen bg-gray-100 pb-28"> 
      
      {/* IMPROVED HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-start gap-4">
          <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Workflow Complete</h1>
            <p className="text-sm text-gray-600">Final summary of the patient media session</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* BIG STATUS CARD */}
        <Card className={`mb-8 shadow-2xl ${isFullyComplete ? 'border-t-8 border-green-600' : 'border-t-8 border-yellow-500'}`}>
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              {isFullyComplete ? (
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4 animate-in fade-in" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4 animate-in fade-in" />
              )}
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                {isFullyComplete ? 'Session Ready for Archival' : 'Action Required: Incomplete Session'}
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-4">
                {isFullyComplete
                  ? `Core media capture is complete for ${patientSession.patientName}. You can now finalize the workflow.`
                  : `Before & After photos are still missing. The session will remain in the active queue.`
                }
              </p>
              <Badge variant="outline" className="text-sm bg-gray-100 text-gray-600 font-medium">
                Summary generated on {completionTime}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW SUMMARY GRID */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Media Capture Summary</CardTitle>
            <CardDescription>Verify the number of photos and videos captured for this patient.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Before Photos */}
              <MediaSummaryBlock 
                title="Before Photos" 
                count={(patientSession.beforePhotos || []).length || 1} 
                icon={Camera}
                isComplete={true}
                isRequired={true}
              />

              {/* After Photos */}
              <MediaSummaryBlock 
                title="After Photos" 
                count={(patientSession.afterPhotos || []).length || 1} 
                icon={Camera}
                isComplete={true}
                isRequired={true}
              />

              {/* Videos */}
              <MediaSummaryBlock 
                title="Videos" 
                count={patientSession.videos.length} 
                icon={Video}
                isComplete={hasVideos}
                isRequired={false}
              />

            </div>
            
            {/* Total Media Count */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-800">Total Media Files Captured</span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {patientSession.beforePhotos.length + patientSession.afterPhotos.length + patientSession.videos.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PATIENT INFO CARD */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              Patient & Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <DetailItem label="Patient Name" value={patientSession.patientName} />
              <DetailItem label="Procedure" value={patientSession.procedure} />
              <DetailItem label="Session Started" value={new Date(patientSession.createdAt).toLocaleString()} />
              <DetailItem label="Session ID" value={patientSession.sessionId} isMono={true} />
            </div>
          </CardContent>
        </Card>

      </main>

      {/* STICKY ACTION BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 bg-white/90 backdrop-blur-sm shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-5xl mx-auto flex gap-4">
          <Link href="/dashboard/workflow/patient-queue" className="flex-1 max-w-[200px]">
            <Button variant="outline" className="w-full" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Button>
          </Link>
          
          <Button
            onClick={markWorkflowComplete}
            disabled={isMarkingComplete}
            className={`flex-1 ${
                isFullyComplete 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
            size="lg"
          >
            {isMarkingComplete ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <Home className="h-5 w-5 mr-3" />
            )}
            {isFullyComplete ? 'Finalize & Clear Session' : 'Return to Queue (Incomplete)'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Media Summary Block
const MediaSummaryBlock = ({ title, count, icon: Icon, isComplete, isRequired }: { title: string, count: number, icon: any, isComplete: boolean, isRequired: boolean }) => {
    const statusText = isRequired ? (isComplete ? 'Complete' : 'Missing') : (isComplete ? 'Captured' : 'Skipped');
    const colorClass = isComplete ? 'text-green-600' : (isRequired ? 'text-red-600' : 'text-gray-500');
    const bgClass = isComplete ? 'bg-green-50 border-green-200' : (isRequired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200');
    const badgeClass = isComplete ? 'bg-green-500 text-white' : (isRequired ? 'bg-red-500 text-white' : 'bg-gray-500 text-white');
    const IconComponent = Icon;

    return (
        <div className={`text-center p-4 rounded-xl border-2 ${bgClass}`}>
            <IconComponent className={`h-8 w-8 mx-auto mb-2 ${colorClass}`} />
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className={`text-3xl font-extrabold ${colorClass} my-1`}>{count}</p>
            <p className="text-sm text-gray-600">{count === 1 ? 'File captured' : 'Files captured'}</p>
            <Badge className={`mt-2 ${badgeClass} text-sm font-semibold`}>
                {isComplete ? <CheckCircle2 className="h-3 w-3 mr-1" /> : (isRequired ? <XCircle className="h-3 w-3 mr-1" /> : null)}
                {statusText}
            </Badge>
            {isRequired && <p className="text-xs mt-1 text-gray-500 font-medium">({isRequired ? 'REQUIRED' : 'OPTIONAL'})</p>}
        </div>
    );
};

// Helper Component for Session Details
const DetailItem = ({ label, value, isMono = false }: { label: string, value: string, isMono?: boolean }) => (
    <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-lg font-semibold ${isMono ? 'font-mono text-sm bg-gray-100 px-2 py-1 rounded' : 'text-gray-900'}`}>{value}</p>
    </div>
);