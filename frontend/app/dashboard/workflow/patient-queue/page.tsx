'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, FileText, User, ArrowRight, AlertTriangle, Loader2, Search, ArrowLeft, CheckCircle, Clock, PlusCircle, Smile } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
// Assuming the following types and utility are correct and available
import { api, ApiError, ApiResponse } from '@/components/lib/api';

interface WaitingPatient {
  id: string;
  first_name: string;
  last_name: string;
  procedure: string | null;
  before_photos_taken: boolean;
  after_photos_taken: boolean;
  workflow_completed: boolean;
}

type WorkflowStep = 'before_photos' | 'after_photos' | 'complete';

interface PatientSession {
  sessionId: string;
  patientId: string;
  patientName: string;
  procedure: string;
  currentStep: WorkflowStep;
  beforePhotos: any[];
  afterPhotos: any[];
  createdAt: string;
}

// --- Component ---

export default function PatientQueue() {
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Data Fetching Logic (Unchanged but included for completeness) ---

  useEffect(() => {
    const fetchWaitingPatients = async () => {
      // NOTE: This logic needs a way to fetch the Auth Token. Assuming it is handled in `api.ts`.
      const token = localStorage.getItem('token'); 
      if (!token) {
        setError("Authentication token missing. Please log in.");
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await api.get<ApiResponse<WaitingPatient[]>>('/photo-session/waiting-patients');
        const apiPatients = response.data || [];
        
        // Database now handles all state - no need for localStorage merging
        setWaitingPatients(apiPatients);
        
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError(err.responseBody?.message2 || err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWaitingPatients();
  }, []);

  // Create and store patient session for photo capture
  const createPatientSession = (patient: WaitingPatient): string => {
    const sessionId = `session_${patient.id}_${Date.now()}`;
    const session: PatientSession = {
      sessionId,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      procedure: patient.procedure || 'Unknown Procedure',
      currentStep: patient.before_photos_taken ? 'after_photos' : 'before_photos',
      beforePhotos: [],
      afterPhotos: [],
      createdAt: new Date().toISOString(),
    };
    
    // Store in localStorage for photo-capture page
    const sessions: PatientSession[] = JSON.parse(localStorage.getItem('patientSessions') || '[]');
    const existingIndex = sessions.findIndex(s => s.patientId === patient.id);
    
    if (existingIndex !== -1) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem('patientSessions', JSON.stringify(sessions));
    return sessionId;
  };

  // Determine the next step for a patient
  const getNextStep = (patient: WaitingPatient): { step: WorkflowStep; label: string; action: () => void } => {
    if (!patient.before_photos_taken) {
      return {
        step: 'before_photos',
        label: 'Start: Before Photos',
        action: () => {
          const sessionId = createPatientSession(patient);
          window.location.href = `/dashboard/workflow/photo-capture?sessionId=${sessionId}&step=before`;
        }
      };
    } else if (!patient.after_photos_taken) {
      return {
        step: 'after_photos',
        label: 'Continue: After Photos',
        action: () => {
          const sessionId = createPatientSession(patient);
          window.location.href = `/dashboard/workflow/photo-capture?sessionId=${sessionId}&step=after`;
        }
      };
    } else {
      return {
        step: 'complete',
        label: 'Finalize & Upload Session',
        action: () => {
          const sessionId = createPatientSession(patient);
          window.location.href = `/dashboard/workflow/complete?sessionId=${sessionId}`;
        }
      };
    }
  };

  // Get workflow progress percentage
  const getWorkflowProgress = (patient: WaitingPatient): number => {
    let progress = 0;
    if (patient.before_photos_taken) progress += 50;
    if (patient.after_photos_taken) progress += 50;
    return progress;
  };

  const filteredPatients = Array.isArray(waitingPatients) ? waitingPatients.filter(patient =>
    (patient.first_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    patient.last_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    (patient.procedure && patient.procedure.toLowerCase().includes(searchTerm.toLowerCase())))
  ) : [];
  
  // --- UI Rendering ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="ml-4 text-gray-700">Loading patient queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center p-4">
        <div className="bg-white rounded-xl p-10 shadow-lg border border-red-200">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Connection Error</h2>
          <p className="text-gray-600 max-w-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* IMPROVEMENT 1: Simplified, Sleek Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-4">

            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                 <Clock className="h-6 w-6 text-blue-600" />
                 Active Patient Queue
              </h1>
              <p className="text-sm text-gray-500">
                {filteredPatients.length} sessions awaiting photo capture or finalization.
              </p>
            </div>
          </div>
          

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar with clear styling */}
        <div className="mb-8 flex justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or procedure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          
          {/* Current Queue Status Indicator */}
          <Badge variant="secondary" className="bg-gray-200 text-gray-700 py-2 px-3 text-sm font-semibold hidden sm:flex">
             {filteredPatients.length} Waiting
          </Badge>
        </div>

        {filteredPatients.length === 0 ? (
          /* IMPROVEMENT 2: Enhanced Empty State */
          <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Queue Clear!</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              There are no active patient sessions awaiting photo capture or finalization. Ready to start a new session?
            </p>

          </div>
        ) : (
          /* IMPROVEMENT 3: Task-Focused Patient Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPatients.map(patient => {
              const nextStep = getNextStep(patient);
              const progress = getWorkflowProgress(patient);
              const isFinalStep = nextStep.step === 'complete';
              
              return (
                <Card 
                  key={patient.id} 
                  className={`relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${isFinalStep ? 'border-2 border-yellow-500/50' : 'border-2 border-transparent'}`}
                >
                  {/* Visual Indicator for Completion */}
                  <div className={`h-1 absolute top-0 left-0 transition-all duration-500 ${isFinalStep ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                  
                  <CardHeader className="pt-6 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <CardTitle className="text-xl font-bold text-gray-900">
                           {patient.first_name} {patient.last_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          {patient.procedure || 'No Procedure Assigned'}
                        </CardDescription>
                      </div>
                      
                      {/* Patient Icon */}
                      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-200">
                        <User className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-4">
                    {/* Progress Visual */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-gray-700">Session Progress</span>
                            <span className={`font-bold ${isFinalStep ? 'text-yellow-600' : 'text-blue-600'}`}>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${isFinalStep ? 'bg-yellow-500' : 'bg-blue-600'}`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                    </div>


                    {/* Status Checks */}
                    <div className="flex flex-col gap-2 pt-2 text-sm">
                      <div className="flex items-center justify-between text-gray-700">
                          <span className="flex items-center gap-2">
                              {patient.before_photos_taken ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                  <Smile className="h-4 w-4 text-red-500" />
                              )}
                              Before Photos
                          </span>
                          <span className={`font-medium ${patient.before_photos_taken ? 'text-green-600' : 'text-red-600'}`}>
                              {patient.before_photos_taken ? 'Complete' : 'Required'}
                          </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-700">
                          <span className="flex items-center gap-2">
                              {patient.after_photos_taken ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                  <Smile className="h-4 w-4 text-red-500" />
                              )}
                              After Photos
                          </span>
                          <span className={`font-medium ${patient.after_photos_taken ? 'text-green-600' : 'text-red-600'}`}>
                              {patient.after_photos_taken ? 'Complete' : 'Required'}
                          </span>
                      </div>
                    </div>


                    {/* Next Action Button (Primary Focus) */}
                    <div className="w-full pt-4">
                      <Button 
                        onClick={nextStep.action}
                        className={`w-full h-11 text-base font-semibold transition-all duration-200 ${isFinalStep ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} 
                        variant="default"
                      >
                        {nextStep.step === 'before_photos' && <Smile className="h-5 w-5 mr-2" />}
                        {nextStep.step === 'after_photos' && <Smile className="h-5 w-5 mr-2" />}
                        {nextStep.step === 'complete' && <ArrowRight className="h-5 w-5 mr-2" />}
                        {nextStep.label}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}